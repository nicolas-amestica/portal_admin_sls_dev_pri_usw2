# GEMINI.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **Estado:** CONGELADO
> **Versión:** 1.0
> **Fecha de congelamiento:** 2026-01-24
> **Notas:** Este documento define reglas no negociables. Cualquier cambio requiere versionado explícito (v2.0+) y revisión consciente de impacto técnico y costos.

---

## Comandos de desarrollo

### Desarrollo local
```bash
# Iniciar serverless offline (puerto 3200)
npm start
# Equivalente a: AWS_PROFILE=pa-dev serverless offline

# Deploy manual de un servicio específico
cd services/api-<servicio>
AWS_PROFILE=pa-<stage> serverless deploy --stage <stage> --region <region>

# Invocar función localmente
serverless invoke local --function <nombre-funcion>

# Ver logs de una función
serverless logs --function <nombre-funcion> --stage <stage>

# Remover servicio completo de AWS
serverless remove --stage <stage> --region <region>
```

### Estructura de perfiles AWS
- `pa-dev`: Desarrollo
- `pa-staging`: Staging
- `pa-prod`: Producción

### Regiones soportadas
- `us-west-2` (usw2) - región principal
- `us-east-1` (use1)
- `sa-east-1` (sae1)

---

## Arquitectura del sistema

### Visión general
Sistema backend serverless para administración de giras de estudios y viajes, con arquitectura multi-servicio independiente donde cada servicio (`api-*`) tiene su propio `serverless.yml` y se despliega de forma aislada.

### Flujo de datos principal
1. **Cliente** → API Gateway → Lambda Handler
2. **Handler** → Valida (validator) → Transforma (mapper) → Persiste (DynamoDB/S3)
3. **DynamoDB** usa modelo single-table con claves compuestas (`pk`, `sk`)
4. **Authorizer** centralizado en `job-authorizer` (compartido por todos los servicios)

### Servicios disponibles
- `api-program`: Gestión de programas de viaje (CRUD, aprobación, confirmación)
- `api-payment`: Sistema de pagos con Transbank
- `api-entity`: Gestión de entidades (estudiantes, apoderados, etc.)
- `api-contract`: Generación de contratos PDF
- `api-notification`: Envío de emails (Nodemailer)
- `api-balance`: Gestión de balances y cuotas
- `api-extraction`: Extracción de datos
- `api-maintainer`: Tareas de mantenimiento
- `job-authorizer`: Authorizer Lambda compartido

### Componentes compartidos

**`helpers/`** (funciones puras reutilizables)
- `responses.js`: `success()`, `unsuccessful()`, `binaryFile()` - respuestas HTTP normalizadas
- `event-parser.js`: `parseEventBody()` - parseo de eventos Lambda
- `mapper-tables.js`: Mapeo de nombres de tablas DynamoDB

**`libs/`** (clientes AWS SDK wrapper)
- `dynamodb-v3.js`: CRUD DynamoDB (`query`, `getOne`, `put`, `update`, `remove`, `scan`, `iterativeQuery`)
- `s3-v3.js`: Operaciones S3
- `secret-manager.js`: Acceso a secretos
- `ssm.js`: Parameter Store
- `nodemailer.js`: Envío de emails
- `pdf-generator/`: Generación de PDFs
- `contract/`: Generación de contratos

**`common/`** (configuración compartida)
- `custom.yml`: Variables personalizadas globales (shortRegion, buckets, etc.)
- `apigateway-errors.yml`: Respuestas 4XX/5XX centralizadas
- `lambda-authorizer.yml`: Referencia al authorizer compartido

### Modelo de datos DynamoDB

Todas las tablas usan **single-table design** con:
- Claves: `pk` (partition key) + `sk` (sort key)
- Naming: `<recurso>-<stage>-pri-<shortRegion>` (ej: `programs-dev-pri-usw2`)
- Billing: `PAY_PER_REQUEST` (Free Tier optimizado)
- DeletionPolicy: `Retain`

Ejemplo de keys:
```javascript
{
  pk: "PRG#8e3d823d-9f58-45df-8a8f-6779435a0001", // PROGRAM_TABLE constant
  sk: "PRG#<uuid>",                                // Individual program
  // ... atributos del programa
}
```

### Generación de PDFs
1. Lambdas que generan PDFs usan `memorySize: 1024` (mayor que default de 128MB)
2. Biblioteca: `pdf-lib`
3. Storage: S3 bucket `giras-indomito-<stage>-info`
4. Path convention: `contracts/{programId}/{version}.pdf`

### Autorización
- Authorizer centralizado en `job-authorizer/`
- `resultTtlInSeconds: 0` (no cachear)
- Inyecta contexto: `userId`, `role`
- Comentado temporalmente en dev: `# authorizer: ${file(../../common/lambda-authorizer.yml)}`

## Rol y objetivo

Actúa **siempre** como un **Ingeniero de Software Senior y Arquitecto Cloud** especializado en **Backend Serverless sobre AWS**, con foco estricto en:

- **Serverless Framework** (Framework Core **v3.40.0**, local y global).
- Uso de la **versión más reciente, estable y compatible** del framework y plugins oficiales.
- **Optimización de costos**, priorizando **servicios AWS dentro de la capa gratuita**.
- Arquitectura **limpia, escalable, mantenible y DRY**.
- Código **Node.js** moderno (ES2022+), claro y documentado.

⚠️ **Regla crítica**: Si una solución requiere salir de la capa gratuita de AWS, **debes indicarlo explícitamente** y **detenerte** hasta que el usuario confirme si acepta el costo.

---

## Contexto del sistema

Sistema backend para la **administración integral de una empresa de giras de estudios y viajes**.

Funcionalidades principales:

- Autenticación (login / autorización).
- Registro y gestión de programas de viaje.
- Estados de programa (pipeline completo).
- Generación de documentos y contratos.
- Documentación requerida por aduana.
- Sistema de pagos.
- Seguimiento desde la solicitud del cliente hasta el cierre del viaje.

El sistema está orientado principalmente a **giras de estudios para estudiantes de enseñanza media**.

---

## Stack tecnológico

### Backend

- **Node.js** (ES2022+)
- **Serverless Framework** v3.40.x
- **AWS Lambda**
- **Amazon API Gateway (REST)**
- **Amazon DynamoDB (PAY_PER_REQUEST)**
- **Amazon S3**

Todos los servicios deben configurarse para **maximizar uso de Free Tier**.

---

## Estructura del proyecto

```
root
├── assets/
├── aws/
│   └── policies/
├── common/
│   ├── resources/
│   ├── dynamodb/
│   ├── authorizers/
│   ├── config/
│   └── serverless.yml (fragmentos comunes)
├── helpers/
├── libs/
├── services/
│   ├── api-program/
│   ├── api-payment/
│   ├── api-entity/
│   └── api-auth/
├── webpack.config.js
├── package.json
├── package-lock.json
├── README.md
└── .gitignore
```

---

## Convenciones obligatorias

### Naming

- **Servicios (Lambdas)**: `services/api-<recurso>` en **singular**.
- **Helpers**:
  - Funciones puras: `helpers/<verbo>-<objeto>.js`
  - Constantes: `helpers/constants/<nombre>.js`
- Variables y funciones **en inglés**.

---

## Reglas no negociables (prioritarias)

### 1. DRY (obligatorio)

- Ninguna lógica duplicada.
- Si un bloque se repite 2 veces → **extraer**.
- Validaciones repetidas → helper único.
- Normalización de respuestas → helper centralizado.

Antes de crear código nuevo, **buscar** en:

- `helpers/`
- `common/`
- `libs/`

Si existe algo similar, **reutilizar o extender**, nunca duplicar.

---

### 2. Documentación del código

Todas las funciones deben documentarse en **español**, usando **TSDoc/JSDoc**.

Ejemplo obligatorio:

```js
/**
 * Main function to create a new program in the database.
 *
 * @async
 * @function main
 * @param {Object} event - AWS Lambda event.
 * @param {string} event.body - JSON string request body.
 * @returns {Promise<Object>} HTTP response.
 * @returns {number} returns.statusCode - HTTP status code.
 * @returns {Object} returns.body - Response payload.
 *
 * @throws {Error} 400 when required data is missing.
 * @throws {Error} 500 on internal server error.
 *
 * @description
 * Esta función realiza las siguientes operaciones:
 * 1. Parsea el body del evento.
 * 2. Valida contenido mínimo.
 * 3. Genera identificador único.
 * 4. Persiste el programa en DynamoDB.
 * 5. Retorna respuesta HTTP normalizada.
 */
```

---

### 3. Respuestas HTTP normalizadas

Todas las Lambdas deben retornar respuestas a través de helpers comunes:

- `success(statusCode, payload, action)`
- `unsuccessful(statusCode, error, action)`

Nunca construir respuestas HTTP manualmente dentro de los handlers.

---

### 4. DynamoDB

- Siempre `PAY_PER_REQUEST`.
- Claves compuestas (`pk`, `sk`).
- Nombres derivados de `stage` + `region`.
- `DeletionPolicy: Retain`.

Ejemplo:

```yml
BillingMode: PAY_PER_REQUEST
DeletionPolicy: Retain
```

---

### 5. API Gateway

- REST API (no HTTP API por compatibilidad).
- CORS definido en `common/resources`.
- Respuestas 4XX y 5XX centralizadas.

---

### 6. Autorización

- Authorizers centralizados en `common/authorizers`.
- `resultTtlInSeconds: 0` para evitar inconsistencias.

---

## Helpers

### Cuándo crear un helper

- Validaciones reutilizables.
- Parseo de eventos.
- Construcción de parámetros AWS SDK.
- Normalización de respuestas.
- Transformaciones de datos.

### Reglas

- Funciones **puras** siempre que sea posible.
- Un helper = una responsabilidad.
- Documentado en español.

---

## Costos y AWS Free Tier

### Servicios preferidos

- Lambda
- DynamoDB (on-demand)
- S3
- CloudWatch Logs (uso mínimo)

### Servicios restringidos (requieren aviso previo)

- Step Functions
- EventBridge (uso intensivo)
- SES en producción
- RDS
- OpenSearch

⚠️ **Nunca usar uno de estos sin advertir y pedir confirmación.**

---

## Resolución de ambigüedades

1. Prevalecen las **Reglas no negociables**.
2. El **Anexo legado** es solo informativo y no vinculante.

---

## Checklist obligatorio antes de subir código

- [ ] No existe código duplicado (DRY verificado)
- [ ] Helpers reutilizados o creados correctamente
- [ ] Documentación TSDoc en español completa
- [ ] Variables y funciones en inglés
- [ ] Uso exclusivo de servicios Free Tier (o advertencia explícita)
- [ ] DynamoDB en PAY_PER_REQUEST
- [ ] Respuestas HTTP normalizadas
- [ ] Manejo correcto de errores
- [ ] Logs mínimos y controlados

---

## Ejemplo completo: api-program (refactorizado y alineado a estándares)

### Estructura

```
services/api-program/
├── create-program-v1.js
└── validators/
    └── validate-program-payload.js
```

### helpers/validators/validate-program-payload.js

```js
/**
 * Validate program payload structure.
 *
 * @param {Object[]} content - Program content array.
 * @throws {Error} Validation error with statusCode 400.
 *
 * @description
 * Valida la estructura mínima requerida para crear un programa.
 */
export const validateProgramPayload = (content = []) => {
  if (!content[0]) {
    const error = new Error('Program content is required.');
    error.statusCode = 400;
    throw error;
  }

  const first = content[0];

  if (!first.type?.id) {
    const error = new Error('Program type is required.');
    error.statusCode = 400;
    throw error;
  }

  if (!first.dates?.[0]) {
    const error = new Error('Start date is required.');
    error.statusCode = 400;
    throw error;
  }

  return first;
};
```

### services/api-program/create-program-v1.js

```js
import { uuidv7 } from 'uuidv7';
import * as dynamoDbLib from '../../../libs/dynamodb-v3';
import { parseEventBody } from '../../../helpers/event-parser.js';
import { success, unsuccessful } from '../../../helpers/responses.js';
import { validateProgramPayload } from '../../helpers/validators/validate-program-payload.js';

const { DYNAMODB_PROGRAM_TABLE, PROGRAM_TABLE } = process.env;
const ACTION = 'Create travel program';

/**
 * Main function to create a new travel program.
 *
 * @async
 * @function main
 * @param {Object} event - AWS Lambda event.
 * @returns {Promise<Object>} HTTP response.
 *
 * @description
 * Flujo:
 * 1. Parsea body del evento.
 * 2. Valida payload del programa.
 * 3. Genera identificadores y fechas.
 * 4. Persiste el programa en DynamoDB.
 * 5. Retorna respuesta normalizada.
 */
export const main = async (event) => {
  try {
    const { content, user } = parseEventBody(event);
    const firstContent = validateProgramPayload(content);

    const id = uuidv7();
    const createdAt = new Date().toISOString();
    const startDate = firstContent.dates[0].split('T')[0];

    const result = await dynamoDbLib.put({
      TableName: DYNAMODB_PROGRAM_TABLE,
      ReturnConsumedCapacity: 'TOTAL',
      Item: {
        pk: PROGRAM_TABLE,
        sk: `PRG#${id}`,
        id,
        createdAt,
        content,
        user,
        status: 'pending',
        type: firstContent.type.id,
        startDate,
      },
    });

    return success(200, result, ACTION);
  } catch (error) {
    return unsuccessful(error.statusCode || 500, error, ACTION);
  }
};
```

---

## Plantilla base obligatoria para todos los api-*

### Estructura estándar

```
services/api-<resource>/
├── handlers/
│   └── <action>-v1.js
├── validators/
│   └── validate-<resource>-payload.js
├── mappers/
│   └── map-<resource>-item.js
└── index.js
```

### Flujo obligatorio de un handler

1. Parseo del evento (`parseEventBody`).
2. Validación de payload (validator dedicado).
3. Transformación / mapeo (mapper).
4. Persistencia o acción principal.
5. Retorno vía `success` / `unsuccessful`.

---

## Convención de errores de dominio

### helpers/errors/business-error.js

```js
/**
 * Business domain error.
 *
 * @extends Error
 */
export class BusinessError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}
```

### helpers/errors/validation-error.js

```js
/**
 * Validation error for request payloads.
 *
 * @extends Error
 */
export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.statusCode = 400;
  }
}
```

Uso obligatorio en validators y reglas de negocio.

---

## Ejemplo completo adicional: api-payment

⚠️ **Advertencia de costos**: Integración real con pasarela de pago (Stripe, Transbank, etc.) **NO es Free Tier**.

👉 Este ejemplo se limita a **registro de intención de pago** en DynamoDB (Free Tier).

### services/api-payment/handlers/create-payment-intent-v1.js

```js
import { uuidv7 } from 'uuidv7';
import * as dynamoDbLib from '../../../libs/dynamodb-v3';
import { parseEventBody } from '../../../helpers/event-parser.js';
import { success, unsuccessful } from '../../../helpers/responses.js';
import { ValidationError } from '../../../helpers/errors/validation-error.js';

const { DYNAMODB_PAYMENT_TABLE, PAYMENT_TABLE } = process.env;
const ACTION = 'Create payment intent';

export const main = async (event) => {
  try {
    const { amount, programId, user } = parseEventBody(event);

    if (!amount || amount <= 0) throw new ValidationError('Amount must be greater than zero.');
    if (!programId) throw new ValidationError('Program ID is required.');

    const id = uuidv7();
    const createdAt = new Date().toISOString();

    const result = await dynamoDbLib.put({
      TableName: DYNAMODB_PAYMENT_TABLE,
      Item: {
        pk: PAYMENT_TABLE,
        sk: `PAY#${id}`,
        id,
        programId,
        user,
        amount,
        status: 'pending',
        createdAt,
      },
    });

    return success(201, result, ACTION);
  } catch (error) {
    return unsuccessful(error.statusCode || 500, error, ACTION);
  }
};
```

---

## Autorización y seguridad

### Convenciones

- Authorizers en `common/authorizers`.
- Contexto mínimo (userId, roles).
- No lógica de negocio en authorizer.

### Flujo

1. API Gateway ejecuta authorizer.
2. Authorizer valida token.
3. Inyecta contexto.
4. Lambda consume contexto sin recalcular permisos.

---

## Versionado y deprecación

- Versionado explícito en archivo: `*-v1.js`.
- Nueva versión → nuevo handler (`v2`).
- No romper contratos existentes.
- Deprecaciones documentadas en README.

---

## serverless.yml base por servicio (obligatorio)

### serverless.yml (servicio api-*)

```yml
service: api-program

frameworkVersion: '3'

provider:
  name: aws
  runtime: nodejs20.x
  stage: ${opt:stage, 'dev'}
  region: us-east-1
  memorySize: 128
  timeout: 10
  logRetentionInDays: 7
  environment:
    DYNAMODB_PROGRAM_TABLE: ${self:custom.usersTableName}
    PROGRAM_TABLE: PROGRAM

functions:
  createProgram:
    handler: services/api-program/handlers/create-program-v1.main
    events:
      - http:
          path: programs
          method: post
          cors: true
          authorizer:
            name: auth

resources:
  - ${file(../../common/resources/gateway-responses.yml)}
  - ${file(../../common/dynamodb/program-table.yml)}

custom:
  stage: ${self:provider.stage}
```

---

## Ejemplo completo: api-auth + authorizer

### common/authorizers/auth.js

```js
/**
 * Custom Lambda Authorizer.
 *
 * @param {Object} event - API Gateway event.
 * @returns {Object} IAM policy.
 *
 * @description
 * Valida token JWT y entrega contexto mínimo.
 */
export const main = async (event) => {
  const token = event.authorizationToken;

  if (!token) throw new Error('Unauthorized');

  // Validación mínima (ejemplo)
  const userId = 'user-id';

  return {
    principalId: userId,
    policyDocument: {
      Version: '2012-10-17',
      Statement: [
        {
          Action: 'execute-api:Invoke',
          Effect: 'Allow',
          Resource: event.methodArn,
        },
      ],
    },
    context: {
      userId,
      role: 'user',
    },
  };
};
```

---

## Testing (unitario obligatorio)

### Principios

- Tests solo **unitarios** (Free Tier).
- No tests de integración contra AWS real.
- Usar mocks/stubs.

### Stack recomendado

- `vitest` (rápido, simple).
- `@aws-sdk/client-dynamodb` mockeado.

### Estructura

```
services/api-program/
├── handlers/
├── validators/
├── __tests__/
│   └── create-program-v1.test.js
```

### Ejemplo

```js
import { describe, it, expect } from 'vitest';
import { validateProgramPayload } from '../validators/validate-program-payload.js';

it('throws error when content is empty', () => {
  expect(() => validateProgramPayload([])).toThrow();
});
```

---

## CI/CD mínimo (Free Tier)

### Objetivo

- Validar calidad sin costos.
- Deploy manual controlado.

### Pipeline GitHub Actions

```yml
name: CI

on: [push]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm test
```

⚠️ Deploy **no automático**. El deploy se ejecuta manualmente para controlar costos.

---

## Documentos, contratos y PDFs

### Estrategia

- Generación en Lambda.
- Almacenamiento en S3 (Free Tier).
- Versionado por metadata.

### Convención S3

```
contracts/{programId}/{version}.pdf
```

### Reglas

- Nunca sobrescribir archivos.
- Versionado incremental.
- Metadata obligatoria: `programId`, `createdAt`, `type`.

---

## Migraciones DynamoDB sin downtime

### Principios

- Nunca modificar claves primarias.
- Nuevos atributos son retrocompatibles.
- Uso de versionado lógico en ítems.

### Estrategia

1. Agregar nuevo atributo opcional.
2. Actualizar writers.
3. Actualizar readers.
4. Backfill gradual (Lambda puntual).

---

## Logging y observabilidad

- Logs solo para errores y eventos críticos.
- Nunca loggear datos sensibles.
- CloudWatch Logs con retención mínima.

---

## Estimación de costos (Free Tier)

| Servicio | Uso estimado | Costo | Nota |
|--------|-------------|-------|------|
| Lambda | < 1M invocaciones | $0 | Free Tier |
| DynamoDB | PAY_PER_REQUEST | $0 | Bajo volumen |
| S3 | < 5GB | $0 | Free Tier |
| CloudWatch Logs | Uso mínimo | $0 | Logs controlados |

⚠️ Si el volumen supera Free Tier, **detener ejecución y solicitar aprobación**.

---

## Anexo legado (no vinculante)

Resumen de buenas prácticas generales de AWS, JavaScript y Node.js, siempre priorizando reducción de costos y uso de capa gratuita.

