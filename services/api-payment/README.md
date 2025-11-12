# API Payment - Transbank Webpay Plus

Servicio de pagos integrado con Transbank Webpay Plus para el portal administrativo de Giras Indómito.

## Características

- ✅ Creación de transacciones de pago
- ✅ Confirmación de transacciones
- ✅ Consulta de estado de transacciones
- ✅ Listado de transacciones con filtros
- ✅ Almacenamiento en DynamoDB
- ✅ Soporte para ambiente de integración y producción

## Endpoints

### 1. Crear Transacción
**POST** `/v1/pagos/transacciones/crear`

Crea una nueva transacción de pago y retorna el token y URL para redirección a Webpay.

**Body:**
```json
{
  "amount": 5000,
  "orderId": "ORDER-123" (opcional),
  "userId": "user-uuid" (opcional),
  "description": "Pago de gira" (opcional)
}
```

**Response:**
```json
{
  "state": true,
  "metadata": {
    "statusCode": 200,
    "action": "Crear transacción de pago."
  },
  "data": {
    "transactionId": "uuid-v7",
    "token": "token-webpay",
    "url": "https://webpay3gint.transbank.cl/...",
    "buyOrder": "ORDER-123",
    "amount": 5000
  }
}
```

### 2. Confirmar Transacción
**POST** `/v1/pagos/transacciones/confirmar`

Confirma una transacción después de que el usuario completa el pago en Webpay.

**Body:**
```json
{
  "token": "token-webpay-retornado"
}
```

**Response:**
```json
{
  "state": true,
  "metadata": {
    "statusCode": 200,
    "action": "Confirmar transacción de pago."
  },
  "data": {
    "transactionId": "uuid-v7",
    "buyOrder": "ORDER-123",
    "amount": 5000,
    "status": "AUTHORIZED",
    "vci": "TSY",
    "authorizationCode": "1213",
    "responseCode": 0,
    "paymentTypeCode": "VN",
    "accountingDate": "1122",
    "transactionDate": "2024-11-22T10:30:00Z",
    "cardDetail": {
      "cardNumber": "6623"
    },
    "installmentsNumber": 0
  }
}
```

### 3. Obtener Estado
**GET** `/v1/pagos/transacciones/{token}/estado`

Consulta el estado actual de una transacción.

**Response:** Similar a confirmar transacción.

### 4. Listar Transacciones
**GET** `/v1/pagos/transacciones`

Lista las transacciones con filtros opcionales.

**Query Parameters:**
- `userId`: Filtrar por usuario
- `status`: Filtrar por estado (PENDING, AUTHORIZED, FAILED)
- `buyOrder`: Filtrar por orden de compra
- `limit`: Límite de resultados (default: 20)
- `lastEvaluatedKey`: Para paginación

**Response:**
```json
{
  "state": true,
  "metadata": {
    "statusCode": 200,
    "action": "Listar transacciones de pago.",
    "count": 10,
    "scannedCount": 10
  },
  "data": {
    "Items": [...],
    "Count": 10,
    "ScannedCount": 10,
    "nextPageToken": "encoded-token"
  }
}
```

## Variables de Entorno

Configurar en AWS Systems Manager Parameter Store:

```bash
# Ambiente (integration o production)
/transbank/dev/environment

# Código de comercio (solo producción)
/transbank/dev/commerce-code

# URL del frontend para return
/transbank/dev/frontend-url
```

Configurar en AWS Secrets Manager:

```bash
# API Key de Transbank (solo producción)
transbank-api-key-dev-pri-usw2
```

## DynamoDB

**Tabla:** `payments-dev-pri-usw2`

**Estructura:**
```
pk: PAYMENT#{transactionId}
sk: METADATA
transactionId: uuid-v7
token: token-webpay
buyOrder: string
sessionId: string
amount: number
userId: string | null
description: string | null
status: PENDING | AUTHORIZED | FAILED
authorizationCode: string
responseCode: number
vci: string
paymentTypeCode: string
accountingDate: string
transactionDate: string
cardNumber: string (últimos 4 dígitos)
installmentsNumber: number
transbankUrl: string
returnUrl: string
environment: integration | production
createdAt: ISO timestamp
updatedAt: ISO timestamp
gsiOne: buyOrder (para búsqueda)
gsiTwo: userId (para búsqueda)
```

**Índices Globales (GSI):**
1. `token-index`: token (PK)
2. `gsiOne-index`: gsiOne (PK) - para buscar por buyOrder
3. `gsiTwo-index`: gsiTwo (PK) - para buscar por userId

## Deploy

```bash
# Instalar dependencias
npm install

# Deploy del servicio
cd services/api-payment
serverless deploy --stage dev --region us-west-2 --aws-profile pa-dev
```

## Testing Local

```bash
# Iniciar serverless offline
serverless offline --stage dev
```

## Flujo de Pago

1. Frontend llama a `POST /v1/pagos/transacciones/crear`
2. Backend crea transacción en Transbank y guarda en DB
3. Frontend recibe token y URL
4. Frontend hace POST del token a la URL de Transbank (formulario HTML)
5. Usuario completa el pago en Webpay
6. Transbank redirige a `returnUrl` con `token_ws` en query params
7. Frontend llama a `POST /v1/pagos/transacciones/confirmar` con el token
8. Backend confirma con Transbank y actualiza DB
9. Frontend muestra resultado al usuario

## Estados de Transacción

- `PENDING`: Transacción creada, esperando pago
- `AUTHORIZED`: Pago aprobado
- `FAILED`: Pago rechazado

## Códigos de Respuesta Transbank

- `0`: Transacción aprobada
- `-1`: Rechazo de transacción
- `-2`: Transacción debe reintentarse
- `-3`: Error en transacción
- `-4`: Rechazo de transacción
- `-5`: Rechazo por error de tasa
- `-6`: Excede cupo máximo mensual
- `-7`: Excede límite diario por transacción
- `-8`: Rubro no autorizado

## Notas Importantes

1. El monto mínimo es 50 CLP (requisito de Transbank)
2. Los tokens de transacción expiran después de 10 minutos
3. Una transacción solo puede confirmarse una vez
4. En ambiente de integración, usar tarjetas de prueba de Transbank
