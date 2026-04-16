import { parseEventBody } from '../../../helpers/event-parser.js';
import { success, unsuccessful } from '../../../helpers/responses.js';
import { enviarMensaje } from '../helpers/chatwoot-api.js';

const ACTION = 'Responder conversación derivada';

/**
 * @description Envía una respuesta del equipo humano a una conversación derivada.
 * Publica el mensaje en Chatwoot como saliente; el webhook de Chatwoot lo reenvía
 * automáticamente al cliente vía WhatsApp a través de responder-chatwoot-v1.
 *
 * @param {object} event - Evento HTTP de API Gateway con pathParameters.chatwootId y body.content.
 */
export const main = async (event) => {
  try {
    const chatwootId = Number(event.pathParameters?.chatwootId);
    if (!chatwootId) {
      const err = Object.assign(new Error('chatwootId es requerido'), { statusCode: 400 });
      return unsuccessful(400, err, ACTION);
    }

    const { content } = parseEventBody(event);
    if (!content?.trim()) {
      const err = Object.assign(new Error('content es requerido'), { statusCode: 400 });
      return unsuccessful(400, err, ACTION);
    }

    await enviarMensaje(chatwootId, content.trim());
    console.log(`[${ACTION}] Mensaje enviado en conversación ${chatwootId}`);

    return success(200, {}, ACTION);
  } catch (error) {
    console.error(`[${ACTION}] Error:`, error.message, error.stack);
    return unsuccessful(error.statusCode || 500, error, ACTION);
  }
};
