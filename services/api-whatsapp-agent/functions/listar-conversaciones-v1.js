import * as dynamoDbLib from '../../../libs/dynamodb-v3.js';
import { success, unsuccessful } from '../../../helpers/responses.js';

const ACTION = 'Listar conversaciones derivadas';

/**
 * @description Lista las conversaciones derivadas al equipo humano leyendo la partición
 * INBOX de DynamoDB. Cada item INBOX representa una conversación activa cuyo lastMessage,
 * unreadCount y contactName son mantenidos en tiempo real por el sistema.
 *
 * @param {object} _event - Evento HTTP de API Gateway.
 */
export const main = async (_event) => {
  try {
    const { CONVERSATIONS_TABLE } = process.env;

    const items = await dynamoDbLib.iterativeQuery({
      TableName: CONVERSATIONS_TABLE,
      KeyConditionExpression: 'pk = :pk',
      ExpressionAttributeValues: { ':pk': 'INBOX' },
      ScanIndexForward: false,
    });

    const conversaciones = (items ?? [])
      .map((item) => ({
        id: item.phone,
        phone: item.phone,
        contactName: item.contactName || item.phone || 'Desconocido',
        phoneNumber: item.phone,
        channel: item.channel ?? 'whatsapp',
        lastMessage: item.lastMessage ?? '',
        lastMessageAt: item.lastMessageAt ?? '',
        unreadCount: item.unreadCount ?? 0,
        status: item.status ?? 'derived',
        reason: item.reason,
        reasonLabel: item.reasonLabel,
      }))
      .sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));

    return success(200, conversaciones, ACTION);
  } catch (error) {
    console.error(`[${ACTION}] Error:`, error.message, error.stack);
    return unsuccessful(error.statusCode || 500, error, ACTION);
  }
};
