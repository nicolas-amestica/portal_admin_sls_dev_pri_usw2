# api-balance — Gestión de Balances y Cuotas

Servicio para la gestión de balances financieros (pagos parciales, abonos) asociados a programas de giras educacionales.

**Nombre SLS:** `balances` · **Runtime:** Node.js 20.x · **Framework:** Serverless v4

---

## Endpoints

| Método | Ruta | Handler | Descripción |
|---|---|---|---|
| `POST` | `/v1/balances` | `create-balance-v1` | Registrar un pago/abono con comprobante |
| `GET` | `/v1/balances/{sk}` | `get-balances-v1` | Obtener balances de un programa |

---

## Funciones Lambda

### `create-balance-v1`
Registra un pago o abono para un programa, incluyendo el comprobante de pago como archivo adjunto. Se envía como **`multipart/form-data`** desde el frontend Angular.

**Content-Type:** `multipart/form-data`

**Campos del formulario:**

| Campo | Tipo | Descripción |
|---|---|---|
| `sk` | `string` | Sort key del programa (`PRG#<uuid-v7>`) |
| `amount` | `number` | Monto del pago en CLP |
| `file` | `File` (imagen/PDF) | Comprobante de pago |
| `paymentObservation` | `string` | Observaciones del pago (opcional) |

> El middleware `@middy/http-multipart-body-parser` parsea el `multipart/form-data`.

**Respuesta:**
```json
{
  "state": true,
  "metadata": { "statusCode": 201, "action": "Crear balance." },
  "data": {
    "sk": "PRG#<uuid-v7>",
    "amount": 150000,
    "Key": "balances/<programId>/<timestamp>.<ext>",
    "uploadDate": "2025-02-01T10:00:00Z"
  }
}
```

### `get-balances-v1`
Obtiene el historial de pagos/abonos registrados para un programa.

**Path Parameter:**
- `sk` (requerido, URL-encoded): Sort key del programa — ej. `PRG%23<uuid-v7>`

```
GET /v1/balances/PRG%23<uuid-v7>
```

**Respuesta:**
```json
{
  "state": true,
  "metadata": { "statusCode": 200, "action": "Obtener balances." },
  "data": {
    "items": [
      {
        "bucket": "giras-indomito-dev-info",
        "ext": "jpg",
        "isAttached": true,
        "Key": "balances/<programId>/1706784000000.jpg",
        "path": "https://...",
        "uploadDate": "2025-02-01T10:00:00Z",
        "amount": 150000,
        "paymentObservation": "Primer abono",
        "remaining": 350000,
        "totalWithUtilities": 500000
      }
    ]
  }
}
```

---

## Integración con el frontend

```typescript
// Angular — BalanceService
createBalance(sk: string, payment: PaymentForm): Observable<any> {
  const formData = new FormData();
  formData.append('sk', sk);
  formData.append('amount', payment.amount.toString());
  formData.append('file', payment.file);
  formData.append('observation', payment.observation ?? '');
  return this.http.post(`${baseApi}/v1/balances`, formData);
}

getBalances(sk: string): Observable<any> {
  const encodedSk = encodeURIComponent(sk);
  return this.http.get(`${baseApi}/v1/balances/${encodedSk}`);
}

getFileBalance(key: string): Observable<any> {
  return this.http.get(`${baseApi}/v1/extracciones/object`, {
    params: { key }
  });
}
```

> La descarga del comprobante adjunto (`getFileBalance`) se hace a través de **api-extraction**, no de este servicio.

---

## Modelo de datos (DynamoDB)

**Tabla:** `programs-<stage>-pri-<shortRegion>`

Los balances se almacenan dentro del arreglo `payments` del programa:

```javascript
{
  pk: "PRG#8e3d823d-9f58-45df-8a8f-6779435a0001",
  sk: "PRG#<uuid-v7>",
  // ...datos del programa...
  content: [{
    // ...
    payments: [
      {
        bucket: "giras-indomito-dev-info",
        ext: "jpg",
        isAttached: true,
        Key: "balances/<programId>/1706784000000.jpg",
        path: "s3://...",
        uploadDate: "2025-02-01T10:00:00Z",
        amount: 150000,
        paymentObservation: "Primer abono",
        remaining: 350000,
        totalWithUtilities: 500000
      }
    ]
  }]
}
```

---

## Storage S3

**Bucket:** `giras-indomito-<stage>-info`

| Tipo de archivo | Path |
|---|---|
| Comprobantes de pago | `balances/{programId}/{timestamp}.{ext}` |

---

## Variables de entorno

| Variable | Descripción |
|---|---|
| `DYNAMODB_PROGRAM_TABLE` | Tabla DynamoDB de programas |
| `PROGRAM_TABLE_ID` | PK constante de la tabla de programas |
| `BUCKET_INFO_GI` | Bucket S3 para comprobantes |
| `SECRET_KEY` | Nombre del secreto JWT |
| `STAGE` | Entorno de ejecución |

---

## IAM Policies utilizadas

- `lambda-policy-xray.yml` — AWS X-Ray
- `lambda-policy-ssm.yml` — Parameter Store
- `lambda-policy-dynamodb-program.yml` — DynamoDB (tabla programas)
- `lambda-policy-s3.yml` — S3 (escritura de comprobantes)

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
