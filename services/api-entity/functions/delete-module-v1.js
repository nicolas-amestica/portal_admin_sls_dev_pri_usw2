import * as dynamoDbLib from '../../../libs/dynamodb-v3.js';
import { success } from '../../../helpers/responses.js';
import { standardMiddleware } from '../../../libs/middleware/index.js';
import { APP_PK } from './access-profile.js';
import { getPortalJwtBodyFromEvent } from '../../../libs/fn-get-portal-jwt-body-from-event.js';
import { assertPortalAdministrador } from '../../../libs/assert-portal-administrador.js';

const { DYNAMODB_USER_TABLE } = process.env;
const ACTION = 'Eliminar módulo.';

/**
 * @description Elimina un módulo. Si es LV1, elimina también todos sus LV2 en cascada.
 */
const handler = async (event) => {
  const jwtBody = await getPortalJwtBodyFromEvent(event);
  assertPortalAdministrador(jwtBody.profiles);

  const { sk } = event.queryParams || {};

  if (!sk) {
    const error = new Error('sk del módulo es requerido');
    error.statusCode = 400;
    throw error;
  }

  const isLv1 = sk.includes('#LV1#') && !sk.includes('#LV2#');
  const ops = [dynamoDbLib.remove({ TableName: DYNAMODB_USER_TABLE, Key: { pk: APP_PK, sk } })];

  if (isLv1) {
    const lv2Items = await dynamoDbLib.query({
      TableName: DYNAMODB_USER_TABLE,
      KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
      ExpressionAttributeValues: { ':pk': APP_PK, ':prefix': `${sk}#LV2#` },
    });
    for (const item of (lv2Items ?? [])) {
      ops.push(dynamoDbLib.remove({ TableName: DYNAMODB_USER_TABLE, Key: { pk: APP_PK, sk: item.sk } }));
    }
  }

  await Promise.all(ops);
  return success(200, { sk, deleted: true }, ACTION);
};

export const main = standardMiddleware(handler);
