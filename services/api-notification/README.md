# api-notification — Envío de Notificaciones

Servicio de envío de notificaciones por email para el portal administrativo de Giras Indómito. Utiliza **Nodemailer** con credenciales almacenadas en AWS Secrets Manager. Acepta archivos adjuntos como `multipart/form-data`.

**Nombre SLS:** `notificaciones` · **Runtime:** Node.js 20.x (ARM64) · **Framework:** Serverless v4

---

## Endpoints

| Método | Ruta | Handler | Descripción |
|---|---|---|---|
| `POST` | `/v1/notificaciones/contrato` | `send-notification-v1` | Enviar contrato PDF por email |

---

## Funciones Lambda

### `send-notification-v1`
Envía un contrato PDF por email al destinatario indicado. El archivo se envía como **`multipart/form-data`** desde el frontend Angular.

**Content-Type:** `multipart/form-data`

**Campos del formulario:**

| Campo | Tipo | Descripción |
|---|---|---|
| `file` | `File` (PDF) | Archivo PDF del contrato (convertido desde base64) |
| `name` | `string` | Nombre del destinatario |
| `email` | `string` | Email de destino |
| `phone` | `string` | Teléfono de contacto |
| `preview` | `boolean` | `true` si es vista previa (marca de agua BORRADOR) |

> El middleware `@middy/http-multipart-body-parser` parsea el `multipart/form-data`.

**Respuesta:**
```json
{
  "state": true,
  "metadata": { "statusCode": 200, "action": "Enviar notificación." },
  "data": {
    "messageId": "smtp-message-id",
    "recipient": "destinatario@example.com"
  }
}
```

> `memorySize: 512` · `timeout: 29s` · `architecture: arm64`

---

## Integración con el frontend

El servicio `ContractService` del portal Angular invoca este endpoint:

```typescript
// Angular — ContractService
sendEmailWithDocument(formData: FormData): Observable<any> {
  return this.http.post(`${baseApi}/v1/notificaciones/contrato`, formData);
}

// Construcción del FormData
const formData = new FormData();
formData.append('file', pdfFile, 'contrato.pdf');  // PDF convertido desde base64
formData.append('name', contactName);
formData.append('email', contactEmail);
formData.append('phone', contactPhone);
formData.append('preview', isPreview.toString());
```

---

## Cómo se construye el email

1. Se recibe el PDF como archivo binario en el FormData
2. Se adjunta el PDF al email como archivo `contrato.pdf`
3. El cuerpo del email incluye los datos de contacto del destinatario
4. Si `preview === true`, el asunto incluye indicación de "BORRADOR"

---

## Integración con otros servicios

Este servicio es invocado directamente por el **frontend Angular** (no por otros servicios Lambda). También puede ser invocado de forma interna desde:
- `api-program` → al aprobar un programa (usa Nodemailer directamente desde el handler)

---

## Variables de entorno

| Variable | Descripción |
|---|---|
| `DYNAMODB_PROGRAM_TABLE` | Tabla DynamoDB de programas |
| `PROGRAM_TABLE` | PK constante de la tabla de programas |
| `BUCKET_INFO_GI` | Bucket S3 (adjuntos) |
| `EMAIL_CONFIG_SECRET_KEY` | Nombre del secreto con credenciales SMTP |
| `SECRET_KEY` | Nombre del secreto JWT |
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
- `lambda-policy-secretsmanager.yml` — Secrets Manager (credenciales SMTP)

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
