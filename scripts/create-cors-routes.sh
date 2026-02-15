#!/bin/bash

# Script para crear rutas OPTIONS en API Gateway HTTP API para soporte CORS
# Uso: ./create-cors-routes.sh <api-id> <region> <profile>

set -e

API_ID=${1:-"2z8nmi3vee"}
REGION=${2:-"us-west-2"}
PROFILE=${3:-"pa-dev"}

echo "🚀 Creando rutas OPTIONS para API Gateway: $API_ID"
echo "📍 Región: $REGION"
echo "👤 Perfil: $PROFILE"
echo ""

# Obtener todas las rutas existentes (excluir $default y OPTIONS)
ROUTES=$(aws apigatewayv2 get-routes \
  --api-id "$API_ID" \
  --region "$REGION" \
  --profile "$PROFILE" \
  --query 'Items[?RouteKey!=`$default` && !contains(RouteKey, `OPTIONS`)].RouteKey' \
  --output text)

if [ -z "$ROUTES" ]; then
  echo "❌ No se encontraron rutas"
  exit 1
fi

# Convertir rutas a array
IFS=$'\t' read -r -a ROUTE_ARRAY <<< "$ROUTES"

echo "📋 Se encontraron ${#ROUTE_ARRAY[@]} rutas:"
printf '%s\n' "${ROUTE_ARRAY[@]}"
echo ""

# Crear integración mock si no existe
echo "🔧 Verificando integración mock..."
MOCK_INTEGRATION_ID=$(aws apigatewayv2 get-integrations \
  --api-id "$API_ID" \
  --region "$REGION" \
  --profile "$PROFILE" \
  --query 'Items[?IntegrationType==`MOCK`].IntegrationId | [0]' \
  --output text 2>/dev/null)

if [ "$MOCK_INTEGRATION_ID" == "None" ] || [ -z "$MOCK_INTEGRATION_ID" ] || [ "$MOCK_INTEGRATION_ID" == "null" ]; then
  echo "⚙️  Creando integración mock..."
  MOCK_INTEGRATION_ID=$(aws apigatewayv2 create-integration \
    --api-id "$API_ID" \
    --region "$REGION" \
    --profile "$PROFILE" \
    --integration-type MOCK \
    --payload-format-version "1.0" \
    --query 'IntegrationId' \
    --output text)
  echo "✅ Integración mock creada: $MOCK_INTEGRATION_ID"
else
  echo "✅ Integración mock existente: $MOCK_INTEGRATION_ID"
fi

echo ""

# Crear rutas OPTIONS para cada ruta
SUCCESS_COUNT=0
ERROR_COUNT=0

for ROUTE in "${ROUTE_ARRAY[@]}"; do
  # Extraer el path de la ruta (remover el método)
  PATH=$(echo "$ROUTE" | sed 's/^[A-Z]* //')
  OPTIONS_ROUTE="OPTIONS $PATH"

  echo "🔄 Procesando: $OPTIONS_ROUTE"

  # Verificar si ya existe
  EXISTING=$(aws apigatewayv2 get-routes \
    --api-id "$API_ID" \
    --region "$REGION" \
    --profile "$PROFILE" \
    --query "Items[?RouteKey==\`$OPTIONS_ROUTE\`].RouteId | [0]" \
    --output text 2>/dev/null || echo "")

  if [ "$EXISTING" != "None" ] && [ -n "$EXISTING" ]; then
    echo "   ⏭️  Ya existe, omitiendo..."
    ((SUCCESS_COUNT++))
    continue
  fi

  # Crear ruta OPTIONS
  ROUTE_ID=$(aws apigatewayv2 create-route \
    --api-id "$API_ID" \
    --region "$REGION" \
    --profile "$PROFILE" \
    --route-key "$OPTIONS_ROUTE" \
    --target "integrations/$MOCK_INTEGRATION_ID" \
    --query 'RouteId' \
    --output text 2>&1)

  if [ $? -eq 0 ]; then
    echo "   ✅ Creada exitosamente: $ROUTE_ID"
    ((SUCCESS_COUNT++))
  else
    echo "   ❌ Error: $ROUTE_ID"
    ((ERROR_COUNT++))
  fi
done

echo ""
echo "📊 Resumen:"
echo "   ✅ Éxitos: $SUCCESS_COUNT"
echo "   ❌ Errores: $ERROR_COUNT"
echo ""
echo "🎉 ¡Proceso completado!"
