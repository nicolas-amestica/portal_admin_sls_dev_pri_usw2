import * as dynamoDbLib from '../../../libs/dynamodb-v3.js';
import { success, unsuccessful } from '../../../helpers/responses.js';

const ACTION = 'Obtener detalle de conversación';
const PAGE_SIZE = 50;
// Límite superior del rango para filtrar solo items MSG# (mayor que cualquier uuidv7 hex)
const MSG_SK_END = 'MSG#\uffff';

/**
 * @description Convierte un ISO timestamp al sort key mínimo posible en formato uuidv7.
 * Permite filtrar eficientemente usando sk > sinceSk sin leer toda la partición.
 */
function sinceSkForTimestamp(isoTimestamp) {
  const ms = BigInt(new Date(isoTimestamp).getTime()) + 1n;
  const hi32 = (ms >> 16n).toString(16).padStart(8, '0');
  const lo16 = (ms & 0xffffn).toString(16).padStart(4, '0');
  return `MSG#${hi32}-${lo16}-7000-8000-000000000000`;
}

/**
 * @description Carga mensajes delta: solo los posteriores al timestamp 'since'.
 * Usado por el frontend al recibir un evento WS new_message para evitar recargar todo.
 */
async function loadDeltaMsgs(phone, since) {
  const { CONVERSATIONS_TABLE } = process.env;
  const pk = `CONV#${phone}`;
  const items = await dynamoDbLib.iterativeQuery({
    TableName: CONVERSATIONS_TABLE,
    KeyConditionExpression: 'pk = :pk AND sk > :since',
    ExpressionAttributeValues: { ':pk': pk, ':since': sinceSkForTimestamp(since) },
    ScanIndexForward: true,
  }) ?? [];
  return items.filter((i) => i.sk.startsWith('MSG#'));
}

/**
 * @description Carga una página de PAGE_SIZE mensajes en orden DESC (más recientes primero).
 * Si se pasa cursor (sk del mensaje más antiguo visible), devuelve la página anterior a él.
 * Devuelve msgs en orden cronológico (ASC) para el frontend.
 */
async function loadMsgsPage(phone, cursor) {
  const { CONVERSATIONS_TABLE } = process.env;
  const pk = `CONV#${phone}`;

  // BETWEEN 'MSG#' AND (cursor | MSG_SK_END) + ScanIndexForward=false → últimos PAGE_SIZE msgs
  const rawItems = await dynamoDbLib.query({
    TableName: CONVERSATIONS_TABLE,
    KeyConditionExpression: 'pk = :pk AND sk BETWEEN :start AND :end',
    ExpressionAttributeValues: { ':pk': pk, ':start': 'MSG#', ':end': cursor ?? MSG_SK_END },
    ScanIndexForward: false,
    Limit: PAGE_SIZE + 1,
  }) ?? [];

  // Excluir el cursor mismo (BETWEEN es inclusivo en ambos extremos)
  const items = cursor ? rawItems.filter((i) => i.sk !== cursor) : rawItems;
  const hasMore = items.length > PAGE_SIZE;
  const page = items.slice(0, PAGE_SIZE);

  return {
    msgs: [...page].reverse(), // cronológico para el frontend
    hasMore,
    nextCursor: hasMore ? page[page.length - 1].sk : null,
  };
}

/**
 * @description Convierte items DynamoDB al formato de mensajes del portal.
 */
function mapDynamoMessages(dynamoMsgs) {
  return dynamoMsgs.map((m) => ({
    contenido: m.parts?.[0]?.text ?? '',
    timestamp: m.createdAt,
    tipo: m.role === 'user' ? 'cliente' : m.role === 'team' ? 'equipo' : 'agente_ia',
    ...(m.attachments?.length ? { adjuntos: m.attachments } : {}),
  }));
}

/**
 * @description Retorna el detalle de una conversación derivada.
 *
 * Query params:
 *   ?since=ISO   → delta: solo mensajes nuevos desde ese timestamp (para WS new_message)
 *   ?cursor=SK   → paginación hacia atrás: mensajes anteriores al cursor
 *   (ninguno)    → carga inicial: últimos PAGE_SIZE mensajes + reset unread
 */
export const main = async (event) => {
  try {
    const phone = event.pathParameters?.phone;
    if (!phone) {
      return unsuccessful(400, Object.assign(new Error('phone es requerido'), { statusCode: 400 }), ACTION);
    }

    const { CONVERSATIONS_TABLE } = process.env;
    const since = event.queryStringParameters?.since ?? null;
    const cursor = event.queryStringParameters?.cursor ?? null;
    const isFullLoad = !since && !cursor;

    const [inboxItem, histResult, sessionItem] = await Promise.all([
      dynamoDbLib.getOne({ TableName: CONVERSATIONS_TABLE, Key: { pk: 'INBOX', sk: `CONV#${phone}` } }),
      since
        ? loadDeltaMsgs(phone, since).then((msgs) => ({ msgs, hasMore: false, nextCursor: null }))
        : loadMsgsPage(phone, cursor ?? null),
      isFullLoad
        ? dynamoDbLib.getOne({ TableName: CONVERSATIONS_TABLE, Key: { pk: `CONV#${phone}`, sk: `CONV#${phone}` } })
        : Promise.resolve(null),
      isFullLoad
        ? dynamoDbLib.update({
            TableName: CONVERSATIONS_TABLE,
            Key: { pk: 'INBOX', sk: `CONV#${phone}` },
            UpdateExpression: 'SET unreadCount = :zero',
            ConditionExpression: 'attribute_exists(pk)',
            ExpressionAttributeValues: { ':zero': 0 },
          }).catch(() => {})
        : Promise.resolve(),
      isFullLoad
        ? dynamoDbLib.update({
            TableName: CONVERSATIONS_TABLE,
            Key: { pk: `CONV#${phone}`, sk: `CONV#${phone}` },
            UpdateExpression: 'SET unreadCount = :zero',
            ExpressionAttributeValues: { ':zero': 0 },
            ReturnValues: 'NONE',
          }).catch((err) => console.warn(`[${ACTION}] No se pudo resetear unreadCount sesión: ${err.message}`))
        : Promise.resolve(),
    ]);

    const { msgs, hasMore, nextCursor } = histResult;
    const mensajes = mapDynamoMessages(msgs);
    const contactName = inboxItem?.contactName || sessionItem?.contactName || phone;

    console.log(`[${ACTION}] ${phone}: ${mensajes.length} msgs, hasMore=${hasMore}, since=${since}, cursor=${cursor}`);

    return success(200, {
      id: phone,
      contactName,
      phoneNumber: phone,
      channel: inboxItem?.channel ?? sessionItem?.channel ?? 'whatsapp',
      lastMessage: inboxItem?.lastMessage ?? sessionItem?.lastMessageText ?? '',
      lastMessageAt: inboxItem?.lastMessageAt ?? sessionItem?.lastMessageAt ?? '',
      unreadCount: isFullLoad ? (sessionItem?.unreadCount ?? 0) : 0,
      status: inboxItem?.status ?? 'derived',
      reason: inboxItem?.reason,
      reasonLabel: inboxItem?.reasonLabel,
      mensajes,
      hasMore,
      nextCursor,
    }, ACTION);
  } catch (error) {
    console.error(`[${ACTION}] Error:`, error.message, error.stack);
    return unsuccessful(error.statusCode || 500, error, ACTION);
  }
};
