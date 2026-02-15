# Guía de Migración de Handlers al Patrón Middleware

## Estado Actual

### ✅ Completado

**Infraestructura:**
- ✅ API Gateway HTTP compartido desplegado (ID: `2z8nmi3vee`)
- ✅ 9 servicios migrados de `http` → `httpApi`
- ✅ common/custom.yml configurado con referencias al API Gateway

**Handlers con middleware:**
- ✅ api-maintainer: 1/1 (100%)
- ✅ api-contract: 4/4 (100%)

**Total: 5/62 handlers migrados (8%)**

### 📋 Pendiente

**Handlers sin middleware (57 restantes):**
- api-program: 8 handlers
- api-entity: 4 handlers
- api-payment: 10 handlers
- api-balance: 2 handlers
- api-extraction: 1 handler
- api-notification: 1 handler
- job-authorizer: 2 handlers (no requieren middleware estándar)

---

## Patrón de Migración

### Antes (patrón antiguo)
```javascript
import { parseEventBody } from '../../../helpers/event-parser.js';
import { success, unsuccessful } from '../../../helpers/responses.js';
import * as dynamodb from '../../../libs/dynamodb-v3.js';

export const main = async (event) => {
  const ACTION = "Obtener programa";

  try {
    // Parsing manual
    const body = parseEventBody(event);
    const { sk } = event.pathParameters || {};

    // Validaciones inline
    if (!sk) {
      return unsuccessful(400, { message: 'sk requerido' }, ACTION);
    }

    // Lógica de negocio
    const result = await dynamodb.get({
      TableName: process.env.DYNAMODB_TABLE,
      Key: { pk: 'PRG', sk }
    });

    if (!result.Item) {
      return unsuccessful(404, { message: 'No encontrado' }, ACTION);
    }

    return success(200, result.Item, ACTION);

  } catch (error) {
    console.error('Error:', error);
    return unsuccessful(error.statusCode || 500, error, ACTION);
  }
};
```

### Después (con middleware)
```javascript
import { standardMiddleware } from '../../../libs/middleware/index.js';
import { success } from '../../../helpers/responses.js';
import * as dynamodb from '../../../libs/dynamodb-v3.js';

const handler = async (event) => {
  const ACTION = "Obtener programa";

  // event.body, event.pathParams, event.queryParams ya están parseados
  const { sk } = event.pathParams;

  // Validaciones - lanzar error en lugar de retornar unsuccessful
  if (!sk) {
    const error = new Error('sk requerido');
    error.statusCode = 400;
    throw error;
  }

  // Lógica de negocio
  const result = await dynamodb.get({
    TableName: process.env.DYNAMODB_TABLE,
    Key: { pk: 'PRG', sk }
  });

  if (!result.Item) {
    const error = new Error('No encontrado');
    error.statusCode = 404;
    throw error;
  }

  return success(200, result.Item, ACTION);
};

export const main = standardMiddleware(handler);
```

---

## Cambios Necesarios

### 1. Importaciones
```diff
+ import { standardMiddleware } from '../../../libs/middleware/index.js';
- import { parseEventBody } from '../../../helpers/event-parser.js';
- import { unsuccessful } from '../../../helpers/responses.js';  # Solo si no se usa
```

### 2. Definición del Handler
```diff
- export const main = async (event) => {
+ const handler = async (event) => {
```

### 3. Parsing Automático
```diff
- const body = parseEventBody(event);
+ // event.body ya está parseado por middleware

- const { param } = event.pathParameters || {};
+ const { param } = event.pathParams;

- const { query } = event.queryStringParameters || {};
+ const { query } = event.queryParams;
```

### 4. Validaciones
```diff
- if (!param) return unsuccessful(400, { message: '...' }, ACTION);
+ if (!param) {
+   const error = new Error('...');
+   error.statusCode = 400;
+   throw error;
+ }
```

### 5. Try-Catch
```diff
- try {
-   // código
- } catch (error) {
-   return unsuccessful(500, error, ACTION);
- }
+ // código (sin try-catch, manejado por middleware)
```

### 6. Export
```diff
+ export const main = standardMiddleware(handler);
```

---

## Script de Migración Asistida

Crea este script en `scripts/migrate-handler.js`:

```javascript
import fs from 'fs';
import path from 'path';

const migrateHandler = (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');

  // 1. Agregar import de middleware
  if (!content.includes('standardMiddleware')) {
    content = `import { standardMiddleware } from "../../../libs/middleware/index.js";\n${content}`;
  }

  // 2. Remover import de parseEventBody si existe
  content = content.replace(/import.*parseEventBody.*\n/g, '');

  // 3. Cambiar export main a const handler
  content = content.replace(
    /export const main = async \(event\) => \{/g,
    'const handler = async (event) => {'
  );

  // 4. Remover try-catch externo
  content = content.replace(
    /try \{\n([\s\S]*?)\n  \} catch.*\{[\s\S]*?\n  \}/g,
    '$1'
  );

  // 5. Agregar export al final
  if (!content.includes('export const main = standardMiddleware')) {
    content += '\n\nexport const main = standardMiddleware(handler);\n';
  }

  fs.writeFileSync(filePath, content);
  console.log(`✅ Migrado: ${filePath}`);
};

// Uso: node scripts/migrate-handler.js services/api-program/functions/get-program-v1.js
const filePath = process.argv[2];
if (filePath) {
  migrateHandler(filePath);
} else {
  console.error('❌ Uso: node scripts/migrate-handler.js <path-to-handler.js>');
}
```

### Uso del script:
```bash
# Migrar un handler individual
node scripts/migrate-handler.js services/api-program/functions/get-program-v1.js

# Migrar todos los handlers de un servicio
for file in services/api-program/functions/*.js; do
  node scripts/migrate-handler.js "$file"
done
```

---

## Verificación Post-Migración

### Por cada handler migrado:

1. **Verificar sintaxis:**
   ```bash
   cd services/api-program
   npx sls package
   ```

2. **Revisar cambios manuales necesarios:**
   - ✅ Reemplazar `event.pathParameters` → `event.pathParams`
   - ✅ Reemplazar `event.queryStringParameters` → `event.queryParams`
   - ✅ Reemplazar `parseEventBody(event)` → `event.body`
   - ✅ Cambiar returns de `unsuccessful()` por `throw error`
   - ✅ Remover `console.log` innecesarios (el middleware ya loggea)
   - ✅ Remover parámetro `context` si no se usa

3. **Testing local:**
   ```bash
   cd services/api-program
   serverless offline --stage dev

   # En otra terminal
   curl http://localhost:3200/v1/programas/solicitudes/programas
   ```

---

## Checklist por Servicio

### api-program (8 handlers)
- [ ] get-programs-view-v1.js
- [ ] get-program-v1.js
- [ ] create-program-v1.js
- [ ] update-program-v1.js
- [ ] complete-program-v1.js
- [ ] reject-program-v1.js
- [ ] approve-program-v1.js
- [ ] confirm-program-v1.js

### api-entity (4 handlers)
- [ ] login-v1.js
- [ ] forgot-password-v1.js
- [ ] reset-password-v1.js
- [ ] get-access-v1.js

### api-payment (10 handlers)
- [ ] create-installment-payment-v1.js
- [ ] confirm-installment-payment-v1.js
- [ ] get-payments-by-program-v1.js
- [ ] get-payments-by-user-v1.js
- [ ] cancel-installment-payment-v1.js
- [ ] create-transaction-v1.js
- [ ] commit-transaction-v1.js
- [ ] get-transaction-status-v1.js
- [ ] get-transactions-v1.js

### api-balance (2 handlers)
- [ ] create-balance-v1.js
- [ ] get-balances-v1.js

### api-extraction (1 handler)
- [ ] get-object-s3-v1.js

### api-notification (1 handler)
- [ ] send-notification-v1.js

---

## Beneficios del Middleware

Una vez migrados todos los handlers:

- ✅ **40-60% menos código** por handler
- ✅ **Logging estandarizado** con correlation IDs
- ✅ **Error handling centralizado**
- ✅ **Parsing automático** de body, pathParams, queryParams
- ✅ **CORS automático** desde API Gateway
- ✅ **Fácil agregar validación** (futura mejora)
- ✅ **Fácil agregar autenticación** (futura mejora)

---

## Próximos Pasos (según plan)

1. **Migrar handlers** (este documento)
2. **Punto 3: Lambda Power Tuning**
3. **Punto 4: Caché en memoria**
4. **Fase 2:** Separar lógica de negocio, EventBridge, etc.

---

## Soporte

Si encuentras problemas durante la migración:
- Revisa los handlers ya migrados: `api-contract/functions/` como referencia
- El middleware está en: `libs/middleware/index.js`
- Verifica logs de compilación: `npx sls package --verbose`
