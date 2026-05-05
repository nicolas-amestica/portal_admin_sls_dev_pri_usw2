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
 * - destination: nombre del destino del programa (si existe)
 * - course: nombre del curso del programa (si existe)
 * - school: nombre de la escuela del programa (si existe)
 * - hasAssignedInstallment: si sii=false, indica si ya se asignó cuota manual
 * - startDate: fecha de inicio del programa (sort key auxiliar / contenido)
 * - endDate: fecha de término si existe en el ítem o en content[0].dates[1]
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
    const content = detail?.content?.[0] || {};
    const dates = content.dates;
    const endDateFromContent =
      Array.isArray(dates) && dates[1] ? String(dates[1]).split('T')[0] : null;

    return {
      destination: content.destination?.display || '',
      course: content.course || '',
      school: content.school || '',
      name: content.name || '',
      status: detail?.status || '',
      passengers: content.passengers ?? 0,
      program: item.program,
      createdAt: item.createdAt,
      startDate: detail?.startDate || null,
      endDate: detail?.endDate ?? endDateFromContent,
      sii: detail?.sii !== false,
      hasAssignedInstallment: Array.isArray(detail?.assignedInstallments) && detail.assignedInstallments.length > 0,
    };
  });

  return success(200, activePrograms, action);
};

export const main = standardMiddleware(handler);
