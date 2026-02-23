# api-payment — Pagos con Transbank Webpay Plus

Servicio de pagos integrado con **Transbank Webpay Plus** para el portal administrativo de Giras Indómito. Gestiona el flujo completo de pagos de cuotas y transacciones legacy.

**Nombre SLS:** `pagos` · **Runtime:** Node.js 20.x · **Framework:** Serverless v4

---

## Endpoints

### Pagos de cuotas (nuevo)

| Método | Ruta | Handler | Descripción |
|---|---|---|---|
| `POST` | `/v1/pagos/cuotas/crear` | `create-installment-payment-v1` | Crear pago para una cuota |
| `POST` | `/v1/pagos/cuotas/confirmar` | `confirm-installment-payment-v1` | Confirmar pago de cuota tras autorización Transbank |
| `POST` | `/v1/pagos/cuotas/cancelar` | `cancel-installment-payment-v1` | Cancelar pago en estado PENDING |
| `GET` | `/v1/pagos/programa` | `get-payments-by-program-v1` | Obtener pagos de un programa |
| `GET` | `/v1/pagos/usuario` | `get-payments-by-user-v1` | Obtener pagos de un usuario |

### Transacciones legacy (compatibilidad)

| Método | Ruta | Handler | Descripción |
|---|---|---|---|
| `POST` | `/v1/pagos/transacciones/crear` | `create-transaction-v1` | Crear transacción Webpay (legacy) |
| `POST` | `/v1/pagos/transacciones/confirmar` | `commit-transaction-v1` | Confirmar transacción (legacy) |
| `GET` | `/v1/pagos/transacciones/{token}/estado` | `get-transaction-status-v1` | Estado de transacción (legacy) |
| `GET` | `/v1/pagos/transacciones` | `get-transactions-v1` | Listar transacciones (legacy) |

---

## Flujo de pago de cuotas

```
1. POST /v1/pagos/cuotas/crear
   → Crea transacción en Transbank
   → Guarda en DynamoDB con estado PENDING
   → Retorna { token, url } para redirección

2. Usuario completa pago en Webpay
   → Transbank redirige con token_ws

3. POST /v1/pagos/cuotas/confirmar
   → Confirma con Transbank
   → Actualiza estado en DynamoDB (AUTHORIZED | FAILED)
   → Genera comprobante PDF
   → Envía email de confirmación
```

---

## Flujo de pago legacy (Transbank directo)

```
1. POST /v1/pagos/transacciones/crear       → token + URL de Webpay
2. Usuario paga en Webpay
3. POST /v1/pagos/transacciones/confirmar   → confirmación con Transbank
4. GET  /v1/pagos/transacciones/{token}/estado → estado actual
```

---

## Payloads

### Crear pago de cuota

```json
POST /v1/pagos/cuotas/crear
{
  "programId": "uuid-v7",
  "installmentId": "uuid-v7",
  "amount": 150000,
  "userId": "uuid-v7",
  "description": "Cuota 1 - Gira Argentina 2025"
}
```

**Respuesta:**
```json
{
  "state": true,
  "metadata": { "statusCode": 200, "action": "Crear pago de cuota." },
  "data": {
    "transactionId": "uuid-v7",
    "token": "token-webpay",
    "url": "https://webpay3gint.transbank.cl/...",
    "buyOrder": "ORDER-123",
    "amount": 150000
  }
}
```

### Confirmar pago de cuota

```json
POST /v1/pagos/cuotas/confirmar
{
  "token": "token-webpay-retornado"
}
```

**Respuesta:**
```json
{
  "state": true,
  "metadata": { "statusCode": 200, "action": "Confirmar pago de cuota." },
  "data": {
    "transactionId": "uuid-v7",
    "status": "AUTHORIZED",
    "authorizationCode": "1213",
    "amount": 150000,
    "cardNumber": "6623"
  }
}
```

### Obtener pagos por programa

```
GET /v1/pagos/programa?programId=<uuid>
```

### Obtener pagos por usuario

```
GET /v1/pagos/usuario?userId=<uuid>
```

---

## Estados de pago

| Estado | Descripción |
|---|---|
| `PENDING` | Pago iniciado, esperando autorización |
| `AUTHORIZED` | Pago aprobado por Transbank |
| `FAILED` | Pago rechazado |

---

## Modelo de datos (DynamoDB)

**Tabla:** `payments-<stage>-pri-<shortRegion>`

```javascript
{
  pk: "PAYMENT#<transactionId>",
  sk: "METADATA",
  transactionId: "uuid-v7",
  token: "token-webpay",
  buyOrder: "ORDER-123",
  sessionId: "SESSION-123",
  amount: 150000,
  userId: "uuid-v7",
  programId: "uuid-v7",
  installmentId: "uuid-v7",
  description: "Cuota 1 - Gira Argentina 2025",
  status: "PENDING | AUTHORIZED | FAILED",
  authorizationCode: "1213",
  responseCode: 0,
  vci: "TSY",
  paymentTypeCode: "VN",
  accountingDate: "1122",
  transactionDate: "2025-01-20T14:00:00Z",
  cardNumber: "6623",        // Últimos 4 dígitos
  installmentsNumber: 0,
  transbankUrl: "https://...",
  returnUrl: "https://...",
  environment: "integration | production",
  createdAt: "2025-01-20T14:00:00Z",
  updatedAt: "2025-01-20T14:00:00Z",
  gsiOne: "ORDER-123",       // Para búsqueda por buyOrder
  gsiTwo: "uuid-v7"          // Para búsqueda por userId
}
```

**Índices GSI:**
- `token-index`: búsqueda por token
- `gsiOne-index`: búsqueda por buyOrder
- `gsiTwo-index`: búsqueda por userId

---

## Variables de entorno

| Variable | Descripción |
|---|---|
| `DYNAMODB_PAYMENT_TABLE` | Tabla DynamoDB de pagos |
| `TRANSBANK_KEYS` | Clave del secreto con credenciales Transbank |
| `TRANSBANK_ENVIRONMENT` | Ambiente Transbank (integration / production) |
| `TRANSBANK_COMMERCE_CODE` | Código de comercio Transbank |
| `TRANSBANK_API_KEY_SECRET` | API key secret Transbank |
| `BUCKET_INFO_GI` | Bucket S3 para comprobantes PDF |
| `EMAIL_CONFIG_SECRET_KEY` | Clave del secreto con credenciales de email |
| `SECRET_KEY` | Clave del secreto JWT |
| `STAGE` | Entorno de ejecución |

### AWS Secrets Manager

```
transbank-api-key-<stage>-pri-usw2   # Credenciales Transbank
email-config-<stage>-pri-usw2        # Credenciales email
```

### AWS SSM Parameter Store

```
/transbank/<stage>/environment        # integration | production
/transbank/<stage>/commerce-code      # Código de comercio (solo producción)
/transbank/<stage>/frontend-url       # URL del frontend para returnUrl
```

---

## IAM Policies utilizadas

- `lambda-policy-xray.yml` — AWS X-Ray
- `lambda-policy-ssm.yml` — Parameter Store
- `lambda-policy-secretsmanager.yml` — Secrets Manager
- `lambda-policy-cloudwatch.yml` — CloudWatch
- Política inline — DynamoDB tabla payments (CRUD + índices)
- Política inline — S3 put en `comprobantes/*`

---

## Códigos de respuesta Transbank

| Código | Significado |
|---|---|
| `0` | Transacción aprobada |
| `-1` | Rechazo de transacción |
| `-2` | Transacción debe reintentarse |
| `-3` | Error en transacción |
| `-4` | Rechazo de transacción |
| `-5` | Rechazo por error de tasa |
| `-6` | Excede cupo máximo mensual |
| `-7` | Excede límite diario por transacción |
| `-8` | Rubro no autorizado |

---

## Consideraciones importantes

- Monto mínimo: **50 CLP** (requisito Transbank)
- Los tokens de transacción **expiran en 10 minutos**
- Una transacción solo puede confirmarse **una vez**
- En ambiente `integration`, usar tarjetas de prueba de Transbank
- El comprobante PDF se genera y envía por email solo en confirmaciones exitosas

---

## Desarrollo local

```bash
# Desde raíz del proyecto
npm start

# Deploy del servicio
cd services/api-payment
AWS_PROFILE=pa-dev serverless deploy --stage dev --region us-west-2

# Ver logs
serverless logs --function confirm_installment_payment_v1 --stage dev
```

---

**Última actualización:** 2026-02-23
