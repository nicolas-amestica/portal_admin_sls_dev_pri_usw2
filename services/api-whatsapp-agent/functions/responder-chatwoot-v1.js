import { parseEventBody } from '../../../helpers/event-parser.js';
import { success, unsuccessful } from '../../../helpers/responses.js';
import { sendTextMessage } from '../helpers/whatsapp-api.js';

const ACTION = 'Responder desde Chatwoot a WhatsApp';

/**
 * @description Recibe webhooks salientes de Chatwoot y reenvía la respuesta del agente humano
 * al cliente vía WhatsApp Cloud API.
 *
 * Solo procesa mensajes que cumplan todas estas condiciones:
 * - Evento: message_created
 * - Tipo: outgoing (respuesta del agente, no mensaje entrante del cliente)
 * - No privado (excluye notas internas del equipo)
 * - Con contenido de texto
 *
 * @param {object} event - Evento HTTP de API Gateway con el payload del webhook de Chatwoot.
 */
export const main = async (event) => {
  try {
    const payload = parseEventBody(event);

    // Ignorar eventos que no sean mensajes salientes del agente humano.
    const esOutgoing = payload.message_type === 'outgoing' || payload.message_type === 1;
    if (
      payload.event !== 'message_created' ||
      !esOutgoing ||
      payload.private === true ||
      !payload.content
    ) {
      return success(200, {}, ACTION);
    }

    const phoneNumber = payload.conversation?.meta?.sender?.phone_number;
    if (!phoneNumber) {
      console.warn(`[${ACTION}] Webhook sin número de teléfono del cliente. Meta:`, JSON.stringify(payload.conversation?.meta));
      return success(200, {}, ACTION);
    }

    await sendTextMessage(phoneNumber, payload.content);
    console.log(`[${ACTION}] Mensaje enviado a ${phoneNumber}: "${payload.content.slice(0, 60)}"`);

    return success(200, {}, ACTION);
  } catch (error) {
    console.error(`[${ACTION}] Error:`, error.message, error.stack);
    return unsuccessful(error.statusCode || 500, error, ACTION);
  }
};
