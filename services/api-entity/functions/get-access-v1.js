import { resolveUserSession, findModuleFavorites } from "./access-profile.js";
import { success } from "../../../helpers/responses.js";
import { cache, CacheKeys } from "../../../libs/cache/index.js";
import { standardMiddleware } from "../../../libs/middleware/index.js";

/**
 * Obtiene los accesos del menú de un usuario autenticado usando la nueva estructura IAM.
 * Acepta el email del usuario como parámetro `userId` en el query string.
 * Usa caché en memoria para reducir llamadas a DynamoDB en invocaciones warm.
 */
const handler = async (event) => {
  console.log("Event ==>", event);
  const action = "Obtener accesos del usuario.";
  const { userId } = event.queryParams; // userId = email del usuario

  if (!userId) {
    const error = new Error("Se requiere el parámetro userId.");
    error.statusCode = 400;
    throw error;
  }

  const cacheKey = CacheKeys.userAccess(userId);
  const cached = cache.get(cacheKey);

  let access;

  if (cached) {
    console.log("CACHE_HIT", { key: cacheKey });
    access = cached.access;
  } else {
    console.log("CACHE_MISS", { key: cacheKey });
    const result = await resolveUserSession(userId);

    if (!result.access || result.access.length === 0) {
      const error = new Error("Acceso Restringido.");
      error.statusCode = 403;
      throw error;
    }

    access = result.access;
    cache.set(cacheKey, { access }, CacheKeys.TTL.USER_ACCESS);
    console.log("CACHE_SET", { key: cacheKey, ttl: `${CacheKeys.TTL.USER_ACCESS}ms` });
  }

  // moduleFavorites nunca se cachea: cambia con cada toggle del usuario
  const moduleFavorites = await findModuleFavorites(userId);

  return success(200, { access, moduleFavorites: moduleFavorites ?? [] }, action);
};

export const main = standardMiddleware(handler);
