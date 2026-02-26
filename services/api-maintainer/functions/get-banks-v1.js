import { success } from "../../../helpers/responses.js";
import { standardMiddleware } from "../../../libs/middleware/index.js";
import { CachedDynamoDB, CacheKeys } from '../../../libs/cache/index.js';

const { DYNAMODB_MAINTAINER_TABLE, DYNAMODB_PK_MAINTAINER_TABLE } = process.env;

const QUERY_PARAMS = {
  TableName: DYNAMODB_MAINTAINER_TABLE,
  ReturnConsumedCapacity: "TOTAL",
  KeyConditionExpression: "#pk = :pk",
  ExpressionAttributeValues: { ":pk": DYNAMODB_PK_MAINTAINER_TABLE },
  ExpressionAttributeNames: { "#pk": "pk" },
};

/**
 * Obtiene la lista de bancos registrados desde la caché de DynamoDB.
 */
const handler = async () => {
  const action = "Obtener bancos registrados.";
  const raw = await CachedDynamoDB.query(QUERY_PARAMS, CacheKeys.bankList(), CacheKeys.TTL.BANK_LIST);
  const banks = raw?.map(({ pk, sk, ...rest }) => rest) ?? [];
  return success(200, banks, action);
};

export const main = standardMiddleware(handler);