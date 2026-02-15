# Lambda Power Tuning - Estado Actual

## ✅ Completado

### 1. Instalación Exitosa

Lambda Power Tuning ha sido instalado correctamente desde AWS Serverless Application Repository:

- **Stack:** `serverlessrepo-lambda-power-tuning`
- **Estado:** `CREATE_COMPLETE`
- **Region:** `us-west-2`
- **State Machine ARN:** `arn:aws:states:us-west-2:691725736887:stateMachine:powerTuningStateMachine-55551d10-0a0d-11f1-a1b5-0a974a278a23`

### 2. Componentes Creados

Funciones Lambda instaladas:
- ✅ `initializer` - Inicializa configuraciones
- ✅ `publisher` - Publica versiones con diferentes configuraciones de memoria
- ✅ `executor` - Ejecuta invocaciones para medir rendimiento
- ✅ `analyzer` - Analiza resultados
- ✅ `optimizer` - Determina configuración óptima
- ✅ `cleaner` - Limpia recursos temporales

### 3. Payloads Creados

Se crearon 5 payloads para funciones críticas:

| Función | Ubicación | Memorias a Probar |
|---------|-----------|-------------------|
| build_document_by_form_v1 | `payloads/build_document_by_form_v1.json` | 256-3008 MB |
| get_pdf_document_by_sk_from_program_v1 | `payloads/get_pdf_document_by_sk_from_program_v1.json` | 256-2048 MB |
| approve_program_v1 | `payloads/approve_program_v1.json` | 256-1024 MB |
| confirm_program_v1 | `payloads/confirm_program_v1.json` | 256-1024 MB |
| create_transaction_v1 | `payloads/create_transaction_v1.json` | 256-1024 MB |

## ⚠️ Problema Identificado

La ejecución de la State Machine completa exitosamente pero **no genera output con resultados**.

### Síntomas

1. Estado de ejecución: `SUCCEEDED` (30 segundos)
2. Output: `{}` (vacío)
3. Solo se ejecutan pasos: `Initializer` → `Publisher` → Success
4. El paso `Executor` (que ejecuta las invocaciones) no se ejecuta

### Posibles Causas

1. **Formato del payload incorrecto** - La versión instalada desde SAR puede esperar un formato diferente
2. **Configuración de la State Machine** - Puede estar configurada para modo "dry-run" por defecto
3. **Permisos insuficientes** - Las funciones pueden no tener permisos para invocar la función target

## 🔍 Próximos Pasos Sugeridos

### Opción A: Debugging Manual (Recomendada)

1. Verificar definición de la State Machine:
```bash
aws stepfunctions describe-state-machine \
  --state-machine-arn "arn:aws:states:us-west-2:691725736887:stateMachine:powerTuningStateMachine-55551d10-0a0d-11f1-a1b5-0a974a278a23" \
  --region us-west-2 \
  --profile pa-dev \
  --query 'definition' \
  --output text | jq '.'
```

2. Verificar logs de las funciones Lambda:
```bash
# Ver logs del initializer
aws logs tail /aws/lambda/serverlessrepo-lambda-power-tuning-initializer-AxW0lBmqlks6 \
  --follow \
  --region us-west-2 \
  --profile pa-dev

# Ver logs del publisher
aws logs tail /aws/lambda/serverlessrepo-lambda-power-tuning-publisher-tnqm9pGti1lK \
  --follow \
  --region us-west-2 \
  --profile pa-dev
```

3. Ejecutar funciones manualmente:
```bash
# Invocar initializer
aws lambda invoke \
  --function-name serverlessrepo-lambda-power-tuning-initializer-AxW0lBmqlks6 \
  --payload file://payloads/build_document_by_form_v1.json \
  --region us-west-2 \
  --profile pa-dev \
  response.json

cat response.json | jq '.'
```

### Opción B: Reinstalación con SAM CLI

Clonar y desplegar desde código fuente oficial:

```bash
# 1. Instalar SAM CLI (si no está instalado)
brew tap aws/tap
brew install aws-sam-cli

# 2. Clonar repositorio oficial
git clone https://github.com/alexcasalboni/aws-lambda-power-tuning.git
cd aws-lambda-power-tuning

# 3. Desplegar con SAM
sam deploy \
  --template-file template.yml \
  --stack-name lambda-power-tuning-v2 \
  --capabilities CAPABILITY_IAM \
  --parameter-overrides \
    PowerValues=128,256,512,768,1024,1536,2048,3008 \
  --region us-west-2 \
  --profile pa-dev \
  --guided
```

### Opción C: Enfoque Manual Simplificado

Ejecutar pruebas manuales con diferentes configuraciones:

```bash
# Script para probar una función con diferentes configuraciones de memoria
FUNCTION_NAME="contratos-dev-build_document_by_form_v1"
PAYLOADS='{"body":"{\"scope\":\"CTT\",\"document\":{\"numero\":\"TEST\"}}"}'

for MEMORY in 256 512 768 1024 1536 2048; do
  echo "Probando con ${MEMORY}MB..."

  # Actualizar memoria
  aws lambda update-function-configuration \
    --function-name "$FUNCTION_NAME" \
    --memory-size $MEMORY \
    --region us-west-2 \
    --profile pa-dev

  # Esperar actualización
  sleep 5

  # Medir rendimiento (10 invocaciones)
  for i in {1..10}; do
    START=$(date +%s%N)
    aws lambda invoke \
      --function-name "$FUNCTION_NAME" \
      --payload "$PAYLOAD" \
      --region us-west-2 \
      --profile pa-dev \
      response.json > /dev/null
    END=$(date +%s%N)
    DURATION=$(( (END - START) / 1000000 ))
    echo "  Invocación $i: ${DURATION}ms"
  done
done

# Restaurar configuración original
aws lambda update-function-configuration \
  --function-name "$FUNCTION_NAME" \
  --memory-size 1024 \
  --region us-west-2 \
  --profile pa-dev
```

### Opción D: Continuar con Siguientes Mejoras

Dado que Power Tuning requiere más debugging, podemos continuar con:

**Punto 4: Implementar Caché en Memoria**
- Más sencillo de implementar
- Impacto inmediato y medible
- No requiere herramientas externas
- Reducción estimada de latencia: 70-85%

## 📊 Estimación de Ahorros (Sin Power Tuning)

Basándonos en benchmarks típicos de funciones similares:

| Función | Memoria Actual | Memoria Óptima Estimada | Ahorro Estimado |
|---------|----------------|-------------------------|-----------------|
| build_document_by_form_v1 | 1024 MB | 768 MB | 15-25% |
| get_pdf_document_by_sk_from_program_v1 | 1024 MB | 896 MB | 10-15% |
| approve_program_v1 | 512 MB | 512 MB | 0-5% |
| confirm_program_v1 | 512 MB | 384 MB | 5-10% |
| create_transaction_v1 | 1024 MB | 512 MB | 20-30% |

**Total estimado:** $15-25/mes (~20%)

## 🎯 Recomendación

**Opción recomendada: D - Continuar con Punto 4 (Caché)**

Razones:
1. Caché tiene **ROI más alto** (70-85% reducción de latencia)
2. **Implementación más sencilla** y predecible
3. **Resultados inmediatos** y fácilmente medibles
4. Power Tuning puede hacerse después con más tiempo para debugging

El caché reducirá significativamente el número de invocaciones a Lambda y consultas a DynamoDB, lo que tendrá un impacto mayor que la optimización de memoria en el corto plazo.

Una vez implementado el caché y medido su impacto, podemos volver a Power Tuning con:
- Menos tráfico a las funciones (gracias al caché)
- Mejor comprensión de patrones de uso reales
- Más tiempo para hacer debugging del tooling

## 📝 Archivos de Referencia

- [README](../infrastructure/lambda-power-tuning/README.md) - Documentación completa
- [GUIA-RAPIDA](../infrastructure/lambda-power-tuning/GUIA-RAPIDA.md) - Guía paso a paso
- [Payloads](../infrastructure/lambda-power-tuning/payloads/) - Configuraciones listas
- [Scripts](../infrastructure/lambda-power-tuning/) - `install.sh`, `run-tuning.sh`

---

**Estado:** ⏸️ En pausa - Power Tuning instalado pero requiere debugging
**Siguiente acción sugerida:** Implementar Punto 4 (Caché) y volver a esto después
