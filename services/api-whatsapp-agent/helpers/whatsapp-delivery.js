import * as dynamoDbLib from '../../../libs/dynamodb-v3.js';
import { broadcastToScope } from '../../../libs/websocket.js';
import { normalizePhone } from '../mappers/map-conversacion-item.js';

const TRACKED_STATUSES = new Set(['delivered', 'failed']);

/**
 * @description Calcula TTL de 90 días para ítems de índice WAMID.
 * @returns {number}
 */
function deliveryIndexTtl() {
  return Math.floor(Date.now() / 1000) + 90 * 24 * 60 * 60;
}

/**
 * @description Registra índice WAMID# para correlacionar webhooks de estado con mensajes del historial.
 * Debe invocarse inmediatamente después del send, antes de persistir el turno completo.
 *
 * @param {{ whatsappMessageId: string, phone: string, msgSk: string }} params
 */
export async function registerWhatsAppMessageIndex({ whatsappMessageId, phone, msgSk }) {
  if (!whatsappMessageId || !phone || !msgSk) return;

  const normalized = normalizePhone(phone);
  await dynamoDbLib.put({
    TableName: process.env.CONVERSATIONS_TABLE,
    Item: {
      pk: `WAMID#${whatsappMessageId}`,
      sk: 'META',
      convPk: `CONV#${normalized}`,
      msgSk,
      phone: normalized,
      createdAt: new Date().toISOString(),
      ttl: deliveryIndexTtl(),
    },
  });
}

/**
 * @description Procesa webhook de estado saliente (delivered/failed) y notifica al inbox vía WebSocket.
 * Ignora `sent` y `read` — solo interesa confirmación de entrega al dispositivo o fallo.
 *
 * @param {{ whatsappMessageId: string, status: string }} params
 */
export async function handleWhatsAppStatusUpdate({ whatsappMessageId, status }) {
  if (!whatsappMessageId || !TRACKED_STATUSES.has(status)) return;

  const { CONVERSATIONS_TABLE } = process.env;
  const lookup = await dynamoDbLib.getOne({
    TableName: CONVERSATIONS_TABLE,
    Key: { pk: `WAMID#${whatsappMessageId}`, sk: 'META' },
  }).catch(() => null);

  if (!lookup?.convPk || !lookup?.msgSk) {
    console.warn(`[WhatsApp delivery] WAMID sin índice: ${whatsappMessageId} (${status})`);
    return;
  }

  const existing = await dynamoDbLib.getOne({
    TableName: CONVERSATIONS_TABLE,
    Key: { pk: lookup.convPk, sk: lookup.msgSk },
  }).catch(() => null);

  if (existing?.deliveryStatus === status) return;

  await dynamoDbLib.update({
    TableName: CONVERSATIONS_TABLE,
    Key: { pk: lookup.convPk, sk: lookup.msgSk },
    UpdateExpression: 'SET deliveryStatus = :ds',
    ExpressionAttributeValues: { ':ds': status },
  });

  await broadcastToScope(
    { phone: lookup.phone },
    {
      type: 'message_delivered',
      phone: lookup.phone,
      whatsappMessageId,
      msgSk: lookup.msgSk,
      deliveryStatus: status,
    }
  ).catch((err) => console.warn('[WhatsApp delivery] Broadcast WS falló:', err.message));
}
