import { success } from '../../../helpers/responses.js';
import { standardMiddleware } from '../../../libs/middleware/index.js';
import { findTicketById } from '../helpers/fn-find-ticket-by-id.js';
import { normalizeTicketForResponse } from '../helpers/fn-normalize-ticket-response.js';

const ACTION = 'Obtener ticket por id';

/**
 * @description Obtiene un ticket por id y período MMYYYY.
 */
const handler = async (event) => {
  const { ticketId } = event.pathParams ?? {};
  const { periodo } = event.queryParams ?? {};

  if (!ticketId) {
    const err = new Error('ticketId es requerido');
    err.statusCode = 400;
    throw err;
  }
  if (!periodo || !/^\d{6}$/.test(periodo)) {
    const err = new Error('periodo inválido (formato MMYYYY)');
    err.statusCode = 400;
    throw err;
  }

  const item = await findTicketById(ticketId, periodo);
  if (!item) {
    const err = new Error('Ticket no encontrado');
    err.statusCode = 404;
    throw err;
  }

  return success(200, normalizeTicketForResponse(item), ACTION);
};

export const main = standardMiddleware(handler);
