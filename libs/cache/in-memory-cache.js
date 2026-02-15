/**
 * Caché en memoria simple con TTL
 * Se mantiene entre invocaciones de Lambda warm
 */
class InMemoryCache {
  constructor() {
    this.cache = new Map();
    this.stats = {
      hits: 0,
      misses: 0
    };
  }

  /**
   * Obtiene valor del caché
   * @param {string} key - Clave del caché
   * @returns {*} Valor o null si no existe/expiró
   */
  get(key) {
    const item = this.cache.get(key);

    if (!item) {
      this.stats.misses++;
      return null;
    }

    // Verificar expiración
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    return item.value;
  }

  /**
   * Guarda valor en caché
   * @param {string} key - Clave
   * @param {*} value - Valor a guardar
   * @param {number} ttl - Time to live en milisegundos (default: 5 min)
   */
  set(key, value, ttl = 5 * 60 * 1000) {
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttl,
      createdAt: Date.now()
    });
  }

  /**
   * Invalida una key específica
   */
  invalidate(key) {
    this.cache.delete(key);
  }

  /**
   * Invalida todas las keys que coincidan con patrón
   */
  invalidatePattern(pattern) {
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Limpia todo el caché
   */
  clear() {
    this.cache.clear();
    this.stats = { hits: 0, misses: 0 };
  }

  /**
   * Obtiene estadísticas del caché
   */
  getStats() {
    const total = this.stats.hits + this.stats.misses;
    return {
      ...this.stats,
      total,
      hitRate: total > 0 ? (this.stats.hits / total * 100).toFixed(2) + '%' : '0%',
      size: this.cache.size
    };
  }
}

// Singleton - se mantiene entre invocaciones warm
export const cache = new InMemoryCache();
