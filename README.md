# Portal Admin — Giras Indómito

Monorepo serverless multi-lenguaje para la administración de giras y viajes educacionales. Combina servicios en **Node.js** y **Go**, todos desplegados en **AWS Lambda** con una arquitectura independiente por servicio.

> **Para Claude Code:** Este archivo también sirve como guía de desarrollo (`CLAUDE.md`). Ver sección [Convenciones](#convenciones) y subsecciones por lenguaje.

---

## Índice

- [Arquitectura](#arquitectura)
- [Servicios](#servicios)
- [Componentes compartidos](#componentes-compartidos)
- [Desarrollo local](#desarrollo-local)
- [Deploy](#deploy)
- [Convenciones](#convenciones)
- [Costos y Free Tier](#costos-y-free-tier)

---

## Arquitectura

```
Cliente → API Gateway HTTP v2 (compartido) → Lambda Authorizer JWT
                                           → Lambda Handler
                                               → DynamoDB / S3 / SES / Transbank
```

- **API Gateway HTTP v2** compartido, definido en `infrastructure/`
- **Lambda Authorizer** centralizado en `job-authorizer/`
- **Single-table design** en DynamoDB con claves `pk` / `sk`
- **Tracing** con AWS X-Ray en todos los servicios
- **Logs** con retención de 7 días en CloudWatch

---

## Servicios

| Servicio | Lenguaje | Nombre SLS | Funciones | Descripción |
|---|---|---|---|---|
| [api-program](services/api-program/) | Node.js | `programas` | 9 | Gestión de programas de viaje |
| [api-payment](services/api-payment/) | Node.js | `pagos` | 9 | Pagos con Transbank Webpay Plus |
| [api-entity](services/api-entity/) | Node.js | `usuarios` | 4 | Usuarios, sesiones y permisos |
| [api-contract](services/api-contract/) | Node.js | `contratos` | 4 | Generación de contratos PDF |
| [api-notification](services/api-notification/) | Node.js | `notificaciones` | 1 | Envío de emails |
| [api-balance](services/api-balance/) | Node.js | `balances` | 2 | Balances y cuotas |
| [api-extraction](services/api-extraction/) | Node.js | `extracciones` | 1 | Descarga de archivos desde S3 |
| [api-maintainer](services/api-maintainer/) | Node.js | `mantenedor` | 1 | Datos maestros (bancos) |
| [job-authorizer](services/job-authorizer/) | Node.js | `autorizador` | 2 | Authorizer JWT compartido |
| [api-configuration](services/api-configuration/) | Go 1.24 | `configuracion` | 2 | Configuración global del sistema |

---

## Componentes compartidos

### `helpers/` — Funciones utilitarias (Node.js)

| Archivo | Propósito |
|---|---|
| `responses.js` | Respuestas HTTP normalizadas (`success`, `unsuccessful`, `binaryFile`) |
| `event-parser.js` | Parseo de eventos Lambda (`parseEventBody`) |
| `mapper-tables.js` | Mapeo de nombres de tablas DynamoDB |
| `get-global-config.js` | Obtiene configuración global desde DynamoDB |
| `allsettled.js` | Utilidad para `Promise.allSettled` |

### `libs/` — Wrappers AWS SDK y utilidades (Node.js)

| Archivo / Directorio | Propósito |
|---|---|
| `dynamodb-v3.js` | CRUD DynamoDB (`query`, `getOne`, `put`, `update`, `remove`, `scan`, `iterativeQuery`) |
| `s3-v3.js` | Operaciones S3 |
| `secret-manager.js` | AWS Secrets Manager |
| `ssm.js` | AWS Systems Manager Parameter Store |
| `nodemailer.js` | Envío de emails configurado |
| `document-generator.js` | API unificada para generación de documentos PDF |
| `pdf-generator/` | Sistema de generación de PDFs con `pdf-lib` |
| `document-builders/` | Constructores de documentos: CTT, DBA, DBR |
| `cache/` | Cache en memoria con TTL |

### `common/` — Configuración Serverless compartida

| Archivo | Propósito |
|---|---|
| `custom.yml` | Variables globales (`shortRegion`, `buckets`, `apiGatewayId`) |
| `apigateway-errors.yml` | Respuestas 4XX/5XX centralizadas |
| `lambda-authorizer.yml` | Referencia al authorizer compartido |
| `dynamodb-config-table.yml` | Definición de tabla de configuración |
| `dynamodb-resources.yml` | Recursos DynamoDB compartidos |
| `s3-resources.yml` | Recursos S3 compartidos |

### `aws/policies/` — Políticas IAM reutilizables

Políticas granulares por recurso: DynamoDB, S3, SSM, Secrets Manager, SES, CloudWatch, X-Ray, Lambda.

---

## Desarrollo local

### Requisitos

- Node.js 22.12.0 (ver `.nvmrc`)
- Go 1.24+ (solo para `api-configuration`)
- AWS CLI configurado con los perfiles correctos
- Serverless Framework v4

### Perfiles AWS

| Perfil | Entorno |
|---|---|
| `pa-dev` | Desarrollo |
| `pa-staging` | Staging |
| `pa-prod` | Producción |

### Iniciar servidor offline (servicios Node.js)

```bash
# Desde la raíz del proyecto
npm start
# Equivalente a: AWS_PROFILE=pa-dev serverless offline
# Puerto: 3200
```

### Comandos por servicio (Node.js)

```bash
# Instalar dependencias (desde raíz)
npm install

# Deploy de un servicio específico
cd services/api-<servicio>
AWS_PROFILE=pa-<stage> serverless deploy --stage <stage> --region us-west-2

# Invocar función localmente
serverless invoke local --function <nombre-funcion>

# Ver logs de una función
serverless logs --function <nombre-funcion> --stage <stage>

# Eliminar servicio
serverless remove --stage <stage> --region us-west-2
```

### Comandos para api-configuration (Go)

```bash
cd services/api-configuration

make build           # Compilar para Lambda (ARM64)
make run-local       # Servidor local en puerto 3001
make deploy          # Deploy a AWS
make test            # Tests unitarios
make test-coverage   # Tests con cobertura
make fmt             # Formatear código
make lint            # Linting
make clean           # Limpiar artefactos
make help            # Ver todos los comandos
```

### Variables de entorno locales

```bash
cp .env.example .env
```

```bash
# JWT Secret
SECRET_PRI_DEV_USW2=tu-secreto-jwt-local-aqui

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=tu-email@gmail.com
EMAIL_PASSWORD=tu-contraseña-de-aplicacion
```

---

## Deploy

### Deploy completo

```bash
./scripts/deploy-all.sh [stage]
```

### Deploy por servicio

```bash
cd services/api-<servicio>
AWS_PROFILE=pa-dev serverless deploy --stage dev --region us-west-2
```

### Orden recomendado de deploy

1. `infrastructure/` — API Gateway compartido
2. `job-authorizer/` — Authorizer JWT
3. `api-configuration/` — Configuración global
4. Resto de servicios en cualquier orden

---

## Convenciones

### Naming

| Elemento | Convención | Ejemplo |
|---|---|---|
| Servicios | `services/api-<recurso>` (singular) | `api-program` |
| Funciones | `<action>-v<n>.js` | `create-program-v1.js` |
| Helpers | `helpers/<verbo>-<objeto>.js` | `get-global-config.js` |
| Variables / funciones | inglés | `parseEventBody` |
| Documentación JSDoc | español | `@description Crea un programa` |

### Estructura estándar de servicio Node.js

```
services/api-<resource>/
├── functions/
│   ├── <action>-v1.js
│   └── <action>-v2.js     # Si hay nueva versión
├── validators/
│   └── validate-<resource>-payload.js
├── mappers/
│   └── map-<resource>-item.js
├── serverless.yml
└── README.md
```

### Flujo obligatorio en handlers Node.js

1. Parsear evento (`parseEventBody`)
2. Validar payload (validator dedicado)
3. Transformar/mapear datos (mapper)
4. Persistir o ejecutar acción principal
5. Retornar vía `success()` / `unsuccessful()`

### Ejemplo de handler Node.js

```javascript
import { uuidv7 } from 'uuidv7';
import * as dynamoDbLib from '../../../libs/dynamodb-v3.js';
import { parseEventBody } from '../../../helpers/event-parser.js';
import { success, unsuccessful } from '../../../helpers/responses.js';

const { DYNAMODB_TABLE, TABLE_PK } = process.env;
const ACTION = 'Create resource';

/**
 * Main function to create a new resource.
 * @async
 * @function main
 * @param {Object} event - AWS Lambda event.
 * @returns {Promise<Object>} HTTP response.
 * @description
 * 1. Parsea el body del evento.
 * 2. Valida contenido mínimo.
 * 3. Genera identificador único.
 * 4. Persiste en DynamoDB.
 * 5. Retorna respuesta HTTP normalizada.
 */
export const main = async (event) => {
  try {
    const { data } = parseEventBody(event);
    if (!data) throw Object.assign(new Error('Data is required'), { statusCode: 400 });

    const id = uuidv7();
    const createdAt = new Date().toISOString();

    const result = await dynamoDbLib.put({
      TableName: DYNAMODB_TABLE,
      Item: { pk: TABLE_PK, sk: `RES#${id}`, id, data, createdAt },
    });

    return success(201, result, ACTION);
  } catch (error) {
    return unsuccessful(error.statusCode || 500, error, ACTION);
  }
};
```

### Modelo de datos DynamoDB

```
Nombre tabla: <recurso>-<stage>-pri-<shortRegion>
Ejemplo:      programs-dev-pri-usw2
```

| Campo | Descripción |
|---|---|
| `pk` | Partition Key — identifica el tipo de entidad |
| `sk` | Sort Key — identifica el elemento específico |
| `createdAt` | ISO timestamp de creación |
| `updatedAt` | ISO timestamp de última actualización |

**Billing:** `PAY_PER_REQUEST` · **DeletionPolicy:** `Retain`

### Configuración DynamoDB en serverless.yml

```yaml
provider:
  name: aws
  runtime: nodejs20.x
  tracing:
    lambda: true
  deploymentBucket:
    name: sls-deploys-${self:custom.stage}-pri-${self:custom.shortRegion}
  iamRoleStatements:
    - ${file(../../aws/policies/lambda-policy-xray.yml)}
    - ${file(../../aws/policies/lambda-policy-dynamodb-<resource>.yml)}
```

### Generación de documentos PDF

```javascript
import { generateDocument } from '../../libs/document-generator.js';

const result = await generateDocument({
  scope: 'CTT',           // CTT | DBA | DBR
  form: documentData,
  action: {
    isPreview: false,     // true = marca de agua BORRADOR
    hasSigned: true,      // true = sin firmas desde S3
    hasHeaderFooter: false
  },
  bucket: process.env.BUCKET_INFO_GI
});

if (result.success) {
  const pdfBase64 = result.base64;
}
```

> Lambdas que generan PDFs requieren `memorySize: 1024` y `timeout: 30`.

### Storage S3 — convenciones de paths

| Tipo | Path |
|---|---|
| Contratos | `contracts/{programId}/{version}.pdf` |
| Comprobantes de pago | `comprobantes/{paymentId}.pdf` |
| Firmas | `signatures/{dni}.png` |
| Assets | `assets/{filename}` |
| Exports | `exports/{type}/{timestamp}.{ext}` |

### Manejo de configuración global

```javascript
// Node.js
import { getGlobalConfig } from '../../helpers/get-global-config.js';
const config = await getGlobalConfig('PAYMENT_CONFIG');
```

### Secretos y variables sensibles

- Nunca hardcodear secretos en código
- Usar **AWS Secrets Manager** (`libs/secret-manager.js`) para secretos
- Usar **AWS SSM Parameter Store** (`libs/ssm.js`) para configuración no sensible
- Variables de entorno para configuración por stage

### Autorización y autenticación

- **Authorizer**: Lambda centralizada en `job-authorizer/`
- **Token**: JWT firmado con bcryptjs
- **TTL**: `resultTtlInSeconds: 0` (sin caché para evitar inconsistencias)
- **Contexto inyectado**: `userId`, `role`, `profile`
- **Secret**: desde AWS Secrets Manager (`SECRET_KEY`)

---

## Convenciones Go (api-configuration)

### Stack tecnológico

- **Runtime**: Go 1.24
- **HTTP Router**: Echo v4
- **AWS SDK**: aws-sdk-go-v2
- **Logging**: zap (estructurado)
- **Validación**: go-playground/validator/v10

### Arquitectura funcional

```
cmd/
  <handler>/main.go       # Entry point Lambda
  local-server/main.go    # Entry point local
internal/
  api/<feature>/
    router.go             # Rutas HTTP
    handler.go            # Adaptadores HTTP → Lógica
    service.go            # Lógica de negocio (funciones puras)
    repository/           # Acceso a datos
  middleware/
shared/
  apperr/                 # Errores HTTP de dominio
  database/               # Cliente DynamoDB global
  logger/                 # Logger zap global
```

### Ejemplo de handler Go

```go
func GetConfig(c echo.Context) error {
    ctx := c.Request().Context()
    log := logger.FromContext(ctx)

    result, err := GetGlobalConfig(ctx)
    if err != nil {
        if appErr, ok := err.(*apperr.AppError); ok {
            return c.JSON(appErr.StatusCode, map[string]string{"error": appErr.Message})
        }
        log.Error("Internal error", zap.Error(err))
        return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Internal error"})
    }

    return c.JSON(http.StatusOK, result)
}
```

### Reglas no negociables — Go

1. **Paradigma funcional**: funciones puras, sin OOP para lógica de negocio
2. **Estado global**: clientes AWS, logger y config son globales
3. **Logging** solo con `zap` — nunca `fmt.Println`
4. **Error wrapping** siempre con `%w` para preservar stack trace
5. **Sin DI compleja**: sin factories ni closures para inyección
6. **Validación** con `validator` en structs de entrada

### Reglas no negociables — Node.js

1. **DRY**: bloque repetido 2 veces → extraer a helper
2. **JSDoc** obligatorio en español con `@description`
3. **Respuestas HTTP** siempre con `success()` / `unsuccessful()`
4. **DynamoDB** siempre `PAY_PER_REQUEST`, `DeletionPolicy: Retain`
5. **Errores** con `statusCode` para respuestas HTTP correctas
6. **Free Tier**: advertir explícitamente si se sale de la capa gratuita

---

## Checklist antes de commit

**Node.js:**
- [ ] Sin código duplicado (DRY)
- [ ] Helpers reutilizados o creados correctamente
- [ ] JSDoc en español completo
- [ ] Variables y funciones en inglés
- [ ] Uso exclusivo de servicios Free Tier (o advertencia)
- [ ] DynamoDB en `PAY_PER_REQUEST`
- [ ] Respuestas HTTP normalizadas (`success` / `unsuccessful`)
- [ ] Errores con `statusCode`

**Go:**
- [ ] Funciones puras sin simulación de OO
- [ ] Logging estructurado con `zap`
- [ ] Error wrapping con `%w`
- [ ] Validación con `validator` tags
- [ ] Sin DI compleja
- [ ] Tests unitarios si corresponde

**Ambos:**
- [ ] `.gitignore` actualizado si es necesario
- [ ] Variables sensibles en Secrets Manager
- [ ] Logs mínimos y controlados
- [ ] AWS X-Ray habilitado

---

## Costos y Free Tier

### Servicios preferidos (dentro del Free Tier)

- Lambda — 1M invocaciones/mes
- DynamoDB PAY_PER_REQUEST — bajo volumen
- S3 — primeros 5 GB
- CloudWatch Logs — retención 7 días

### Servicios restringidos (requieren confirmación previa)

- Step Functions
- EventBridge (uso intensivo)
- SES en producción
- RDS / Aurora
- OpenSearch
- Cognito (pools grandes)

> **Regla crítica:** si una solución requiere salir del Free Tier, indicarlo explícitamente y esperar confirmación antes de implementar.

---

## Recursos adicionales

- [DEPLOYMENT.md](DEPLOYMENT.md) — Guía detallada de deploy
- [MEJORAS-ARQUITECTURA.md](MEJORAS-ARQUITECTURA.md) — Roadmap técnico
- [LAMBDA-POWER-TUNING.md](LAMBDA-POWER-TUNING.md) — Optimización de memoria
- [.claude/](.claude/) — Guías de desarrollo para Claude Code
- [docs/](docs/) — Documentación técnica adicional

---

**Última actualización:** 2026-02-23
**Versión:** 3.0 (Node.js + Go · Serverless Framework v4)
**Autor:** Nicolás Améstica Vidal
