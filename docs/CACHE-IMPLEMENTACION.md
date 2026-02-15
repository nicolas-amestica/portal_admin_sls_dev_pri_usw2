# Implementación de Caché en Memoria - Estado Actual

## ✅ Completado

### 1. Biblioteca de Caché Creada

Se ha creado una biblioteca completa de caché en memoria en `libs/cache/`:

#### Archivos Creados

| Archivo | Descripción | Estado |
|---------|-------------|--------|
| `in-memory-cache.js` | Clase principal con Map + TTL | ✅ |
| `cache-keys.js` | Generación estandarizada de keys | ✅ |
| `cached-dynamodb.js` | Wrapper para operaciones DynamoDB | ✅ |
| `metrics.js` | Logging y estadísticas del caché | ✅ |
| `index.js` | Exporta todos los módulos | ✅ |

#### Características Implementadas

**InMemoryCache:**
- ✅ Almacenamiento basado en `Map` (nativo de JavaScript)
- ✅ TTL (Time To Live) configurable por item
- ✅ Expiración automática al consultar
- ✅ Invalidación por key individual
- ✅ Invalidación por patrón regex
- ✅ Estadísticas de hits/misses
- ✅ Cálculo automático de hit rate
- ✅ Persistencia entre invocaciones warm de Lambda

**CachedDynamoDB:**
- ✅ Wrapper transparente para `get`, `query`, `scan`
- ✅ Manejo automático de caché (HIT/MISS)
- ✅ Invalidación automática en `put` y `delete`
- ✅ Logging de operaciones de caché
- ✅ Compatible con API existente de DynamoDB

**CacheKeys:**
- ✅ Funciones helper para generar keys consistentes
- ✅ TTLs recomendados por tipo de dato:
  - Programs: 10 minutos
  - Program Lists: 5 minutos
  - Users: 5 minutos
  - Config: 15 minutos
  - Banks: 30 minutos

**CacheMetrics:**
- ✅ Logging de estadísticas en cada request
- ✅ Análisis de efectividad del caché
- ✅ Métricas detalladas con correlation ID
- ✅ Preparado para integración con CloudWatch (futuro)

### 2. Handlers Migrados

Se han migrado 3 handlers críticos para usar caché:

#### api-program

**1. get-program-v1.js** - Obtener programa por ID
- **Antes:** Consulta directa a DynamoDB (60-100ms)
- **Después:** Cache HIT = 5-10ms, Cache MISS = 60-100ms
- **Cache Key:** `program:{sk}`
- **TTL:** 10 minutos
- **Reducción esperada:** 85-90% en latencia (después de warm-up)

```javascript
// Código implementado:
const cacheKey = CacheKeys.program(sk);
const results = await CachedDynamoDB.query(
  {...params},
  cacheKey,
  CacheKeys.TTL.PROGRAM
);
```

**2. get-programs-view-v1.js** - Listar programas por periodo
- **Antes:** Query a GSI de DynamoDB (80-150ms)
- **Después:** Cache HIT = 5-15ms, Cache MISS = 80-150ms
- **Cache Key:** `program:list:{periodo}`
- **TTL:** 5 minutos
- **Reducción esperada:** 80-90% en latencia

```javascript
// Código implementado:
const cacheKey = CacheKeys.programList(periodo);
const result = await CachedDynamoDB.query(
  {...params},
  cacheKey,
  CacheKeys.TTL.PROGRAM_LIST
);
```

#### api-maintainer

**3. get-banks-v1.js** - Listar bancos
- **Antes:** Query a DynamoDB (50-80ms)
- **Después:** Cache HIT = 3-8ms, Cache MISS = 50-80ms
- **Cache Key:** `bank:list`
- **TTL:** 30 minutos (bancos cambian muy raramente)
- **Reducción esperada:** 90-95% en latencia

```javascript
// Código implementado:
const cacheKey = CacheKeys.bankList();
let banks = await CachedDynamoDB.query(
  {...params},
  cacheKey,
  CacheKeys.TTL.BANK_LIST
);
```

### 3. Logging de Métricas

Todos los handlers migrados incluyen logging detallado:

```javascript
CacheMetrics.logDetailedStats('get-program-v1', context);
```

**Output esperado en CloudWatch:**
```json
{
  "message": "CACHE_HIT",
  "key": "program:PROG#2024-001"
}

{
  "message": "CACHE_DETAILED_STATS",
  "functionName": "get-program-v1",
  "requestId": "abc-123-def",
  "correlationId": "cid-xyz",
  "hits": 15,
  "misses": 3,
  "total": 18,
  "hitRate": "83.33%",
  "cacheSize": 5
}
```

## 📊 Impacto Esperado

### Latencia

| Handler | Antes | Cache HIT | Reducción |
|---------|-------|-----------|-----------|
| get-program-v1 | 60-100ms | 5-10ms | 85-90% |
| get-programs-view-v1 | 80-150ms | 5-15ms | 80-90% |
| get-banks-v1 | 50-80ms | 3-8ms | 90-95% |

### Costos

**Reducción en RCU (Read Capacity Units) de DynamoDB:**
- Cada cache HIT = 0 RCU consumidos
- Hit rate objetivo: >60%
- Ahorro estimado en RCU: 60-80%

**Ejemplo con get-banks-v1:**
- Invocaciones/día: 200
- Hit rate: 70%
- Cache HITs: 140 (70%) → 0 RCU
- Cache MISSes: 60 (30%) → RCU normal
- **Ahorro: 70% en RCU para este endpoint**

### Escalabilidad

- **Cold starts:** Caché vacío, rendimiento normal
- **Warm Lambda:** Caché poblado, rendimiento óptimo
- **Múltiples instancias:** Cada instancia tiene su caché (no compartido)
- **Consistencia:** Eventual (TTL configurable)

## 🧪 Testing Local

### Prerequisitos

1. Tener serverless-offline instalado
2. Base de datos con datos de prueba
3. Variables de entorno configuradas

### Ejecutar Tests

```bash
# Terminal 1: Iniciar serverless-offline
cd services/api-program
serverless offline --stage dev

# Terminal 2: Ejecutar tests de caché
cd ../..
./scripts/test-cache-local.sh
```

### Testing Manual

```bash
# Test 1: Primera request (CACHE_MISS)
curl http://localhost:3200/dev/v1/programas?sk=PROG#2024-001

# Verificar en logs:
# CACHE_MISS: { key: 'program:PROG#2024-001' }
# CACHE_SET: { key: 'program:PROG#2024-001', ttl: '600000ms' }

# Test 2: Segunda request (CACHE_HIT)
curl http://localhost:3200/dev/v1/programas?sk=PROG#2024-001

# Verificar en logs:
# CACHE_HIT: { key: 'program:PROG#2024-001' }
# CACHE_DETAILED_STATS: { hits: 1, misses: 1, hitRate: '50%' }

# Test 3: Listar programas
curl http://localhost:3200/dev/v1/programas/listar?periodo=2024

# Test 4: Verificar hit rate
# Ejecutar múltiples requests y ver hitRate incrementar
```

### Testing de TTL

Para testing rápido del TTL, modificar temporalmente en `libs/cache/cache-keys.js`:

```javascript
TTL: {
  PROGRAM: 10 * 1000,      // 10 segundos (en vez de 10 minutos)
  PROGRAM_LIST: 5 * 1000,  // 5 segundos
  // ...
}
```

Luego:
1. Hacer request (CACHE_MISS)
2. Hacer request inmediata (CACHE_HIT)
3. Esperar 10 segundos
4. Hacer request (CACHE_MISS - caché expirado)

## 🚀 Deploy

### Deploy a DEV

```bash
# Desplegar api-program (incluye handlers con caché)
cd services/api-program
serverless deploy --stage dev --verbose

# Desplegar api-maintainer
cd ../api-maintainer
serverless deploy --stage dev --verbose
```

### Verificar en CloudWatch

```bash
# Ver logs de get-program-v1
aws logs tail /aws/lambda/programas-dev-get_program_v1 \
  --follow \
  --profile pa-dev \
  --region us-west-2

# Buscar en logs:
# - CACHE_HIT
# - CACHE_MISS
# - CACHE_STATS
```

**Filtrar por caché en CloudWatch Logs Insights:**

```sql
fields @timestamp, @message
| filter @message like /CACHE_/
| sort @timestamp desc
| limit 100
```

**Calcular hit rate:**

```sql
fields @timestamp
| filter @message like /CACHE_HIT/ or @message like /CACHE_MISS/
| stats count(*) as total,
        sum(case when @message like /CACHE_HIT/ then 1 else 0 end) as hits,
        sum(case when @message like /CACHE_MISS/ then 1 else 0 end) as misses
| extend hitRate = (hits / total) * 100
```

## 📈 Métricas de Éxito

### Checklist de Verificación

**Testing Local:**
- [ ] `npm install` exitoso (sin errores de dependencias)
- [ ] serverless-offline inicia correctamente
- [ ] Primera request muestra `CACHE_MISS`
- [ ] Segunda request muestra `CACHE_HIT`
- [ ] Latencia reducida en cache hits (70-85%)
- [ ] `CACHE_STATS` muestra hit rate >0%

**Deploy DEV:**
- [ ] Deploy exitoso sin errores
- [ ] Endpoints responden correctamente
- [ ] Logs muestran `CACHE_HIT/MISS` en CloudWatch
- [ ] Hit rate >60% después de 1 hora de tráfico
- [ ] No hay errores en logs relacionados con caché

**Performance:**
- [ ] Latencia p50 reducida 70-85%
- [ ] Latencia p99 reducida 50-70%
- [ ] RCU consumidos reducidos 60-80%
- [ ] Sin cold start penalty (caché se inicializa rápido)

## 🔧 Troubleshooting

### Problema: Hit rate muy bajo (<30%)

**Causas posibles:**
1. **TTL muy corto:** Datos expiran antes de reutilizarse
   - Solución: Aumentar TTL en `cache-keys.js`

2. **Cold starts frecuentes:** Lambda se reinicia seguido
   - Solución: Considerar provisioned concurrency (Punto 7 del plan)

3. **Patrones de acceso diferentes:** Cada request pide datos distintos
   - Solución: Normal para endpoints muy dinámicos, no usar caché

### Problema: Caché no se invalida al actualizar datos

**Solución:** Agregar invalidación explícita en handlers de escritura:

```javascript
// En confirm-program-v1.js (después de actualizar programa)
import { CachedDynamoDB, CacheKeys } from '../../../libs/cache/index.js';

const program = await dynamoDbLib.put({...});

// Invalidar caché del programa actualizado
CachedDynamoDB.invalidatePattern(`program:${sk}`);

// O invalidar key específica
const cacheKey = CacheKeys.program(sk);
cache.invalidate(cacheKey);
```

### Problema: Out of memory errors

**Causas:**
- Caché almacenando demasiados items grandes
- Memory leak (caché nunca se limpia)

**Solución:**
1. Monitorear tamaño del caché en logs (`cacheSize`)
2. Si `cacheSize` > 1000, implementar LRU (Least Recently Used) eviction
3. Aumentar memoria de Lambda si es necesario

### Problema: Datos inconsistentes

**Causa:** TTL muy largo, datos cambian frecuentemente

**Solución:**
1. Reducir TTL para datos que cambian seguido
2. Invalidar caché explícitamente en operaciones de escritura
3. Considerar no usar caché para datos críticos en tiempo real

## 📝 Próximos Pasos

### Corto Plazo (1 semana)

1. **Testing en DEV:**
   - [ ] Ejecutar tests locales
   - [ ] Deploy a DEV
   - [ ] Monitorear 24-48 horas
   - [ ] Verificar hit rate >60%

2. **Documentar resultados:**
   - [ ] Capturar métricas before/after
   - [ ] Documentar ahorros en costos
   - [ ] Identificar oportunidades de mejora

### Mediano Plazo (2-4 semanas)

1. **Extender caché a más handlers:**
   - api-entity (usuarios)
   - api-configuration (config global)
   - Otros endpoints de lectura frecuente

2. **Optimizaciones:**
   - Implementar LRU eviction si es necesario
   - Ajustar TTLs basado en datos reales
   - Agregar invalidación en handlers de escritura

3. **Monitoreo avanzado:**
   - CloudWatch Dashboards con métricas de caché
   - Alarmas para hit rate bajo
   - Integración con CloudWatch Metrics (opcional)

### Largo Plazo (1-3 meses)

1. **Caché distribuido (opcional):**
   - Evaluar ElastiCache/Redis si se necesita caché compartido
   - Comparar costos vs beneficios

2. **Continuar con Punto 5 del plan:**
   - Separar lógica de negocio de handlers
   - Preparar para event-driven architecture

## 🎯 Resumen de ROI

**Inversión:**
- Tiempo de desarrollo: 1 día (biblioteca + migración)
- Costo adicional: $0 (caché en memoria, no requiere recursos)

**Retorno:**
- Reducción de latencia: 70-85%
- Reducción de RCU DynamoDB: 60-80%
- Mejor experiencia de usuario: ✅
- Ahorro estimado: $20-40/mes en costos DynamoDB

**ROI:** ♾️ (inversión mínima, retorno alto)

---

**Estado:** ✅ Completado - Listo para testing
**Fecha:** 2024-02-14
**Siguiente acción:** Testing local y deploy a DEV
