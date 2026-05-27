import * as dynamoDbLib from '../../../libs/dynamodb-v3.js';
import { parseEventBody } from '../../../helpers/event-parser.js';
import { success, unsuccessful } from '../../../helpers/responses.js';
import { broadcastToScope, SCOPES } from '../../../libs/websocket.js';
import { CHATS_PK, chatListSk } from '../helpers/chat-list-index.js';
import { normalizePhone } from '../mappers/map-conversacion-item.js';

const ACTION = 'Actualizar contacto';

/**
 * @description Actualiza el nombre/alias de un contacto en DynamoDB.
 * Actualiza CHATS (listado), INBOX (si existe) y la sesión CONV# (detalle).
 *
 * @param {object} event - Evento HTTP de API Gateway con pathParameters.phone y body.name.
 */
export const main = async (event) => {
  try {
    const rawPhone = event.pathParameters?.phone;
    if (!rawPhone) throw Object.assign(new Error('phone requerido'), { statusCode: 400 });

    const phone = normalizePhone(rawPhone);
    const { name } = parseEventBody(event);
    if (!name?.trim()) throw Object.assign(new Error('name es requerido'), { statusCode: 400 });

    const nuevoNombre = name.trim();
    const { CONVERSATIONS_TABLE } = process.env;

    await Promise.all([
      dynamoDbLib.update({
        TableName: CONVERSATIONS_TABLE,
        Key: { pk: CHATS_PK, sk: chatListSk(phone) },
        UpdateExpression: 'SET contactName = :name',
        ExpressionAttributeValues: { ':name': nuevoNombre },
      }).catch((err) => console.warn(`[${ACTION}] No se pudo actualizar CHATS: ${err.message}`)),
      dynamoDbLib.update({
        TableName: CONVERSATIONS_TABLE,
        Key: { pk: 'INBOX', sk: `CONV#${phone}` },
        UpdateExpression: 'SET contactName = :name',
        ConditionExpression: 'attribute_exists(pk)',
        ExpressionAttributeValues: { ':name': nuevoNombre },
      }).catch((err) => console.warn(`[${ACTION}] No se pudo actualizar INBOX: ${err.message}`)),
      dynamoDbLib.update({
        TableName: CONVERSATIONS_TABLE,
        Key: { pk: `CONV#${phone}`, sk: `CONV#${phone}` },
        UpdateExpression: 'SET contactName = :name',
        ExpressionAttributeValues: { ':name': nuevoNombre },
      }).catch((err) => console.warn(`[${ACTION}] No se pudo actualizar sesión: ${err.message}`)),
    ]);

    await broadcastToScope(SCOPES.LIST, { type: 'contact_updated', phone, name: nuevoNombre }).catch(
      (err) => console.warn(`[${ACTION}] Broadcast WS falló: ${err.message}`)
    );

    return success(200, { phone, name: nuevoNombre }, ACTION);
  } catch (error) {
    console.error(`[${ACTION}] Error:`, error.message, error.stack);
    return unsuccessful(error.statusCode || 500, error, ACTION);
  }
};
