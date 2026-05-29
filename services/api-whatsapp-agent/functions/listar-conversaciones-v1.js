import * as dynamoDbLib from '../../../libs/dynamodb-v3.js';
import { success, unsuccessful } from '../../../helpers/responses.js';
import {
  CHATS_PK,
  CHAT_LIST_DEFAULT_LIMIT,
  CHAT_LIST_MAX_LIMIT,
  filterChatsBySearch,
  mapChatListItem,
  paginateChatsByActivity,
  sortChatsByActivity,
} from '../helpers/chat-list-index.js';

const ACTION = 'Listar conversaciones';

/**
 * @description Lista conversaciones WhatsApp paginadas por actividad descendente.
 * Query params: limit (default 40, max 50), cursor (opaco base64url).
 *
 * @param {object} event - Evento HTTP de API Gateway.
 */
export const main = async (event) => {
  try {
    const { CONVERSATIONS_TABLE } = process.env;
    const rawLimit = parseInt(event.queryStringParameters?.limit ?? '', 10);
    const limit = Number.isFinite(rawLimit)
      ? Math.min(Math.max(rawLimit, 1), CHAT_LIST_MAX_LIMIT)
      : CHAT_LIST_DEFAULT_LIMIT;
    const cursor = event.queryStringParameters?.cursor ?? null;
    const searchQuery = event.queryStringParameters?.q?.trim() ?? '';

    const items = await dynamoDbLib.iterativeQuery({
      TableName: CONVERSATIONS_TABLE,
      KeyConditionExpression: 'pk = :pk',
      ExpressionAttributeValues: { ':pk': CHATS_PK },
    });

    const sorted = sortChatsByActivity((items ?? []).map(mapChatListItem));
    const filtered = filterChatsBySearch(sorted, searchQuery);
    const unreadTotal = filtered.filter((c) => (c.unreadCount ?? 0) > 0).length;
    const page = paginateChatsByActivity(filtered, { limit, cursor });

    return success(200, { ...page, total: filtered.length, unreadTotal }, ACTION);
  } catch (error) {
    console.error(`[${ACTION}] Error:`, error.message, error.stack);
    return unsuccessful(error.statusCode || 500, error, ACTION);
  }
};
