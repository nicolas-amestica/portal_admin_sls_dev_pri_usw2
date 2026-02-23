# api-maintainer — Datos Maestros

Servicio de datos maestros (mantenedor) para el portal administrativo de Giras Indómito. Expone catálogos y listas de referencia utilizadas por otros servicios.

**Nombre SLS:** `mantenedor` · **Runtime:** Node.js 20.x · **Framework:** Serverless v4

---

## Endpoints

| Método | Ruta | Handler | Descripción |
|---|---|---|---|
| `GET` | `/v1/mantenedor/bancos` | `get-banks-v1` | Obtener lista de bancos disponibles |

---

## Funciones Lambda

### `get-banks-v1`
Retorna la lista de bancos registrados en el sistema, usada principalmente en formularios de datos bancarios de contratos y pagos.

**Respuesta:**
```json
{
  "state": true,
  "metadata": {
    "statusCode": 200,
    "action": "Obtener bancos."
  },
  "data": {
    "items": [
      { "code": "001", "name": "Banco del Estado de Chile", "active": true },
      { "code": "009", "name": "Banco Internacional", "active": true },
      { "code": "012", "name": "Banco del Desarrollo", "active": true },
      { "code": "014", "name": "Scotiabank Chile", "active": true },
      { "code": "016", "name": "Banco de Crédito e Inversiones (BCI)", "active": true },
      { "code": "028", "name": "Banco Bice", "active": true },
      { "code": "031", "name": "HSBC Bank (Chile)", "active": true },
      { "code": "037", "name": "Banco Santander Chile", "active": true },
      { "code": "039", "name": "Itaú Chile", "active": true },
      { "code": "049", "name": "Banco Security", "active": true },
      { "code": "051", "name": "Banco Falabella", "active": true },
      { "code": "055", "name": "Banco Ripley", "active": true },
      { "code": "057", "name": "Banco Consorcio", "active": true },
      { "code": "061", "name": "Banco de Chile / Edwards Citi", "active": true }
    ]
  }
}
```

---

## Modelo de datos (DynamoDB)

**Tabla:** `maintainer-<stage>-pri-<shortRegion>`

```javascript
// Registro de banco
{
  pk: "BNK#ACCOUNT",    // Constante DYNAMODB_PK_MAINTAINER_TABLE
  sk: "BNK#001",        // Código de banco
  code: "001",
  name: "Banco del Estado de Chile",
  active: true,
  createdAt: "2025-01-01T00:00:00Z",
  updatedAt: "2025-01-01T00:00:00Z"
}
```

---

## Catálogos disponibles

| Catálogo | PK | Descripción |
|---|---|---|
| Bancos | `BNK#ACCOUNT` | Lista de bancos de Chile |

> Nuevos catálogos se agregan con nuevas PKs siguiendo la misma convención: `<TIPO>#<CATEGORÍA>`.

---

## Variables de entorno

| Variable | Descripción |
|---|---|
| `DYNAMODB_MAINTAINER_TABLE` | Tabla DynamoDB del mantenedor |
| `DYNAMODB_PK_MAINTAINER_TABLE` | PK para bancos (`BNK#ACCOUNT`) |
| `STAGE` | Entorno de ejecución |

---

## IAM Policies utilizadas

- `lambda-policy-xray.yml` — AWS X-Ray
- `lambda-policy-ssm.yml` — Parameter Store
- `lambda-policy-secretsmanager.yml` — Secrets Manager
- `lambda-policy-cloudwatch.yml` — CloudWatch
- `lambda-policy-dynamodb-maintainer.yml` — DynamoDB (tabla mantenedor)

---

## Extensión del servicio

Para agregar nuevos catálogos (por ejemplo, tipos de documento, regiones, etc.):

1. Crear nueva función Lambda en `functions/get-<catalog>-v1.js`
2. Registrar en `serverless.yml` con su ruta correspondiente
3. Agregar datos en DynamoDB con la PK correspondiente
4. Actualizar este README

---

## Desarrollo local

```bash
# Desde raíz del proyecto
npm start

# Deploy del servicio
cd services/api-maintainer
AWS_PROFILE=pa-dev serverless deploy --stage dev --region us-west-2
```

---

**Última actualización:** 2026-02-23
