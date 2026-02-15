# Guía Rápida: Lambda Power Tuning

## Paso 1: Instalar Lambda Power Tuning

### Opción Rápida (AWS SAR - Sin SAM CLI)

```bash
# Obtener Account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text --profile pa-dev)
echo "Account ID: $ACCOUNT_ID"

# Instalar desde Serverless Application Repository
aws serverlessrepo create-cloud-formation-change-set \
  --application-id arn:aws:serverlessrepo:us-east-1:451282441545:applications/aws-lambda-power-tuning \
  --stack-name lambda-power-tuning \
  --capabilities CAPABILITY_IAM \
  --parameter-overrides PowerValues=128,256,512,768,1024,1536,2048,3008 \
  --region us-west-2 \
  --profile pa-dev
```

Luego:
1. Ir a CloudFormation console
2. Buscar el change-set creado
3. Ejecutar el change-set
4. Esperar a que complete (5-10 minutos)

### Opción con SAM CLI

```bash
# Instalar SAM CLI (si no está instalado)
brew tap aws/tap
brew install aws-sam-cli

# Ejecutar instalación
cd infrastructure/lambda-power-tuning
./install.sh
```

## Paso 2: Ejecutar Power Tuning

### Obtener ARNs de funciones

```bash
# Listar funciones de api-contract
aws lambda list-functions \
  --query 'Functions[?contains(FunctionName, `contratos-dev`)].FunctionArn' \
  --output table \
  --region us-west-2 \
  --profile pa-dev

# Listar funciones de api-program
aws lambda list-functions \
  --query 'Functions[?contains(FunctionName, `programas-dev`)].FunctionArn' \
  --output table \
  --region us-west-2 \
  --profile pa-dev
```

### Ejecutar tuning en función específica

```bash
cd infrastructure/lambda-power-tuning

# Ejemplo: build_document_by_form_v1
./run-tuning.sh build_document_by_form_v1

# Otras funciones disponibles:
# - get_pdf_document_by_sk_from_program_v1
# - approve_program_v1
# - confirm_program_v1
# - create_transaction_v1
```

El script:
1. Autodetecta tu Account ID
2. Prepara el payload
3. Ejecuta la State Machine
4. Espera los resultados
5. Muestra URL de visualización
6. Guarda resultados en `results/`

## Paso 3: Analizar Resultados

Los resultados incluyen:

1. **URL de visualización**: Gráficas interactivas
   - Ejemplo: `https://lambda-power-tuning.show/#base64...`

2. **Memoria óptima**: Configuración recomendada
   - Ejemplo: `768 MB`

3. **Ahorro estimado**: % de reducción de costos
   - Ejemplo: `15% ahorro vs configuración actual`

4. **Archivo JSON**: Guardado en `results/`

## Paso 4: Aplicar Resultados

```bash
# Aplicar configuración óptima automáticamente
node ../../scripts/apply-power-tuning-results.js \
  results/build_document_by_form_v1_20240214_153000.json

# Verificar cambios
cd ../../services/api-contract
git diff serverless.yml

# Desplegar
npx serverless deploy --verbose
```

## Estrategias de Optimización

### `balanced` (Recomendada)
- Balance entre costo y rendimiento
- Busca el mejor ratio costo/performance

### `cost`
- Minimiza costos
- Puede sacrificar algo de rendimiento

### `speed`
- Maximiza velocidad
- Puede aumentar costos

Para cambiar estrategia, editar el payload:
```json
{
  "strategy": "balanced"  // o "cost" o "speed"
}
```

## Troubleshooting

### Error: "State Machine not found"

```bash
# Verificar si está instalado
aws cloudformation describe-stacks \
  --stack-name lambda-power-tuning \
  --region us-west-2 \
  --profile pa-dev
```

Si no está instalado, ejecutar Paso 1.

### Error: "Function not found"

Verificar que la función existe con el nombre correcto:
```bash
aws lambda get-function \
  --function-name contratos-dev-build_document_by_form_v1 \
  --region us-west-2 \
  --profile pa-dev
```

### Timeout durante ejecución

Reducir número de invocaciones en el payload:
```json
{
  "num": 30  // reducir de 50 a 30
}
```

### Función con errores en invocaciones

Verificar logs de la función:
```bash
aws logs tail /aws/lambda/contratos-dev-build_document_by_form_v1 \
  --follow \
  --profile pa-dev
```

Ajustar payload con datos válidos.

## Funciones Priorizadas

| Orden | Función | Razón |
|-------|---------|-------|
| 1 | build_document_by_form_v1 | Mayor tráfico (~500/día), 1024MB actual |
| 2 | get_pdf_document_by_sk_from_program_v1 | Alto tráfico (~300/día), 1024MB actual |
| 3 | approve_program_v1 | Crítico, 512MB actual |
| 4 | confirm_program_v1 | Crítico, 512MB actual |
| 5 | create_transaction_v1 | Transaccional (~200/día) |

## Ejemplo Completo

```bash
# 1. Obtener Account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text --profile pa-dev)

# 2. Ejecutar tuning para build_document_by_form_v1
cd infrastructure/lambda-power-tuning
./run-tuning.sh build_document_by_form_v1 $ACCOUNT_ID

# 3. Esperar resultados (5-10 min)
# ...

# 4. Abrir URL de visualización en navegador

# 5. Aplicar resultados
node ../../scripts/apply-power-tuning-results.js \
  results/build_document_by_form_v1_*.json

# 6. Desplegar
cd ../../services/api-contract
npx serverless deploy

# 7. Monitorear en CloudWatch
aws logs tail /aws/lambda/contratos-dev-build_document_by_form_v1 \
  --follow \
  --profile pa-dev
```

## Próximos Pasos

Después de optimizar las funciones críticas:

1. ✅ Documentar resultados y ahorros
2. ✅ Monitorear durante 1 semana
3. ✅ Ajustar si es necesario
4. ➡️  Continuar con Punto 4 del plan: Implementar Caché
