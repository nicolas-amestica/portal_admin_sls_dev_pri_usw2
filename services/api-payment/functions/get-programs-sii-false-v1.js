import { success } from '../../../helpers/responses.js';
import { standardMiddleware } from '../../../libs/middleware/index.js';
import { listPrograms, mapProgramView } from '../utils/program-utils.js';

/**
 * Retorna todos los programas con sii = false para que el administrador
 * pueda asignarles una cuota manual.
 *
 * Usa Query por partición (no Scan) con FilterExpression sii = false.
 *
 * @example
 * GET /v1/pagos/admin/programas-sin-sii
 */
const handler = async () => {
  const action = 'Obtener programas sin SII.';

  const items = await listPrograms({
    FilterExpression: 'sii = :sii',
    ExpressionAttributeValues: { ':sii': false },
  });

  const programs = (items || []).map(mapProgramView);

  return success(200, programs, action);
};

export const main = standardMiddleware(handler);
