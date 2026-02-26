# api-contract — Generación de Contratos PDF

Servicio para guardar datos de contratos y generar documentos PDF (contratos, declaraciones aduanales, borradores) asociados a programas de giras educacionales.

**Nombre SLS:** `contratos` · **Runtime:** Node.js 20.x (ARM64) · **Framework:** Serverless v4

---

## Endpoints

| Método | Ruta | Handler | Descripción |
|---|---|---|---|
| `POST` | `/v1/contratos/guardar` | `save-contract-data-v1` | Guardar datos del contrato en el programa |
| `POST` | `/v1/documentos/pdf` | `build-pdf-document-by-form-v1` | Generar PDF desde formulario (base64) |
| `GET` | `/v1/documentos/pdf` | `get-pdf-document-by-sk-v1` | Obtener contrato con metadatos por SK |
| `GET` | `/v1/documentos/pdf/{sk}` | `build-pdf-document-by-sk-from-program-v1` | Obtener PDF en base64 desde programa por SK |

---

## Funciones Lambda

### `save-contract-data-v1`
Guarda o actualiza los datos del contrato asociado a un programa en DynamoDB.

**Body:**
```json
{
  "sk": "PRG#<uuid-v7>",
  "contract": {
    "representatives": [...],
    "institution": { "name": "Colegio San Ignacio", "address": "..." },
    "clientRepresentative": { "name": "Juan Pérez", "rut": "12345678-9" },
    "trip": { "origin": "Santiago", "destination": "Buenos Aires", "dates": [...] },
    "plan": { "activities": [...] },
    "payments": { "conditions": "...", "amounts": [...] },
    "conditions": { "items": [...] }
  }
}
```

> `memorySize: 512` · `timeout: 29s`

### `build-pdf-document-by-form-v1`
Genera un documento PDF a partir de los datos del contrato enviados en el body. Retorna el PDF codificado en **base64**.

**Body:**
```json
{
  "document": {
    "representatives": [...],
    "institution": { "...datos institución..." },
    "clientRepresentative": { "...datos representante..." },
    "trip": { "...datos del viaje..." },
    "plan": { "...actividades..." },
    "payments": { "...condiciones de pago..." },
    "conditions": { "...condiciones generales..." }
  },
  "scope": "CTT",
  "action": {
    "isPreview": false,
    "hasSigned": true,
    "hasHeaderFooter": false
  }
}
```

**Respuesta:**
```json
{
  "state": true,
  "metadata": { "statusCode": 200, "action": "Generar documento PDF." },
  "data": {
    "base64": "JVBERi0xLjQK..."
  }
}
```

> `memorySize: 1024` · `timeout: 29s`

### `get-pdf-document-by-sk-v1`
Obtiene el contrato almacenado en S3 a partir de su sort key, retornando también metadatos.

**Query Parameters:**
- `sk` (requerido): Sort key del contrato — ej. `CTT#<uuid-v7>`

```
GET /v1/documentos/pdf?sk=CTT%23<uuid-v7>
```

**Respuesta:**
```json
{
  "state": true,
  "metadata": { "statusCode": 200, "action": "Obtener documento PDF." },
  "data": {
    "file": "<binary o base64>",
    "filename": "contrato.pdf",
    "contentType": "application/pdf",
    "sk": "CTT#<uuid-v7>"
  }
}
```

> `memorySize: 1024` · `timeout: 29s`

### `build-pdf-document-by-sk-from-program-v1`
Obtiene los datos del contrato desde DynamoDB (por `sk`) y genera el PDF en base64, útil para regenerar o descargar el PDF final.

**Path Parameter:**
- `sk` (requerido, URL-encoded): Sort key del contrato

```
GET /v1/documentos/pdf/CTT%23<uuid-v7>
```

**Respuesta:**
```json
{
  "state": true,
  "metadata": { "statusCode": 200, "action": "Obtener documento PDF desde programa." },
  "data": {
    "base64": "JVBERi0xLjQK..."
  }
}
```

> `memorySize: 1024` · `timeout: 29s`

---

## Tipos de documentos

| Scope | Nombre | Descripción |
|---|---|---|
| `CTT` | Contrato de Transporte | Contrato principal del programa |
| `DBA` | Declaración Aduanal | Declaración para aduana |
| `DBR` | Borrador | Vista previa con marca de agua "BORRADOR" |

---

## Opciones de generación (campo `action`)

| Opción | Tipo | Descripción |
|---|---|---|
| `isPreview` | `boolean` | `true` = agrega marca de agua "BORRADOR" |
| `hasSigned` | `boolean` | `false` = incluye imágenes de firmas digitales desde S3 |
| `hasHeaderFooter` | `boolean` | `true` = agrega header.png y footer.png |

---

## Estructura del contrato (interfaz TypeScript del frontend)

```typescript
interface Contract {
  representatives: Representative[];     // Representantes de Giras Indómito
  institution: Institution;              // Institución educativa
  clientRepresentative: ClientRepresentative; // Representante del cliente
  trip: Trip;                           // Datos del viaje
  plan: Plan;                           // Plan de actividades
  payments: ConditionPayment;           // Condiciones de pago
  conditions: Condition;                // Condiciones generales
}
```

---

## Modelo de datos (DynamoDB)

**Tabla:** `programs-<stage>-pri-<shortRegion>`

Los contratos se almacenan dentro del programa:

```javascript
{
  pk: "PRG#8e3d823d-9f58-45df-8a8f-6779435a0001",
  sk: "PRG#<uuid-v7>",
  // ...datos del programa...
  contract: {
    sk: "CTT#<uuid-v7>",
    scope: "CTT",
    data: { "...datos del contrato..." },
    pdfPath: "contracts/<programId>/CTT-v1.pdf",
    createdAt: "2025-02-01T10:00:00Z",
    updatedAt: "2025-02-01T10:00:00Z"
  }
}
```

---

## Storage S3

**Bucket:** `giras-indomito-<stage>-info`

| Tipo de archivo | Path |
|---|---|
| Contratos finales | `contracts/{programId}/{scope}-{version}.pdf` |
| Firmas digitales | `signatures/{dni}.png` |
| Header | `assets/header.png` |
| Footer | `assets/footer.png` |

---

## Variables de entorno

| Variable | Descripción |
|---|---|
| `DYNAMODB_PROGRAM_TABLE` | Tabla DynamoDB de programas |
| `PROGRAM_TABLE` | PK constante de la tabla de programas |
| `BUCKET_INFO_GI` | Bucket S3 para PDFs y assets |
| `SECRET_KEY` | Nombre del secreto JWT |
| `STAGE` | Entorno de ejecución |
| `NODE_OPTIONS` | `--enable-source-maps` para mejor debugging |

---

## IAM Policies utilizadas

- `lambda-policy-xray.yml` — AWS X-Ray
- `lambda-policy-ssm.yml` — Parameter Store
- `lambda-policy-dynamodb-program.yml` — DynamoDB (tabla programas)
- `lambda-policy-s3.yml` — S3 (lectura/escritura)

---

## Consideraciones de memoria

Las funciones que generan PDFs requieren más memoria por el procesamiento con `pdf-lib`:

- `memorySize: 1024` en generación de PDF (vs default 128 MB)
- `memorySize: 512` en guardado de datos
- `timeout: 29s`
- Arquitectura `arm64` para mejor relación rendimiento/costo

---

## Desarrollo local

```bash
# Desde raíz del proyecto
npm start

# Deploy del servicio
cd services/api-contract
AWS_PROFILE=pa-dev serverless deploy --stage dev --region us-west-2
```

---

**Última actualización:** 2026-02-23
