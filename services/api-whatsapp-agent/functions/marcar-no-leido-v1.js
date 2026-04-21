import * as dynamoDbLib from '../../../libs/dynamodb-v3.js';
import { success, unsuccessful } from '../../../helpers/responses.js';
import { broadcastToScope } from '../helpers/ws-broadcast.js';

const ACTION = 'Marcar como no leído';

/**
 * @description Marca una conversación del inbox como no leída (unreadCount = 1).
 * Persiste en DynamoDB y hace broadcast WS a todos los portales conectados.
 *
 * @param {object} event - Evento HTTP de API Gateway con pathParameters.phone.
 */
export const main = async (event) => {
  try {
    const phone = event.pathParameters?.phone;
    if (!phone) throw Object.assign(new Error('phone requerido'), { statusCode: 400 });

    const { CONVERSATIONS_TABLE } = process.env;

    await dynamoDbLib.update({
      TableName: CONVERSATIONS_TABLE,
      Key: { pk: 'INBOX', sk: `CONV#${phone}` },
      UpdateExpression: 'SET unreadCount = :one',
      ConditionExpression: 'attribute_exists(pk)',
      ExpressionAttributeValues: { ':one': 1 },
    });

    await broadcastToScope('LIST', {
      type: 'conversation_updated', phone, unreadCount: 1,
    }).catch((err) => console.warn(`[${ACTION}] Broadcast WS falló: ${err.message}`));

    return success(200, { phone }, ACTION);
  } catch (error) {
    console.error(`[${ACTION}] Error:`, error.message);
    return unsuccessful(error.statusCode || 500, error, ACTION);
  }
};
