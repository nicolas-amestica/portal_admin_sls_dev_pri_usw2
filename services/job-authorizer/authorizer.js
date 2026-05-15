import { getParameterValue } from "../../libs/parameter-store.js";
import { verifyPortalJwt } from "../../libs/jwt-portal.js";

const { SECRET_KEY } = process.env;

if (!SECRET_KEY) throw new Error("SECRET_KEY no está definido en environment variables");

/**
 * Valida el acceso a un método HTTP según los permisos otorgados.
 *
 * @param {string} method - El método HTTP a validar (por ejemplo, "GET", "POST", "PUT", "PATCH", "DELETE").
 * @param {string[]} allowances - Lista de permisos otorgados, donde:
 *   "c" permite crear (POST),
 *   "r" permite leer (GET),
 *   "u" permite actualizar (PUT, PATCH),
 *   "d" permite eliminar (DELETE).
 * @returns {string} Retorna "Allow" si el acceso está permitido según los permisos, de lo contrario retorna "Deny".
 */
const validateAccessToMethod = (method, allowances) => {
  if (method === "POST" && allowances.includes("c")) return "Allow";
  if (method === "GET" && allowances.includes("r")) return "Allow";
  if (method === "PUT" && allowances.includes("u")) return "Allow";
  if (method === "PATCH" && allowances.includes("u")) return "Allow";
  if (method === "DELETE" && allowances.includes("d")) return "Allow";

  return "Deny";
};

/**
 * Crea un objeto de política de autorización para AWS API Gateway.
 *
 * @param {string} effect - El efecto de la política, por ejemplo "Allow" o "Deny".
 * @param {string} resource - El recurso al que se aplica la política (ARN).
 * @returns {Object} Objeto de respuesta de autorización con el documento de política.
 */
const createPolicy = (effect, resource) => {
  const authResponse = {};
  authResponse.principalId = "user";

  if (effect && resource) {
    const policyDocument = {};
    policyDocument.Version = "2012-10-17";
    policyDocument.Statement = [];
    const statementOne = {};
    statementOne.Action = "execute-api:Invoke";
    statementOne.Effect = effect;
    statementOne.Resource = resource;
    policyDocument.Statement[0] = statementOne;
    authResponse.policyDocument = policyDocument;
  }

  return authResponse;
};

/**
 * @description Colecciona fragmentos donde API Gateway HTTP API v2 puede exponer la ruta (`routeArn`, `rawPath`, etc.).
 * @param {Record<string, unknown>} event - Evento del authorizer payload 2.0.
 * @param {string} [routeArn]
 * @returns {string[]}
 */
const collectPathHaystackParts = (event, routeArn) => {
  const parts = [
    routeArn,
    event.rawPath,
    event.requestContext?.http?.path,
    event.routeKey,
    event.requestContext?.routeKey,
  ];
  /** @type {string[]} */
  const out = [];
  for (const p of parts) {
    if (typeof p === "string" && p.length > 0) out.push(p);
  }
  return out;
};

/**
 * @param {string[]} haystackParts
 * @param {string} fragment
 */
const haystackIncludes = (haystackParts, fragment) =>
  haystackParts.some((h) => typeof h === "string" && h.includes(fragment));

/**
 * Valida si se permite el acceso a un endpoint según prefijos del JWT y la ruta invocada.
 *
 * @param {string[]} haystackParts - Rutas/ARN donde buscar coincidencias por substring.
 * @param {string[]} endpoints - Lista de rutas (endpoints) permitidas.
 * @returns {"Allow"|"Deny"}
 */
const validateAccessToEndpoint = (haystackParts, endpoints) => {
  if (!Array.isArray(endpoints) || endpoints.length === 0) {
    return "Deny";
  }
  const allow = endpoints.some(
    (path) => typeof path === "string" && haystackIncludes(haystackParts, path),
  );
  return allow ? "Allow" : "Deny";
};

/**
 * Valida el acceso combinando los permisos de método y endpoint.
 *
 * @param {string} accessToMethod - Permiso de acceso al método ("Allow" o "Deny").
 * @param {string} accessToEndpoint - Permiso de acceso al endpoint ("Allow" o "Deny").
 * @returns {string} "Deny" si alguno de los permisos es "Deny", de lo contrario "Allow".
 */
const validateAccess = (accessToMethod, accessToEndpoint) => {
  if (accessToMethod === "Deny" || accessToEndpoint === "Deny") return "Deny";
  return "Allow";
};

/**
 * @description Resuelve el verbo HTTP del payload 2.0 (a veces falta `requestContext.http.method`).
 * @param {Record<string, unknown>} event
 * @returns {string}
 */
const resolveHttpMethod = (event) => {
  const fromCtx = event.requestContext?.http?.method;
  if (typeof fromCtx === "string" && fromCtx.trim()) return fromCtx.trim().toUpperCase();

  const fromRouteKey = (rk) => {
    if (typeof rk !== "string" || !rk.trim()) return "";
    const sp = rk.indexOf(" ");
    if (sp <= 0) return "";
    return rk.slice(0, sp).trim().toUpperCase();
  };

  const a = fromRouteKey(event.routeKey);
  if (a) return a;

  return fromRouteKey(event.requestContext?.routeKey);
};

/**
 * Genera una política de autorización basada en el token JWT recibido y el método solicitado.
 *
 * @async
 * @param {string} token - El token JWT que contiene la información de autorización del usuario.
 * @param {string} methodArn - El Amazon Resource Name (ARN) del método al que se intenta acceder.
 * @param {string} method - El método HTTP (por ejemplo, GET, POST) que se está solicitando.
 * @param {string[]} haystackParts - Rutas y ARN para validar prefijos del JWT.
 * @returns {Promise<Object>} Retorna una promesa que resuelve en un objeto de política de autorización.
 */
const generatePolicy = async (token, methodArn, method, haystackParts) => {
  const resourceArn = methodArn || "*";

  try {
    if (!SECRET_KEY) {
      throw new Error("SECRET_KEY no está definido correctamente o es inválido");
    }

    const SECRET = await getParameterValue(SECRET_KEY);

    const decoded = verifyPortalJwt(token, SECRET);
    const payload = decoded.body ?? {};
    const rawAllowances = payload.allowances;
    if (typeof rawAllowances !== "string" || !rawAllowances.trim()) {
      return createPolicy("Deny", resourceArn);
    }
    const allowances = rawAllowances.toLowerCase();
    const { endpoints } = payload;
    const profiles = payload.profiles || [];
    const isAdmin = profiles.some((p) => p.includes("ACC#ADMIN") || p === "Administrador");

    if (isAdmin) {
      return createPolicy(validateAccessToMethod(method, allowances), resourceArn);
    }

    // Restricción para api-configuration: solo administradores
    if (haystackIncludes(haystackParts, "v1/configuracion/global")) {
      console.warn(
        `Acceso denegado: se requiere perfil ADMIN para configuración global (perfiles=${profiles.length})`
      );
      return createPolicy("Deny", resourceArn);
    }

    const accessToMethod = validateAccessToMethod(method, allowances);

    // JWT legacy sin `endpoints` (tokens emitidos antes del autorizador por ruta):
    // mismas reglas que antes — solo método + allowances; rutas globales ya filtradas arriba.
    if (!Array.isArray(endpoints) || endpoints.length === 0) {
      if (accessToMethod === "Deny") {
        console.log(`No tiene autorización para acceder al método ${method} (JWT sin endpoints)`);
      }
      return createPolicy(accessToMethod, resourceArn);
    }

    const accessToEndpoint = validateAccessToEndpoint(haystackParts, endpoints);
    const conditionKey = validateAccess(accessToMethod, accessToEndpoint);

    if (conditionKey === "Deny") {
      console.log(`No tiene autorización para acceder al método ${method} o al recurso`);
    }

    return createPolicy(conditionKey, resourceArn);
  } catch (error) {
    console.log("Error en generatePolicy:", error);
    return createPolicy("Deny", resourceArn);
  }
};

/**
 * Autoriza una solicitud basada en el token de autorización proporcionado.
 *
 * @async
 * @function authorize
 * @param {Object} event - El evento recibido por el authorizer de AWS Lambda.
 * @param {string} event.methodArn - El ARN del método al que se intenta acceder.
 * @param {string} event.authorizationToken - El token de autorización en formato Bearer.
 * @returns {Promise<Object|string>} Retorna una política de autorización generada o un mensaje de error.
 */
export const authorize = async (event) => {
  const pathLog = event.requestContext?.http?.path ?? event.rawPath ?? event.routeKey ?? "";
  const httpMethod = resolveHttpMethod(event);
  console.log(`Authorizer request ${httpMethod} ${pathLog}`);

  // Extraer token de HTTP API Payload v2.0
  const authorizationToken = event.identitySource && event.identitySource.length > 0 
    ? event.identitySource[0] 
    : event.headers?.authorization || event.headers?.Authorization;
    
  const methodArn = event.routeArn;
  const haystackParts = collectPathHaystackParts(event, methodArn);

  if (!authorizationToken) {
    console.warn("No se proporcionó authorizationToken o no se pudo extraer del evento (formato v2.0 esperado)");
    return createPolicy("Deny", methodArn || "*");
  }

  const token = authorizationToken.replace("Bearer ", "");
  
  try {
    if (!SECRET_KEY)
      throw new Error("SECRET_KEY no está definido en process.env");

    const policy = await generatePolicy(token, methodArn, httpMethod, haystackParts);
    return policy;
  } catch (error) {
    console.error("Error en authorize:", error);
    return createPolicy("Deny", methodArn || "*");
  }
};
