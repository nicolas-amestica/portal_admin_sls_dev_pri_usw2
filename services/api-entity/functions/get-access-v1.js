import { getAccessProfile } from "./access-profile";
import * as dynamoDbLib from "../../../libs/dynamodb-v3";
import { resolvePromises } from "../../../helpers/allsettled";
import { success, unsuccessful } from "../../../helpers/responses";
import { standardMiddleware } from "../../../libs/middleware/index.js";
import { cache, CacheKeys, CacheMetrics } from "../../../libs/cache/index.js";

const { DYNAMODB_USER_TABLE } = process.env;

const handler = async (event, context) => {
  console.log(event);
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
