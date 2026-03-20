import * as httpClient from '../../../libs/axios.js';
import { getParameterValue } from '../../../libs/parameter-store.js';

/** Cache de credenciales en memoria para la vida útil de la invocación Lambda. */
let _cachedCreds = null;

const GRAPH_API_VERSION = 'v21.0';

/**
 * @description Carga las credenciales de WhatsApp Cloud API desde Parameter Store.
 * Mantiene caché en memoria para evitar múltiples llamadas en la misma invocación.
 * @returns {Promise<{accessToken: string, phoneNumberId: string}>}
 */
async function getCredentials() {
  if (_cachedCreds) return _cachedCreds;
  const secretJson = await getParameterValue(process.env.WHATSAPP_SECRET_KEY);
  const { access_token, phone_number_id } = JSON.parse(secretJson);
  _cachedCreds = { accessToken: access_token, phoneNumberId: phone_number_id };
  return _cachedCreds;
}

/**
 * @description Construye la URL base de la Graph API para enviar mensajes.
 * @param {string} phoneNumberId
 * @returns {string}
 */
function buildMessagesUrl(phoneNumberId) {
  return `https://graph.facebook.com/${GRAPH_API_VERSION}/${phoneNumberId}/messages`;
}

/**
 * @description Envía indicador "está escribiendo" al destinatario.
 * @param {string} to - Número del destinatario con código de país.
 */
export async function sendTypingIndicator(to) {
  const { accessToken, phoneNumberId } = await getCredentials();
  await httpClient.post(
    buildMessagesUrl(phoneNumberId),
    { messaging_product: 'whatsapp', to, status: 'typing' },
    { headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' } }
  );
}

/**
 * @description Envía un mensaje de texto por WhatsApp.
 * @param {string} to - Número de teléfono del destinatario con código de país.
 * @param {string} text - Texto del mensaje.
 */
export async function sendTextMessage(to, text) {
  const { accessToken, phoneNumberId } = await getCredentials();
  await httpClient.post(
    buildMessagesUrl(phoneNumberId),
    {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'text',
      text: { body: text },
    },
    { headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' } }
  );
}

/**
 * @description Sube un archivo PDF a la Media API de WhatsApp y retorna su media_id.
 * @param {Buffer} buffer - Contenido binario del archivo.
 * @param {string} filename - Nombre del archivo.
 * @param {string} [mimeType='application/pdf'] - Tipo MIME del archivo.
 * @returns {Promise<string>} media_id asignado por Meta.
 */
export async function uploadMedia(buffer, filename, mimeType = 'application/pdf') {
  const { accessToken, phoneNumberId } = await getCredentials();

  const formData = new FormData();
  formData.append('messaging_product', 'whatsapp');
  formData.append('type', mimeType);
  formData.append('file', new Blob([buffer], { type: mimeType }), filename);

  const response = await httpClient.post(
    `https://graph.facebook.com/${GRAPH_API_VERSION}/${phoneNumberId}/media`,
    formData,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  return response.data.id;
}

/**
 * @description Envía un documento PDF por WhatsApp usando su media_id (subido previamente).
 * @param {string} to - Número del destinatario.
 * @param {string} mediaId - ID del media ya subido a Meta.
 * @param {string} filename - Nombre del archivo que verá el destinatario.
 * @param {string} [caption=''] - Texto opcional que acompaña el documento.
 */
export async function sendDocumentById(to, mediaId, filename, caption = '') {
  const { accessToken, phoneNumberId } = await getCredentials();
  await httpClient.post(
    buildMessagesUrl(phoneNumberId),
    {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'document',
      document: { id: mediaId, filename, caption },
    },
    { headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' } }
  );
}

/**
 * @description Marca un mensaje recibido como leído (muestra el doble check azul).
 * @param {string} messageId - ID del mensaje de WhatsApp a marcar como leído.
 */
export async function markAsRead(messageId) {
  const { accessToken, phoneNumberId } = await getCredentials();
  await httpClient.post(
    buildMessagesUrl(phoneNumberId),
    { messaging_product: 'whatsapp', status: 'read', message_id: messageId },
    { headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' } }
  );
}
