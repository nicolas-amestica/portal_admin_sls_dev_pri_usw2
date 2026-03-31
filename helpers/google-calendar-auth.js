import * as httpClient from '../libs/axios.js';
import { getParameterValue } from '../libs/parameter-store.js';

/** Cache del access token del calendario en memoria. */
let _cachedToken = null;
let _tokenExpiry = 0;

/** Cache del access token del anfitrión de Meet en memoria. */
let _cachedHostToken = null;
let _hostTokenExpiry = 0;

/**
 * Intercambia un refresh token de Google OAuth2 por un access token.
 *
 * @param {string} client_id
 * @param {string} client_secret
 * @param {string} refresh_token
 * @returns {Promise<{access_token: string, expires_in: number}>}
 */
async function exchangeRefreshToken(client_id, client_secret, refresh_token) {
  const response = await httpClient.post(
    'https://oauth2.googleapis.com/token',
    new URLSearchParams({ grant_type: 'refresh_token', client_id, client_secret, refresh_token }).toString(),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );
  return response.data;
}

/**
 * Obtiene un access token válido para la Google Calendar API.
 * Usa el flujo OAuth2 de refresh token con las credenciales del dueño del calendario.
 *
 * El secreto en SSM debe tener la forma:
 * { "client_id": "...", "client_secret": "...", "refresh_token": "..." }
 *
 * @returns {Promise<string>} Access token de OAuth2.
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
    data = await exchangeRefreshToken(client_id, client_secret, refresh_token);
  } catch (err) {
    console.error('[OAUTH-TOKEN] Error al refrescar token de Calendar:', JSON.stringify(err.response?.data ?? err.message));
    throw err;
  }

  _cachedToken = data.access_token;
  _tokenExpiry = nowSeconds + (data.expires_in ?? 3600);

  return _cachedToken;
}

/**
 * Obtiene un access token válido para la cuenta anfitriona de Google Meet.
 * Usa credenciales independientes de la cuenta coordinadora.
 *
 * El secreto en SSM debe tener la forma:
 * { "client_id": "...", "client_secret": "...", "refresh_token": "..." }
 *
 * @returns {Promise<string>} Access token de OAuth2.
 */
export async function getMeetHostAccessToken() {
  const nowSeconds = Math.floor(Date.now() / 1000);

  if (_cachedHostToken && _hostTokenExpiry > nowSeconds + 60) {
    return _cachedHostToken;
  }

  const { GOOGLE_MEET_HOST_OAUTH_SECRET_KEY } = process.env;
  if (!GOOGLE_MEET_HOST_OAUTH_SECRET_KEY) {
    throw new Error('Variable GOOGLE_MEET_HOST_OAUTH_SECRET_KEY es requerida.');
  }

  const credentialsJson = await getParameterValue(GOOGLE_MEET_HOST_OAUTH_SECRET_KEY);
  const { client_id, client_secret, refresh_token } = JSON.parse(credentialsJson);

  let data;
  try {
    data = await exchangeRefreshToken(client_id, client_secret, refresh_token);
  } catch (err) {
    console.error('[OAUTH-TOKEN] Error al refrescar token de Meet host:', JSON.stringify(err.response?.data ?? err.message));
    throw err;
  }

  _cachedHostToken = data.access_token;
  _hostTokenExpiry = nowSeconds + (data.expires_in ?? 3600);

  return _cachedHostToken;
}

/**
 * Crea un espacio de Google Meet con acceso abierto bajo la cuenta anfitriona.
 * Al ser dueña del espacio, esa cuenta obtiene controles de anfitrión al entrar
 * sin importar el orden de entrada de los participantes.
 *
 * @param {string} hostAccessToken - Access token de la cuenta anfitriona.
 * @returns {Promise<{meetingUri: string, meetingCode: string}>}
 */
export async function createMeetSpace(hostAccessToken) {
  const response = await httpClient.post(
    'https://meet.googleapis.com/v2/spaces',
    { config: { accessType: 'OPEN' } },
    { headers: { Authorization: `Bearer ${hostAccessToken}` } }
  );
  return {
    meetingUri: response.data.meetingUri,
    meetingCode: response.data.meetingCode,
  };
}

/**
 * Construye una URL de la Google Calendar API para el calendario especificado.
 *
 * @param {string} calendarId - ID del calendario (default: 'primary').
 * @param {string} [eventId] - ID del evento (opcional).
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
 * Mapea un evento de Google Calendar al formato interno MeetEvent.
 *
 * @param {object} event - Evento de Google Calendar API.
 * @returns {object} Evento en formato MeetEvent.
 */
export function mapGoogleEventToMeetEvent(event) {
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
    createdAt: event.created || new Date().toISOString(),
  };
}
