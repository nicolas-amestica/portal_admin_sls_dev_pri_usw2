import * as dynamodb from '../dynamodb-v3.js';
import { cache } from './in-memory-cache.js';

/**
 * Wrapper de operaciones DynamoDB con caché automático
 *
 * Proporciona métodos que automáticamente manejan el caché:
 * - Cache HIT: retorna datos del caché (5-10ms)
 * - Cache MISS: consulta DynamoDB y guarda en caché (60-100ms)
 */
export class CachedDynamoDB {
  /**
   * Get con caché automático
   *
   * @param {object} params - Parámetros de DynamoDB.get
   * @param {string} cacheKey - Clave para el caché
   * @param {number} ttl - Time to live en milisegundos
   * @returns {object|null} Item de DynamoDB o null si no existe
   */
  static async get(params, cacheKey, ttl) {
    // 1. Intentar obtener del caché
    const cached = cache.get(cacheKey);
    if (cached !== null) {
      console.log('CACHE_HIT', { key: cacheKey });
      return cached;
    }

    // 2. Cache MISS - consultar DynamoDB
    console.log('CACHE_MISS', { key: cacheKey });
    const result = await dynamodb.get(params);

    // 3. Guardar en caché si hay resultado
    if (result.Item) {
      cache.set(cacheKey, result.Item, ttl);
      console.log('CACHE_SET', { key: cacheKey, ttl: `${ttl}ms` });
    }

    return result.Item || null;
  }

  /**
   * Query con caché (para listas)
   *
   * @param {object} params - Parámetros de DynamoDB.query
   * @param {string} cacheKey - Clave para el caché
   * @param {number} ttl - Time to live en milisegundos
   * @returns {Array} Lista de items
   */
  static async query(params, cacheKey, ttl) {
    // 1. Intentar obtener del caché
    const cached = cache.get(cacheKey);
    if (cached !== null) {
      console.log('CACHE_HIT', { key: cacheKey, count: cached.length });
      return cached;
    }

    // 2. Cache MISS - consultar DynamoDB
    console.log('CACHE_MISS', { key: cacheKey });
    const result = await dynamodb.query(params);

    // 3. Guardar en caché si hay resultados
    // dynamodb.query() retorna directamente el array de items o null
    const items = result || [];
    if (items.length > 0) {
      cache.set(cacheKey, items, ttl);
      console.log('CACHE_SET', { key: cacheKey, count: items.length, ttl: `${ttl}ms` });
    }

    return items;
  }

  /**
   * Scan con caché (usar con precaución - tablas pequeñas)
   *
   * @param {object} params - Parámetros de DynamoDB.scan
   * @param {string} cacheKey - Clave para el caché
   * @param {number} ttl - Time to live en milisegundos
   * @returns {Array} Lista de items
   */
  static async scan(params, cacheKey, ttl) {
    // 1. Intentar obtener del caché
    const cached = cache.get(cacheKey);
    if (cached !== null) {
      console.log('CACHE_HIT', { key: cacheKey, count: cached.length });
      return cached;
    }

    // 2. Cache MISS - consultar DynamoDB
    console.log('CACHE_MISS', { key: cacheKey });
    const result = await dynamodb.scan(params);

    // 3. Guardar en caché
    const items = result.Items || [];
    cache.set(cacheKey, items, ttl);
    console.log('CACHE_SET', { key: cacheKey, count: items.length, ttl: `${ttl}ms` });

    return items;
  }

  /**
   * Put/Update - invalida el caché automáticamente
   *
   * @param {object} params - Parámetros de DynamoDB.put
   * @param {string|Array<string>} invalidateKeys - Key(s) a invalidar
   * @returns {object} Resultado de DynamoDB.put
   */
  static async put(params, invalidateKeys) {
    const result = await dynamodb.put(params);

    // Invalidar caché
    if (invalidateKeys) {
      const keys = Array.isArray(invalidateKeys) ? invalidateKeys : [invalidateKeys];
      keys.forEach(key => {
        cache.invalidate(key);
        console.log('CACHE_INVALIDATE', { key });
      });
    }

    return result;
  }

  /**
   * Delete - invalida el caché automáticamente
   *
   * @param {object} params - Parámetros de DynamoDB.delete
   * @param {string|Array<string>} invalidateKeys - Key(s) a invalidar
   * @returns {object} Resultado de DynamoDB.delete
   */
  static async delete(params, invalidateKeys) {
    const result = await dynamodb.delete(params);

    // Invalidar caché
    if (invalidateKeys) {
      const keys = Array.isArray(invalidateKeys) ? invalidateKeys : [invalidateKeys];
      keys.forEach(key => {
        cache.invalidate(key);
        console.log('CACHE_INVALIDATE', { key });
      });
    }

    return result;
  }

  /**
   * Invalidar patrón (ej: todos los programas)
   *
   * @param {string} pattern - Patrón regex para invalidar
   */
  static invalidatePattern(pattern) {
    cache.invalidatePattern(pattern);
    console.log('CACHE_INVALIDATE_PATTERN', { pattern });
  }
}
