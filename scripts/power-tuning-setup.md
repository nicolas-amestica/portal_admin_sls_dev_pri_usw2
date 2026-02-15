# ⚡ Lambda Power Tuning - Guía Completa

## 🎯 Objetivo

Optimizar la configuración de memoria/CPU de las Lambdas para obtener el mejor balance entre costo y performance.

**Funciones prioritarias a optimizar:**
- `build_document_by_form_v1` (1024MB → ?)
- `get_pdf_document_by_sk_from_program_v1` (1024MB → ?)
- `approve_program_v1` (1024MB → ?)
- `confirm_program_v1` (1024MB → ?)

**Ahorro esperado:** 20-35% en costos de Lambda

---

## 📦 Instalación con SAM (Recomendado)

### 1. Instalar AWS SAM CLI

```bash
# macOS
brew install aws-sam-cli

# Verificar instalación
sam --version
```

### 2. Desplegar Power Tuning

```bash
# Clonar repositorio oficial
cd ~/Downloads
git clone https://github.com/alexcasalboni/aws-lambda-power-tuning.git
cd aws-lambda-power-tuning

# Desplegar con SAM
sam deploy \
  --guided \
  --stack-name lambda-power-tuning \
  --capabilities CAPABILITY_IAM \
  --region us-west-2 \
  --profile pa-dev
```

**Parámetros recomendados durante --guided:**
- Stack Name: `lambda-power-tuning`
- PowerValues: `128,256,512,768,1024,1536,2048,3008`
- Lambda Tracing: `Active`
- Log Retention: `7`

### 3. Obtener ARN de la State Machine

```bash
aws cloudformation describe-stacks \
  --stack-name lambda-power-tuning \
  --query 'Stacks[0].Outputs[?OutputKey==`PowerTuningStateMachineArn`].OutputValue' \
  --output text \
  --profile pa-dev \
  --region us-west-2
```

**Guardar el ARN para usarlo después**

---

## 🚀 Uso - Optimizar Funciones

### Funciones a Optimizar

Creé payloads listos para usar en: `scripts/power-tuning-payloads/`

---

## 📝 Payloads Preparados

### 1. build_document_by_form_v1

```json
{
  "lambdaARN": "arn:aws:lambda:us-west-2:ACCOUNT_ID:function:contratos-dev-build_document_by_form_v1",
  "powerValues": [256, 512, 768, 1024, 1536, 2048],
  "num": 50,
  "payload": {
    "body": "{\"scope\":\"CTT\",\"document\":{\"numero\":\"TEST-001\",\"fecha\":\"2024-02-14\",\"monto\":1000000,\"participante\":{\"nombre\":\"Test User\",\"rut\":\"12345678-9\"}},\"action\":{\"isPreview\":true}}"
  },
  "parallelInvocation": true,
  "strategy": "balanced",
  "autoOptimize": false
}
```

### 2. approve_program_v1

```json
{
  "lambdaARN": "arn:aws:lambda:us-west-2:ACCOUNT_ID:function:programas-dev-approve_program_v1",
  "powerValues": [512, 768, 1024, 1536, 2048],
  "num": 30,
  "payload": {
    "body": "{\"sk\":\"PRG#test-program-id\",\"approvalData\":{\"approver\":\"admin\",\"comments\":\"Test approval\"}}"
  },
  "parallelInvocation": true,
  "strategy": "balanced",
  "autoOptimize": false
}
```

### 3. confirm_program_v1

```json
{
  "lambdaARN": "arn:aws:lambda:us-west-2:ACCOUNT_ID:function:programas-dev-confirm_program_v1",
  "powerValues": [512, 768, 1024, 1536, 2048],
  "num": 30,
  "payload": {
    "body": "{\"sk\":\"PRG#test-program-id\",\"confirmationData\":{\"confirmed\":true}}"
  },
  "parallelInvocation": true,
  "strategy": "balanced",
  "autoOptimize": false
}
```

---

## 🎯 Ejecutar Power Tuning

### Opción 1: AWS Console

1. Ir a Step Functions: https://us-west-2.console.aws.amazon.com/states/home?region=us-west-2#/statemachines

2. Seleccionar `powerTuningStateMachine`

3. Click en "Start execution"

4. Pegar uno de los payloads de arriba (reemplazar ACCOUNT_ID)

5. Esperar resultados (~5-10 minutos)

### Opción 2: AWS CLI

```bash
# Obtener Account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text --profile pa-dev)

# Obtener ARN de la State Machine
STATE_MACHINE_ARN=$(aws cloudformation describe-stacks \
  --stack-name lambda-power-tuning \
  --query 'Stacks[0].Outputs[?OutputKey==`PowerTuningStateMachineArn`].OutputValue' \
  --output text \
  --profile pa-dev \
  --region us-west-2)

# Ejecutar para build_document_by_form_v1
aws stepfunctions start-execution \
  --state-machine-arn "$STATE_MACHINE_ARN" \
  --input '{
    "lambdaARN": "arn:aws:lambda:us-west-2:'"$ACCOUNT_ID"':function:contratos-dev-build_document_by_form_v1",
    "powerValues": [256, 512, 768, 1024, 1536, 2048],
    "num": 50,
    "payload": {
      "body": "{\"scope\":\"CTT\",\"document\":{},\"action\":{\"isPreview\":true}}"
    },
    "parallelInvocation": true,
    "strategy": "balanced"
  }' \
  --profile pa-dev \
  --region us-west-2
```

---

## 📊 Interpretar Resultados

### Resultado Ejemplo

```json
{
  "power": 768,
  "cost": 0.000044,
  "duration": 2800,
  "stateMachine": {
    "executionCost": 0.00025,
    "lambdaCost": 0.002156,
    "visualization": "https://lambda-power-tuning.show/#gAA..."
  },
  "stats": [
    {"power": 256, "duration": 8500, "cost": 0.000071},
    {"power": 512, "duration": 4200, "cost": 0.000056},
    {"power": 768, "duration": 2800, "cost": 0.000044},
    {"power": 1024, "duration": 2500, "cost": 0.000052},
    {"power": 1536, "duration": 2400, "cost": 0.000075},
    {"power": 2048, "duration": 2350, "cost": 0.000098}
  ]
}
```

**Interpretación:**
- ✅ **768MB** es el óptimo: Menor costo ($0.000044)
- ⚠️ 1024MB (actual): $0.000052 (+18% más caro)
- 📈 **Ahorro**: 15-18% cambiando de 1024MB → 768MB
- 🚀 **Performance**: +12% más rápido (2500ms → 2800ms similar)

### Visualización

Abrir la URL de `visualization` para ver gráfico interactivo:
```
https://lambda-power-tuning.show/#gAAA...
```

Muestra:
- Gráfico de costo vs memoria
- Gráfico de duración vs memoria
- Sweet spot resaltado

---

## ✅ Aplicar Resultados

### Script de Actualización Automática

Creé un script para aplicar los resultados:

```bash
node scripts/apply-power-tuning-results.js
```

### Actualización Manual

Editar `serverless.yml` de cada servicio:

```yaml
# services/api-contract/serverless.yml

functions:
  build_document_by_form_v1:
    handler: functions/build-pdf-document-by-form-v1.main
    timeout: 30
    memorySize: 768  # ← ACTUALIZADO (antes: 1024)

  get_pdf_document_by_sk_from_program_v1:
    handler: functions/build-pdf-document-by-sk-from-program-v1.main
    timeout: 30
    memorySize: 896  # ← ACTUALIZADO (antes: 1024)
```

### Redesplegar

```bash
cd services/api-contract
npx sls deploy --stage dev

# O redesplegar todo
cd ../..
./deploy-all.sh dev
```

---

## 📝 Documentar Resultados

Crear archivo con resultados:

```bash
# scripts/power-tuning-results.json
{
  "date": "2024-02-14",
  "results": {
    "build_document_by_form_v1": {
      "before": {"memory": 1024, "cost": 0.000052, "duration": 2500},
      "after": {"memory": 768, "cost": 0.000044, "duration": 2800},
      "savings": "15%",
      "recommendation": "768MB"
    },
    "approve_program_v1": {
      "before": {"memory": 1024, "cost": 0.000048, "duration": 1800},
      "after": {"memory": 512, "cost": 0.000032, "duration": 2200},
      "savings": "33%",
      "recommendation": "512MB"
    }
  },
  "totalMonthlySavings": "$15-25"
}
```

---

## 🎯 Estrategias de Optimización

### 1. Balanced (Recomendado)
- Mejor balance costo/performance
- Usa en: Funciones de uso general

### 2. Cost
- Minimiza costo sin importar latencia
- Usa en: Funciones batch, procesamiento asíncrono

### 3. Speed
- Minimiza latencia sin importar costo
- Usa en: APIs críticas, funciones de usuario

---

## 🔄 Monitoreo Post-Optimización

### CloudWatch Metrics

```bash
# Ver uso de memoria después del cambio
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name MemoryUtilization \
  --dimensions Name=FunctionName,Value=contratos-dev-build_document_by_form_v1 \
  --start-time $(date -u -d '1 day ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 3600 \
  --statistics Average,Maximum \
  --profile pa-dev \
  --region us-west-2
```

### Verificar Métricas

- ✅ Uso de memoria < 80% del configurado
- ✅ Duración similar o mejor
- ✅ Sin errores adicionales
- ✅ Costo reducido

---

## 📋 Checklist

- [ ] SAM CLI instalado
- [ ] Power Tuning desplegado
- [ ] ARN de State Machine obtenido
- [ ] Ejecutado para build_document_by_form_v1
- [ ] Ejecutado para approve_program_v1
- [ ] Ejecutado para confirm_program_v1
- [ ] Ejecutado para get_pdf_document_by_sk_from_program_v1
- [ ] Resultados documentados
- [ ] Configuraciones aplicadas
- [ ] Servicios redesplegados
- [ ] Métricas monitoreadas

---

## 🚀 Próximos Pasos

Después de aplicar Power Tuning:

1. **Monitorear 1 semana** en dev
2. **Aplicar a prod** si resultados son buenos
3. **Continuar con Punto 4:** Implementar Caché en Memoria
4. **Re-ejecutar Power Tuning** cada 3-6 meses

---

## 📞 Recursos

- **Repositorio oficial:** https://github.com/alexcasalboni/aws-lambda-power-tuning
- **Visualizador:** https://lambda-power-tuning.show/
- **Documentación AWS:** https://docs.aws.amazon.com/lambda/latest/dg/configuration-memory.html
