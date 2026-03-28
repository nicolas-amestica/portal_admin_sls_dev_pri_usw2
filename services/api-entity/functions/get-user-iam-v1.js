import * as dynamoDbLib from '../../../libs/dynamodb-v3.js';
import { success } from '../../../helpers/responses.js';
import { standardMiddleware } from '../../../libs/middleware/index.js';
import { APP_PK } from './access-profile.js';

const { DYNAMODB_USER_TABLE } = process.env;
const APP_PROFILE_USER_PK = 'APP#PROFILE#USER';
const APP_PERMISSIONS_PK = 'APP#PERMISSIONS';
const ACTION = 'Obtener IAM de usuario.';

/**
 * @description Retorna los perfiles asignados y permisos directos de un usuario.
 */
const handler = async (event) => {
  const { email } = event.queryStringParameters || {};

  if (!email) {
    const error = new Error('email es requerido');
    error.statusCode = 400;
    throw error;
  }

  const [profiles, directPermissions] = await Promise.all([
    dynamoDbLib.query({
      TableName: DYNAMODB_USER_TABLE,
      KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
      ExpressionAttributeValues: { ':pk': APP_PROFILE_USER_PK, ':prefix': `UPL#USR#${email}#${APP_PK}` },
    }),
    dynamoDbLib.query({
      TableName: DYNAMODB_USER_TABLE,
      KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
      ExpressionAttributeValues: { ':pk': APP_PERMISSIONS_PK, ':prefix': `PMS#USR#${email}#${APP_PK}` },
    }),
  ]);

  return success(200, { profiles: profiles ?? [], directPermissions: directPermissions ?? [] }, ACTION);
};

export const main = standardMiddleware(handler);
