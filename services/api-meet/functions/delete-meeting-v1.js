import axios from '../../../libs/axios.js';
import { standardMiddleware } from '../../../libs/middleware/index.js';
import { success, unsuccessful } from '../../../helpers/responses.js';
import { getCalendarAccessToken, buildCalendarApiUrl } from '../../../helpers/google-calendar-auth.js';

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
  const url = buildCalendarApiUrl(GOOGLE_CALENDAR_ID, eventId);

  await axios.delete(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  return success(200, { Item: { id: eventId } }, ACTION, { eventId });
};

export const main = standardMiddleware(baseHandler);
