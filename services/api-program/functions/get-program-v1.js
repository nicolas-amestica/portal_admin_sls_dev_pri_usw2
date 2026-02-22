import { success } from "../../../helpers/responses";
import * as dynamoDbLib from '../../../libs/dynamodb-v3.js';
import { standardMiddleware } from "../../../libs/middleware/index.js";

const { DYNAMODB_PROGRAM_TABLE, PROGRAM_TABLE } = process.env;

/**
 * Obtiene un programa del sistema por su identificador único.
 */
const handler = async (event) => {
  const action = "Obtención de programa en sistema.";
  const { programId } = event.pathParams || {};

  if (!programId) {
    const error = new Error('Identificador de programa no encontrado en request.');
    error.statusCode = 400;
    throw error;
  }

  const results = await dynamoDbLib.query({
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

  const result = results && results.length > 0 ? results[0] : null;

  return success(200, result, action);
};

export const main = standardMiddleware(handler);