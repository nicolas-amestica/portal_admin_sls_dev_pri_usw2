import { success } from "../../../helpers/responses";
import * as dynamoDbLib from '../../../libs/dynamodb-v3.js';
import { standardMiddleware } from "../../../libs/middleware/index.js";

const { DYNAMODB_PROGRAM_TABLE, PROGRAM_TABLE } = process.env;

/**
 * Obtiene un programa desde DynamoDB usando el ID como prefijo del sk.
 */
const getProgramById = (programId) =>
  dynamoDbLib.query({
    TableName: DYNAMODB_PROGRAM_TABLE,
    KeyConditionExpression: '#pk = :pk AND begins_with(#sk, :sk)',
    ExpressionAttributeValues: {
      ':pk': PROGRAM_TABLE,
      ':sk': programId,
    },
    ExpressionAttributeNames: {
      '#pk': 'pk',
      '#sk': 'sk'
    }
  });

/**
 * Handler principal para obtener un programa por su identificador único.
 */
const handler = async (event) => {
  const action = "Obtener programa.";
  const { programId } = event.pathParams || {};

  if (!programId) {
    const error = new Error('Identificador de programa no encontrado en request.');
    error.statusCode = 400;
    throw error;
  }

  const results = await getProgramById(programId);
  const result = results?.[0] ?? null;

  if (!result) {
    const error = new Error('Programa no encontrado.');
    error.statusCode = 404;
    throw error;
  }

  return success(200, result, action);
};

export const main = standardMiddleware(handler);
