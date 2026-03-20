import * as httpClient from '../../../libs/axios.js';
import { randomUUID } from '../../../libs/crypto.js';
import { getCalendarAccessToken, buildCalendarApiUrl, mapGoogleEventToMeetEvent } from '../../../helpers/google-calendar-auth.js';

const FLAMINGO_COLOR_ID = '4';
const NOTIFICATIONS = [
  { method: 'popup', minutes: 60 },
  { method: 'popup', minutes: 15 },
];

/**
 * @description Suma una hora a la combinación de fecha y hora para calcular el fin del evento.
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
 * @description Crea una reunión de Google Meet en el calendario de Giras Indómito.
 *
 * @param {object} params
 * @param {string} params.destino - Destino del viaje (se incluye en el título).
 * @param {string} params.nombreCliente - Nombre del apoderado.
 * @param {string} [params.emailCliente] - Email opcional del cliente.
 * @param {string} params.fechaSugerida - Fecha en formato YYYY-MM-DD.
 * @param {string} params.horaSugerida - Hora en formato HH:MM (America/Santiago).
 * @returns {Promise<{meetLink: string, eventId: string, fecha: string, hora: string}>}
 */
export async function crearReunion({ destino, nombreCliente, emailCliente, fechaSugerida, horaSugerida }) {
  const { GOOGLE_CALENDAR_ID = 'primary', TIMEZONE = 'America/Santiago' } = process.env;
  const accessToken = await getCalendarAccessToken();

  const destinoLabel = destino
    ? destino.charAt(0).toUpperCase() + destino.slice(1).toLowerCase()
    : 'Gira';

  const guests = emailCliente ? [{ email: emailCliente }] : [];

  const eventBody = {
    summary: `Reunión ${destinoLabel} — ${nombreCliente}`,
    description: `Reunión informativa sobre gira de estudio a ${destinoLabel} con el apoderado ${nombreCliente}.`,
    start: { dateTime: `${fechaSugerida}T${horaSugerida}:00`, timeZone: TIMEZONE },
    end: { dateTime: buildEndDateTime(fechaSugerida, horaSugerida), timeZone: TIMEZONE },
    attendees: guests,
    colorId: FLAMINGO_COLOR_ID,
    reminders: { useDefault: false, overrides: NOTIFICATIONS },
    conferenceData: {
      createRequest: {
        requestId: randomUUID(),
        conferenceSolutionKey: { type: 'hangoutsMeet' },
      },
    },
  };

  const url = buildCalendarApiUrl(GOOGLE_CALENDAR_ID, null, { conferenceDataVersion: '1' });

  let createdEvent;
  try {
    const response = await httpClient.post(url, eventBody, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    createdEvent = response.data;
  } catch (err) {
    console.error('[CREAR-REUNION] Google Calendar error:', JSON.stringify(err.response?.data ?? err.message));
    throw err;
  }

  const mapped = mapGoogleEventToMeetEvent(createdEvent);
  return {
    meetLink: mapped.googleMeetLink,
    eventId: mapped.id,
    fecha: mapped.date,
    hora: mapped.startTime,
  };
}
