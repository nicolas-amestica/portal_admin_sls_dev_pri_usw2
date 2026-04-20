import axios from 'axios';
import { getCalendarAccessToken, buildCalendarApiUrl } from '../../../helpers/google-calendar-auth.js';
import { buscarEventosPorTelefono } from './crear-reunion.js';

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
 * Orden de búsqueda: eventId directo → codigoEvento en título → teléfono (fallback para sesiones stale).
 *
 * @param {object} params
 * @param {string} [params.codigoEvento] - Código único del evento (sesión).
 * @param {string} [params.eventId] - ID directo del evento en Google Calendar (preferido).
 * @param {string} [params.phoneNumber] - Teléfono normalizado sin '+'. Fallback cuando sesión no tiene codigoEvento.
 * @returns {Promise<{exito: boolean, mensaje: string}>}
 */
export async function cancelarReunion({ codigoEvento, eventId, phoneNumber }) {
  const { GOOGLE_CALENDAR_ID = 'primary' } = process.env;

  if (!codigoEvento && !eventId && !phoneNumber) {
    return { exito: false, mensaje: 'No tienes una reunión agendada para cancelar.' };
  }

  const accessToken = await getCalendarAccessToken();

  // 1. Usar eventId directo si está disponible.
  if (eventId) {
    try {
      await axios.delete(buildCalendarApiUrl(GOOGLE_CALENDAR_ID, eventId), {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return { exito: true, mensaje: 'Reunión cancelada correctamente.' };
    } catch (err) {
      console.error('[CANCELAR-REUNION] Error cancelando por eventId:', JSON.stringify(err.response?.data ?? err.message));
    }
  }

  // 2. Buscar por codigoEvento en el título.
  if (codigoEvento) {
    let eventoExistente;
    try {
      eventoExistente = await buscarEventoPorCodigo(GOOGLE_CALENDAR_ID, codigoEvento, accessToken);
    } catch (err) {
      console.error('[CANCELAR-REUNION] Error buscando por código:', JSON.stringify(err.response?.data ?? err.message));
    }
    if (eventoExistente) {
      try {
        await axios.delete(buildCalendarApiUrl(GOOGLE_CALENDAR_ID, eventoExistente.id), {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        return { exito: true, mensaje: 'Reunión cancelada correctamente.' };
      } catch (err) {
        console.error('[CANCELAR-REUNION] Error cancelando por código:', JSON.stringify(err.response?.data ?? err.message));
      }
    }
  }

  // 3. Fallback por teléfono — elimina TODOS los eventos futuros del cliente.
  if (phoneNumber) {
    const events = await buscarEventosPorTelefono(GOOGLE_CALENDAR_ID, phoneNumber, accessToken).catch(() => []);
    if (events.length === 0) {
      return { exito: false, mensaje: 'No se encontró ninguna reunión agendada.' };
    }
    await Promise.all(
      events.map((e) =>
        axios.delete(buildCalendarApiUrl(GOOGLE_CALENDAR_ID, e.id), { headers: { Authorization: `Bearer ${accessToken}` } }).catch(() => {})
      )
    );
    return { exito: true, mensaje: 'Reunión cancelada correctamente.' };
  }

  return { exito: false, mensaje: 'No se encontró tu reunión. Es posible que ya haya sido cancelada anteriormente.' };
}
