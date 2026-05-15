import { ulid } from 'ulid';

/**
 * @description Formatea una fecha como período MMYYYY para la sort key.
 */
export const formatPeriod = (date) => {
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  return `${mm}${date.getFullYear()}`;
};

/**
 * @description Genera pk (desde env), sk con período + ULID y el id del ticket.
 */
export const buildTicketKeys = (createdAt = new Date()) => {
  const id = ulid();
  const period = formatPeriod(createdAt);
  return {
    id,
    pk: process.env.TICKET_TABLE_PK,
    sk: `PER#${period}#${id}`,
  };
};
