import { getParameterValue } from "../../libs/parameter-store.js";
import { verifyPortalJwt } from "../../libs/jwt-portal.js";

const { SECRET_KEY } = process.env;

if (!SECRET_KEY) throw new Error("SECRET_KEY no está definido en environment variables");

/** @param {boolean} isAuthorized @returns {{ isAuthorized: boolean }} */
const simpleResponse = (isAuthorized) => ({ isAuthorized });

/**
 * Valida el método HTTP contra los allowances del JWT.
 * @param {string} method  @param {string} allowances  @returns {boolean}
 */
const isMethodAllowed = (method, allowances) => {
  const m = (method ?? "").toUpperCase();
  if (m === "GET"    && allowances.includes("r")) return true;
  if (m === "POST"   && allowances.includes("c")) return true;
  if ((m === "PUT" || m === "PATCH") && allowances.includes("u")) return true;
  if (m === "DELETE" && allowances.includes("d")) return true;
  return false;
};

/**
 * Resuelve el verbo HTTP desde el evento HTTP API payload 2.0.
 * @param {Record<string, unknown>} event @returns {string}
 */
const resolveHttpMethod = (event) => {
  const fromCtx = event.requestContext?.http?.method;
  if (typeof fromCtx === "string" && fromCtx.trim()) return fromCtx.trim().toUpperCase();
  const rk = event.routeKey ?? event.requestContext?.routeKey ?? "";
  if (typeof rk === "string") {
    const sp = rk.indexOf(" ");
    if (sp > 0) return rk.slice(0, sp).trim().toUpperCase();
  }
  return "";
};

/**
 * Recopila los fragmentos de ruta disponibles en el evento del authorizer.
 * Se usa para comparar contra los endpoints del JWT como substring.
 * @param {Record<string, unknown>} event @returns {string[]}
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

/** @param {string[]} pathParts @param {string} prefix @returns {boolean} */
const pathMatchesPrefix = (pathParts, prefix) =>
  pathParts.some((h) => h.includes(prefix));

/** @param {string[]} pathParts @param {string[]} endpoints @returns {boolean} */
const isEndpointAllowed = (pathParts, endpoints) => {
  if (!Array.isArray(endpoints) || endpoints.length === 0) return false;
  return endpoints.some((p) => typeof p === "string" && pathMatchesPrefix(pathParts, p));
};

/**
 * Evalúa si el token JWT autoriza el acceso a la ruta y método solicitados.
 * @param {string} token @param {string} method @param {string[]} pathParts
 * @returns {Promise<boolean>}
 */
const evaluate = async (token, method, pathParts) => {
  const SECRET = await getParameterValue(SECRET_KEY);
  const decoded = verifyPortalJwt(token, SECRET);
  const payload = decoded.body ?? {};

  const rawAllowances = payload.allowances;
  if (typeof rawAllowances !== "string" || !rawAllowances.trim()) {
    console.warn("Authorizer: JWT sin allowances válidos");
    return false;
  }
  const allowances = rawAllowances.toLowerCase();

  if (!isMethodAllowed(method, allowances)) {
    console.log(`Authorizer: método ${method} no permitido (allowances=${allowances})`);
    return false;
  }

  const profiles = Array.isArray(payload.profiles) ? payload.profiles : [];
  const isAdmin = profiles.some(
    (p) => typeof p === "string" &&
      (p.toLowerCase().includes("acc#admin") || p.toLowerCase() === "administrador"),
  );

  if (isAdmin) return true;

  // Configuración global: solo administradores
  if (pathMatchesPrefix(pathParts, "v1/configuracion/global")) {
    console.warn("Authorizer: configuración global requiere perfil admin");
    return false;
  }

  const { endpoints } = payload;

  // Backward-compat: JWT sin campo endpoints (sesiones anteriores) solo valida método
  if (!Array.isArray(endpoints) || endpoints.length === 0) {
    console.log("Authorizer: JWT sin endpoints — modo legacy, acceso por método");
    return true;
  }

  const allowed = isEndpointAllowed(pathParts, endpoints);
  if (!allowed) {
    console.log(`Authorizer: ruta no cubierta por endpoints del JWT (path=${pathParts[0] ?? "?"})`);
  }
  return allowed;
};

/**
 * Handler del Lambda Authorizer (HTTP API payload 2.0, EnableSimpleResponses).
 * Retorna { isAuthorized: boolean } — evita el bug de caché con Resource ARN.
 * @param {Record<string, unknown>} event
 * @returns {Promise<{ isAuthorized: boolean }>}
 */
export const authorize = async (event) => {
  const method = resolveHttpMethod(event);
  const pathLog = event.rawPath ?? event.requestContext?.http?.path ?? event.routeKey ?? "";
  console.log(`Authorizer ${method} ${pathLog}`);

  // Buscar el token Bearer entre todos los identity sources (el orden no está garantizado).
  // El routeKey tiene formato "METHOD /path" y nunca empieza con "Bearer ".
  const idSrc = event.identitySource;
  const rawToken = (() => {
    if (Array.isArray(idSrc) && idSrc.length > 0) {
      const bearer = idSrc.find((s) => typeof s === "string" && /^Bearer\s+/i.test(s));
      if (bearer) return bearer;
      const jwt = idSrc.find((s) => typeof s === "string" && s.split(".").length === 3);
      if (jwt) return jwt;
    }
    return event.headers?.authorization ?? event.headers?.Authorization ?? "";
  })();

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
