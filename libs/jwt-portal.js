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
