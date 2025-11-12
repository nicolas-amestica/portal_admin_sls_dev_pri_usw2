#!/bin/bash

# Script para configurar parámetros de Transbank en AWS Systems Manager
# Uso: ./setup-ssm-parameters.sh dev us-west-2 pa-dev

STAGE=${1:-dev}
REGION=${2:-us-west-2}
PROFILE=${3:-pa-dev}

echo "================================================"
echo "Configurando parámetros SSM para Transbank"
echo "Stage: ${STAGE}"
echo "Region: ${REGION}"
echo "Profile: ${PROFILE}"
echo "================================================"
echo ""

# 1. Ambiente (integration o production)
echo "1. Configurando ambiente..."
aws ssm put-parameter \
  --name "/transbank/${STAGE}/environment" \
  --value "integration" \
  --type "String" \
  --description "Ambiente de Transbank (integration o production)" \
  --region ${REGION} \
  --profile ${PROFILE} \
  --overwrite 2>/dev/null || \
aws ssm put-parameter \
  --name "/transbank/${STAGE}/environment" \
  --value "integration" \
  --type "String" \
  --description "Ambiente de Transbank (integration o production)" \
  --region ${REGION} \
  --profile ${PROFILE}

echo "✅ Ambiente configurado: integration"
echo ""

# 2. Código de comercio (dejar vacío para integración)
echo "2. Configurando código de comercio..."
aws ssm put-parameter \
  --name "/transbank/${STAGE}/commerce-code" \
  --value "597055555532" \
  --type "String" \
  --description "Código de comercio de Transbank (solo para producción)" \
  --region ${REGION} \
  --profile ${PROFILE} \
  --overwrite 2>/dev/null || \
aws ssm put-parameter \
  --name "/transbank/${STAGE}/commerce-code" \
  --value "597055555532" \
  --type "String" \
  --description "Código de comercio de Transbank (solo para producción)" \
  --region ${REGION} \
  --profile ${PROFILE}

echo "✅ Código de comercio configurado (integración)"
echo ""

# 3. Frontend URL
echo "3. Configurando URL del frontend..."
read -p "Ingresa la URL del frontend (ej: http://localhost:4200 o https://portal.girasindomito.cl): " FRONTEND_URL

if [ -z "$FRONTEND_URL" ]; then
  FRONTEND_URL="http://localhost:4200"
  echo "⚠️  Usando URL por defecto: ${FRONTEND_URL}"
fi

aws ssm put-parameter \
  --name "/transbank/${STAGE}/frontend-url" \
  --value "${FRONTEND_URL}" \
  --type "String" \
  --description "URL del frontend para return URL de Transbank" \
  --region ${REGION} \
  --profile ${PROFILE} \
  --overwrite 2>/dev/null || \
aws ssm put-parameter \
  --name "/transbank/${STAGE}/frontend-url" \
  --value "${FRONTEND_URL}" \
  --type "String" \
  --description "URL del frontend para return URL de Transbank" \
  --region ${REGION} \
  --profile ${PROFILE}

echo "✅ Frontend URL configurada: ${FRONTEND_URL}"
echo ""

# Listar parámetros creados
echo "================================================"
echo "Parámetros SSM configurados:"
echo "================================================"
aws ssm get-parameters-by-path \
  --path "/transbank/${STAGE}" \
  --region ${REGION} \
  --profile ${PROFILE} \
  --output table

echo ""
echo "================================================"
echo "✅ Configuración completada!"
echo "================================================"
echo ""
echo "IMPORTANTE para PRODUCCIÓN:"
echo "1. Cambia el ambiente a 'production':"
echo "   aws ssm put-parameter --name '/transbank/${STAGE}/environment' --value 'production' --overwrite --region ${REGION} --profile ${PROFILE}"
echo ""
echo "2. Actualiza el código de comercio con tu código real:"
echo "   aws ssm put-parameter --name '/transbank/${STAGE}/commerce-code' --value 'TU_CODIGO_REAL' --overwrite --region ${REGION} --profile ${PROFILE}"
echo ""
echo "3. Crea el API Key en Secrets Manager:"
echo "   aws secretsmanager create-secret --name 'transbank-api-key-${STAGE}-pri-usw2' --secret-string 'TU_API_KEY' --region ${REGION} --profile ${PROFILE}"
echo ""
