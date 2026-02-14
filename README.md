# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Comandos de desarrollo

### Desarrollo local

#### Servicios Node.js
```bash
# Iniciar serverless offline (puerto 3200)
npm start
# Equivalente a: AWS_PROFILE=pa-dev serverless offline

# Deploy de un servicio específico
cd services/api-<servicio>
AWS_PROFILE=pa-<stage> serverless deploy --stage <stage> --region <region>

# Invocar función localmente
serverless invoke local --function <nombre-funcion>

# Ver logs de una función
serverless logs --function <nombre-funcion> --stage <stage>

# Remover servicio completo
serverless remove --stage <stage> --region <region>
```

#### Servicio Go (api-configuration)
```bash
cd services/api-configuration

# Compilar para Lambda
make build

# Ejecutar servidor local (requiere .env)
make run

# Deploy
make deploy

# Ver logs
make logs
```

### Versiones de runtime
- **Node.js**: 22.12.0 (definido en `.nvmrc`)
- **Go**: 1.24
- **Serverless Framework**: v3.40.x

### Perfiles AWS
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

Monorepo serverless multi-lenguaje para administración de giras de estudios y viajes educacionales. Combina servicios en **Node.js** (mayoría) y **Go** (api-configuration), todos desplegados en **AWS Lambda** con arquitectura independiente por servicio.

### Flujo de datos principal

1. **Cliente** → API Gateway → Lambda Handler
2. **Handler** → Valida → Transforma → Persiste (DynamoDB/S3)
3. **DynamoDB** usa modelo single-table con claves compuestas (`pk`, `sk`)
4. **Authorizer** centralizado en `job-authorizer` (compartido por todos los servicios)

### Servicios disponibles

**Servicios Node.js:**
- `api-program`: Gestión de programas de viaje (CRUD, aprobación, confirmación)
- `api-payment`: Sistema de pagos con Transbank
- `api-entity`: Gestión de entidades (estudiantes, apoderados, usuarios)
- `api-contract`: Generación de contratos PDF
- `api-notification`: Envío de emails (Nodemailer)
- `api-balance`: Gestión de balances y cuotas
- `api-extraction`: Extracción de datos
- `api-maintainer`: Tareas de mantenimiento
- `job-authorizer`: Authorizer Lambda compartido (JWT)

**Servicios Go:**
- `api-configuration`: Servicio de configuración global del sistema (migrado de Node.js a Go)

### Componentes compartidos

**`helpers/`** (Node.js - funciones puras reutilizables)
- `responses.js`: Respuestas HTTP normalizadas (`success()`, `unsuccessful()`, `binaryFile()`)
- `event-parser.js`: Parseo de eventos Lambda (`parseEventBody()`)
- `mapper-tables.js`: Mapeo de nombres de tablas DynamoDB
- `get-global-config.js`: Obtiene configuración global desde DynamoDB
- `allsettled.js`: Utilidad para Promise.allSettled

**`libs/`** (Node.js - wrappers AWS SDK)
- `dynamodb-v3.js`: CRUD DynamoDB (`query`, `getOne`, `put`, `update`, `remove`, `scan`, `iterativeQuery`)
- `s3-v3.js`: Operaciones S3
- `secret-manager.js`: AWS Secrets Manager
- `ssm.js`: AWS Systems Manager Parameter Store
- `nodemailer.js`: Envío de emails configurado
- `configs.js`: Configuraciones compartidas
- `pdf-generator/`: Sistema de generación de PDFs con pdf-lib
- `document-builders/`: Constructores de documentos (CTT, DBA, DBR)
- `document-generator.js`: API unificada para generación de documentos

**`common/`** (Configuración compartida Serverless)
- `custom.yml`: Variables personalizadas globales (shortRegion, buckets, stage)
- `apigateway-errors.yml`: Respuestas 4XX/5XX centralizadas
- `lambda-authorizer.yml`: Referencia al authorizer compartido
- `dynamodb-config-table.yml`: Definición de tabla de configuración
- `dynamodb-resources.yml`: Recursos DynamoDB compartidos
- `s3-resources.yml`: Recursos S3 compartidos

**`aws/policies/`**
- Políticas IAM reutilizables para Lambdas (DynamoDB, S3, SSM, Secrets Manager, CloudWatch, X-Ray)

### Modelo de datos DynamoDB

Todas las tablas usan **single-table design**:
- **Claves**: `pk` (partition key) + `sk` (sort key)
- **Naming**: `<recurso>-<stage>-pri-<shortRegion>` (ej: `programs-dev-pri-usw2`)
- **Billing**: `PAY_PER_REQUEST` (Free Tier optimizado)
- **DeletionPolicy**: `Retain`

Ejemplo de estructura de claves:
```javascript
{
  pk: "PRG#8e3d823d-9f58-45df-8a8f-6779435a0001", // PROGRAM_TABLE constant
  sk: "PRG#<uuid>",                                // Individual program
  // ... atributos del programa
}
```

Tabla de configuración global:
```javascript
{
  pk: "CONFIG",
  sk: "GLOBAL#<key>",
  value: { ... },
  description: "...",
  createdAt: "...",
  updatedAt: "..."
}
```

### Generación de documentos PDF

**Sistema centralizado en `libs/document-generator.js`**:

1. **Biblioteca**: `pdf-lib`
2. **Storage**: S3 bucket `giras-indomito-<stage>-info`
3. **Scopes soportados**: CTT (contrato), DBA (declaración aduanal), DBR (borrador)
4. **Features**:
   - Marca de agua "BORRADOR" (para previsualizaciones)
   - Firmas digitales desde S3
   - Header/footer personalizables
   - Base64 output

**Configuración Lambda para PDFs**:
- `memorySize: 1024` (mayor que default de 128MB)
- `timeout: 30` (generación puede tomar tiempo)

**Uso**:
```javascript
import { generateDocument } from '../../libs/document-generator.js';

const result = await generateDocument({
  scope: 'CTT',            // CTT | DBA | DBR
  form: documentData,      // Datos del documento
  action: {
    isPreview: false,      // true = marca de agua
    hasSigned: true,       // false = incluye firmas desde S3
    hasHeaderFooter: false // true = header.png + footer.png
  },
  bucket: process.env.BUCKET_NAME
});

if (result.success) {
  const pdfBase64 = result.base64;
} else {
  console.error(result.error, result.statusCode);
}
```

### Autorización y autenticación

- **Authorizer**: Lambda centralizada en `job-authorizer/`
- **Token**: JWT con bcryptjs
- **TTL**: `resultTtlInSeconds: 0` (no cachear para evitar inconsistencias)
- **Contexto inyectado**: `userId`, `role`, `profile`
- **Variables de entorno**: `SECRET_KEY` desde Secrets Manager
- **Estado en dev**: Temporalmente comentado para desarrollo local

### AWS X-Ray Tracing

Todos los servicios tienen habilitado AWS X-Ray:
```yaml
tracing:
  apiGateway: true
  lambda: true
```

---

## Convenciones por lenguaje

### Node.js (servicios api-*)

#### Stack tecnológico
- **Runtime**: Node.js 20.x (ES2022+)
- **Framework**: Serverless Framework v3.40.x
- **Bundler**: serverless-bundle (Webpack + Babel)
- **AWS SDK**: @aws-sdk v3
- **Middleware**: @middy/core v5
- **UUID**: uuidv7
- **PDF**: pdf-lib v1.17.1
- **Logging**: winston v3.17.0
- **Email**: nodemailer v7.0.5

#### Naming conventions
- **Servicios**: `services/api-<recurso>` en **singular**
- **Funciones**: `<action>-v1.js` (versionado explícito)
- **Helpers**: `helpers/<verbo>-<objeto>.js`
- **Variables y funciones**: **inglés**
- **Documentación JSDoc**: **español**

#### Estructura estándar de un servicio
```
services/api-<resource>/
├── functions/
│   ├── <action>-v1.js
│   └── <action>-v2.js (si hay nueva versión)
├── validators/
│   └── validate-<resource>-payload.js
├── mappers/
│   └── map-<resource>-item.js
└── serverless.yml
```

#### Flujo obligatorio en handlers
1. Parseo del evento (`parseEventBody`)
2. Validación de payload (validator dedicado)
3. Transformación/mapeo (mapper)
4. Persistencia o acción principal
5. Retorno vía `success()` / `unsuccessful()`

#### Ejemplo de handler Node.js
```javascript
import { uuidv7 } from 'uuidv7';
import * as dynamoDbLib from '../../../libs/dynamodb-v3.js';
import { parseEventBody } from '../../../helpers/event-parser.js';
import { success, unsuccessful } from '../../../helpers/responses.js';

const { DYNAMODB_TABLE, TABLE_PK } = process.env;
const ACTION = 'Create resource';

/**
 * Main function to create a new resource.
 *
 * @async
 * @function main
 * @param {Object} event - AWS Lambda event.
 * @returns {Promise<Object>} HTTP response.
 *
 * @description
 * Esta función realiza las siguientes operaciones:
 * 1. Parsea el body del evento.
 * 2. Valida contenido mínimo.
 * 3. Genera identificador único.
 * 4. Persiste en DynamoDB.
 * 5. Retorna respuesta HTTP normalizada.
 */
export const main = async (event) => {
  try {
    const { data } = parseEventBody(event);

    // Validación inline o llamar a validator
    if (!data) {
      throw Object.assign(new Error('Data is required'), { statusCode: 400 });
    }

    const id = uuidv7();
    const createdAt = new Date().toISOString();

    const result = await dynamoDbLib.put({
      TableName: DYNAMODB_TABLE,
      Item: {
        pk: TABLE_PK,
        sk: `RES#${id}`,
        id,
        data,
        createdAt,
      },
    });

    return success(201, result, ACTION);
  } catch (error) {
    return unsuccessful(error.statusCode || 500, error, ACTION);
  }
};
```

#### Reglas no negociables (Node.js)

1. **DRY**: Si un bloque se repite 2 veces → extraer a helper
2. **Documentación JSDoc**: Obligatoria en español con `@description`
3. **Respuestas HTTP**: Siempre usar `success()` / `unsuccessful()`
4. **DynamoDB**: Siempre `PAY_PER_REQUEST`, claves `pk/sk`, `DeletionPolicy: Retain`
5. **Errores**: Agregar `statusCode` al error para respuestas HTTP correctas
6. **Free Tier**: Advertir explícitamente si se sale de la capa gratuita

### Go (api-configuration)

#### Stack tecnológico
- **Runtime**: Go 1.24
- **Framework**: Echo v4 (HTTP router)
- **AWS SDK**: aws-sdk-go-v2
- **Database**: DynamoDB (driver nativo AWS SDK)
- **Logging**: zap (estructurado)
- **Validación**: go-playground/validator/v10
- **JWT**: golang-jwt/jwt/v5
- **Email**: go-gomail/gomail
- **Excel**: xuri/excelize/v2
- **QR**: skip2/go-qrcode

#### Arquitectura funcional

**El servicio Go sigue un paradigma funcional estricto**:

- **No OOP**: Sin structs con métodos receptores para lógica de negocio
- **Funciones puras**: Una función, una responsabilidad
- **Estado global**: Los clientes (DynamoDB, S3, etc.) son globales
- **Sin DI explícita**: No factories ni constructores complejos
- **Sin interfaces innecesarias**: Solo si hay múltiples implementaciones reales

#### Estructura del servicio Go
```
services/api-configuration/
├── cmd/
│   ├── lambda/          # Entry point para AWS Lambda
│   └── server/          # Entry point para servidor local
├── internal/
│   ├── api/
│   │   └── <feature>/
│   │       ├── router.go     # Rutas HTTP
│   │       ├── handler.go    # Adaptadores HTTP → Lógica
│   │       ├── service.go    # Lógica de negocio (funciones puras)
│   │       └── repository/   # Acceso a datos
│   ├── config/          # Configuración global
│   └── middleware/      # Middleware compartido
├── shared/
│   ├── apperr/         # Errores de dominio
│   ├── database/       # Cliente DynamoDB global
│   └── logger/         # Logger zap global
├── test/               # Tests
├── go.mod
├── go.sum
├── Makefile
└── serverless.yml
```

#### Ejemplo de handler Go (estilo funcional)
```go
// handler.go
package favorites

import (
    "net/http"
    "github.com/labstack/echo/v4"
    "go.uber.org/zap"
)

// CreateFavorite es un adaptador HTTP que delega la lógica al servicio
func CreateFavorite(c echo.Context) error {
    ctx := c.Request().Context()
    log := logger.FromContext(ctx)

    var cmd CreateFavoriteCmd
    if err := c.Bind(&cmd); err != nil {
        log.Error("Invalid request body", zap.Error(err))
        return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid request"})
    }

    if err := c.Validate(cmd); err != nil {
        return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
    }

    // Llamada directa a función de servicio (no método de struct)
    result, err := CreateFavoriteItem(ctx, cmd)
    if err != nil {
        // apperr maneja errores de dominio con statusCode
        if appErr, ok := err.(*apperr.AppError); ok {
            return c.JSON(appErr.StatusCode, map[string]string{"error": appErr.Message})
        }
        log.Error("Internal error", zap.Error(err))
        return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Internal error"})
    }

    return c.JSON(http.StatusCreated, result)
}
```

```go
// service.go
package favorites

import (
    "context"
    "fmt"
    "github.com/uuidv7"
    "shared/apperr"
)

// CreateFavoriteItem es una función pura de lógica de negocio
func CreateFavoriteItem(ctx context.Context, cmd CreateFavoriteCmd) (FavoriteResponse, error) {
    if cmd.UserID == "" {
        return FavoriteResponse{}, apperr.NewBadRequest("User ID is required")
    }

    id := uuidv7.New().String()

    // Llamada directa al repositorio global (no inyección)
    item := FavoriteItem{
        ID:     id,
        UserID: cmd.UserID,
        ItemID: cmd.ItemID,
    }

    // El repositorio usa el cliente global de DynamoDB
    if err := repository.SaveFavorite(ctx, item); err != nil {
        return FavoriteResponse{}, fmt.Errorf("failed to save favorite: %w", err)
    }

    return FavoriteResponse{ID: id}, nil
}
```

```go
// repository/favorite.go
package repository

import (
    "context"
    "shared/database"
)

// SaveFavorite persiste un favorito usando el cliente DynamoDB global
func SaveFavorite(ctx context.Context, item FavoriteItem) error {
    client := database.MustClient() // Cliente global

    // Lógica de persistencia
    // ...

    return nil
}
```

#### Logging estructurado (Go)
```go
import "go.uber.org/zap"

log := logger.FromContext(ctx) // o logger.MustLogger() para global

log.Info("Operation completed",
    zap.String("userId", userID),
    zap.Int("count", count),
)

log.Error("Operation failed",
    zap.Error(err),
    zap.String("operation", "CreateFavorite"),
)
```

#### Manejo de errores (Go)

**Usar paquete `shared/apperr`**:
```go
import "shared/apperr"

// Errores de dominio
return apperr.NewBadRequest("Invalid input")
return apperr.NewNotFound("Resource not found")
return apperr.NewUnauthorized("Invalid token")

// Wrapping de errores
if err != nil {
    return fmt.Errorf("failed to save item: %w", err)
}
```

**No usar**:
- `panic()` (excepto en inicialización)
- `log.Fatal()` en handlers
- Ignorar errores con `_`

#### Reglas no negociables (Go)

1. **Paradigma funcional**: Funciones puras, no structs con métodos para lógica
2. **Estado global**: Clientes de AWS, logger, config son globales
3. **Logging estructurado**: Solo `zap`, nunca `fmt.Println` o `log.Printf`
4. **Error wrapping**: Siempre usar `%w` para preservar stack trace
5. **Sin DI compleja**: No factories, no closures para inyección
6. **Validación**: Usar `validator` en structs de entrada

---

## Configuración de serverless.yml

### Node.js service (ejemplo)
```yaml
service: api-resource
frameworkVersion: '3'

disabledDeprecations: '*'
configValidationMode: off
projectDir: ./../../

plugins:
  - serverless-bundle
  - serverless-offline

custom: ${file(../../common/custom.yml)}

provider:
  name: aws
  runtime: nodejs20.x
  stage: ${opt:stage, 'dev'}
  region: ${opt:region, 'us-west-2'}
  profile: pa-${self:custom.stage}
  lambdaHashingVersion: 20201221
  endpointType: REGIONAL

  environment:
    STAGE: ${self:custom.stage}
    DYNAMODB_TABLE: resource-${self:custom.stage}-pri-${self:custom.shortRegion}
    SECRET_KEY: secret-pri-${self:custom.stage}-${self:custom.shortRegion}

  tracing:
    apiGateway: true
    lambda: true

  deploymentBucket:
    name: sls-deploys-${self:custom.stage}-pri-${self:custom.shortRegion}

  iamRoleStatements:
    - ${file(../../aws/policies/lambda-policy-xray.yml)}
    - ${file(../../aws/policies/lambda-policy-dynamodb-resource.yml)}
    - ${file(../../aws/policies/lambda-policy-secretsmanager.yml)}

functions:
  createResource:
    handler: functions/create-resource-v1.main
    events:
      - http:
          path: v1/resources
          method: post
          cors: true
          # authorizer: ${file(../../common/lambda-authorizer.yml)} # Descomentar en prod

resources:
  - ${file(../../common/apigateway-errors.yml)}
```

### Go service (ejemplo)
```yaml
service: api-configuration
frameworkVersion: '3'

provider:
  name: aws
  runtime: provided.al2023
  stage: ${opt:stage, 'dev'}
  region: ${opt:region, 'us-west-2'}
  architecture: arm64

  environment:
    STAGE: ${self:provider.stage}
    DYNAMODB_TABLE: config-${self:provider.stage}-pri-usw2

  tracing:
    lambda: true

functions:
  api:
    handler: bootstrap
    package:
      artifact: bin/bootstrap.zip
    events:
      - http:
          path: /{proxy+}
          method: ANY
          cors: true
```

---

## Patrones y mejores prácticas

### Versionado de APIs
- Versionado explícito en rutas: `/v1/`, `/v2/`
- Versionado en nombre de archivo: `create-resource-v1.js`, `v2.js`
- No romper contratos existentes
- Deprecaciones documentadas en README del servicio

### Manejo de configuración global
```javascript
// Node.js
import { getGlobalConfig } from '../../helpers/get-global-config.js';

const config = await getGlobalConfig('PAYMENT_CONFIG');
```

```go
// Go - desde DynamoDB config table
func GetGlobalConfig(ctx context.Context, key string) (ConfigValue, error) {
    // Implementación usando cliente DynamoDB global
}
```

### Secrets y variables sensibles
- **Nunca** hardcodear secretos en código
- Usar AWS Secrets Manager (NODE: `libs/secret-manager.js`, GO: `aws-sdk-go-v2`)
- Usar AWS Systems Manager Parameter Store para configuración no sensible
- Variables de entorno para configuración por stage

### Storage en S3
**Convenciones de paths**:
- Contratos: `contracts/{programId}/{version}.pdf`
- Assets: `assets/{filename}`
- Firmas: `signatures/{dni}.png`
- Exports: `exports/{type}/{timestamp}.{ext}`

**No sobrescribir archivos**: Usar versionado o timestamp

### Paginación en DynamoDB
```javascript
// Node.js - usando iterativeQuery
const results = await dynamoDbLib.iterativeQuery({
  TableName: DYNAMODB_TABLE,
  KeyConditionExpression: 'pk = :pk',
  ExpressionAttributeValues: { ':pk': 'PROGRAM' },
  Limit: 50
});
```

### Testing

**Node.js**:
- Tests unitarios (Free Tier)
- No tests de integración contra AWS real
- Usar mocks para AWS SDK

**Go**:
- Tests unitarios con `testing` package
- Mocks para repositorios si es necesario
- No tests que requieran AWS real

---

## Migración de servicios Node.js → Go

**Contexto**: `api-configuration` fue migrado de Node.js a Go como referencia.

**Consideraciones al migrar**:
1. Mantener misma API HTTP (rutas, payloads, respuestas)
2. Conservar modelo de datos DynamoDB
3. Adaptarse al paradigma funcional de Go
4. Actualizar `serverless.yml` para `provided.al2023`
5. Configurar Makefile para build/deploy
6. Migrar variables de entorno
7. Actualizar IAM policies si es necesario

---

## Costos y AWS Free Tier

### Servicios preferidos (Free Tier)
- Lambda (1M invocaciones/mes)
- DynamoDB PAY_PER_REQUEST (bajo volumen)
- S3 (primeros 5GB)
- CloudWatch Logs (uso mínimo, retención 7 días)

### Servicios restringidos (requieren advertencia previa)
- Step Functions
- EventBridge (uso intensivo)
- SES en producción
- RDS
- OpenSearch
- Cognito (pools de usuarios grandes)

⚠️ **Regla crítica**: Si una solución requiere salir de Free Tier, **indicarlo explícitamente** y **esperar confirmación del usuario**.

---

## Checklist antes de commit

**Node.js**:
- [ ] No hay código duplicado (DRY)
- [ ] Helpers reutilizados o creados correctamente
- [ ] Documentación JSDoc en español completa
- [ ] Variables y funciones en inglés
- [ ] Uso exclusivo de servicios Free Tier (o advertencia)
- [ ] DynamoDB en PAY_PER_REQUEST
- [ ] Respuestas HTTP normalizadas (`success`/`unsuccessful`)
- [ ] Manejo correcto de errores con statusCode

**Go**:
- [ ] Funciones puras sin simulación de OO
- [ ] Logging estructurado con `zap`
- [ ] Error wrapping con `%w`
- [ ] Validación con `validator` tags
- [ ] Sin DI compleja (estado global)
- [ ] Tests unitarios si corresponde

**Ambos**:
- [ ] `.gitignore` actualizado si es necesario
- [ ] Variables sensibles en Secrets Manager
- [ ] Logs mínimos y controlados
- [ ] AWS X-Ray habilitado

---

## Recursos adicionales

- **Node.js detallado**: `.claude/senior-programmer-node/basic.md`
- **Go detallado**: `.claude/senior-programmer-go/basic.md`
- **Convenciones Go**: `.claude/senior-programmer-go/go-conventions.md`
- **Tech Stack Go**: `.claude/senior-programmer-go/go-tech-stack.md`
- **README principal**: `README.md`

---

**Última actualización**: 2026-02-14
**Versión**: 2.0 (Integración Node.js + Go)
