import { uuidv7 } from 'uuidv7';
import * as dynamoDbLib from '../../../libs/dynamodb-v3.js';
import { parseEventBody } from '../../../helpers/event-parser.js';
import { success, unsuccessful } from '../../../helpers/responses.js';
import { sendTextMessage } from '../helpers/whatsapp-api.js';
import { broadcastToScope, SCOPES } from '../../../libs/websocket.js';
import { buildTurnItem } from '../mappers/map-conversacion-item.js';

const ACTION = 'Responder conversación derivada';

/**
 * @description Envía una respuesta del equipo humano a una conversación derivada.
 * Envía el mensaje directamente vía WhatsApp Cloud API, lo persiste en DynamoDB
 * y actualiza el item INBOX con el último mensaje.
 *
 * @param {object} event - Evento HTTP de API Gateway con pathParameters.phone y body.content.
 */
export const main = async (event) => {
  try {
    const phone = event.pathParameters?.phone;
    if (!phone) {
      return unsuccessful(400, Object.assign(new Error('phone es requerido'), { statusCode: 400 }), ACTION);
    }

    const { content } = parseEventBody(event);
    if (!content?.trim()) {
      return unsuccessful(400, Object.assign(new Error('content es requerido'), { statusCode: 400 }), ACTION);
    }

    const text = content.trim();
    const { CONVERSATIONS_TABLE } = process.env;
    const now = new Date().toISOString();

    // Enviar mensaje directo por WhatsApp y persistir en DynamoDB en paralelo.
    const item = buildTurnItem(phone, `MSG#${uuidv7()}`, 'team', text);
    await Promise.all([
      sendTextMessage(`+${phone}`, text),
      dynamoDbLib.put({ TableName: CONVERSATIONS_TABLE, Item: item }),
      // Actualizar item INBOX: nuevo lastMessage y reset unreadCount.
      dynamoDbLib.update({
        TableName: CONVERSATIONS_TABLE,
        Key: { pk: 'INBOX', sk: `CONV#${phone}` },
        UpdateExpression: 'SET lastMessage = :txt, lastMessageAt = :now, unreadCount = :zero',
        ConditionExpression: 'attribute_exists(pk)',
        ExpressionAttributeValues: { ':txt': text.slice(0, 200), ':now': now, ':zero': 0 },
      }).catch((err) => console.warn(`[${ACTION}] No se pudo actualizar INBOX: ${err.message}`)),
    ]);

    console.log(`[${ACTION}] Mensaje enviado a ${phone}`);

    // Propagar a otras pestañas: detalle recarga delta, lista actualiza último mensaje.
    await Promise.allSettled([
      broadcastToScope({ phone }, { type: 'new_message', phone }),
      broadcastToScope(SCOPES.LIST, {
        type: 'conversation_updated',
        phone,
        lastMessage: text.slice(0, 100),
        lastMessageAt: now,
      }),
    ]);

    return success(200, {}, ACTION);
  } catch (error) {
    console.error(`[${ACTION}] Error:`, error.message, error.stack);
    return unsuccessful(error.statusCode || 500, error, ACTION);
  }
};
