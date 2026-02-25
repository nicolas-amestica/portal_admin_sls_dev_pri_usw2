import { success } from "../../../helpers/responses.js";
import * as dynamoDbLib from '../../../libs/dynamodb-v3.js';
import { standardMiddleware } from "../../../libs/middleware/index.js";

const { PROGRAM_TABLE, DYNAMODB_PROGRAM_TABLE } = process.env;
const ACTION = "Confirmar programa.";

/**
 * Obtiene un programa desde DynamoDB por su clave de ordenación exacta.
 */
const getProgramBySk = (sk) =>
  dynamoDbLib.getOne({
    TableName: DYNAMODB_PROGRAM_TABLE,
    Key: { pk: PROGRAM_TABLE, sk }
  });

/**
 * Handler principal para confirmar el estado de un programa.
 */
const handler = async (event) => {
  const { sk } = event.body;

  if (!sk) {
    const error = new Error('Falta el identificador del programa en la solicitud.');
    error.statusCode = 400;
    throw error;
  }

  const program = await getProgramBySk(sk);

  if (!program) {
    const error = new Error('Programa no encontrado.');
    error.statusCode = 404;
    throw error;
  }

  program.status = 'confirmed';
  program.priority = 2;
  program.updatedAt = new Date().toISOString();

  const confirmedProgram = await dynamoDbLib.put({ TableName: DYNAMODB_PROGRAM_TABLE, Item: program });

  return success(200, confirmedProgram, ACTION);
};

export const main = standardMiddleware(handler);
