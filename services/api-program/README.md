# api-program — Gestión de Programas

Servicio de gestión del ciclo de vida completo de programas de giras educacionales. Maneja creación, aprobación, confirmación, rechazo y completación de programas, además de la generación de PDFs y envío de emails asociados.

**Nombre SLS:** `programas` · **Runtime:** Node.js 20.x (ARM64) · **Framework:** Serverless v4

---

## Endpoints

| Método | Ruta | Handler | Descripción |
|---|---|---|---|
| `GET` | `/v1/programas` | `get-programs-view-v1` | Listar todos los programas |
| `GET` | `/v1/programas/{programId}` | `get-program-v1` | Obtener programa por ID |
| `POST` | `/v1/programas/crear` | `create-program-v1` | Crear nuevo programa |
| `PUT` | `/v1/programas/actualizar` | `update-program-v1` | Actualizar programa existente |
| `POST` | `/v1/programas/completar` | `complete-program-v1` | Completar programa |
| `POST` | `/v1/programas/rechazar` | `reject-program-v1` | Rechazar programa |
| `POST` | `/v1/programas/aprobar` | `approve-program-v1` | Aprobar programa (genera PDF, envía email, crea usuario) |
| `POST` | `/v1/programas/confirmar` | `confirm-program-v1` | Confirmar programa (genera PDF) |
| `GET` | `/v1/programas/monedas/tasas` | `get-currency-rates-v1` | Tasas de cambio USD/BRL frente a CLP |

---

## Funciones Lambda

### `get-programs-view-v1`
Retorna la lista de todos los programas registrados en el sistema. Aplica proyección de atributos para optimizar la respuesta.

### `get-program-v1`
Obtiene un programa específico por `programId`. Lanza error 404 si no existe.

### `create-program-v1`
Crea un nuevo programa con estado inicial `DRAFT`. Genera un UUID v7 como identificador.

### `update-program-v1`
Actualiza los datos de un programa existente. Requiere `programId` en el payload.

### `complete-program-v1`
Transiciona el programa al estado `COMPLETED`.

### `reject-program-v1`
Transiciona el programa al estado `REJECTED`.

### `approve-program-v1`
Aprueba el programa (`APPROVED`). Realiza las siguientes operaciones:
1. Genera contrato PDF
2. Almacena el PDF en S3
3. Crea cuenta de usuario con permisos
4. Envía email de notificación

> `memorySize: 1024` · `timeout: 30s`

### `confirm-program-v1`
Confirma el programa (`CONFIRMED`) y genera el PDF de confirmación.

> `memorySize: 1024` · `timeout: 30s`

### `get-currency-rates-v1`
Obtiene las tasas de cambio de USD y BRL frente al peso chileno (CLP) en una sola llamada a una API externa.

> `timeout: 15s`

---

## Ciclo de vida de un programa

```
DRAFT → PENDING_APPROVAL → APPROVED → CONFIRMED → COMPLETED
                         ↘ REJECTED
```

| Estado | Descripción |
|---|---|
| `DRAFT` | Programa creado, pendiente de completar |
| `PENDING_APPROVAL` | En revisión para aprobación |
| `APPROVED` | Aprobado — PDF y usuario creados |
| `CONFIRMED` | Confirmado — PDF de confirmación generado |
| `COMPLETED` | Finalizado |
| `REJECTED` | Rechazado |

---

## Modelo de datos (DynamoDB)

**Tabla:** `programs-<stage>-pri-<shortRegion>`

```javascript
{
  pk: "PRG#8e3d823d-9f58-45df-8a8f-6779435a0001",  // Constante PROGRAM_TABLE
  sk: "PRG#<uuid-v7>",
  id: "uuid-v7",
  name: "Gira a Argentina 2025",
  status: "DRAFT | PENDING_APPROVAL | APPROVED | CONFIRMED | REJECTED | COMPLETED",
  startDate: "2025-03-01",
  endDate: "2025-03-15",
  // ... datos del programa
  createdAt: "2025-02-01T10:00:00Z",
  updatedAt: "2025-02-01T10:00:00Z"
}
```

---

## Variables de entorno

| Variable | Descripción |
|---|---|
| `DYNAMODB_PROGRAM_TABLE` | Tabla DynamoDB de programas |
| `DYNAMODB_USER_TABLE` | Tabla DynamoDB de usuarios |
| `PROGRAM_TABLE` | PK constante de la tabla de programas |
| `BUCKET_INFO_GI` | Bucket S3 para almacenar PDFs |
| `EMAIL_CONFIG_SECRET_KEY` | Clave del secreto con credenciales de email |
| `SECRET_KEY` | Clave del secreto JWT |
| `STAGE` | Entorno de ejecución |

---

## IAM Policies utilizadas

- `lambda-policy-xray.yml` — AWS X-Ray
- `lambda-policy-ssm.yml` — Parameter Store
- `lambda-policy-secretsmanager.yml` — Secrets Manager
- `lambda-policy-dynamodb-program.yml` — DynamoDB (tabla programas)
- `lambda-policy-dynamodb-user.yml` — DynamoDB (tabla usuarios)
- `lambda-policy-s3.yml` — S3

---

## Desarrollo local

```bash
# Desde raíz del proyecto
npm start

# Deploy del servicio
cd services/api-program
AWS_PROFILE=pa-dev serverless deploy --stage dev --region us-west-2

# Ver logs de una función
serverless logs --function approve_program_v1 --stage dev
```

---

**Última actualización:** 2026-02-23
