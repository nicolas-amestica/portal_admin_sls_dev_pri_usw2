import * as dynamoDbLib from '../../../libs/dynamodb-v3.js';
import { success, unsuccessful } from '../../../helpers/responses.js';
import { broadcastToScope, SCOPES } from '../../../libs/websocket.js';
import { CHATS_PK, chatListSk } from '../helpers/chat-list-index.js';
import { normalizePhone } from '../mappers/map-conversacion-item.js';

const ACTION = 'Marcar como no leído';

/**
 * @description Marca una conversación como no leída (unreadCount = 1).
 * Persiste en DynamoDB (CHATS y sesión) y hace broadcast WS.
 *
 * @param {object} event - Evento HTTP de API Gateway con pathParameters.phone.
 */
export const main = async (event) => {
  try {
    const rawPhone = event.pathParameters?.phone;
    if (!rawPhone) throw Object.assign(new Error('phone requerido'), { statusCode: 400 });

    const phone = normalizePhone(rawPhone);
    const { CONVERSATIONS_TABLE } = process.env;

    await Promise.all([
      dynamoDbLib.update({
        TableName: CONVERSATIONS_TABLE,
        Key: { pk: CHATS_PK, sk: chatListSk(phone) },
        UpdateExpression: 'SET unreadCount = :one',
        ExpressionAttributeValues: { ':one': 1 },
      }).catch((err) => console.warn(`[${ACTION}] No se pudo actualizar CHATS: ${err.message}`)),
      dynamoDbLib.update({
        TableName: CONVERSATIONS_TABLE,
        Key: { pk: `CONV#${phone}`, sk: `CONV#${phone}` },
        UpdateExpression: 'SET unreadCount = :one',
        ExpressionAttributeValues: { ':one': 1 },
      }).catch((err) => console.warn(`[${ACTION}] No se pudo actualizar sesión: ${err.message}`)),
    ]);

    await broadcastToScope(SCOPES.LIST, {
      type: 'conversation_updated', phone, unreadCount: 1,
    }).catch((err) => console.warn(`[${ACTION}] Broadcast WS falló: ${err.message}`));

    return success(200, { phone }, ACTION);
  } catch (error) {
    console.error(`[${ACTION}] Error:`, error.message);
    return unsuccessful(error.statusCode || 500, error, ACTION);
  }
};
