import { createHmac, timingSafeEqual } from 'crypto';
import { getSecretManagerValue } from '../../../libs/secret-manager.js';

/** Cache del app_secret en memoria. */
let _cachedAppSecret = null;

/**
 * @description Obtiene el app_secret desde Secrets Manager con caché en memoria.
 * @returns {Promise<string>}
 */
async function getAppSecret() {
  if (_cachedAppSecret) return _cachedAppSecret;
  const secretJson = await getSecretManagerValue(process.env.WHATSAPP_SECRET_KEY);
  _cachedAppSecret = JSON.parse(secretJson).app_secret;
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
 * @description Extrae el primer mensaje de texto entrante del payload de Meta.
 * Ignora status updates, reactions y otros tipos de notificaciones.
 *
 * @param {object} body - Payload parseado del webhook de Meta.
 * @returns {{ phoneNumber: string, messageId: string, text: string } | null}
 */
export function extractIncomingMessage(body) {
  try {
    const entry = body?.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;

    if (change?.field !== 'messages') return null;

    const message = value?.messages?.[0];
    if (!message || message.type !== 'text') return null;

    const phoneNumber = `+${value.contacts?.[0]?.wa_id}`;

    return {
      phoneNumber,
      messageId: message.id,
      text: message.text.body,
    };
  } catch {
    return null;
  }
}
