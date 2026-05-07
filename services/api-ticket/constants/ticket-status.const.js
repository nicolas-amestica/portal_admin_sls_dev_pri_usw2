/** Estados persistidos en DynamoDB (español snake_case). */
export const TICKET_STATUS = {
  ABIERTO: 'abierto',
  EN_PROGRESO: 'en_progreso',
  RESUELTO: 'resuelto',
  CERRADO: 'cerrado',
};

export const TICKET_STATUS_VALUES = Object.freeze(Object.values(TICKET_STATUS));
