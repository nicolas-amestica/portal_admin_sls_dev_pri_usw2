import { success } from "../../../helpers/responses";
import * as dynamoDbLib from '../../../libs/dynamodb-v3.js';
import { standardMiddleware } from "../../../libs/middleware/index.js";

const { DYNAMODB_PROGRAM_TABLE, PROGRAM_TABLE } = process.env;

/**
 * Obtiene programas desde DynamoDB filtrando por periodo usando un GSI de fecha.
 */
const getProgramsByPeriod = (periodo) =>
  dynamoDbLib.query({
    TableName: DYNAMODB_PROGRAM_TABLE,
    IndexName: "gsiStartDate-index",
    KeyConditionExpression: "#pk = :pk AND begins_with(#startDate, :startDate)",
    ExpressionAttributeValues: {
      ':pk': PROGRAM_TABLE,
      ":startDate": periodo,
    },
    ExpressionAttributeNames: {
      '#pk': 'pk',
      "#startDate": "startDate"
    },
  });

/**
 * Adapta y ordena los resultados de DynamoDB al formato de vista requerido.
 * Ordena primero por prioridad y luego por fecha de inicio.
 */
const adaptPrograms = (programs) => {
  if (!programs) return [];
  const adaptedPrograms = programs?.map(({ sk, status, content, priority, startDate, sii }) => ({
    sk,
    status,
    type: content[0].type.id,
    school: content[0].school,
    course: content[0].course,
    season: content[0].season,
    representativeName: content[0].representative.name,
    startDate,
    sii,
    priority
  })) ?? [];

  adaptedPrograms.sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    return a.startDate.localeCompare(b.startDate);
  });

  return adaptedPrograms;
};

/**
 * Handler principal para obtener la vista de programas por periodo.
 */
const handler = async (event) => {
  const action = "Obtener programas por periodo.";
  const { periodo } = event.queryParams;

  if (!periodo) {
    const error = new Error('Falta el periodo en la solicitud.');
    error.statusCode = 400;
    throw error;
  }

  const programs = await getProgramsByPeriod(periodo);
  const adaptedPrograms = adaptPrograms(programs);

  return success(200, adaptedPrograms, action);
};

export const main = standardMiddleware(handler);
