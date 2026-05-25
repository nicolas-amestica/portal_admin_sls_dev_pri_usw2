import axios from '../../../libs/axios.js';
import { standardMiddleware } from '../../../libs/middleware/index.js';
import { success, unsuccessful } from '../../../helpers/responses.js';
import { getCalendarAccessToken, buildCalendarApiUrl, mapGoogleEventToMeetEvent } from '../../../helpers/google-calendar-auth.js';
import { mergeAttendeesEnsuringDefaults } from '../../../helpers/meet-default-guest-attendees.js';

const ACTION = 'Actualizar reunión';
const FLAMINGO_COLOR_ID = '4';
const NOTIFICATIONS = [
  { method: 'popup', minutes: 60 },
  { method: 'popup', minutes: 15 },
];

/**
 * @description Combina propiedades extendidas del evento existente con los datos del portal.
 * Evita borrar `private` (p. ej. teléfono del agente IA) ni `shared.agent` al actualizar anfitrión.
 * @param {object|undefined} existingExt - `extendedProperties` del evento en Google Calendar.
 * @param {string|null} hostSk
 * @param {string|null} hostName
 * @param {string|null} hostColor
 * @returns {object} Objeto `extendedProperties` para el cuerpo del update o `{}` si no aplica.
 */
function mergeMeetingExtendedProperties(existingExt, hostSk, hostName, hostColor) {
  const prev = existingExt && typeof existingExt === 'object' ? existingExt : {};
  /** @type {Record<string, string>} */
  let prevPrivate = {};
  if (prev.private && typeof prev.private === 'object') {
    prevPrivate = { ...prev.private };
  }

  /** @type {Record<string, string>} */
  const prevShared = prev.shared && typeof prev.shared === 'object' ? { ...prev.shared } : {};

  const shared =
    hostSk != null && hostSk !== ''
      ? {
          ...prevShared,
          hostSk,
          hostName: hostName ?? '',
          hostColor: hostColor ?? '',
        }
      : { ...prevShared };

  /** @type {object} */
  const out = {};
  if (Object.keys(prevPrivate).length > 0) {
    out.private = prevPrivate;
  }
  if (Object.keys(shared).length > 0) {
    out.shared = shared;
  }

  return out;
}

/**
 * Suma tres horas a la fecha+hora dadas.
 */
function buildEndDateTime(date, time) {
  const [h, m] = time.split(':').map(Number);
  let newH = h + 3;
  let newDate = date;

  if (newH >= 24) {
    newH = newH - 24;
    const d = new Date(`${date}T00:00:00`);
    d.setDate(d.getDate() + 1);
    newDate = d.toISOString().slice(0, 10);
  }

  return `${newDate}T${String(newH).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
}

/**
 * Lambda handler: actualiza un evento de Google Calendar existente.
 */
const baseHandler = async (event) => {
  const eventId = event.pathParameters?.eventId;
  const { title, date, startTime, description = '', guests = [], hostSk = null, hostName = null, hostColor = null } = event.body;

  if (!eventId) {
    return unsuccessful(400, { message: 'El parámetro eventId es requerido.' }, ACTION);
  }

  if (!title || !date || !startTime) {
    return unsuccessful(400, { message: 'Los campos title, date y startTime son requeridos.' }, ACTION);
  }

  const { GOOGLE_CALENDAR_ID = 'primary', TIMEZONE = 'America/Santiago' } = process.env;

  const accessToken = await getCalendarAccessToken();

  const getExistingUrl = buildCalendarApiUrl(GOOGLE_CALENDAR_ID, eventId);
  let existingEvent;
  try {
    const existingRes = await axios.get(getExistingUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    existingEvent = existingRes.data;
  } catch (err) {
    const msg = err.response?.status === 404 ? 'La reunión no existe o ya fue eliminada.' : 'No se pudo obtener la reunión en Google Calendar.';
    return unsuccessful(err.response?.status === 404 ? 404 : 502, { message: `${msg} ${err.message || ''}` }, ACTION);
  }

  const extendedPropertiesMerged = mergeMeetingExtendedProperties(existingEvent.extendedProperties, hostSk, hostName, hostColor);

  const eventBody = {
    summary: title,
    description,
    start: { dateTime: `${date}T${startTime}:00`, timeZone: TIMEZONE },
    end: { dateTime: buildEndDateTime(date, startTime), timeZone: TIMEZONE },
    attendees: mergeAttendeesEnsuringDefaults(existingEvent.attendees, guests),
    colorId: FLAMINGO_COLOR_ID,
    reminders: { useDefault: false, overrides: NOTIFICATIONS },
    ...(Object.keys(extendedPropertiesMerged).length > 0 ? { extendedProperties: extendedPropertiesMerged } : {}),
  };

  const url = buildCalendarApiUrl(GOOGLE_CALENDAR_ID, eventId, { sendUpdates: 'all' });

  const { data: updatedEvent } = await axios.put(url, eventBody, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const meeting = mapGoogleEventToMeetEvent(updatedEvent);

  return success(200, { Item: meeting }, ACTION, { eventId });
};

export const main = standardMiddleware(baseHandler);
