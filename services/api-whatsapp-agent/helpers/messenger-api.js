import * as httpClient from '../../../libs/axios.js';
import { getParameterValue } from '../../../libs/parameter-store.js';

/** Cache del page access token con TTL de 1 hora. */
let _cachedToken = null;
let _tokenExpiry = 0;
const TOKEN_CACHE_TTL = 3600;

const GRAPH_API_VERSION = 'v21.0';
const MESSAGES_URL = `https://graph.facebook.com/${GRAPH_API_VERSION}/me/messages`;

/**
 * @description Carga el Page Access Token desde Parameter Store.
 * @returns {Promise<string>}
 */
async function getPageAccessToken() {
  const now = Math.floor(Date.now() / 1000);
  if (_cachedToken && _tokenExpiry > now) return _cachedToken;
  const secretJson = await getParameterValue(process.env.META_PAGE_SECRET_KEY);
  _cachedToken = JSON.parse(secretJson).page_access_token;
  _tokenExpiry = now + TOKEN_CACHE_TTL;
  return _cachedToken;
}

/**
 * @description Envía un mensaje de texto por Messenger o Instagram (misma API, mismo token).
 * @param {string} recipientId - PSID del destinatario (Messenger) o Instagram User ID.
 * @param {string} text - Texto del mensaje.
 */
export async function sendMetaTextMessage(recipientId, text) {
  const token = await getPageAccessToken();
  try {
    await httpClient.post(
      MESSAGES_URL,
      { recipient: { id: recipientId }, message: { text } },
      { params: { access_token: token } }
    );
  } catch (err) {
    const metaError = err.response?.data;
    console.error('[MESSENGER-API] Error al enviar mensaje:', JSON.stringify(metaError ?? err.message));
    throw err;
  }
}
