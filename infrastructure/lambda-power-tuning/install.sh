#!/bin/bash

# Script para instalar AWS Lambda Power Tuning
# Usa el proyecto oficial de AWS

set -e

REGION="us-west-2"
PROFILE="pa-dev"
STACK_NAME="lambda-power-tuning"

echo "🚀 Instalando AWS Lambda Power Tuning..."
echo ""

# Opción 1: Usar SAR (Serverless Application Repository)
echo "Opción 1: Instalación desde AWS SAR (Recomendada)"
echo ""
echo "Ejecuta este comando en AWS CLI:"
echo ""
echo "aws serverlessrepo create-cloud-formation-change-set \\"
echo "  --application-id arn:aws:serverlessrepo:us-east-1:451282441545:applications/aws-lambda-power-tuning \\"
echo "  --stack-name ${STACK_NAME} \\"
echo "  --capabilities CAPABILITY_IAM \\"
echo "  --parameter-overrides PowerValues=128,256,512,768,1024,1536,2048,3008 \\"
echo "  --region ${REGION} \\"
echo "  --profile ${PROFILE}"
echo ""
echo "Luego ejecuta el change-set creado desde la consola de CloudFormation"
echo ""

# Opción 2: Clonar repositorio y desplegar con SAM
echo "─────────────────────────────────────────────"
echo ""
echo "Opción 2: Instalación desde código fuente (Requiere SAM CLI)"
echo ""

read -p "¿Deseas instalar desde código fuente? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
    echo "📦 Clonando repositorio..."

    # Crear directorio temporal
    TEMP_DIR=$(mktemp -d)
    cd "$TEMP_DIR"

    # Clonar repositorio
    git clone https://github.com/alexcasalboni/aws-lambda-power-tuning.git
    cd aws-lambda-power-tuning

    echo ""
    echo "📝 Desplegando con SAM..."

    # Desplegar
    sam deploy \
      --template-file template.yml \
      --stack-name ${STACK_NAME} \
      --capabilities CAPABILITY_IAM \
      --parameter-overrides \
        PowerValues=128,256,512,768,1024,1536,2048,3008 \
        visualizationURL=https://lambda-power-tuning.show/ \
      --region ${REGION} \
      --profile ${PROFILE} \
      --guided

    echo ""
    echo "✅ Instalación completada"
    echo ""
    echo "📋 ARN de State Machine:"
    aws cloudformation describe-stacks \
      --stack-name ${STACK_NAME} \
      --query 'Stacks[0].Outputs[?OutputKey==`StateMachineArn`].OutputValue' \
      --output text \
      --region ${REGION} \
      --profile ${PROFILE}

    # Limpiar
    cd ../..
    rm -rf "$TEMP_DIR"
fi

echo ""
echo "─────────────────────────────────────────────"
echo ""
echo "💡 Próximos pasos:"
echo "   1. Verificar stack en CloudFormation console"
echo "   2. Copiar ARN de la State Machine"
echo "   3. Ejecutar tuning con: ./run-tuning.sh <function-name>"
echo ""
