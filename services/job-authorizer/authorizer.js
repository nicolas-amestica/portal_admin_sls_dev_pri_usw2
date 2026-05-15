import { getParameterValue } from "../../libs/parameter-store.js";
import { verifyPortalJwt } from "../../libs/jwt-portal.js";

const { SECRET_KEY } = process.env;

if (!SECRET_KEY) throw new Error("SECRET_KEY no está definido en environment variables");

/**
 * @description Respuesta simple para el formato 2.0 con EnableSimpleResponses.
 * Elimina el problema de IAM Policy con Resource ARN fijo en caché.
 * @param {boolean} isAuthorized
 * @returns {{ isAuthorized: boolean }}
 */
const simpleResponse = (isAuthorized) => ({ isAuthorized });

/**
 * @description Valida el acceso al método HTTP según allowances del JWT.
 * @param {string} method
 * @param {string} allowances - Cadena "crud" o subset.
 * @returns {boolean}
 */
const isMethodAllowed = (method, allowances) => {
  const m = (method ?? "").toUpperCase();
  if (m === "GET" && allowances.includes("r")) return true;
  if (m === "POST" && allowances.includes("c")) return true;
  if ((m === "PUT" || m === "PATCH") && allowances.includes("u")) return true;
  if (m === "DELETE" && allowances.includes("d")) return true;
  return false;
};

/**
 * @description Resuelve el verbo HTTP desde el evento payload 2.0.
 * `requestContext.http.method` es la fuente primaria; si falta, se extrae del `routeKey`.
 * @param {Record<string, unknown>} event
 * @returns {string}
 */
const resolveHttpMethod = (event) => {
  const fromCtx = event.requestContext?.http?.method;
  if (typeof fromCtx === "string" && fromCtx.trim()) return fromCtx.trim().toUpperCase();

  const extractFromRouteKey = (rk) => {
    if (typeof rk !== "string" || !rk.trim()) return "";
    const sp = rk.indexOf(" ");
    return sp > 0 ? rk.slice(0, sp).trim().toUpperCase() : "";
  };

  return (
    extractFromRouteKey(event.routeKey) ||
    extractFromRouteKey(event.requestContext?.routeKey) ||
    ""
  );
};

/**
 * @description Colecciona los campos donde API Gateway HTTP API v2 expone la ruta de la petición.
 * Se usa para buscar prefijos del JWT como substring.
 * @param {Record<string, unknown>} event
 * @returns {string[]}
 */
const collectPathParts = (event) => {
  const candidates = [
    event.rawPath,
    event.requestContext?.http?.path,
    event.routeKey,
    event.requestContext?.routeKey,
    event.routeArn,
  ];
  return candidates.filter((p) => typeof p === "string" && p.length > 0);
};

/**
 * @description Comprueba si algún fragmento del haystack contiene el prefijo buscado.
 * @param {string[]} pathParts
 * @param {string} prefix
 * @returns {boolean}
 */
const pathMatchesPrefix = (pathParts, prefix) =>
  pathParts.some((h) => h.includes(prefix));

/**
 * @description Verifica que la ruta invocada esté cubierta por al menos un prefijo del JWT.
 * @param {string[]} pathParts
 * @param {string[]} endpoints
 * @returns {boolean}
 */
const isEndpointAllowed = (pathParts, endpoints) => {
  if (!Array.isArray(endpoints) || endpoints.length === 0) return false;
  return endpoints.some((p) => typeof p === "string" && pathMatchesPrefix(pathParts, p));
};

/**
 * @description Evalúa si el token JWT autoriza el acceso a la ruta/método solicitado.
 * @param {string} token
 * @param {string} method
 * @param {string[]} pathParts
 * @returns {Promise<boolean>}
 */
const evaluate = async (token, method, pathParts) => {
  const SECRET = await getParameterValue(SECRET_KEY);
  const decoded = verifyPortalJwt(token, SECRET);
  const payload = decoded.body ?? {};

  const rawAllowances = payload.allowances;
  if (typeof rawAllowances !== "string" || !rawAllowances.trim()) {
    console.warn("Authorizer: JWT sin allowances");
    return false;
  }
  const allowances = rawAllowances.toLowerCase();

  if (!isMethodAllowed(method, allowances)) {
    console.log(`Authorizer: método ${method} no permitido (allowances=${allowances})`);
    return false;
  }

  const profiles = Array.isArray(payload.profiles) ? payload.profiles : [];
  const isAdmin = profiles.some(
    (p) => typeof p === "string" && (p.toLowerCase().includes("acc#admin") || p.toLowerCase() === "administrador"),
  );

  if (isAdmin) return true;

  // Ruta exclusiva de administradores: api-configuration global
  if (pathMatchesPrefix(pathParts, "v1/configuracion/global")) {
    console.warn("Authorizer: configuración global requiere perfil admin");
    return false;
  }

  const { endpoints } = payload;

  // JWT legacy (sin endpoints): backward-compat — solo valida método
  if (!Array.isArray(endpoints) || endpoints.length === 0) {
    console.log("Authorizer: JWT sin endpoints — modo legacy, solo valida método");
    return true;
  }

  const allowed = isEndpointAllowed(pathParts, endpoints);
  if (!allowed) {
    console.log(`Authorizer: ruta no cubierta por endpoints del JWT (pathParts=${JSON.stringify(pathParts)})`);
  }
  return allowed;
};

/**
 * @description Handler del Lambda Authorizer (payload 2.0, EnableSimpleResponses).
 * Devuelve `{ isAuthorized: boolean }` — elimina el problema de Resource ARN en caché IAM.
 *
 * @param {Record<string, unknown>} event
 * @returns {Promise<{ isAuthorized: boolean }>}
 */
export const authorize = async (event) => {
  const method = resolveHttpMethod(event);
  const pathLog = event.requestContext?.http?.path ?? event.rawPath ?? event.routeKey ?? "";
  console.log(`Authorizer ${method} ${pathLog}`);

  // identitySource[0] = Authorization header (payload 2.0 pasa array)
  const rawToken =
    (Array.isArray(event.identitySource) && event.identitySource.length > 0
      ? event.identitySource[0]
      : event.headers?.authorization ?? event.headers?.Authorization) ?? "";

  if (!rawToken) {
    console.warn("Authorizer: sin token de autorización");
    return simpleResponse(false);
  }

  const token = rawToken.replace(/^Bearer\s+/i, "").trim();
  if (!token) {
    console.warn("Authorizer: token vacío tras quitar prefijo Bearer");
    return simpleResponse(false);
  }

  try {
    const pathParts = collectPathParts(event);
    const authorized = await evaluate(token, method, pathParts);
    return simpleResponse(authorized);
  } catch (error) {
    console.error("Authorizer error:", error?.message ?? error);
    return simpleResponse(false);
  }
};
