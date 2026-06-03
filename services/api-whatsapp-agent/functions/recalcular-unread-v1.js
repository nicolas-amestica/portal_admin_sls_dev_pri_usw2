import * as dynamoDbLib from '../../../libs/dynamodb-v3.js';
import { success, unsuccessful } from '../../../helpers/responses.js';
import { broadcastToScope, SCOPES } from '../../../libs/websocket.js';
import { CHATS_PK } from '../helpers/chat-list-index.js';
import { markConversationRead } from '../helpers/mark-conversation-read.js';
import { normalizePhone } from '../mappers/map-conversacion-item.js';

const ACTION = 'Recalcular estado no leído del inbox';
const PROCESS_CHUNK_SIZE = 25;

/** Roles del último mensaje que implican que el operador ya atendió el hilo. */
const OPERATOR_ROLES = new Set(['model', 'team']);

/**
 * @description Resuelve el teléfono normalizado desde un ítem CHATS.
 * @param {object} item
 * @returns {string}
 */
function phoneFromChatItem(item) {
  return normalizePhone(item.phone ?? item.sk?.replace(/^CONV#/, '') ?? '');
}

/**
 * @description Obtiene el rol del último mensaje (MSG#) de una conversación.
 * @param {string} phone
 * @returns {Promise<string|null>}
 */
async function getLastMessageRole(phone) {
  const { CONVERSATIONS_TABLE } = process.env;
  const pk = `CONV#${phone}`;

  const items = await dynamoDbLib.query({
    TableName: CONVERSATIONS_TABLE,
    KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
    ExpressionAttributeValues: { ':pk': pk, ':prefix': 'MSG#' },
    ScanIndexForward: false,
    Limit: 1,
  });

  const last = items?.[0];
  return last?.role ?? null;
}

/**
 * @description Recalcula unreadCount según el último mensaje del hilo (estilo WhatsApp).
 * Limpia badge si el último turno es del agente IA o del equipo; mantiene si es del cliente.
 *
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

    let cleared = 0;
    let keptUnread = 0;
    let unchanged = 0;

    const chatItems = items ?? [];

    for (let i = 0; i < chatItems.length; i += PROCESS_CHUNK_SIZE) {
      const chunk = chatItems.slice(i, i + PROCESS_CHUNK_SIZE);

      const outcomes = await Promise.all(
        chunk.map(async (item) => {
          const phone = phoneFromChatItem(item);
          if (!phone) return 'unchanged';

          const lastRole = await getLastMessageRole(phone);
          const currentUnread = item.unreadCount ?? 0;

          if (lastRole && OPERATOR_ROLES.has(lastRole)) {
            if (currentUnread > 0) {
              await markConversationRead(phone, { broadcast: false });
              return 'cleared';
            }
            return 'unchanged';
          }

          if (lastRole === 'user') {
            return currentUnread > 0 ? 'keptUnread' : 'unchanged';
          }

          if (currentUnread > 0) {
            await markConversationRead(phone, { broadcast: false });
            return 'cleared';
          }
          return 'unchanged';
        })
      );

      for (const outcome of outcomes) {
        if (outcome === 'cleared') cleared += 1;
        else if (outcome === 'keptUnread') keptUnread += 1;
        else if (outcome === 'unchanged') unchanged += 1;
      }
    }

    if (cleared > 0) {
      await broadcastToScope(SCOPES.LIST, { type: 'all_conversations_read' }).catch((err) =>
        console.warn(`[${ACTION}] Broadcast WS falló: ${err.message}`)
      );
    }

    console.log(`[${ACTION}] cleared=${cleared}, keptUnread=${keptUnread}, unchanged=${unchanged}`);

    return success(200, { cleared, keptUnread, unchanged }, ACTION);
  } catch (error) {
    console.error(`[${ACTION}] Error:`, error.message, error.stack);
    return unsuccessful(error.statusCode || 500, error, ACTION);
  }
};
