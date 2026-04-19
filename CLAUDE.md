# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Comandos esenciales

### Node.js (servicios principales)

```bash
# Servidor offline (puerto 3200) — desde la raíz
npm start
# Equivale a: AWS_PROFILE=pa-dev serverless offline

# Instalar dependencias
npm install

# Deploy de un servicio
cd services/api-<servicio>
AWS_PROFILE=pa-<stage> serverless deploy --stage <stage> --region us-west-2

# Invocar función localmente
serverless invoke local --function <nombre-funcion>

# Ver logs
serverless logs --function <nombre-funcion> --stage <stage>
```

### Go (`services/api-configuration`, `services/api-notification`)

```bash
cd services/api-configuration   # o api-notification
make build          # Compilar para Lambda ARM64
make run-local      # Servidor local en puerto 3001
make test           # Tests unitarios
make test-coverage  # Tests con cobertura
make fmt            # Formatear código
make lint           # Linting
make deploy         # Deploy a AWS
```

### Deploy completo

```bash
./scripts/deploy-all.sh [stage]
```

**Orden obligatorio:** `infrastructure/` → `job-authorizer/` → `api-configuration/` → resto de servicios.

---

## Arquitectura

Monorepo **Serverless Framework v4** con 15 servicios: 13 en Node.js 20.x y 2 en Go 1.24. Todos en AWS Lambda ARM64, región us-west-2, perfil AWS `pa-{stage}`.

```text
Angular Admin (portal_admin_ng)
  → API Gateway HTTP v2 (compartido — infrastructure/)
      → Lambda Authorizer JWT (job-authorizer/)
      → Lambda Handlers (services/api-*)
          → DynamoDB (single-table, pk/sk)
          → S3 (contratos, comprobantes, firmas)
          → Transbank Webpay Plus
          → SMTP via Nodemailer
          → Google Calendar / Meet API
          → Chatwoot + Meta (WhatsApp/Messenger/Instagram)

  → API Gateway WebSocket v2 (api-whatsapp-agent)
      → Lambda ws-connect / ws-disconnect
      → Broadcast a conexiones activas
```

### Convención de nombres de recursos AWS

```text
<recurso>-<stage>-pri-<shortRegion>
Ejemplo: programs-dev-pri-usw2
```

Abreviaciones: `usw2` = us-west-2, `use1` = us-east-1, `sae1` = sa-east-1.

### Servicios

| Servicio | SLS name | Runtime | Descripción |
| --- | --- | --- | --- |
| `api-program` | `programas` | Node.js | Gestión de programas de viaje |
| `api-payment` | `pagos` | Node.js | Pagos Transbank Webpay Plus |
| `api-entity` | `usuarios` | Node.js | Usuarios, sesiones y permisos |
| `api-contract` | `contratos` | Node.js | Generación de contratos PDF |
| `api-balance` | `balances` | Node.js | Balances y cuotas |
| `api-extraction` | `extracciones` | Node.js | Descarga de archivos desde S3 |
| `api-maintainer` | `mantenedor` | Node.js | Datos maestros (bancos) |
| `api-meet` | `reuniones` | Node.js | Reuniones Google Calendar / Meet |
| `api-whatsapp-agent` | `inbox` | Node.js | Agente IA WhatsApp + WebSocket inbox |
| `api-favorites` | `favoritos` | Node.js | Favoritos del usuario |
| `job-authorizer` | `autorizador` | Node.js | Authorizer JWT centralizado |
| `job-trigger` | — | Node.js | Función desencadenadora |
| `api-configuration` | `configuracion` | Go | Configuración global |
| `api-notification` | `notificaciones` | Go | Envío de emails |

---

## Estructura estándar de un servicio Node.js

```text
services/api-<resource>/
├── functions/<action>-v1.js     # Handler: exports.main
├── validators/validate-<resource>-payload.js
├── mappers/map-<resource>-item.js
├── serverless.yml
└── README.md
```

### Patrón de handler (con Middy middleware)

**Todos los handlers usan `standardMiddleware()`** — no usan `try/catch` manual ni `parseEventBody()` directamente; el middleware los gestiona.

```javascript
import { uuidv7 } from 'uuidv7';
import * as dynamoDbLib from '../../../libs/dynamodb-v3.js';
import { standardMiddleware } from '../../../libs/middleware/index.js';
import { success } from '../../../helpers/responses.js';

const { DYNAMODB_TABLE, TABLE_PK } = process.env;
const ACTION = 'Create resource';

/**
 * @description Crea un nuevo recurso en DynamoDB.
 */
const handler = async (event) => {
  const { data } = event.body; // Ya parseado por el middleware

  if (!data) {
    const error = new Error('Data is required');
    error.statusCode = 400;
    throw error; // Capturado por errorHandlerMiddleware
  }

  const id = uuidv7();
  const result = await dynamoDbLib.put({
    TableName: DYNAMODB_TABLE,
    Item: { pk: TABLE_PK, sk: `RES#${id}`, id, data, createdAt: new Date().toISOString() },
  });

  return success(201, result, ACTION);
};

export const main = standardMiddleware(handler);
```

`standardMiddleware()` aplica en orden: CORS → JSON parser → correlation ID → logger → **error handler** (captura errores con `error.statusCode` y llama `unsuccessful()`).

---

## Librerías compartidas clave

| Path | Propósito |
| --- | --- |
| `libs/dynamodb-v3.js` | CRUD DynamoDB (`query`, `getOne`, `put`, `update`, `remove`, `scan`, `iterativeQuery`) |
| `libs/s3-v3.js` | Operaciones S3 |
| `libs/secret-manager.js` | AWS Secrets Manager |
| `libs/parameter-store.js` | SSM Parameter Store con fallback a `.env` local |
| `libs/middleware/index.js` | `standardMiddleware()` — stack Middy completo |
| `libs/cache/cached-dynamodb.js` | Cache en memoria con respaldo DynamoDB |
| `libs/document-builders/` | Constructores PDF: CTT, DBA, DBR, CPR |
| `libs/axios.js` | Cliente HTTP preconfigurado |
| `libs/nodemailer.js` | SMTP con HTML y adjuntos |
| `libs/qr-generator.js` | Generación de códigos QR |
| `helpers/responses.js` | `success(status, data, action)` / `unsuccessful(status, error, action)` |
| `helpers/event-parser.js` | `parseEventBody(event)` (uso directo cuando no se usa middleware) |
| `helpers/get-global-config.js` | Config global desde DynamoDB |
| `helpers/google-calendar-auth.js` | OAuth2 Google Calendar/Meet con token caching |
| `common/custom.yml` | Variables Serverless compartidas |
| `aws/policies/` | Políticas IAM granulares reutilizables |

### Generación de PDFs

```javascript
import { generateDocument } from '../../libs/document-generator.js';

const result = await generateDocument({
  scope: 'CTT',         // CTT | DBA | DBR
  form: documentData,
  action: { isPreview: false, hasSigned: true, hasHeaderFooter: false },
  bucket: process.env.BUCKET_INFO_GI
});
// result.success → boolean, result.base64 → PDF en base64
```

> Lambdas con PDF requieren `memorySize: 1024` y `timeout: 29`.

---

## WebSockets (`api-whatsapp-agent`)

El servicio `api-whatsapp-agent` expone un API Gateway WebSocket para el inbox en tiempo real.

```yaml
# serverless.yml
provider:
  websocketsApiName: inbox-ws-${stage}-pri-${shortRegion}
```

**Patrón de conexiones en DynamoDB (`conversations-{stage}-pri-{region}`):**

- Conexión activa: `pk: 'WS#<chatwootId>', sk: 'WSCONN#<connectionId>'`
- Índice inverso: `pk: 'WSCONN#<connectionId>'` → permite lookup al desconectar
- TTL: 24 h (`ttl: Math.floor(Date.now() / 1000) + 86400`)

Broadcast desde otros servicios usando `ws-broadcast.js` en `tools/`.

---

## Agente IA WhatsApp (`api-whatsapp-agent`)

Servicio más complejo del repositorio. Orquesta Gemini AI con herramientas (tools) para atender clientes vía WhatsApp.

**Carpetas especiales:**

- `tools/gemini-agent.js` — Orquestador Gemini con system prompt y tools
- `tools/chatwoot-api.js` — Wrapper Chatwoot (crear/actualizar conversaciones)
- `tools/whatsapp-api.js` — Wrapper WhatsApp Cloud API (enviar mensajes, media)
- `tools/aws-transcribe.js` — Transcripción de audio
- `tools/ws-broadcast.js` — Broadcast WebSocket a conexiones activas
- `validators/validate-webhook-payload.js` — Verificación HMAC-SHA256 de Meta

**Flujo de mensaje entrante:**

1. `verificacion-webhook-v1.js` — handshake con Meta
2. `procesar-mensaje-v1.js` — recibe webhook, invoca Lambda de agente async
3. `ejecutar-agente-v1.js` — orquesta Gemini + tools (`timeout: 60s`)

**Canales soportados:** WhatsApp, Meta Messenger, Instagram DM (toggle: `ENABLE_META_CHANNELS`).

---

## Integraciones externas

| Integración | Servicio | Secreto SSM |
| --- | --- | --- |
| Google Calendar (coordinador) | `api-meet` | `/pa/{stage}/google-calendar-oauth` |
| Google Meet (host dedicado) | `api-meet` | `/pa/{stage}/google-meet-host-oauth` |
| Chatwoot | `api-whatsapp-agent` | `/pa/{stage}/chatwoot-api-token` |
| Google Gemini AI | `api-whatsapp-agent` | `/pa/{stage}/gemini-api-key` |
| WhatsApp Cloud API | `api-whatsapp-agent` | `/pa/{stage}/whatsapp-secret` |
| Meta (FB/Instagram) | `api-whatsapp-agent` | `/pa/{stage}/meta-page-secret` |
| Transbank Webpay Plus | `api-payment` | Secrets Manager |

---

## Arquitectura Go (`api-configuration`, `api-notification`)

Stack: Echo v4, aws-sdk-go-v2, zap, go-playground/validator/v10.

```text
cmd/<handler>/main.go          # Entry point Lambda
internal/api/<feature>/
  router.go / handler.go / service.go / repository/
shared/apperr/ database/ logger/
```

**Reglas Go:** funciones puras (sin OOP), logging con `zap`, error wrapping con `%w`, validación con `validator` tags en structs.

---

## Reglas no negociables

### Node.js

- JSDoc obligatorio en español con `@description`
- Respuestas siempre con `success()` / `unsuccessful()`
- Handlers siempre envueltos en `standardMiddleware()` — no exponer `async (event) =>` directo
- DynamoDB: `PAY_PER_REQUEST` + `DeletionPolicy: Retain`
- Errores con propiedad `statusCode` para que el error handler genere la respuesta HTTP correcta
- **Free Tier**: advertir explícitamente si una solución requiere salir de la capa gratuita

### Ambos

- Secretos en AWS Secrets Manager (`libs/secret-manager.js`) — nunca hardcodeados
- Variables de configuración no sensible en SSM Parameter Store (`libs/parameter-store.js`)
- AWS X-Ray habilitado en todos los servicios
- Código en inglés, JSDoc/comentarios en español

---

## DynamoDB — modelo de datos

| Campo | Descripción |
| --- | --- |
| `pk` | Partition Key — tipo de entidad |
| `sk` | Sort Key — elemento específico (e.g. `RES#<uuid>`) |
| `createdAt` | ISO timestamp |
| `updatedAt` | ISO timestamp de última actualización |

### Tablas disponibles

| Tabla | GSIs |
| --- | --- |
| `programs-{stage}-pri-{region}` | gsiOne-index, gsiStartDate-index |
| `users-{stage}-pri-{region}` | gsiOne-index, resetToken-index, email-index |
| `payments-{stage}-pri-{region}` | sk-index, gsiOne-index, gsiTwo-index, gsiThree-index |
| `conversations-{stage}-pri-{region}` | WebSocket connections + inbox |
| `config-{stage}-pri-{region}` | — |
| `maintainer-{stage}-pri-{region}` | — |

---

## S3 — convención de paths

| Tipo | Path |
| --- | --- |
| Contratos | `contracts/{programId}/{version}.pdf` |
| Comprobantes | `comprobantes/{paymentId}.pdf` |
| Firmas | `signatures/{dni}.png` |
| Assets | `assets/{filename}` |
| Exports | `exports/{type}/{timestamp}.{ext}` |

Bucket principal: `giras-indomito-{stage}-info`

---

## Infraestructura (bootstrap)

```bash
# ANTES del primer deploy, crear recursos AWS:
./scripts/bootstrap.sh [stage] [region]

# Eliminar toda la infraestructura:
./scripts/teardown.sh [stage] [region]
```

Ver [INFRASTRUCTURE-REPORT.md](INFRASTRUCTURE-REPORT.md) para detalle completo de recursos AWS.
