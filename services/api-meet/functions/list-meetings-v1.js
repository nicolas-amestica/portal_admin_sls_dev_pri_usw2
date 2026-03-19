import axios from 'axios';
import { standardMiddleware } from '../../../libs/middleware/index.js';
import { success, unsuccessful } from '../../../helpers/responses.js';
import {
  getCalendarAccessToken,
  buildCalendarApiUrl,
  mapGoogleEventToMeetEvent,
} from '../../../helpers/google-calendar-auth.js';

const ACTION = 'Listar reuniones';

/**
 * Lambda handler: lista todos los eventos del calendario para el mes y año indicados.
 *
 * Query params esperados:
 *   - year   {number}  Año (ej: 2026)
 *   - month  {number}  Mes 1-indexado (ej: 3 para marzo)
 */
const baseHandler = async (event) => {
  const { year, month } = event.queryStringParameters || {};

  if (!year || !month) {
    return unsuccessful(400, { message: 'Los parámetros year y month son requeridos.' }, ACTION);
  }

  const yearNum = parseInt(year, 10);
  const monthNum = parseInt(month, 10);

  if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
    return unsuccessful(400, { message: 'Parámetros year y month deben ser números válidos.' }, ACTION);
  }

  const { GOOGLE_CALENDAR_ID = 'primary', TIMEZONE = 'America/Santiago' } = process.env;

  // Rango del mes completo en UTC para compatibilidad con Google Calendar API
  const timeMin = new Date(Date.UTC(yearNum, monthNum - 1, 1)).toISOString();
  const timeMax = new Date(Date.UTC(yearNum, monthNum, 1)).toISOString();

  const accessToken = await getCalendarAccessToken();

  const url = buildCalendarApiUrl(GOOGLE_CALENDAR_ID, null, {
    timeMin,
    timeMax,
    timeZone: TIMEZONE,
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '250',
  });

  const { data } = await axios.get(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const meetings = (data.items || [])
    .filter((e) => e.start?.dateTime)  // Solo eventos con hora (no día completo)
    .map(mapGoogleEventToMeetEvent);

  return success(200, { Items: meetings, Count: meetings.length }, ACTION, { year, month });
};

export const main = standardMiddleware(baseHandler);
