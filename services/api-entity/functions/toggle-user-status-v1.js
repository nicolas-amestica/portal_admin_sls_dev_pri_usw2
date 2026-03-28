import * as dynamoDbLib from '../../../libs/dynamodb-v3.js';
import { success } from '../../../helpers/responses.js';
import { standardMiddleware } from '../../../libs/middleware/index.js';

const { DYNAMODB_USER_TABLE } = process.env;
const APP_USERS_PK = 'APP#USERS';
const ACTION = 'Cambiar estado de usuario.';

/**
 * @description Activa o desactiva un usuario. Actualiza ambos registros (auth + directorio).
 */
const handler = async (event) => {
  const { id, email, isActive } = event.body || {};

  if (!id || !email || isActive === undefined) {
    const error = new Error('id, email e isActive son requeridos');
    error.statusCode = 400;
    throw error;
  }

  const now = new Date().toISOString();

  await Promise.all([
    dynamoDbLib.update({
      TableName: DYNAMODB_USER_TABLE,
      Key: { pk: `USR#${id}`, sk: `USR#${id}` },
      UpdateExpression: 'SET isActive = :a, updatedAt = :ts',
      ExpressionAttributeValues: { ':a': isActive, ':ts': now },
    }),
    dynamoDbLib.update({
      TableName: DYNAMODB_USER_TABLE,
      Key: { pk: APP_USERS_PK, sk: `USR#${email}` },
      UpdateExpression: 'SET isActive = :a, updatedAt = :ts',
      ExpressionAttributeValues: { ':a': isActive, ':ts': now },
    }),
  ]);

  return success(200, { id, email, isActive }, ACTION);
};

export const main = standardMiddleware(handler);
