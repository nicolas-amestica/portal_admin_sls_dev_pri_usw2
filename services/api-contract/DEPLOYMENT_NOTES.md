# Notas de Despliegue - Refactorización PDF Generator

## Cambios Realizados

### 1. Corrección CRÍTICA: binaryMediaTypes en API Gateway
- **Archivo**: `services/api-contract/serverless.yml`
- **Cambio**: Eliminado `'*/*'` de la lista de binaryMediaTypes
- **Razón**: La configuración `'*/*'` causaba que API Gateway codificara TODO el contenido (incluyendo JSON) en base64, lo que resultaba en el error "Unexpected token 'e', \"ewogICAgIm\"... is not valid JSON"
- **Antes**: `binaryMediaTypes: ['multipart/form-data', 'image/*', 'application/pdf', '*/*']`
- **Después**: `binaryMediaTypes: ['multipart/form-data', 'image/*', 'application/pdf']`

### 2. Corrección de CommonJS/ESM Mixing
- **Archivo**: `libs/pdf-generator/index.js`
- **Cambio**: Convertido `require("pdf-lib")` a `import` para mantener consistencia con el resto del código ES modules
- **Razón**: serverless-bundle puede tener problemas empaquetando código con mezcla de CommonJS y ESM

### 2. Configuración de Webpack
- **Archivo**: `webpack.config.js` (nuevo)
- **Cambio**: Creada configuración personalizada para serverless-bundle
- **Razón**: Asegurar que pdf-lib se empaquete correctamente sin minificación que pueda romper el código

### 3. Aumento de Recursos Lambda
- **Funciones afectadas**:
  - `build_contract_v1`: timeout 30s → 60s, memory 512MB → 1024MB
  - `approve_contract_v1`: timeout 30s → 60s, memory 512MB → 1024MB
- **Razón**: La generación de PDF puede requerir más recursos en ambiente Lambda ARM64

### 4. Mejoras en Logging y Manejo de Errores
- **Archivos modificados**:
  - `services/api-contract/functions/build-pdf-document-v1.js`
  - `services/api-contract/functions/approve-contract-v1.js`
  - `libs/pdf-generator/core/image-loader.js`
- **Cambios**:
  - Logs detallados paso a paso
  - Mejor captura y reporte de errores
  - Información específica para debugging en CloudWatch
  - Validaciones adicionales de parámetros y variables de entorno
  - Manejo flexible de `event.body` (string o ya parseado) para compatibilidad con diferentes configuraciones de API Gateway

## Instrucciones de Despliegue

### Prerrequisitos
Verificar que el bucket S3 existe y contiene las imágenes necesarias:

```bash
aws s3 ls s3://giras-indomito-dev-info/assets/ --profile pa-dev
```

Deben existir:
- `assets/header.png`
- `assets/footer.png`

### Desplegar a Dev

1. Asegurarse de estar en el directorio correcto:
```bash
cd services/api-contract
```

2. Desplegar el servicio:
```bash
AWS_PROFILE=pa-dev serverless deploy --stage dev
```

### Verificar el Despliegue

1. Verificar que las funciones se desplegaron correctamente:
```bash
aws lambda get-function --function-name contratos-dev-build_contract_v1 --profile pa-dev
```

2. Verificar los logs en CloudWatch:
```bash
aws logs tail /aws/lambda/contratos-dev-build_contract_v1 --follow --profile pa-dev
```

### Probar la Función

Probar invocación directa con payload de prueba:

```bash
aws lambda invoke \
  --function-name contratos-dev-build_contract_v1 \
  --payload file://test-payload.json \
  --profile pa-dev \
  response.json
```

O probar mediante el endpoint API Gateway usando Postman o curl.

## Debugging

### Si la función falla en dev:

1. **Revisar CloudWatch Logs** - Ahora los logs tienen información detallada de cada paso:
   - Paso 1: Validación de parámetros
   - Paso 2: Construcción de datos
   - Paso 3: Carga de imágenes desde S3
   - Paso 4: Generación de PDF
   - Paso 5: Retorno de respuesta

2. **Errores comunes**:
   - **"No se pudo cargar la imagen"**: Verificar permisos IAM para S3
   - **"Buffer no válido"**: Problema con pdf-lib, revisar logs de empaquetado
   - **Timeout**: Aumentar el timeout si el PDF es muy grande
   - **Out of memory**: Aumentar la memoria si el documento tiene muchas páginas

3. **Verificar permisos IAM**:
```bash
aws iam get-role-policy \
  --role-name contratos-dev-us-west-2-lambdaRole \
  --policy-name dev-contratos-lambda \
  --profile pa-dev
```

## Rollback

Si es necesario revertir los cambios:

```bash
git revert HEAD
AWS_PROFILE=pa-dev serverless deploy --stage dev
```

## Notas Adicionales

- El caché de imágenes en memoria mejora el rendimiento en Lambda warm starts
- Los logs ahora muestran el tamaño del PDF generado para facilitar debugging
- La configuración de webpack evita minificación que podría romper pdf-lib
- Los errores en dev muestran stack traces completos para debugging
