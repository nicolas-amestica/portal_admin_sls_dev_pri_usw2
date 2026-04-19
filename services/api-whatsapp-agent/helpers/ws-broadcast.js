import { ApiGatewayManagementApiClient, PostToConnectionCommand } from '@aws-sdk/client-apigatewaymanagementapi';
import * as dynamoDbLib from '../../../libs/dynamodb-v3.js';

const SCOPE_LIST = 'LIST';

let _wsClient = null;

function getWsClient() {
  if (_wsClient) return _wsClient;
  _wsClient = new ApiGatewayManagementApiClient({ endpoint: process.env.WS_MANAGEMENT_ENDPOINT });
  return _wsClient;
}

/**
 * @description Resuelve el partition key de DynamoDB para un scope dado.
 * - 'LIST' → canal de bandeja global (todas las filas de la lista).
 * - { chatwootId } → canal por conversación (admins viendo ese detalle).
 * @param {string|{chatwootId: number|string}} scope
 * @returns {string}
 */
function pkForScope(scope) {
  if (scope === SCOPE_LIST) return `WS#${SCOPE_LIST}`;
  if (scope && typeof scope === 'object' && scope.chatwootId != null) return `WS#${scope.chatwootId}`;
  throw new Error(`Scope WebSocket inválido: ${JSON.stringify(scope)}`);
}

/**
 * @description Publica un payload a todas las conexiones WebSocket registradas en un scope.
 * Silenciosamente limpia conexiones obsoletas (GoneException 410) de DynamoDB.
 * No-op si WS_MANAGEMENT_ENDPOINT no está configurado (dev sin WS).
 * @param {string|{chatwootId: number|string}} scope - 'LIST' o { chatwootId }.
 * @param {object} payload - Datos JSON-serializables a enviar a cada conexión.
 */
export async function broadcastToScope(scope, payload) {
  if (!process.env.WS_MANAGEMENT_ENDPOINT) return;

  const { CONVERSATIONS_TABLE } = process.env;
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
          // Conexión obsoleta: limpiar ambas filas en DynamoDB (fire and forget).
          Promise.all([
            dynamoDbLib.remove({ TableName: CONVERSATIONS_TABLE, Key: { pk, sk: `CONN#${conn.connectionId}` } }),
            dynamoDbLib.remove({ TableName: CONVERSATIONS_TABLE, Key: { pk: `WSCONN#${conn.connectionId}`, sk: `WSCONN#${conn.connectionId}` } }),
          ]).catch(() => {});
        }
      }
    })
  );
}
