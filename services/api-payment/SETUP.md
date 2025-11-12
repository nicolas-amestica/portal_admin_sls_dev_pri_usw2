# Setup del Servicio de Pagos

## 1. Prerrequisitos

- Node.js 18.x
- AWS CLI configurado
- Serverless Framework instalado globalmente: `npm install -g serverless`
- Credenciales AWS configuradas para el perfil `pa-dev`

## 2. Instalación de Dependencias

Desde la raíz del proyecto:

```bash
npm install
```

Esto instalará `transbank-sdk` y todas las dependencias necesarias.

## 3. Configurar AWS

### 3.1. Crear tabla DynamoDB

```bash
cd services/api-payment/scripts
chmod +x create-dynamodb-table.sh
./create-dynamodb-table.sh dev us-west-2 pa-dev
```

Esto creará la tabla `payments-dev-pri-usw2` con todos sus índices GSI.

### 3.2. Configurar parámetros SSM

```bash
chmod +x setup-ssm-parameters.sh
./setup-ssm-parameters.sh dev us-west-2 pa-dev
```

El script te pedirá la URL del frontend. Para desarrollo local usa: `http://localhost:4200`

### 3.3. Verificar configuración

```bash
# Ver parámetros SSM
aws ssm get-parameters-by-path --path "/transbank/dev" --region us-west-2 --profile pa-dev

# Verificar tabla DynamoDB
aws dynamodb describe-table --table-name payments-dev-pri-usw2 --region us-west-2 --profile pa-dev
```

## 4. Deploy

### Deploy completo

Desde `services/api-payment`:

```bash
serverless deploy --stage dev --region us-west-2 --aws-profile pa-dev
```

### Deploy de una función específica

```bash
serverless deploy function -f create_transaction_v1 --stage dev --region us-west-2 --aws-profile pa-dev
```

## 5. Testing Local

### Iniciar serverless offline

```bash
cd services/api-payment
serverless offline --stage dev
```

El servicio estará disponible en `http://localhost:3200`

### Probar endpoints

**Crear transacción:**
```bash
curl -X POST http://localhost:3200/v1/pagos/transacciones/crear \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 1000,
    "orderId": "TEST-001",
    "userId": "user-123",
    "description": "Pago de prueba"
  }'
```

**Confirmar transacción:**
```bash
curl -X POST http://localhost:3200/v1/pagos/transacciones/confirmar \
  -H "Content-Type: application/json" \
  -d '{
    "token": "TOKEN_RECIBIDO_DE_TRANSBANK"
  }'
```

**Obtener estado:**
```bash
curl http://localhost:3200/v1/pagos/transacciones/TOKEN_AQUI/estado
```

**Listar transacciones:**
```bash
curl http://localhost:3200/v1/pagos/transacciones
```

## 6. Ambiente de Integración Transbank

En ambiente de integración, Transbank usa credenciales de prueba:

- **Commerce Code:** `597055555532` (ya configurado)
- **API Key:** Se usa el de integración automáticamente

### Tarjetas de prueba

**Débito (Redcompra):**
- Número: `4051885600446623`
- CVV: `123`
- Fecha: cualquier fecha futura

**Crédito (Visa):**
- Número: `4051885600446623`
- CVV: `123`
- Fecha: cualquier fecha futura

**Para generar rechazos:**
- Monto entre 101 y 110: Genera rechazo

## 7. Pasar a Producción

### 7.1. Actualizar parámetros SSM

```bash
# Cambiar a producción
aws ssm put-parameter \
  --name "/transbank/prod/environment" \
  --value "production" \
  --type "String" \
  --region us-west-2 \
  --profile pa-prod \
  --overwrite

# Actualizar código de comercio real
aws ssm put-parameter \
  --name "/transbank/prod/commerce-code" \
  --value "TU_CODIGO_COMERCIO_REAL" \
  --type "String" \
  --region us-west-2 \
  --profile pa-prod \
  --overwrite

# Actualizar URL frontend
aws ssm put-parameter \
  --name "/transbank/prod/frontend-url" \
  --value "https://portal.girasindomito.cl" \
  --type "String" \
  --region us-west-2 \
  --profile pa-prod \
  --overwrite
```

### 7.2. Crear API Key en Secrets Manager

```bash
aws secretsmanager create-secret \
  --name "transbank-api-key-prod-pri-usw2" \
  --secret-string "TU_API_KEY_DE_PRODUCCION" \
  --region us-west-2 \
  --profile pa-prod
```

### 7.3. Crear tabla DynamoDB de producción

```bash
cd services/api-payment/scripts
./create-dynamodb-table.sh prod us-west-2 pa-prod
```

### 7.4. Deploy a producción

```bash
serverless deploy --stage prod --region us-west-2 --aws-profile pa-prod
```

## 8. Obtener Credenciales de Producción

1. Inicia sesión en el portal de Transbank: https://www.transbank.cl/
2. Ve a "Webpay Plus" > "Mis Productos"
3. Obtén tu Commerce Code y API Key
4. Configura los webhooks si es necesario

## 9. Monitoreo

### CloudWatch Logs

```bash
# Ver logs de crear transacción
serverless logs -f create_transaction_v1 --stage dev --region us-west-2 --aws-profile pa-dev

# Ver logs en tiempo real
serverless logs -f create_transaction_v1 --stage dev --region us-west-2 --aws-profile pa-dev --tail
```

### Métricas

- Las funciones tienen AWS X-Ray habilitado
- Revisa el dashboard de X-Ray en la consola AWS
- CloudWatch Logs contiene todos los registros

## 10. Troubleshooting

### Error: "Table does not exist"
```bash
# Crear la tabla
cd services/api-payment/scripts
./create-dynamodb-table.sh dev us-west-2 pa-dev
```

### Error: "Parameter not found"
```bash
# Configurar parámetros SSM
cd services/api-payment/scripts
./setup-ssm-parameters.sh dev us-west-2 pa-dev
```

### Error: "Secret not found"
Solo ocurre en producción. El ambiente de integración no necesita secret.

### Token expirado
Los tokens de Transbank expiran en 10 minutos. Si el usuario tarda más, debe crear una nueva transacción.

### Transacción duplicada
Verifica que no estés llamando a `commit` múltiples veces con el mismo token. La función ya maneja esto retornando el resultado guardado.

## 11. Estructura de Archivos

```
services/api-payment/
├── functions/
│   ├── create-transaction-v1.js      # Crear transacción
│   ├── commit-transaction-v1.js      # Confirmar transacción
│   ├── get-transaction-status-v1.js  # Obtener estado
│   └── get-transactions-v1.js        # Listar transacciones
├── scripts/
│   ├── create-dynamodb-table.sh      # Crear tabla DynamoDB
│   └── setup-ssm-parameters.sh       # Configurar SSM
├── .env.example                       # Variables de entorno ejemplo
├── serverless.yml                     # Configuración Serverless
├── README.md                          # Documentación
└── SETUP.md                          # Esta guía
```

## 12. Siguiente Paso: Frontend

Una vez que el backend esté funcionando, procede a implementar el frontend en Angular con las instrucciones del README principal.
