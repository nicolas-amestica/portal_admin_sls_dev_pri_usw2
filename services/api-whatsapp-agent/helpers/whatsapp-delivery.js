import * as dynamoDbLib from '../../../libs/dynamodb-v3.js';
import { broadcastToScope } from '../../../libs/websocket.js';
import { normalizePhone } from '../mappers/map-conversacion-item.js';

/** Estados que persistimos en UI como doble check gris (`delivered`). */
const DELIVERED_UI_STATUS = 'delivered';

/**
 * @description Normaliza estados de Meta a los que usa el portal.
 * `read` implica que el mensaje ya llegó al dispositivo; lo mapeamos a `delivered`
 * (doble check gris) sin exponer lectura azul en el inbox.
 * @param {string} status
 * @returns {'delivered'|'failed'|null}
 */
function normalizeStatusForUi(status) {
  if (status === 'delivered' || status === 'read') return DELIVERED_UI_STATUS;
  if (status === 'failed') return 'failed';
  return null;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * @description Calcula TTL de 90 días para ítems de índice WAMID.
 * @returns {number}
 */
function deliveryIndexTtl() {
  return Math.floor(Date.now() / 1000) + 90 * 24 * 60 * 60;
}

/**
 * @description Busca el índice WAMID# con un reintento breve por carrera webhook vs. registro post-send.
 * @param {string} whatsappMessageId
 * @returns {Promise<object|null>}
 */
async function lookupWamidIndex(whatsappMessageId) {
  const { CONVERSATIONS_TABLE } = process.env;
  const fetch = () =>
    dynamoDbLib.getOne({
      TableName: CONVERSATIONS_TABLE,
      Key: { pk: `WAMID#${whatsappMessageId}`, sk: 'META' },
    }).catch(() => null);

  const first = await fetch();
  if (first?.convPk && first?.msgSk) return first;

  await sleep(400);
  return fetch();
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
 * @description Procesa webhook de estado saliente y notifica al inbox vía WebSocket.
 * Acepta `delivered`, `read` (→ delivered en UI) y `failed`. Ignora `sent`.
 *
 * @param {{ whatsappMessageId: string, status: string }} params
 */
export async function handleWhatsAppStatusUpdate({ whatsappMessageId, status }) {
  const uiStatus = normalizeStatusForUi(status);
  if (!whatsappMessageId || !uiStatus) return;

  const lookup = await lookupWamidIndex(whatsappMessageId);

  if (!lookup?.convPk || !lookup?.msgSk) {
    console.warn(`[WhatsApp delivery] WAMID sin índice: ${whatsappMessageId} (${status})`);
    return;
  }

  const { CONVERSATIONS_TABLE } = process.env;
  const existing = await dynamoDbLib.getOne({
    TableName: CONVERSATIONS_TABLE,
    Key: { pk: lookup.convPk, sk: lookup.msgSk },
  }).catch(() => null);

  if (existing?.deliveryStatus === 'failed') return;
  if (existing?.deliveryStatus === DELIVERED_UI_STATUS) return;

  await dynamoDbLib.update({
    TableName: CONVERSATIONS_TABLE,
    Key: { pk: lookup.convPk, sk: lookup.msgSk },
    UpdateExpression: 'SET deliveryStatus = :ds',
    ExpressionAttributeValues: { ':ds': uiStatus },
  });

  await broadcastToScope(
    { phone: lookup.phone },
    {
      type: 'message_delivered',
      phone: lookup.phone,
      whatsappMessageId,
      msgSk: lookup.msgSk,
      deliveryStatus: uiStatus,
    }
  ).catch((err) => console.warn('[WhatsApp delivery] Broadcast WS falló:', err.message));
}
