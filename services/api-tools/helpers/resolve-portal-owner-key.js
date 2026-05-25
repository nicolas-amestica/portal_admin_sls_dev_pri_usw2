import { getPortalJwtBodyFromEvent } from '../../../libs/fn-get-portal-jwt-body-from-event.js';

/**
 * @description Identificador del titular derivado del JWT (email normalizado).
 * Los tokens portal actuales no incluyen `sk` de DynamoDB Users; usar email garantiza unicidad estable.
 */
export async function resolvePortalOwnerKey(event) {
  const body = await getPortalJwtBodyFromEvent(event);
  const raw = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (!raw) {
    const err = new Error('Token JWT sin email válido.');
    err.statusCode = 401;
    throw err;
  }
  return raw;
}
