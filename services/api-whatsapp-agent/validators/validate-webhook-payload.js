import { createHmac, timingSafeEqual } from 'crypto';
import { getParameterValue } from '../../../libs/parameter-store.js';

const SECRET_CACHE_TTL = 3600;

/** Cache del app_secret de WhatsApp con TTL de 1 hora. */
let _cachedAppSecret = null;
let _appSecretExpiry = 0;

/** Cache del app_secret de Meta (Instagram/Messenger) con TTL de 1 hora. */
let _cachedMetaAppSecret = null;
let _metaAppSecretExpiry = 0;

/**
 * @description Obtiene el app_secret de WhatsApp desde Parameter Store con caché en memoria.
 * @returns {Promise<string>}
 */
async function getAppSecret() {
  const now = Math.floor(Date.now() / 1000);
  if (_cachedAppSecret && _appSecretExpiry > now) return _cachedAppSecret;
  const secretJson = await getParameterValue(process.env.WHATSAPP_SECRET_KEY);
  _cachedAppSecret = JSON.parse(secretJson).app_secret;
  _appSecretExpiry = now + SECRET_CACHE_TTL;
  return _cachedAppSecret;
}

/**
 * @description Obtiene el app_secret de Meta (Instagram/Messenger) desde Parameter Store.
 * Retorna null si el parámetro no está configurado.
 * @returns {Promise<string|null>}
 */
async function getMetaAppSecret() {
  const now = Math.floor(Date.now() / 1000);
  if (_cachedMetaAppSecret && _metaAppSecretExpiry > now) return _cachedMetaAppSecret;
  try {
    const secretJson = await getParameterValue(process.env.META_PAGE_SECRET_KEY);
    _cachedMetaAppSecret = JSON.parse(secretJson).app_secret || null;
    _metaAppSecretExpiry = now + SECRET_CACHE_TTL;
    return _cachedMetaAppSecret;
  } catch {
    return null;
  }
}

/**
 * @description Valida la firma HMAC-SHA256 del payload recibido desde Meta.
 * Meta incluye el header X-Hub-Signature-256 con el formato "sha256=<hash>".
 * Usa comparación de tiempo constante para evitar timing attacks.
 *
 * @param {string} rawBody - Cuerpo del request como string sin parsear.
 * @param {string} signatureHeader - Valor del header X-Hub-Signature-256.
 * @returns {Promise<boolean>} true si la firma es válida.
 */
export async function validateWebhookSignature(rawBody, signatureHeader) {
  if (!signatureHeader || !signatureHeader.startsWith('sha256=')) return false;

  const expectedSignature = signatureHeader.slice('sha256='.length);

  const checkSecret = (secret) => {
    if (!secret) return false;
    const computed = createHmac('sha256', secret).update(rawBody, 'utf8').digest('hex');
    try {
      return timingSafeEqual(Buffer.from(computed, 'hex'), Buffer.from(expectedSignature, 'hex'));
    } catch {
      return false;
    }
  };

  // Intentar primero con el app_secret de WhatsApp.
  const whatsappSecret = await getAppSecret();
  if (checkSecret(whatsappSecret)) return true;

  // Fallback: intentar con el app_secret de Meta (Instagram/Messenger).
  const metaSecret = await getMetaAppSecret();
  return checkSecret(metaSecret);
}

/**
 * @description Extrae el primer mensaje de texto o audio entrante del payload de WhatsApp.
 * @param {object} body - Payload parseado del webhook.
 * @returns {object|null}
 */
function extractWhatsAppMessage(body) {
  const entry = body?.entry?.[0];
  const change = entry?.changes?.[0];
  const value = change?.value;

  if (change?.field !== 'messages') return null;

  const message = value?.messages?.[0];
  if (!message) return null;

  // Validar wa_id para evitar phoneNumber = "+undefined".
  const waId = value.contacts?.[0]?.wa_id;
  if (!waId || !/^\d+$/.test(waId)) return null;
  const phoneNumber = `+${waId}`;

  if (message.type === 'text') {
    const text = message.text?.body;
    if (!text) return null;
    return { channel: 'whatsapp', phoneNumber, messageId: message.id, text };
  }

  if (message.type === 'audio') {
    const mediaId = message.audio?.id;
    if (!mediaId) return null;
    return { channel: 'whatsapp', phoneNumber, messageId: message.id, type: 'audio', mediaId };
  }

  return null;
}

/**
 * @description Extrae el primer mensaje de texto entrante del payload de Messenger o Instagram.
 * Ambos canales comparten la misma estructura de payload (`entry[0].messaging`).
 * Ignora eco de mensajes propios (is_echo) y mensajes sin texto.
 * @param {object} body - Payload parseado del webhook.
 * @param {'messenger'|'instagram'} channel
 * @returns {object|null}
 */
function extractMetaMessage(body, channel) {
  const messaging = body?.entry?.[0]?.messaging?.[0];
  if (!messaging) return null;

  // Ignorar eco de mensajes enviados por la página.
  if (messaging.message?.is_echo) return null;

  const senderId = messaging.sender?.id;
  if (!senderId) return null;

  const text = messaging.message?.text;
  if (!text) return null;

  return { channel, phoneNumber: senderId, messageId: messaging.message.mid, text };
}

/**
 * @description Extrae el primer mensaje entrante del payload de Meta detectando el canal automáticamente.
 * Soporta WhatsApp Business, Messenger y Instagram.
 * Ignora status updates, reactions y otros tipos de notificaciones.
 *
 * @param {object} body - Payload parseado del webhook de Meta.
 * @returns {{ channel: 'whatsapp'|'messenger'|'instagram', phoneNumber: string, messageId: string, text: string, type?: string, mediaId?: string } | null}
 */
export function extractIncomingMessage(body) {
  try {
    const object = body?.object;
    if (object === 'whatsapp_business_account') return extractWhatsAppMessage(body);
    if (object === 'page') return extractMetaMessage(body, 'messenger');
    if (object === 'instagram') return extractMetaMessage(body, 'instagram');
    return null;
  } catch {
    return null;
  }
}
