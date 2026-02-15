#!/bin/bash

# Script de testing manual de configuraciones de memoria Lambda
# Prueba diferentes configuraciones y mide rendimiento

set -e

FUNCTION_NAME="contratos-dev-build_document_by_form_v1"
REGION="us-west-2"
PROFILE="pa-dev"
NUM_INVOCATIONS=5

# Configuraciones de memoria a probar
MEMORY_CONFIGS=(512 768 1024 1536 2048)

# Payload de prueba
PAYLOAD_FILE="/tmp/test-payload.json"
cat > "$PAYLOAD_FILE" << 'EOF'
{
  "body": "{\"scope\":\"CTT\",\"document\":{\"numero\":\"TEST-001\",\"fecha\":\"2024-02-14\",\"monto\":1000000,\"vigencia\":\"2024-12-31\"},\"action\":{\"isPreview\":true}}",
  "headers": {
    "Content-Type": "application/json"
  }
}
EOF

echo "═══════════════════════════════════════════════════════"
echo "  Lambda Power Testing Manual"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "Función: $FUNCTION_NAME"
echo "Configuraciones: ${MEMORY_CONFIGS[@]} MB"
echo "Invocaciones por config: $NUM_INVOCATIONS"
echo ""
echo "═══════════════════════════════════════════════════════"
echo ""

# Guardar configuración original
ORIGINAL_MEMORY=$(aws lambda get-function-configuration \
  --function-name "$FUNCTION_NAME" \
  --region "$REGION" \
  --profile "$PROFILE" \
  --query 'MemorySize' \
  --output text)

echo "📋 Memoria original: ${ORIGINAL_MEMORY}MB"
echo ""

# Archivo de resultados
RESULTS_FILE="results/manual-test-$(date +%Y%m%d_%H%M%S).csv"
mkdir -p results
echo "Memory,Invocation,Duration,BilledDuration,MaxMemoryUsed,Cost" > "$RESULTS_FILE"

# Función para calcular costo
calculate_cost() {
    local memory_mb=$1
    local duration_ms=$2

    # Convertir a GB-segundos
    local memory_gb=$(echo "scale=6; $memory_mb / 1024" | bc)
    local duration_s=$(echo "scale=6; $duration_ms / 1000" | bc)
    local gb_seconds=$(echo "scale=6; $memory_gb * $duration_s" | bc)

    # Precio: $0.0000166667 por GB-segundo
    local cost=$(echo "scale=10; $gb_seconds * 0.0000166667" | bc)

    echo "$cost"
}

# Probar cada configuración
for MEMORY in "${MEMORY_CONFIGS[@]}"; do
    echo "──────────────────────────────────────────────────────"
    echo "⚙️  Probando con ${MEMORY}MB..."
    echo ""

    # Actualizar memoria
    aws lambda update-function-configuration \
      --function-name "$FUNCTION_NAME" \
      --memory-size "$MEMORY" \
      --region "$REGION" \
      --profile "$PROFILE" \
      --query '[MemorySize]' \
      --output text > /dev/null

    # Esperar a que la actualización complete
    echo "   Esperando actualización..."
    sleep 10

    # Ejecutar invocaciones
    TOTAL_DURATION=0
    TOTAL_BILLED=0
    TOTAL_MEMORY=0
    TOTAL_COST=0

    for i in $(seq 1 $NUM_INVOCATIONS); do
        # Invocar función
        RESPONSE_FILE="/tmp/response-${MEMORY}-${i}.json"
        LOG_FILE="/tmp/log-${MEMORY}-${i}.txt"

        aws lambda invoke \
          --function-name "$FUNCTION_NAME" \
          --payload file://"$PAYLOAD_FILE" \
          --region "$REGION" \
          --profile "$PROFILE" \
          --log-type Tail \
          "$RESPONSE_FILE" > "$LOG_FILE" 2>&1

        # Extraer métricas del log
        if [ -f "$LOG_FILE" ]; then
            DURATION=$(grep -o "Duration: [0-9.]*" "$LOG_FILE" | awk '{print $2}')
            BILLED=$(grep -o "Billed Duration: [0-9]*" "$LOG_FILE" | awk '{print $3}')
            MAX_MEM=$(grep -o "Max Memory Used: [0-9]*" "$LOG_FILE" | awk '{print $4}')

            if [ -n "$DURATION" ] && [ -n "$BILLED" ] && [ -n "$MAX_MEM" ]; then
                COST=$(calculate_cost "$MEMORY" "$BILLED")

                echo "   Invocación $i: ${DURATION}ms (Billed: ${BILLED}ms, Mem: ${MAX_MEM}MB, Cost: \$${COST})"

                # Acumular totales
                TOTAL_DURATION=$(echo "$TOTAL_DURATION + $DURATION" | bc)
                TOTAL_BILLED=$(echo "$TOTAL_BILLED + $BILLED" | bc)
                TOTAL_MEMORY=$(echo "$TOTAL_MEMORY + $MAX_MEM" | bc)
                TOTAL_COST=$(echo "$TOTAL_COST + $COST" | bc)

                # Guardar en CSV
                echo "$MEMORY,$i,$DURATION,$BILLED,$MAX_MEM,$COST" >> "$RESULTS_FILE"
            else
                echo "   Invocación $i: ❌ Error obteniendo métricas"
            fi
        fi

        # Pequeña pausa entre invocaciones
        sleep 2
    done

    # Calcular promedios
    AVG_DURATION=$(echo "scale=2; $TOTAL_DURATION / $NUM_INVOCATIONS" | bc)
    AVG_BILLED=$(echo "scale=2; $TOTAL_BILLED / $NUM_INVOCATIONS" | bc)
    AVG_MEMORY=$(echo "scale=0; $TOTAL_MEMORY / $NUM_INVOCATIONS" | bc)
    AVG_COST=$(echo "scale=10; $TOTAL_COST / $NUM_INVOCATIONS" | bc)

    echo ""
    echo "   📊 Promedios:"
    echo "      Duración:        ${AVG_DURATION}ms"
    echo "      Billed:          ${AVG_BILLED}ms"
    echo "      Memoria usada:   ${AVG_MEMORY}MB"
    echo "      Costo promedio:  \$${AVG_COST}"
    echo ""

    # Guardar promedio
    echo "$MEMORY,AVG,$AVG_DURATION,$AVG_BILLED,$AVG_MEMORY,$AVG_COST" >> "$RESULTS_FILE"

    # Limpiar archivos temporales
    rm -f /tmp/response-${MEMORY}-*.json /tmp/log-${MEMORY}-*.txt
done

echo "══════════════════════════════════════════════════════"
echo "  Restaurando configuración original"
echo "══════════════════════════════════════════════════════"
echo ""

# Restaurar memoria original
aws lambda update-function-configuration \
  --function-name "$FUNCTION_NAME" \
  --memory-size "$ORIGINAL_MEMORY" \
  --region "$REGION" \
  --profile "$PROFILE" \
  --query '[MemorySize]' \
  --output text > /dev/null

echo "✅ Restaurado a ${ORIGINAL_MEMORY}MB"
echo ""

# Analizar resultados
echo "══════════════════════════════════════════════════════"
echo "  Análisis de Resultados"
echo "══════════════════════════════════════════════════════"
echo ""

python3 << EOF
import csv

with open('$RESULTS_FILE') as f:
    reader = csv.DictReader(f)
    rows = [r for r in reader if r['Invocation'] == 'AVG']

print('Configuración  │ Duración │ Costo      │ Memoria Usada')
print('───────────────┼──────────┼────────────┼──────────────')

best_cost = min(float(r['Cost']) for r in rows)
best_perf = min(float(r['Duration']) for r in rows)

for row in rows:
    memory = row['Memory'].rjust(6)
    duration = row['Duration'].rjust(8)
    cost = row['Cost'].rjust(10)
    mem_used = row['MaxMemoryUsed'].rjust(12)

    marker = ''
    if abs(float(row['Cost']) - best_cost) < 0.0000000001:
        marker = ' 💰 Mejor costo'
    elif abs(float(row['Duration']) - best_perf) < 0.01:
        marker = ' ⚡ Más rápido'

    print(f'{memory}MB       │ {duration}ms │ \${cost} │ {mem_used}MB{marker}')

print()
print(f'✅ Resultados guardados en: $RESULTS_FILE')
EOF

echo ""
echo "══════════════════════════════════════════════════════"
echo "  Completado"
echo "══════════════════════════════════════════════════════"
echo ""
