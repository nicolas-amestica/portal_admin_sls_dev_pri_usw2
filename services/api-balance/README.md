# api-balance — Gestión de Balances y Cuotas

Servicio para la gestión de balances financieros asociados a programas de giras educacionales.

**Nombre SLS:** `balances` · **Runtime:** Node.js 20.x · **Framework:** Serverless v4

---

## Endpoints

| Método | Ruta | Handler | Descripción |
|---|---|---|---|
| `POST` | `/v1/balances/solicitudes/balance` | `create-balance-v1` | Crear un balance para un programa |
| `GET` | `/v1/balances/solicitudes/balance` | `get-balances-v1` | Obtener balances de un programa |

---

## Funciones Lambda

### `create-balance-v1`
Crea un nuevo balance asociado a un programa. Un balance puede incluir cuotas de pago, montos parciales y fechas de vencimiento.

**Body:**
```json
{
  "programId": "uuid-v7",
  "amount": 500000,
  "installments": [
    {
      "installmentNumber": 1,
      "amount": 150000,
      "dueDate": "2025-03-01"
    },
    {
      "installmentNumber": 2,
      "amount": 150000,
      "dueDate": "2025-04-01"
    }
  ],
  "description": "Balance programa Gira Argentina 2025"
}
```

**Respuesta:**
```json
{
  "state": true,
  "metadata": { "statusCode": 201, "action": "Crear balance." },
  "data": {
    "balanceId": "uuid-v7",
    "programId": "uuid-v7",
    "status": "ACTIVE"
  }
}
```

### `get-balances-v1`
Obtiene los balances asociados a un programa, incluyendo el estado de cada cuota.

**Query Parameters:**
- `programId` (requerido): ID del programa

**Respuesta:**
```json
{
  "state": true,
  "metadata": { "statusCode": 200, "action": "Obtener balances." },
  "data": {
    "items": [
      {
        "balanceId": "uuid-v7",
        "programId": "uuid-v7",
        "amount": 500000,
        "paidAmount": 150000,
        "pendingAmount": 350000,
        "installments": [...]
      }
    ]
  }
}
```

---

## Modelo de datos (DynamoDB)

**Tabla:** `programs-<stage>-pri-<shortRegion>`

Los balances se almacenan dentro de la tabla de programas usando el patrón single-table:

```javascript
{
  pk: "PRG#8e3d823d-9f58-45df-8a8f-6779435a0001",
  sk: "BAL#<uuid-v7>",
  id: "uuid-v7",
  programId: "uuid-v7",
  amount: 500000,
  paidAmount: 0,
  pendingAmount: 500000,
  status: "ACTIVE | COMPLETED | CANCELLED",
  installments: [
    {
      installmentNumber: 1,
      amount: 150000,
      dueDate: "2025-03-01",
      status: "PENDING | PAID | OVERDUE"
    }
  ],
  createdAt: "2025-01-15T09:30:00Z",
  updatedAt: "2025-02-01T10:00:00Z"
}
```

---

## Variables de entorno

| Variable | Descripción |
|---|---|
| `DYNAMODB_PROGRAM_TABLE` | Tabla DynamoDB de programas |
| `PROGRAM_TABLE_ID` | PK constante de la tabla de programas |
| `BUCKET_INFO_GI` | Bucket S3 |
| `SECRET_KEY` | Clave del secreto JWT |
| `STAGE` | Entorno de ejecución |

---

## IAM Policies utilizadas

- `lambda-policy-xray.yml` — AWS X-Ray
- `lambda-policy-ssm.yml` — Parameter Store
- `lambda-policy-dynamodb-program.yml` — DynamoDB (tabla programas)
- `lambda-policy-s3.yml` — S3

---

## Desarrollo local

```bash
# Desde raíz del proyecto
npm start

# Deploy del servicio
cd services/api-balance
AWS_PROFILE=pa-dev serverless deploy --stage dev --region us-west-2
```

---

**Última actualización:** 2026-02-23
