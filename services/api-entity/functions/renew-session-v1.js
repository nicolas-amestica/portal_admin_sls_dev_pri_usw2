import { success } from "../../../helpers/responses.js";
import { getParameterValue } from "../../../libs/parameter-store.js";
import { standardMiddleware } from "../../../libs/middleware/index.js";
import { assertPortalJwtSecret, verifyPortalJwt, signPortalJwt } from "../../../libs/jwt-portal.js";

const { SECRET_KEY } = process.env;

/**
 * Verifica el JWT del header Authorization y retorna el payload decodificado.
 *
 * @param {string} authHeader - Valor del header Authorization (Bearer <token>).
 * @param {string} secret - Clave secreta JWT.
 * @returns {Object} Payload decodificado.
 * @throws {Error} Si el header no existe o el token es inválido/expirado.
 */
const verifyToken = (authHeader, secret) => {
  if (!authHeader?.startsWith("Bearer ")) {
    const error = new Error("No autorizado. Se requiere token de acceso.");
    error.statusCode = 401;
    throw error;
  }
  const token = authHeader.split(" ")[1];
  try {
    return verifyPortalJwt(token, secret);
  } catch {
    const error = new Error("Token inválido o expirado.");
    error.statusCode = 401;
    throw error;
  }
};

/**
 * Renueva el token JWT del usuario autenticado generando uno nuevo con TTL de 3 días.
 *
 * La ruta está protegida por el JWT Authorizer. El handler verifica el token
 * del header, extrae el payload original y emite un nuevo JWT con TTL renovado,
 * sin necesidad de que el usuario vuelva a autenticarse con contraseña.
 *
 * @param {Object} event - Evento Lambda con `headers.authorization`.
 * @returns {{ token: string }} Nuevo token JWT.
 */
const handler = async (event) => {
  const action = "Renovación de sesión de usuario.";
  const authHeader = event.headers?.authorization ?? event.headers?.Authorization;

  const secret = await getParameterValue(SECRET_KEY);
  assertPortalJwtSecret(secret);
  const decoded = verifyToken(authHeader, secret);

  if (!decoded.body) {
    const error = new Error("Token sin información de usuario.");
    error.statusCode = 401;
    throw error;
  }

  const newToken = signPortalJwt({ body: decoded.body }, secret);

  return success(200, { token: newToken }, action);
};

export const main = standardMiddleware(handler);
