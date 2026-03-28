import * as dynamoDbLib from '../../../libs/dynamodb-v3.js';
import { success } from '../../../helpers/responses.js';
import { standardMiddleware } from '../../../libs/middleware/index.js';

const { DYNAMODB_USER_TABLE } = process.env;
export const APP_PROFILES_PK = 'APP#PROFILES';
const ACTION = 'Listar perfiles.';

/**
 * @description Retorna todos los perfiles IAM definidos en el sistema.
 */
const handler = async () => {
  const items = await dynamoDbLib.query({
    TableName: DYNAMODB_USER_TABLE,
    KeyConditionExpression: 'pk = :pk',
    ExpressionAttributeValues: { ':pk': APP_PROFILES_PK },
  });
  return success(200, items ?? [], ACTION);
};

export const main = standardMiddleware(handler);
