import * as dynamoDbLib from '../../../libs/dynamodb-v3.js';
import { success } from '../../../helpers/responses.js';
import { standardMiddleware } from '../../../libs/middleware/index.js';
import { cache } from '../../../libs/cache/index.js';
import { APP_PROFILES_PK } from './list-profiles-v1.js';
import { APP_PK } from './access-profile.js';

const { DYNAMODB_USER_TABLE } = process.env;
const APP_PROFILE_PERMISSIONS_PK = 'APP#PROFILE#PERMISSIONS';
const ACTION = 'Eliminar perfil.';

/**
 * @description Elimina un perfil IAM y sus permisos de módulos asociados en cascada.
 */
const handler = async (event) => {
  const { sk } = event.queryStringParameters || {};

  if (!sk) {
    const error = new Error('sk del perfil es requerido');
    error.statusCode = 400;
    throw error;
  }

  // profileId es la parte después de PFL# en el sk del perfil
  const profileId = sk.replace(/^PFL#/, '');

  const existingPerms = await dynamoDbLib.iterativeQuery({
    TableName: DYNAMODB_USER_TABLE,
    KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
    ExpressionAttributeValues: {
      ':pk': APP_PROFILE_PERMISSIONS_PK,
      ':prefix': `PFL#${profileId}#${APP_PK}`,
    },
  });

  const ops = [
    dynamoDbLib.remove({ TableName: DYNAMODB_USER_TABLE, Key: { pk: APP_PROFILES_PK, sk } }),
    ...(existingPerms ?? []).map((p) =>
      dynamoDbLib.remove({ TableName: DYNAMODB_USER_TABLE, Key: { pk: APP_PROFILE_PERMISSIONS_PK, sk: p.sk } })
    ),
  ];

  await Promise.all(ops);

  cache.invalidatePattern('^user:access:');
  console.log('PROFILE_DELETED', { profileId, sk, cascadePermissionDeletes: existingPerms?.length ?? 0 });

  return success(200, { sk, deleted: true }, ACTION);
};

export const main = standardMiddleware(handler);
