#!/bin/bash

# Script para ejecutar AWS Lambda Power Tuning en funciones específicas

set -e

REGION="us-west-2"
PROFILE="pa-dev"
STATE_MACHINE_ARN=""  # Se autodetecta o se pasa como parámetro

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

function print_usage() {
    echo ""
    echo "Uso: $0 <function-name> [account-id]"
    echo ""
    echo "Funciones disponibles:"
    echo "  - build_document_by_form_v1"
    echo "  - get_pdf_document_by_sk_from_program_v1"
    echo "  - approve_program_v1"
    echo "  - confirm_program_v1"
    echo "  - create_transaction_v1"
    echo ""
    echo "Ejemplo:"
    echo "  $0 build_document_by_form_v1 123456789012"
    echo ""
    exit 1
}

# Verificar parámetros
if [ -z "$1" ]; then
    print_usage
fi

FUNCTION_NAME=$1
ACCOUNT_ID=${2:-""}

# Autodetectar Account ID si no se proporciona
if [ -z "$ACCOUNT_ID" ]; then
    echo -e "${BLUE}📋 Detectando Account ID...${NC}"
    ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text --profile ${PROFILE})
    echo -e "${GREEN}✅ Account ID: ${ACCOUNT_ID}${NC}"
fi

# Verificar que el payload exista
PAYLOAD_FILE="payloads/${FUNCTION_NAME}.json"
if [ ! -f "$PAYLOAD_FILE" ]; then
    echo -e "${RED}❌ Error: Payload no encontrado: ${PAYLOAD_FILE}${NC}"
    print_usage
fi

# Autodetectar State Machine ARN
if [ -z "$STATE_MACHINE_ARN" ]; then
    echo -e "${BLUE}🔍 Buscando State Machine ARN...${NC}"
    STATE_MACHINE_ARN=$(aws cloudformation describe-stacks \
        --stack-name lambda-power-tuning \
        --query 'Stacks[0].Outputs[?OutputKey==`StateMachineArn`].OutputValue' \
        --output text \
        --region ${REGION} \
        --profile ${PROFILE} 2>/dev/null || echo "")

    if [ -z "$STATE_MACHINE_ARN" ]; then
        echo -e "${RED}❌ Error: No se encontró la State Machine${NC}"
        echo -e "${YELLOW}💡 Ejecuta primero: ./install.sh${NC}"
        exit 1
    fi

    echo -e "${GREEN}✅ State Machine: ${STATE_MACHINE_ARN}${NC}"
fi

# Reemplazar ACCOUNT_ID en el payload
echo -e "${BLUE}📝 Preparando payload...${NC}"
TEMP_PAYLOAD=$(mktemp)
sed "s/ACCOUNT_ID/${ACCOUNT_ID}/g" "$PAYLOAD_FILE" > "$TEMP_PAYLOAD"

echo -e "${GREEN}✅ Payload preparado${NC}"
echo ""

# Mostrar configuración
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}  Configuración de Power Tuning${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "Función:        ${YELLOW}${FUNCTION_NAME}${NC}"
echo -e "Account ID:     ${YELLOW}${ACCOUNT_ID}${NC}"
echo -e "Region:         ${YELLOW}${REGION}${NC}"
echo -e "Profile:        ${YELLOW}${PROFILE}${NC}"
echo ""

# Extraer configuración del payload
POWER_VALUES=$(cat "$TEMP_PAYLOAD" | jq -r '.powerValues | join(", ")')
NUM_INVOCATIONS=$(cat "$TEMP_PAYLOAD" | jq -r '.num')
STRATEGY=$(cat "$TEMP_PAYLOAD" | jq -r '.strategy')

echo -e "Memorias a probar: ${GREEN}${POWER_VALUES} MB${NC}"
echo -e "Invocaciones:      ${GREEN}${NUM_INVOCATIONS}${NC}"
echo -e "Estrategia:        ${GREEN}${STRATEGY}${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo ""

# Confirmación
read -p "¿Continuar con el power tuning? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo -e "${YELLOW}⏹️  Cancelado${NC}"
    rm "$TEMP_PAYLOAD"
    exit 0
fi

echo ""
echo -e "${BLUE}🚀 Ejecutando Power Tuning...${NC}"
echo ""

# Ejecutar State Machine
EXECUTION_ARN=$(aws stepfunctions start-execution \
    --state-machine-arn ${STATE_MACHINE_ARN} \
    --input file://${TEMP_PAYLOAD} \
    --region ${REGION} \
    --profile ${PROFILE} \
    --query 'executionArn' \
    --output text)

echo -e "${GREEN}✅ Ejecución iniciada${NC}"
echo -e "ARN: ${EXECUTION_ARN}"
echo ""

# Esperar y mostrar progreso
echo -e "${BLUE}⏳ Esperando resultados...${NC}"
echo ""

STATUS="RUNNING"
while [ "$STATUS" == "RUNNING" ]; do
    sleep 10
    STATUS=$(aws stepfunctions describe-execution \
        --execution-arn ${EXECUTION_ARN} \
        --region ${REGION} \
        --profile ${PROFILE} \
        --query 'status' \
        --output text)

    echo -e "${YELLOW}   Estado: ${STATUS}${NC}"
done

echo ""

# Verificar resultado
if [ "$STATUS" == "SUCCEEDED" ]; then
    echo -e "${GREEN}✅ Power Tuning completado exitosamente${NC}"
    echo ""

    # Obtener resultados
    OUTPUT=$(aws stepfunctions describe-execution \
        --execution-arn ${EXECUTION_ARN} \
        --region ${REGION} \
        --profile ${PROFILE} \
        --query 'output' \
        --output text)

    # Extraer información clave
    OPTIMAL_POWER=$(echo "$OUTPUT" | jq -r '.optimal.power // .stateMachine.optimal.power // "N/A"')
    VISUALIZATION_URL=$(echo "$OUTPUT" | jq -r '.visualization // .stateMachine.visualization // "N/A"')

    echo -e "${BLUE}═══════════════════════════════════════${NC}"
    echo -e "${BLUE}  Resultados${NC}"
    echo -e "${BLUE}═══════════════════════════════════════${NC}"
    echo -e "Memoria óptima:  ${GREEN}${OPTIMAL_POWER} MB${NC}"
    echo -e "${BLUE}═══════════════════════════════════════${NC}"
    echo ""
    echo -e "${YELLOW}📊 Visualización:${NC}"
    echo -e "${VISUALIZATION_URL}"
    echo ""

    # Guardar resultados
    RESULTS_DIR="results"
    mkdir -p "$RESULTS_DIR"
    RESULTS_FILE="${RESULTS_DIR}/${FUNCTION_NAME}_$(date +%Y%m%d_%H%M%S).json"
    echo "$OUTPUT" > "$RESULTS_FILE"

    echo -e "${GREEN}✅ Resultados guardados en: ${RESULTS_FILE}${NC}"
    echo ""

    # Sugerencia de próximos pasos
    echo -e "${BLUE}📝 Próximos pasos:${NC}"
    echo -e "   1. Revisar visualización en el navegador"
    echo -e "   2. Aplicar configuración: ${YELLOW}node ../../scripts/apply-power-tuning-results.js ${RESULTS_FILE}${NC}"
    echo ""

else
    echo -e "${RED}❌ Error en la ejecución: ${STATUS}${NC}"
    echo ""

    # Mostrar error
    ERROR=$(aws stepfunctions describe-execution \
        --execution-arn ${EXECUTION_ARN} \
        --region ${REGION} \
        --profile ${PROFILE} \
        --query 'error' \
        --output text 2>/dev/null || echo "Error desconocido")

    echo -e "${RED}Error: ${ERROR}${NC}"
fi

# Limpiar
rm "$TEMP_PAYLOAD"

echo ""
