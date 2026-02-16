import { success } from "../../../helpers/responses";
import { standardMiddleware } from "../../../libs/middleware/index.js";
import { CachedDynamoDB, CacheKeys, CacheMetrics } from "../../../libs/cache/index.js";

const { DYNAMODB_PROGRAM_TABLE, PROGRAM_TABLE } = process.env;

const handler = async (event, context) => {
  const action = "Obtener programas por periodo en sistema.";
  const { periodo } = event.queryParams;

  if (!periodo) {
    const error = new Error('Falta el periodo en la solicitud.');
    error.statusCode = 400;
    throw error;
  }

  const params = {
    TableName: DYNAMODB_PROGRAM_TABLE,
    IndexName: "gsiStartDate-index",
    ReturnConsumedCapacity: "TOTAL",
    KeyConditionExpression: "#pk = :pk And begins_with(#startDate, :startDate)",
    ExpressionAttributeValues: {
      ':pk': PROGRAM_TABLE,
      ":startDate": periodo,
    },
    ExpressionAttributeNames: {
      '#pk': 'pk',
      "#startDate": "startDate"
    },
  };

  // Usar caché para la consulta
  const cacheKey = CacheKeys.programList(periodo);
  const result = await CachedDynamoDB.query(
    params,
    cacheKey,
    CacheKeys.TTL.PROGRAM_LIST
  );

  const programs = result?.map(({ sk, status, content, priority, startDate }) => ({
    sk,
    status,
    type: content[0].type.id,
    school: content[0].school,
    course: content[0].course,
    season: content[0].season,
    representativeName: content[0].representative.name,
    startDate,
    priority
  })) ?? [];

  programs.sort((a, b) => {
    if (a.priority !== b.priority) {
      return a.priority - b.priority;
    }
    return a.startDate.localeCompare(b.startDate);
  });

  // Log de estadísticas del caché
  CacheMetrics.logDetailedStats('get-programs-view-v1', context);

  return success(200, programs, action);
};


export const main = standardMiddleware(handler);
