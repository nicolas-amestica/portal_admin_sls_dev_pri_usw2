import * as dynamoDbLib from '../../../libs/dynamodb-v3.js';
import { success, unsuccessful } from '../../../helpers/responses.js';
import { CHATS_PK, mapChatListItem, sortChatsByActivity } from '../helpers/chat-list-index.js';

const ACTION = 'Listar conversaciones';
/** Máximo de chats devueltos al portal (los más recientes por actividad). */
const CHAT_LIST_LIMIT = 40;

/**
 * @description Lista las conversaciones WhatsApp más recientes leyendo la partición
 * CHATS de DynamoDB. Devuelve como máximo {@link CHAT_LIST_LIMIT} ítems ordenados
 * por actividad descendente (lastMessageAt → updatedAt → createdAt).
 *
 * @param {object} _event - Evento HTTP de API Gateway.
 */
export const main = async (_event) => {
  try {
    const { CONVERSATIONS_TABLE } = process.env;

    const items = await dynamoDbLib.iterativeQuery({
      TableName: CONVERSATIONS_TABLE,
      KeyConditionExpression: 'pk = :pk',
      ExpressionAttributeValues: { ':pk': CHATS_PK },
      ScanIndexForward: false,
    });

    const conversaciones = sortChatsByActivity((items ?? []).map(mapChatListItem)).slice(
      0,
      CHAT_LIST_LIMIT
    );

    return success(200, conversaciones, ACTION);
  } catch (error) {
    console.error(`[${ACTION}] Error:`, error.message, error.stack);
    return unsuccessful(error.statusCode || 500, error, ACTION);
  }
};
