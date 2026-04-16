import * as dynamoDbLib from '../../../libs/dynamodb-v3.js';
import { success, unsuccessful } from '../../../helpers/responses.js';
import { obtenerConversacion, obtenerMensajes, obtenerContacto } from '../helpers/chatwoot-api.js';

const ACTION = 'Obtener detalle de conversación';

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
 * @description Carga el historial completo de mensajes del agente IA desde DynamoDB.
 * Sin límite de ítems para mostrar toda la conversación en la bandeja.
 * @param {string} phoneOrId - Número de teléfono o PSID resuelto.
 * @returns {Promise<object[]>}
 */
async function loadDynamoHistory(phoneOrId) {
  if (!phoneOrId) return [];

  const { CONVERSATIONS_TABLE } = process.env;
  const pk = `CONV#${phoneOrId}`;

  const items = await dynamoDbLib.iterativeQuery({
    TableName: CONVERSATIONS_TABLE,
    KeyConditionExpression: 'pk = :pk',
    ExpressionAttributeValues: { ':pk': pk },
    ScanIndexForward: true,
  });

  if (!items) return [];
  const msgs = items.filter((i) => i.sk.startsWith('MSG#'));
  console.log(`[${ACTION}] DynamoDB: ${msgs.length} mensajes para ${pk}`);
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
    .filter((m) => !m.private && m.content && m.message_type !== 2)
    .map((m) => {
      const tipo = (m.message_type === 1 || m.message_type === 'outgoing') ? 'equipo' : 'cliente';
      return {
        contenido: m.content,
        timestamp: new Date(m.created_at * 1000).toISOString(),
        tipo,
      };
    });

  const dynamo = dynamoMsgs.map((m) => ({
    contenido: m.parts?.[0]?.text ?? '',
    timestamp: m.createdAt,
    tipo: m.role === 'user' ? 'cliente' : 'agente_ia',
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

    const [conv, chatwootMsgs] = await Promise.all([
      obtenerConversacion(chatwootId),
      obtenerMensajes(chatwootId),
    ]);

    console.log(`[${ACTION}] Chatwoot meta.sender:`, JSON.stringify(conv.meta?.sender));
    console.log(`[${ACTION}] Mensajes Chatwoot: ${chatwootMsgs.length}`);

    // Resolver el identificador del contacto de forma robusta (contacto completo > meta.sender).
    const rawPhoneOrId = await resolveContactIdentifier(conv.meta?.sender);

    // Verificar en DynamoDB con fallback de '+'.
    const resolvedPhone = await resolvePhoneForDynamo(rawPhoneOrId);
    const dynamoMsgs = await loadDynamoHistory(resolvedPhone);

    const mensajes = mergeMessages(chatwootMsgs, dynamoMsgs);
    const sender = conv.meta?.sender ?? {};
    const displayPhone = resolvedPhone || rawPhoneOrId;

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
