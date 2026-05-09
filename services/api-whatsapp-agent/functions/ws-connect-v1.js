import * as dynamoDbLib from '../../../libs/dynamodb-v3.js';
import { SCOPES } from '../../../libs/websocket.js';
import { getParameterValue } from '../../../libs/parameter-store.js';
import { verifyPortalJwt } from '../../../libs/jwt-portal.js';

const ACTION = 'WebSocket Connect';
const TTL_24H = () => Math.floor(Date.now() / 1000) + 24 * 60 * 60;

/**
 * @description Decodifica JWT del query `token` con el secreto portal.
 * @param {string|undefined} token
 * @returns {Promise<Record<string, unknown>|null>}
 */
const getVerifiedJwtBody = async (token) => {
  if (!process.env.SECRET_KEY || !token?.trim()) return null;
  try {
    const secret = await getParameterValue(process.env.SECRET_KEY);
    const decoded = verifyPortalJwt(token.trim(), secret);
    return decoded.body ?? null;
  } catch {
    return null;
  }
};

/**
 * @param {unknown} endpoints - Claim `endpoints` del JWT.
 * @param {string} fragment - Subcadena requerida en la lista.
 */
const endpointsAllow = (endpoints, fragment) =>
  Array.isArray(endpoints) && endpoints.some((p) => String(p).includes(fragment));

/**
 * @description Registra una conexión WebSocket. Requiere `?token=<JWT>` y permisos acordes al canal.
 *
 * @param {object} event - Evento API Gateway WebSocket ($connect).
 */
export const main = async (event) => {
  try {
    const connectionId = event.requestContext.connectionId;
    const qs = event.queryStringParameters || {};
    const scope = qs.scope;
    const phone = qs.phone;
    const token = qs.token;

    const body = await getVerifiedJwtBody(token);
    if (!body) {
      console.warn(`[${ACTION}] Token inválido o ausente (connection ${connectionId})`);
      return { statusCode: 401 };
    }

    const ep = body.endpoints;

    let pk;
    const itemExtra = { createdAt: new Date().toISOString(), ttl: TTL_24H(), connectionId };

    if (scope === 'list') {
      if (!endpointsAllow(ep, '/v1/inbox')) {
        console.warn(`[${ACTION}] Sin permiso inbox (list) connection ${connectionId}`);
        return { statusCode: 403 };
      }
      pk = `WS#${SCOPES.LIST}`;
      itemExtra.scope = SCOPES.LIST;
    } else if (scope === 'calendar') {
      if (!endpointsAllow(ep, '/v1/reuniones')) {
        console.warn(`[${ACTION}] Sin permiso reuniones (calendar) connection ${connectionId}`);
        return { statusCode: 403 };
      }
      pk = `WS#${SCOPES.CALENDAR}`;
      itemExtra.scope = SCOPES.CALENDAR;
    } else if (phone) {
      if (!endpointsAllow(ep, '/v1/inbox')) {
        console.warn(`[${ACTION}] Sin permiso inbox (phone) connection ${connectionId}`);
        return { statusCode: 403 };
      }
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
