import * as dynamoDbLib from '../../../libs/dynamodb-v3.js';
import { success } from '../../../helpers/responses.js';
import { standardMiddleware } from '../../../libs/middleware/index.js';
import { cache, CacheKeys } from '../../../libs/cache/index.js';
import { APP_PK } from './access-profile.js';
import { getPortalJwtBodyFromEvent } from '../../../libs/fn-get-portal-jwt-body-from-event.js';
import { assertPortalAdministrador } from '../../../libs/assert-portal-administrador.js';

const { DYNAMODB_USER_TABLE } = process.env;
const APP_PROFILE_USER_PK = 'APP#PROFILE#USER';
const APP_PERMISSIONS_PK = 'APP#PERMISSIONS';
const ACTION = 'Guardar IAM de usuario.';

/**
 * @description Reemplaza completamente los perfiles asignados y permisos directos de un usuario.
 * profiles[]: [{ id, title, expiration? }]
 * directPermissions[]: [{ id, allowances?, expiration? }]
 */
const handler = async (event) => {
  const jwtBody = await getPortalJwtBodyFromEvent(event);
  assertPortalAdministrador(jwtBody.profiles);

  const { email, profiles = [], directPermissions = [] } = event.body || {};

  if (!email) {
    const error = new Error('email es requerido');
    error.statusCode = 400;
    throw error;
  }

  const [existingProfiles, existingPerms] = await Promise.all([
    dynamoDbLib.iterativeQuery({
      TableName: DYNAMODB_USER_TABLE,
      KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
      ExpressionAttributeValues: { ':pk': APP_PROFILE_USER_PK, ':prefix': `UPL#USR#${email}#${APP_PK}` },
    }),
    dynamoDbLib.iterativeQuery({
      TableName: DYNAMODB_USER_TABLE,
      KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
      ExpressionAttributeValues: { ':pk': APP_PERMISSIONS_PK, ':prefix': `PMS#USR#${email}#${APP_PK}` },
    }),
  ]);

  const now = new Date().toISOString();
  const ops = [
    ...(existingProfiles ?? []).map((p) =>
      dynamoDbLib.remove({ TableName: DYNAMODB_USER_TABLE, Key: { pk: APP_PROFILE_USER_PK, sk: p.sk } })
    ),
    ...(existingPerms ?? []).map((p) =>
      dynamoDbLib.remove({ TableName: DYNAMODB_USER_TABLE, Key: { pk: APP_PERMISSIONS_PK, sk: p.sk } })
    ),
    ...profiles.map((profile) =>
      dynamoDbLib.put({
        TableName: DYNAMODB_USER_TABLE,
        Item: {
          pk: APP_PROFILE_USER_PK,
          sk: `UPL#USR#${email}#${APP_PK}#PFL#${profile.id}`,
          title: profile.title,
          expiration: profile.expiration ?? 'null',
          createdAt: now,
        },
      })
    ),
    ...directPermissions.map((perm) =>
      dynamoDbLib.put({
        TableName: DYNAMODB_USER_TABLE,
        Item: {
          pk: APP_PERMISSIONS_PK,
          sk: `PMS#USR#${email}#${APP_PK}#${perm.id}`,
          id: perm.id,
          allowances: perm.allowances ?? '[create, read, update, delete]',
          expiration: perm.expiration ?? 'null',
          createdAt: now,
        },
      })
    ),
  ];

  await Promise.all(ops);

  cache.invalidate(CacheKeys.userAccess(email));
  console.log('USER_IAM_PUT', {
    email,
    profileCount: profiles.length,
    directPermissionCount: directPermissions.length,
    directPermissionIds: directPermissions.map((p) => p.id),
  });

  return success(200, { email, profiles, directPermissions }, ACTION);
};

export const main = standardMiddleware(handler);
