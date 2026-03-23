import { createHmac, timingSafeEqual } from 'crypto';
import { getParameterValue } from '../../../libs/parameter-store.js';

/** Cache del app_secret con TTL de 1 hora para permitir rotación de secretos. */
let _cachedAppSecret = null;
let _appSecretExpiry = 0;
const SECRET_CACHE_TTL = 3600;

/**
 * @description Obtiene el app_secret desde Parameter Store con caché en memoria.
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

  const appSecret = await getAppSecret();
  const expectedSignature = signatureHeader.slice('sha256='.length);

  const computed = createHmac('sha256', appSecret).update(rawBody, 'utf8').digest('hex');

  try {
    return timingSafeEqual(Buffer.from(computed, 'hex'), Buffer.from(expectedSignature, 'hex'));
  } catch {
    return false;
  }
}

/**
 * @description Extrae el primer mensaje de texto o audio entrante del payload de Meta.
 * Ignora status updates, reactions y otros tipos de notificaciones.
 *
 * @param {object} body - Payload parseado del webhook de Meta.
 * @returns {{ phoneNumber: string, messageId: string, text: string } | { phoneNumber: string, messageId: string, type: 'audio', mediaId: string } | null}
 */
export function extractIncomingMessage(body) {
  try {
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
      return { phoneNumber, messageId: message.id, text };
    }

    if (message.type === 'audio') {
      const mediaId = message.audio?.id;
      if (!mediaId) return null;
      return { phoneNumber, messageId: message.id, type: 'audio', mediaId };
    }

    // Ignorar explícitamente tipos no soportados (imagen, video, sticker, etc.).
    return null;
  } catch {
    return null;
  }
}
