import { success, unsuccessful } from "../../../helpers/responses";
import { standardMiddleware } from "../../../libs/middleware/index.js";
import { CachedDynamoDB, CacheKeys, CacheMetrics } from "../../../libs/cache/index.js";

const { DYNAMODB_PROGRAM_TABLE, PROGRAM_TABLE } = process.env;

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
