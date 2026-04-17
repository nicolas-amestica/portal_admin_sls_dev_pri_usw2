import * as dynamoDbLib from '../../../libs/dynamodb-v3.js';
import { success, unsuccessful } from '../../../helpers/responses.js';
import { obtenerConversacion, obtenerMensajes, obtenerContacto } from '../helpers/chatwoot-api.js';
import { normalizePhone } from '../mappers/map-conversacion-item.js';

const ACTION = 'Obtener detalle de conversación';
const TTL_30_DAYS = () => Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;

/**
 * @description Lee el teléfono cacheado para un chatwootId desde DynamoDB.
 * Devuelve null si no existe aún el mapping.
 * @param {number} chatwootId
 * @param {string} table
 * @returns {Promise<string|null>}
 */
async function getCachedPhone(chatwootId, table) {
  const item = await dynamoDbLib.getOne({
    TableName: table,
    Key: { pk: `CHATWOOT#${chatwootId}`, sk: 'PHONE' },
  });
  return item?.phone ?? null;
}

/**
 * @description Persiste el mapping chatwootId → phone en DynamoDB (TTL 30 días).
 * Permite saltear las llamadas a Chatwoot Contact API en aperturas futuras.
 * @param {number} chatwootId
 * @param {string} phone - Número normalizado (sin '+').
 * @param {string} table
 */
async function saveCachedPhone(chatwootId, phone, table) {
  await dynamoDbLib.put({
    TableName: table,
    Item: { pk: `CHATWOOT#${chatwootId}`, sk: 'PHONE', phone, ttl: TTL_30_DAYS() },
  });
}

/**
 * @description Resuelve el identificador de teléfono correcto para el lookup en DynamoDB.
 * Prueba el valor original (E.164 con '+') y como fallback sin '+', ya que Chatwoot
 * puede devolver el número normalizado con '+' aunque DynamoDB lo tenga sin él.
 * @param {string} phoneOrId
 * @returns {Promise<string>} El identificador que encontró resultados, o el original.
 */
async function resolvePhoneForDynamo(phoneOrId) {
  if (!phoneOrId) return '';

  const { CONVERSATIONS_TABLE } = process.env;

  const check = async (candidate) => {
    const result = await dynamoDbLib.query({
      TableName: CONVERSATIONS_TABLE,
      KeyConditionExpression: 'pk = :pk',
      ExpressionAttributeValues: { ':pk': `CONV#${candidate}` },
      Limit: 1,
    });
    return result?.length > 0;
  };

  // 1. Intentar con el valor tal como viene de Chatwoot (normalmente E.164 con +).
  if (await check(phoneOrId)) {
    console.log(`[${ACTION}] DynamoDB encontrado con clave directa: CONV#${phoneOrId}`);
    return phoneOrId;
  }

  // 2. Fallback: probar sin '+' (por si DynamoDB lo almacenó sin prefijo).
  const withoutPlus = phoneOrId.startsWith('+') ? phoneOrId.slice(1) : `+${phoneOrId}`;
  if (await check(withoutPlus)) {
    console.log(`[${ACTION}] DynamoDB encontrado con clave alternativa: CONV#${withoutPlus}`);
    return withoutPlus;
  }

  console.warn(`[${ACTION}] No se encontró historial DynamoDB para ${phoneOrId} (ni variante alternativa).`);
  return phoneOrId;
}

/**
 * @description Construye el sort key mínimo posible para un timestamp ISO en formato uuidv7.
 * Dado que uuidv7 codifica los primeros 48 bits como Unix ms, cualquier uuidv7 real generado
 * en ese milisegundo tendrá bits aleatorios no nulos y será mayor que este valor piso.
 * Permite filtrar eficientemente usando KeyConditionExpression sin leer toda la partición.
 * @param {string} isoTimestamp
 * @returns {string} Sort key prefijada con 'MSG#'.
 */
function sinceSkForTimestamp(isoTimestamp) {
  const ms = BigInt(new Date(isoTimestamp).getTime());
  const hi32 = (ms >> 16n).toString(16).padStart(8, '0');
  const lo16 = (ms & 0xffffn).toString(16).padStart(4, '0');
  return `MSG#${hi32}-${lo16}-7000-8000-000000000000`;
}

/**
 * @description Carga mensajes del agente IA desde DynamoDB.
 * Si se provee 'since', solo retorna mensajes posteriores a ese timestamp (carga delta).
 * @param {string} phoneOrId - Número de teléfono o PSID resuelto.
 * @param {string|null} [since] - ISO timestamp para carga delta.
 * @returns {Promise<object[]>}
 */
async function loadDynamoHistory(phoneOrId, since = null) {
  if (!phoneOrId) return [];

  const { CONVERSATIONS_TABLE } = process.env;
  const pk = `CONV#${phoneOrId}`;

  const query = {
    TableName: CONVERSATIONS_TABLE,
    ScanIndexForward: true,
  };

  if (since) {
    query.KeyConditionExpression = 'pk = :pk AND sk > :sinceSk';
    query.ExpressionAttributeValues = { ':pk': pk, ':sinceSk': sinceSkForTimestamp(since) };
  } else {
    query.KeyConditionExpression = 'pk = :pk';
    query.ExpressionAttributeValues = { ':pk': pk };
  }

  const items = await dynamoDbLib.iterativeQuery(query);
  if (!items) return [];
  const msgs = items.filter((i) => i.sk.startsWith('MSG#'));
  console.log(`[${ACTION}] DynamoDB: ${msgs.length} mensajes para ${pk}${since ? ` (delta desde ${since})` : ''}`);
  return msgs;
}

/**
 * @description Extrae el identificador de contacto más confiable desde Chatwoot.
 * Primero intenta el contacto completo vía API; si falla usa el meta del sender.
 * @param {object} sender - Objeto meta.sender de la conversación.
 * @returns {Promise<string>}
 */
async function resolveContactIdentifier(sender) {
  const contactId = sender?.id;

  if (contactId) {
    try {
      const contact = await obtenerContacto(contactId);
      const phone = contact.phone_number || contact.identifier;
      console.log(`[${ACTION}] Contacto Chatwoot ${contactId}: phone="${contact.phone_number}" identifier="${contact.identifier}"`);
      if (phone) return phone;
    } catch (err) {
      console.warn(`[${ACTION}] No se pudo obtener contacto ${contactId} de Chatwoot: ${err.message}`);
    }
  }

  // Fallback al meta del sender de la conversación.
  const fallback = sender?.phone_number || sender?.identifier || '';
  console.log(`[${ACTION}] Usando fallback del meta.sender: "${fallback}"`);
  return fallback;
}

/**
 * @description Normaliza los mensajes de Chatwoot y DynamoDB en un formato común ordenado por tiempo.
 * Excluye notas privadas. Los roles posibles son: 'cliente', 'agente_ia', 'equipo'.
 * @param {object[]} chatwootMsgs - Mensajes de Chatwoot.
 * @param {object[]} dynamoMsgs - Mensajes de DynamoDB.
 * @returns {object[]}
 */
function mergeMessages(chatwootMsgs, dynamoMsgs) {
  const filtered = chatwootMsgs
    .filter((m) => !m.private && m.message_type !== 2 && (m.content || m.attachments?.length))
    .map((m) => {
      const tipo = (m.message_type === 1 || m.message_type === 'outgoing') ? 'equipo' : 'cliente';
      const adjuntos = (m.attachments ?? []).map((a) => ({
        url: a.data_url ?? a.download_url ?? '',
        fileName: a.file_name ?? 'archivo',
        mimeType: a.file_type === 'image' ? 'image/jpeg' : (a.content_type ?? 'application/octet-stream'),
      })).filter((a) => a.url);
      return {
        contenido: m.content ?? '',
        timestamp: new Date(m.created_at * 1000).toISOString(),
        tipo,
        ...(adjuntos.length ? { adjuntos } : {}),
      };
    });

  const dynamo = dynamoMsgs.map((m) => ({
    contenido: m.parts?.[0]?.text ?? '',
    timestamp: m.createdAt,
    tipo: m.role === 'user' ? 'cliente' : m.role === 'team' ? 'equipo' : 'agente_ia',
  }));

  return [...filtered, ...dynamo].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
}

/**
 * @description Retorna el detalle de una conversación derivada: datos del contacto, canal
 * y el historial completo combinando mensajes de Chatwoot y DynamoDB.
 *
 * @param {object} event - Evento HTTP de API Gateway con pathParameters.chatwootId.
 */
export const main = async (event) => {
  try {
    const chatwootId = Number(event.pathParameters?.chatwootId);
    if (!chatwootId) {
      const err = Object.assign(new Error('chatwootId es requerido'), { statusCode: 400 });
      return unsuccessful(400, err, ACTION);
    }

    console.log(`[${ACTION}] Cargando conversación Chatwoot #${chatwootId}`);

    const { CONVERSATIONS_TABLE } = process.env;

    // Intentar resolución rápida desde caché DynamoDB (evita llamadas a Chatwoot Contact API).
    const cachedPhone = await getCachedPhone(chatwootId, CONVERSATIONS_TABLE);

    const since = event.queryStringParameters?.since ?? null;

    const [conv, allChatwootMsgs] = await Promise.all([
      obtenerConversacion(chatwootId),
      obtenerMensajes(chatwootId),
    ]);

    const sinceEpoch = since ? Math.floor(new Date(since).getTime() / 1000) : null;
    const chatwootMsgs = sinceEpoch
      ? allChatwootMsgs.filter((m) => m.created_at > sinceEpoch)
      : allChatwootMsgs;

    console.log(`[${ACTION}] Mensajes Chatwoot: ${chatwootMsgs.length}${since ? ` (delta)` : ''}`);

    let resolvedPhone;
    if (cachedPhone) {
      console.log(`[${ACTION}] Phone resuelto desde caché DynamoDB: ${cachedPhone}`);
      resolvedPhone = cachedPhone;
    } else {
      console.log(`[${ACTION}] Cache miss — resolviendo desde Chatwoot meta.sender`);
      console.log(`[${ACTION}] Chatwoot meta.sender:`, JSON.stringify(conv.meta?.sender));
      const rawPhoneOrId = await resolveContactIdentifier(conv.meta?.sender);
      resolvedPhone = await resolvePhoneForDynamo(rawPhoneOrId);

      // Persistir el mapping para las próximas aperturas.
      if (resolvedPhone) {
        const normalized = normalizePhone(resolvedPhone);
        saveCachedPhone(chatwootId, normalized, CONVERSATIONS_TABLE).catch((err) =>
          console.warn(`[${ACTION}] No se pudo guardar cache de phone: ${err.message}`)
        );
        resolvedPhone = normalized;
      }
    }

    const dynamoMsgs = await loadDynamoHistory(resolvedPhone, since);
    const mensajes = mergeMessages(chatwootMsgs, dynamoMsgs);
    const sender = conv.meta?.sender ?? {};
    const displayPhone = resolvedPhone || sender.phone_number || sender.identifier || '';

    console.log(`[${ACTION}] Total mensajes combinados: ${mensajes.length} (Chatwoot: ${chatwootMsgs.filter(m => !m.private).length}, DynamoDB: ${dynamoMsgs.length})`);

    return success(200, {
      id: conv.id,
      contactName: sender.name || displayPhone || 'Desconocido',
      phoneNumber: displayPhone,
      channel: conv.meta?.channel ?? 'whatsapp',
      lastMessage: conv.last_non_activity_message?.content ?? '',
      lastMessageAt: conv.timestamp ? new Date(conv.timestamp * 1000).toISOString() : '',
      unreadCount: conv.unread_count ?? 0,
      status: conv.status ?? 'open',
      mensajes,
    }, ACTION);
  } catch (error) {
    console.error(`[${ACTION}] Error:`, error.message, error.stack);
    return unsuccessful(error.statusCode || 500, error, ACTION);
  }
};
