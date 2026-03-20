import * as httpClient from '../../../libs/axios.js';
import { getCalendarAccessToken, buildCalendarApiUrl } from '../../../helpers/google-calendar-auth.js';

/**
 * @description Elimina una reunión del calendario de Giras Indómito.
 * Usar solo con confirmación explícita del cliente.
 *
 * @param {object} params
 * @param {string} params.eventId - ID del evento a eliminar.
 * @returns {Promise<{eliminada: boolean}>}
 */
export async function eliminarReunion({ eventId }) {
  const { GOOGLE_CALENDAR_ID = 'primary' } = process.env;
  const accessToken = await getCalendarAccessToken();

  const url = buildCalendarApiUrl(GOOGLE_CALENDAR_ID, eventId);
  try {
    await httpClient.del(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  } catch (err) {
    console.error('[ELIMINAR-REUNION] Google Calendar error:', JSON.stringify(err.response?.data ?? err.message));
    throw err;
  }

  return { eliminada: true };
}
