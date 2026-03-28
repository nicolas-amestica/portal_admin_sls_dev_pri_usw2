import * as dynamoDbLib from '../../../libs/dynamodb-v3.js';
import { success } from '../../../helpers/responses.js';
import { standardMiddleware } from '../../../libs/middleware/index.js';
import { APP_PK } from './access-profile.js';

const { DYNAMODB_USER_TABLE } = process.env;
const ACTION = 'Crear o actualizar módulo.';

/**
 * @description Crea o actualiza un módulo de la aplicación.
 * - LV1: sk = APP#ADMIN_PORTAL#LV1#{id}
 * - LV2: sk = APP#ADMIN_PORTAL#LV1#{lv1Id}#LV2#{id}  (lv1Sk requerido al crear LV2)
 */
const handler = async (event) => {
  const { sk, id, title, icon = '', path = '', tooltip = '', order = 0, lv1Sk } = event.body || {};

  if (!id?.trim() || !title?.trim()) {
    const error = new Error('id y title son requeridos');
    error.statusCode = 400;
    throw error;
  }

  const now = new Date().toISOString();

  if (sk) {
    const updated = await dynamoDbLib.update({
      TableName: DYNAMODB_USER_TABLE,
      Key: { pk: APP_PK, sk },
      UpdateExpression: 'SET title = :t, icon = :i, #p = :p, tooltip = :tt, #o = :o, updatedAt = :ts',
      ExpressionAttributeNames: { '#p': 'path', '#o': 'order' },
      ExpressionAttributeValues: {
        ':t': title.trim(), ':i': icon, ':p': path,
        ':tt': tooltip, ':o': order, ':ts': now,
      },
    });
    return success(200, updated, ACTION);
  }

  const moduleSk = lv1Sk ? `${lv1Sk}#LV2#${id.trim()}` : `${APP_PK}#LV1#${id.trim()}`;

  const record = {
    pk: APP_PK,
    sk: moduleSk,
    id: id.trim(),
    title: title.trim(),
    icon,
    path,
    tooltip,
    order,
    createdAt: now,
    updatedAt: now,
  };

  await dynamoDbLib.put({ TableName: DYNAMODB_USER_TABLE, Item: record });
  return success(201, record, ACTION);
};

export const main = standardMiddleware(handler);
