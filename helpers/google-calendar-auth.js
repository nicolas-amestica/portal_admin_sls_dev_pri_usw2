import * as httpClient from '../libs/axios.js';
import { getParameterValue } from '../libs/parameter-store.js';

/** Cache del access token en memoria para la vida útil de la invocación Lambda. */
let _cachedToken = null;
let _tokenExpiry = 0;

/**
 * Obtiene un access token válido para la Google Calendar API.
 * Usa el flujo OAuth2 de refresh token con las credenciales del dueño del calendario.
 * Mantiene caché en memoria para evitar múltiples intercambios en la misma invocación.
 *
 * El secreto debe contener un JSON con la forma:
 * { "client_id": "...", "client_secret": "...", "refresh_token": "..." }
 *
 * @returns {Promise<string>} Access token de OAuth2 de Google.
 * @throws {Error} Si no se puede obtener el secreto o el intercambio de token falla.
 */
export async function getCalendarAccessToken() {
  const nowSeconds = Math.floor(Date.now() / 1000);

  if (_cachedToken && _tokenExpiry > nowSeconds + 60) {
    return _cachedToken;
  }

  const { GOOGLE_CALENDAR_OAUTH_SECRET_KEY } = process.env;

  if (!GOOGLE_CALENDAR_OAUTH_SECRET_KEY) {
    throw new Error('Variable GOOGLE_CALENDAR_OAUTH_SECRET_KEY es requerida.');
  }

  const credentialsJson = await getParameterValue(GOOGLE_CALENDAR_OAUTH_SECRET_KEY);
  const { client_id, client_secret, refresh_token } = JSON.parse(credentialsJson);

  let data;
  try {
    const response = await httpClient.post(
      'https://oauth2.googleapis.com/token',
      new URLSearchParams({
        grant_type: 'refresh_token',
        client_id,
        client_secret,
        refresh_token,
      }).toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    data = response.data;
  } catch (err) {
    console.error('[OAUTH-TOKEN] Error al refrescar token:', JSON.stringify(err.response?.data ?? err.message));
    throw err;
  }

  _cachedToken = data.access_token;
  _tokenExpiry = nowSeconds + (data.expires_in ?? 3600);

  return _cachedToken;
}

/**
 * Construye una URL de la Google Calendar API para el calendario especificado.
 *
 * @param {string} calendarId - ID del calendario (default: 'primary').
 * @param {string} [eventId] - ID del evento (opcional, para operaciones sobre un evento específico).
 * @param {Record<string, string>} [queryParams] - Parámetros de query opcionales.
 * @returns {string} URL completa de la API.
 */
export function buildCalendarApiUrl(calendarId, eventId, queryParams = {}) {
  const base = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`;
  const url = eventId ? `${base}/${encodeURIComponent(eventId)}` : base;
  const params = new URLSearchParams(queryParams);
  return params.toString() ? `${url}?${params.toString()}` : url;
}

/**
 * Crea un espacio de Google Meet via Meet REST API y lo configura con acceso abierto.
 * Los espacios creados así son administrables (a diferencia de los generados por Calendar).
 *
 * Requiere el scope OAuth: https://www.googleapis.com/auth/meetings.space.created
 *
 * @param {string} accessToken - Access token de OAuth2.
 * @returns {Promise<{meetingUri: string, meetingCode: string, hostKey: string|null}>}
 */
export async function createMeetSpace(accessToken) {
  // Crear el espacio
  const createResponse = await httpClient.post(
    'https://meet.googleapis.com/v2/spaces',
    { config: { accessType: 'OPEN' } },
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  const space = createResponse.data;

  // Obtener hostKey (requiere segundo GET ya que POST no siempre lo retorna)
  let hostKey = space?.config?.hostKey ?? null;
  if (!hostKey) {
    try {
      const getResponse = await httpClient.get(
        `https://meet.googleapis.com/v2/spaces/${space.meetingCode}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      hostKey = getResponse.data?.config?.hostKey ?? null;
    } catch (_) {
      // hostKey opcional, no es bloqueante
    }
  }

  return { meetingUri: space.meetingUri, meetingCode: space.meetingCode, hostKey };
}

/**
 * Mapea un evento de Google Calendar al formato interno MeetEvent.
 *
 * @param {object} event - Evento de Google Calendar API.
 * @param {string|null} [hostKey] - Clave de anfitrión de Google Meet (opcional).
 * @returns {object} Evento en formato MeetEvent.
 */
export function mapGoogleEventToMeetEvent(event, hostKey = null) {
  const dateTime = event.start?.dateTime || '';
  const endDateTime = event.end?.dateTime || '';

  return {
    id: event.id,
    title: event.summary || '',
    date: dateTime.slice(0, 10),
    startTime: dateTime.slice(11, 16),
    endTime: endDateTime.slice(11, 16),
    description: event.description || '',
    guests: (event.attendees || [])
      .filter((a) => !a.self)
      .map((a) => a.email),
    googleMeetLink: event.conferenceData?.entryPoints?.find(
      (e) => e.entryPointType === 'video'
    )?.uri ?? null,
    meetingCode: event.conferenceData?.conferenceId ?? null,
    hostKey,
    createdAt: event.created || new Date().toISOString(),
  };
}
