import axios from '../../../libs/axios.js';
import { standardMiddleware } from '../../../libs/middleware/index.js';
import { success, unsuccessful } from '../../../helpers/responses.js';
import { broadcastToScope, SCOPES } from '../../../libs/websocket.js';
import { getCalendarAccessToken, buildCalendarApiUrl, mapGoogleEventToMeetEvent } from '../../../helpers/google-calendar-auth.js';
import { getAllFcmTokens, sendFcmPush } from '../helpers/send-fcm-push.js';
import { deleteReminders, createReminders } from '../helpers/manage-reminders.js';

const ACTION = 'Actualizar reunión';
const FLAMINGO_COLOR_ID = '4';
const NOTIFICATIONS = [
  { method: 'popup', minutes: 60 },
  { method: 'popup', minutes: 15 },
];

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

  const eventBody = {
    summary: title,
    description,
    start: { dateTime: `${date}T${startTime}:00`, timeZone: TIMEZONE },
    end: { dateTime: buildEndDateTime(date, startTime), timeZone: TIMEZONE },
    attendees: guests.map((email) => ({ email })),
    colorId: FLAMINGO_COLOR_ID,
    reminders: { useDefault: false, overrides: NOTIFICATIONS },
    ...(hostSk && { extendedProperties: { shared: { hostSk, hostName: hostName ?? '', hostColor: hostColor ?? '' } } }),
  };

  const url = buildCalendarApiUrl(GOOGLE_CALENDAR_ID, eventId, { sendUpdates: 'all' });

  const { data: updatedEvent } = await axios.put(url, eventBody, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const meeting = mapGoogleEventToMeetEvent(updatedEvent);

  // Notificar por WebSocket
  await broadcastToScope(SCOPES.CALENDAR, {
    type: 'meeting_updated',
    meeting,
  });

  // Push inmediato + reprogramar recordatorios con el nuevo horario
  try {
    const tokens = await getAllFcmTokens();
    if (tokens.length) {
      await sendFcmPush({
        tokens,
        title: `Reunión actualizada: ${meeting.title}`,
        body: `Nuevo horario: ${meeting.date} a las ${meeting.startTime}`,
        data: { meetLink: meeting.googleMeetLink ?? '', eventId: meeting.id },
      });
    }
    await deleteReminders(eventId);
    await createReminders({
      eventId: meeting.id,
      date: meeting.date,
      startTime: meeting.startTime,
      title: meeting.title,
      meetLink: meeting.googleMeetLink,
    });
  } catch (err) {
    console.error('[PUSH] Error al enviar notificación o reprogramar recordatorio:', err.message);
  }

  return success(200, { Item: meeting }, ACTION, { eventId });
};

export const main = standardMiddleware(baseHandler);
