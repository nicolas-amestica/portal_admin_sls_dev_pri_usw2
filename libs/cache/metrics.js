import { cache } from './in-memory-cache.js';

/**
 * Métricas del caché para observabilidad
 *
 * Proporciona funciones para:
 * - Obtención de estadísticas del caché
 * - Integración futura con CloudWatch Metrics
 * - Análisis de hit rate y rendimiento
 */
export class CacheMetrics {
  /**
   * Retorna estadísticas del caché
   *
   * @returns {object} Estadísticas actuales del caché
   */
  static logStats() {
    const stats = cache.getStats();
    return stats;
  }

  /**
   * Retorna estadísticas detalladas con información adicional
   *
   * @param {string} functionName - Nombre de la función Lambda
   * @param {object} context - Context de Lambda (opcional)
   * @returns {object} Estadísticas detalladas
   */
  static logDetailedStats(functionName, context = {}) {
    const stats = cache.getStats();
    return {
      functionName,
      requestId: context.requestId,
      correlationId: context.correlationId,
      ...stats,
    };
  }

  /**
   * Reset de estadísticas
   *
   * Útil para testing o para reiniciar contadores
   */
  static resetStats() {
    cache.stats = { hits: 0, misses: 0 };
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

    return stats;
  }
}
