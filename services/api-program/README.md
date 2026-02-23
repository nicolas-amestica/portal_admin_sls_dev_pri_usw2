# api-program — Gestión de Programas

Servicio de gestión del ciclo de vida completo de programas de giras educacionales. Maneja creación, aprobación, confirmación, rechazo y completación de programas, además de la generación de PDFs y envío de emails asociados.

**Nombre SLS:** `programas` · **Runtime:** Node.js 20.x (ARM64) · **Framework:** Serverless v4

---

## Endpoints

| Método | Ruta | Handler | Descripción |
|---|---|---|---|
| `GET` | `/v1/programas` | `get-programs-view-v1` | Listar programas (filtro por periodo) |
| `GET` | `/v1/programas/{sk}` | `get-program-v1` | Obtener programa por SK |
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
Retorna la lista de programas. Soporta filtro por período (año del viaje).

**Query Parameters:**
- `periodo` (opcional): Año del programa — ej. `2025`

```
GET /v1/programas?periodo=2025
```

### `get-program-v1`
Obtiene un programa específico por su SK (sort key). Lanza error 404 si no existe.

```
GET /v1/programas/PRG%238e3d823d-9f58-45df-8a8f-6779435a0001
```

> El SK debe ir **URL-encoded** en el path.

### `create-program-v1`
Crea un nuevo programa con estado inicial `DRAFT`. Genera un UUID v7 como identificador.

**Body:**
```json
{
  "requestType": "NATIONAL | INTERNATIONAL",
  "content": [{
    "name": "Gira a Argentina 2025",
    "type": { "id": "tipo-id", "label": "Tipo" },
    "school": "Colegio San Ignacio",
    "course": "4° Medio",
    "representative": { "name": "Juan Pérez", "phone": "+56912345678", "email": "juan@example.com" },
    "season": "2025",
    "dates": ["2025-03-01", "2025-03-15"],
    "days": 15,
    "nightsStay": 14,
    "passengers": 40,
    "crews": [...],
    "services": [...],
    "rates": { "usd": 950, "brl": 185 },
    "payments": [...]
  }]
}
```

### `update-program-v1`
Actualiza los datos de un programa existente. Requiere `pk`, `sk` e `id` en el payload.

**Body:**
```json
{
  "pk": "PRG#8e3d823d-9f58-45df-8a8f-6779435a0001",
  "sk": "PRG#<uuid-v7>",
  "id": "uuid-v7",
  "requestType": "INTERNATIONAL",
  "content": [{ "...campos actualizados..." }]
}
```

### `complete-program-v1`
Transiciona el programa al estado `COMPLETED`.

**Body:**
```json
{ "sk": "PRG#<uuid-v7>" }
```

### `reject-program-v1`
Transiciona el programa al estado `REJECTED`. Puede incluir motivo.

**Body:**
```json
{
  "sk": "PRG#<uuid-v7>",
  "reason": "Motivo del rechazo"
}
```

### `approve-program-v1`
Aprueba el programa (`APPROVED`). Realiza:
1. Genera contrato PDF
2. Almacena el PDF en S3
3. Crea cuenta de usuario cliente
4. Envía email de notificación

**Body:**
```json
{
  "sk": "PRG#<uuid-v7>",
  "formContact": {
    "name": "Juan Pérez",
    "email": "juan@example.com",
    "phone": "+56912345678"
  }
}
```

> `memorySize: 1024` · `timeout: 30s`

### `confirm-program-v1`
Confirma el programa (`CONFIRMED`) y genera el PDF de confirmación.

**Body:**
```json
{ "sk": "PRG#<uuid-v7>" }
```

> `memorySize: 1024` · `timeout: 30s`

### `get-currency-rates-v1`
Obtiene las tasas de cambio de USD y BRL frente al peso chileno (CLP) en una sola llamada a una API externa. Usadas para calcular precios con tripulación/servicios en moneda extranjera.

**Respuesta:**
```json
{
  "state": true,
  "metadata": { "statusCode": 200, "action": "Obtener tasas de cambio." },
  "data": {
    "usd": 950.25,
    "brl": 185.50
  }
}
```

> `timeout: 15s`

---

## Ciclo de vida de un programa

```
DRAFT → [completar formulario] → PENDING_APPROVAL → [aprobar] → APPROVED → [confirmar] → CONFIRMED → [completar] → COMPLETED
                                                  ↘ [rechazar] → REJECTED
```

| Estado | Descripción |
|---|---|
| `DRAFT` | Programa creado, pendiente de completar |
| `PENDING_APPROVAL` | En revisión para aprobación |
| `APPROVED` | Aprobado — PDF y usuario cliente creados, email enviado |
| `CONFIRMED` | Confirmado — PDF de confirmación generado |
| `COMPLETED` | Finalizado |
| `REJECTED` | Rechazado con motivo |

---

## Modelo de datos (DynamoDB)

**Tabla:** `programs-<stage>-pri-<shortRegion>`

```javascript
{
  pk: "PRG#8e3d823d-9f58-45df-8a8f-6779435a0001",  // Constante PROGRAM_TABLE
  sk: "PRG#<uuid-v7>",
  id: "uuid-v7",
  requestType: "NATIONAL | INTERNATIONAL",
  status: "DRAFT | PENDING_APPROVAL | APPROVED | CONFIRMED | REJECTED | COMPLETED",
  content: [{
    name: "Gira a Argentina 2025",
    school: "Colegio San Ignacio",
    course: "4° Medio",
    season: "2025",
    dates: ["2025-03-01", "2025-03-15"],
    days: 15,
    passengers: 40,
    crews: [...],      // Tripulación con precios en USD/BRL/CLP
    services: [...],   // Servicios con precios
    rates: { usd: 950, brl: 185 },
    pricePerPassenger: 250000,
    total: 10000000,
    payments: [...]
  }],
  contract: {
    sk: "CTT#<uuid-v7>",
    pdfPath: "contracts/<programId>/CTT-v1.pdf"
  },
  createdAt: "2025-02-01T10:00:00Z",
  updatedAt: "2025-02-01T10:00:00Z"
}
```

---

## Estructura de tripulación y servicios

### Crew (tripulación)
```typescript
interface Crew {
  name: string;
  dni: string;
  type: { id: string; label: string } | null;
  price: number;
  currency: { id: string; label: string };  // CLP | USD | BRL
  exchange: number;   // Tasa de cambio aplicada
  exempt: boolean;    // Exento de IVA
  iva: number;        // Monto IVA calculado
  subTotal: number;
  total: number;
}
```

### Service (servicio)
```typescript
interface Service {
  name: string;
  type: { id: string; label: string };
  price: number;
  currency: { id: string; label: string };  // CLP | USD | BRL
  exchange: number;
  exempt: boolean;
  iva: number;
  subTotal: number;
  total: number;
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
| `EMAIL_CONFIG_SECRET_KEY` | Nombre del secreto con credenciales de email |
| `SECRET_KEY` | Nombre del secreto JWT |
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

# Ver logs
serverless logs --function approve_program_v1 --stage dev
```

---

**Última actualización:** 2026-02-23
