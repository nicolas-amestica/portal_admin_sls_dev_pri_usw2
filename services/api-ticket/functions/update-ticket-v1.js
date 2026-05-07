import { success } from '../../../helpers/responses.js';
import * as dynamoDbLib from '../../../libs/dynamodb-v3.js';
import { standardMiddleware } from '../../../libs/middleware/index.js';
import { TICKET_PRIORITY_VALUES } from '../constants/ticket-priority.const.js';
import { TICKET_STATUS_VALUES } from '../constants/ticket-status.const.js';
import { canEditTicket } from '../helpers/fn-can-edit-ticket.js';
import { findTicketById } from '../helpers/fn-find-ticket-by-id.js';
import { resolveAuthContext } from '../helpers/fn-resolve-auth-context.js';

const ACTION = 'Actualizar ticket';

/**
 * @description Actualiza campos permitidos del ticket si el usuario es admin o creador.
 */
const handler = async (event) => {
  const { ticketId } = event.pathParams ?? {};
  const { periodo } = event.queryParams ?? {};
  const body = event.body ?? {};

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
    const err = new Error('No autorizado para editar este ticket');
    err.statusCode = 403;
    throw err;
  }

  const { content, priority, status } = body;
  const exprNames = {};
  const exprValues = {};
  const sets = [];

  if (content !== undefined) {
    if (!Array.isArray(content) || content.length === 0 || !content[0]?.title || !content[0]?.description) {
      const err = new Error('content inválido');
      err.statusCode = 400;
      throw err;
    }
    exprNames['#c'] = 'content';
    exprValues[':c'] = content;
    sets.push('#c = :c');
  }

  if (priority !== undefined) {
    if (!TICKET_PRIORITY_VALUES.includes(priority)) {
      const err = new Error('priority inválida');
      err.statusCode = 400;
      throw err;
    }
    exprNames['#p'] = 'priority';
    exprValues[':p'] = priority;
    sets.push('#p = :p');
  }

  if (status !== undefined) {
    if (!TICKET_STATUS_VALUES.includes(status)) {
      const err = new Error('status inválido');
      err.statusCode = 400;
      throw err;
    }
    exprNames['#s'] = 'status';
    exprValues[':s'] = status;
    sets.push('#s = :s');
  }

  if (sets.length === 0) {
    const err = new Error('No hay campos para actualizar');
    err.statusCode = 400;
    throw err;
  }

  const now = new Date().toISOString();
  exprNames['#u'] = 'updatedAt';
  exprValues[':u'] = now;
  sets.push('#u = :u');

  const updated = await dynamoDbLib.update({
    TableName: process.env.DYNAMODB_TICKET_TABLE,
    Key: { pk: existing.pk, sk: existing.sk },
    UpdateExpression: `SET ${sets.join(', ')}`,
    ExpressionAttributeNames: exprNames,
    ExpressionAttributeValues: exprValues,
  });

  return success(200, updated, ACTION);
};

export const main = standardMiddleware(handler);
