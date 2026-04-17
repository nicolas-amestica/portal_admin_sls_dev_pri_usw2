import { ApiGatewayManagementApiClient, PostToConnectionCommand } from '@aws-sdk/client-apigatewaymanagementapi';
import * as dynamoDbLib from '../../../libs/dynamodb-v3.js';
import { parseEventBody } from '../../../helpers/event-parser.js';
import { success, unsuccessful } from '../../../helpers/responses.js';
import { sendTextMessage } from '../helpers/whatsapp-api.js';

const ACTION = 'Responder desde Chatwoot a WhatsApp';

let _wsClient = null;

function getWsClient() {
  if (_wsClient) return _wsClient;
  _wsClient = new ApiGatewayManagementApiClient({ endpoint: process.env.WS_MANAGEMENT_ENDPOINT });
  return _wsClient;
}

/**
 * @description Envía una notificación push a todos los admins conectados vía WebSocket para un chatwootId.
 * Las conexiones obsoletas (GoneException) se eliminan silenciosamente de DynamoDB.
 * @param {number} chatwootId
 * @param {object} data - Payload a enviar al frontend.
 */
async function notificarConexiones(chatwootId, data) {
  const { CONVERSATIONS_TABLE } = process.env;
  const connections = await dynamoDbLib.query({
    TableName: CONVERSATIONS_TABLE,
    KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
    ExpressionAttributeValues: { ':pk': `WS#${chatwootId}`, ':prefix': 'CONN#' },
  });

  if (!connections?.length) return;

  const client = getWsClient();
  const payload = Buffer.from(JSON.stringify(data));

  await Promise.allSettled(
    connections.map(async (conn) => {
      try {
        await client.send(new PostToConnectionCommand({ ConnectionId: conn.connectionId, Data: payload }));
      } catch (err) {
        if (err.statusCode === 410 || err.$metadata?.httpStatusCode === 410) {
          // Conexión obsoleta: limpiar DynamoDB (fire and forget).
          Promise.all([
            dynamoDbLib.remove({ TableName: CONVERSATIONS_TABLE, Key: { pk: `WS#${chatwootId}`, sk: `CONN#${conn.connectionId}` } }),
            dynamoDbLib.remove({ TableName: CONVERSATIONS_TABLE, Key: { pk: `WSCONN#${conn.connectionId}`, sk: `WSCONN#${conn.connectionId}` } }),
          ]).catch(() => {});
        }
      }
    })
  );
}

/**
 * @description Recibe webhooks de Chatwoot y:
 * 1. Si el mensaje es saliente (del equipo) → reenvía al cliente vía WhatsApp.
 * 2. Si el mensaje es entrante (del cliente) → notifica a los admins conectados vía WebSocket.
 *
 * @param {object} event - Evento HTTP de API Gateway con el payload del webhook de Chatwoot.
 */
export const main = async (event) => {
  try {
    const payload = parseEventBody(event);

    if (payload.event !== 'message_created') {
      return success(200, {}, ACTION);
    }

    const chatwootId = payload.conversation?.id;
    const esOutgoing = payload.message_type === 'outgoing' || payload.message_type === 1;
    const esIncoming = payload.message_type === 'incoming' || payload.message_type === 0;

    // Mensajes salientes del equipo → reenviar a WhatsApp.
    if (esOutgoing && !payload.private && payload.content) {
      const phoneNumber = payload.conversation?.meta?.sender?.phone_number;
      if (!phoneNumber) {
        console.warn(`[${ACTION}] Webhook saliente sin teléfono. Meta:`, JSON.stringify(payload.conversation?.meta));
        return success(200, {}, ACTION);
      }
      await sendTextMessage(phoneNumber, payload.content);
      console.log(`[${ACTION}] Mensaje enviado a ${phoneNumber}: "${payload.content.slice(0, 60)}"`);
    }

    // Mensajes entrantes del cliente → notificar admins conectados vía WebSocket.
    if (esIncoming && !payload.private && chatwootId && process.env.WS_MANAGEMENT_ENDPOINT) {
      notificarConexiones(chatwootId, { type: 'new_message', chatwootId }).catch((err) =>
        console.warn(`[${ACTION}] Notificación WebSocket falló (no crítico): ${err.message}`)
      );
    }

    return success(200, {}, ACTION);
  } catch (error) {
    console.error(`[${ACTION}] Error:`, error.message, error.stack);
    return unsuccessful(error.statusCode || 500, error, ACTION);
  }
};
