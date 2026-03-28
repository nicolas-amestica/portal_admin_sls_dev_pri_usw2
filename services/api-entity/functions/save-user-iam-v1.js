import * as dynamoDbLib from '../../../libs/dynamodb-v3.js';
import { success } from '../../../helpers/responses.js';
import { standardMiddleware } from '../../../libs/middleware/index.js';
import { APP_PK } from './access-profile.js';

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
  const { email, profiles = [], directPermissions = [] } = event.body || {};

  if (!email) {
    const error = new Error('email es requerido');
    error.statusCode = 400;
    throw error;
  }

  const [existingProfiles, existingPerms] = await Promise.all([
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
  return success(200, { email, profiles, directPermissions }, ACTION);
};

export const main = standardMiddleware(handler);
