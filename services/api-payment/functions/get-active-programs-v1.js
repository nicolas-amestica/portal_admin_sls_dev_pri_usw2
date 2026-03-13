import * as dynamoDbLib from "../../../libs/dynamodb-v3";
import { success } from "../../../helpers/responses";
import { standardMiddleware } from "../../../libs/middleware/index.js";

const { DYNAMODB_USER_TABLE } = process.env;

/**
 * Obtiene los programas activos de un usuario.
 * El userId esperado corresponde al sk del usuario (ej: "USR#12345678K").
 *
 * @example
 * GET /v1/pagos/programas?userId=USR%2312345678K
 */
const handler = async (event) => {
  const action = "Obtener programas activos del usuario.";
  const userId = event.queryParams?.userId;

  if (!userId) {
    const error = new Error('El userId es requerido como query parameter.');
    error.statusCode = 400;
    throw error;
  }

  // El userId viene como "USR#<rut>"; se extrae el rut para consultar por gsiOne
  const rut = userId.split('#').slice(1).join('#');

  if (!rut) {
    const error = new Error('El userId no tiene el formato esperado (USR#<rut>).');
    error.statusCode = 400;
    throw error;
  }

  const results = await dynamoDbLib.query({
    TableName: DYNAMODB_USER_TABLE,
    IndexName: 'gsiOne-index',
    KeyConditionExpression: '#gsiOne = :gsiOne',
    ExpressionAttributeValues: { ':gsiOne': rut },
    ExpressionAttributeNames: { '#gsiOne': 'gsiOne' },
    Limit: 1,
  });

  const user = results?.[0] ?? null;

  if (!user) {
    const error = new Error('Usuario no encontrado.');
    error.statusCode = 404;
    throw error;
  }

  const activePrograms = (user.content || [])
    .filter(item => item.isActive)
    .map(item => ({ program: item.program, createdAt: item.createdAt }));

  return success(200, activePrograms, action);
};

export const main = standardMiddleware(handler);
