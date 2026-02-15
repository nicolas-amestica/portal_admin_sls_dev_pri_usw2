#!/bin/bash

# Script para deployar todos los servicios con caché implementado
# Ejecuta deploy en secuencia con verificación de errores

set -e

STAGE=${1:-dev}
REGION="us-west-2"

echo "═══════════════════════════════════════════════════════"
echo "  Deploy de Servicios con Caché"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "Stage: $STAGE"
echo "Region: $REGION"
echo ""
echo "Servicios a desplegar:"
echo "  1. api-program (2 handlers con caché)"
echo "  2. api-maintainer (1 handler con caché)"
echo "  3. api-entity (1 handler con caché)"
echo "  4. api-contract (1 handler con caché)"
echo "  5. api-balance (1 handler con caché)"
echo ""
read -p "¿Continuar con el deploy? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deploy cancelado."
    exit 0
fi

echo ""

# Función para deployar un servicio
deploy_service() {
    local service=$1
    local description=$2

    echo "─────────────────────────────────────────────────────"
    echo "Desplegando: $description"
    echo "Servicio: $service"
    echo "─────────────────────────────────────────────────────"
    echo ""

    cd "services/$service"

    # Limpiar build anterior
    rm -rf .serverless/

    # Deploy
    if serverless deploy --stage "$STAGE" --region "$REGION" --verbose; then
        echo ""
        echo "✅ $description desplegado exitosamente"
        echo ""
    else
        echo ""
        echo "❌ Error desplegando $description"
        echo ""
        exit 1
    fi

    cd ../..
}

# Deploy de cada servicio
deploy_service "api-program" "api-program (programas)"
deploy_service "api-maintainer" "api-maintainer (bancos)"
deploy_service "api-entity" "api-entity (usuarios/accesos)"
deploy_service "api-contract" "api-contract (contratos/PDFs)"
deploy_service "api-balance" "api-balance (balances)"

# Resumen
echo "═══════════════════════════════════════════════════════"
echo "  Deploy Completado"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "✅ Todos los servicios desplegados exitosamente"
echo ""
echo "Próximos pasos:"
echo "  1. Verificar endpoints en AWS:"
echo "     aws lambda list-functions --query 'Functions[?contains(FunctionName, \`$STAGE\`)].FunctionName' --region $REGION"
echo ""
echo "  2. Ver logs en CloudWatch:"
echo "     aws logs tail /aws/lambda/programas-$STAGE-get_program_v1 --follow --region $REGION"
echo ""
echo "  3. Buscar métricas de caché:"
echo "     Filtrar por 'CACHE_HIT' o 'CACHE_DETAILED_STATS' en CloudWatch Logs"
echo ""
echo "  4. Monitorear hit rate durante 1-2 horas"
echo ""
echo "═══════════════════════════════════════════════════════"
