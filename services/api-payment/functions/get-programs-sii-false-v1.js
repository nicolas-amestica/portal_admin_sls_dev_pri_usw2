import { success } from '../../../helpers/responses.js';
import { standardMiddleware } from '../../../libs/middleware/index.js';
import { listPrograms, mapProgramView } from '../utils/program-utils.js';

/**
 * Retorna los programas con sii = false y status = approved para que el
 * administrador pueda asignarles una cuota manual.
 *
 * Solo se muestran programas en estado aprobado para evitar operar sobre
 * programas pendientes, rechazados o cancelados.
 *
 * Usa Query por partición (no Scan) con FilterExpression compuesto.
 *
 * @example
 * GET /v1/pagos/admin/programas-sin-sii
 */
const handler = async () => {
  const action = 'Obtener programas sin SII.';

  const items = await listPrograms({
    FilterExpression: 'sii = :sii AND #status = :status',
    ExpressionAttributeNames: { '#status': 'status' },
    ExpressionAttributeValues: { ':sii': false, ':status': 'approved' },
  });

  const programs = (items || []).map(mapProgramView);

  return success(200, programs, action);
};

export const main = standardMiddleware(handler);
