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
 * GET /v1/pagos/programas?userId=USR%236f770265-9eb3-4dee-83da-bbc5707bcef0
 */
const handler = async (event) => {
  const action = "Obtener programas activos del usuario.";
  const userId = event.queryParams?.userId;

  if (!userId) {
    const error = new Error('El userId es requerido como query parameter.');
    error.statusCode = 400;
    throw error;
  }

  // El userId viene como "USR#<uuid>"; se consulta directamente por pk/sk
  const user = await dynamoDbLib.getOne({
    TableName: DYNAMODB_USER_TABLE,
    Key: { pk: userId, sk: userId },
  });

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
