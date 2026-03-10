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

### Go (`services/api-configuration`)

```bash
cd services/api-configuration
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

Monorepo **Serverless Framework v4** con 10 servicios: 9 en Node.js 22.x y 1 en Go 1.24. Todos en AWS Lambda ARM64, región us-west-2, perfil AWS `pa-{stage}`.

```
Angular Admin (portal_admin_ng)
  → API Gateway HTTP v2 (compartido — infrastructure/)
      → Lambda Authorizer JWT (job-authorizer/)
      → Lambda Handlers (services/api-*)
          → DynamoDB (single-table, pk/sk)
          → S3 (contratos, comprobantes, firmas)
          → Transbank Webpay Plus
          → SMTP via Nodemailer
```

### Convención de nombres de recursos AWS

```
<recurso>-<stage>-pri-<shortRegion>
Ejemplo: programs-dev-pri-usw2
```

Abreviaciones: `usw2` = us-west-2, `use1` = us-east-1, `sae1` = sa-east-1.

### Servicios

| Servicio | SLS name | Descripción |
|---|---|---|
| `api-program` | `programas` | Gestión de programas de viaje |
| `api-payment` | `pagos` | Pagos Transbank Webpay Plus |
| `api-entity` | `usuarios` | Usuarios, sesiones y permisos |
| `api-contract` | `contratos` | Generación de contratos PDF |
| `api-notification` | `notificaciones` | Envío de emails |
| `api-balance` | `balances` | Balances y cuotas |
| `api-extraction` | `extracciones` | Descarga de archivos desde S3 |
| `api-maintainer` | `mantenedor` | Datos maestros (bancos) |
| `job-authorizer` | `autorizador` | Authorizer JWT centralizado |
| `api-configuration` | `configuracion` | Configuración global (Go) |

---

## Estructura estándar de un servicio Node.js

```
services/api-<resource>/
├── functions/<action>-v1.js     # Handler: exports.main
├── validators/validate-<resource>-payload.js
├── mappers/map-<resource>-item.js
├── serverless.yml
└── README.md
```

**Flujo obligatorio en handlers:**
1. `parseEventBody(event)` → 2. Validar → 3. Mapear → 4. DynamoDB/S3/etc → 5. `success()` / `unsuccessful()`

### Patrón de handler

```javascript
import { uuidv7 } from 'uuidv7';
import * as dynamoDbLib from '../../../libs/dynamodb-v3.js';
import { parseEventBody } from '../../../helpers/event-parser.js';
import { success, unsuccessful } from '../../../helpers/responses.js';

const { DYNAMODB_TABLE, TABLE_PK } = process.env;
const ACTION = 'Create resource';

/**
 * @description Crea un nuevo recurso en DynamoDB.
 */
export const main = async (event) => {
  try {
    const { data } = parseEventBody(event);
    if (!data) throw Object.assign(new Error('Data is required'), { statusCode: 400 });

    const id = uuidv7();
    const result = await dynamoDbLib.put({
      TableName: DYNAMODB_TABLE,
      Item: { pk: TABLE_PK, sk: `RES#${id}`, id, data, createdAt: new Date().toISOString() },
    });

    return success(201, result, ACTION);
  } catch (error) {
    return unsuccessful(error.statusCode || 500, error, ACTION);
  }
};
```

---

## Librerías compartidas clave

| Path | Propósito |
|---|---|
| `libs/dynamodb-v3.js` | CRUD DynamoDB (`query`, `getOne`, `put`, `update`, `remove`, `scan`, `iterativeQuery`) |
| `libs/s3-v3.js` | Operaciones S3 |
| `libs/secret-manager.js` | AWS Secrets Manager |
| `libs/document-builders/` | Constructores PDF: CTT, DBA, DBR, CPR |
| `helpers/responses.js` | `success(status, data, action)` / `unsuccessful(status, error, action)` |
| `helpers/event-parser.js` | `parseEventBody(event)` |
| `helpers/get-global-config.js` | Config global desde DynamoDB |
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

## Arquitectura Go (`api-configuration`)

Stack: Echo v4, aws-sdk-go-v2, zap, go-playground/validator/v10.

```
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
- DynamoDB: `PAY_PER_REQUEST` + `DeletionPolicy: Retain`
- Errores con propiedad `statusCode` para HTTP correcto
- **Free Tier**: advertir explícitamente si una solución requiere salir de la capa gratuita

### Ambos
- Secretos en AWS Secrets Manager (`libs/secret-manager.js`) — nunca hardcodeados
- Variables de configuración no sensible en SSM Parameter Store
- AWS X-Ray habilitado en todos los servicios
- Código en inglés, JSDoc/comentarios en español

---

## DynamoDB — modelo de datos

| Campo | Descripción |
|---|---|
| `pk` | Partition Key — tipo de entidad |
| `sk` | Sort Key — elemento específico (e.g. `RES#<uuid>`) |
| `createdAt` | ISO timestamp |
| `updatedAt` | ISO timestamp de última actualización |

### Tablas disponibles

| Tabla | GSIs |
|---|---|
| `programs-{stage}-pri-{region}` | gsiOne-index, gsiStartDate-index |
| `users-{stage}-pri-{region}` | gsiOne-index, resetToken-index, email-index |
| `payments-{stage}-pri-{region}` | sk-index, gsiOne-index, gsiTwo-index, gsiThree-index |
| `config-{stage}-pri-{region}` | — |
| `maintainer-{stage}-pri-{region}` | — |

---

## S3 — convención de paths

| Tipo | Path |
|---|---|
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
