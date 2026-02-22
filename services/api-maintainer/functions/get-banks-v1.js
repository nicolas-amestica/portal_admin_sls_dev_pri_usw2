import { success } from "../../../helpers/responses.js";
import { standardMiddleware } from "../../../libs/middleware/index.js";
import { CachedDynamoDB, CacheKeys } from '../../../libs/cache/index.js';

const { DYNAMODB_MAINTAINER_TABLE, DYNAMODB_PK_MAINTAINER_TABLE } = process.env;

const handler = async (event) => {
  const action = "Obtener bancos registrados.";

  let banks = await CachedDynamoDB.query(
    {
      TableName: DYNAMODB_MAINTAINER_TABLE,
      ReturnConsumedCapacity: "TOTAL",
      KeyConditionExpression: "#pk = :pk",
      ExpressionAttributeValues: {
        ":pk": DYNAMODB_PK_MAINTAINER_TABLE,
      },
      ExpressionAttributeNames: {
        "#pk": "pk",
      },
    },
    CacheKeys.bankList(),
    CacheKeys.TTL.BANK_LIST
  );

  if (banks)
    banks = banks.map(({ pk, sk, ...rest }) => rest);

  return success(200, banks, action);
};

export const main = standardMiddleware(handler);
