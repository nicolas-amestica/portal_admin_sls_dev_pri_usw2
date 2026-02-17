import { getAccessProfile } from "./access-profile";
import { success } from "../../../helpers/responses";
import * as dynamoDbLib from "../../../libs/dynamodb-v3";
import { resolvePromises } from "../../../helpers/allsettled";
import { standardMiddleware } from "../../../libs/middleware/index.js";
import { cache, CacheKeys, CacheMetrics } from "../../../libs/cache/index.js";

const { DYNAMODB_USER_TABLE } = process.env;

/**
 * Obtiene los permisos de acceso de un usuario desde caché o base de datos.
 * 
 * Realiza consultas a DynamoDB utilizando un índice GSI para recuperar los perfiles
 * y permisos del usuario. Los resultados se cachean para optimizar consultas posteriores.
 * 
 * @async
 * @function handler
 * @param {Object} event - Evento de la solicitud Lambda
 * @param {Object} event.queryParams - Parámetros de consulta
 * @param {string} event.queryParams.userId - ID del usuario en formato "prefix#gsi"
 * @param {Object} context - Contexto de ejecución Lambda
 * @returns {Promise<Object>} Respuesta con código 200 y array de permisos de acceso
 * @throws {Error} Error 403 si el usuario no tiene perfiles, accesos habilitados o está restringido
 * 
 * @description
 * - Intenta obtener los accesos del caché mediante la clave del usuario
 * - Si no existe en caché (CACHE_MISS), consulta DynamoDB usando el GSI
 * - Extrae el valor GSI del userId (parte después del "#")
 * - Recupera los perfiles asociados al usuario
 * - Para cada perfil, obtiene sus permisos de acceso
 * - Combina accesos directos del usuario con accesos heredados de perfiles
 * - Almacena el resultado en caché con TTL configurado
 * - Registra métricas detalladas de caché
 */
const handler = async (event, context) => {
  console.log("Event ==>", event);
  const action = "Obtener accesos del usuario.";
  const { userId } = event.queryParams;

  console.log("USER_ID ==>", userId);

  // Intentar obtener del caché
  const cacheKey = CacheKeys.userAccess(userId);
  const cachedAccess = cache.get(cacheKey);

  if (cachedAccess) {
    console.log('CACHE_HIT', { key: cacheKey });
    CacheMetrics.logDetailedStats('get-access-v1', context);
    return success(200, cachedAccess, action);
  }

  console.log('CACHE_MISS', { key: cacheKey });

  const gsi = userId.split("#")[1];
  const params = {
    TableName: DYNAMODB_USER_TABLE,
    IndexName: "gsiOne-index",
    ReturnConsumedCapacity: "TOTAL",
    KeyConditionExpression: "#gsiOne = :gsiOne",
    ExpressionAttributeValues: {
      ":gsiOne": gsi,
    },
    ExpressionAttributeNames: {
      "#gsiOne": "gsiOne",
    },
  };

  console.log("PARAMS ==>", params);

  const userPromise = dynamoDbLib.query(params);
  const [resultPromises] = await resolvePromises([userPromise]);

  console.log("RESULT ==>", resultPromises);

  if (!resultPromises[0]?.profiles) {
    const error = new Error('Acceso Restringido.');
    error.statusCode = 403;
    throw error;
  }

  const accessProfiles = [];

  for (const profile of resultPromises[0].profiles) {
    const access = await getAccessProfile(profile);
    if (!access) {
      const error = new Error('Al usuario le faltan accesos habilitados.');
      error.statusCode = 403;
      throw error;
    }
    accessProfiles.push(...access[0]?.access);
  }

  const singleAccess = resultPromises[0].access || [];
  let access = [];

  if (singleAccess.length > 0) access = [...singleAccess];

  if (accessProfiles.length > 0)
    accessProfiles.forEach((acc) => access.push(acc));

  if (!access && access.length === 0) {
    const error = new Error('Acceso Restringido.');
    error.statusCode = 403;
    throw error;
  }

  // Guardar en caché
  cache.set(cacheKey, access, CacheKeys.TTL.USER_ACCESS);
  console.log('CACHE_SET', { key: cacheKey, ttl: `${CacheKeys.TTL.USER_ACCESS}ms` });

  CacheMetrics.logDetailedStats('get-access-v1', context);

  return success(200, access, action);
};

export const main = standardMiddleware(handler);
