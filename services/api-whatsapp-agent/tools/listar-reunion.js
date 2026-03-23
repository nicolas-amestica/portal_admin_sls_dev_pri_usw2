import axios from 'axios';
import { getCalendarAccessToken, buildCalendarApiUrl, mapGoogleEventToMeetEvent } from '../../../helpers/google-calendar-auth.js';

/**
 * @description Lista los eventos de Google Calendar que pertenecen al cliente,
 * filtrando por el código único asignado a su reunión.
 * Solo retorna eventos cuyo título contiene el código del cliente.
 *
 * @param {object} params
 * @param {string} params.codigoEvento - Código único del evento del cliente (almacenado en sesión).
 * @returns {Promise<{encontrados: boolean, eventos: Array<{eventId: string, fecha: string, hora: string, horaFin: string, meetLink: string|null}>}>}
 */
export async function listarReunion({ codigoEvento }) {
  const { GOOGLE_CALENDAR_ID = 'primary' } = process.env;

  if (!codigoEvento) {
    return { encontrados: false, eventos: [], mensaje: 'No tienes una reunión agendada en este momento.' };
  }

  const accessToken = await getCalendarAccessToken();

  // Buscar eventos que contengan el código del cliente en el título.
  const url = buildCalendarApiUrl(GOOGLE_CALENDAR_ID, null, {
    q: `[${codigoEvento}]`,
    singleEvents: 'true',
    orderBy: 'startTime',
  });

  let items;
  try {
    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    items = response.data.items || [];
  } catch (err) {
    console.error('[LISTAR-REUNION] Google Calendar error:', JSON.stringify(err.response?.data ?? err.message));
    throw err;
  }

  // Filtro adicional para asegurarse de que el código esté en el título.
  const pattern = `[${codigoEvento}]`;
  const eventosFiltrados = items.filter((e) => (e.summary || '').includes(pattern));

  if (eventosFiltrados.length === 0) {
    return { encontrados: false, eventos: [] };
  }

  const eventos = eventosFiltrados.map((e) => {
    const mapped = mapGoogleEventToMeetEvent(e);
    return {
      eventId: mapped.id,
      titulo: mapped.title,
      fecha: mapped.date,
      horaInicio: mapped.startTime,
      horaFin: mapped.endTime,
      meetLink: mapped.googleMeetLink,
    };
  });

  return { encontrados: true, eventos };
}
