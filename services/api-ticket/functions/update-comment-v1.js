import { success } from '../../../helpers/responses.js';
import * as dynamoDbLib from '../../../libs/dynamodb-v3.js';
import { standardMiddleware } from '../../../libs/middleware/index.js';
import { canEditComment } from '../helpers/fn-can-edit-comment.js';
import { findTicketById } from '../helpers/fn-find-ticket-by-id.js';
import { normalizeTicketForResponse } from '../helpers/fn-normalize-ticket-response.js';
import { resolveAuthContext } from '../helpers/fn-resolve-auth-context.js';
import { validateUpdateCommentBody } from '../helpers/fn-validate-comment-payload.js';

const ACTION = 'Actualizar comentario del ticket';

/**
 * @description Actualiza texto y/o adjuntos de un comentario (autor del comentario o admin).
 */
const handler = async (event) => {
  const { ticketId, commentId } = event.pathParams ?? {};
  const { periodo } = event.queryParams ?? {};

  if (!ticketId || !commentId) {
    const err = new Error('ticketId y commentId son requeridos');
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

  const comments = Array.isArray(existing.comments) ? [...existing.comments] : [];
  const idx = comments.findIndex((c) => c.id === commentId);
  if (idx === -1) {
    const err = new Error('Comentario no encontrado');
    err.statusCode = 404;
    throw err;
  }

  const target = comments[idx];
  if (!canEditComment(target, authCtx)) {
    const err = new Error('No autorizado para editar este comentario');
    err.statusCode = 403;
    throw err;
  }

  const { comment: nextText, files: nextFiles } = validateUpdateCommentBody(event.body);
  const now = new Date().toISOString();
  comments[idx] = {
    ...target,
    ...(nextText !== undefined ? { comment: nextText } : {}),
    ...(nextFiles !== undefined ? { files: nextFiles } : {}),
    updatedAt: now,
  };

  const updated = await dynamoDbLib.update({
    TableName: process.env.DYNAMODB_TICKET_TABLE,
    Key: { pk: existing.pk, sk: existing.sk },
    UpdateExpression: 'SET #c = :c, #u = :u',
    ExpressionAttributeNames: { '#c': 'comments', '#u': 'updatedAt' },
    ExpressionAttributeValues: { ':c': comments, ':u': now },
  });

  return success(200, normalizeTicketForResponse(updated), ACTION);
};

export const main = standardMiddleware(handler);
