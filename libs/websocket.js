import { ApiGatewayManagementApiClient, PostToConnectionCommand } from '@aws-sdk/client-apigatewaymanagementapi';
import * as dynamoDbLib from './dynamodb-v3.js';

export const SCOPES = {
  LIST: 'LIST',
  CALENDAR: 'CALENDAR',
};

let _wsClient = null;

function getWsClient() {
  if (_wsClient) return _wsClient;
  _wsClient = new ApiGatewayManagementApiClient({ endpoint: process.env.WS_MANAGEMENT_ENDPOINT });
  return _wsClient;
}

/**
 * @description Resuelve el partition key de DynamoDB para un scope dado.
 * @param {string|{phone: string}} scope
 * @returns {string}
 */
function pkForScope(scope) {
  if (scope === SCOPES.LIST) return `WS#${SCOPES.LIST}`;
  if (scope === SCOPES.CALENDAR) return `WS#${SCOPES.CALENDAR}`;
  if (scope && typeof scope === 'object' && scope.phone != null) return `WS#${scope.phone}`;
  throw new Error(`Scope WebSocket inválido: ${JSON.stringify(scope)}`);
}

/**
 * @description Publica un payload a todas las conexiones WebSocket registradas en un scope.
 * Silenciosamente limpia conexiones obsoletas (GoneException 410) de DynamoDB.
 * @param {string|{phone: string}} scope - 'LIST', 'CALENDAR' o { phone }.
 * @param {object} payload - Datos JSON-serializables a enviar a cada conexión.
 */
export async function broadcastToScope(scope, payload) {
  if (!process.env.WS_MANAGEMENT_ENDPOINT) {
    console.warn('[WS-BROADCAST] No hay WS_MANAGEMENT_ENDPOINT configurado');
    return;
  }

  const { CONVERSATIONS_TABLE } = process.env;
  if (!CONVERSATIONS_TABLE) {
    console.warn('[WS-BROADCAST] No hay CONVERSATIONS_TABLE configurado');
    return;
  }

  const pk = pkForScope(scope);

  const connections = await dynamoDbLib.query({
    TableName: CONVERSATIONS_TABLE,
    KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
    ExpressionAttributeValues: { ':pk': pk, ':prefix': 'CONN#' },
  });

  if (!connections?.length) return;

  const client = getWsClient();
  const data = Buffer.from(JSON.stringify(payload));

  await Promise.allSettled(
    connections.map(async (conn) => {
      try {
        await client.send(new PostToConnectionCommand({ ConnectionId: conn.connectionId, Data: data }));
      } catch (err) {
        if (err.statusCode === 410 || err.$metadata?.httpStatusCode === 410) {
          // Conexión obsoleta: limpiar ambas filas en DynamoDB.
          Promise.all([
            dynamoDbLib.remove({ TableName: CONVERSATIONS_TABLE, Key: { pk, sk: `CONN#${conn.connectionId}` } }),
            dynamoDbLib.remove({ TableName: CONVERSATIONS_TABLE, Key: { pk: `WSCONN#${conn.connectionId}`, sk: `WSCONN#${conn.connectionId}` } }),
          ]).catch(() => {});
        } else {
          console.error(`[WS-BROADCAST] Error enviando a ${conn.connectionId}:`, err.message);
        }
      }
    })
  );
}
