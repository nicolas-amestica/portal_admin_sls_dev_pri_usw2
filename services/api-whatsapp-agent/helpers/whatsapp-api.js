import axios from 'axios';
import { getParameterValue } from '../../../libs/parameter-store.js';

/** Cache de credenciales en memoria para la vida útil de la invocación Lambda. */
let _cachedCreds = null;

const GRAPH_API_VERSION = 'v21.0';

/**
 * @description Carga las credenciales de WhatsApp Cloud API desde Secrets Manager.
 * Mantiene caché en memoria para evitar múltiples llamadas al secreto en la misma invocación.
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
 * @description Envía un mensaje de texto por WhatsApp.
 * @param {string} to - Número de teléfono del destinatario con código de país (ej: +56912345678).
 * @param {string} text - Texto del mensaje.
 */
export async function sendTextMessage(to, text) {
  const { accessToken, phoneNumberId } = await getCredentials();

  await axios.post(
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
 * @description Envía un documento PDF por WhatsApp usando una URL pública o prefirmada.
 * @param {string} to - Número de teléfono del destinatario.
 * @param {string} url - URL del documento (presigned URL de S3 o pública).
 * @param {string} filename - Nombre del archivo que verá el destinatario.
 * @param {string} [caption] - Texto opcional que acompaña el documento.
 */
export async function sendDocumentMessage(to, url, filename, caption = '') {
  const { accessToken, phoneNumberId } = await getCredentials();

  await axios.post(
    buildMessagesUrl(phoneNumberId),
    {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'document',
      document: { link: url, filename, caption },
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

  await axios.post(
    buildMessagesUrl(phoneNumberId),
    {
      messaging_product: 'whatsapp',
      status: 'read',
      message_id: messageId,
    },
    { headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' } }
  );
}
