import * as dynamoDbLib from '../../../libs/dynamodb-v3.js';

const ACTION = 'WebSocket Connect';
const TTL_24H = () => Math.floor(Date.now() / 1000) + 24 * 60 * 60;

/**
 * @description Registra una conexión WebSocket activa en DynamoDB.
 * Dos scopes posibles:
 *  - ?scope=list → canal de bandeja (clave pk = WS#LIST). Recibe eventos de conversación actualizada.
 *  - ?phone=<phone> → canal por conversación (clave pk = WS#<phone>). Recibe nuevos mensajes de esa conv.
 *
 * Índice inverso WSCONN#<connectionId> guarda el pk de origen para resolver la partición en disconnect.
 *
 * @param {object} event - Evento de API Gateway WebSocket ($connect route).
 */
export const main = async (event) => {
  try {
    const connectionId = event.requestContext.connectionId;
    const scope = event.queryStringParameters?.scope;
    const phone = event.queryStringParameters?.phone;

    let pk;
    const itemExtra = { createdAt: new Date().toISOString(), ttl: TTL_24H(), connectionId };

    if (scope === 'list') {
      pk = 'WS#LIST';
      itemExtra.scope = 'LIST';
    } else if (phone) {
      pk = `WS#${phone}`;
      itemExtra.phone = phone;
    } else {
      console.warn(`[${ACTION}] Conexión ${connectionId} rechazada: falta scope o phone`);
      return { statusCode: 400 };
    }

    const { CONVERSATIONS_TABLE } = process.env;

    await Promise.all([
      dynamoDbLib.put({
        TableName: CONVERSATIONS_TABLE,
        Item: { pk, sk: `CONN#${connectionId}`, ...itemExtra },
      }),
      dynamoDbLib.put({
        TableName: CONVERSATIONS_TABLE,
        Item: { pk: `WSCONN#${connectionId}`, sk: `WSCONN#${connectionId}`, sourcePk: pk, ...itemExtra },
      }),
    ]);

    console.log(`[${ACTION}] Conexión ${connectionId} registrada en ${pk}`);
    return { statusCode: 200 };
  } catch (error) {
    console.error(`[${ACTION}] Error:`, error.message);
    return { statusCode: 500 };
  }
};
