import * as dynamoDbLib from '../../../libs/dynamodb-v3.js';
import { CHATS_PK, chatListSk } from './chat-list-index.js';
import { broadcastConversationUpdated } from './inbox-realtime.js';
import { normalizePhone } from '../mappers/map-conversacion-item.js';

/**
 * @description Marca una conversación como leída en CHATS y sesión CONV# (unreadCount = 0).
 * @param {string} phone - Teléfono normalizado o con prefijo +.
 * @param {{ broadcast?: boolean }} [options]
 * @returns {Promise<void>}
 */
export async function markConversationRead(phone, { broadcast = true } = {}) {
  const { CONVERSATIONS_TABLE } = process.env;
  if (!CONVERSATIONS_TABLE) return;

  const normalized = normalizePhone(phone);
  const sessionKey = `CONV#${normalized}`;

  await Promise.all([
    dynamoDbLib
      .update({
        TableName: CONVERSATIONS_TABLE,
        Key: { pk: CHATS_PK, sk: chatListSk(normalized) },
        UpdateExpression: 'SET unreadCount = :zero',
        ExpressionAttributeValues: { ':zero': 0 },
      })
      .catch((err) => console.warn(`[markConversationRead] CHATS ${normalized}: ${err.message}`)),
    dynamoDbLib
      .update({
        TableName: CONVERSATIONS_TABLE,
        Key: { pk: sessionKey, sk: sessionKey },
        UpdateExpression: 'SET unreadCount = :zero',
        ExpressionAttributeValues: { ':zero': 0 },
      })
      .catch((err) => console.warn(`[markConversationRead] Sesión ${normalized}: ${err.message}`)),
  ]);

  if (broadcast) {
    await broadcastConversationUpdated({ phone: normalized, unreadCount: 0 });
  }
}
