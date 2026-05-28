import { uuidv7 } from 'uuidv7';
import * as dynamoDbLib from '../../../libs/dynamodb-v3.js';
import { buildTurnItem, normalizePhone } from '../mappers/map-conversacion-item.js';
import { sanitizeForHistory } from './sanitize-for-history.js';
import { upsertChatListItem } from './chat-list-index.js';
import { broadcastConversationUpdated, broadcastMessageAppended } from './inbox-realtime.js';

const META_MSG_TTL_DAYS = 7;

/**
 * @description TTL para índice de idempotencia por messageId de Meta.
 * @returns {number}
 */
function metaMsgTtl() {
  return Math.floor(Date.now() / 1000) + META_MSG_TTL_DAYS * 24 * 60 * 60;
}

/**
 * @description Persiste el mensaje entrante del cliente antes de que Gemini responda.
 * Idempotente por messageId de Meta. Notifica al portal vía WebSocket.
 *
 * @param {{ phoneNumber: string, text: string, messageId?: string, channel?: string }} params
 * @returns {Promise<{ persisted: boolean, alreadyExists?: boolean, msgSk?: string, unreadCount?: number }>}
 */
export async function persistInboundMessage({ phoneNumber, text, messageId, channel = 'whatsapp' }) {
  const sanitized = sanitizeForHistory(text);
  if (!phoneNumber || !sanitized) {
    return { persisted: false };
  }

  const { CONVERSATIONS_TABLE } = process.env;
  const normalizedPhone = normalizePhone(phoneNumber);
  const sessionKey = `CONV#${normalizedPhone}`;

  if (messageId) {
    const existingIndex = await dynamoDbLib
      .getOne({
        TableName: CONVERSATIONS_TABLE,
        Key: { pk: `META_MSG#${messageId}`, sk: 'META' },
      })
      .catch(() => null);

    if (existingIndex?.msgSk) {
      return { persisted: false, alreadyExists: true, msgSk: existingIndex.msgSk };
    }
  }

  const now = new Date().toISOString();
  const ttl = Math.floor(Date.now() / 1000) + 90 * 24 * 60 * 60;
  const msgSk = `MSG#${uuidv7()}`;
  const previewText = sanitized.slice(0, 200);

  const userItem = buildTurnItem(phoneNumber, msgSk, 'user', sanitized, [], {
    metaMessageId: messageId,
  });

  const sessionUpdate = dynamoDbLib.update({
    TableName: CONVERSATIONS_TABLE,
    Key: { pk: sessionKey, sk: sessionKey },
    UpdateExpression:
      'SET lastMessageAt = :now, lastMessageText = :txt, updatedAt = :now, #ttl = :ttl, createdAt = if_not_exists(createdAt, :now), phoneNumber = if_not_exists(phoneNumber, :phone), channel = if_not_exists(channel, :channel) ADD unreadCount :one',
    ExpressionAttributeNames: { '#ttl': 'ttl' },
    ExpressionAttributeValues: {
      ':now': now,
      ':txt': sanitized.slice(0, 100),
      ':ttl': ttl,
      ':one': 1,
      ':phone': normalizedPhone,
      ':channel': channel,
    },
    ReturnValues: 'UPDATED_NEW',
  });

  const writes = [dynamoDbLib.put({ TableName: CONVERSATIONS_TABLE, Item: userItem }), sessionUpdate];

  if (messageId) {
    writes.push(
      dynamoDbLib.put({
        TableName: CONVERSATIONS_TABLE,
        Item: {
          pk: `META_MSG#${messageId}`,
          sk: 'META',
          msgSk,
          convPk: sessionKey,
          phone: normalizedPhone,
          createdAt: now,
          ttl: metaMsgTtl(),
        },
      })
    );
  }

  const results = await Promise.all(writes);
  const unreadCount = results[1]?.unreadCount ?? 1;

  await upsertChatListItem({
    phone: normalizedPhone,
    channel,
    lastMessage: previewText,
    lastMessageAt: now,
    unreadDelta: 1,
  }).catch((err) => console.warn('[persistInbound] CHATS update falló:', err.message));

  await Promise.allSettled([
    broadcastMessageAppended({ phone: normalizedPhone, item: userItem }),
    broadcastConversationUpdated({
      phone: normalizedPhone,
      unreadCount,
      lastMessage: previewText,
      lastMessageAt: now,
    }),
  ]);

  return { persisted: true, msgSk, unreadCount };
}
