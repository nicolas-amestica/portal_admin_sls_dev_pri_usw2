import * as dynamoDbLib from '../../../libs/dynamodb-v3.js';
import { normalizePhone } from '../mappers/map-conversacion-item.js';

/** Partición DynamoDB del listado global de chats (Query, sin Scan). */
export const CHATS_PK = 'CHATS';

/** Tamaño de página por defecto al listar conversaciones. */
export const CHAT_LIST_DEFAULT_LIMIT = 40;
/** Tamaño máximo de página permitido. */
export const CHAT_LIST_MAX_LIMIT = 50;

const TTL_DAYS = 90;

/**
 * @description Timestamp de actividad para ordenar el listado (más reciente primero).
 * @param {object} item
 * @returns {string}
 */
export function getChatActivityAt(item) {
  return item.lastMessageAt || item.updatedAt || item.createdAt || '';
}

/**
 * @description Ordena chats por actividad descendente (conversación más reciente arriba).
 * @param {object[]} items
 * @returns {object[]}
 */
export function sortChatsByActivity(items) {
  return [...items].sort((a, b) => {
    const tb = new Date(getChatActivityAt(b)).getTime();
    const ta = new Date(getChatActivityAt(a)).getTime();
    return (Number.isNaN(tb) ? 0 : tb) - (Number.isNaN(ta) ? 0 : ta);
  });
}

/**
 * @description Sort key del ítem de listado para un teléfono normalizado.
 * @param {string} phone
 * @returns {string}
 */
export function chatListSk(phone) {
  return `CONV#${normalizePhone(phone)}`;
}

/**
 * @description TTL en segundos para ítems del listado de chats.
 * @returns {number}
 */
function chatListTtl() {
  return Math.floor(Date.now() / 1000) + TTL_DAYS * 24 * 60 * 60;
}

/**
 * @description Crea o actualiza el ítem de listado global (pk=CHATS) para una conversación.
 * @param {object} params
 * @param {string} params.phone
 * @param {string} [params.contactName]
 * @param {string} [params.channel]
 * @param {string} [params.lastMessage]
 * @param {string} [params.lastMessageAt]
 * @param {number} [params.unreadDelta]
 * @param {number} [params.unreadSet]
 * @param {'bot'|'derived'} [params.status]
 * @param {string} [params.reason]
 * @param {string} [params.reasonLabel]
 */
export async function upsertChatListItem({
  phone,
  contactName,
  channel,
  lastMessage,
  lastMessageAt,
  unreadDelta,
  unreadSet,
  status,
  reason,
  reasonLabel,
}) {
  const { CONVERSATIONS_TABLE } = process.env;
  if (!CONVERSATIONS_TABLE) return;

  const normalized = normalizePhone(phone);
  const updatedAt = new Date().toISOString();
  const activityAt = lastMessageAt ?? (lastMessage != null ? updatedAt : null);

  const names = { '#ttl': 'ttl' };
  const values = {
    ':phone': normalized,
    ':updatedAt': updatedAt,
    ':createdAt': updatedAt,
    ':ttl': chatListTtl(),
    ':cn': contactName ?? normalized,
    ':ch': channel ?? 'whatsapp',
  };

  let updateExpr =
    'SET phone = if_not_exists(phone, :phone), createdAt = if_not_exists(createdAt, :createdAt), updatedAt = :updatedAt, #ttl = :ttl';

  if (contactName) {
    updateExpr += ', contactName = :cnSet';
    values[':cnSet'] = contactName;
  } else {
    updateExpr += ', contactName = if_not_exists(contactName, :cn)';
  }

  if (channel) {
    updateExpr += ', channel = :chSet';
    values[':chSet'] = channel;
  } else {
    updateExpr += ', channel = if_not_exists(channel, :ch)';
  }

  if (lastMessage != null) {
    updateExpr += ', lastMessage = :msg';
    values[':msg'] = lastMessage.slice(0, 200);
  }
  if (activityAt != null) {
    updateExpr += ', lastMessageAt = :lma';
    values[':lma'] = activityAt;
  }
  if (status) {
    updateExpr += ', #s = :status';
    names['#s'] = 'status';
    values[':status'] = status;
  } else {
    updateExpr += ', #s = if_not_exists(#s, :botStatus)';
    names['#s'] = 'status';
    values[':botStatus'] = 'bot';
  }
  if (reason) {
    updateExpr += ', reason = :reason';
    values[':reason'] = reason;
    if (reasonLabel) {
      updateExpr += ', reasonLabel = :rl';
      values[':rl'] = reasonLabel;
    }
  }

  if (unreadSet != null) {
    updateExpr += ', unreadCount = :ucSet';
    values[':ucSet'] = unreadSet;
  } else {
    values[':zero'] = 0;
    updateExpr += ', unreadCount = if_not_exists(unreadCount, :zero)';
    if (unreadDelta != null && unreadDelta !== 0) {
      updateExpr += ' ADD unreadCount :ud';
      values[':ud'] = unreadDelta;
    }
  }

  await dynamoDbLib.update({
    TableName: CONVERSATIONS_TABLE,
    Key: { pk: CHATS_PK, sk: chatListSk(normalized) },
    UpdateExpression: updateExpr,
    ExpressionAttributeNames: names,
    ExpressionAttributeValues: values,
  });
}

/**
 * @description Mapea un ítem CHATS de DynamoDB al DTO del listado del portal.
 * @param {object} item
 * @returns {object}
 */
export function mapChatListItem(item) {
  const phone = (item.phone ?? item.sk?.replace(/^CONV#/, '') ?? '').replace(/^\+/, '');
  return {
    id: phone,
    phone,
    contactName: item.contactName || phone || 'Desconocido',
    phoneNumber: phone,
    channel: item.channel ?? 'whatsapp',
    lastMessage: item.lastMessage ?? '',
    lastMessageAt: item.lastMessageAt ?? '',
    updatedAt: item.updatedAt ?? item.lastMessageAt ?? item.createdAt ?? '',
    unreadCount: item.unreadCount ?? 0,
    status: item.status ?? 'bot',
    reason: item.reason,
    reasonLabel: item.reasonLabel,
  };
}

/**
 * @description Codifica cursor opaco de paginación por actividad (lastMessageAt + id).
 * @param {{ lastMessageAt: string, id: string }} payload
 * @returns {string}
 */
export function encodeChatListCursor({ lastMessageAt, id }) {
  return Buffer.from(JSON.stringify({ lastMessageAt, id }), 'utf8').toString('base64url');
}

/**
 * @description Decodifica cursor de paginación del listado.
 * @param {string} cursor
 * @returns {{ lastMessageAt: string, id: string } | null}
 */
export function decodeChatListCursor(cursor) {
  if (!cursor) return null;
  try {
    const parsed = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'));
    if (!parsed?.id) return null;
    return { lastMessageAt: parsed.lastMessageAt ?? '', id: String(parsed.id) };
  } catch {
    return null;
  }
}

/**
 * @description Pagina una lista ya ordenada por actividad descendente.
 * @param {ReturnType<typeof mapChatListItem>[]} sortedItems
 * @param {{ limit: number, cursor?: string | null }} options
 * @returns {{ items: object[], hasMore: boolean, nextCursor: string | null }}
 */
export function paginateChatsByActivity(sortedItems, { limit, cursor = null }) {
  let startIdx = 0;
  const decoded = decodeChatListCursor(cursor);
  if (decoded) {
    const idx = sortedItems.findIndex(
      (c) =>
        c.id === decoded.id &&
        (c.lastMessageAt || c.updatedAt || '') === decoded.lastMessageAt
    );
    startIdx = idx >= 0 ? idx + 1 : 0;
  }

  const items = sortedItems.slice(startIdx, startIdx + limit);
  const hasMore = startIdx + limit < sortedItems.length;
  const last = items[items.length - 1];
  const nextCursor =
    hasMore && last
      ? encodeChatListCursor({
          lastMessageAt: last.lastMessageAt || last.updatedAt || '',
          id: last.id,
        })
      : null;

  return { items, hasMore, nextCursor };
}
