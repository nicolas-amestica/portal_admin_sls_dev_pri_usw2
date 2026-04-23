import * as dynamoDbLib from '../../../libs/dynamodb-v3.js';
import { success, unsuccessful } from '../../../helpers/responses.js';
import { broadcastToScope, SCOPES } from '../../../libs/websocket.js';
import { normalizePhone } from '../mappers/map-conversacion-item.js';

const ACTION = 'Eliminar conversación';

/**
 * @description Elimina una conversación resuelta: quita el item INBOX, los mensajes
 * y la sesión de DynamoDB, y limpia las conexiones WebSocket activas.
 *
 * @param {object} event - Evento HTTP de API Gateway con pathParameters.phone.
 */
export const main = async (event) => {
  try {
    const rawPhone = event.pathParameters?.phone;
    if (!rawPhone) throw Object.assign(new Error('phone requerido'), { statusCode: 400 });

    const phone = normalizePhone(rawPhone);
    const { CONVERSATIONS_TABLE } = process.env;

    const deletePromises = [];

    // Eliminar todos los mensajes CONV#{phone} y el item de sesión.
    const mensajes = await dynamoDbLib.iterativeQuery({
      TableName: CONVERSATIONS_TABLE,
      KeyConditionExpression: 'pk = :pk',
      ExpressionAttributeValues: { ':pk': `CONV#${phone}` },
      ProjectionExpression: 'pk, sk',
    });
    if (mensajes?.length) {
      mensajes.forEach((item) =>
        deletePromises.push(
          dynamoDbLib.remove({ TableName: CONVERSATIONS_TABLE, Key: { pk: item.pk, sk: item.sk } })
        )
      );
    }

    // Eliminar conexiones WebSocket activas y sus lookups inversos.
    const wsConns = await dynamoDbLib.query({
      TableName: CONVERSATIONS_TABLE,
      KeyConditionExpression: 'pk = :pk',
      ExpressionAttributeValues: { ':pk': `WS#${phone}` },
      ProjectionExpression: 'pk, sk, connectionId',
    });
    if (wsConns?.length) {
      wsConns.forEach((item) => {
        deletePromises.push(
          dynamoDbLib.remove({ TableName: CONVERSATIONS_TABLE, Key: { pk: item.pk, sk: item.sk } })
        );
        if (item.connectionId) {
          deletePromises.push(
            dynamoDbLib.remove({
              TableName: CONVERSATIONS_TABLE,
              Key: { pk: `WSCONN#${item.connectionId}`, sk: `WSCONN#${item.connectionId}` },
            })
          );
        }
      });
    }

    // Eliminar item INBOX (quita la conversación del listado).
    deletePromises.push(
      dynamoDbLib.remove({
        TableName: CONVERSATIONS_TABLE,
        Key: { pk: 'INBOX', sk: `CONV#${phone}` },
      })
    );

    await Promise.all(deletePromises);

    // Notificar a otras pestañas para que retiren la conversación de la lista sin fetch.
    await broadcastToScope(SCOPES.LIST, { type: 'conversation_deleted', phone }).catch(
      (err) => console.warn(`[${ACTION}] Broadcast WS falló: ${err.message}`)
    );

    return success(200, { phone }, ACTION);
  } catch (error) {
    console.error(`[${ACTION}] Error:`, error.message, error.stack);
    return unsuccessful(error.statusCode || 500, error, ACTION);
  }
};
