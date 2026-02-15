# 🚀 Guía de Deployment - Portal Admin

## Opciones de Deployment

### 1. Deployment Completo (Recomendado) ⭐

Despliega todo en secuencia con logs detallados y manejo de errores:

```bash
./deploy-all.sh dev
```

**Características:**
- ✅ Verifica infraestructura antes de desplegar servicios
- ✅ Logs detallados con `--verbose`
- ✅ Manejo de errores (para si falla)
- ✅ Resumen al final con servicios desplegados/fallidos
- ✅ Muestra endpoints disponibles
- ✅ Códigos de color para fácil lectura

**Tiempo estimado:** 15-20 minutos (primera vez), 10-15 minutos (actualizaciones)

---

### 2. Deployment Rápido 🏃

Despliega todo sin logs verbose (más rápido):

```bash
./deploy-quick.sh dev
```

**Características:**
- ✅ Solo muestra resumen de cada deployment
- ✅ Sin logs detallados
- ✅ Útil para deployments frecuentes

**Tiempo estimado:** 8-12 minutos

---

### 3. Deployment Individual

Para desplegar solo un servicio específico:

```bash
# Infraestructura
cd infrastructure && npx sls deploy --stage dev

# Servicio específico
cd services/api-contract && npx sls deploy --stage dev
cd services/api-program && npx sls deploy --stage dev
```

---

### 4. Deployment Selectivo

Desplegar solo algunos servicios:

```bash
#!/bin/bash
# deploy-selected.sh

STAGE=${1:-dev}

services=(
    "api-contract"
    "api-program"
    "api-entity"
)

for service in "${services[@]}"; do
    echo "📦 Desplegando $service..."
    cd "services/$service"
    npx sls deploy --stage "$STAGE"
    cd ../..
done
```

---

## Orden Recomendado de Deployment

### Primera Vez (Nuevo Environment)

1. **Infraestructura** (API Gateway compartido)
   ```bash
   cd infrastructure
   npx sls deploy --stage dev
   ```

2. **Servicios Core** (en orden de dependencia)
   ```bash
   # Autenticación y configuración
   cd services/job-authorizer && npx sls deploy --stage dev
   cd services/api-configuration && npx sls deploy --stage dev

   # Entidades base
   cd services/api-entity && npx sls deploy --stage dev
   cd services/api-maintainer && npx sls deploy --stage dev

   # Funcionalidad principal
   cd services/api-program && npx sls deploy --stage dev
   cd services/api-contract && npx sls deploy --stage dev

   # Servicios complementarios
   cd services/api-payment && npx sls deploy --stage dev
   cd services/api-balance && npx sls deploy --stage dev
   cd services/api-extraction && npx sls deploy --stage dev
   cd services/api-notification && npx sls deploy --stage dev
   ```

### Actualizaciones (Environment Existente)

Usa los scripts:
```bash
./deploy-all.sh dev      # Completo
./deploy-quick.sh dev    # Rápido
```

---

## Verificación Post-Deployment

### 1. Verificar Stack de CloudFormation

```bash
# Listar todos los stacks desplegados
aws cloudformation list-stacks \
  --profile pa-dev \
  --region us-west-2 \
  --query 'StackSummaries[?StackStatus==`CREATE_COMPLETE` || StackStatus==`UPDATE_COMPLETE`].StackName' \
  --output table

# Ver outputs del API Gateway
aws cloudformation describe-stacks \
  --stack-name portal-admin-infrastructure-dev \
  --profile pa-dev \
  --region us-west-2 \
  --query 'Stacks[0].Outputs' \
  --output table
```

### 2. Obtener API Gateway URL

```bash
# Obtener URL base
API_URL=$(aws cloudformation describe-stacks \
  --stack-name portal-admin-infrastructure-dev \
  --profile pa-dev \
  --region us-west-2 \
  --query 'Stacks[0].Outputs[?OutputKey==`HttpApiUrl`].OutputValue' \
  --output text)

echo "API URL: ${API_URL}/dev"
```

### 3. Testing de Endpoints

```bash
# Guardar URL en variable
export API_URL="https://2z8nmi3vee.execute-api.us-west-2.amazonaws.com/dev"

# Test 1: Obtener bancos (GET)
curl "${API_URL}/v1/mantenedor/bancos"

# Test 2: Login (POST)
curl -X POST "${API_URL}/v1/sesiones/iniciar-sesion" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'

# Test 3: Obtener programas (GET)
curl "${API_URL}/v1/programas/solicitudes/programas"

# Test 4: Crear documento PDF (POST)
curl -X POST "${API_URL}/v1/documentos/pdf" \
  -H "Content-Type: application/json" \
  -d '{
    "scope": "CTT",
    "document": {},
    "action": {"isPreview": true}
  }'
```

### 4. Verificar Logs en CloudWatch

```bash
# Ver logs del API Gateway
aws logs tail /aws/apigateway/portal-admin-dev \
  --profile pa-dev \
  --region us-west-2 \
  --follow

# Ver logs de una Lambda específica
aws logs tail /aws/lambda/contratos-dev-build_document_by_form_v1 \
  --profile pa-dev \
  --region us-west-2 \
  --follow

# Buscar por correlation ID
aws logs filter-log-events \
  --log-group-name /aws/lambda/contratos-dev-build_document_by_form_v1 \
  --filter-pattern "cid-" \
  --profile pa-dev \
  --region us-west-2
```

---

## Troubleshooting

### Error: "No version found for 3"
```bash
# Verificar versión de Serverless
npx sls --version  # Debe ser 4.x

# Si es necesario, reinstalar
rm -rf node_modules package-lock.json
npm install
```

### Error: "Stack does not exist"
```bash
# La infraestructura no está desplegada
cd infrastructure
npx sls deploy --stage dev
```

### Error: "Export portal-admin-dev-api-id not found"
```bash
# El API Gateway no ha sido desplegado o el export falló
# Redesplegar infraestructura
cd infrastructure
npx sls remove --stage dev  # Opcional: remover stack anterior
npx sls deploy --stage dev
```

### Error: "Rate exceeded"
```bash
# Esperar 30-60 segundos entre deployments
# O usar --concurrency 1 para deployments más lentos pero seguros
```

### Verificar Configuration
```bash
# Ver configuración de un servicio
cd services/api-contract
npx sls info --stage dev

# Ver variables de entorno
npx sls info --stage dev --verbose
```

---

## Rollback

### Rollback de un Servicio Específico

```bash
# Listar deployments anteriores
cd services/api-contract
npx sls deploy list --stage dev

# Rollback al deployment anterior
npx sls rollback --timestamp 1234567890000 --stage dev
```

### Rollback Completo (Remover Todo)

```bash
#!/bin/bash
# rollback-all.sh

STAGE=${1:-dev}

services=(
    "api-notification"
    "api-extraction"
    "api-balance"
    "api-payment"
    "api-entity"
    "api-program"
    "api-contract"
    "api-maintainer"
    "job-authorizer"
    "api-configuration"
)

# Remover servicios (en orden inverso)
for service in "${services[@]}"; do
    echo "🗑️  Removiendo $service..."
    cd "services/$service"
    npx sls remove --stage "$STAGE" || true
    cd ../..
done

# Remover infraestructura al final
echo "🗑️  Removiendo infraestructura..."
cd infrastructure
npx sls remove --stage "$STAGE"

echo "✅ Rollback completado"
```

---

## Ambientes

### Desarrollo (dev)
```bash
./deploy-all.sh dev
```

### Producción (prod)
```bash
# IMPORTANTE: Verificar cambios antes de desplegar a prod
./deploy-all.sh prod
```

### Crear Nuevo Ambiente (staging)
```bash
# 1. Crear profile en ~/.aws/credentials
[pa-staging]
aws_access_key_id = YOUR_KEY
aws_secret_access_key = YOUR_SECRET

# 2. Desplegar
./deploy-all.sh staging
```

---

## Monitoreo Post-Deployment

### CloudWatch Dashboards

Crear dashboard personalizado:
```bash
aws cloudwatch put-dashboard \
  --dashboard-name portal-admin-dev \
  --dashboard-body file://cloudwatch-dashboard.json \
  --profile pa-dev \
  --region us-west-2
```

### X-Ray Traces

Ver traces de requests:
```bash
# Abrir consola de X-Ray
open "https://us-west-2.console.aws.amazon.com/xray/home?region=us-west-2#/service-map"
```

### Métricas Importantes

- **API Gateway**: RequestCount, Latency, 4xx, 5xx
- **Lambda**: Invocations, Duration, Errors, Throttles
- **DynamoDB**: ConsumedReadCapacityUnits, ConsumedWriteCapacityUnits

---

## Costos Estimados

**Deployment completo (dev):**
- API Gateway HTTP: ~$1/millón requests
- Lambda: ~$0.20/millón requests (512MB)
- DynamoDB: On-Demand (~$1.25/millón writes)
- CloudWatch Logs: ~$0.50/GB

**Total estimado dev:** $10-30/mes (dependiendo del tráfico)

---

## Checklist Pre-Deployment

- [ ] Código commiteado en git
- [ ] Tests locales pasados (`npx sls offline`)
- [ ] Variables de entorno verificadas
- [ ] Credenciales AWS configuradas (`aws configure`)
- [ ] Profile correcto (`pa-dev` o `pa-prod`)
- [ ] Suficiente espacio en S3 deployment bucket

---

## Recursos Adicionales

- **Plan de mejoras:** [MEJORAS-ARQUITECTURA.md](./MEJORAS-ARQUITECTURA.md)
- **Guía de migración:** [GUIA-MIGRACION-HANDLERS.md](./GUIA-MIGRACION-HANDLERS.md)
- **Resumen:** [RESUMEN-MIGRACION.md](./RESUMEN-MIGRACION.md)
- **Serverless Docs:** https://www.serverless.com/framework/docs
