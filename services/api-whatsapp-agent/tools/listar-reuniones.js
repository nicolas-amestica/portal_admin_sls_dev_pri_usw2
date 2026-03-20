import * as httpClient from '../../../libs/axios.js';
import { getCalendarAccessToken, buildCalendarApiUrl, mapGoogleEventToMeetEvent } from '../../../helpers/google-calendar-auth.js';

/**
 * @description Lista las reuniones del calendario de Giras Indómito en un rango de fechas.
 * Usar antes de proponer horarios para verificar disponibilidad.
 *
 * @param {object} params
 * @param {string} params.fechaInicio - Fecha de inicio del rango en formato YYYY-MM-DD.
 * @param {string} params.fechaFin - Fecha de fin del rango en formato YYYY-MM-DD.
 * @returns {Promise<{reuniones: Array<{id: string, title: string, date: string, startTime: string, endTime: string, googleMeetLink: string|null}>}>}
 */
export async function listarReuniones({ fechaInicio, fechaFin }) {
  const { GOOGLE_CALENDAR_ID = 'primary' } = process.env;
  const accessToken = await getCalendarAccessToken();

  const url = buildCalendarApiUrl(GOOGLE_CALENDAR_ID, null, {
    timeMin: `${fechaInicio}T00:00:00-03:00`,
    timeMax: `${fechaFin}T23:59:59-03:00`,
    singleEvents: 'true',
    orderBy: 'startTime',
  });

  let response;
  try {
    response = await httpClient.get(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  } catch (err) {
    console.error('[LISTAR-REUNIONES] Google Calendar error:', JSON.stringify(err.response?.data ?? err.message));
    throw err;
  }

  const reuniones = (response.data.items || []).map(mapGoogleEventToMeetEvent);
  return { reuniones };
}
