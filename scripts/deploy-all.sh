#!/bin/bash

# Script de deployment secuencial para Portal Admin
# Uso: ./deploy-all.sh [dev|qa|prd] [service1,service2,...]

set -e  # Salir si hay error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Stage (default: dev)
STAGE=${1:-dev}
TARGET_SERVICES_CSV=${2:-}

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Portal Admin - Deployment Secuencial${NC}"
echo -e "${BLUE}  Stage: ${STAGE}${NC}"
echo -e "${YELLOW}  Nota: cambios en JWT/IAM requieren nueva sesión en el portal.${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Función para desplegar un servicio
deploy_service() {
    local service_path=$1
    local service_name=$(basename "$service_path")

    echo -e "${YELLOW}📦 Desplegando: ${service_name}...${NC}"

    cd "$service_path"

    # Si es un servicio Go, compilar antes de desplegar
    if [ -f "go.mod" ]; then
        echo -e "${BLUE}   🔨 Compilando binarios Go...${NC}"
        if ! make build; then
            echo -e "${RED}❌ Error compilando ${service_name}${NC}\n"
            return 1
        fi
    fi

    if npx sls deploy --stage "$STAGE" --verbose; then
        echo -e "${GREEN}✅ ${service_name} desplegado exitosamente${NC}\n"
        return 0
    else
        echo -e "${RED}❌ Error desplegando ${service_name}${NC}\n"
        return 1
    fi
}

# Función para verificar si la infraestructura está desplegada
check_infrastructure() {
    echo -e "${BLUE}🔍 Verificando infraestructura...${NC}"

    # Verificar si el stack de infraestructura existe
    if aws cloudformation describe-stacks \
        --stack-name "portal-admin-infrastructure-${STAGE}" \
        --profile "pa-${STAGE}" \
        --region us-west-2 \
        --query 'Stacks[0].StackStatus' \
        --output text 2>/dev/null | grep -q "COMPLETE"; then

        echo -e "${GREEN}✅ Infraestructura ya desplegada${NC}"

        # Obtener API Gateway ID
        API_ID=$(aws cloudformation describe-stacks \
            --stack-name "portal-admin-infrastructure-${STAGE}" \
            --profile "pa-${STAGE}" \
            --region us-west-2 \
            --query 'Stacks[0].Outputs[?OutputKey==`HttpApiId`].OutputValue' \
            --output text)

        echo -e "${BLUE}   API Gateway ID: ${API_ID}${NC}\n"
        return 0
    else
        echo -e "${YELLOW}⚠️  Infraestructura no encontrada, desplegando...${NC}"
        return 1
    fi
}

# Contador de servicios
TOTAL_SERVICES=17
DEPLOYED=0
FAILED=0
FAILED_SERVICES=()

# Directorio raíz del proyecto
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_ROOT"

echo -e "${BLUE}📂 Directorio del proyecto: ${PROJECT_ROOT}${NC}\n"

# 1. Verificar/Desplegar infraestructura
if ! check_infrastructure; then
    echo -e "${YELLOW}🏗️  Desplegando infraestructura...${NC}"
    cd infrastructure

    if npx sls deploy --stage "$STAGE" --verbose; then
        echo -e "${GREEN}✅ Infraestructura desplegada exitosamente${NC}\n"
    else
        echo -e "${RED}❌ Error desplegando infraestructura. Abortando.${NC}"
        exit 1
    fi

    cd "$PROJECT_ROOT"
fi

# 2. Desplegar servicios en orden
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Desplegando Servicios (${TOTAL_SERVICES})${NC}"
echo -e "${BLUE}========================================${NC}\n"

ALL_SERVICES=(
    "services/job-authorizer"
    "services/api-maintainer"
    "services/api-contract"
    "services/api-program"
    "services/api-ticket"
    "services/api-entity"
    "services/api-payment"
    "services/api-balance"
    "services/api-extraction"
    "services/api-notification"
    "services/api-configuration"
    "services/api-favorites"
    "services/api-meet"
    "services/api-whatsapp-agent"
    "services/api-accounting"
    "services/job-trigger"
    "services/job-instagram-poster"
)

SERVICES=()
if [ -n "$TARGET_SERVICES_CSV" ]; then
    IFS=',' read -r -a REQUESTED <<< "$TARGET_SERVICES_CSV"
    for requested in "${REQUESTED[@]}"; do
        requested="$(echo "$requested" | xargs)"
        if [ -n "$requested" ]; then
            SERVICES+=("services/$requested")
        fi
    done
    TOTAL_SERVICES=${#SERVICES[@]}
else
    SERVICES=("${ALL_SERVICES[@]}")
fi

if [ -n "$TARGET_SERVICES_CSV" ]; then
    echo -e "${YELLOW}🎯 Modo selectivo: ${TARGET_SERVICES_CSV}${NC}"
fi

for service in "${SERVICES[@]}"; do
    if [ -d "$PROJECT_ROOT/$service" ]; then
        if deploy_service "$PROJECT_ROOT/$service"; then
            DEPLOYED=$((DEPLOYED + 1))
        else
            FAILED=$((FAILED + 1))
            FAILED_SERVICES+=("$(basename "$service")")
        fi

        # Volver al directorio raíz
        cd "$PROJECT_ROOT"
    else
        echo -e "${YELLOW}⚠️  Servicio no encontrado: $service${NC}\n"
    fi
done

# 3. Resumen final
echo -e "\n${BLUE}========================================${NC}"
echo -e "${BLUE}  Resumen de Deployment${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}✅ Desplegados: ${DEPLOYED}/${TOTAL_SERVICES}${NC}"

if [ $FAILED -gt 0 ]; then
    echo -e "${RED}❌ Fallidos: ${FAILED}${NC}"
    echo -e "${RED}   Servicios fallidos:${NC}"
    for failed in "${FAILED_SERVICES[@]}"; do
        echo -e "${RED}   - ${failed}${NC}"
    done
    echo -e "\n${YELLOW}💡 Revisa los logs arriba para más detalles${NC}"
    exit 1
else
    echo -e "${GREEN}🎉 Todos los servicios desplegados exitosamente${NC}"
fi

# 4. Mostrar endpoints
echo -e "\n${BLUE}========================================${NC}"
echo -e "${BLUE}  Endpoints Desplegados${NC}"
echo -e "${BLUE}========================================${NC}"

API_URL=$(aws cloudformation describe-stacks \
    --stack-name "portal-admin-infrastructure-${STAGE}" \
    --profile "pa-${STAGE}" \
    --region us-west-2 \
    --query 'Stacks[0].Outputs[?OutputKey==`HttpApiUrl`].OutputValue' \
    --output text 2>/dev/null)

if [ -n "$API_URL" ]; then
    echo -e "${GREEN}API Base URL: ${API_URL}${NC}"
    echo -e "\n${BLUE}Ejemplos de endpoints:${NC}"
    echo -e "  ${API_URL}/v1/mantenedor/bancos"
    echo -e "  ${API_URL}/v1/documentos/pdf"
    echo -e "  ${API_URL}/v1/programas/solicitudes/programas"
    echo -e "  ${API_URL}/v1/sesiones/iniciar-sesion"
    echo -e "  ${API_URL}/v1/pagos/cuotas/crear"
fi

echo -e "\n${GREEN}✅ Deployment completado${NC}\n"
