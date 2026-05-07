import jwt from 'jsonwebtoken';
import { getParameterValue } from '../../../libs/parameter-store.js';

/**
 * @description Decodifica el JWT del header Authorization y devuelve email y perfiles.
 */
export const resolveAuthContext = async (event) => {
  const secretPath = process.env.SECRET_KEY;
  if (!secretPath) {
    const err = new Error('Configuración del servidor incompleta');
    err.statusCode = 500;
    throw err;
  }

  const headers = event.headers || {};
  const auth = headers.authorization ?? headers.Authorization;
  if (!auth || !String(auth).startsWith('Bearer ')) {
    const err = new Error('No autorizado');
    err.statusCode = 401;
    throw err;
  }

  const token = String(auth).slice(7).trim();
  const secret = await getParameterValue(secretPath);
  try {
    const decoded = jwt.verify(token, secret);
    const body = decoded.body ?? {};
    return {
      email: body.email,
      profiles: body.profiles ?? [],
      profileIds: body.profileIds ?? [],
    };
  } catch {
    const err = new Error('Token inválido o expirado');
    err.statusCode = 401;
    throw err;
  }
};
