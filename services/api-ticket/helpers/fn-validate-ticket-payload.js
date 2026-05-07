import { TICKET_PRIORITY_VALUES } from '../constants/ticket-priority.const.js';
import { TICKET_STATUS_VALUES } from '../constants/ticket-status.const.js';

/**
 * @description Valida el cuerpo mínimo para crear o actualizar un ticket.
 */
export const validateTicketPayload = ({ content, priority, status }) => {
  if (!content || !Array.isArray(content) || content.length === 0) {
    const err = new Error('content debe ser un arreglo con al menos un elemento');
    err.statusCode = 400;
    throw err;
  }
  const first = content[0];
  if (!first?.title || typeof first.title !== 'string') {
    const err = new Error('title es requerido');
    err.statusCode = 400;
    throw err;
  }
  if (!first?.description || typeof first.description !== 'string') {
    const err = new Error('description es requerida');
    err.statusCode = 400;
    throw err;
  }
  if (!priority || !TICKET_PRIORITY_VALUES.includes(priority)) {
    const err = new Error('priority inválida');
    err.statusCode = 400;
    throw err;
  }
  if (status !== undefined && status !== null && !TICKET_STATUS_VALUES.includes(status)) {
    const err = new Error('status inválido');
    err.statusCode = 400;
    throw err;
  }
};
