import { standardMiddleware } from "../../../libs/middleware/index.js";
import { success } from "../../../helpers/responses.js";
import { CachedDynamoDB, CacheKeys, CacheMetrics } from "../../../libs/cache/index.js";

const { DYNAMODB_MAINTAINER_TABLE } = process.env;

const handler = async (event, context) => {
  const action = "Obtener bancos registrados.";
  const pk = "BNK#ACCOUNT";

  const params = {
    TableName: DYNAMODB_MAINTAINER_TABLE,
    ReturnConsumedCapacity: "TOTAL",
    KeyConditionExpression: "#pk = :pk",
    ExpressionAttributeValues: {
      ":pk": pk,
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

  if (banks) {
    banks = banks.map(({ pk, sk, ...rest }) => rest);
  }

  // Log de estadísticas del caché
  CacheMetrics.logDetailedStats('get-banks-v1', context);

  return success(200, banks, action);
};

export const main = standardMiddleware(handler);
