# api-configuration — Configuración Global (Go)

Servicio de configuración global del portal administrativo, implementado en **Go 1.24** siguiendo un paradigma funcional estricto. Es el primer servicio migrado de Node.js a Go como referencia de arquitectura.

**Nombre SLS:** `configuracion` · **Runtime:** `provided.al2023` (Go) · **Arquitectura:** ARM64 · **Framework:** Serverless v4

---

## Endpoints

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/v1/configuracion/global` | Obtener configuración global (tasas de IVA) |
| `POST` | `/v1/configuracion/global` | Actualizar configuración global (solo Admin) |

---

## Payloads

### GET /v1/configuracion/global

**Respuesta:**
```json
{
  "state": true,
  "metadata": {
    "statusCode": 200,
    "action": "Obtener configuración global"
  },
  "data": {
    "ivaRateCrew": 0.1525,
    "ivaRateService": 0.19
  }
}
```

### POST /v1/configuracion/global

**Body:**
```json
{
  "ivaRateCrew": 0.1525,
  "ivaRateService": 0.19
}
```

**Validación:**
- Ambos valores deben estar entre `0` y `1` (representan porcentaje como decimal)
- `0.19` = 19% de IVA

**Respuesta:**
```json
{
  "state": true,
  "metadata": {
    "statusCode": 200,
    "action": "Actualizar configuración global"
  },
  "data": {
    "message": "Configuración global actualizada correctamente"
  }
}
```

---

## Arquitectura del servicio

```
api-configuration/
├── cmd/
│   ├── get-global-config/     # Entry point Lambda — GET
│   │   └── main.go
│   ├── update-global-config/  # Entry point Lambda — POST
│   │   └── main.go
│   └── local-server/          # Servidor HTTP local
│       └── main.go
├── internal/
│   ├── config/                # Lógica de negocio
│   │   ├── repository.go      # Acceso a DynamoDB
│   │   └── service.go         # Funciones puras de negocio
│   └── middleware/            # Middleware compartido
├── shared/
│   ├── apperr/                # Errores HTTP de dominio
│   │   └── apperr.go
│   ├── database/              # Cliente DynamoDB global
│   │   └── dynamodb.go
│   └── logger/                # Logger Zap global
│       └── logger.go
├── test/
│   └── events/                # Eventos mock para testing
├── scripts/
│   └── switch-env.sh
├── go.mod
├── go.sum
├── Makefile
└── serverless.yml
```

### Principios arquitectónicos

- **Paradigma funcional**: funciones puras, sin structs con métodos receptores para lógica de negocio
- **Estado global**: clientes AWS, logger y config son variables globales (optimiza cold starts)
- **Sin DI explícita**: sin factories ni constructores complejos
- **Logging estructurado**: solo Zap — nunca `fmt.Println` o `log.Printf`
- **Error wrapping**: siempre `%w` para preservar stack trace

---

## Modelo de datos (DynamoDB)

**Tabla:** `config-<stage>-pri-<shortRegion>`

```javascript
{
  pk: "CONFIG",
  sk: "GLOBAL#IVA_RATE",
  value: {
    ivaRateCrew: 0.1525,
    ivaRateService: 0.19
  },
  description: "Tasas de IVA configuradas",
  createdAt: "2025-01-01T00:00:00Z",
  updatedAt: "2025-02-15T10:00:00Z"
}
```

---

## Desarrollo local

### Requisitos

- Go 1.24+
- AWS CLI configurado con perfil `pa-dev`
- Make

### Gestión de entornos

```bash
make env-dev     # Cambiar a entorno de desarrollo
make env-prod    # Cambiar a entorno de producción
make env-show    # Ver configuración actual
```

### Servidor local (recomendado)

```bash
# 1. Configurar entorno
make env-dev

# 2. Iniciar servidor en puerto 3001
make run-local

# 3. Probar endpoints
curl http://localhost:3001/v1/configuracion/global

curl -X POST http://localhost:3001/v1/configuracion/global \
  -H "Content-Type: application/json" \
  -d '{"ivaRateCrew": 0.1525, "ivaRateService": 0.19}'

# Health check
curl http://localhost:3001/health
```

### Testing con eventos mock

```bash
make test-local-get    # Probar GET con evento mock
make test-local-post   # Probar POST con evento mock
```

Los eventos mock están en `test/events/`.

### DynamoDB Local (opcional)

```bash
# 1. Iniciar DynamoDB Local
docker run -p 8000:8000 amazon/dynamodb-local

# 2. Crear tabla
aws dynamodb create-table \
  --table-name config-dev-pri-usw2 \
  --attribute-definitions \
    AttributeName=pk,AttributeType=S \
    AttributeName=sk,AttributeType=S \
  --key-schema AttributeName=pk,KeyType=HASH AttributeName=sk,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST \
  --endpoint-url http://localhost:8000
```

---

## Comandos Make

```bash
make build                     # Compilar para Lambda ARM64
make run-local                 # Servidor local en puerto 3001
make run-local-port PORT=3002  # Puerto personalizado
make deploy                    # Deploy a AWS (entorno actual)
make deploy-stage STAGE=prod   # Deploy a stage específico
make test                      # Tests unitarios
make test-coverage             # Tests con cobertura
make fmt                       # Formatear código (gofmt)
make lint                      # Linting (requiere golangci-lint)
make clean                     # Limpiar artefactos de compilación
make install                   # Instalar dependencias Go
make help                      # Ver todos los comandos
```

---

## Variables de entorno

| Variable | Descripción |
|---|---|
| `DYNAMODB_CONFIG_TABLE` | Tabla DynamoDB de configuración |
| `DYNAMODB_USER_TABLE` | Tabla DynamoDB de usuarios |
| `STAGE` | Entorno de ejecución (`dev`, `prod`) |
| `PROFILE` | Perfil AWS a utilizar |

### Archivos de entorno

| Archivo | Descripción |
|---|---|
| `.env.dev` | Configuración de desarrollo (versionado) |
| `.env.prod` | Configuración de producción (versionado) |
| `.env` | Archivo activo (generado por `make env-*`, no versionado) |

---

## Dependencias Go

```
github.com/aws/aws-lambda-go
github.com/aws/aws-sdk-go-v2
github.com/aws/aws-sdk-go-v2/feature/dynamodb/attributevalue
github.com/aws/aws-sdk-go-v2/service/dynamodb
go.uber.org/zap
```

---

## Por qué Go

Este servicio fue migrado de Node.js a Go para demostrar las ventajas en entornos Lambda:

| Aspecto | Node.js | Go |
|---|---|---|
| Cold start | ~500ms | ~50ms |
| Memoria | ~128 MB | ~64 MB |
| Type safety | Runtime | Compilación |
| Logging | Winston | Zap (estructurado) |

---

## Deploy

```bash
cd services/api-configuration
make build
make deploy

# O con stage específico
make deploy-stage STAGE=prod
```

> Este servicio debe deployarse **después de** `infrastructure/` (API Gateway) y **antes** de los servicios que consumen la configuración global.

---

## Convenciones de código

Este servicio sigue estrictamente las convenciones Go documentadas en la sección **Convenciones Go** del [README principal](../../README.md):

- Paradigma funcional (sin OOP para lógica de negocio)
- Logging estructurado con `zap`
- Error wrapping con `%w`
- Validación con `validator` tags
- Estado global para clientes AWS

---

**Última actualización:** 2026-02-23
