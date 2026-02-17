import { success } from "../../../helpers/responses";
import { standardMiddleware } from "../../../libs/middleware/index.js";
import { CachedDynamoDB, CacheKeys, CacheMetrics } from "../../../libs/cache/index.js";

const { DYNAMODB_PROGRAM_TABLE, PROGRAM_TABLE } = process.env;

/**
 * Obtiene la lista de programas filtrados por período, con transformación de datos y ordenamiento por prioridad y fecha.
 * 
 * @async
 * @function handler
 * @param {Object} event - Evento de Lambda que contiene los parámetros de la solicitud
 * @param {Object} event.queryParams - Parámetros de consulta de la solicitud
 * @param {string} event.queryParams.periodo - Período de inicio para filtrar los programas (requerido, formato: YYYY-MM-DD)
 * @param {Object} context - Contexto de ejecución de Lambda
 * @returns {Promise<Object>} Respuesta con código de estado 200 y lista de programas ordenados
 * @returns {Promise<Object>} Respuesta.body - Array de objetos programa con propiedades: sk, status, type, school, course, season, representativeName, startDate, priority
 * @throws {Error} Error con statusCode 400 si no se proporciona el parámetro 'periodo'
 * 
 * @description
 * La función:
 * 1. Valida que el período sea proporcionado en los parámetros de consulta
 * 2. Consulta DynamoDB utilizando un índice global secundario (GSI) con caché
 * 3. Transforma los datos extraídos del contenido anidado
 * 4. Ordena los resultados por prioridad (ascendente) y luego por fecha de inicio (ascendente)
 * 5. Registra métricas del caché
 * 6. Retorna los programas procesados
 */
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