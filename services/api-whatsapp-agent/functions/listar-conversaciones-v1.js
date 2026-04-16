import { success, unsuccessful } from '../../../helpers/responses.js';
import { listarConversaciones } from '../helpers/chatwoot-api.js';

const ACTION = 'Listar conversaciones derivadas';

/**
 * @description Lista las conversaciones abiertas en la bandeja de Chatwoot.
 * Estas son las conversaciones que el agente derivó al equipo humano.
 *
 * @param {object} event - Evento HTTP de API Gateway.
 */
export const main = async (event) => {
  try {
    const rawConversaciones = await listarConversaciones();

    const conversaciones = rawConversaciones.map((conv) => {
      const sender = conv.meta?.sender ?? {};
      return {
        id: conv.id,
        contactName: sender.name || sender.phone_number || sender.identifier || 'Desconocido',
        phoneNumber: sender.phone_number || sender.identifier || '',
        channel: conv.meta?.channel ?? 'whatsapp',
        lastMessage: conv.last_non_activity_message?.content ?? '',
        lastMessageAt: conv.timestamp ? new Date(conv.timestamp * 1000).toISOString() : '',
        unreadCount: conv.unread_count ?? 0,
        status: conv.status ?? 'open',
      };
    });

    return success(200, conversaciones, ACTION);
  } catch (error) {
    console.error(`[${ACTION}] Error:`, error.message, error.stack);
    return unsuccessful(error.statusCode || 500, error, ACTION);
  }
};
