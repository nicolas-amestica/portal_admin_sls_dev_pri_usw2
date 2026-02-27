#!/usr/bin/env bash
# =============================================================================
# teardown.sh — Eliminación completa de recursos AWS
# Portal Admin — Giras Indómito
#
# Uso:
#   ./scripts/teardown.sh [STAGE] [REGION]
#
# Ejemplos:
#   ./scripts/teardown.sh dev us-west-2
#   ./scripts/teardown.sh prod us-west-2
#
# ADVERTENCIA: Este script elimina TODOS los recursos de la cuenta para el
# stage indicado. Esta operación es IRREVERSIBLE (excepto DynamoDB con PITR).
# Se pedirá confirmación explícita antes de proceder.
#
# Elimina en orden inverso al bootstrap:
#   1. Stacks de CloudFormation (Lambdas + API Gateway)
#   2. Tablas DynamoDB
#   3. Secrets Manager
#   4. Buckets S3 (vaciar + eliminar)
# =============================================================================

set -euo pipefail

# ─── Parámetros ───────────────────────────────────────────────────────────────
STAGE="${1:-dev}"
REGION="${2:-us-west-2}"
PROFILE="pa-${STAGE}"

case "$REGION" in
  "us-east-1") SHORT_REGION="use1" ;;
  "us-east-2") SHORT_REGION="use2" ;;
  "us-west-1") SHORT_REGION="usw1" ;;
  "us-west-2") SHORT_REGION="usw2" ;;
  "sa-east-1") SHORT_REGION="sae1" ;;
  *) SHORT_REGION="" ;;
esac

if [[ -z "$SHORT_REGION" ]]; then
  echo "❌ Región no soportada: $REGION"
  exit 1
fi

# ─── Nombres de recursos ──────────────────────────────────────────────────────
BUCKET_DEPLOY="sls-deploys-${STAGE}-pri-${SHORT_REGION}"
BUCKET_INFO="giras-indomito-${STAGE}-info"

TABLE_PROGRAMS="programs-${STAGE}-pri-${SHORT_REGION}"
TABLE_USERS="users-${STAGE}-pri-${SHORT_REGION}"
TABLE_CONFIG="config-${STAGE}-pri-${SHORT_REGION}"
TABLE_PAYMENTS="payments-${STAGE}-pri-${SHORT_REGION}"
TABLE_MAINTAINER="maintainer-${STAGE}-pri-${SHORT_REGION}"

SECRET_JWT="secret-pri-${STAGE}-${SHORT_REGION}"
SECRET_EMAIL="email-config-${STAGE}-pri-${SHORT_REGION}"
SECRET_TRANSBANK="transbank-api-key-${STAGE}-pri-${SHORT_REGION}"

# Stacks de CloudFormation en orden de eliminación (dependencias primero)
CF_STACKS=(
  "balances-${STAGE}"
  "contratos-${STAGE}"
  "extracciones-${STAGE}"
  "mantenedor-${STAGE}"
  "notificaciones-${STAGE}"
  "pagos-${STAGE}"
  "programas-${STAGE}"
  "usuarios-${STAGE}"
  "configuracion-go-${STAGE}"
  "autorizador-${STAGE}"
  "portal-admin-infrastructure-${STAGE}"
)

# ─── Colores ──────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; CYAN='\033[0;36m'; NC='\033[0m'

log_step()  { echo -e "\n${BLUE}══════════════════════════════════════${NC}"; echo -e "${BLUE}▶ $1${NC}"; }
log_ok()    { echo -e "  ${GREEN}✔${NC} $1"; }
log_warn()  { echo -e "  ${YELLOW}⚠${NC}  $1"; }
log_skip()  { echo -e "  ${CYAN}→${NC} $1 no existe, omitiendo"; }
log_error() { echo -e "  ${RED}✘${NC} $1"; }

# ─── Encabezado ───────────────────────────────────────────────────────────────
echo -e "${RED}"
echo "╔════════════════════════════════════════════════════╗"
echo "║     ⚠️  Portal Admin — TEARDOWN COMPLETO  ⚠️       ║"
echo "╚════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo -e "  Stage  : ${YELLOW}${STAGE}${NC}"
echo -e "  Región : ${YELLOW}${REGION}${NC} (${SHORT_REGION})"
echo -e "  Perfil : ${YELLOW}${PROFILE}${NC}"
echo ""
echo -e "${RED}ADVERTENCIA: Esta operación eliminará TODOS los recursos listados.${NC}"
echo -e "${RED}Los datos en DynamoDB y S3 serán PERMANENTEMENTE eliminados.${NC}"
echo ""

# ─── Confirmación doble ───────────────────────────────────────────────────────
read -rp "¿Confirmas la eliminación del entorno '${STAGE}'? Escribe 'ELIMINAR' para continuar: " CONFIRM
if [[ "$CONFIRM" != "ELIMINAR" ]]; then
  echo "Operación cancelada."
  exit 0
fi

read -rp "Segunda confirmación — ¿seguro? Escribe el stage '${STAGE}' para confirmar: " CONFIRM2
if [[ "$CONFIRM2" != "$STAGE" ]]; then
  echo "Operación cancelada."
  exit 0
fi

echo ""
echo -e "${YELLOW}Iniciando teardown...${NC}"

# ─── Verificar perfil ─────────────────────────────────────────────────────────
if ! aws configure list --profile "$PROFILE" &>/dev/null; then
  log_error "Perfil '$PROFILE' no existe"
  exit 1
fi

# =============================================================================
# PASO 1 — ELIMINAR STACKS CLOUDFORMATION (Lambdas + APIGW)
# =============================================================================
log_step "PASO 1/4 — Stacks CloudFormation"

for stack in "${CF_STACKS[@]}"; do
  if aws cloudformation describe-stacks \
      --stack-name "$stack" \
      --profile "$PROFILE" \
      --region "$REGION" \
      --output text &>/dev/null 2>&1; then

    echo -e "  Eliminando stack: ${YELLOW}${stack}${NC}"

    # Vaciar buckets de despliegue dentro del stack si existen
    aws cloudformation delete-stack \
      --stack-name "$stack" \
      --profile "$PROFILE" \
      --region "$REGION" \
      --output text &>/dev/null

    echo -n "  Esperando que '${stack}' se elimine..."
    aws cloudformation wait stack-delete-complete \
      --stack-name "$stack" \
      --profile "$PROFILE" \
      --region "$REGION" && echo "" && log_ok "Stack '${stack}' eliminado" || \
      log_warn "Stack '${stack}' puede haber fallado — verifica en consola"
  else
    log_skip "Stack ${stack}"
  fi
done

# =============================================================================
# PASO 2 — ELIMINAR TABLAS DYNAMODB
# =============================================================================
log_step "PASO 2/4 — Tablas DynamoDB"

delete_table() {
  local table="$1"
  if aws dynamodb describe-table \
      --table-name "$table" \
      --profile "$PROFILE" \
      --region "$REGION" \
      --output text &>/dev/null 2>&1; then

    echo -e "  Eliminando tabla: ${YELLOW}${table}${NC}"
    aws dynamodb delete-table \
      --table-name "$table" \
      --profile "$PROFILE" \
      --region "$REGION" \
      --output text &>/dev/null

    aws dynamodb wait table-not-exists \
      --table-name "$table" \
      --profile "$PROFILE" \
      --region "$REGION"
    log_ok "Tabla eliminada: ${table}"
  else
    log_skip "Tabla ${table}"
  fi
}

delete_table "$TABLE_PROGRAMS"
delete_table "$TABLE_USERS"
delete_table "$TABLE_CONFIG"
delete_table "$TABLE_PAYMENTS"
delete_table "$TABLE_MAINTAINER"

# =============================================================================
# PASO 3 — ELIMINAR SECRETS MANAGER
# =============================================================================
log_step "PASO 3/4 — Secrets Manager"

delete_secret() {
  local secret="$1"
  if aws secretsmanager describe-secret \
      --secret-id "$secret" \
      --profile "$PROFILE" \
      --region "$REGION" \
      --output text &>/dev/null 2>&1; then

    echo -e "  Eliminando secreto: ${YELLOW}${secret}${NC}"
    # force-delete-without-recovery elimina inmediatamente sin los 7 días de retención
    aws secretsmanager delete-secret \
      --secret-id "$secret" \
      --force-delete-without-recovery \
      --profile "$PROFILE" \
      --region "$REGION" \
      --output text &>/dev/null
    log_ok "Secreto eliminado: ${secret}"
  else
    log_skip "Secreto ${secret}"
  fi
}

delete_secret "$SECRET_JWT"
delete_secret "$SECRET_EMAIL"
delete_secret "$SECRET_TRANSBANK"

# =============================================================================
# PASO 4 — VACIAR Y ELIMINAR BUCKETS S3
# =============================================================================
log_step "PASO 4/4 — Buckets S3"

delete_bucket() {
  local bucket="$1"

  if ! aws s3api head-bucket --bucket "$bucket" --profile "$PROFILE" 2>/dev/null; then
    log_skip "Bucket ${bucket}"
    return
  fi

  echo -e "  Vaciando bucket: ${YELLOW}${bucket}${NC}"

  # Eliminar todos los objetos (incluye versiones y delete markers)
  aws s3 rm "s3://${bucket}" \
    --recursive \
    --profile "$PROFILE" \
    --output text &>/dev/null 2>&1 || true

  # Eliminar versiones (si tiene versionado habilitado)
  VERSIONS=$(aws s3api list-object-versions \
    --bucket "$bucket" \
    --profile "$PROFILE" \
    --query 'Versions[].{Key:Key,VersionId:VersionId}' \
    --output json 2>/dev/null || echo "[]")

  if [[ "$VERSIONS" != "[]" && "$VERSIONS" != "null" ]]; then
    echo "$VERSIONS" | python3 -c "
import sys, json, subprocess
versions = json.load(sys.stdin)
if not versions:
    sys.exit(0)
objects = [{'Key': v['Key'], 'VersionId': v['VersionId']} for v in versions]
# Borrar en lotes de 1000
for i in range(0, len(objects), 1000):
    batch = objects[i:i+1000]
    cmd = ['aws', 's3api', 'delete-objects',
           '--bucket', '$bucket',
           '--profile', '$PROFILE',
           '--delete', json.dumps({'Objects': batch, 'Quiet': True}),
           '--output', 'text']
    subprocess.run(cmd, capture_output=True)
print(f'  Eliminadas {len(objects)} versiones')
" 2>/dev/null || true
  fi

  # Eliminar delete markers
  MARKERS=$(aws s3api list-object-versions \
    --bucket "$bucket" \
    --profile "$PROFILE" \
    --query 'DeleteMarkers[].{Key:Key,VersionId:VersionId}' \
    --output json 2>/dev/null || echo "[]")

  if [[ "$MARKERS" != "[]" && "$MARKERS" != "null" ]]; then
    echo "$MARKERS" | python3 -c "
import sys, json, subprocess
markers = json.load(sys.stdin)
if not markers:
    sys.exit(0)
objects = [{'Key': m['Key'], 'VersionId': m['VersionId']} for m in markers]
cmd = ['aws', 's3api', 'delete-objects',
       '--bucket', '$bucket',
       '--profile', '$PROFILE',
       '--delete', json.dumps({'Objects': objects, 'Quiet': True}),
       '--output', 'text']
subprocess.run(cmd, capture_output=True)
print(f'  Eliminados {len(objects)} delete markers')
" 2>/dev/null || true
  fi

  # Eliminar bucket
  aws s3api delete-bucket \
    --bucket "$bucket" \
    --profile "$PROFILE" \
    --region "$REGION" \
    --output text &>/dev/null
  log_ok "Bucket eliminado: ${bucket}"
}

delete_bucket "$BUCKET_INFO"
delete_bucket "$BUCKET_DEPLOY"

# =============================================================================
# RESUMEN
# =============================================================================
echo ""
echo -e "${GREEN}"
echo "╔════════════════════════════════════════════════════╗"
echo "║         Teardown completado exitosamente           ║"
echo "╚════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo -e "  Entorno ${YELLOW}${STAGE}${NC} eliminado completamente."
echo ""
echo "  Para volver a desplegar desde cero:"
echo "    ./scripts/bootstrap.sh ${STAGE} ${REGION}"
echo ""
