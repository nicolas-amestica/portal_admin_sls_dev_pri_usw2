import axios from '../../../libs/axios.js';
import { standardMiddleware } from '../../../libs/middleware/index.js';
import { success, unsuccessful } from '../../../helpers/responses.js';
import { getCalendarAccessToken, buildCalendarApiUrl, mapGoogleEventToMeetEvent } from '../../../helpers/google-calendar-auth.js';

const ACTION = 'Listar reuniones';

/**
 * Margen alrededor del mes UTC nominal para incluir reuniones tarde/noche en America/Santiago
 * cuyo instante UTC cae fuera del rango mensual cuando se arma timeMin/timeMax sólo en UTC.
 * (Ej.: 30 abril 20:00 CL puede ser 1 mayo 00:00 UTC.)
 */
const RANGE_CUSHION_MS = 96 * 60 * 60 * 1000;

/**
 * @description Indica si la fecha local YYYY-MM-DD del evento cae en el año/mes solicitados por el cliente.
 * @param {string} meetDate - Fecha desde mapGoogleEventToMeetEvent (YYYY-MM-DD).
 * @param {number} yearNum
 * @param {number} monthNum - 1-12 (igual query del portal).
 */
function belongsToGregorianCalendarMonth(meetDate, yearNum, monthNum) {
  if (!meetDate || meetDate.length < 10) return false;
  const y = parseInt(meetDate.slice(0, 4), 10);
  const m = parseInt(meetDate.slice(5, 7), 10);
  return y === yearNum && m === monthNum;
}

/**
 * Lambda handler: lista todos los eventos del calendario para el mes y año indicados.
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

  // Rangos sólo UTC desalinean reuniones tardías locales (véase RANGE_CUSHION_MS).
  const nominalMonthStartUtcMs = Date.UTC(yearNum, monthNum - 1, 1);
  const nominalNextMonthStartUtcMs = Date.UTC(yearNum, monthNum, 1);
  const timeMin = new Date(nominalMonthStartUtcMs - RANGE_CUSHION_MS).toISOString();
  const timeMax = new Date(nominalNextMonthStartUtcMs + RANGE_CUSHION_MS).toISOString();

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
    .filter((e) => e.start?.dateTime)
    .map((e) => mapGoogleEventToMeetEvent(e))
    .filter((m) => belongsToGregorianCalendarMonth(m.date, yearNum, monthNum));

  return success(200, { Items: meetings, Count: meetings.length }, ACTION, { year, month });
};

export const main = standardMiddleware(baseHandler);
