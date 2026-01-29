# API Configuration - Go

Servicio de configuración global del portal implementado en **Go 1.24** siguiendo un paradigma funcional.

## Arquitectura

Este servicio sigue las convenciones definidas en los skills de Go del proyecto:

- **Paradigma Funcional**: Uso de Higher-Order Functions y Closures
- **Inyección por Clausura**: Las dependencias se inyectan mediante closures
- **Estado Global**: Cliente DynamoDB compartido para optimizar cold starts
- **Logging Estructurado**: Uso de Zap para observabilidad
- **Manejo de Errores**: Sistema robusto con `apperr` para errores HTTP

### Estructura de Carpetas

```
api-configuration-go/
├── cmd/                          # Lambda handlers
│   ├── get-global-config/        # GET /v1/configuracion/global
│   └── update-global-config/     # POST /v1/configuracion/global
├── internal/
│   ├── config/                   # Lógica de negocio
│   │   ├── repository.go         # Acceso a DynamoDB
│   │   └── service.go            # Lógica funcional
│   └── database/                 # Cliente DynamoDB compartido
│       └── dynamodb.go
├── shared/
│   └── apperr/                   # Manejo de errores HTTP
│       └── apperr.go
├── go.mod
├── Makefile
└── serverless.yml
```

## Endpoints

### GET /v1/configuracion/global

Obtiene la configuración global del portal (tasas de IVA).

**Respuesta:**
```json
{
  "state": true,
  "metadata": {
    "statusCode": 200,
    "action": "Obtener configuración global"
  },
  "data": {
    "success": true,
    "data": {
      "ivaRateCrew": 0.1525,
      "ivaRateService": 0.19
    }
  }
}
```

### POST /v1/configuracion/global

Actualiza la configuración global del portal (solo Admin).

**Body:**
```json
{
  "ivaRateCrew": 0.1525,
  "ivaRateService": 0.19
}
```

**Validación:**
- Ambos valores deben estar entre 0 y 1
- Representan el porcentaje como decimal (ej: 0.19 = 19%)

**Respuesta:**
```json
{
  "state": true,
  "metadata": {
    "statusCode": 200,
    "action": "Actualizar configuración global"
  },
  "data": {
    "success": true,
    "message": "Configuración global actualizada correctamente"
  }
}
```

## Desarrollo

### Requisitos

- Go 1.24+
- AWS CLI configurado
- Serverless Framework v3
- Make

### Instalación de Dependencias

```bash
make install
```

### Gestión de Entornos

El proyecto soporta múltiples entornos (dev/prod) con configuraciones separadas:

- [`.env.dev`](.env.dev) - Configuración de desarrollo
- [`.env.prod`](.env.prod) - Configuración de producción
- `.env` - Archivo activo (generado automáticamente, no versionado)

#### Cambiar de Entorno

```bash
# Cambiar a desarrollo
make env-dev

# Cambiar a producción
make env-prod

# Ver configuración actual
make env-show
```

O usando el script directamente:

```bash
./scripts/switch-env.sh dev   # Desarrollo
./scripts/switch-env.sh prod  # Producción
```

### Desarrollo Local (Offline)

#### Opción 1: Servidor HTTP Local (Recomendado)

El proyecto incluye un servidor HTTP local que simula API Gateway y permite probar las funciones sin desplegar a AWS.

**1. Configurar el entorno:**

```bash
# Activar entorno de desarrollo
make env-dev

# O editar manualmente .env.dev si necesitas ajustar valores
```

**2. Iniciar el servidor:**

```bash
# Usando Makefile
make run-local

# O usando el script
./scripts/run-local.sh

# O con puerto personalizado
make run-local-port PORT=3002
```

El servidor estará disponible en `http://localhost:3001`

**3. Probar los endpoints:**

```bash
# GET - Obtener configuración
curl http://localhost:3001/v1/configuracion/global

# POST - Actualizar configuración
curl -X POST http://localhost:3001/v1/configuracion/global \
  -H "Content-Type: application/json" \
  -d '{
    "ivaRateCrew": 0.1525,
    "ivaRateService": 0.19
  }'

# Health check
curl http://localhost:3001/health
```

#### Opción 2: Testing con Eventos Mock

Puedes ejecutar las funciones Lambda directamente con eventos de prueba:

```bash
# Probar GET con evento mock
make test-local-get

# Probar POST con evento mock
make test-local-post
```

Los eventos mock están en [`test/events/`](test/events/).

#### DynamoDB Local (Opcional)

Si quieres usar DynamoDB Local en lugar de AWS:

```bash
# 1. Instalar DynamoDB Local
docker run -p 8000:8000 amazon/dynamodb-local

# 2. Crear tabla local
aws dynamodb create-table \
  --table-name portal-admin-config-dev-pri-usw2 \
  --attribute-definitions AttributeName=pk,AttributeType=S AttributeName=sk,AttributeType=S \
  --key-schema AttributeName=pk,KeyType=HASH AttributeName=sk,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST \
  --endpoint-url http://localhost:8000

# 3. Configurar .env para usar endpoint local
# AWS_ENDPOINT_URL=http://localhost:8000
# AWS_ACCESS_KEY_ID=local
# AWS_SECRET_ACCESS_KEY=local
```

### Compilación

Compilar todos los Lambda handlers para ARM64:

```bash
make build
```

### Despliegue

Desplegar a AWS:

```bash
make deploy
```

Desplegar a un stage específico:

```bash
make deploy-stage STAGE=prod
```

### Testing

Ejecutar tests:

```bash
make test
```

Tests con cobertura:

```bash
make test-coverage
```

### Formateo y Linting

Formatear código:

```bash
make fmt
```

Linting (requiere golangci-lint):

```bash
make lint
```

### Limpieza

Limpiar artefactos de compilación:

```bash
make clean
```

## Variables de Entorno

- `DYNAMODB_CONFIG_TABLE`: Nombre de la tabla DynamoDB de configuración
- `DYNAMODB_USER_TABLE`: Nombre de la tabla DynamoDB de usuarios
- `STAGE`: Entorno de ejecución (dev, prod)
- `PROFILE`: Perfil AWS a utilizar

## Convenciones de Código

Este proyecto sigue estrictamente las convenciones definidas en:

- [`.claude/go-main-context.md`](../../.claude/go-main-context.md)
- [`.claude/go-conventions.md`](../../.claude/go-conventions.md)
- [`.claude/go-tech-stack.md`](../../.claude/go-tech-stack.md)

### Principios Clave

1. **Funciones sobre Estructuras**: La lógica se implementa como funciones puras o closures
2. **Composición Explícita**: Las dependencias se componen en el `init()` de cada handler
3. **Logging Obligatorio**: Todo evento crítico debe ser logueado con Zap
4. **Error Wrapping**: Siempre usar `%w` para mantener el stack trace

## Migración desde Node.js

Este servicio es una reimplementación del servicio [`api-configuration`](../api-configuration/) original en Node.js, manteniendo la misma API y comportamiento pero aprovechando las ventajas de Go:

- **Mejor Performance**: Cold starts más rápidos en Lambda
- **Type Safety**: Tipado estático que previene errores en runtime
- **Menor Consumo de Memoria**: Optimización de recursos en Lambda
- **Mejor Observabilidad**: Logging estructurado con Zap

## Comandos Útiles

Ver todos los comandos disponibles:

```bash
make help
```
