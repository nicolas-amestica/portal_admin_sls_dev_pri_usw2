#!/usr/bin/env bash
# =============================================================================
# bootstrap.sh — Aprovisionamiento completo de recursos AWS
# Portal Admin — Giras Indómito
#
# Uso:
#   ./scripts/bootstrap.sh [STAGE] [REGION]
#
# Ejemplos:
#   ./scripts/bootstrap.sh dev us-west-2
#   ./scripts/bootstrap.sh prod us-west-2
#
# IMPORTANTE: Ejecutar ANTES de cualquier `sls deploy`.
# Crea en orden:
#   1. Buckets S3
#   2. SSM Parameter Store (SecureString)
#   3. Tablas DynamoDB + índices GSI
#   4. Verifica que el perfil AWS existe
# =============================================================================

set -euo pipefail

# ─── Parámetros ───────────────────────────────────────────────────────────────
STAGE="${1:-dev}"
REGION="${2:-us-west-2}"
PROFILE="pa-${STAGE}"

# Mapeo de región a sigla
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
  echo "   Regiones válidas: us-east-1, us-east-2, us-west-1, us-west-2, sa-east-1"
  exit 1
fi

# ─── Nombres de recursos (siguiendo la convención del proyecto) ───────────────
BUCKET_DEPLOY="sls-deploys-${STAGE}-pri-${SHORT_REGION}"
BUCKET_INFO="giras-indomito-${STAGE}-info"

TABLE_PROGRAMS="programs-${STAGE}-pri-${SHORT_REGION}"
TABLE_USERS="users-${STAGE}-pri-${SHORT_REGION}"
TABLE_CONFIG="config-${STAGE}-pri-${SHORT_REGION}"
TABLE_PAYMENTS="payments-${STAGE}-pri-${SHORT_REGION}"
TABLE_MAINTAINER="maintainer-${STAGE}-pri-${SHORT_REGION}"

PARAM_JWT="/pa/${STAGE}/jwt-key"
PARAM_EMAIL="/pa/${STAGE}/email-config"
PARAM_TRANSBANK="/pa/${STAGE}/transbank-api-key"
PARAM_WHATSAPP="/pa/${STAGE}/whatsapp-config"
PARAM_GEMINI="/pa/${STAGE}/gemini-api-key"
PARAM_GOOGLE_CALENDAR="/pa/${STAGE}/google-calendar-oauth"
PARAM_GOOGLE_CALENDAR_SA="/pa/${STAGE}/google-calendar-sa"

# ─── Colores ──────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; CYAN='\033[0;36m'; NC='\033[0m'

log_step()  { echo -e "\n${BLUE}══════════════════════════════════════${NC}"; echo -e "${BLUE}▶ $1${NC}"; }
log_ok()    { echo -e "  ${GREEN}✔${NC} $1"; }
log_warn()  { echo -e "  ${YELLOW}⚠${NC}  $1"; }
log_error() { echo -e "  ${RED}✘${NC} $1"; }
log_info()  { echo -e "  ${CYAN}ℹ${NC}  $1"; }

# ─── Función: recurso ya existe ───────────────────────────────────────────────
already_exists() { log_warn "$1 ya existe — omitiendo"; }

# ─── Encabezado ───────────────────────────────────────────────────────────────
echo -e "${CYAN}"
echo "╔════════════════════════════════════════════════════╗"
echo "║        Portal Admin — Bootstrap de AWS             ║"
echo "╚════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo -e "  Stage  : ${YELLOW}${STAGE}${NC}"
echo -e "  Región : ${YELLOW}${REGION}${NC} (${SHORT_REGION})"
echo -e "  Perfil : ${YELLOW}${PROFILE}${NC}"
echo ""

# ─── Verificar perfil AWS ─────────────────────────────────────────────────────
log_step "Verificando perfil AWS: ${PROFILE}"
if ! aws configure list --profile "$PROFILE" &>/dev/null; then
  log_error "Perfil '$PROFILE' no existe en ~/.aws/credentials"
  echo ""
  echo "  Crea el perfil ejecutando:"
  echo "  aws configure --profile ${PROFILE}"
  exit 1
fi
log_ok "Perfil '${PROFILE}' encontrado"

AWS_ACCOUNT=$(aws sts get-caller-identity --profile "$PROFILE" --query Account --output text)
log_ok "Account ID: ${AWS_ACCOUNT}"

# =============================================================================
# PASO 1 — BUCKETS S3
# =============================================================================
log_step "PASO 1/3 — Buckets S3"

create_bucket() {
  local bucket="$1"
  local desc="$2"

  log_info "Creando bucket: ${bucket} (${desc})"

  if aws s3api head-bucket --bucket "$bucket" --profile "$PROFILE" 2>/dev/null; then
    already_exists "Bucket ${bucket}"
    return
  fi

  if [[ "$REGION" == "us-east-1" ]]; then
    aws s3api create-bucket \
      --bucket "$bucket" \
      --profile "$PROFILE" \
      --region "$REGION" \
      --output text &>/dev/null
  else
    aws s3api create-bucket \
      --bucket "$bucket" \
      --profile "$PROFILE" \
      --region "$REGION" \
      --create-bucket-configuration LocationConstraint="$REGION" \
      --output text &>/dev/null
  fi

  # Bloquear acceso público
  aws s3api put-public-access-block \
    --bucket "$bucket" \
    --profile "$PROFILE" \
    --public-access-block-configuration \
      "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true" \
    --output text &>/dev/null

  # Habilitar versionado
  aws s3api put-bucket-versioning \
    --bucket "$bucket" \
    --profile "$PROFILE" \
    --versioning-configuration Status=Enabled \
    --output text &>/dev/null

  log_ok "Bucket creado: ${bucket}"
}

create_bucket "$BUCKET_DEPLOY" "Artefactos de despliegue Serverless"
create_bucket "$BUCKET_INFO"   "Documentos e información de programas (PDFs, comprobantes)"

# Crear carpetas lógicas en el bucket de info
for prefix in contratos programas comprobantes; do
  aws s3api put-object \
    --bucket "$BUCKET_INFO" \
    --profile "$PROFILE" \
    --key "${prefix}/" \
    --output text &>/dev/null || true
  log_ok "Carpeta '${prefix}/' creada en ${BUCKET_INFO}"
done

# =============================================================================
# PASO 2 — SSM PARAMETER STORE
# =============================================================================
log_step "PASO 2/3 — SSM Parameter Store (SecureString)"

create_parameter() {
  local name="$1"
  local desc="$2"
  local value="$3"

  log_info "Creando parámetro SSM: ${name}"

  if aws ssm get-parameter \
      --name "$name" \
      --profile "$PROFILE" \
      --region "$REGION" \
      --output text &>/dev/null 2>&1; then
    already_exists "Parámetro ${name}"
    return
  fi

  aws ssm put-parameter \
    --name "$name" \
    --description "$desc" \
    --value "$value" \
    --type "SecureString" \
    --profile "$PROFILE" \
    --region "$REGION" \
    --output text &>/dev/null

  log_ok "Parámetro creado: ${name}"
  log_warn "⚠  REEMPLAZA el valor placeholder de '${name}' con el valor real."
}

create_parameter \
  "$PARAM_JWT" \
  "Clave secreta para firma de tokens JWT — Portal Admin ${STAGE}" \
  'JHF3#VvCdswwQ8nF(7jGrvbd4s'

create_parameter \
  "$PARAM_EMAIL" \
  "Configuración SMTP para envío de correos — Portal Admin ${STAGE}" \
  '{"host":"mail.girasindomito.cl","port":465,"secure":true,"user":"no-reply@girasindomito.cl","password":"GirasIndomito20261."}'

create_parameter \
  "$PARAM_TRANSBANK" \
  "Credenciales Transbank Webpay Plus — Portal Admin ${STAGE}" \
  '[{"transbank_api_key":"hY6%&4rFh&2@k)9"},{"transbank_commerce_code":"597055555532"},{"transbank_environment":"integration"}]'

create_parameter \
  "$PARAM_WHATSAPP" \
  "Credenciales WhatsApp Cloud API (Meta) — Portal Admin ${STAGE}" \
  '{"access_token":"PLACEHOLDER","phone_number_id":"PLACEHOLDER","verify_token":"PLACEHOLDER","app_secret":"PLACEHOLDER"}'

create_parameter \
  "$PARAM_GEMINI" \
  "API Key de Google Generative AI (Gemini) — Portal Admin ${STAGE}" \
  '{"api_key":"PLACEHOLDER"}'

create_parameter \
  "$PARAM_GOOGLE_CALENDAR" \
  "Credenciales OAuth2 de Google Calendar — Portal Admin ${STAGE}" \
  '{"client_id":"PLACEHOLDER","client_secret":"PLACEHOLDER","refresh_token":"PLACEHOLDER"}'

create_parameter \
  "$PARAM_GOOGLE_CALENDAR_SA" \
  "Service Account de Google Calendar (bot) — Portal Admin ${STAGE}" \
  '{"type":"service_account","project_id":"PLACEHOLDER","private_key_id":"PLACEHOLDER","private_key":"PLACEHOLDER","client_email":"PLACEHOLDER","client_id":"PLACEHOLDER"}'

# =============================================================================
# PASO 3 — TABLAS DYNAMODB
# =============================================================================
log_step "PASO 3/3 — Tablas DynamoDB"

# Función auxiliar: esperar que la tabla esté activa
wait_for_table() {
  local table="$1"
  log_info "Esperando que '${table}' esté ACTIVE..."
  aws dynamodb wait table-exists \
    --table-name "$table" \
    --profile "$PROFILE" \
    --region "$REGION"
  log_ok "Tabla '${table}' ACTIVE"
}

# ── 3.1 Tabla: programs ───────────────────────────────────────────────────────
log_info "Creando tabla: ${TABLE_PROGRAMS}"
log_info "  PK: pk (S) | SK: sk (S)"
log_info "  GSI: gsiOne-index      → PK: gsiOne (S)"
log_info "  GSI: gsiStartDate-index → PK: pk (S), SK: startDate (S)"

if aws dynamodb describe-table \
    --table-name "$TABLE_PROGRAMS" \
    --profile "$PROFILE" \
    --region "$REGION" \
    --output text &>/dev/null 2>&1; then
  already_exists "Tabla ${TABLE_PROGRAMS}"
else
  aws dynamodb create-table \
    --table-name "$TABLE_PROGRAMS" \
    --billing-mode PAY_PER_REQUEST \
    --attribute-definitions \
      AttributeName=pk,AttributeType=S \
      AttributeName=sk,AttributeType=S \
      AttributeName=gsiOne,AttributeType=S \
      AttributeName=startDate,AttributeType=S \
    --key-schema \
      AttributeName=pk,KeyType=HASH \
      AttributeName=sk,KeyType=RANGE \
    --global-secondary-indexes '[
      {
        "IndexName": "gsiOne-index",
        "KeySchema": [
          {"AttributeName": "gsiOne", "KeyType": "HASH"}
        ],
        "Projection": {"ProjectionType": "ALL"}
      },
      {
        "IndexName": "gsiStartDate-index",
        "KeySchema": [
          {"AttributeName": "pk",        "KeyType": "HASH"},
          {"AttributeName": "startDate", "KeyType": "RANGE"}
        ],
        "Projection": {"ProjectionType": "ALL"}
      }
    ]' \
    --profile "$PROFILE" \
    --region "$REGION" \
    --output text &>/dev/null

  wait_for_table "$TABLE_PROGRAMS"
fi

# Habilitar Point-in-Time Recovery
aws dynamodb update-continuous-backups \
  --table-name "$TABLE_PROGRAMS" \
  --point-in-time-recovery-specification PointInTimeRecoveryEnabled=true \
  --profile "$PROFILE" \
  --region "$REGION" \
  --output text &>/dev/null 2>&1 || true
log_ok "PITR habilitado en ${TABLE_PROGRAMS}"

# ── 3.2 Tabla: users ─────────────────────────────────────────────────────────
log_info "Creando tabla: ${TABLE_USERS}"
log_info "  PK: pk (S) | SK: sk (S)"
log_info "  GSI: gsiOne-index     → PK: gsiOne (S)      [RUT/username]"
log_info "  GSI: resetToken-index → PK: resetToken (S)  [recuperación de contraseña]"
log_info "  GSI: email-index      → PK: email (S)       [login con Google]"

if aws dynamodb describe-table \
    --table-name "$TABLE_USERS" \
    --profile "$PROFILE" \
    --region "$REGION" \
    --output text &>/dev/null 2>&1; then
  already_exists "Tabla ${TABLE_USERS}"
else
  aws dynamodb create-table \
    --table-name "$TABLE_USERS" \
    --billing-mode PAY_PER_REQUEST \
    --attribute-definitions \
      AttributeName=pk,AttributeType=S \
      AttributeName=sk,AttributeType=S \
      AttributeName=gsiOne,AttributeType=S \
      AttributeName=resetToken,AttributeType=S \
      AttributeName=email,AttributeType=S \
    --key-schema \
      AttributeName=pk,KeyType=HASH \
      AttributeName=sk,KeyType=RANGE \
    --global-secondary-indexes '[
      {
        "IndexName": "gsiOne-index",
        "KeySchema": [
          {"AttributeName": "gsiOne", "KeyType": "HASH"}
        ],
        "Projection": {"ProjectionType": "ALL"}
      },
      {
        "IndexName": "resetToken-index",
        "KeySchema": [
          {"AttributeName": "resetToken", "KeyType": "HASH"}
        ],
        "Projection": {"ProjectionType": "ALL"}
      },
      {
        "IndexName": "email-index",
        "KeySchema": [
          {"AttributeName": "email", "KeyType": "HASH"}
        ],
        "Projection": {"ProjectionType": "ALL"}
      }
    ]' \
    --profile "$PROFILE" \
    --region "$REGION" \
    --output text &>/dev/null

  wait_for_table "$TABLE_USERS"
fi

aws dynamodb update-continuous-backups \
  --table-name "$TABLE_USERS" \
  --point-in-time-recovery-specification PointInTimeRecoveryEnabled=true \
  --profile "$PROFILE" \
  --region "$REGION" \
  --output text &>/dev/null 2>&1 || true
log_ok "PITR habilitado en ${TABLE_USERS}"

# ── 3.3 Tabla: config ─────────────────────────────────────────────────────────
log_info "Creando tabla: ${TABLE_CONFIG}"
log_info "  PK: pk (S) | SK: sk (S)"

if aws dynamodb describe-table \
    --table-name "$TABLE_CONFIG" \
    --profile "$PROFILE" \
    --region "$REGION" \
    --output text &>/dev/null 2>&1; then
  already_exists "Tabla ${TABLE_CONFIG}"
else
  aws dynamodb create-table \
    --table-name "$TABLE_CONFIG" \
    --billing-mode PAY_PER_REQUEST \
    --attribute-definitions \
      AttributeName=pk,AttributeType=S \
      AttributeName=sk,AttributeType=S \
    --key-schema \
      AttributeName=pk,KeyType=HASH \
      AttributeName=sk,KeyType=RANGE \
    --profile "$PROFILE" \
    --region "$REGION" \
    --output text &>/dev/null

  wait_for_table "$TABLE_CONFIG"
fi

aws dynamodb update-continuous-backups \
  --table-name "$TABLE_CONFIG" \
  --point-in-time-recovery-specification PointInTimeRecoveryEnabled=true \
  --profile "$PROFILE" \
  --region "$REGION" \
  --output text &>/dev/null 2>&1 || true
log_ok "PITR habilitado en ${TABLE_CONFIG}"

# ── 3.4 Tabla: payments ───────────────────────────────────────────────────────
log_info "Creando tabla: ${TABLE_PAYMENTS}"
log_info "  PK: pk (S)  = PAY#{paymentId}"
log_info "  SK: sk (S)  = PAY#{programId}"
log_info "  GSI: sk-index      → PK: sk (S)      [buscar pagos de un programa]"
log_info "  GSI: gsiOne-index  → PK: gsiOne (S)  [programId#INST#n]"
log_info "  GSI: gsiTwo-index  → PK: gsiTwo (S)  [userId]"
log_info "  GSI: gsiThree-index → PK: gsiThree (S) [token Transbank]"

if aws dynamodb describe-table \
    --table-name "$TABLE_PAYMENTS" \
    --profile "$PROFILE" \
    --region "$REGION" \
    --output text &>/dev/null 2>&1; then
  already_exists "Tabla ${TABLE_PAYMENTS}"
else
  aws dynamodb create-table \
    --table-name "$TABLE_PAYMENTS" \
    --billing-mode PAY_PER_REQUEST \
    --attribute-definitions \
      AttributeName=pk,AttributeType=S \
      AttributeName=sk,AttributeType=S \
      AttributeName=gsiOne,AttributeType=S \
      AttributeName=gsiTwo,AttributeType=S \
      AttributeName=gsiThree,AttributeType=S \
    --key-schema \
      AttributeName=pk,KeyType=HASH \
      AttributeName=sk,KeyType=RANGE \
    --global-secondary-indexes '[
      {
        "IndexName": "sk-index",
        "KeySchema": [
          {"AttributeName": "sk", "KeyType": "HASH"}
        ],
        "Projection": {"ProjectionType": "ALL"}
      },
      {
        "IndexName": "gsiOne-index",
        "KeySchema": [
          {"AttributeName": "gsiOne", "KeyType": "HASH"}
        ],
        "Projection": {"ProjectionType": "ALL"}
      },
      {
        "IndexName": "gsiTwo-index",
        "KeySchema": [
          {"AttributeName": "gsiTwo", "KeyType": "HASH"}
        ],
        "Projection": {"ProjectionType": "ALL"}
      },
      {
        "IndexName": "gsiThree-index",
        "KeySchema": [
          {"AttributeName": "gsiThree", "KeyType": "HASH"}
        ],
        "Projection": {"ProjectionType": "ALL"}
      }
    ]' \
    --profile "$PROFILE" \
    --region "$REGION" \
    --output text &>/dev/null

  wait_for_table "$TABLE_PAYMENTS"
fi

aws dynamodb update-continuous-backups \
  --table-name "$TABLE_PAYMENTS" \
  --point-in-time-recovery-specification PointInTimeRecoveryEnabled=true \
  --profile "$PROFILE" \
  --region "$REGION" \
  --output text &>/dev/null 2>&1 || true
log_ok "PITR habilitado en ${TABLE_PAYMENTS}"

# ── 3.5 Tabla: maintainer ─────────────────────────────────────────────────────
log_info "Creando tabla: ${TABLE_MAINTAINER}"
log_info "  PK: pk (S) = BNK#ACCOUNT | SK: sk (S)"

if aws dynamodb describe-table \
    --table-name "$TABLE_MAINTAINER" \
    --profile "$PROFILE" \
    --region "$REGION" \
    --output text &>/dev/null 2>&1; then
  already_exists "Tabla ${TABLE_MAINTAINER}"
else
  aws dynamodb create-table \
    --table-name "$TABLE_MAINTAINER" \
    --billing-mode PAY_PER_REQUEST \
    --attribute-definitions \
      AttributeName=pk,AttributeType=S \
      AttributeName=sk,AttributeType=S \
    --key-schema \
      AttributeName=pk,KeyType=HASH \
      AttributeName=sk,KeyType=RANGE \
    --profile "$PROFILE" \
    --region "$REGION" \
    --output text &>/dev/null

  wait_for_table "$TABLE_MAINTAINER"
fi

aws dynamodb update-continuous-backups \
  --table-name "$TABLE_MAINTAINER" \
  --point-in-time-recovery-specification PointInTimeRecoveryEnabled=true \
  --profile "$PROFILE" \
  --region "$REGION" \
  --output text &>/dev/null 2>&1 || true
log_ok "PITR habilitado en ${TABLE_MAINTAINER}"

# =============================================================================
# RESUMEN FINAL
# =============================================================================
echo ""
echo -e "${GREEN}"
echo "╔════════════════════════════════════════════════════╗"
echo "║          Bootstrap completado exitosamente         ║"
echo "╚════════════════════════════════════════════════════╝"
echo -e "${NC}"

echo -e "${CYAN}Recursos creados:${NC}"
echo ""
echo "  S3 Buckets:"
echo "    • ${BUCKET_DEPLOY}"
echo "    • ${BUCKET_INFO}"
echo ""
echo "  SSM Parameter Store (SecureString):"
echo "    • ${PARAM_JWT}"
echo "    • ${PARAM_EMAIL}"
echo "    • ${PARAM_TRANSBANK}"
echo "    • ${PARAM_WHATSAPP}"
echo "    • ${PARAM_GEMINI}"
echo "    • ${PARAM_GOOGLE_CALENDAR}"
echo "    • ${PARAM_GOOGLE_CALENDAR_SA}"
echo ""
echo "  DynamoDB Tables:"
echo "    • ${TABLE_PROGRAMS}  (GSI: gsiOne-index, gsiStartDate-index)"
echo "    • ${TABLE_USERS}     (GSI: gsiOne-index, resetToken-index)"
echo "    • ${TABLE_CONFIG}"
echo "    • ${TABLE_PAYMENTS}  (GSI: sk-index, gsiOne-index, gsiTwo-index, gsiThree-index)"
echo "    • ${TABLE_MAINTAINER}"
echo ""
echo -e "${YELLOW}⚠  Próximos pasos:${NC}"
echo "  1. Actualiza los parámetros SSM con valores reales:"
echo "     aws ssm put-parameter --name ${PARAM_JWT} --value 'TU_CLAVE_JWT' --type SecureString --overwrite --profile ${PROFILE} --region ${REGION}"
echo "     aws ssm put-parameter --name ${PARAM_EMAIL} --value '{...}' --type SecureString --overwrite --profile ${PROFILE} --region ${REGION}"
echo "     aws ssm put-parameter --name ${PARAM_TRANSBANK} --value '{...}' --type SecureString --overwrite --profile ${PROFILE} --region ${REGION}"
echo "     aws ssm put-parameter --name ${PARAM_WHATSAPP} --value '{...}' --type SecureString --overwrite --profile ${PROFILE} --region ${REGION}"
echo "     aws ssm put-parameter --name ${PARAM_GEMINI} --value '{...}' --type SecureString --overwrite --profile ${PROFILE} --region ${REGION}"
echo "     aws ssm put-parameter --name ${PARAM_GOOGLE_CALENDAR} --value '{...}' --type SecureString --overwrite --profile ${PROFILE} --region ${REGION}"
echo "     aws ssm put-parameter --name ${PARAM_GOOGLE_CALENDAR_SA} --value '{...}' --type SecureString --overwrite --profile ${PROFILE} --region ${REGION}"
echo ""
echo "  2. Despliega la infraestructura compartida (API Gateway):"
echo "     cd infrastructure && sls deploy --stage ${STAGE} --region ${REGION}"
echo ""
echo "  3. Despliega el autorizador:"
echo "     cd services/job-authorizer && sls deploy --stage ${STAGE} --region ${REGION}"
echo ""
echo "  4. Despliega los servicios en cualquier orden:"
echo "     cd services/api-entity         && sls deploy --stage ${STAGE} --region ${REGION}"
echo "     cd services/api-program        && sls deploy --stage ${STAGE} --region ${REGION}"
echo "     cd services/api-balance        && sls deploy --stage ${STAGE} --region ${REGION}"
echo "     cd services/api-contract       && sls deploy --stage ${STAGE} --region ${REGION}"
echo "     cd services/api-extraction     && sls deploy --stage ${STAGE} --region ${REGION}"
echo "     cd services/api-maintainer     && sls deploy --stage ${STAGE} --region ${REGION}"
echo "     cd services/api-payment        && sls deploy --stage ${STAGE} --region ${REGION}"
echo "     cd services/api-favorites      && sls deploy --stage ${STAGE} --region ${REGION}"
echo "     cd services/api-meet           && sls deploy --stage ${STAGE} --region ${REGION}"
echo "     cd services/api-whatsapp-agent && sls deploy --stage ${STAGE} --region ${REGION}"
echo "     cd services/job-trigger        && sls deploy --stage ${STAGE} --region ${REGION}"
echo "     # Servicios Go (requieren compilación previa):"
echo "     cd services/api-notification   && make build && sls deploy --stage ${STAGE} --region ${REGION}"
echo "     cd services/api-configuration  && make build && sls deploy --stage ${STAGE} --region ${REGION}"
echo ""
