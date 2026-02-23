# api-contract — Generación de Contratos PDF

Servicio para guardar datos de contratos y generar documentos PDF (contratos, declaraciones aduanales, borradores) asociados a programas de giras educacionales.

**Nombre SLS:** `contratos` · **Runtime:** Node.js 20.x (ARM64) · **Framework:** Serverless v4

---

## Endpoints

| Método | Ruta | Handler | Descripción |
|---|---|---|---|
| `POST` | `/v1/contratos/guardar` | `save-contract-data-v1` | Guardar datos del contrato en el programa |
| `POST` | `/v1/documentos/pdf` | `build-pdf-document-by-form-v1` | Generar PDF desde formulario (respuesta en base64) |
| `GET` | `/v1/documentos/pdf` | `get-pdf-document-by-sk-v1` | Descargar archivo PDF por SK |
| `GET` | `/v1/documentos/pdf/{sk}` | `build-pdf-document-by-sk-from-program-v1` | Obtener PDF en base64 desde el programa por SK |

---

## Funciones Lambda

### `save-contract-data-v1`
Guarda o actualiza los datos del contrato asociado a un programa en DynamoDB.

> `memorySize: 512` · `timeout: 30s`

### `build-pdf-document-by-form-v1`
Genera un documento PDF a partir de un formulario enviado en el cuerpo de la solicitud. Retorna el PDF codificado en **base64**.

Soporta tres tipos de documentos:
- `CTT` — Contrato de transporte
- `DBA` — Declaración de borrador aduanal
- `DBR` — Borrador de contrato

**Body:**
```json
{
  "scope": "CTT",
  "form": { "...datos del documento..." },
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

> `memorySize: 1024` · `timeout: 30s`

### `get-pdf-document-by-sk-v1`
Descarga el archivo PDF almacenado en S3 a partir de su sort key (`sk`).

> `memorySize: 1024` · `timeout: 30s`

### `build-pdf-document-by-sk-from-program-v1`
Obtiene los datos del contrato desde DynamoDB (por `sk`) y genera el PDF en base64.

> `memorySize: 1024` · `timeout: 30s`

---

## Tipos de documentos

| Tipo | Nombre | Descripción |
|---|---|---|
| `CTT` | Contrato de Transporte | Contrato principal del programa |
| `DBA` | Declaración Aduanal | Declaración para aduana |
| `DBR` | Borrador | Vista previa con marca de agua |

---

## Opciones de generación

| Opción | Tipo | Descripción |
|---|---|---|
| `isPreview` | `boolean` | `true` = agrega marca de agua "BORRADOR" |
| `hasSigned` | `boolean` | `false` = incluye imágenes de firmas digitales desde S3 |
| `hasHeaderFooter` | `boolean` | `true` = agrega header.png y footer.png |

---

## Modelo de datos (DynamoDB)

**Tabla:** `programs-<stage>-pri-<shortRegion>`

Los datos del contrato se almacenan dentro del registro del programa:

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
| `SECRET_KEY` | Clave del secreto JWT |
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

- `memorySize: 1024` (vs default 128 MB)
- `timeout: 30s`
- Arquitectura `arm64` para mejor rendimiento/costo

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
