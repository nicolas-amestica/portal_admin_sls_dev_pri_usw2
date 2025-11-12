#!/bin/bash

# Script para crear la tabla de DynamoDB para pagos
# Uso: ./create-dynamodb-table.sh dev us-west-2 pa-dev

STAGE=${1:-prd}
REGION=${2:-us-west-2}
PROFILE=${3:-pa-dev}

# Mapeo de regiones a siglas
case $REGION in
  us-east-1) SHORT_REGION="use1" ;;
  us-east-2) SHORT_REGION="use2" ;;
  us-west-1) SHORT_REGION="usw1" ;;
  us-west-2) SHORT_REGION="usw2" ;;
  sa-east-1) SHORT_REGION="sae1" ;;
  *) echo "Región no soportada: $REGION"; exit 1 ;;
esac

TABLE_NAME="payments-${STAGE}-pri-${SHORT_REGION}"

echo "================================================"
echo "Creando tabla DynamoDB: ${TABLE_NAME}"
echo "Stage: ${STAGE}"
echo "Region: ${REGION} (${SHORT_REGION})"
echo "Profile: ${PROFILE}"
echo "================================================"

aws dynamodb create-table \
  --table-name ${TABLE_NAME} \
  --attribute-definitions \
    AttributeName=pk,AttributeType=S \
    AttributeName=sk,AttributeType=S \
    AttributeName=token,AttributeType=S \
    AttributeName=gsiOne,AttributeType=S \
    AttributeName=gsiTwo,AttributeType=S \
  --key-schema \
    AttributeName=pk,KeyType=HASH \
    AttributeName=sk,KeyType=RANGE \
  --global-secondary-indexes \
    "[
      {
        \"IndexName\": \"token-index\",
        \"KeySchema\": [
          {\"AttributeName\": \"token\", \"KeyType\": \"HASH\"}
        ],
        \"Projection\": {\"ProjectionType\": \"ALL\"},
        \"ProvisionedThroughput\": {
          \"ReadCapacityUnits\": 5,
          \"WriteCapacityUnits\": 5
        }
      },
      {
        \"IndexName\": \"gsiOne-index\",
        \"KeySchema\": [
          {\"AttributeName\": \"gsiOne\", \"KeyType\": \"HASH\"}
        ],
        \"Projection\": {\"ProjectionType\": \"ALL\"},
        \"ProvisionedThroughput\": {
          \"ReadCapacityUnits\": 5,
          \"WriteCapacityUnits\": 5
        }
      },
      {
        \"IndexName\": \"gsiTwo-index\",
        \"KeySchema\": [
          {\"AttributeName\": \"gsiTwo\", \"KeyType\": \"HASH\"}
        ],
        \"Projection\": {\"ProjectionType\": \"ALL\"},
        \"ProvisionedThroughput\": {
          \"ReadCapacityUnits\": 5,
          \"WriteCapacityUnits\": 5
        }
      }
    ]" \
  --billing-mode PROVISIONED \
  --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
  --region ${REGION} \
  --profile ${PROFILE} \
  --tags \
    Key=Environment,Value=${STAGE} \
    Key=Service,Value=api-payment \
    Key=Project,Value=giras-indomito

echo ""
echo "✅ Tabla ${TABLE_NAME} creada exitosamente!"
echo ""
echo "Esperando a que la tabla esté activa..."
aws dynamodb wait table-exists \
  --table-name ${TABLE_NAME} \
  --region ${REGION} \
  --profile ${PROFILE}

echo ""
echo "✅ Tabla activa y lista para usar!"
echo ""
echo "Para verificar la tabla:"
echo "aws dynamodb describe-table --table-name ${TABLE_NAME} --region ${REGION} --profile ${PROFILE}"
