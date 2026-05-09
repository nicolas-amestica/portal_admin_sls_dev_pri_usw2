#!/bin/bash

# Deployment rápido (salida filtrada).
# Orden: infra → job-authorizer (authorizer HTTP API) → resto (incl. api-ticket).
# Tras actualizar JWT/endpoints: los usuarios deben iniciar sesión de nuevo.
#
# Uso: ./deploy-quick.sh [dev|qa|prd] [service1,service2,...]

STAGE=${1:-dev}
TARGET_SERVICES_CSV=${2:-}
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

ALL_SERVICES=(
  "job-authorizer"
  "api-maintainer"
  "api-contract"
  "api-program"
  "api-ticket"
  "api-entity"
  "api-payment"
  "api-balance"
  "api-extraction"
  "api-notification"
  "api-configuration"
  "api-favorites"
  "api-meet"
  "api-whatsapp-agent"
  "api-accounting"
  "job-trigger"
  "job-instagram-poster"
)

SERVICES=()
if [ -n "$TARGET_SERVICES_CSV" ]; then
  IFS=',' read -r -a REQUESTED <<< "$TARGET_SERVICES_CSV"
  for requested in "${REQUESTED[@]}"; do
    requested="$(echo "$requested" | xargs)"
    if [ -n "$requested" ]; then
      SERVICES+=("$requested")
    fi
  done
else
  SERVICES=("${ALL_SERVICES[@]}")
fi

TOTAL=${#SERVICES[@]}

echo "🚀 Portal Admin — stage ${STAGE} (${TOTAL} servicios)"
echo "ℹ️  Si desplegaste cambios de auth/JWT: cerrar sesión y volver a entrar en el portal."
if [ -n "$TARGET_SERVICES_CSV" ]; then
  echo "🎯 Modo selectivo: ${TARGET_SERVICES_CSV}"
fi
echo ""

echo "📦 Infraestructura..."
if aws cloudformation describe-stacks --stack-name "portal-admin-infrastructure-${STAGE}" --profile "pa-${STAGE}" --region us-west-2 >/dev/null 2>&1; then
  echo "   ✅ Stack infra ya existe"
else
  echo "   🏗️  Desplegando infraestructura..."
  cd "$PROJECT_ROOT/infrastructure"
  npx sls deploy --stage "$STAGE" 2>&1 | grep -E '(Service deployed|Error|✔|✖)' || true
  cd "$PROJECT_ROOT"
fi

n=1
for service in "${SERVICES[@]}"; do
  dir="$PROJECT_ROOT/services/$service"
  if [ ! -d "$dir" ]; then
    echo "⚠️  Omitido (no existe): $service"
    continue
  fi
  echo "📦 $n/$TOTAL — $service"
  cd "$dir"
  if [ -f "go.mod" ]; then
    echo "   🔨 Go: make build"
    make build
  fi
  npx sls deploy --stage "$STAGE" 2>&1 | grep -E '(Service deployed|Error|✔|✖)' || true
  n=$((n + 1))
  cd "$PROJECT_ROOT"
done

echo ""
echo "🎉 Deploy-quick finalizado."

API_URL=$(aws cloudformation describe-stacks \
  --stack-name "portal-admin-infrastructure-${STAGE}" \
  --profile "pa-${STAGE}" \
  --region us-west-2 \
  --query 'Stacks[0].Outputs[?OutputKey==`HttpApiUrl`].OutputValue' \
  --output text 2>/dev/null)

if [ -n "$API_URL" ]; then
  echo "🌐 API: ${API_URL}"
fi
