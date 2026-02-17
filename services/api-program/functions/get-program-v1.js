import { success } from "../../../helpers/responses";
import { standardMiddleware } from "../../../libs/middleware/index.js";
import { CachedDynamoDB, CacheKeys, CacheMetrics } from "../../../libs/cache/index.js";

const { DYNAMODB_PROGRAM_TABLE, PROGRAM_TABLE } = process.env;

/**
 * Obtiene un programa del sistema utilizando caché de DynamoDB.
 * 
 * @async
 * @function handler
 * @param {Object} event - Evento Lambda que contiene los parámetros de la solicitud.
 * @param {Object} event.queryParams - Parámetros de consulta de la solicitud.
 * @param {string} event.queryParams.sk - Identificador de programa (requerido).
 * @param {Object} context - Contexto de ejecución de Lambda.
 * @returns {Promise<Object>} Respuesta con el programa encontrado o null si no existe.
 * @throws {Error} Lanza un error con statusCode 400 si el identificador de programa no está presente.
 * 
 * @description
 * La función realiza una consulta a la tabla DynamoDB de programas utilizando el identificador
 * proporcionado. Los resultados se cachean para mejorar el rendimiento en consultas repetidas.
 * También registra métricas detalladas del caché para monitoreo.
 */
const handler = async (event, context) => {
  const action = "Obtención de programa en sistema.";
  const { sk } = event.queryParams || {};

  if (!sk) {
    const error = new Error('Identificador de programa no encontrado en request.');
    error.statusCode = 400;
    throw error;
  }

  // Usar caché para la consulta
  const cacheKey = CacheKeys.program(sk);
  const results = await CachedDynamoDB.query(
    {
      TableName: DYNAMODB_PROGRAM_TABLE,
      KeyConditionExpression: '#pk = :pk AND begins_with(#sk, :sk)',
      ExpressionAttributeValues: {
        ':pk': PROGRAM_TABLE,
        ':sk': sk,
      },
      ExpressionAttributeNames: {
        '#pk': 'pk',
        '#sk': 'sk'
      }
    },
    cacheKey,
    CacheKeys.TTL.PROGRAM
  );

  const result = results && results.length > 0 ? results[0] : null;

  // Log de estadísticas del caché
  CacheMetrics.logDetailedStats('get-program-v1', context);

  return success(200, result, action);
};

export const main = standardMiddleware(handler);