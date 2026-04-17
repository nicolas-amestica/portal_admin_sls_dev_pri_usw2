import { parseEventBody } from '../../../helpers/event-parser.js';
import { success, unsuccessful } from '../../../helpers/responses.js';
import { obtenerConversacion, actualizarContacto } from '../helpers/chatwoot-api.js';

const ACTION = 'Actualizar contacto';

/**
 * @description Actualiza el nombre/alias de un contacto en Chatwoot a partir del ID de conversación.
 * El alias queda persistido en Chatwoot y se refleja en todos los listados.
 *
 * @param {object} event - Evento HTTP de API Gateway.
 */
export const main = async (event) => {
  try {
    const chatwootId = Number(event.pathParameters?.chatwootId);
    if (!chatwootId) throw Object.assign(new Error('chatwootId requerido'), { statusCode: 400 });

    const { name } = parseEventBody(event);
    if (!name?.trim()) throw Object.assign(new Error('name es requerido'), { statusCode: 400 });

    const conv = await obtenerConversacion(chatwootId);
    const contactId = conv?.meta?.sender?.id;
    if (!contactId) throw Object.assign(new Error('Contacto no encontrado en la conversación'), { statusCode: 404 });

    await actualizarContacto(contactId, name.trim());

    return success(200, { contactId, name: name.trim() }, ACTION);
  } catch (error) {
    console.error(`[${ACTION}] Error:`, error.message, error.stack);
    return unsuccessful(error.statusCode || 500, error, ACTION);
  }
};
