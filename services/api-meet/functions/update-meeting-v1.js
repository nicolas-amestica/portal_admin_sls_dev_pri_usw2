import axios from '../../../libs/axios.js';
import { standardMiddleware } from '../../../libs/middleware/index.js';
import { success, unsuccessful } from '../../../helpers/responses.js';
import { getCalendarAccessToken, buildCalendarApiUrl, mapGoogleEventToMeetEvent } from '../../../helpers/google-calendar-auth.js';

const ACTION = 'Actualizar reunión';
const FLAMINGO_COLOR_ID = '4';
const NOTIFICATIONS = [
  { method: 'popup', minutes: 60 },
  { method: 'popup', minutes: 15 },
];

/**
 * Suma una hora a la fecha+hora dadas.
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
 * Lambda handler: actualiza un evento de Google Calendar existente.
 */
const baseHandler = async (event) => {
  const eventId = event.pathParameters?.eventId;
  const { title, date, startTime, description = '', guests = [], hostSk = null, hostName = null } = event.body;

  if (!eventId) {
    return unsuccessful(400, { message: 'El parámetro eventId es requerido.' }, ACTION);
  }

  if (!title || !date || !startTime) {
    return unsuccessful(400, { message: 'Los campos title, date y startTime son requeridos.' }, ACTION);
  }

  const { GOOGLE_CALENDAR_ID = 'primary', TIMEZONE = 'America/Santiago' } = process.env;

  const accessToken = await getCalendarAccessToken();

  const eventBody = {
    summary: title,
    description,
    start: { dateTime: `${date}T${startTime}:00`, timeZone: TIMEZONE },
    end: { dateTime: buildEndDateTime(date, startTime), timeZone: TIMEZONE },
    attendees: guests.map((email) => ({ email })),
    colorId: FLAMINGO_COLOR_ID,
    reminders: { useDefault: false, overrides: NOTIFICATIONS },
    ...(hostSk && { extendedProperties: { shared: { hostSk, hostName: hostName ?? '' } } }),
  };

  const url = buildCalendarApiUrl(GOOGLE_CALENDAR_ID, eventId);

  const { data: updatedEvent } = await axios.put(url, eventBody, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  return success(200, { Item: mapGoogleEventToMeetEvent(updatedEvent) }, ACTION, { eventId });
};

export const main = standardMiddleware(baseHandler);
