import { parseEventBody } from '../../../helpers/event-parser.js';
import { success, unsuccessful } from '../../../helpers/responses.js';
import { sendTextMessage } from '../helpers/whatsapp-api.js';
import { broadcastToScope } from '../helpers/ws-broadcast.js';

const ACTION = 'Responder desde Chatwoot a WhatsApp';

/**
 * @description Recibe webhooks de Chatwoot y:
 * 1. Si el mensaje es saliente (del equipo) → reenvía al cliente vía WhatsApp.
 * 2. Si el mensaje es entrante (del cliente) → notifica vía WebSocket a los admins
 *    conectados a esa conversación y al canal LIST para refrescar la bandeja.
 *
 * @param {object} event - Evento HTTP de API Gateway con el payload del webhook de Chatwoot.
 */
export const main = async (event) => {
  try {
    const payload = parseEventBody(event);

    if (payload.event !== 'message_created') {
      return success(200, {}, ACTION);
    }

    const chatwootId = payload.conversation?.id;
    const esOutgoing = payload.message_type === 'outgoing' || payload.message_type === 1;
    const esIncoming = payload.message_type === 'incoming' || payload.message_type === 0;

    // Mensajes salientes del equipo → reenviar a WhatsApp.
    if (esOutgoing && !payload.private && payload.content) {
      const phoneNumber = payload.conversation?.meta?.sender?.phone_number;
      if (!phoneNumber) {
        console.warn(`[${ACTION}] Webhook saliente sin teléfono. Meta:`, JSON.stringify(payload.conversation?.meta));
        return success(200, {}, ACTION);
      }
      await sendTextMessage(phoneNumber, payload.content);
      console.log(`[${ACTION}] Mensaje enviado a ${phoneNumber}: "${payload.content.slice(0, 60)}"`);
    }

    // Mensajes entrantes del cliente → notificar admins en el detalle y en la lista.
    // Se awaita para garantizar que la Lambda no termine antes del publish (webhook rápido).
    if (esIncoming && !payload.private && chatwootId) {
      await Promise.allSettled([
        broadcastToScope({ chatwootId }, { type: 'new_message', chatwootId }),
        broadcastToScope('LIST', { type: 'conversation_updated', chatwootId }),
      ]);
    }

    return success(200, {}, ACTION);
  } catch (error) {
    console.error(`[${ACTION}] Error:`, error.message, error.stack);
    return unsuccessful(error.statusCode || 500, error, ACTION);
  }
};
