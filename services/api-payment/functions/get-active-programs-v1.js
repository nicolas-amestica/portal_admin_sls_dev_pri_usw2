import * as dynamoDbLib from "../../../libs/dynamodb-v3";
import { success } from "../../../helpers/responses";
import { standardMiddleware } from "../../../libs/middleware/index.js";
import { getProgram } from "../utils/program-utils.js";

const { DYNAMODB_USER_TABLE } = process.env;

/**
 * Obtiene los programas activos de un usuario enriquecidos con datos de SII.
 *
 * Cada item incluye:
 * - program: sk del programa
 * - createdAt: fecha de inscripción
 * - sii: boolean indicando si el programa tiene SII
 * - hasAssignedInstallment: si sii=false, indica si ya se asignó cuota manual
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

  const activeItems = (user.content || []).filter(item => item.isActive);

  // Enriquecer cada programa con sii y hasAssignedInstallment (en paralelo)
  const programDetails = await Promise.all(
    activeItems.map(item => getProgram(item.program))
  );

  const activePrograms = activeItems.map((item, index) => {
    const detail = programDetails[index];
    return {
      program: item.program,
      createdAt: item.createdAt,
      sii: detail?.sii !== false,
      hasAssignedInstallment: Array.isArray(detail?.assignedInstallments) && detail.assignedInstallments.length > 0,
    };
  });

  return success(200, activePrograms, action);
};

export const main = standardMiddleware(handler);
