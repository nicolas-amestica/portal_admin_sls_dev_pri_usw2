import { success } from '../../../helpers/responses.js';
import * as dynamoDbLib from '../../../libs/dynamodb-v3.js';
import { standardMiddleware } from '../../../libs/middleware/index.js';
import { canEditTicket } from '../helpers/fn-can-edit-ticket.js';
import { findTicketById } from '../helpers/fn-find-ticket-by-id.js';
import { resolveAuthContext } from '../helpers/fn-resolve-auth-context.js';

const ACTION = 'Eliminar ticket';

/**
 * @description Elimina un ticket si el usuario es admin o creador.
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

  const authCtx = await resolveAuthContext(event);
  const existing = await findTicketById(ticketId, periodo);
  if (!existing) {
    const err = new Error('Ticket no encontrado');
    err.statusCode = 404;
    throw err;
  }

  if (!canEditTicket(existing, authCtx)) {
    const err = new Error('No autorizado para eliminar este ticket');
    err.statusCode = 403;
    throw err;
  }

  await dynamoDbLib.remove({
    TableName: process.env.DYNAMODB_TICKET_TABLE,
    Key: { pk: existing.pk, sk: existing.sk },
  });

  return success(200, { id: ticketId, deleted: true }, ACTION);
};

export const main = standardMiddleware(handler);
