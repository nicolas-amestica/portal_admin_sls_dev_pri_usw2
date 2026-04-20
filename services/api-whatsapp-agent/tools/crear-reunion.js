import axios from 'axios';
import { randomUUID, randomBytes } from 'crypto';
import { getCalendarAccessToken, buildCalendarApiUrl, mapGoogleEventToMeetEvent } from '../../../helpers/google-calendar-auth.js';

const FLAMINGO_COLOR_ID = '4';
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Sin caracteres ambiguos (I, O, 0, 1)

/**
 * @description Genera un código único de 8 caracteres para identificar el evento del cliente.
 * @returns {string} Código alfanumérico en mayúsculas.
 */
function generarCodigoEvento() {
  const bytes = randomBytes(8);
  return Array.from(bytes)
    .map((b) => CODE_CHARS[b % CODE_CHARS.length])
    .join('')
    .slice(0, 8);
}
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

const DESTINO_LABEL = {
  bariloche: 'Bariloche',
  camboriu: 'Camboriú',
};

/**
 * @description Crea una reunión de Google Meet en el calendario de Giras Indómito.
 *
 * @param {object} params
 * @param {string} params.nombreCliente - Nombre del apoderado.
 * @param {string} [params.emailCliente] - Email opcional del cliente.
 * @param {string} params.fechaSugerida - Fecha en formato YYYY-MM-DD.
 * @param {string} params.horaSugerida - Hora en formato HH:MM (America/Santiago).
 * @param {string} [params.destino] - Destino de interés (ej: 'bariloche', 'camboriu').
 * @returns {Promise<{meetLink: string, eventId: string, codigoEvento: string, fecha: string, hora: string}>}
 */
export async function crearReunion({ nombreCliente, emailCliente, fechaSugerida, horaSugerida, destino }) {
  const { GOOGLE_CALENDAR_ID = 'primary', TIMEZONE = 'America/Santiago' } = process.env;
  const accessToken = await getCalendarAccessToken();
  const codigoEvento = generarCodigoEvento();

  const guests = emailCliente ? [{ email: emailCliente }] : [];
  const destinoLabel = destino ? (DESTINO_LABEL[destino] ?? destino) : null;
  const summaryDestino = destinoLabel ? ` | ${destinoLabel}` : '';

  const eventBody = {
    summary: `Agente — ${nombreCliente}${summaryDestino} [${codigoEvento}]`,
    description: `Reunión informativa sobre giras de estudio con el apoderado ${nombreCliente}.${destinoLabel ? ` Destino de interés: ${destinoLabel}.` : ''}`,
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

  const url = buildCalendarApiUrl(GOOGLE_CALENDAR_ID, null, { conferenceDataVersion: '1', sendUpdates: 'all' });

  let createdEvent;
  try {
    const response = await axios.post(url, eventBody, {
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
    codigoEvento,
    fecha: mapped.date,
    hora: mapped.startTime,
  };
}
