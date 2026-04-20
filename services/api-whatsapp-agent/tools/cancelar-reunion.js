import axios from 'axios';
import { getCalendarAccessToken, buildCalendarApiUrl } from '../../../helpers/google-calendar-auth.js';

/**
 * @description Busca en el calendario el evento del cliente usando su código único.
 * @param {string} calendarId
 * @param {string} codigoEvento
 * @param {string} accessToken
 * @returns {Promise<object|null>} Evento de Google Calendar o null si no se encuentra.
 */
async function buscarEventoPorCodigo(calendarId, codigoEvento, accessToken) {
  const url = buildCalendarApiUrl(calendarId, null, {
    q: `[${codigoEvento}]`,
    singleEvents: 'true',
    orderBy: 'startTime',
  });

  const response = await axios.get(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const items = response.data.items || [];
  const pattern = `[${codigoEvento}]`;
  return items.find((e) => (e.summary || '').includes(pattern)) || null;
}

/**
 * @description Cancela la reunión del cliente.
 * Si se pasa eventId, lo usa directamente (más confiable).
 * Si no, busca el evento por codigoEvento en el título del calendario.
 *
 * @param {object} params
 * @param {string} [params.codigoEvento] - Código único del evento (sesión).
 * @param {string} [params.eventId] - ID directo del evento en Google Calendar (preferido).
 * @returns {Promise<{exito: boolean, mensaje: string}>}
 */
export async function cancelarReunion({ codigoEvento, eventId }) {
  const { GOOGLE_CALENDAR_ID = 'primary' } = process.env;

  if (!codigoEvento && !eventId) {
    return { exito: false, mensaje: 'No tienes una reunión agendada para cancelar.' };
  }

  const accessToken = await getCalendarAccessToken();

  let targetEventId = eventId;

  if (!targetEventId) {
    let eventoExistente;
    try {
      eventoExistente = await buscarEventoPorCodigo(GOOGLE_CALENDAR_ID, codigoEvento, accessToken);
    } catch (err) {
      console.error('[CANCELAR-REUNION] Error buscando evento:', JSON.stringify(err.response?.data ?? err.message));
      throw err;
    }
    if (!eventoExistente) {
      return { exito: false, mensaje: 'No se encontró tu reunión. Es posible que ya haya sido cancelada anteriormente.' };
    }
    targetEventId = eventoExistente.id;
  }

  try {
    const url = buildCalendarApiUrl(GOOGLE_CALENDAR_ID, targetEventId);
    await axios.delete(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  } catch (err) {
    console.error('[CANCELAR-REUNION] Error cancelando evento:', JSON.stringify(err.response?.data ?? err.message));
    throw err;
  }

  return { exito: true, mensaje: 'Reunión cancelada correctamente.' };
}
