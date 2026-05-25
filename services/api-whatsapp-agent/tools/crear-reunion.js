import axios from 'axios';
import { randomUUID, randomBytes } from 'crypto';
import { getCalendarAccessToken, buildCalendarApiUrl, mapGoogleEventToMeetEvent } from '../../../helpers/google-calendar-auth.js';
import { buildAttendeesForNewMeet } from '../../../helpers/meet-default-guest-attendees.js';
import { buildNewAgentMeetingSharedProperties } from '../../../helpers/meet-default-host-presenter.js';
import { buildEndDateTime, validateMeetingSlot } from '../helpers/meeting-scheduling-rules.js';
import { listarReuniones } from './listar-reuniones.js';

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

const DESTINO_LABEL = {
  bariloche: 'Bariloche',
  camboriu: 'Camboriú',
};

/**
 * @description Busca eventos futuros del cliente por número de teléfono usando extendedProperties.private.
 * Permite encontrar reuniones aunque la sesión en DynamoDB esté vacía o haya expirado.
 *
 * @param {string} calendarId
 * @param {string} phone - Número normalizado sin '+' (ej: '56959139687').
 * @param {string} accessToken
 * @returns {Promise<object[]>} Lista de eventos encontrados.
 */
export async function buscarEventosPorTelefono(calendarId, phone, accessToken) {
  const url = buildCalendarApiUrl(calendarId, null, {
    privateExtendedProperty: `phoneNumber=${phone}`,
    singleEvents: 'true',
    orderBy: 'startTime',
    timeMin: new Date().toISOString(),
  });
  const response = await axios.get(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  return response.data.items || [];
}

/**
 * @description Crea una reunión de Google Meet en el calendario de Giras Indómito.
 *
 * @param {object} params
 * @param {string} params.nombreCliente - Nombre del apoderado.
 * @param {string} [params.emailCliente] - Email opcional del cliente.
 * @param {string} params.fechaSugerida - Fecha en formato YYYY-MM-DD.
 * @param {string} params.horaSugerida - Hora en formato HH:MM (America/Santiago).
 * @param {string} [params.destino] - Destino de interés (ej: 'bariloche', 'camboriu').
 * @param {string} [params.phoneNumber] - Teléfono normalizado sin '+'. Se almacena como propiedad privada del evento.
 * @returns {Promise<{meetLink?: string, eventId?: string, codigoEvento?: string, fecha?: string, hora?: string, exito?: boolean, mensaje?: string, horariosDisponibles?: string[]}>}
 */
export async function crearReunion({ nombreCliente, emailCliente, fechaSugerida, horaSugerida, destino, phoneNumber }) {
  const { GOOGLE_CALENDAR_ID = 'primary', TIMEZONE = 'America/Santiago' } = process.env;

  const { reuniones } = await listarReuniones({ fechaInicio: fechaSugerida, fechaFin: fechaSugerida });
  const slotCheck = validateMeetingSlot({
    date: fechaSugerida,
    time: horaSugerida,
    existingEvents: reuniones,
  });

  if (!slotCheck.valid) {
    return {
      exito: false,
      mensaje: slotCheck.reason,
      horariosDisponibles: slotCheck.availableSlots ?? [],
    };
  }

  const accessToken = await getCalendarAccessToken();
  const codigoEvento = generarCodigoEvento();

  const guests = buildAttendeesForNewMeet(emailCliente);
  const destinoLabel = destino ? (DESTINO_LABEL[destino] ?? destino) : null;
  const summaryDestino = destinoLabel ? ` | ${destinoLabel}` : '';

  const eventBody = {
    summary: `AG — ${nombreCliente}${summaryDestino} [${codigoEvento}]`,
    description: `Reunión informativa sobre giras de estudio con el apoderado ${nombreCliente}.${destinoLabel ? ` Destino de interés: ${destinoLabel}.` : ''}`,
    start: { dateTime: `${fechaSugerida}T${horaSugerida}:00`, timeZone: TIMEZONE },
    end: { dateTime: buildEndDateTime(fechaSugerida, horaSugerida), timeZone: TIMEZONE },
    attendees: guests,
    colorId: FLAMINGO_COLOR_ID,
    reminders: { useDefault: false, overrides: NOTIFICATIONS },
    extendedProperties: {
      ...(phoneNumber && { private: { phoneNumber } }),
      shared: buildNewAgentMeetingSharedProperties(phoneNumber),
    },
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
