import * as dynamoDbLib from '../../../libs/dynamodb-v3.js';
import { success, unsuccessful } from '../../../helpers/responses.js';
import { resolverConversacion } from '../helpers/chatwoot-api.js';
import { broadcastToScope } from '../helpers/ws-broadcast.js';

const ACTION = 'Eliminar conversación';

/**
 * @description Elimina una conversación: resuelve en Chatwoot y borra todos los ítems DynamoDB asociados.
 * Elimina mensajes (CONV#{phone}), caché de teléfono (CHATWOOT#{id}) y conexiones WS (WS#{id}).
 *
 * @param {object} event - Evento HTTP de API Gateway.
 */
export const main = async (event) => {
  try {
    const chatwootId = Number(event.pathParameters?.chatwootId);
    if (!chatwootId) throw Object.assign(new Error('chatwootId requerido'), { statusCode: 400 });

    const { CONVERSATIONS_TABLE } = process.env;

    // Obtener phone cacheado para poder limpiar los mensajes DynamoDB
    const cacheItem = await dynamoDbLib.getOne({
      TableName: CONVERSATIONS_TABLE,
      Key: { pk: `CHATWOOT#${chatwootId}`, sk: 'PHONE' },
    });
    const phone = cacheItem?.phone;

    const deletePromises = [];

    // Eliminar todos los mensajes CONV#{phone}
    if (phone) {
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
    }

    // Eliminar conexiones WebSocket activas y sus lookups inversos
    const wsConns = await dynamoDbLib.query({
      TableName: CONVERSATIONS_TABLE,
      KeyConditionExpression: 'pk = :pk',
      ExpressionAttributeValues: { ':pk': `WS#${chatwootId}` },
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

    // Eliminar caché de teléfono
    if (cacheItem) {
      deletePromises.push(
        dynamoDbLib.remove({
          TableName: CONVERSATIONS_TABLE,
          Key: { pk: `CHATWOOT#${chatwootId}`, sk: 'PHONE' },
        })
      );
    }

    // Ejecutar todas las eliminaciones DynamoDB y resolver en Chatwoot en paralelo
    await Promise.all([...deletePromises, resolverConversacion(chatwootId)]);

    // Propagar la eliminación a otras pestañas con la lista abierta para que la retiren sin fetch.
    await broadcastToScope('LIST', { type: 'conversation_deleted', chatwootId }).catch(
      (err) => console.warn(`[${ACTION}] Broadcast WS falló: ${err.message}`)
    );

    return success(200, { chatwootId }, ACTION);
  } catch (error) {
    console.error(`[${ACTION}] Error:`, error.message, error.stack);
    return unsuccessful(error.statusCode || 500, error, ACTION);
  }
};
