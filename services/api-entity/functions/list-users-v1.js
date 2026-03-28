import * as dynamoDbLib from '../../../libs/dynamodb-v3.js';
import { success } from '../../../helpers/responses.js';
import { standardMiddleware } from '../../../libs/middleware/index.js';

const { DYNAMODB_USER_TABLE } = process.env;
const APP_USERS_PK = 'APP#USERS';
const ACTION = 'Listar usuarios.';

/**
 * @description Retorna todos los usuarios del sistema consultando el índice APP#USERS (sin scan).
 */
const handler = async () => {
  const items = await dynamoDbLib.query({
    TableName: DYNAMODB_USER_TABLE,
    KeyConditionExpression: 'pk = :pk',
    ExpressionAttributeValues: { ':pk': APP_USERS_PK },
  });
  return success(200, items ?? [], ACTION);
};

export const main = standardMiddleware(handler);
