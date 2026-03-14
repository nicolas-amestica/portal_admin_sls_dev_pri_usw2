import { success } from '../../../helpers/responses.js';
import * as dynamoDbLib from '../../../libs/dynamodb-v3.js';
import { standardMiddleware } from '../../../libs/middleware/index.js';
import { getProgram, mapProgramView } from '../utils/program-utils.js';

const { DYNAMODB_PROGRAM_TABLE, PROGRAM_TABLE } = process.env;

/** Porcentaje de recargo sobre el monto base. */
const SURCHARGE_RATE = 0.10;

/**
 * Asigna una cuota manual a un programa con sii = false.
 *
 * El monto final que pagará el cliente incluye un recargo del 10% sobre el
 * valor base ingresado por el administrador.
 *
 * @example
 * POST /v1/pagos/admin/asignar-cuota
 * Body: { programId: "PRG#uuid", amount: 100000 }
 */
const handler = async (event) => {
  const action = 'Asignar cuota a programa sin SII.';
  const { programId, amount } = event.body || {};

  if (!programId) {
    const error = new Error('El programId es requerido.');
    error.statusCode = 400;
    throw error;
  }

  const parsedAmount = Number(amount);
  if (!parsedAmount || parsedAmount < 1) {
    const error = new Error('El monto debe ser un número mayor a 0.');
    error.statusCode = 400;
    throw error;
  }

  const program = await getProgram(programId);

  if (!program) {
    const error = new Error('Programa no encontrado.');
    error.statusCode = 404;
    throw error;
  }

  if (program.sii !== false) {
    const error = new Error('Solo se puede asignar cuota manual a programas con sii = false.');
    error.statusCode = 409;
    throw error;
  }

  const surchargedAmount = Math.round(parsedAmount * (1 + SURCHARGE_RATE));
  const now = new Date().toISOString();

  const assignedInstallment = {
    amount: parsedAmount,
    surchargedAmount,
    assignedAt: now,
  };

  await dynamoDbLib.update({
    TableName: DYNAMODB_PROGRAM_TABLE,
    Key: { pk: PROGRAM_TABLE, sk: programId },
    UpdateExpression: 'SET assignedInstallment = :inst, updatedAt = :now',
    ExpressionAttributeValues: { ':inst': assignedInstallment, ':now': now },
  });

  return success(200, { programId, assignedInstallment }, action);
};

export const main = standardMiddleware(handler);
