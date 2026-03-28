import * as dynamoDbLib from '../../../libs/dynamodb-v3.js';
import { success } from '../../../helpers/responses.js';
import { standardMiddleware } from '../../../libs/middleware/index.js';
import { APP_PK } from './access-profile.js';

const { DYNAMODB_USER_TABLE } = process.env;
const APP_PROFILE_PERMISSIONS_PK = 'APP#PROFILE#PERMISSIONS';
const ACTION = 'Obtener permisos de perfil.';

/**
 * @description Retorna los módulos asignados a un perfil IAM.
 */
const handler = async (event) => {
  const { profileId } = event.queryStringParameters || {};

  if (!profileId) {
    const error = new Error('profileId es requerido');
    error.statusCode = 400;
    throw error;
  }

  const permissions = await dynamoDbLib.query({
    TableName: DYNAMODB_USER_TABLE,
    KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
    ExpressionAttributeValues: {
      ':pk': APP_PROFILE_PERMISSIONS_PK,
      ':prefix': `PFL#${profileId}#${APP_PK}`,
    },
  });

  return success(200, permissions ?? [], ACTION);
};

export const main = standardMiddleware(handler);
