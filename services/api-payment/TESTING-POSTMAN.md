# Guía de Testing con Postman

## 🧪 Flujo de Testing para Desarrollo

### 1️⃣ Crear Transacción

**POST** `http://localhost:3200/dev/v1/pagos/transacciones/crear`

**Headers:**
```
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "amount": 5000,
  "orderId": "TEST-001",
  "userId": "user-123",
  "description": "Pago de prueba desde Postman"
}
```

**Respuesta esperada (200):**
```json
{
  "state": true,
  "metadata": {
    "statusCode": 200,
    "action": "Crear transacción de pago."
  },
  "data": {
    "transactionId": "01933d4e-8b2a-7890-abcd-123456789abc",
    "token": "01abe021f7c2eb1fedffd1239189a24847894d0d4402096ea438b63b43e9c63a",
    "url": "https://webpay3gint.transbank.cl/webpayserver/initTransaction",
    "buyOrder": "TEST-001",
    "amount": 5000
  }
}
```

**💾 Guardar:** Copia el `token` de la respuesta para usarlo en el siguiente paso.

---

### 2️⃣ Opción A: Confirmar con Mock (Testing Rápido) ⚡

**POST** `http://localhost:3200/dev/v1/pagos/transacciones/confirmar-mock`

**Headers:**
```
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "token": "01abe021f7c2eb1fedffd1239189a24847894d0d4402096ea438b63b43e9c63a"
}
```

**Para simular pago exitoso:**
```json
{
  "token": "TU_TOKEN_AQUI",
  "shouldFail": false
}
```

**Para simular pago rechazado:**
```json
{
  "token": "TU_TOKEN_AQUI",
  "shouldFail": true
}
```

**Respuesta esperada (200) - Pago Exitoso:**
```json
{
  "state": true,
  "metadata": {
    "statusCode": 200,
    "action": "[MOCK] Confirmar transacción de pago."
  },
  "data": {
    "transactionId": "01933d4e-8b2a-7890-abcd-123456789abc",
    "buyOrder": "TEST-001",
    "amount": 5000,
    "status": "AUTHORIZED",
    "vci": "TSY",
    "authorizationCode": "1213",
    "responseCode": 0,
    "paymentTypeCode": "VN",
    "accountingDate": "1122",
    "transactionDate": "2024-11-22T15:30:00.000Z",
    "cardDetail": {
      "cardNumber": "6623"
    },
    "installmentsNumber": 0,
    "updatedAt": "2024-11-22T15:30:00.000Z"
  }
}
```

---

### 2️⃣ Opción B: Confirmar Real con Webpay (Testing Completo) 🏦

⚠️ **Este endpoint solo funciona después de que el usuario complete el pago en Webpay**

**POST** `http://localhost:3200/dev/v1/pagos/transacciones/confirmar`

**Body:**
```json
{
  "token": "TOKEN_RETORNADO_POR_WEBPAY"
}
```

**Pasos para testing completo:**

1. Crea la transacción con el endpoint de crear
2. Copia el `url` y `token` de la respuesta
3. Crea un archivo HTML temporal:

```html
<!DOCTYPE html>
<html>
<body>
  <form method="POST" action="PEGA_AQUI_LA_URL">
    <input type="hidden" name="token_ws" value="PEGA_AQUI_EL_TOKEN">
    <button type="submit">Ir a Webpay</button>
  </form>
</body>
</html>
```

4. Abre el HTML en el navegador y haz click en el botón
5. En Webpay usa:
   - Tarjeta: `4051885600446623`
   - CVV: `123`
   - Fecha: Cualquier futura
6. Webpay te redirigirá con el `token_ws` en la URL
7. Usa ese token en el endpoint de confirmar

---

### 3️⃣ Obtener Estado de Transacción

**GET** `http://localhost:3200/dev/v1/pagos/transacciones/{token}/estado`

**Ejemplo:**
```
http://localhost:3200/dev/v1/pagos/transacciones/01abe021f7c2eb1fedffd1239189a24847894d0d4402096ea438b63b43e9c63a/estado
```

**Respuesta (200):**
```json
{
  "state": true,
  "metadata": {
    "statusCode": 200,
    "action": "Obtener estado de transacción."
  },
  "data": {
    "transactionId": "01933d4e-8b2a-7890-abcd-123456789abc",
    "buyOrder": "TEST-001",
    "amount": 5000,
    "status": "AUTHORIZED",
    "vci": "TSY",
    "authorizationCode": "1213",
    "responseCode": 0,
    "cardDetail": {
      "cardNumber": "6623"
    }
  }
}
```

---

### 4️⃣ Listar Transacciones

**GET** `http://localhost:3200/dev/v1/pagos/transacciones`

**Query Parameters opcionales:**
- `userId` - Filtrar por usuario
- `status` - Filtrar por estado (PENDING, AUTHORIZED, FAILED)
- `buyOrder` - Filtrar por orden de compra
- `limit` - Número de resultados (default: 20)

**Ejemplos:**

**Todas las transacciones:**
```
http://localhost:3200/dev/v1/pagos/transacciones
```

**Por usuario:**
```
http://localhost:3200/dev/v1/pagos/transacciones?userId=user-123
```

**Por estado:**
```
http://localhost:3200/dev/v1/pagos/transacciones?status=AUTHORIZED
```

**Por orden:**
```
http://localhost:3200/dev/v1/pagos/transacciones?buyOrder=TEST-001
```

**Respuesta (200):**
```json
{
  "state": true,
  "metadata": {
    "statusCode": 200,
    "action": "Listar transacciones de pago.",
    "count": 5,
    "scannedCount": 5
  },
  "data": {
    "Items": [
      {
        "pk": "PAYMENT#01933d4e-8b2a-7890-abcd-123456789abc",
        "sk": "METADATA",
        "transactionId": "01933d4e-8b2a-7890-abcd-123456789abc",
        "buyOrder": "TEST-001",
        "amount": 5000,
        "status": "AUTHORIZED",
        "createdAt": "2024-11-22T15:00:00.000Z",
        "updatedAt": "2024-11-22T15:30:00.000Z"
      }
    ],
    "Count": 5,
    "ScannedCount": 5
  }
}
```

---

## 📋 Colección de Postman

Puedes importar esta colección JSON en Postman:

```json
{
  "info": {
    "name": "API Pagos Transbank",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:3200/dev"
    },
    {
      "key": "token",
      "value": ""
    }
  ],
  "item": [
    {
      "name": "1. Crear Transacción",
      "event": [
        {
          "listen": "test",
          "script": {
            "exec": [
              "const response = pm.response.json();",
              "if (response.data && response.data.token) {",
              "    pm.collectionVariables.set('token', response.data.token);",
              "    console.log('Token guardado:', response.data.token);",
              "}"
            ]
          }
        }
      ],
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"amount\": 5000,\n  \"orderId\": \"TEST-001\",\n  \"userId\": \"user-123\",\n  \"description\": \"Pago de prueba\"\n}"
        },
        "url": {
          "raw": "{{baseUrl}}/v1/pagos/transacciones/crear",
          "host": ["{{baseUrl}}"],
          "path": ["v1", "pagos", "transacciones", "crear"]
        }
      }
    },
    {
      "name": "2. Confirmar Transacción (Mock)",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"token\": \"{{token}}\",\n  \"shouldFail\": false\n}"
        },
        "url": {
          "raw": "{{baseUrl}}/v1/pagos/transacciones/confirmar-mock",
          "host": ["{{baseUrl}}"],
          "path": ["v1", "pagos", "transacciones", "confirmar-mock"]
        }
      }
    },
    {
      "name": "3. Obtener Estado",
      "request": {
        "method": "GET",
        "url": {
          "raw": "{{baseUrl}}/v1/pagos/transacciones/{{token}}/estado",
          "host": ["{{baseUrl}}"],
          "path": ["v1", "pagos", "transacciones", "{{token}}", "estado"]
        }
      }
    },
    {
      "name": "4. Listar Transacciones",
      "request": {
        "method": "GET",
        "url": {
          "raw": "{{baseUrl}}/v1/pagos/transacciones",
          "host": ["{{baseUrl}}"],
          "path": ["v1", "pagos", "transacciones"]
        }
      }
    }
  ]
}
```

---

## ⚡ Flujo Rápido de Testing

1. **Crear transacción** → Guarda el token automáticamente
2. **Confirmar con mock** → Usa el token guardado
3. **Listar transacciones** → Ver todas las pruebas

---

## 🎯 Códigos de Estado

| Estado | Descripción |
|--------|-------------|
| `PENDING` | Transacción creada, esperando pago |
| `AUTHORIZED` | Pago aprobado |
| `FAILED` | Pago rechazado |

---

## ❌ Errores Comunes

### Error 404 - Transacción no encontrada
```json
{
  "state": false,
  "metadata": {
    "statusCode": 404,
    "action": "..."
  },
  "data": {
    "message": "Transacción no encontrada."
  }
}
```
**Solución:** Verifica que el token sea correcto.

### Error 422 - Estado inválido
```json
{
  "state": false,
  "data": {
    "message": "Invalid status '0' for transaction while authorizing..."
  }
}
```
**Solución:** Usa el endpoint `/confirmar-mock` en lugar de `/confirmar` para testing.

---

## 🔧 Tips

1. **Auto-guardar token:** El script de Postman guarda automáticamente el token
2. **Variables de entorno:** Usa `{{baseUrl}}` y `{{token}}` para reutilizar valores
3. **Mock vs Real:** Usa mock para testing rápido, real para testing completo
4. **Reiniciar:** Si el token expira (10 min), crea una nueva transacción

---

**¿Necesitas ayuda?** Revisa los logs de serverless offline para ver detalles de errores.
