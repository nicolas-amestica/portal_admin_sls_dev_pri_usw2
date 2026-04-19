import * as dynamoDbLib from '../../../libs/dynamodb-v3.js';

const ACTION = 'WebSocket Disconnect';

/**
 * @description Elimina la conexión WebSocket de DynamoDB al desconectarse el cliente.
 * Usa el índice inverso WSCONN#<connectionId> para resolver el pk de origen sin scan.
 * Soporta dos scopes registrados por ws-connect-v1: canal LIST y canal por chatwootId.
 *
 * @param {object} event - Evento de API Gateway WebSocket ($disconnect route).
 */
export const main = async (event) => {
  try {
    const connectionId = event.requestContext.connectionId;
    const { CONVERSATIONS_TABLE } = process.env;

    const reverseKey = { pk: `WSCONN#${connectionId}`, sk: `WSCONN#${connectionId}` };
    const item = await dynamoDbLib.getOne({ TableName: CONVERSATIONS_TABLE, Key: reverseKey });

    const deletes = [dynamoDbLib.remove({ TableName: CONVERSATIONS_TABLE, Key: reverseKey })];
    // sourcePk fue guardado en connect; fallback a WS#<chatwootId> para conexiones creadas pre-refactor.
    const sourcePk = item?.sourcePk ?? (item?.chatwootId ? `WS#${item.chatwootId}` : null);
    if (sourcePk) {
      deletes.push(
        dynamoDbLib.remove({
          TableName: CONVERSATIONS_TABLE,
          Key: { pk: sourcePk, sk: `CONN#${connectionId}` },
        })
      );
    }

    await Promise.all(deletes);
    console.log(`[${ACTION}] Conexión ${connectionId} eliminada (sourcePk: ${sourcePk ?? 'desconocido'})`);
    return { statusCode: 200 };
  } catch (error) {
    console.error(`[${ACTION}] Error:`, error.message);
    return { statusCode: 500 };
  }
};
