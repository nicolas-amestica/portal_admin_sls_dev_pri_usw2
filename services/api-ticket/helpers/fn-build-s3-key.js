import { ulid } from 'ulid';

/**
 * @description Construye una key S3 segura bajo prefijo tickets/.
 */
export const buildTicketS3Key = (ticketId, fileName) => {
  const safeId = ticketId || `draft-${ulid()}`;
  const safeName = String(fileName).replace(/[^a-zA-Z0-9._-]/g, '_');
  return `tickets/${safeId}/${ulid()}-${safeName}`;
};
