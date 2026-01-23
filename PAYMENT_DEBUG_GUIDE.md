# Guía de Debugging - Error "Pago no encontrado"

## Problema Reportado

Cuando el usuario completa el pago en Transbank y es redirigido de vuelta, el backend retorna:
```json
{
  "state": false,
  "metadata": {
    "action": "Confirmar pago de cuota."
  },
  "data": {
    "message": "Pago no encontrado."
  }
}
```

## Causa Probable

El endpoint `confirm-installment-payment-v1` no está encontrando el pago en DynamoDB usando el token que Transbank envía en el `token_ws` query param.

### Posibles Razones:

1. **Token no coincide**: El token guardado en DynamoDB no coincide con el token que Transbank envía en la redirección
2. **Scan fallando**: El scan de DynamoDB con `FilterExpression` en nested attribute `transbankDetails.token` puede estar fallando
3. **Datos mal estructurados**: La estructura de `transbankDetails` en DynamoDB no coincide con lo esperado
4. **Problema de timing**: El scan se ejecuta antes de que el registro se haya propagado completamente en DynamoDB

## Mejoras Implementadas

### 1. Logging Detallado en `create-installment-payment-v1.js`

**Línea 172**: Log del token creado en Transbank
```javascript
console.log(`Transacción creada en Transbank. Token: ${response.token}, URL: ${response.url}`);
```

**Línea 214**: Log del token guardado en DynamoDB
```javascript
console.log(`Pago guardado en DynamoDB. PaymentId: ${paymentId}, Token guardado: ${response.token}`);
```

**Línea 220**: Log del resultado final
```javascript
console.log("Pago creado exitosamente. Resultado:", JSON.stringify(result, null, 2));
```

### 2. Logging Detallado en `confirm-installment-payment-v1.js`

**Línea 45**: Log del token que se está buscando
```javascript
console.log(`Buscando pago con token: ${token}`);
```

**Línea 53**: Log de los parámetros del scan
```javascript
console.log("Parámetros de búsqueda:", JSON.stringify(scanParams, null, 2));
```

**Línea 57**: Log del resultado del scan
```javascript
console.log(`Scan completado. Resultados encontrados: ${result ? result.length : 0}`);
```

**Línea 59-66**: Log detallado si se encuentra el pago
```javascript
if (result && result.length > 0) {
  console.log("Pago encontrado:", JSON.stringify({
    pk: result[0].pk,
    sk: result[0].sk,
    status: result[0].status,
    token: result[0].transbankDetails?.token
  }));
  return result[0];
}
```

**Línea 105**: Log del evento completo recibido
```javascript
console.log("Evento recibido:", JSON.stringify(event, null, 2));
```

**Línea 111**: Log del token recibido
```javascript
console.log(`Token recibido para confirmación: ${token}`);
```

**Línea 118**: Log de error mejorado con más contexto
```javascript
if (!payment) {
  console.error(`PAGO NO ENCONTRADO. Token buscado: ${token}`);
  return unsuccessful(404, {
    message: `Pago no encontrado para el token proporcionado. Esto puede ocurrir si el pago no se creó correctamente o el token no coincide.`,
    debug: { token: token.substring(0, 10) + "..." }
  }, action);
}
```

## Cómo Debuggear

### Paso 1: Desplegar el Backend con Logging

```bash
cd portal-admin-sls-dev-pri-usw2/services/api-payment
serverless deploy --stage dev --verbose
```

### Paso 2: Realizar un Pago de Prueba

1. Desde el frontend, selecciona una cuota
2. Inicia el pago con Webpay
3. Completa el pago en Transbank (o cancela)
4. Observa la redirección

### Paso 3: Revisar los Logs de CloudWatch

```bash
# Ver logs de CREATE
serverless logs -f create-installment-payment-v1 --stage dev --tail

# Ver logs de CONFIRM (en otra terminal)
serverless logs -f confirm-installment-payment-v1 --stage dev --tail
```

### Paso 4: Analizar los Logs

Busca en los logs:

**En CREATE (cuando se inicia el pago):**
```
Transacción creada en Transbank. Token: 01ab23cd45...
Pago guardado en DynamoDB. PaymentId: 019be..., Token guardado: 01ab23cd45...
```

**En CONFIRM (cuando vuelve de Transbank):**
```
Token recibido para confirmación: 01ab23cd45...
Buscando pago con token: 01ab23cd45...
Scan completado. Resultados encontrados: 0 o 1
```

**Comparar**:
- ¿El token en CREATE coincide exactamente con el token en CONFIRM?
- ¿El scan encontró 0 o 1 resultado?

### Paso 5: Verificar DynamoDB Directamente

```bash
# Buscar pagos PENDING recientes
aws dynamodb scan \
  --table-name payments-dev-pri-usw2 \
  --filter-expression "#status = :status" \
  --expression-attribute-names '{"#status": "status"}' \
  --expression-attribute-values '{":status": {"S": "PENDING"}}' \
  --region us-west-2 \
  --max-items 5

# Ver estructura completa de un pago específico
aws dynamodb get-item \
  --table-name payments-dev-pri-usw2 \
  --key '{"pk": {"S": "PAY#..."}, "sk": {"S": "PAY#..."}}' \
  --region us-west-2
```

Verificar que `transbankDetails.token` exista y tenga el formato esperado.

## Soluciones Posibles

### Solución 1: Problema con el Scan de Nested Attributes

Si el scan no funciona con nested attributes, podemos:

**Opción A: Mover el token al nivel superior**
```javascript
// En create-installment-payment-v1.js (líneas 176-209)
Item: {
  pk: `PAY#${paymentId}`,
  sk: `PAY#${programId}`,
  id: paymentId,
  token: response.token, // ✅ Mover aquí al nivel superior
  transbankDetails: {
    token: response.token, // Mantener también aquí por compatibilidad
    buyOrder,
    sessionId,
    // ...
  },
  // ...
}
```

Luego cambiar el scan:
```javascript
// En confirm-installment-payment-v1.js
FilterExpression: "#token = :token",
ExpressionAttributeNames: {
  "#token": "token", // Sin prefijo
}
```

**Opción B: Crear un GSI con el token** (requiere cambios en serverless.yml)

### Solución 2: Problema de Timing

Si es un problema de timing (eventual consistency), podemos:

```javascript
// En confirm-installment-payment-v1.js
const payment = await getPaymentByToken(token);

if (!payment) {
  // Retry después de 2 segundos
  console.log("Pago no encontrado, reintentando después de 2 segundos...");
  await new Promise(resolve => setTimeout(resolve, 2000));
  const paymentRetry = await getPaymentByToken(token);

  if (!paymentRetry) {
    console.error(`PAGO NO ENCONTRADO después de retry. Token: ${token}`);
    return unsuccessful(404, { message: "Pago no encontrado." }, action);
  }

  payment = paymentRetry;
}
```

### Solución 3: Usar el programId de la URL

Transbank retorna a: `http://localhost:4300/app/cliente/pagos?programId=XXX&token_ws=YYY`

Podríamos usar el `programId` para hacer un query más eficiente:

```javascript
// En confirm-installment-payment-v1.js
const getPaymentByProgramAndToken = async (programId, token) => {
  const queryParams = {
    TableName: DYNAMODB_PAYMENT_TABLE,
    KeyConditionExpression: "sk = :sk",
    FilterExpression: "transbankDetails.#token = :token AND #status = :status",
    ExpressionAttributeNames: {
      "#token": "token",
      "#status": "status"
    },
    ExpressionAttributeValues: {
      ":sk": `PAY#${programId}`,
      ":token": token,
      ":status": "PENDING"
    },
    Limit: 1
  };

  const result = await dynamoDbLib.query(queryParams);
  return result && result.length > 0 ? result[0] : null;
};
```

Pero esto requiere que el frontend envíe también el `programId` en el body al confirmar.

## Próximos Pasos

1. **Desplegar con logging**
2. **Hacer prueba de pago completo**
3. **Revisar logs de CloudWatch** para identificar la causa exacta
4. **Implementar la solución apropiada** según los hallazgos

Una vez identificado el problema exacto en los logs, implementaremos la solución correspondiente.

## Contacto para Soporte

Si después del deployment y análisis de logs sigues viendo el error, comparte:
1. Los logs de CREATE (token creado y guardado)
2. Los logs de CONFIRM (token buscado y resultado del scan)
3. La estructura del objeto en DynamoDB (output del get-item)

Con esa información podremos identificar exactamente dónde está fallando.
