import * as dynamoDbLib from '../../../libs/dynamodb-v3.js';
import { success } from '../../../helpers/responses.js';
import { standardMiddleware } from '../../../libs/middleware/index.js';

const { DYNAMODB_PROGRAM_TABLE, PROGRAM_TABLE } = process.env;

/** Recargo por defecto (10%) cuando no se especifica en el request. */
const DEFAULT_SURCHARGE_RATE = 0.10;

/**
 * Agrega una nueva cuota manual al historial de cuotas de un programa con sii = false.
 *
 * Cada llamada anexa una cuota al array existente, permitiendo que el administrador
 * vaya habilitando cuotas mes a mes. El número de cuota se asigna automáticamente
 * como la siguiente en la secuencia.
 *
 * El monto que paga el cliente incluye un recargo del 10% sobre el valor base.
 *
 * @example
 * POST /v1/pagos/admin/asignar-cuota
 * Body: { programId: "PRG#uuid", amount: 100000 }
 */
const handler = async (event) => {
  const action = 'Agregar cuota a programa sin SII.';
  const { programId, amount, surchargeRate } = event.body || {};

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

  const parsedRate = surchargeRate !== undefined ? Number(surchargeRate) : DEFAULT_SURCHARGE_RATE;
  if (isNaN(parsedRate) || parsedRate < 0 || parsedRate > 1) {
    const error = new Error('El recargo debe ser un número entre 0 y 1 (ej: 0.10 para 10%).');
    error.statusCode = 400;
    throw error;
  }

  // Lectura fuertemente consistente: garantiza el array actual real en DynamoDB.
  const program = await dynamoDbLib.getOne({
    TableName: DYNAMODB_PROGRAM_TABLE,
    Key: { pk: PROGRAM_TABLE, sk: programId },
    ConsistentRead: true,
  });

  if (!program) {
    const error = new Error('Programa no encontrado.');
    error.statusCode = 404;
    throw error;
  }

  if (program.sii !== false) {
    const error = new Error('Solo se puede agregar cuotas manuales a programas con sii = false.');
    error.statusCode = 409;
    throw error;
  }

  const currentInstallments = Array.isArray(program.assignedInstallments)
    ? program.assignedInstallments
    : [];

  console.log(`[assign-installment] programa=${programId} cuotas_actuales=${currentInstallments.length}`);

  const surchargedAmount = Math.round(parsedAmount * (1 + parsedRate));
  const now = new Date().toISOString();

  const newInstallment = {
    installmentNumber: currentInstallments.length + 1,
    amount: parsedAmount,
    surchargeRate: parsedRate,
    surchargedAmount,
    assignedAt: now,
  };

  // list_append es atómico en DynamoDB: añade al final sin reemplazar el array existente.
  await dynamoDbLib.update({
    TableName: DYNAMODB_PROGRAM_TABLE,
    Key: { pk: PROGRAM_TABLE, sk: programId },
    UpdateExpression: 'SET assignedInstallments = list_append(if_not_exists(assignedInstallments, :empty), :new), updatedAt = :now',
    ExpressionAttributeValues: {
      ':new': [newInstallment],
      ':empty': [],
      ':now': now,
    },
  });

  const updatedInstallments = [...currentInstallments, newInstallment];

  console.log(`[assign-installment] programa=${programId} cuotas_guardadas=${updatedInstallments.length}`);

  return success(200, { programId, newInstallment, assignedInstallments: updatedInstallments }, action);
};

export const main = standardMiddleware(handler);
