import jwt from 'jsonwebtoken';
import { getParameterValue } from '../../../libs/parameter-store.js';

const STAFF_TITLES = new Set(['administrador', 'operador']);

/** TTL cache del secreto JWT en memoria del proceso Lambda (reduce llamadas SSM). */
const JWT_SECRET_TTL_MS = 10 * 60 * 1000;

let cachedJwtSecret = null;
let cachedJwtSecretExpiresAt = 0;

/**
 * @description Obtiene el secreto JWT con cache en caliente entre invocaciones del mismo contenedor.
 */
async function getJwtSecretCached(secretPath) {
  const now = Date.now();
  if (cachedJwtSecret !== null && now < cachedJwtSecretExpiresAt) {
    return cachedJwtSecret;
  }
  const secret = await getParameterValue(secretPath);
  cachedJwtSecret = secret;
  cachedJwtSecretExpiresAt = now + JWT_SECRET_TTL_MS;
  return secret;
}

/**
 * @description Verifica el Bearer token y devuelve el cuerpo útil del JWT (`body`).
 */
async function verifyJwtBody(headers) {
  const secretPath = process.env.SECRET_KEY;
  if (!secretPath) {
    const err = new Error('Configuración del servidor incompleta.');
    err.statusCode = 500;
    throw err;
  }

  const auth = headers?.authorization ?? headers?.Authorization;
  if (!auth || !String(auth).startsWith('Bearer ')) {
    const err = new Error('No autorizado.');
    err.statusCode = 401;
    throw err;
  }

  const token = String(auth).slice(7).trim();
  try {
    const secret = await getJwtSecretCached(secretPath);
    const decoded = jwt.verify(token, secret);
    return decoded.body ?? {};
  } catch {
    const err = new Error('Token inválido o expirado.');
    err.statusCode = 401;
    throw err;
  }
}

function normalizedProfileTitles(body) {
  const profiles = body?.profiles ?? [];
  return profiles.map((p) => String(p ?? '').trim().toLowerCase()).filter(Boolean);
}

/**
 * @description Exige perfil Administrador u Operador (JWT portal).
 */
export async function requireStaffProfile(headers) {
  const body = await verifyJwtBody(headers);
  const normalized = normalizedProfileTitles(body);
  const ok = normalized.some((p) => STAFF_TITLES.has(p));
  if (!ok) {
    const err = new Error('Se requiere perfil de administrador u operador.');
    err.statusCode = 403;
    throw err;
  }
}

/**
 * @description Exige perfil Cliente en el JWT (listados pensados solo para el portal del cliente).
 */
export async function requireClienteProfile(headers) {
  const body = await verifyJwtBody(headers);
  const normalized = normalizedProfileTitles(body);
  const ok = normalized.includes('cliente');
  if (!ok) {
    const err = new Error('Se requiere perfil de cliente.');
    err.statusCode = 403;
    throw err;
  }
}
