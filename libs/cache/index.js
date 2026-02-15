/**
 * Biblioteca de Caché en Memoria
 *
 * Proporciona caché en memoria con TTL para reducir latencia
 * y costos de consultas a DynamoDB.
 *
 * Características:
 * - Caché singleton que persiste entre invocaciones warm
 * - TTL configurable por tipo de dato
 * - Invalidación automática en operaciones de escritura
 * - Métricas de hit/miss rate
 * - Wrapper automático para operaciones DynamoDB
 *
 * Uso básico:
 * ```javascript
 * import { CachedDynamoDB, CacheKeys, CacheMetrics } from './libs/cache/index.js';
 *
 * const program = await CachedDynamoDB.get(
 *   { TableName: 'programs', Key: { pk: 'PROGRAM#123' } },
 *   CacheKeys.program('123'),
 *   CacheKeys.TTL.PROGRAM
 * );
 *
 * CacheMetrics.logStats();
 * ```
 */

export { cache } from './in-memory-cache.js';
export { CacheKeys } from './cache-keys.js';
export { CachedDynamoDB } from './cached-dynamodb.js';
export { CacheMetrics } from './metrics.js';
