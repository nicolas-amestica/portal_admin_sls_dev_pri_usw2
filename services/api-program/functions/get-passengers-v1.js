import { success } from '../../../helpers/responses.js';
import * as dynamoDbLib from '../../../libs/dynamodb-v3.js';
import { standardMiddleware } from '../../../libs/middleware/index.js';

const { DYNAMODB_PROGRAM_TABLE, PROGRAM_TABLE } = process.env;
const ACTION = 'Obtener nómina de pasajeros.';

/**
 * Retorna la nómina de pasajeros guardada para un programa.
 *
 * @example
 * GET /v1/pasajeros?programId=PRG%23...
 */
const handler = async (event) => {
  const programId = decodeURIComponent(event.queryParams?.programId ?? '');

  if (!programId) {
    const error = new Error('El identificador del programa es requerido.');
    error.statusCode = 400;
    throw error;
  }

  const program = await dynamoDbLib.getOne({
    TableName: DYNAMODB_PROGRAM_TABLE,
    Key: { pk: PROGRAM_TABLE, sk: programId },
  });

  if (!program) {
    const error = new Error('Programa no encontrado.');
    error.statusCode = 404;
    throw error;
  }

  return success(200, program.passengerList ?? [], ACTION);
};

export const main = standardMiddleware(handler);
