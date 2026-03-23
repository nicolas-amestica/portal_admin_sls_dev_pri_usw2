import axios from 'axios';
import { getCalendarAccessToken, buildCalendarApiUrl, mapGoogleEventToMeetEvent } from '../../../helpers/google-calendar-auth.js';

const TIMEZONE = 'America/Santiago';

/**
 * @description Suma una hora a la combinación de fecha y hora dadas.
 * @param {string} date - Fecha en formato YYYY-MM-DD.
 * @param {string} time - Hora en formato HH:MM.
 * @returns {string} Fecha y hora de fin en formato YYYY-MM-DDTHH:MM:00.
 */
function buildEndDateTime(date, time) {
  const [h, m] = time.split(':').map(Number);
  let newH = h + 1;
  let newDate = date;

  if (newH >= 24) {
    newH = 0;
    const d = new Date(`${date}T00:00:00`);
    d.setDate(d.getDate() + 1);
    newDate = d.toISOString().slice(0, 10);
  }

  return `${newDate}T${String(newH).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
}

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
 * @description Reagenda la reunión del cliente buscándola por su código único asignado.
 * No permite editar eventos que no pertenezcan al cliente.
 *
 * @param {object} params
 * @param {string} params.codigoEvento - Código único del evento (tomado de la sesión, no del usuario).
 * @param {string} params.nuevaFecha - Nueva fecha en formato YYYY-MM-DD.
 * @param {string} params.nuevaHora - Nueva hora de inicio en formato HH:MM (America/Santiago).
 * @returns {Promise<{exito: boolean, fecha: string, hora: string, meetLink: string|null, mensaje: string}>}
 */
export async function editarReunion({ codigoEvento, nuevaFecha, nuevaHora }) {
  const { GOOGLE_CALENDAR_ID = 'primary' } = process.env;

  if (!codigoEvento) {
    return { exito: false, mensaje: 'No tienes una reunión agendada para reagendar.' };
  }

  const accessToken = await getCalendarAccessToken();

  let eventoExistente;
  try {
    eventoExistente = await buscarEventoPorCodigo(GOOGLE_CALENDAR_ID, codigoEvento, accessToken);
  } catch (err) {
    console.error('[EDITAR-REUNION] Error buscando evento:', JSON.stringify(err.response?.data ?? err.message));
    throw err;
  }

  if (!eventoExistente) {
    return { exito: false, mensaje: 'No se encontró tu reunión. Es posible que ya haya sido cancelada.' };
  }

  const tz = eventoExistente.start?.timeZone || TIMEZONE;
  const updatedBody = {
    ...eventoExistente,
    start: { dateTime: `${nuevaFecha}T${nuevaHora}:00`, timeZone: tz },
    end: { dateTime: buildEndDateTime(nuevaFecha, nuevaHora), timeZone: tz },
  };

  let updatedEvent;
  try {
    const url = buildCalendarApiUrl(GOOGLE_CALENDAR_ID, eventoExistente.id);
    const response = await axios.put(url, updatedBody, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    updatedEvent = response.data;
  } catch (err) {
    console.error('[EDITAR-REUNION] Error actualizando evento:', JSON.stringify(err.response?.data ?? err.message));
    throw err;
  }

  const mapped = mapGoogleEventToMeetEvent(updatedEvent);

  return {
    exito: true,
    fecha: mapped.date,
    hora: mapped.startTime,
    meetLink: mapped.googleMeetLink,
    mensaje: 'Reunión reagendada correctamente.',
  };
}
