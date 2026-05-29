import * as dynamoDbLib from '../../../libs/dynamodb-v3.js';
import { normalizePhone } from '../mappers/map-conversacion-item.js';

/** Ventana de atención al cliente de WhatsApp Cloud API (mensajes libres). */
export const WHATSAPP_SERVICE_WINDOW_MS = 24 * 60 * 60 * 1000;

const MSG_SK_END = 'MSG#\uffff';

/**
 * @description Obtiene el timestamp ISO del último mensaje entrante del cliente (role=user).
 * @param {string} phone - Teléfono normalizado sin '+'.
 * @returns {Promise<string|null>}
 */
export async function getLastUserMessageAt(phone) {
  const normalized = normalizePhone(phone);
  const { CONVERSATIONS_TABLE } = process.env;

  const items = await dynamoDbLib.query({
    TableName: CONVERSATIONS_TABLE,
    KeyConditionExpression: 'pk = :pk AND sk BETWEEN :start AND :end',
    ExpressionAttributeValues: {
      ':pk': `CONV#${normalized}`,
      ':start': 'MSG#',
      ':end': MSG_SK_END,
    },
    ScanIndexForward: false,
    Limit: 30,
  });

  const lastUser = (items ?? []).find((item) => item.role === 'user');
  return lastUser?.createdAt ?? null;
}

/**
 * @description true si aún se pueden enviar mensajes libres dentro de la ventana de 24 h.
 * @param {string|null|undefined} lastUserMessageAt - ISO timestamp del último mensaje del cliente.
 * @param {number} [nowMs=Date.now()]
 * @returns {boolean}
 */
export function isWithinWhatsAppServiceWindow(lastUserMessageAt, nowMs = Date.now()) {
  if (!lastUserMessageAt) return false;
  const elapsed = nowMs - new Date(lastUserMessageAt).getTime();
  return elapsed >= 0 && elapsed < WHATSAPP_SERVICE_WINDOW_MS;
}

/**
 * @description Lanza error 422 si la ventana de 24 h expiró (Meta rechazará la entrega).
 * @param {string} phone
 */
export async function assertWhatsAppServiceWindow(phone) {
  const lastUserMessageAt = await getLastUserMessageAt(phone);
  if (isWithinWhatsAppServiceWindow(lastUserMessageAt)) return;

  const err = new Error(
    'La ventana de 24 horas de WhatsApp expiró. El cliente debe escribir de nuevo para recibir mensajes, o hay que usar una plantilla aprobada por Meta.'
  );
  err.statusCode = 422;
  err.code = 'WHATSAPP_SERVICE_WINDOW_CLOSED';
  err.portalData = { lastUserMessageAt };
  throw err;
}
