import { success } from '../../../helpers/responses.js';
import { standardMiddleware } from '../../../libs/middleware/index.js';
import { queryTicketsByPeriod } from '../helpers/fn-query-tickets.js';

const ACTION = 'Listar tickets por período';

/**
 * @description Lista tickets del período MMYYYY (solo Query sobre pk + prefijo sk).
 */
const handler = async (event) => {
  const { periodo } = event.queryParams ?? {};
  if (!periodo || !/^\d{6}$/.test(periodo)) {
    const err = new Error('periodo inválido (formato MMYYYY)');
    err.statusCode = 400;
    throw err;
  }

  const items = await queryTicketsByPeriod(periodo);
  return success(200, items, ACTION);
};

export const main = standardMiddleware(handler);
