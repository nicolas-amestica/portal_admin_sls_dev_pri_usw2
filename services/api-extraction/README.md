# api-extraction — Descarga de Archivos desde S3

Servicio para la extracción y descarga de objetos almacenados en AWS S3.

**Nombre SLS:** `extracciones` · **Runtime:** Node.js 20.x · **Framework:** Serverless v4

---

## Endpoints

| Método | Ruta | Handler | Descripción |
|---|---|---|---|
| `GET` | `/v1/extracciones/object` | `get-object-s3-v1` | Descargar un archivo desde S3 |

---

## Funciones Lambda

### `get-object-s3-v1`
Descarga un objeto desde S3 y lo retorna al cliente. Permite al frontend acceder a archivos almacenados en S3 (PDFs, imágenes, exports) sin necesidad de URLs presignadas públicas.

**Query Parameters:**
- `key` (requerido): Clave del objeto en S3 (path dentro del bucket)
- `bucket` (opcional): Nombre del bucket (por defecto usa `BUCKET_INFO_GI`)

**Respuesta:**
Archivo binario con el Content-Type apropiado, o respuesta en base64.

```json
{
  "state": true,
  "metadata": { "statusCode": 200, "action": "Descargar objeto S3." },
  "data": {
    "content": "base64-encoded-content",
    "contentType": "application/pdf",
    "filename": "contrato.pdf"
  }
}
```

---

## Casos de uso

- Descarga de contratos PDF generados por `api-contract`
- Descarga de comprobantes de pago generados por `api-payment`
- Acceso a archivos de exportación (Excel, CSV)
- Obtención de imágenes almacenadas

---

## Variables de entorno

| Variable | Descripción |
|---|---|
| `DYNAMODB_PROGRAM_TABLE` | Tabla DynamoDB de programas |
| `DYNAMODB_USERS_TABLE` | Tabla DynamoDB de usuarios |
| `PRG_TABLE_ID` | PK constante de la tabla de programas |
| `USR_TABLE_ID` | PK constante de la tabla de usuarios |
| `BUCKET_INFO_GI` | Bucket S3 principal |
| `SECRET_KEY` | Clave del secreto JWT |
| `STAGE` | Entorno de ejecución |

---

## IAM Policies utilizadas

- `lambda-policy-xray.yml` — AWS X-Ray
- `lambda-policy-ssm.yml` — Parameter Store
- `lambda-policy-dynamodb-program.yml` — DynamoDB (tabla programas)
- `lambda-policy-dynamodb-user.yml` — DynamoDB (tabla usuarios)
- `lambda-policy-s3.yml` — S3 (lectura de objetos)

---

## Desarrollo local

```bash
# Desde raíz del proyecto
npm start

# Deploy del servicio
cd services/api-extraction
AWS_PROFILE=pa-dev serverless deploy --stage dev --region us-west-2
```

---

**Última actualización:** 2026-02-23
