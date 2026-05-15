/** Prioridades persistidas en DynamoDB. */
export const TICKET_PRIORITY = {
  BAJA: 'baja',
  NORMAL: 'normal',
  ALTA: 'alta',
  CRITICO: 'critico',
};

export const TICKET_PRIORITY_VALUES = Object.freeze(Object.values(TICKET_PRIORITY));
