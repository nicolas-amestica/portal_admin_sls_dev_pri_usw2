import { success } from "../../../helpers/responses";
import { standardMiddleware } from "../../../libs/middleware/index.js";
import { CachedDynamoDB, CacheKeys, CacheMetrics } from "../../../libs/cache/index.js";

const {
  DYNAMODB_PROGRAM_TABLE,
  PROGRAM_TABLE_ID
} = process.env;

const adaptBalances = async (totalWithUtilities, payments) => {
  let total = totalWithUtilities;
  return payments.map(payment => {
    const balance = {
      ...payment,
      amount: parseInt(payment.amount),
      remaining: total - parseInt(payment.amount),
      totalWithUtilities: parseInt(total),
    };
    total -= parseInt(payment.amount);
    return balance;
  }) || [];
};

/**
 * Obtiene la lista de balances del programa especificado.
 * 
 * Esta función realiza una consulta a DynamoDB para obtener los balances asociados
 * a un programa, utilizando caché con TTL corto debido a que los balances cambian
 * con los pagos. Los datos se adaptan y formatean antes de ser retornados.
 * 
 * @async
 * @function handler
 * @param {Object} event - Evento de entrada que contiene los parámetros de consulta
 * @param {Object} event.queryParams - Parámetros de consulta de la solicitud
 * @param {string} event.queryParams.sk - Identificador del programa (requerido)
 * @param {Object} context - Contexto de ejecución de Lambda
 * @param {string} context.requestId - ID de la solicitud
 * 
 * @returns {Promise<Object>} Objeto de respuesta con los balances formateados
 * @returns {number} statusCode - Código de estado HTTP
 * @returns {Array<Object>} body - Arreglo de pagos adaptados con información de utilidades
 * 
 * @throws {Error} Si no se proporciona el identificador del programa (sk)
 *                 Error con statusCode 400
 */
const handler = async (event, context) => {
  console.log("event ==>", event);
  const action = "Obtención de lista de balances del programa.";
  const queryParams = event.queryParams;
  const { sk } = queryParams;

  if (!sk) {
    const error = new Error('Identificador de programa inválido.');
    error.statusCode = 400;
    throw error;
  }

  // Usar caché con TTL corto (balances cambian con pagos)
  const cacheKey = CacheKeys.balanceProgram(sk);
  const params = {
    TableName: DYNAMODB_PROGRAM_TABLE,
    ReturnConsumedCapacity: 'TOTAL',
    KeyConditionExpression: '#pk = :pk AND begins_with(#sk, :sk)',
    ExpressionAttributeValues: {
      ':pk': PROGRAM_TABLE_ID,
      ':sk': sk,
    },
    ExpressionAttributeNames: {
      '#pk': 'pk',
      '#sk': 'sk'
    }
  };

  const results = await CachedDynamoDB.query(
    params,
    cacheKey,
    CacheKeys.TTL.BALANCE
  );

  const result = results && results.length > 0 ? results[0] : null;
  const payments = result?.content[0]?.payments || [];
  const totalWithUtilities = result.content[0].totalWithUtilities;
  const formattedPayments = await adaptBalances(totalWithUtilities, payments || []);

  // Log de estadísticas del caché
  CacheMetrics.logDetailedStats('get-balances-v1', context);

  return success(200, formattedPayments, action, queryParams);
};

export const main = standardMiddleware(handler);
