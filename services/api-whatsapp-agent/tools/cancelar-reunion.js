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
 * @description Cancela la reunión del cliente buscándola por su código único asignado.
 * No permite cancelar eventos que no pertenezcan al cliente.
 *
 * @param {object} params
 * @param {string} params.codigoEvento - Código único del evento (tomado de la sesión, no del usuario).
 * @returns {Promise<{exito: boolean, mensaje: string}>}
 */
export async function cancelarReunion({ codigoEvento }) {
  const { GOOGLE_CALENDAR_ID = 'primary' } = process.env;

  if (!codigoEvento) {
    return { exito: false, mensaje: 'No tienes una reunión agendada para cancelar.' };
  }

  const accessToken = await getCalendarAccessToken();

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

  try {
    const url = buildCalendarApiUrl(GOOGLE_CALENDAR_ID, eventoExistente.id);
    await axios.delete(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  } catch (err) {
    console.error('[CANCELAR-REUNION] Error cancelando evento:', JSON.stringify(err.response?.data ?? err.message));
    throw err;
  }

  return { exito: true, mensaje: 'Reunión cancelada correctamente.' };
}
