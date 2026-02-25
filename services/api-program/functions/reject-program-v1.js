import { success } from "../../../helpers/responses";
import * as dynamoDbLib from '../../../libs/dynamodb-v3';
import { standardMiddleware } from "../../../libs/middleware/index.js";

const { PROGRAM_TABLE, DYNAMODB_PROGRAM_TABLE } = process.env;
const ACTION = "Rechazar el programa.";

/**
 * Obtiene un programa desde DynamoDB por su clave de ordenación exacta.
 */
const getProgramBySk = (sk) =>
  dynamoDbLib.getOne({
    TableName: DYNAMODB_PROGRAM_TABLE,
    Key: { pk: PROGRAM_TABLE, sk }
  });

/**
 * Handler principal para rechazar un programa con una razón especificada.
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

  const program = await getProgramBySk(sk);

  if (!program) {
    const error = new Error('Programa no encontrado.');
    error.statusCode = 404;
    throw error;
  }

  program.status = 'rejected';
  program.priority = 5;
  program.rejectedReason = rejectReason;
  program.updatedAt = new Date().toISOString();

  await dynamoDbLib.put({ TableName: DYNAMODB_PROGRAM_TABLE, Item: program });

  return success(200, program, ACTION);
};

export const main = standardMiddleware(handler);
