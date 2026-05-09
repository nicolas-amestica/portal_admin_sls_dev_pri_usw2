import jwt from 'jsonwebtoken';

const JWT_ALG = 'HS256';

/**
 * @description Verifica un JWT del portal con algoritmo fijo (evita algorithm confusion).
 * @param {string} token - JWT sin prefijo Bearer.
 * @param {string} secret - Secreto HS256.
 * @returns {import('jsonwebtoken').JwtPayload & { body?: Record<string, unknown> }}
 */
export function verifyPortalJwt(token, secret) {
  return jwt.verify(token, secret, { algorithms: [JWT_ALG] });
}

/**
 * @description Firma un JWT del portal con HS256.
 * @param {object} payload - Payload estándar `{ body: {...} }`.
 * @param {string} secret - Secreto.
 * @param {string} [expiresIn='3d'] - TTL jsonwebtoken.
 * @returns {string}
 */
export function signPortalJwt(payload, secret, expiresIn = '3d') {
  return jwt.sign(payload, secret, { algorithm: JWT_ALG, expiresIn });
}

/**
 * @description Valida que el secreto JWT (SSM/env) exista antes de firmar o verificar.
 * @param {unknown} secret - Secreto HS256.
 * @throws {Error} Si falta o no es string usable (503 para diferenciar de fallos de credencial).
 */
export function assertPortalJwtSecret(secret) {
  if (typeof secret !== 'string' || !secret.trim()) {
    const error = new Error(
      'Clave JWT no disponible. Verifica el parámetro SSM del JWT y permisos de la función Lambda.'
    );
    error.statusCode = 503;
    throw error;
  }
}
