import { getAccessProfile } from "./access-profile";
import { success } from "../../../helpers/responses";
import * as dynamoDbLib from "../../../libs/dynamodb-v3";
import { resolvePromises } from "../../../helpers/allsettled";
import { cache, CacheKeys } from "../../../libs/cache/index.js";
import { standardMiddleware } from "../../../libs/middleware/index.js";

const { DYNAMODB_USER_TABLE } = process.env;

/**
 * Obtiene los accesos de un usuario consultando DynamoDB con caché.
 */
const handler = async (event) => {
  console.log("Event ==>", event);
  const action = "Obtener accesos del usuario.";
  const { userId } = event.queryParams;

  console.log("USER_ID ==>", userId);

  // Intentar obtener del caché
  const cacheKey = CacheKeys.userAccess(userId);
  const cachedAccess = cache.get(cacheKey);

  if (cachedAccess) {
    console.log('CACHE_HIT', { key: cacheKey });
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

  return success(200, access, action);
};

export const main = standardMiddleware(handler);
