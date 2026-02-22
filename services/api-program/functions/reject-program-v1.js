import { success } from "../../../helpers/responses";
import * as dynamoDbLib from '../../../libs/dynamodb-v3';
import { standardMiddleware } from "../../../libs/middleware/index.js";

const {
  PROGRAM_TABLE,
  DYNAMODB_PROGRAM_TABLE
} = process.env;
const ACTION = "Rechazar el programa.";

/**
 * Rechaza un programa especificado por su identificador, asignando una razón de rechazo y actualizando su estado.
 */
const handler = async (event) => {
  const { sk, rejectReason } = event.body;

  if (!sk) {
    const error = new Error('Falta el identificador del programa en la solicitud.');
    error.statusCode = 400;
    throw error;
  }

  if (!rejectReason) {
    const error = new Error('Falta la razón de rechazo en la solicitud.');
    error.statusCode = 400;
    throw error;
  }

  const programs = await dynamoDbLib.query({
    TableName: DYNAMODB_PROGRAM_TABLE,
    KeyConditionExpression: '#pk = :pk AND #sk = :sk',
    ExpressionAttributeValues: { ':pk': PROGRAM_TABLE, ':sk': sk },
    ExpressionAttributeNames: { '#pk': 'pk', '#sk': 'sk' }
  });

  if (!programs || programs.length === 0) {
    const error = new Error('Programa no encontrado.');
    error.statusCode = 404;
    throw error;
  }

  let program = programs[0];

  program.status = 'rejected';
  program.rejectedReason = rejectReason;
  program.updatedAt = new Date().toISOString();
  await dynamoDbLib.put({ TableName: DYNAMODB_PROGRAM_TABLE, Item: program });

  return success(200, program, ACTION);
};

export const main = standardMiddleware(handler);
