# api-notification — Envío de Notificaciones

Servicio de envío de notificaciones por email para el portal administrativo de Giras Indómito. Utiliza **Nodemailer** con credenciales almacenadas en AWS Secrets Manager.

**Nombre SLS:** `notificaciones` · **Runtime:** Node.js 20.x (ARM64) · **Framework:** Serverless v4

---

## Endpoints

| Método | Ruta | Handler | Descripción |
|---|---|---|---|
| `POST` | `/v1/notificaciones/contrato` | `send-notification-v1` | Enviar notificación de contrato por email |

---

## Funciones Lambda

### `send-notification-v1`
Envía una notificación por email relacionada con contratos de programas. Recupera los datos del programa desde DynamoDB, genera el contenido del email y lo envía mediante Nodemailer.

**Body:**
```json
{
  "programId": "uuid-v7",
  "recipients": ["destinatario@example.com"],
  "type": "CONTRACT_APPROVED | CONTRACT_CONFIRMED | CONTRACT_REJECTED"
}
```

**Respuesta:**
```json
{
  "state": true,
  "metadata": { "statusCode": 200, "action": "Enviar notificación." },
  "data": {
    "messageId": "smtp-message-id",
    "recipients": ["destinatario@example.com"]
  }
}
```

> `memorySize: 512` · `timeout: 29s` · `architecture: arm64`

---

## Tipos de notificaciones

| Tipo | Descripción |
|---|---|
| `CONTRACT_APPROVED` | Contrato aprobado — incluye PDF adjunto |
| `CONTRACT_CONFIRMED` | Contrato confirmado |
| `CONTRACT_REJECTED` | Contrato rechazado |

---

## Integración con otros servicios

Este servicio es invocado desde:
- `api-program` → al aprobar un programa (`approve-program-v1`)
- `api-payment` → al confirmar un pago de cuota (`confirm-installment-payment-v1`)

También puede ser invocado directamente desde el frontend o desde otros servicios Lambda mediante invocación directa.

---

## Modelo de datos (DynamoDB)

Este servicio **solo lee** datos de la tabla de programas para construir el contenido del email:

**Tabla:** `programs-<stage>-pri-<shortRegion>`

```javascript
{
  pk: "PRG#8e3d823d-9f58-45df-8a8f-6779435a0001",
  sk: "PRG#<uuid-v7>",
  name: "Gira a Argentina 2025",
  // ...datos del programa para el email...
}
```

---

## Variables de entorno

| Variable | Descripción |
|---|---|
| `DYNAMODB_PROGRAM_TABLE` | Tabla DynamoDB de programas |
| `PROGRAM_TABLE` | PK constante de la tabla de programas |
| `BUCKET_INFO_GI` | Bucket S3 para adjuntos (PDFs) |
| `EMAIL_CONFIG_SECRET_KEY` | Clave del secreto con credenciales de email |
| `SECRET_KEY` | Clave del secreto JWT |
| `STAGE` | Entorno de ejecución |
| `NODE_OPTIONS` | `--enable-source-maps` |

### Estructura del secreto de email

```json
{
  "host": "smtp.gmail.com",
  "port": 587,
  "secure": false,
  "user": "notificaciones@girasindomito.cl",
  "password": "app-password"
}
```

---

## IAM Policies utilizadas

- `lambda-policy-xray.yml` — AWS X-Ray
- `lambda-policy-ssm.yml` — Parameter Store
- `lambda-policy-dynamodb-program.yml` — DynamoDB (tabla programas)
- `lambda-policy-s3.yml` — S3 (lectura de PDFs para adjuntos)
- `lambda-policy-secretsmanager.yml` — Secrets Manager (credenciales email)

---

## Desarrollo local

```bash
# Desde raíz del proyecto
npm start

# Deploy del servicio
cd services/api-notification
AWS_PROFILE=pa-dev serverless deploy --stage dev --region us-west-2

# Ver logs
serverless logs --function send_notification_contract_v1 --stage dev
```

---

**Última actualización:** 2026-02-23
