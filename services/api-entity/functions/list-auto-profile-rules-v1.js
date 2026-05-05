import * as dynamoDbLib from '../../../libs/dynamodb-v3.js';
import { success } from '../../../helpers/responses.js';
import { standardMiddleware } from '../../../libs/middleware/index.js';

const { DYNAMODB_USER_TABLE } = process.env;
const AUTO_PROFILE_RULES_PK = 'APP#AUTO_PROFILE_RULES';
const ACTION = 'Listar reglas de perfil automático.';

/**
 * @description Retorna todas las reglas de asignación automática de perfil.
 * GET /v1/iam/reglas-perfiles-auto
 */
const handler = async () => {
  const items = await dynamoDbLib.query({
    TableName: DYNAMODB_USER_TABLE,
    KeyConditionExpression: 'pk = :pk',
    ExpressionAttributeValues: { ':pk': AUTO_PROFILE_RULES_PK },
  });
  return success(200, items ?? [], ACTION);
};

export const main = standardMiddleware(handler);
