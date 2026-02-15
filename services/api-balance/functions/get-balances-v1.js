import { success, unsuccessful } from "../../../helpers/responses";
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
