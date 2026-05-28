import * as dynamoDbLib from '../../../libs/dynamodb-v3.js';
import { broadcastToScope } from '../../../libs/websocket.js';
import { normalizePhone } from '../mappers/map-conversacion-item.js';

/** Progresión monótona: sent → delivered → read (failed no se sobrescribe). */
const STATUS_RANK = { sent: 0, delivered: 1, read: 2 };

/**
 * @description Normaliza estados de Meta a los que usa el portal.
 * @param {string} status
 * @returns {'delivered'|'read'|'failed'|null}
 */
function normalizeStatusForUi(status) {
  if (status === 'delivered') return 'delivered';
  if (status === 'read') return 'read';
  if (status === 'failed') return 'failed';
  return null;
}

/**
 * @description true si el estado actual ya alcanzó o supera el nuevo (no degradar).
 * @param {string|undefined} current
 * @param {string} next
 * @returns {boolean}
 */
function shouldSkipStatusUpdate(current, next) {
  if (current === 'failed') return true;
  if (next === 'failed') return false;
  return (STATUS_RANK[current] ?? -1) >= (STATUS_RANK[next] ?? -1);
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
 * Acepta `delivered`, `read` y `failed`. Ignora `sent`.
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

  if (shouldSkipStatusUpdate(existing?.deliveryStatus, uiStatus)) return;

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

/** Orden de procesamiento cuando Meta envía varios estados en un mismo webhook. */
const META_STATUS_ORDER = { sent: 0, delivered: 1, read: 2, failed: 3 };

/**
 * @description Procesa estados salientes en orden (sent → delivered → read) para no degradar.
 * @param {Array<{ whatsappMessageId: string, status: string }>} statuses
 */
export async function handleOutgoingStatusBatch(statuses) {
  const sorted = [...statuses].sort(
    (a, b) => (META_STATUS_ORDER[a.status] ?? -1) - (META_STATUS_ORDER[b.status] ?? -1)
  );
  for (const item of sorted) {
    await handleWhatsAppStatusUpdate({
      whatsappMessageId: item.whatsappMessageId,
      status: item.status,
    });
  }
}
