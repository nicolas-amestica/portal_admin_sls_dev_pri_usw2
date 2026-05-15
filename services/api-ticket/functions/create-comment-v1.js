import { ulid } from 'ulid';
import { success } from '../../../helpers/responses.js';
import * as dynamoDbLib from '../../../libs/dynamodb-v3.js';
import { standardMiddleware } from '../../../libs/middleware/index.js';
import { canEditTicket } from '../helpers/fn-can-edit-ticket.js';
import { findTicketById } from '../helpers/fn-find-ticket-by-id.js';
import { normalizeTicketForResponse } from '../helpers/fn-normalize-ticket-response.js';
import { resolveAuthContext } from '../helpers/fn-resolve-auth-context.js';
import { validateCreateCommentBody } from '../helpers/fn-validate-comment-payload.js';

const ACTION = 'Agregar comentario al ticket';

/**
 * @description Agrega un comentario al arreglo comments del ticket (solo creador del ticket o admin).
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
    const err = new Error('No autorizado para comentar en este ticket');
    err.statusCode = 403;
    throw err;
  }

  const { comment, files, createdBy } = validateCreateCommentBody(event.body, authCtx.email);
  const now = new Date().toISOString();
  const newComment = {
    id: ulid(),
    comment,
    files,
    createdAt: now,
    createdBy,
  };

  const prev = Array.isArray(existing.comments) ? existing.comments : [];
  const nextComments = [...prev, newComment];

  const updated = await dynamoDbLib.update({
    TableName: process.env.DYNAMODB_TICKET_TABLE,
    Key: { pk: existing.pk, sk: existing.sk },
    UpdateExpression: 'SET #c = :c, #u = :u',
    ExpressionAttributeNames: { '#c': 'comments', '#u': 'updatedAt' },
    ExpressionAttributeValues: { ':c': nextComments, ':u': now },
  });

  return success(201, normalizeTicketForResponse(updated), ACTION);
};

export const main = standardMiddleware(handler);
