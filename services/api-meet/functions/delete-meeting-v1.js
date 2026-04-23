import axios from '../../../libs/axios.js';
import { standardMiddleware } from '../../../libs/middleware/index.js';
import { success, unsuccessful } from '../../../helpers/responses.js';
import { broadcastToScope, SCOPES } from '../../../libs/websocket.js';
import { getCalendarAccessToken, buildCalendarApiUrl } from '../../../helpers/google-calendar-auth.js';
import { getAllFcmTokens, sendFcmPush } from '../helpers/send-fcm-push.js';
import { deleteReminders } from '../helpers/manage-reminders.js';

const ACTION = 'Eliminar reunión';

/**
 * Lambda handler: elimina un evento de Google Calendar por su ID.
 */
const baseHandler = async (event) => {
  const eventId = event.pathParameters?.eventId;

  if (!eventId) {
    return unsuccessful(400, { message: 'El parámetro eventId es requerido.' }, ACTION);
  }

  const { GOOGLE_CALENDAR_ID = 'primary' } = process.env;

  const accessToken = await getCalendarAccessToken();
  const url = buildCalendarApiUrl(GOOGLE_CALENDAR_ID, eventId, { sendUpdates: 'all' });

  await axios.delete(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  // Notificar por WebSocket
  await broadcastToScope(SCOPES.CALENDAR, {
    type: 'meeting_deleted',
    meetingId: eventId,
  });

  // Push inmediato + eliminar recordatorios programados
  try {
    const tokens = await getAllFcmTokens();
    if (tokens.length) {
      await sendFcmPush({
        tokens,
        title: 'Reunión cancelada',
        body: 'Una reunión ha sido eliminada del calendario.',
        data: { eventId },
      });
    }
    await deleteReminders(eventId);
  } catch (err) {
    console.error('[PUSH] Error al enviar notificación o eliminar recordatorio:', err.message);
  }

  return success(200, { Item: { id: eventId } }, ACTION, { eventId });
};

export const main = standardMiddleware(baseHandler);
