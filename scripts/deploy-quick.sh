#!/bin/bash

# Script de deployment rápido (sin verbose)
# Uso: ./deploy-quick.sh [dev|prd]

STAGE=${1:-dev}

echo "🚀 Desplegando Portal Admin - Stage: $STAGE"
echo ""

# Infraestructura
echo "📦 1/12 - Verificando infraestructura..."
cd infrastructure
if aws cloudformation describe-stacks --stack-name "portal-admin-infrastructure-${STAGE}" --profile "pa-${STAGE}" --region us-west-2 >/dev/null 2>&1; then
    echo "   ✅ Infraestructura ya existe"
else
    echo "   🏗️  Desplegando infraestructura..."
    npx sls deploy --stage "$STAGE" 2>&1 | grep -E '(Service deployed|Error|✔|✖)'
fi
cd ..

# Servicios (job-authorizer primero: los demás dependen de su AuthorizerId)
services=(
    "job-authorizer"
    "api-maintainer"
    "api-contract"
    "api-program"
    "api-entity"
    "api-payment"
    "api-balance"
    "api-extraction"
    "api-notification"
    "api-configuration"
    "job-trigger"
)

count=2
for service in "${services[@]}"; do
    if [ -d "services/$service" ]; then
        echo "📦 $count/12 - Desplegando $service..."
        cd "services/$service"
        # Si es un servicio Go, compilar antes de desplegar
        if [ -f "go.mod" ]; then
            echo "   🔨 Compilando binarios Go..."
            make build
        fi
        npx sls deploy --stage "$STAGE" 2>&1 | grep -E '(Service deployed|Error|✔|✖)'
        cd ../..
        ((count++))
    fi
done

echo ""
echo "🎉 Deployment completado!"

# Mostrar API URL
API_URL=$(aws cloudformation describe-stacks \
    --stack-name "portal-admin-infrastructure-${STAGE}" \
    --profile "pa-${STAGE}" \
    --region us-west-2 \
    --query 'Stacks[0].Outputs[?OutputKey==`HttpApiUrl`].OutputValue' \
    --output text 2>/dev/null)

if [ -n "$API_URL" ]; then
    echo "🌐 API URL: ${API_URL}"
fi
