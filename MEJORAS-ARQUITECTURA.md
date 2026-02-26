# Plan de Mejoras Arquitectónicas - Portal Admin Serverless

**Proyecto:** Portal Admin SLS Dev Pri USW2
**Versión:** 1.0
**Fecha:** Febrero 2025
**Framework:** Serverless v4 + Node.js 20.x

---

## Índice

- [Estado Actual](#estado-actual)
- [Roadmap de Mejoras](#roadmap-de-mejoras)
- [Fase 1: Fundamentos (Puntos 1-4)](#fase-1-fundamentos-puntos-1-4)
- [Fase 2: Optimización (Puntos 5-7)](#fase-2-optimización-puntos-5-7)
- [Fase 3: Avanzado (Puntos 8-10)](#fase-3-avanzado-puntos-8-10)

---

## Estado Actual

### ✅ Completado Recientemente
- Migración a Serverless Framework v4
- Bundling nativo con esbuild (eliminado serverless-bundle)
- Actualización a Node.js 20.x en todos los servicios
- Configuración de validación habilitada

### 📊 Arquitectura Actual
```
├── 9 Servicios Node.js (nodejs20.x)
│   ├── api-contract (generación PDFs)
│   ├── api-entity (usuarios)
│   ├── api-program (programas)
│   ├── api-payment (pagos)
│   ├── api-notification (notificaciones)
│   ├── api-balance (balances)
│   ├── api-extraction (extracciones)
│   ├── api-maintainer (mantenedor)
│   └── job-authorizer (autenticación)
├── 1 Servicio Go
│   └── api-configuration
└── Recursos Compartidos
    ├── libs/ (helpers, utilidades)
    ├── common/ (configuración YAML)
    └── aws/ (políticas IAM)
```

### 🔧 Stack Tecnológico
- **Runtime:** Node.js 20.x
- **Framework:** Serverless Framework v4
- **Bundler:** esbuild nativo
- **Database:** DynamoDB
- **Storage:** S3
- **Observability:** AWS X-Ray
- **Auth:** Lambda Authorizer custom

---

## Roadmap de Mejoras

### 📋 Priorización

| Fase | Puntos | Duración | Complejidad | Impacto |
|------|--------|----------|-------------|---------|
| **Fase 1** | 1-4 | 2-3 semanas | Media | Alto ⭐⭐⭐ |
| **Fase 2** | 5-7 | 3-4 semanas | Alta | Medio ⭐⭐ |
| **Fase 3** | 8-10 | 4-6 semanas | Muy Alta | Estratégico ⭐ |

---

## Fase 1: Fundamentos (Puntos 1-4)

**Objetivo:** Establecer bases sólidas de observabilidad, consolidación y performance
**Duración estimada:** 2-3 semanas
**Prioridad:** ⭐⭐⭐ Alta

---

### 🎯 Punto 1: Centralizar Gestión de Errores y Observabilidad

**Problema actual:**
- Cada servicio maneja errores de forma inconsistente
- No hay logging estandarizado
- Difícil rastrear errores entre servicios
- X-Ray habilitado pero no optimizado

**Solución:**
Implementar middleware centralizado con Middy para manejo consistente de errores.

**Archivos a crear:**
```
libs/middleware/
├── error-handler.js         # Middleware principal de errores
├── logger.js                 # Logger centralizado con Winston
├── correlation-id.js         # IDs de correlación para trazas
└── metrics.js                # Métricas custom a CloudWatch
```

**Archivos a modificar:**
```
services/*/functions/*.js     # Todos los handlers
package.json                  # Agregar @middy/core y middlewares
```

**Dependencias nuevas:**
```json
{
  "@middy/core": "^5.5.1",
  "@middy/error-logger": "^5.5.1",
  "@middy/http-error-handler": "^5.5.1",
  "@middy/http-cors": "^5.5.1",
  "@middy/http-json-body-parser": "^5.5.1"
}
```

**Patrón de implementación:**
```javascript
// Antes
export const main = async (event) => {
  try {
    const body = JSON.parse(event.body);
    // lógica...
    return { statusCode: 200, body: JSON.stringify(result) };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};

// Después
import middy from '@middy/core';
import { errorHandler, logger, correlationId } from '../../../libs/middleware';

const handler = async (event) => {
  const { body } = event;  // Ya parseado por middleware
  // lógica...
  return { statusCode: 200, body: result };  // Serializado automáticamente
};

export const main = middy(handler)
  .use(correlationId())
  .use(logger())
  .use(errorHandler());
```

**Verificación:**
- [ ] Todos los handlers usan middleware
- [ ] Errores logueados en CloudWatch con contexto
- [ ] Correlation IDs en todas las respuestas
- [ ] X-Ray traces conectados entre servicios

**Tiempo estimado:** 3-4 días

---

### 🎯 Punto 2: Implementar API Gateway como Punto Único de Entrada

**Problema actual:**
- 9 API Gateways independientes (uno por servicio)
- Costos elevados ($3.50/millón requests × 9)
- Gestión fragmentada de CORS, autenticación, rate limiting
- URLs diferentes por servicio

**Solución:**
Consolidar en un API Gateway HTTP único con rutas compartidas.

**Arquitectura propuesta:**
```
┌─────────────────────────────────────────┐
│   API Gateway HTTP (único endpoint)     │
│   portal-admin-dev.execute-api.us-west-2│
└─────────────────┬───────────────────────┘
                  │
    ┌─────────────┼─────────────┐
    │             │             │
┌───▼───┐    ┌───▼───┐    ┌───▼───┐
│ Auth  │    │Contract│    │ Users │
│Lambda │    │Lambda  │    │Lambda │
└───────┘    └────────┘    └───────┘
```

**Archivos a crear:**
```
infrastructure/
├── api-gateway-shared.yml    # Recurso de API Gateway compartido
└── routes/
    ├── contracts.yml         # Rutas de contratos
    ├── users.yml             # Rutas de usuarios
    └── programs.yml          # Rutas de programas
```

**Archivos a modificar:**
```
services/*/serverless.yml     # Cambiar eventos http a httpApi
common/custom.yml             # Agregar API Gateway ID compartido
```

**Configuración:**
```yaml
# infrastructure/api-gateway-shared.yml
resources:
  Resources:
    PortalAdminHttpApi:
      Type: AWS::ApiGatewayV2::Api
      Properties:
        Name: portal-admin-${self:custom.stage}
        ProtocolType: HTTP
        CorsConfiguration:
          AllowOrigins:
            - '*'
          AllowMethods:
            - GET
            - POST
            - PUT
            - DELETE
          AllowHeaders:
            - Content-Type
            - Authorization
            - X-Correlation-Id

  Outputs:
    HttpApiId:
      Value: !Ref PortalAdminHttpApi
      Export:
        Name: portal-admin-${self:custom.stage}-api-id
    HttpApiUrl:
      Value: !GetAtt PortalAdminHttpApi.ApiEndpoint
      Export:
        Name: portal-admin-${self:custom.stage}-api-url
```

**Migración por servicio:**
```yaml
# Antes (cada servicio)
functions:
  build_document:
    events:
      - http:
          path: v1/documentos/pdf
          method: post
          cors: true

# Después (usando API compartido)
functions:
  build_document:
    events:
      - httpApi:
          path: /v1/documentos/pdf
          method: POST
          authorizer:
            name: customAuthorizer
```

**Beneficios cuantificables:**
- **Ahorro:** ~$25-30/mes (8 API Gateways eliminados)
- **Latencia:** -10-20ms (menos hops)
- **Gestión:** 1 endpoint vs 9

**Verificación:**
- [ ] API Gateway único desplegado
- [ ] Todos los servicios apuntan al API compartido
- [ ] CORS funciona correctamente
- [ ] Authorizer funciona en todas las rutas
- [ ] Custom domain configurado (opcional)

**Tiempo estimado:** 4-5 días

---

### 🎯 Punto 3: Activar Lambda Power Tuning

**Problema actual:**
- Configuración genérica de memoria (512MB o 1024MB)
- No hay datos sobre configuración óptima
- Posible desperdicio de recursos o bajo rendimiento

**Solución:**
Usar AWS Lambda Power Tuning para encontrar configuración óptima costo/rendimiento.

**Herramienta:**
[AWS Lambda Power Tuning](https://github.com/alexcasalboni/aws-lambda-power-tuning)

**Proceso:**
1. Desplegar State Machine de Power Tuning
2. Ejecutar tuning por cada función crítica
3. Analizar resultados
4. Aplicar configuración óptima
5. Monitorear mejoras

**Instalación:**
```bash
# Clonar repo
git clone https://github.com/alexcasalboni/aws-lambda-power-tuning.git
cd aws-lambda-power-tuning

# Desplegar con SAM
sam deploy --guided --stack-name lambda-power-tuning
```

**Funciones a optimizar (prioritarias):**

| Función | Memoria Actual | Uso Estimado | Prioridad |
|---------|---------------|--------------|-----------|
| build_document_by_form_v1 | 1024 MB | Alto (PDFs) | ⭐⭐⭐ |
| get_pdf_document_by_sk_from_program_v1 | 1024 MB | Alto | ⭐⭐⭐ |
| process_payment_v1 | 512 MB | Medio | ⭐⭐ |
| save_contract_data_v1 | 512 MB | Bajo | ⭐ |

**Ejecución de tuning:**
```json
{
  "lambdaARN": "arn:aws:lambda:us-west-2:ACCOUNT:function:contratos-dev-build_document_by_form_v1",
  "powerValues": [256, 512, 768, 1024, 1536, 2048, 3008],
  "num": 50,
  "payload": {
    "body": "{\"scope\":\"CTT\",\"document\":{...},\"action\":{\"isPreview\":true}}"
  },
  "parallelInvocation": true,
  "strategy": "cost"
}
```

**Resultados esperados:**
```
Función: build_document_by_form_v1
┌────────┬──────────┬──────────┬──────────┐
│ Memory │ Duration │ Cost     │ Status   │
├────────┼──────────┼──────────┼──────────┤
│ 1024MB │ 2500ms   │ $0.00042 │ Current  │
│ 768MB  │ 2800ms   │ $0.00035 │ Optimal✓ │
│ 512MB  │ 4200ms   │ $0.00036 │          │
└────────┴──────────┴──────────┴──────────┘

Recomendación: 768MB (-25% costo, +12% duración)
```

**Aplicación de resultados:**
```yaml
# services/api-contract/serverless.yml
functions:
  build_document_by_form_v1:
    handler: functions/build-pdf-document-by-form-v1.main
    memorySize: 768  # Optimizado (antes: 1024)
    timeout: 29
```

**Script de automatización:**
```javascript
// scripts/apply-tuning-results.js
const results = {
  'build_document_by_form_v1': 768,
  'get_pdf_document_by_sk_from_program_v1': 896,
  'process_payment_v1': 512,
  // ...
};

// Actualizar serverless.yml automáticamente
```

**Verificación:**
- [ ] State Machine de tuning desplegada
- [ ] Tuning ejecutado para funciones críticas
- [ ] Resultados documentados
- [ ] Configuración aplicada en serverless.yml
- [ ] CloudWatch muestra mejoras en costo/performance

**Ahorro estimado:** 20-35% en costos de Lambda

**Tiempo estimado:** 2-3 días

---

### 🎯 Punto 4: Implementar Caché con DynamoDB Streams + Lambda

**Problema actual:**
- Cada request consulta DynamoDB directamente
- Datos frecuentes (programas, configuración) se consultan repetidamente
- Latencia innecesaria en datos que no cambian frecuentemente
- Costos elevados en RCU (Read Capacity Units)

**Solución:**
Implementar caché en memoria en Lambda + invalidación con DynamoDB Streams.

**Arquitectura propuesta:**
```
┌──────────┐    Cache Miss    ┌──────────┐
│  Lambda  │ ──────────────▶  │ DynamoDB │
│ (+ cache)│ ◀──────────────  │          │
└────┬─────┘    Cache Hit      └─────┬────┘
     │                               │
     │                               │
     ▼                               ▼
┌─────────┐                    ┌──────────┐
│ Response│                    │  Stream  │
│ (fast)  │                    │  Event   │
└─────────┘                    └─────┬────┘
                                     │
                                     ▼
                              ┌─────────────┐
                              │   Lambda    │
                              │ Invalidator │
                              └─────────────┘
```

**Archivos a crear:**
```
libs/cache/
├── in-memory-cache.js        # Caché en memoria con TTL
├── cache-keys.js             # Generación de keys
└── cache-invalidator.js      # Invalidación por streams

services/cache-invalidator/
├── serverless.yml            # Servicio de invalidación
└── functions/
    └── invalidate-cache.js   # Handler de streams
```

**Implementación del caché:**

```javascript
// libs/cache/in-memory-cache.js
const cache = new Map();
const TTL = 5 * 60 * 1000; // 5 minutos

export class InMemoryCache {
  static get(key) {
    const item = cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiresAt) {
      cache.delete(key);
      return null;
    }

    return item.value;
  }

  static set(key, value, ttl = TTL) {
    cache.set(key, {
      value,
      expiresAt: Date.now() + ttl
    });
  }

  static invalidate(key) {
    cache.delete(key);
  }

  static clear() {
    cache.clear();
  }
}
```

**Uso en handlers:**
```javascript
// services/api-program/functions/get-program-v1.js
import { InMemoryCache } from '../../../libs/cache/in-memory-cache.js';
import * as dynamodb from '../../../libs/dynamodb-v3.js';

export const main = async (event) => {
  const { programId } = event.pathParameters;
  const cacheKey = `program:${programId}`;

  // 1. Intentar caché
  let program = InMemoryCache.get(cacheKey);

  if (program) {
    console.log('Cache HIT:', cacheKey);
    return success(200, program);
  }

  // 2. Cache MISS - consultar DynamoDB
  console.log('Cache MISS:', cacheKey);
  program = await dynamodb.get({
    TableName: process.env.DYNAMODB_PROGRAM_TABLE,
    Key: { pk: `PROGRAM#${programId}` }
  });

  // 3. Guardar en caché
  InMemoryCache.set(cacheKey, program);

  return success(200, program);
};
```

**Invalidación con DynamoDB Streams:**

```yaml
# common/dynamodb-tables.yml
resources:
  Resources:
    ProgramsTable:
      Type: AWS::DynamoDB::Table
      Properties:
        TableName: programs-${self:custom.stage}-pri-usw2
        StreamSpecification:
          StreamViewType: NEW_AND_OLD_IMAGES  # Habilitar streams
```

```javascript
// services/cache-invalidator/functions/invalidate-cache.js
import { InMemoryCache } from '../../../libs/cache/in-memory-cache.js';

export const main = async (event) => {
  for (const record of event.Records) {
    if (record.eventName === 'MODIFY' || record.eventName === 'REMOVE') {
      const keys = record.dynamodb.Keys;
      const pk = keys.pk.S;

      // Invalidar caché basado en la clave
      if (pk.startsWith('PROGRAM#')) {
        const programId = pk.replace('PROGRAM#', '');
        InMemoryCache.invalidate(`program:${programId}`);
        console.log('Invalidated cache for program:', programId);
      }
    }
  }

  return { statusCode: 200 };
};
```

```yaml
# services/cache-invalidator/serverless.yml
functions:
  invalidate_cache:
    handler: functions/invalidate-cache.main
    events:
      - stream:
          type: dynamodb
          arn: !GetAtt ProgramsTable.StreamArn
          batchSize: 10
          startingPosition: LATEST
```

**Datos a cachear (prioridad):**

| Tipo de Dato | TTL | Frecuencia de Cambio | Prioridad |
|--------------|-----|---------------------|-----------|
| Programas | 10 min | Baja | ⭐⭐⭐ |
| Configuración | 15 min | Muy Baja | ⭐⭐⭐ |
| Bancos | 30 min | Muy Baja | ⭐⭐ |
| Usuarios | 5 min | Media | ⭐ |

**Métricas a monitorear:**
```javascript
// libs/cache/metrics.js
export class CacheMetrics {
  static recordHit(key) {
    // CloudWatch metric
    console.log('CACHE_HIT', { key });
  }

  static recordMiss(key) {
    // CloudWatch metric
    console.log('CACHE_MISS', { key });
  }

  static getHitRate() {
    // Calcular hit rate
  }
}
```

**Beneficios cuantificables:**
- **Latencia:** -50-80% en endpoints cacheados
- **Costos DynamoDB:** -30-50% en RCU
- **Escalabilidad:** Menos presión en DynamoDB

**Limitaciones a considerar:**
- Caché en memoria no se comparte entre invocaciones frías
- Consistencia eventual (5-10 min máximo)
- No aplica para datos críticos en tiempo real

**Verificación:**
- [ ] Caché implementado en libs/
- [ ] Handlers críticos usando caché
- [ ] DynamoDB Streams habilitados
- [ ] Invalidación funcionando
- [ ] Métricas de hit rate en CloudWatch
- [ ] Latencia reducida en endpoints cacheados

**Tiempo estimado:** 3-4 días

---

## Fase 2: Optimización (Puntos 5-7)

**Objetivo:** Refactorizar arquitectura y mejorar escalabilidad
**Duración estimada:** 3-4 semanas
**Prioridad:** ⭐⭐ Media

---

### 🎯 Punto 5: Separar Lógica de Negocio de Handlers

**Estado:** Pendiente
**Documentación detallada:** A desarrollar en Fase 2

**Resumen:**
- Implementar arquitectura hexagonal/clean
- Separar dominio de infraestructura
- Mejorar testabilidad

---

### 🎯 Punto 6: Implementar Event-Driven Architecture con EventBridge

**Estado:** Pendiente
**Documentación detallada:** A desarrollar en Fase 2

**Resumen:**
- Desacoplar servicios con eventos
- Implementar event bus central
- Mejorar resiliencia con retry automático

---

### 🎯 Punto 7: Optimizar Cold Starts con Provisioned Concurrency

**Estado:** Pendiente
**Documentación detallada:** A desarrollar en Fase 2

**Resumen:**
- Identificar funciones críticas
- Configurar provisioned concurrency selectivo
- Balancear costo vs latencia

---

## Fase 3: Avanzado (Puntos 8-10)

**Objetivo:** Mejoras estratégicas de seguridad e infraestructura
**Duración estimada:** 4-6 semanas
**Prioridad:** ⭐ Baja (estratégico)

---

### 🎯 Punto 8: Implementar Secrets Rotation Automática

**Estado:** Pendiente
**Documentación detallada:** A desarrollar en Fase 3

**Resumen:**
- Rotación automática de secretos
- Compliance mejorado
- Reducción de riesgo de seguridad

---

### 🎯 Punto 9: Separar Ambientes con Multi-Account Strategy

**Estado:** Pendiente
**Documentación detallada:** A desarrollar en Fase 3

**Resumen:**
- Cuentas AWS separadas por ambiente
- Aislamiento total de datos
- Mejor control de costos

---

### 🎯 Punto 10: Implementar Infrastructure as Code Completo

**Estado:** Pendiente
**Documentación detallada:** A desarrollar en Fase 3

**Resumen:**
- Migrar recursos compartidos a CDK/Terraform
- VPC y networking como código
- Gestión centralizada de infraestructura

---

## Métricas de Éxito

### KPIs por Fase

**Fase 1:**
- ✅ 100% de handlers con middleware estandarizado
- ✅ Reducción de 8 API Gateways → 1
- ✅ 20-35% ahorro en costos de Lambda (Power Tuning)
- ✅ 50-80% reducción de latencia en endpoints cacheados
- ✅ 30-50% reducción en costos de DynamoDB

**Fase 2:**
- ✅ 80%+ cobertura de tests (lógica separada)
- ✅ <200ms latencia p95 en funciones críticas
- ✅ Event-driven en 50%+ de comunicaciones inter-servicio

**Fase 3:**
- ✅ Rotación automática de 100% de secretos
- ✅ 3 cuentas AWS (dev/staging/prod)
- ✅ 100% infraestructura como código

---

## Notas de Implementación

### Orden Recomendado
1. **Fase 1 completa** antes de Fase 2 (fundamentos)
2. Puntos 1-4 pueden desarrollarse en paralelo con 2 personas
3. Probar cada punto en dev antes de staging/prod

### Consideraciones de Costos
- **Fase 1:** ROI inmediato (ahorro > inversión)
- **Fase 2:** ROI a medio plazo (3-6 meses)
- **Fase 3:** ROI estratégico (6-12 meses)

### Rollback Strategy
Cada punto debe tener plan de rollback documentado antes de implementar.

---

## Próximos Pasos

1. ✅ **Revisar y aprobar este plan**
2. 🔄 **Implementar Fase 1 (Puntos 1-4)**
   - Iniciar con Punto 1 (middleware)
   - Continuar con Punto 2 (API Gateway)
   - Ejecutar Punto 3 (Power Tuning)
   - Finalizar con Punto 4 (caché)
3. ⏳ **Documentar resultados de Fase 1**
4. ⏳ **Planificar Fase 2**

---

**Última actualización:** Febrero 2025
**Mantenido por:** Equipo de Desarrollo Portal Admin
