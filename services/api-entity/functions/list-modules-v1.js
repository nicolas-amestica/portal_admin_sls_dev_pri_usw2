import * as dynamoDbLib from '../../../libs/dynamodb-v3.js';
import { success } from '../../../helpers/responses.js';
import { standardMiddleware } from '../../../libs/middleware/index.js';
import { APP_PK } from './access-profile.js';

const { DYNAMODB_USER_TABLE } = process.env;
const ACTION = 'Listar módulos.';

/**
 * @description Retorna todos los módulos (LV1 y LV2) de la aplicación.
 * Reutiliza APP_PK exportado de access-profile.js.
 */
const handler = async () => {
  const items = await dynamoDbLib.query({
    TableName: DYNAMODB_USER_TABLE,
    KeyConditionExpression: 'pk = :pk',
    ExpressionAttributeValues: { ':pk': APP_PK },
  });
  return success(200, items ?? [], ACTION);
};

export const main = standardMiddleware(handler);
