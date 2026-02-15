#!/bin/bash
set -e

FUNCTION="contratos-dev-build_document_by_form_v1"
CONFIGS=(512 768 1024 1536 2048)

echo "⚡ Quick Power Test"
echo ""

ORIGINAL=$(aws lambda get-function-configuration --function-name "$FUNCTION" --region us-west-2 --profile pa-dev --query 'MemorySize' --output text)
echo "Original: ${ORIGINAL}MB"
echo ""

for MEM in "${CONFIGS[@]}"; do
    echo "Testing ${MEM}MB..."

    aws lambda update-function-configuration \
      --function-name "$FUNCTION" \
      --memory-size "$MEM" \
      --region us-west-2 \
      --profile pa-dev > /dev/null 2>&1

    sleep 5

    # 3 invocaciones
    TOTAL=0
    for i in 1 2 3; do
        LOG=$(aws lambda invoke \
          --function-name "$FUNCTION" \
          --payload '{"body":"{\"scope\":\"CTT\",\"document\":{\"numero\":\"TEST\"},\"action\":{\"isPreview\":true}}"}' \
          --region us-west-2 \
          --profile pa-dev \
          --log-type Tail \
          /tmp/resp.json 2>&1)

        DUR=$(echo "$LOG" | grep -o "Duration: [0-9.]*" | awk '{print $2}')
        if [ -n "$DUR" ]; then
            TOTAL=$(echo "$TOTAL + $DUR" | bc)
            echo "  Run $i: ${DUR}ms"
        fi
        sleep 1
    done

    AVG=$(echo "scale=2; $TOTAL / 3" | bc)
    echo "  Average: ${AVG}ms"
    echo ""
done

aws lambda update-function-configuration --function-name "$FUNCTION" --memory-size "$ORIGINAL" --region us-west-2 --profile pa-dev > /dev/null 2>&1
echo "✅ Restored to ${ORIGINAL}MB"
