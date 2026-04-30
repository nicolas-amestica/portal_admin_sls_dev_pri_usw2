import { success } from "../../../helpers/responses";
import * as dynamoDbLib from '../../../libs/dynamodb-v3.js';
import { standardMiddleware } from "../../../libs/middleware/index.js";

const { DYNAMODB_PROGRAM_TABLE, PROGRAM_TABLE } = process.env;
const ACTION = "Guardar nómina de pasajeros.";

/**
 * Guarda la nómina completa de pasajeros de un programa.
 *
 * Recibe el programId y el array de pasajeros y actualiza el campo
 * `passengerList` del programa en DynamoDB sin tocar el resto del documento.
 *
 * @example
 * POST /v1/pasajeros
 * Body: { programId: "PRG#...", passengers: [{ names, lastNames, rut, birthDate, sex, nationality, id }] }
 */
const handler = async (event) => {
  const { programId, passengers } = event.body;

  if (!programId) {
    const error = new Error('El identificador del programa es requerido.');
    error.statusCode = 400;
    throw error;
  }

  if (!Array.isArray(passengers)) {
    const error = new Error('El campo passengers debe ser un arreglo.');
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

  const result = await dynamoDbLib.update({
    TableName: DYNAMODB_PROGRAM_TABLE,
    Key: { pk: PROGRAM_TABLE, sk: programId },
    UpdateExpression: 'SET passengerList = :passengers, updatedAt = :updatedAt',
    ExpressionAttributeValues: {
      ':passengers': passengers,
      ':updatedAt': new Date().toISOString(),
    },
  });

  return success(200, result, ACTION);
};

export const main = standardMiddleware(handler);
