import { resolveUserSession, findModuleFavorites } from "./access-profile.js";
import { success } from "../../../helpers/responses.js";
import { cache, CacheKeys } from "../../../libs/cache/index.js";
import { standardMiddleware } from "../../../libs/middleware/index.js";
import { getPortalJwtBodyFromEvent } from "../../../libs/fn-get-portal-jwt-body-from-event.js";
import { assertPortalAdministrador } from "../../../libs/assert-portal-administrador.js";

/**
 * Obtiene los accesos del menú de un usuario autenticado usando la nueva estructura IAM.
 * Acepta el email del usuario como parámetro `userId` en el query string.
 * Usa caché en memoria para reducir llamadas a DynamoDB en invocaciones warm.
 */
const handler = async (event) => {
  const action = "Obtener accesos del usuario.";
  const { userId } = event.queryParams;
  const jwtBody = await getPortalJwtBodyFromEvent(event);
  const callerEmail = String(jwtBody.email ?? "").trim().toLowerCase();

  if (!userId) {
    const error = new Error("Se requiere el parámetro userId.");
    error.statusCode = 400;
    throw error;
  }

  const requested = decodeURIComponent(String(userId)).trim().toLowerCase();
  if (requested !== callerEmail) {
    assertPortalAdministrador(jwtBody.profiles);
  }

  const cacheKey = CacheKeys.userAccess(requested);
  const cached = cache.get(cacheKey);

  let access;

  if (cached) {
    access = cached.access;
  } else {
    const result = await resolveUserSession(requested);

    if (!result.access || result.access.length === 0) {
      const error = new Error("Acceso Restringido.");
      error.statusCode = 403;
      throw error;
    }

    access = result.access;
    cache.set(cacheKey, { access }, CacheKeys.TTL.USER_ACCESS);
  }

  // moduleFavorites nunca se cachea: cambia con cada toggle del usuario
  const moduleFavorites = await findModuleFavorites(requested);

  return success(200, { access, moduleFavorites: moduleFavorites ?? [] }, action);
};

export const main = standardMiddleware(handler);
