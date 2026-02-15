# AWS Lambda Power Tuning - Instalación y Uso

## Opción 1: Instalación con SAM CLI (Recomendada)

### 1. Instalar SAM CLI

**macOS (Homebrew):**
```bash
brew tap aws/tap
brew install aws-sam-cli

# Verificar instalación
sam --version
```

**Alternativa (instalador oficial):**
```bash
# Descargar instalador
curl -L https://github.com/aws/aws-sam-cli/releases/latest/download/aws-sam-cli-macos-arm64.pkg -o sam-cli.pkg

# Instalar
sudo installer -pkg sam-cli.pkg -target /

# Verificar
sam --version
```

### 2. Desplegar Lambda Power Tuning

```bash
cd infrastructure/lambda-power-tuning

# Desplegar usando SAM
sam deploy \
  --template-file template.yml \
  --stack-name lambda-power-tuning \
  --capabilities CAPABILITY_IAM \
  --parameter-overrides \
    PowerValues=128,256,512,768,1024,1536,2048,3008 \
  --region us-west-2 \
  --profile pa-dev
```

## Opción 2: Despliegue directo con AWS CLI (Sin SAM)

Si no quieres instalar SAM, puedes desplegar directamente:

```bash
cd infrastructure/lambda-power-tuning

# Desplegar stack de CloudFormation
aws cloudformation deploy \
  --template-file cloudformation-template.yml \
  --stack-name lambda-power-tuning \
  --capabilities CAPABILITY_IAM \
  --parameter-overrides \
    PowerValues=128,256,512,768,1024,1536,2048,3008 \
  --region us-west-2 \
  --profile pa-dev
```

## Funciones a Optimizar

Según el análisis del proyecto, estas son las funciones críticas para optimizar:

| Función | Servicio | Memoria Actual | Invocaciones/día | Prioridad |
|---------|----------|----------------|------------------|-----------|
| build_document_by_form_v1 | api-contract | 1024 MB | ~500 | 🔴 Alta |
| get_pdf_document_by_sk_from_program_v1 | api-contract | 1024 MB | ~300 | 🔴 Alta |
| approve_program_v1 | api-program | 512 MB | ~150 | 🟡 Media |
| confirm_program_v1 | api-program | 512 MB | ~100 | 🟡 Media |
| create_transaction_v1 | api-payment | default | ~200 | 🟡 Media |

## Uso

### 1. Ejecutar Power Tuning

Una vez desplegado, usa los payloads predefinidos:

```bash
# Ejecutar tuning para api-contract
./run-tuning.sh build_document_by_form_v1

# Ver todos los payloads disponibles
ls payloads/
```

### 2. Analizar Resultados

Los resultados incluyen:
- URL de visualización (gráficas interactivas)
- Configuración óptima de memoria
- Ahorro estimado
- Mejora de rendimiento

### 3. Aplicar Resultados

```bash
# Aplicar configuraciones óptimas
node ../../scripts/apply-power-tuning-results.js results.json
```

## Troubleshooting

**Error: "Access Denied"**
- Verificar que el profile AWS tenga permisos para crear Step Functions y Lambda

**Error: "Stack already exists"**
- Eliminar stack existente: `aws cloudformation delete-stack --stack-name lambda-power-tuning --profile pa-dev`

**Error: "Timeout"**
- Aumentar timeout en el payload: `"num": 50` → `"num": 30`

## Referencias

- [AWS Lambda Power Tuning (GitHub)](https://github.com/alexcasalboni/aws-lambda-power-tuning)
- [Documentación SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html)
