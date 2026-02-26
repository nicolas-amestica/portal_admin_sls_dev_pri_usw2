# Reporte de Infraestructura AWS — Portal Admin Giras Indómito

> Generado el: 2026-02-26
> Framework: Serverless Framework v4
> Runtime: Node.js 20.x (arm64) / Go (provided.al2023, arm64)
> Región por defecto: `us-west-2`

---

## Índice

1. [Convención de nombres](#1-convención-de-nombres)
2. [Scripts de infraestructura](#2-scripts-de-infraestructura)
3. [Orden de despliegue](#3-orden-de-despliegue)
4. [Recursos por tipo](#4-recursos-por-tipo)
   - [4.1 S3 Buckets](#41-s3-buckets)
   - [4.2 Secrets Manager](#42-secrets-manager)
   - [4.3 DynamoDB — Tablas e índices](#43-dynamodb--tablas-e-índices)
   - [4.4 API Gateway](#44-api-gateway)
   - [4.5 Lambdas por servicio](#45-lambdas-por-servicio)
   - [4.6 IAM Policies](#46-iam-policies)
5. [Variables de entorno por servicio](#5-variables-de-entorno-por-servicio)
6. [Guía de migración a nueva cuenta](#6-guía-de-migración-a-nueva-cuenta)
7. [Diagrama de dependencias](#7-diagrama-de-dependencias)

---

## 1. Convención de nombres

Todos los recursos siguen el patrón:

```
{recurso}-{stage}-pri-{shortRegion}
```

| Variable        | Ejemplo `dev`        | Ejemplo `prod`        |
|-----------------|----------------------|-----------------------|
| `{stage}`       | `dev`                | `prod`                |
| `{shortRegion}` | `usw2` (us-west-2)   | `usw2`                |
| Perfil AWS      | `pa-dev`             | `pa-prod`             |

### Siglas de región disponibles

| Región AWS    | Sigla  |
|---------------|--------|
| us-east-1     | use1   |
| us-east-2     | use2   |
| us-west-1     | usw1   |
| us-west-2     | usw2   |
| sa-east-1     | sae1   |

---

## 2. Scripts de infraestructura

| Script                       | Propósito |
|------------------------------|-----------|
| `scripts/bootstrap.sh`       | Crea todos los recursos AWS necesarios **antes** del primer despliegue |
| `scripts/teardown.sh`        | Elimina todos los recursos de un stage completo (irreversible) |

### Uso rápido

```bash
# Desplegar desde cero en dev
./scripts/bootstrap.sh dev us-west-2

# Desplegar desde cero en producción
./scripts/bootstrap.sh prod us-west-2

# Eliminar entorno dev completamente
./scripts/teardown.sh dev us-west-2
```

---

## 3. Orden de despliegue

El orden importa por las dependencias entre stacks de CloudFormation:

```
1. bootstrap.sh            ← Crea recursos manuales (S3, Secrets, DynamoDB)
2. infrastructure/          ← API Gateway HTTP compartido (exporta HttpApiId)
3. services/job-authorizer  ← Authorizer Lambda (exporta AuthorizerId)
4. services/api-entity      ← Usuarios/sesiones (depende de authorizer)
5. services/api-program     ← Programas
6. services/api-balance     ← Balances
7. services/api-contract    ← Contratos
8. services/api-extraction  ← Extracciones
9. services/api-maintainer  ← Mantenedor (bancos)
10. services/api-notification ← Notificaciones
11. services/api-payment    ← Pagos (Transbank)
12. services/api-configuration ← Configuración global (Go)
```

### Script de despliegue completo

```bash
STAGE=dev
REGION=us-west-2

./scripts/bootstrap.sh $STAGE $REGION

(cd infrastructure           && sls deploy --stage $STAGE --region $REGION)
(cd services/job-authorizer  && sls deploy --stage $STAGE --region $REGION)
(cd services/api-entity      && sls deploy --stage $STAGE --region $REGION)
(cd services/api-program     && sls deploy --stage $STAGE --region $REGION)
(cd services/api-balance     && sls deploy --stage $STAGE --region $REGION)
(cd services/api-contract    && sls deploy --stage $STAGE --region $REGION)
(cd services/api-extraction  && sls deploy --stage $STAGE --region $REGION)
(cd services/api-maintainer  && sls deploy --stage $STAGE --region $REGION)
(cd services/api-notification && sls deploy --stage $STAGE --region $REGION)
(cd services/api-payment     && sls deploy --stage $STAGE --region $REGION)
(cd services/api-configuration && sls deploy --stage $STAGE --region $REGION)
```

---

## 4. Recursos por tipo

### 4.1 S3 Buckets

| Nombre del bucket (dev/usw2)             | Propósito | Creado por |
|------------------------------------------|-----------|------------|
| `sls-deploys-dev-pri-usw2`               | Artefactos de despliegue de Serverless Framework (zips de Lambdas, CloudFormation templates). **Requerido antes del primer `sls deploy`.** | `bootstrap.sh` |
| `giras-indomito-dev-info`                | Almacenamiento de documentos de negocio: PDFs de contratos, comprobantes de pago, archivos de programas. | `bootstrap.sh` |

#### Estructura de carpetas en `giras-indomito-{stage}-info`

```
giras-indomito-dev-info/
├── contratos/          ← PDFs de contratos generados
├── programas/          ← Documentos de programas
└── comprobantes/       ← Comprobantes de pago (api-payment)
```

#### Configuración aplicada por bootstrap

- ✅ Block Public Access (todas las opciones activadas)
- ✅ Versionado habilitado

---

### 4.2 Secrets Manager

| Nombre del secreto (dev/usw2)                     | Servicio(s) que lo usan | Contenido esperado |
|---------------------------------------------------|-------------------------|--------------------|
| `secret-pri-dev-usw2`                             | api-entity, api-program, api-balance, api-contract, api-extraction, api-notification, api-payment, job-authorizer | `{"jwtSecret":"<clave_jwt_minimo_32_chars>"}` |
| `email-config-dev-pri-usw2`                       | api-entity, api-program, api-notification, api-payment | `{"host":"smtp.example.com","port":587,"user":"...","pass":"...","from":"noreply@example.com"}` |
| `transbank-api-key-dev-pri-usw2`                  | api-payment | `{"apiKey":"<api_key_transbank>","commerceCode":"<commerce_code>"}` |

> **Nota:** El `bootstrap.sh` crea los secretos con valores placeholder. Deben reemplazarse con valores reales antes de desplegar los Lambdas.

#### Cómo actualizar los secretos

```bash
PROFILE=pa-dev
REGION=us-west-2

# JWT Secret
aws secretsmanager update-secret \
  --secret-id "secret-pri-dev-usw2" \
  --secret-string '{"jwtSecret":"tu_clave_jwt_segura_aqui"}' \
  --profile $PROFILE --region $REGION

# Email Config
aws secretsmanager update-secret \
  --secret-id "email-config-dev-pri-usw2" \
  --secret-string '{"host":"smtp.gmail.com","port":587,"user":"tu@email.com","pass":"tu_password","from":"Portal Admin <noreply@girasindomito.com>"}' \
  --profile $PROFILE --region $REGION

# Transbank (solo necesario en producción; dev usa credenciales de integración hardcodeadas)
aws secretsmanager update-secret \
  --secret-id "transbank-api-key-dev-pri-usw2" \
  --secret-string '{"apiKey":"tu_api_key","commerceCode":"tu_commerce_code"}' \
  --profile $PROFILE --region $REGION
```

---

### 4.3 DynamoDB — Tablas e índices

#### Tabla: `programs-{stage}-pri-{shortRegion}`

**Servicio(s):** api-program, api-balance, api-contract, api-extraction, api-notification

| Atributo | Tipo | Rol |
|----------|------|-----|
| `pk`     | S    | Hash Key (Partition Key) |
| `sk`     | S    | Range Key (Sort Key) |
| `gsiOne` | S    | GSI Hash Key |
| `startDate` | S | GSI Range Key |

**Partition Key pattern:** `PRG#8e3d823d-9f58-45df-8a8f-6779435a0001` (ID fijo de tabla de programas)
**Sort Key pattern:** `{sk_del_programa}` (identificador único del programa)

**GSI configurados:**

| Índice | PK | SK | Uso |
|--------|----|----|-----|
| `gsiOne-index` | `gsiOne` (S) | — | Búsqueda de usuarios por DNI al aprobar programa |
| `gsiStartDate-index` | `pk` (S) | `startDate` (S) | Listar programas filtrados por periodo/fecha de inicio |

**Billing mode:** PAY_PER_REQUEST (on-demand)
**PITR:** Habilitado

---

#### Tabla: `users-{stage}-pri-{shortRegion}`

**Servicio(s):** api-entity, api-program (crear usuario al aprobar programa), api-configuration

| Atributo | Tipo | Rol |
|----------|------|-----|
| `pk`     | S    | Hash Key |
| `sk`     | S    | Range Key |
| `gsiOne` | S    | GSI Hash Key |
| `resetToken` | S | GSI Hash Key |

**Partition Key patterns:**
- `USR#<uuid>` — registros de usuario
- `PER#4f7cb502-4256-11ec-81d3-0242ac13000H` — registros de perfil de acceso

**Sort Key pattern:** identifier del item

**GSI configurados:**

| Índice | PK | SK | Uso |
|--------|----|----|-----|
| `gsiOne-index` | `gsiOne` (S) | — | Login y búsqueda por RUT/username |
| `resetToken-index` | `resetToken` (S) | — | Reset de contraseña por token temporal |

**Billing mode:** PAY_PER_REQUEST
**PITR:** Habilitado

---

#### Tabla: `config-{stage}-pri-{shortRegion}`

**Servicio(s):** api-entity (login para obtener config global), api-configuration

| Atributo | Tipo | Rol |
|----------|------|-----|
| `pk`     | S    | Hash Key |
| `sk`     | S    | Range Key |

Sin GSI. Tabla simple de configuración clave-valor global del portal.

**Billing mode:** PAY_PER_REQUEST
**PITR:** Habilitado

---

#### Tabla: `payments-{stage}-pri-{shortRegion}`

**Servicio(s):** api-payment

| Atributo | Tipo | Rol |
|----------|------|-----|
| `pk`     | S    | Hash Key |
| `sk`     | S    | Range Key |
| `gsiOne` | S    | GSI Hash Key |
| `gsiTwo` | S    | GSI Hash Key |
| `gsiThree` | S  | GSI Hash Key |

**Partition Key pattern:** `PAY#{paymentId}` (UUID v7)
**Sort Key pattern:** `PAY#{programId}`

**GSI configurados:**

| Índice | PK | SK | Uso | Valor |
|--------|----|----|-----|-------|
| `sk-index` | `sk` (S) | — | Obtener todos los pagos de un programa | `PAY#{programId}` |
| `gsiOne-index` | `gsiOne` (S) | — | Verificar pago por cuota específica | `{programId}#INST#{installmentNumber}` |
| `gsiTwo-index` | `gsiTwo` (S) | — | Pagos por usuario | `{userId}` |
| `gsiThree-index` | `gsiThree` (S) | — | Búsqueda por token Transbank (confirm) | `{token_transbank}` |

**Billing mode:** PAY_PER_REQUEST
**PITR:** Habilitado

**Estados posibles del campo `status`:**
- `PENDING` — Transacción creada, esperando pago
- `AUTHORIZED` — Pago confirmado por Transbank
- `FAILED` — Pago rechazado
- `EXPIRED` — PENDING antiguo (>30 min)
- `CANCELLED` — Cancelado por el usuario

---

#### Tabla: `maintainer-{stage}-pri-{shortRegion}`

**Servicio(s):** api-maintainer

| Atributo | Tipo | Rol |
|----------|------|-----|
| `pk`     | S    | Hash Key |
| `sk`     | S    | Range Key |

**Partition Key pattern:** `BNK#ACCOUNT` (catálogo de bancos)
Sin GSI. Tabla de datos de referencia/catálogos.

**Billing mode:** PAY_PER_REQUEST
**PITR:** Habilitado

---

### 4.4 API Gateway

| Recurso | Nombre | Tipo | Creado por |
|---------|--------|------|------------|
| API HTTP | `portal-admin-{stage}` | HTTP API (v2) | `infrastructure/serverless.yml` |
| Stage | `$default` | API Stage (auto-deploy) | `infrastructure/serverless.yml` |
| Authorizer | `{stage}-shared-authorizer` | REQUEST authorizer | `services/job-authorizer/serverless.yml` |
| Log Group | `/aws/apigateway/portal-admin-{stage}` | CloudWatch Logs (7 días) | `infrastructure/serverless.yml` |

**CORS configurado globalmente:**
- Origins: `*`
- Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS
- Headers: Content-Type, Authorization, X-Amz-Date, X-Api-Key, X-Amz-Security-Token, X-Amz-User-Agent, X-Correlation-Id
- MaxAge: 300 segundos

**Throttling global:**
- Burst limit: 5.000 req/s
- Rate limit: 10.000 req/s

**Exports de CloudFormation:**
- `portal-admin-{stage}-api-id` → ID del API (importado por todos los servicios)
- `portal-admin-{stage}-api-url` → URL base del API
- `portal-admin-{stage}-api-arn` → ARN del API

---

### 4.5 Lambdas por servicio

#### `job-authorizer` — Autorizador compartido

| Lambda | Handler | Evento |
|--------|---------|--------|
| `auth` | `authorizer.authorize` | POST `/v1/autorizador` |
| `getToken` | `authorizer.generateToken` | POST `/v1/accesos` |

**Exports:** `{stage}-AuthorizerId`, `{stage}-authArn`

---

#### `api-entity` (service: `usuarios`) — Sesiones y accesos

| Lambda | Handler | Método | Ruta | Auth |
|--------|---------|--------|------|------|
| `login` | `functions/login-v1.main` | POST | `/v1/sesiones/iniciar-sesion` | ❌ Pública |
| `forgot_password_v1` | `functions/forgot-password-v1.main` | POST | `/v1/sesiones/recuperar-clave` | ❌ Pública |
| `reset_password_v1` | `functions/reset-password-v1.main` | POST | `/v1/sesiones/restablecer-clave` | ❌ Pública |
| `get_access_v1` | `functions/get-access-v1.main` | GET | `/v1/iam/accesos/aplicaciones/GI/user` | ✅ JWT |

---

#### `api-program` (service: `programas`) — Gestión de programas

| Lambda | Handler | Método | Ruta | Auth |
|--------|---------|--------|------|------|
| `get_programs_v1` | `functions/get-programs-view-v1.main` | GET | `/v1/programas` | ✅ JWT |
| `get_program_v1` | `functions/get-program-v1.main` | GET | `/v1/programas/{programId}` | ✅ JWT |
| `create_program_v1` | `functions/create-program-v1.main` | POST | `/v1/programas/crear` | ✅ JWT |
| `update_program_v1` | `functions/update-program-v1.main` | PUT | `/v1/programas/actualizar` | ✅ JWT |
| `complete_program_v1` | `functions/complete-program-v1.main` | POST | `/v1/programas/completar` | ✅ JWT |
| `reject_program_v1` | `functions/reject-program-v1.main` | POST | `/v1/programas/rechazar` | ✅ JWT |
| `approve_program_v1` | `functions/approve-program-v1.main` | POST | `/v1/programas/aprobar` | ✅ JWT |
| `confirm_program_v1` | `functions/confirm-program-v1.main` | POST | `/v1/programas/confirmar` | ✅ JWT |
| `get_currency_rates_v1` | `functions/get-currency-rates-v1.main` | GET | `/v1/programas/monedas/tasas` | ✅ JWT |

---

#### `api-balance` (service: `balances`) — Balances de programas

| Lambda | Handler | Método | Ruta | Auth |
|--------|---------|--------|------|------|
| `create_balance_v1` | `functions/create-balance-v1.main` | POST | `/v1/balances` | ✅ JWT |
| `get_balances_v1` | `functions/get-balances-v1.main` | GET | `/v1/balances/{sk}` | ✅ JWT |

---

#### `api-contract` (service: `contratos`) — Contratos y documentos PDF

| Lambda | Handler | Método | Ruta | Auth |
|--------|---------|--------|------|------|
| `save_contract_data_v1` | `functions/save-contract-data-v1.main` | POST | `/v1/contratos/guardar` | ✅ JWT |
| `build_document_by_form_v1` | `functions/build-pdf-document-by-form-v1.main` | POST | `/v1/documentos/pdf` | ✅ JWT |
| `get_pdf_document_by_sk_v1` | `functions/get-pdf-document-by-sk-v1.main` | GET | `/v1/documentos/pdf` | ✅ JWT |
| `get_pdf_document_by_sk_from_program_v1` | `functions/build-pdf-document-by-sk-from-program-v1.main` | GET | `/v1/documentos/pdf/{sk}` | ✅ JWT |

---

#### `api-extraction` (service: `extracciones`) — Extracción de archivos S3

| Lambda | Handler | Método | Ruta | Auth |
|--------|---------|--------|------|------|
| `downloadFile` | `functions/get-object-s3-v1.main` | GET | `/v1/extracciones/object` | ✅ JWT |

---

#### `api-maintainer` (service: `mantenedor`) — Catálogos

| Lambda | Handler | Método | Ruta | Auth |
|--------|---------|--------|------|------|
| `get_banks_v1` | `functions/get-banks-v1.main` | GET | `/v1/mantenedor/bancos` | ✅ JWT |

---

#### `api-notification` (service: `notificaciones`) — Notificaciones

| Lambda | Handler | Método | Ruta | Auth |
|--------|---------|--------|------|------|
| `send_notification_contract_v1` | `functions/send-notification-v1.main` | POST | `/v1/notificaciones/contrato` | ✅ JWT |

---

#### `api-payment` (service: `pagos`) — Pagos Transbank

| Lambda | Handler | Método | Ruta | Auth |
|--------|---------|--------|------|------|
| `create_installment_payment_v1` | `functions/create-installment-payment-v1.main` | POST | `/v1/pagos/cuotas/crear` | ✅ JWT |
| `confirm_installment_payment_v1` | `functions/confirm-installment-payment-v1.main` | POST | `/v1/pagos/cuotas/confirmar` | ✅ JWT |
| `get_payments_by_program_v1` | `functions/get-payments-by-program-v1.main` | GET | `/v1/pagos/programa` | ✅ JWT |
| `get_payments_by_user_v1` | `functions/get-payments-by-user-v1.main` | GET | `/v1/pagos/usuario` | ✅ JWT |
| `cancel_installment_payment_v1` | `functions/cancel-installment-payment-v1.main` | POST | `/v1/pagos/cuotas/cancelar` | ✅ JWT |
| `create_transaction_v1` | `functions/create-transaction-v1.main` | POST | `/v1/pagos/transacciones/crear` | ✅ JWT |
| `commit_transaction_v1` | `functions/commit-transaction-v1.main` | POST | `/v1/pagos/transacciones/confirmar` | ✅ JWT |
| `get_transaction_status_v1` | `functions/get-transaction-status-v1.main` | GET | `/v1/pagos/transacciones/{token}/estado` | ✅ JWT |
| `get_transactions_v1` | `functions/get-transactions-v1.main` | GET | `/v1/pagos/transacciones` | ✅ JWT |

---

#### `api-configuration` (service: `configuracion-go`) — Configuración global (Go)

| Lambda | Handler | Método | Ruta | Auth |
|--------|---------|--------|------|------|
| `get_global_config_v1` | `bootstrap` (Go) | GET | `/v1/configuracion/global` | ✅ JWT |
| `update_global_config_v1` | `bootstrap` (Go) | POST | `/v1/configuracion/global` | ✅ JWT |

> **Nota:** Este servicio está escrito en Go y requiere compilar los binarios antes del deploy.
> Los binarios deben estar en `services/api-configuration/bin/`.

---

### 4.6 IAM Policies

Todas las políticas están en `aws/policies/` y se aplican mediante `iamRoleStatements`:

| Archivo | Acción | Recurso |
|---------|--------|---------|
| `lambda-policy-xray.yml` | `xray:PutTraceSegments`, `xray:PutTelemetryRecords` | `*` |
| `lambda-policy-ssm.yml` | `ssm:GetParameter`, `ssm:GetParameters` | `*` |
| `lambda-policy-secretsmanager.yml` | `secretsmanager:GetSecretValue` | `*` |
| `lambda-policy-dynamodb-program.yml` | `dynamodb:DescribeTable,Query,Scan,GetItem,PutItem,UpdateItem` | `programs-{stage}-pri-{region}` + índices |
| `lambda-policy-dynamodb-user.yml` | `dynamodb:DescribeTable,Query,Scan,GetItem,PutItem,UpdateItem` | `users-{stage}-pri-{region}` + índices |
| `lambda-policy-dynamodb-config.yml` | `dynamodb:GetItem,PutItem,UpdateItem,Query` | `config-{stage}-pri-{region}` + índices |
| `lambda-policy-dynamodb-maintainer.yml` | `dynamodb:DescribeTable,Query,Scan,GetItem,PutItem,UpdateItem` | `maintainer-{stage}-pri-{region}` + índices |
| `lambda-policy-s3.yml` | `s3:*` | `*` |
| `lambda-policy-cloudwatch.yml` | CloudWatch Logs | — |
| `lambda-policy-ses.yml` | SES | — |
| `lambda-policy-lambda.yml` | `lambda:InvokeFunction` | — |

> ⚠️ `lambda-policy-s3.yml` usa `s3:*` sobre `*`. En producción se recomienda restringir a los buckets específicos del proyecto.

---

## 5. Variables de entorno por servicio

| Variable | Servicios | Valor (dev/usw2) |
|----------|-----------|-----------------|
| `STAGE` | Todos | `dev` |
| `DYNAMODB_PROGRAM_TABLE` | api-program, api-balance, api-contract, api-extraction, api-notification | `programs-dev-pri-usw2` |
| `DYNAMODB_USER_TABLE` / `DYNAMODB_USERS_TABLE` | api-entity, api-program, api-extraction | `users-dev-pri-usw2` |
| `DYNAMODB_CONFIG_TABLE` | api-entity, api-configuration | `config-dev-pri-usw2` |
| `DYNAMODB_PAYMENT_TABLE` | api-payment | `payments-dev-pri-usw2` |
| `DYNAMODB_MAINTAINER_TABLE` | api-maintainer | `maintainer-dev-pri-usw2` |
| `SECRET_KEY` | Todos | `secret-pri-dev-usw2` |
| `EMAIL_CONFIG_SECRET_KEY` / `EMAIL_SECRET_KEY` | api-entity, api-program, api-notification, api-payment | `email-config-dev-pri-usw2` |
| `TRANSBANK_KEYS` / `TRANSBANK_API_KEY_SECRET` | api-payment | `transbank-api-key-dev-pri-usw2` |
| `BUCKET_INFO_GI` | api-program, api-balance, api-contract, api-extraction, api-notification, api-payment | `giras-indomito-dev-info` |
| `PROGRAM_TABLE` / `PROGRAM_TABLE_ID` | api-program, api-balance, api-contract, api-notification | `PRG#8e3d823d-9f58-45df-8a8f-6779435a0001` |
| `DYNAMODB_PK_MAINTAINER_TABLE` | api-maintainer | `BNK#ACCOUNT` |

---

## 6. Guía de migración a nueva cuenta

Pasos para llevar el proyecto completo a una cuenta AWS diferente:

### Paso 1 — Configurar perfil AWS en la nueva cuenta

```bash
aws configure --profile pa-dev
# Ingresa: Access Key, Secret Key, Región (us-west-2), formato (json)
```

### Paso 2 — Verificar acceso

```bash
aws sts get-caller-identity --profile pa-dev
```

### Paso 3 — Ejecutar bootstrap

```bash
./scripts/bootstrap.sh dev us-west-2
```

### Paso 5 — Cargar valores reales en los secretos

```bash
# Ver la sección 4.2 — Cómo actualizar los secretos
```

### Paso 6 — Desplegar en orden

```bash
STAGE=dev REGION=us-west-2

(cd infrastructure            && sls deploy --stage $STAGE --region $REGION)
(cd services/job-authorizer   && sls deploy --stage $STAGE --region $REGION)
(cd services/api-entity       && sls deploy --stage $STAGE --region $REGION)
(cd services/api-program      && sls deploy --stage $STAGE --region $REGION)
(cd services/api-balance      && sls deploy --stage $STAGE --region $REGION)
(cd services/api-contract     && sls deploy --stage $STAGE --region $REGION)
(cd services/api-extraction   && sls deploy --stage $STAGE --region $REGION)
(cd services/api-maintainer   && sls deploy --stage $STAGE --region $REGION)
(cd services/api-notification && sls deploy --stage $STAGE --region $REGION)
(cd services/api-payment      && sls deploy --stage $STAGE --region $REGION)
(cd services/api-configuration && sls deploy --stage $STAGE --region $REGION)
```

### Paso 7 — Verificar endpoints

```bash
# Obtener URL del API Gateway
aws cloudformation describe-stacks \
  --stack-name portal-admin-infrastructure-dev \
  --profile pa-dev --region us-west-2 \
  --query "Stacks[0].Outputs[?OutputKey=='HttpApiUrl'].OutputValue" \
  --output text
```

---

## 7. Diagrama de dependencias

```
┌─────────────────────────────────────────────────────────────────────┐
│                        AWS Account                                   │
│                                                                       │
│  ┌─── bootstrap.sh (recursos manuales) ────────────────────────┐     │
│  │  S3: sls-deploys-{stage}-pri-{region}                        │     │
│  │  S3: giras-indomito-{stage}-info                             │     │
│  │  SM: secret-pri-{stage}-{region}                             │     │
│  │  SM: email-config-{stage}-pri-{region}                       │     │
│  │  SM: transbank-api-key-{stage}-pri-{region}                  │     │
│  │  DDB: programs-{stage}-pri-{region}                          │     │
│  │  DDB: users-{stage}-pri-{region}                             │     │
│  │  DDB: config-{stage}-pri-{region}                            │     │
│  │  DDB: payments-{stage}-pri-{region}                          │     │
│  │  DDB: maintainer-{stage}-pri-{region}                        │     │
│  └──────────────────────────────────────────────────────────────┘     │
│            ↓                                                           │
│  ┌─── infrastructure/ ──────────────────────────────────────────┐     │
│  │  API Gateway HTTP (portal-admin-{stage})                      │     │
│  │  CloudWatch Log Group                                         │     │
│  │  Export: portal-admin-{stage}-api-id                          │     │
│  └──────────────────────────────────────────────────────────────┘     │
│            ↓                                                           │
│  ┌─── job-authorizer/ ──────────────────────────────────────────┐     │
│  │  Lambda: auth (REQUEST authorizer)                            │     │
│  │  Lambda: getToken                                             │     │
│  │  ApiGatewayV2::Authorizer                                     │     │
│  │  Export: {stage}-AuthorizerId                                 │     │
│  └──────────────────────────────────────────────────────────────┘     │
│            ↓ (todos los servicios dependen del authorizer)            │
│  ┌── api-entity ──┐  ┌── api-program ──┐  ┌── api-payment ──┐        │
│  │ users table    │  │ programs table  │  │ payments table  │        │
│  │ config table   │  │ users table     │  │ Transbank SDK   │        │
│  └────────────────┘  └─────────────────┘  └─────────────────┘        │
│  ┌── api-balance ─┐  ┌── api-contract ─┐  ┌── api-maintainer ┐       │
│  │ programs table │  │ programs table  │  │ maintainer table│        │
│  │ S3 bucket      │  │ S3 bucket       │  └─────────────────┘        │
│  └────────────────┘  └─────────────────┘                             │
│  ┌── api-notification ┐  ┌── api-extraction ┐  ┌── api-configuration┐ │
│  │ programs table     │  │ programs table   │  │ config table      │ │
│  │ S3 bucket          │  │ users table      │  │ users table       │ │
│  │ SES / email        │  │ S3 bucket        │  │ (Go runtime)      │ │
│  └────────────────────┘  └──────────────────┘  └───────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Checklist de despliegue inicial

- [ ] Perfil AWS `pa-{stage}` configurado
- [ ] `./scripts/bootstrap.sh {stage} {region}` ejecutado sin errores
- [ ] Secrets actualizados con valores reales (JWT, email, Transbank)
- [ ] `infrastructure/` deployado → API Gateway creado
- [ ] `services/job-authorizer/` deployado → Authorizer disponible
- [ ] Servicios restantes deployados en cualquier orden
- [ ] URL del API Gateway obtenida y configurada en el frontend
- [ ] Test de login funcional: `POST /v1/sesiones/iniciar-sesion`
