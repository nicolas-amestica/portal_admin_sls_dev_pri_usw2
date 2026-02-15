#!/bin/bash

# Script para testear el caché localmente con serverless-offline
# Ejecuta múltiples requests y verifica el comportamiento del caché

set -e

echo "═══════════════════════════════════════════════════════"
echo "  Testing de Caché Local"
echo "═══════════════════════════════════════════════════════"
echo ""

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para hacer request y mostrar tiempo
make_request() {
  local url=$1
  local name=$2
  local iteration=$3

  echo -e "${BLUE}[$iteration] ${name}${NC}"

  START=$(date +%s%N)
  RESPONSE=$(curl -s -w "\n%{http_code}" "$url")
  END=$(date +%s%N)

  HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
  DURATION=$(( (END - START) / 1000000 )) # Convertir a ms

  if [ "$HTTP_CODE" = "200" ]; then
    echo -e "   ${GREEN}✓${NC} Status: 200 | Duración: ${DURATION}ms"
  else
    echo -e "   ❌ Status: $HTTP_CODE | Duración: ${DURATION}ms"
  fi
}

echo "⚠️  Asegúrate de tener serverless-offline corriendo:"
echo "   cd services/api-program && serverless offline --stage dev"
echo ""
read -p "Presiona Enter para continuar con los tests..."
echo ""

# ═══════════════════════════════════════════════════════
# Test 1: api-program - get-program-v1
# ═══════════════════════════════════════════════════════
echo "─────────────────────────────────────────────────────"
echo "Test 1: api-program - get-program-v1"
echo "Esperado: 1ra request = CACHE_MISS, siguientes = CACHE_HIT"
echo "─────────────────────────────────────────────────────"
echo ""

# Necesitas un SK válido de tu base de datos
# Ajusta este valor según tus datos de prueba
PROGRAM_SK="PROG#2024-001"

API_PROGRAM_URL="http://localhost:3200/dev/v1/programas?sk=$PROGRAM_SK"

for i in {1..3}; do
  make_request "$API_PROGRAM_URL" "GET /v1/programas?sk=$PROGRAM_SK" "$i"
  sleep 1
done

echo ""
echo "Verifica en los logs de serverless-offline:"
echo "  - 1ra request: debe mostrar 'CACHE_MISS'"
echo "  - 2da-3ra request: debe mostrar 'CACHE_HIT'"
echo "  - 2da-3ra request: duración debe ser ~10x más rápida"
echo ""

# ═══════════════════════════════════════════════════════
# Test 2: api-program - get-programs-view-v1
# ═══════════════════════════════════════════════════════
echo "─────────────────────────────────────────────────────"
echo "Test 2: api-program - get-programs-view-v1"
echo "Esperado: 1ra request = CACHE_MISS, siguientes = CACHE_HIT"
echo "─────────────────────────────────────────────────────"
echo ""

# Ajusta el periodo según tus datos de prueba
PERIODO="2024"

API_PROGRAMS_LIST_URL="http://localhost:3200/dev/v1/programas/listar?periodo=$PERIODO"

for i in {1..3}; do
  make_request "$API_PROGRAMS_LIST_URL" "GET /v1/programas/listar?periodo=$PERIODO" "$i"
  sleep 1
done

echo ""
echo "Verifica en los logs de serverless-offline:"
echo "  - 1ra request: debe mostrar 'CACHE_MISS'"
echo "  - 2da-3ra request: debe mostrar 'CACHE_HIT'"
echo "  - CACHE_STATS debe mostrar hit rate incrementando"
echo ""

# ═══════════════════════════════════════════════════════
# Test 3: Verificar TTL (expiración del caché)
# ═══════════════════════════════════════════════════════
echo "─────────────────────────────────────────────────────"
echo "Test 3: Verificar expiración de caché (TTL)"
echo "Esperado: después de TTL, nueva request = CACHE_MISS"
echo "─────────────────────────────────────────────────────"
echo ""

echo "⚠️  Este test requiere esperar el TTL configurado:"
echo "   - PROGRAM: 10 minutos"
echo "   - PROGRAM_LIST: 5 minutos"
echo ""
echo "Para testing rápido, puedes modificar temporalmente los TTL en:"
echo "   libs/cache/cache-keys.js"
echo ""
echo "Por ejemplo, cambiar a 10 segundos:"
echo "   PROGRAM: 10 * 1000,  // 10 segundos"
echo ""

# ═══════════════════════════════════════════════════════
# Resumen
# ═══════════════════════════════════════════════════════
echo "─────────────────────────────────────────────────────"
echo "Resumen de Testing"
echo "─────────────────────────────────────────────────────"
echo ""
echo "✅ Tests completados. Revisa los logs de serverless-offline."
echo ""
echo "Métricas esperadas en los logs:"
echo "  - CACHE_HIT: { key: 'program:XXX' }"
echo "  - CACHE_MISS: { key: 'program:XXX' }"
echo "  - CACHE_SET: { key: 'program:XXX', ttl: '600000ms' }"
echo "  - CACHE_STATS: { hits: X, misses: Y, hitRate: 'Z%' }"
echo ""
echo "Indicadores de éxito:"
echo "  ✓ Hit rate >60% después de warm-up"
echo "  ✓ Duración reducida 70-85% en cache hits"
echo "  ✓ CACHE_STATS muestra hits incrementando"
echo ""
echo "═══════════════════════════════════════════════════════"
