import { getParameterValue } from './parameter-store.js';
import { verifyPortalJwt } from './jwt-portal.js';

/**
 * @description Lee Bearer del evento HTTP (middleware), valida JWT y devuelve `decoded.body`.
 * @param {object} event - Evento Lambda ya parseado por standardMiddleware.
 * @returns {Promise<Record<string, unknown>>}
 */
export async function getPortalJwtBodyFromEvent(event) {
  const secretPath = process.env.SECRET_KEY;
  if (!secretPath) {
    const err = new Error('Configuración del servidor incompleta.');
    err.statusCode = 500;
    throw err;
  }

  const auth = event.headers?.authorization ?? event.headers?.Authorization;
  if (!auth || !String(auth).startsWith('Bearer ')) {
    const err = new Error('No autorizado.');
    err.statusCode = 401;
    throw err;
  }

  const token = String(auth).slice(7).trim();
  const secret = await getParameterValue(secretPath);

  try {
    const decoded = verifyPortalJwt(token, secret);
    return decoded.body ?? {};
  } catch {
    const err = new Error('Token inválido o expirado.');
    err.statusCode = 401;
    throw err;
  }
}
