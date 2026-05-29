import { uuidv7 } from 'uuidv7';
import * as dynamoDbLib from '../../../libs/dynamodb-v3.js';
import { parseEventBody } from '../../../helpers/event-parser.js';
import { success, unsuccessful } from '../../../helpers/responses.js';
import { sendTextMessage } from '../helpers/whatsapp-api.js';
import { broadcastConversationUpdated, broadcastMessageAppended } from '../helpers/inbox-realtime.js';
import { upsertChatListItem } from '../helpers/chat-list-index.js';
import { buildTurnItem, normalizePhone } from '../mappers/map-conversacion-item.js';
import { registerWhatsAppMessageIndex } from '../helpers/whatsapp-delivery.js';
import { assertWhatsAppServiceWindow } from '../helpers/whatsapp-service-window.js';

const ACTION = 'Responder conversación derivada';

/**
 * @description Envía una respuesta del equipo humano a una conversación derivada.
 * Envía el mensaje directamente vía WhatsApp Cloud API, lo persiste en DynamoDB
 * y actualiza el ítem CHATS con el último mensaje.
 *
 * @param {object} event - Evento HTTP de API Gateway con pathParameters.phone y body.content.
 */
export const main = async (event) => {
  try {
    const rawPhone = event.pathParameters?.phone;
    if (!rawPhone) {
      return unsuccessful(400, Object.assign(new Error('phone es requerido'), { statusCode: 400 }), ACTION);
    }

    const phone = normalizePhone(rawPhone);
    const { content } = parseEventBody(event);
    if (!content?.trim()) {
      return unsuccessful(400, Object.assign(new Error('content es requerido'), { statusCode: 400 }), ACTION);
    }

    const text = content.trim();
    await assertWhatsAppServiceWindow(phone);

    const { CONVERSATIONS_TABLE } = process.env;
    const now = new Date().toISOString();
    const msgSk = `MSG#${uuidv7()}`;

    const whatsappMessageId = await sendTextMessage(`+${phone}`, text);
    if (whatsappMessageId) {
      await registerWhatsAppMessageIndex({ whatsappMessageId, phone, msgSk });
    }

    const item = buildTurnItem(phone, msgSk, 'team', text, [], {
      whatsappMessageId: whatsappMessageId ?? undefined,
      deliveryStatus: whatsappMessageId ? 'sent' : undefined,
    });

    await Promise.all([
      dynamoDbLib.put({ TableName: CONVERSATIONS_TABLE, Item: item }),
      upsertChatListItem({
        phone,
        lastMessage: text.slice(0, 200),
        lastMessageAt: now,
        unreadSet: 0,
      }),
    ]);

    console.log(`[${ACTION}] Mensaje enviado a ${phone}`);

    await Promise.allSettled([
      broadcastMessageAppended({ phone, item }),
      broadcastConversationUpdated({
        phone,
        lastMessage: text.slice(0, 100),
        lastMessageAt: now,
        unreadCount: 0,
      }),
    ]);

    return success(200, { whatsappMessageId, msgSk, createdAt: now }, ACTION);
  } catch (error) {
    console.error(`[${ACTION}] Error:`, error.message, error.stack);
    return unsuccessful(error.statusCode || 500, error, ACTION);
  }
};
