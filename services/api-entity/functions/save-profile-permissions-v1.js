import * as dynamoDbLib from '../../../libs/dynamodb-v3.js';
import { success } from '../../../helpers/responses.js';
import { standardMiddleware } from '../../../libs/middleware/index.js';
import { cache } from '../../../libs/cache/index.js';
import { APP_PK } from './access-profile.js';
import { getPortalJwtBodyFromEvent } from '../../../libs/fn-get-portal-jwt-body-from-event.js';
import { assertPortalAdministrador } from '../../../libs/assert-portal-administrador.js';

const { DYNAMODB_USER_TABLE } = process.env;
const APP_PROFILE_PERMISSIONS_PK = 'APP#PROFILE#PERMISSIONS';
const ACTION = 'Guardar permisos de perfil.';

/**
 * @description Reemplaza completamente los módulos asignados a un perfil IAM.
 * modules[]: [{ id, allowances?, expiration? }]
 */
const handler = async (event) => {
  const jwtBody = await getPortalJwtBodyFromEvent(event);
  assertPortalAdministrador(jwtBody.profiles);

  const { profileId, modules = [] } = event.body || {};

  if (!profileId) {
    const error = new Error('profileId es requerido');
    error.statusCode = 400;
    throw error;
  }

  const existing = await dynamoDbLib.iterativeQuery({
    TableName: DYNAMODB_USER_TABLE,
    KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
    ExpressionAttributeValues: {
      ':pk': APP_PROFILE_PERMISSIONS_PK,
      ':prefix': `PFL#${profileId}#${APP_PK}`,
    },
  });

  const now = new Date().toISOString();
  const ops = [
    ...(existing ?? []).map((p) =>
      dynamoDbLib.remove({ TableName: DYNAMODB_USER_TABLE, Key: { pk: APP_PROFILE_PERMISSIONS_PK, sk: p.sk } })
    ),
    ...modules.map((mod) =>
      dynamoDbLib.put({
        TableName: DYNAMODB_USER_TABLE,
        Item: {
          pk: APP_PROFILE_PERMISSIONS_PK,
          sk: `PFL#${profileId}#${APP_PK}#${mod.id}`,
          id: mod.id,
          allowances: mod.allowances ?? '[create, read, update, delete]',
          expiration: mod.expiration ?? 'null',
          createdAt: now,
        },
      })
    ),
  ];

  await Promise.all(ops);

  console.log('PROFILE_PERMISSIONS_PUT', {
    profileId,
    replacedCount: existing?.length ?? 0,
    savedModuleCount: modules.length,
    moduleIds: modules.map((m) => m.id),
  });

  cache.invalidatePattern('^user:access:');

  return success(200, { profileId, modules }, ACTION);
};

export const main = standardMiddleware(handler);
