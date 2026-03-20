import * as httpClient from '../../../libs/axios.js';
import { getCalendarAccessToken, buildCalendarApiUrl, mapGoogleEventToMeetEvent } from '../../../helpers/google-calendar-auth.js';

const FLAMINGO_COLOR_ID = '4';
const NOTIFICATIONS = [
  { method: 'popup', minutes: 60 },
  { method: 'popup', minutes: 15 },
];

/**
 * @description Suma una hora a fecha/hora para calcular el fin del evento.
 * @param {string} date
 * @param {string} time
 * @returns {string}
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
 * @description Reagenda una reunión existente en Google Calendar a una nueva fecha y hora.
 *
 * @param {object} params
 * @param {string} params.eventId - ID del evento a reagendar.
 * @param {string} params.nuevaFecha - Nueva fecha en formato YYYY-MM-DD.
 * @param {string} params.nuevaHora - Nueva hora en formato HH:MM (America/Santiago).
 * @returns {Promise<{meetLink: string, eventId: string, fecha: string, hora: string}>}
 */
export async function reagendarReunion({ eventId, nuevaFecha, nuevaHora }) {
  const { GOOGLE_CALENDAR_ID = 'primary', TIMEZONE = 'America/Santiago' } = process.env;
  const accessToken = await getCalendarAccessToken();

  // Primero obtenemos el evento actual para conservar sus datos.
  const getUrl = buildCalendarApiUrl(GOOGLE_CALENDAR_ID, eventId);
  let currentEvent;
  try {
    const getResponse = await httpClient.get(getUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    currentEvent = getResponse.data;
  } catch (err) {
    console.error('[REAGENDAR-REUNION] Error al obtener evento:', JSON.stringify(err.response?.data ?? err.message));
    throw err;
  }

  const updatedBody = {
    ...currentEvent,
    start: { dateTime: `${nuevaFecha}T${nuevaHora}:00`, timeZone: TIMEZONE },
    end: { dateTime: buildEndDateTime(nuevaFecha, nuevaHora), timeZone: TIMEZONE },
    colorId: FLAMINGO_COLOR_ID,
    reminders: { useDefault: false, overrides: NOTIFICATIONS },
  };

  const putUrl = buildCalendarApiUrl(GOOGLE_CALENDAR_ID, eventId, { conferenceDataVersion: '1' });

  let updatedEvent;
  try {
    const putResponse = await httpClient.put(putUrl, updatedBody, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    updatedEvent = putResponse.data;
  } catch (err) {
    console.error('[REAGENDAR-REUNION] Error al actualizar evento:', JSON.stringify(err.response?.data ?? err.message));
    throw err;
  }

  const mapped = mapGoogleEventToMeetEvent(updatedEvent);
  return {
    meetLink: mapped.googleMeetLink,
    eventId: mapped.id,
    fecha: mapped.date,
    hora: mapped.startTime,
  };
}
