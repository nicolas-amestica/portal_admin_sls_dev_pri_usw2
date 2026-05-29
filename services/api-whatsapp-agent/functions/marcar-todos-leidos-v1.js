import * as dynamoDbLib from '../../../libs/dynamodb-v3.js';
import { success, unsuccessful } from '../../../helpers/responses.js';
import { broadcastToScope, SCOPES } from '../../../libs/websocket.js';
import { CHATS_PK, chatListSk } from '../helpers/chat-list-index.js';
import { normalizePhone } from '../mappers/map-conversacion-item.js';

const ACTION = 'Marcar todos como leídos';
const UPDATE_CHUNK_SIZE = 25;

/**
 * @description Resuelve el teléfono normalizado desde un ítem CHATS.
 * @param {object} item
 * @returns {string}
 */
function phoneFromChatItem(item) {
  return normalizePhone(item.phone ?? item.sk?.replace(/^CONV#/, '') ?? '');
}

/**
 * @description Marca todas las conversaciones con unreadCount > 0 como leídas (CHATS + sesión CONV#).
 * @param {object} event - Evento HTTP de API Gateway.
 */
export const main = async (event) => {
  try {
    const { CONVERSATIONS_TABLE } = process.env;

    const items = await dynamoDbLib.iterativeQuery({
      TableName: CONVERSATIONS_TABLE,
      KeyConditionExpression: 'pk = :pk',
      ExpressionAttributeValues: { ':pk': CHATS_PK },
    });

    const unreadItems = (items ?? []).filter((item) => (item.unreadCount ?? 0) > 0);
    let updated = 0;

    for (let i = 0; i < unreadItems.length; i += UPDATE_CHUNK_SIZE) {
      const chunk = unreadItems.slice(i, i + UPDATE_CHUNK_SIZE);
      await Promise.all(
        chunk.flatMap((item) => {
          const phone = phoneFromChatItem(item);
          if (!phone) return [];

          return [
            dynamoDbLib
              .update({
                TableName: CONVERSATIONS_TABLE,
                Key: { pk: CHATS_PK, sk: chatListSk(phone) },
                UpdateExpression: 'SET unreadCount = :zero',
                ExpressionAttributeValues: { ':zero': 0 },
              })
              .catch((err) =>
                console.warn(`[${ACTION}] CHATS ${phone}: ${err.message}`)
              ),
            dynamoDbLib
              .update({
                TableName: CONVERSATIONS_TABLE,
                Key: { pk: `CONV#${phone}`, sk: `CONV#${phone}` },
                UpdateExpression: 'SET unreadCount = :zero',
                ExpressionAttributeValues: { ':zero': 0 },
              })
              .catch((err) =>
                console.warn(`[${ACTION}] Sesión ${phone}: ${err.message}`)
              ),
          ];
        })
      );
      updated += chunk.length;
    }

    await broadcastToScope(SCOPES.LIST, { type: 'all_conversations_read' }).catch((err) =>
      console.warn(`[${ACTION}] Broadcast WS falló: ${err.message}`)
    );

    return success(200, { updated }, ACTION);
  } catch (error) {
    console.error(`[${ACTION}] Error:`, error.message, error.stack);
    return unsuccessful(error.statusCode || 500, error, ACTION);
  }
};
