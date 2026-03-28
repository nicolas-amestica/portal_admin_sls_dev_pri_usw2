import { uuidv7 } from 'uuidv7';
import * as dynamoDbLib from '../../../libs/dynamodb-v3.js';
import { success } from '../../../helpers/responses.js';
import { standardMiddleware } from '../../../libs/middleware/index.js';
import { APP_PROFILES_PK } from './list-profiles-v1.js';

const { DYNAMODB_USER_TABLE } = process.env;
const ACTION = 'Crear o actualizar perfil.';

/**
 * @description Crea un nuevo perfil IAM (POST) o actualiza uno existente (PUT).
 * pk = APP#PROFILES, sk = PFL#{uuid}
 */
const handler = async (event) => {
  const { sk, title, description = '' } = event.body || {};

  if (!title?.trim()) {
    const error = new Error('El título del perfil es requerido');
    error.statusCode = 400;
    throw error;
  }

  const now = new Date().toISOString();

  if (sk) {
    const updated = await dynamoDbLib.update({
      TableName: DYNAMODB_USER_TABLE,
      Key: { pk: APP_PROFILES_PK, sk },
      UpdateExpression: 'SET title = :t, description = :d, updatedAt = :ts',
      ExpressionAttributeValues: { ':t': title.trim(), ':d': description, ':ts': now },
    });
    return success(200, updated, ACTION);
  }

  const id = uuidv7();
  const record = {
    pk: APP_PROFILES_PK,
    sk: `PFL#${id}`,
    id,
    title: title.trim(),
    description,
    createdAt: now,
    updatedAt: now,
  };

  await dynamoDbLib.put({ TableName: DYNAMODB_USER_TABLE, Item: record });
  return success(201, record, ACTION);
};

export const main = standardMiddleware(handler);
