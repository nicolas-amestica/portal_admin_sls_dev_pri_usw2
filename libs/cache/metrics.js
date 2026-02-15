import { cache } from './in-memory-cache.js';

/**
 * Métricas del caché para observabilidad
 *
 * Proporciona funciones para:
 * - Logging de estadísticas del caché
 * - Integración futura con CloudWatch Metrics
 * - Análisis de hit rate y rendimiento
 */
export class CacheMetrics {
  /**
   * Log de estadísticas del caché
   *
   * Llamar al final de cada invocación Lambda para registrar métricas
   */
  static logStats() {
    const stats = cache.getStats();

    console.log('CACHE_STATS', {
      hits: stats.hits,
      misses: stats.misses,
      total: stats.total,
      hitRate: stats.hitRate,
      cacheSize: stats.size,
      timestamp: new Date().toISOString()
    });

    return stats;
  }

  /**
   * Log detallado con información adicional
   *
   * @param {string} functionName - Nombre de la función Lambda
   * @param {object} context - Context de Lambda (opcional)
   */
  static logDetailedStats(functionName, context = {}) {
    const stats = cache.getStats();

    console.log('CACHE_DETAILED_STATS', {
      functionName,
      requestId: context.requestId,
      correlationId: context.correlationId,
      ...stats,
      timestamp: new Date().toISOString()
    });

    return stats;
  }

  /**
   * Reset de estadísticas
   *
   * Útil para testing o para reiniciar contadores
   */
  static resetStats() {
    cache.stats = { hits: 0, misses: 0 };
    console.log('CACHE_STATS_RESET', {
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Calcula efectividad del caché
   *
   * @returns {object} Métricas de efectividad
   */
  static getEffectiveness() {
    const stats = cache.getStats();
    const total = stats.hits + stats.misses;

    if (total === 0) {
      return {
        effectiveness: 'N/A',
        recommendation: 'No hay suficientes datos'
      };
    }

    const hitRate = (stats.hits / total) * 100;

    let effectiveness;
    let recommendation;

    if (hitRate >= 80) {
      effectiveness = 'Excelente';
      recommendation = 'Caché funcionando óptimamente';
    } else if (hitRate >= 60) {
      effectiveness = 'Bueno';
      recommendation = 'Considerar aumentar TTL para datos estables';
    } else if (hitRate >= 40) {
      effectiveness = 'Regular';
      recommendation = 'Revisar patrones de acceso y TTL';
    } else {
      effectiveness = 'Bajo';
      recommendation = 'Datos cambian muy frecuentemente o TTL muy corto';
    }

    return {
      hitRate: hitRate.toFixed(2) + '%',
      effectiveness,
      recommendation,
      stats
    };
  }

  /**
   * Integración futura con CloudWatch Metrics
   *
   * @param {object} cloudwatch - Cliente de CloudWatch (AWS SDK v3)
   * @param {string} namespace - Namespace para las métricas
   */
  static async publishToCloudWatch(cloudwatch, namespace = 'PortalAdmin/Cache') {
    const stats = cache.getStats();

    // TODO: Implementar cuando se requiera integración con CloudWatch
    // const params = {
    //   Namespace: namespace,
    //   MetricData: [
    //     {
    //       MetricName: 'CacheHits',
    //       Value: stats.hits,
    //       Unit: 'Count',
    //       Timestamp: new Date()
    //     },
    //     {
    //       MetricName: 'CacheMisses',
    //       Value: stats.misses,
    //       Unit: 'Count',
    //       Timestamp: new Date()
    //     },
    //     {
    //       MetricName: 'CacheSize',
    //       Value: stats.size,
    //       Unit: 'Count',
    //       Timestamp: new Date()
    //     }
    //   ]
    // };
    //
    // await cloudwatch.putMetricData(params);

    console.log('CACHE_CLOUDWATCH_PUBLISH', {
      message: 'CloudWatch integration not yet implemented',
      stats
    });

    return stats;
  }
}
