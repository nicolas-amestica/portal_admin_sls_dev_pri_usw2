import { uuidv7 } from 'uuidv7';
import * as dynamoDbLib from '../../../libs/dynamodb-v3.js';
import { parseEventBody } from '../../../helpers/event-parser.js';
import { success, unsuccessful } from '../../../helpers/responses.js';
import { enviarMensaje } from '../helpers/chatwoot-api.js';
import { broadcastToScope } from '../helpers/ws-broadcast.js';
import { buildTurnItem } from '../mappers/map-conversacion-item.js';

const ACTION = 'Responder conversación derivada';

/**
 * @description Envía una respuesta del equipo humano a una conversación derivada.
 * Publica el mensaje en Chatwoot como saliente y lo persiste en DynamoDB (write-through)
 * para que el historial del portal no requiera releer Chatwoot en la próxima apertura.
 *
 * @param {object} event - Evento HTTP de API Gateway con pathParameters.chatwootId y body.content.
 */
export const main = async (event) => {
  try {
    const chatwootId = Number(event.pathParameters?.chatwootId);
    if (!chatwootId) {
      const err = Object.assign(new Error('chatwootId es requerido'), { statusCode: 400 });
      return unsuccessful(400, err, ACTION);
    }

    const { content } = parseEventBody(event);
    if (!content?.trim()) {
      const err = Object.assign(new Error('content es requerido'), { statusCode: 400 });
      return unsuccessful(400, err, ACTION);
    }

    const text = content.trim();
    await enviarMensaje(chatwootId, text);
    console.log(`[${ACTION}] Mensaje enviado en conversación ${chatwootId}`);

    // Write-through: persistir el mensaje del equipo en DynamoDB usando el phone cacheado.
    const { CONVERSATIONS_TABLE } = process.env;
    const phoneItem = await dynamoDbLib.getOne({
      TableName: CONVERSATIONS_TABLE,
      Key: { pk: `CHATWOOT#${chatwootId}`, sk: 'PHONE' },
    });

    if (phoneItem?.phone) {
      const item = buildTurnItem(phoneItem.phone, `MSG#${uuidv7()}`, 'team', text);
      dynamoDbLib.put({ TableName: CONVERSATIONS_TABLE, Item: item }).catch((err) =>
        console.warn(`[${ACTION}] Write-through DynamoDB falló (no crítico): ${err.message}`)
      );
    } else {
      console.warn(`[${ACTION}] Phone no cacheado para chatwootId ${chatwootId} — write-through omitido`);
    }

    // Propagar a otras pestañas abiertas: detalle recarga delta, lista actualiza último mensaje.
    const now = new Date().toISOString();
    await Promise.allSettled([
      broadcastToScope({ chatwootId }, { type: 'new_message', chatwootId }),
      broadcastToScope('LIST', {
        type: 'conversation_updated',
        chatwootId,
        phoneNumber: phoneItem?.phone,
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
