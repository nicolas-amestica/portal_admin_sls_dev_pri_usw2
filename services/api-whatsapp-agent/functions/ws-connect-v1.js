import * as dynamoDbLib from '../../../libs/dynamodb-v3.js';

const ACTION = 'WebSocket Connect';
const TTL_24H = () => Math.floor(Date.now() / 1000) + 24 * 60 * 60;

/**
 * @description Registra una conexión WebSocket activa en DynamoDB.
 * Persiste dos items para lookup bidireccional:
 *  - WS#<chatwootId> / CONN#<connectionId>  → permite notificar a todos los admins de una conv.
 *  - WSCONN#<connectionId> / WSCONN#<connectionId>  → permite resolver chatwootId en disconnect.
 *
 * El cliente debe pasar ?chatwootId=<id> en la URL de conexión WebSocket.
 *
 * @param {object} event - Evento de API Gateway WebSocket ($connect route).
 */
export const main = async (event) => {
  try {
    const connectionId = event.requestContext.connectionId;
    const chatwootId = event.queryStringParameters?.chatwootId;

    if (!chatwootId) {
      console.warn(`[${ACTION}] Conexión ${connectionId} rechazada: falta chatwootId`);
      return { statusCode: 400 };
    }

    const { CONVERSATIONS_TABLE } = process.env;
    const now = new Date().toISOString();
    const ttl = TTL_24H();

    await Promise.all([
      dynamoDbLib.put({
        TableName: CONVERSATIONS_TABLE,
        Item: { pk: `WS#${chatwootId}`, sk: `CONN#${connectionId}`, connectionId, chatwootId: Number(chatwootId), createdAt: now, ttl },
      }),
      dynamoDbLib.put({
        TableName: CONVERSATIONS_TABLE,
        Item: { pk: `WSCONN#${connectionId}`, sk: `WSCONN#${connectionId}`, chatwootId: Number(chatwootId), createdAt: now, ttl },
      }),
    ]);

    console.log(`[${ACTION}] Conexión ${connectionId} registrada para chatwootId ${chatwootId}`);
    return { statusCode: 200 };
  } catch (error) {
    console.error(`[${ACTION}] Error:`, error.message);
    return { statusCode: 500 };
  }
};
