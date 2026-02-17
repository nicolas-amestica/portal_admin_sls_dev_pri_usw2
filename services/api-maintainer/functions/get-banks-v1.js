import { success } from "../../../helpers/responses.js";
import { standardMiddleware } from "../../../libs/middleware/index.js";
import { CachedDynamoDB, CacheKeys, CacheMetrics } from "../../../libs/cache/index.js";

const { DYNAMODB_MAINTAINER_TABLE, DYNAMODB_PK_MAINTAINER_TABLE } = process.env;

/**
 * Obtiene la lista de bancos registrados desde DynamoDB con caché de 30 minutos.
 * 
 * @async
 * @function handler
 * @param {Object} event - Evento de invocación Lambda (no utilizado en esta función).
 * @param {Object} context - Contexto de ejecución de Lambda usado para logging de métricas.
 * @returns {Promise<Object>} Respuesta con código 200, lista de bancos sin atributos 'pk' y 'sk', y mensaje de acción.
 * 
 * @description
 * Esta función realiza una consulta a la tabla DynamoDB de mantenimiento para obtener
 * todos los bancos registrados. Utiliza un sistema de caché con TTL de 30 minutos para
 * optimizar el rendimiento y reducir costos de lectura. Los resultados se procesan para
 * eliminar los atributos de clave primaria y se registran estadísticas detalladas del caché.
 */
const handler = async (event, context) => {
  const action = "Obtener bancos registrados.";

  const params = {
    TableName: DYNAMODB_MAINTAINER_TABLE,
    ReturnConsumedCapacity: "TOTAL",
    KeyConditionExpression: "#pk = :pk",
    ExpressionAttributeValues: {
      ":pk": DYNAMODB_PK_MAINTAINER_TABLE,
    },
    ExpressionAttributeNames: {
      "#pk": "pk",
    },
  };

  // Usar caché para la consulta de bancos (TTL: 30 minutos)
  const cacheKey = CacheKeys.bankList();
  let banks = await CachedDynamoDB.query(
    params,
    cacheKey,
    CacheKeys.TTL.BANK_LIST
  );

  if (banks)
    banks = banks.map(({ pk, sk, ...rest }) => rest);

  // Log de estadísticas del caché
  CacheMetrics.logDetailedStats('get-banks-v1', context);

  return success(200, banks, action);
};

export const main = standardMiddleware(handler);
