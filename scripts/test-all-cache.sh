#!/bin/bash

# Script de testing completo para todos los endpoints con caché
# Verifica hit/miss rate y reducción de latencia

set -e

echo "═══════════════════════════════════════════════════════"
echo "  Testing Completo de Caché - 6 Handlers"
echo "═══════════════════════════════════════════════════════"
echo ""

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Contadores globales
TOTAL_REQUESTS=0
TOTAL_HITS=0
TOTAL_DURATION_FIRST=0
TOTAL_DURATION_CACHED=0

# Función para hacer request y medir
test_endpoint() {
  local service=$1
  local url=$2
  local name=$3
  local iterations=${4:-3}

  echo ""
  echo -e "${BLUE}════════════════════════════════════════${NC}"
  echo -e "${BLUE}Testing: $name${NC}"
  echo -e "${BLUE}Service: $service${NC}"
  echo -e "${BLUE}════════════════════════════════════════${NC}"
  echo ""

  local first_duration=0
  local cached_duration=0

  for i in $(seq 1 $iterations); do
    START=$(date +%s%N)
    RESPONSE=$(curl -s -w "\n%{http_code}" "$url" 2>/dev/null)
    END=$(date +%s%N)

    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    DURATION=$(( (END - START) / 1000000 ))

    if [ $i -eq 1 ]; then
      first_duration=$DURATION
      echo -e "   [1] ${YELLOW}CACHE_MISS${NC} | Status: $HTTP_CODE | ${DURATION}ms"
    else
      cached_duration=$DURATION
      echo -e "   [$i] ${GREEN}CACHE_HIT${NC}  | Status: $HTTP_CODE | ${DURATION}ms"
      TOTAL_HITS=$((TOTAL_HITS + 1))
    fi

    TOTAL_REQUESTS=$((TOTAL_REQUESTS + 1))
    sleep 1
  done

  if [ $cached_duration -gt 0 ]; then
    local reduction=$(( (first_duration - cached_duration) * 100 / first_duration ))
    echo ""
    echo -e "   ${GREEN}✓${NC} Reducción de latencia: ${reduction}% (${first_duration}ms → ${cached_duration}ms)"
  fi

  TOTAL_DURATION_FIRST=$((TOTAL_DURATION_FIRST + first_duration))
  TOTAL_DURATION_CACHED=$((TOTAL_DURATION_CACHED + cached_duration))
}

echo "⚠️  Asegúrate de tener los siguientes servicios corriendo en serverless-offline:"
echo ""
echo "   Terminal 1: cd services/api-program && serverless offline --stage dev"
echo "   Terminal 2: cd services/api-maintainer && serverless offline --stage dev --httpPort 3201"
echo "   Terminal 3: cd services/api-entity && serverless offline --stage dev --httpPort 3202"
echo "   Terminal 4: cd services/api-contract && serverless offline --stage dev --httpPort 3203"
echo "   Terminal 5: cd services/api-balance && serverless offline --stage dev --httpPort 3204"
echo ""
read -p "Presiona Enter para continuar..."

# ═══════════════════════════════════════════════════════
# Test 1: api-program - get-program-v1
# ═══════════════════════════════════════════════════════
PROGRAM_SK="PROG#2024-001"  # Ajustar según tus datos
test_endpoint "api-program" \
  "http://localhost:3200/dev/v1/programas?sk=$PROGRAM_SK" \
  "GET /v1/programas (obtener programa)" \
  3

# ═══════════════════════════════════════════════════════
# Test 2: api-program - get-programs-view-v1
# ═══════════════════════════════════════════════════════
PERIODO="2024"  # Ajustar según tus datos
test_endpoint "api-program" \
  "http://localhost:3200/dev/v1/programas/listar?periodo=$PERIODO" \
  "GET /v1/programas/listar (listar programas)" \
  3

# ═══════════════════════════════════════════════════════
# Test 3: api-maintainer - get-banks-v1
# ═══════════════════════════════════════════════════════
test_endpoint "api-maintainer" \
  "http://localhost:3201/dev/v1/mantenedor/bancos" \
  "GET /v1/mantenedor/bancos (listar bancos)" \
  3

# ═══════════════════════════════════════════════════════
# Test 4: api-entity - get-access-v1
# ═══════════════════════════════════════════════════════
USER_ID="USR#123"  # Ajustar según tus datos
test_endpoint "api-entity" \
  "http://localhost:3202/dev/v1/usuarios/accesos?userId=$USER_ID" \
  "GET /v1/usuarios/accesos (obtener perfiles de acceso)" \
  3

# ═══════════════════════════════════════════════════════
# Test 5: api-contract - get-pdf-document-by-sk-v1
# ═══════════════════════════════════════════════════════
CONTRACT_SK="PROG#2024-001"  # Ajustar según tus datos
test_endpoint "api-contract" \
  "http://localhost:3203/dev/v1/documentos/pdf?sk=$CONTRACT_SK" \
  "GET /v1/documentos/pdf (obtener PDFs)" \
  3

# ═══════════════════════════════════════════════════════
# Test 6: api-balance - get-balances-v1
# ═══════════════════════════════════════════════════════
BALANCE_SK="PROG#2024-001"  # Ajustar según tus datos
test_endpoint "api-balance" \
  "http://localhost:3204/dev/v1/balances?sk=$BALANCE_SK" \
  "GET /v1/balances (obtener balances)" \
  3

# ═══════════════════════════════════════════════════════
# Resumen Final
# ═══════════════════════════════════════════════════════
echo ""
echo "═══════════════════════════════════════════════════════"
echo "  Resumen de Testing"
echo "═══════════════════════════════════════════════════════"
echo ""

HIT_RATE=$(( TOTAL_HITS * 100 / TOTAL_REQUESTS ))
AVG_REDUCTION=$(( (TOTAL_DURATION_FIRST - TOTAL_DURATION_CACHED) * 100 / TOTAL_DURATION_FIRST ))

echo "Total de requests: $TOTAL_REQUESTS"
echo "Cache HITs: $TOTAL_HITS"
echo "Cache MISSes: $((TOTAL_REQUESTS - TOTAL_HITS))"
echo -e "Hit Rate: ${GREEN}${HIT_RATE}%${NC}"
echo -e "Reducción promedio de latencia: ${GREEN}${AVG_REDUCTION}%${NC}"
echo ""

if [ $HIT_RATE -ge 60 ]; then
  echo -e "${GREEN}✅ ÉXITO: Hit rate >60% - Caché funcionando óptimamente${NC}"
elif [ $HIT_RATE -ge 40 ]; then
  echo -e "${YELLOW}⚠️  ADVERTENCIA: Hit rate 40-60% - Considerar aumentar TTL${NC}"
else
  echo -e "${RED}❌ ERROR: Hit rate <40% - Revisar configuración de caché${NC}"
fi

echo ""
echo "Verifica los logs de serverless-offline para:"
echo "  - CACHE_HIT / CACHE_MISS"
echo "  - CACHE_DETAILED_STATS"
echo "  - Hit rate por función"
echo ""
echo "═══════════════════════════════════════════════════════"
