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
 * Normaliza el routeArn a wildcard de API para evitar el bug de caché donde
 * API Gateway reutiliza una política con Resource=ARN_ruta_A para la ruta B.
 * @param {string|undefined} arn
 * @returns {string}
 */
const normalizeArn = (arn) => {
  if (!arn || typeof arn !== "string") return "arn:aws:execute-api:*:*:*";
  return arn.replace(/\/[^/]+\/[A-Z]+\/.+$/, "/*");
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
    statementOne.Resource = normalizeArn(resource);
    policyDocument.Statement[0] = statementOne;
    authResponse.policyDocument = policyDocument;
  }

  return authResponse;
};

/**
 * Valida si se permite el acceso a un endpoint específico basado en el ARN del método y una lista de endpoints permitidos.
 *
 * @param {string} methodArn - El ARN del método al que se intenta acceder.
 * @param {string[]} endpoints - Lista de rutas (endpoints) permitidas.
 * @returns {"Allow"|"Deny"} Retorna "Allow" si el acceso está permitido, de lo contrario retorna "Deny".
 */
const validateAccessToEndpoint = (methodArn, endpoints) => {
  // Backward-compat: JWTs anteriores sin campo endpoints solo validan por método HTTP.
  if (!Array.isArray(endpoints) || endpoints.length === 0) {
    return "Allow";
  }
  const allow = endpoints.some((path) => methodArn.includes(path));
  return allow ? "Allow" : "Deny";
};

const AUTHENTICATED_ENDPOINT_PREFIXES = [
  "v1/sesiones/renovar-sesion",
  "v1/usuarios/perfil",
  "v1/iam/accesos/aplicaciones/GI/user",
  "v1/favoritos",
  "v1/dashboard",
  "v1/mantenedor/medios-informativos",
];

const isAuthenticatedEndpoint = (methodArn) =>
  AUTHENTICATED_ENDPOINT_PREFIXES.some((path) => methodArn.includes(path));

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
 * Genera una política de autorización basada en el token JWT recibido y el método solicitado.
 *
 * @async
 * @param {string} token - El token JWT que contiene la información de autorización del usuario.
 * @param {string} methodArn - El Amazon Resource Name (ARN) del método al que se intenta acceder.
 * @param {string} method - El método HTTP (por ejemplo, GET, POST) que se está solicitando.
 * @returns {Promise<Object>} Retorna una promesa que resuelve en un objeto de política de autorización.
 */
const generatePolicy = async (token, methodArn, method) => {
  try {
    if (!SECRET_KEY) {
      throw new Error("SECRET_KEY no está definido correctamente o es inválido");
    }

    const SECRET = await getParameterValue(SECRET_KEY);

    const decoded = verifyPortalJwt(token, SECRET);
    const payload = decoded.body ?? {};
    const rawAllowances = payload.allowances;
    if (typeof rawAllowances !== "string" || !rawAllowances.trim()) {
      return createPolicy("Deny", methodArn);
    }
    const allowances = rawAllowances.toLowerCase();
    const { endpoints } = payload;
    const profiles = payload.profiles || [];
    const isAdmin = profiles.some((p) => p.includes("ACC#ADMIN") || p === "Administrador");

    if (isAdmin) {
      return createPolicy(validateAccessToMethod(method, allowances), methodArn);
    }

    if (isAuthenticatedEndpoint(methodArn)) {
      return createPolicy(validateAccessToMethod(method, allowances), methodArn);
    }

    // Restricción para api-configuration: solo administradores
    if (methodArn.includes("v1/configuracion/global")) {
      console.warn(
        `Acceso denegado: se requiere perfil ADMIN para configuración global (perfiles=${profiles.length})`
      );
      return createPolicy("Deny", methodArn);
    }

    const accessToMethod = validateAccessToMethod(method, allowances);
    const accessToEndpoint = validateAccessToEndpoint(methodArn, endpoints);

    const conditionKey = validateAccess(accessToMethod, accessToEndpoint);

    if (conditionKey === "Deny")
      console.log(`No tiene autorización para acceder al método ${method}`);

    return createPolicy(conditionKey, methodArn);
  } catch (error) {
    console.log("Error en generatePolicy:", error);
    return createPolicy("Deny", methodArn);
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
  const routeKey = event.requestContext?.http?.path ?? event.routeKey ?? "";
  const method = event.requestContext?.http?.method ?? "";
  console.log(`Authorizer request ${method} ${routeKey}`);

  // Extraer token de HTTP API Payload v2.0
  const authorizationToken = event.identitySource && event.identitySource.length > 0 
    ? event.identitySource[0] 
    : event.headers?.authorization || event.headers?.Authorization;
    
  const methodArn = event.routeArn;
  const httpMethod = event.requestContext?.http?.method;

  if (!authorizationToken) {
    console.warn("No se proporcionó authorizationToken o no se pudo extraer del evento (formato v2.0 esperado)");
    return createPolicy("Deny", methodArn || "*");
  }

  const token = authorizationToken.replace("Bearer ", "");
  
  try {
    if (!SECRET_KEY)
      throw new Error("SECRET_KEY no está definido en process.env");

    const policy = await generatePolicy(token, methodArn, httpMethod);
    return policy;
  } catch (error) {
    console.error("Error en authorize:", error);
    return createPolicy("Deny", methodArn || "*");
  }
};
