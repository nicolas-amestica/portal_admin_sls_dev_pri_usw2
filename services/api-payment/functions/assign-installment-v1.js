import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { success } from '../../../helpers/responses.js';
import { getAWSConfigs } from '../../../libs/configs.js';
import { standardMiddleware } from '../../../libs/middleware/index.js';

const { DYNAMODB_PROGRAM_TABLE, PROGRAM_TABLE } = process.env;

/** Porcentaje de recargo sobre el monto base. */
const SURCHARGE_RATE = 0.10;

/**
 * Crea (y cachea) un DynamoDBDocumentClient correctamente inicializado.
 *
 * Se usa DynamoDBDocumentClient en lugar del DynamoDBClient de dynamodb-v3.js porque
 * solo el DocumentClient aplica el middleware de marshalling/unmarshalling de
 * @aws-sdk/lib-dynamodb. Sin él, los arrays de objetos en ExpressionAttributeValues
 * no se serializan correctamente, provocando sobreescritura de datos.
 */
let _docClient;
const getDocClient = async () => {
  if (!_docClient) {
    const config = await getAWSConfigs();
    _docClient = DynamoDBDocumentClient.from(new DynamoDBClient(config));
  }
  return _docClient;
};

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

  const docClient = await getDocClient();

  // Lectura fuertemente consistente: garantiza el array actual real en DynamoDB.
  const { Item: program } = await docClient.send(new GetCommand({
    TableName: DYNAMODB_PROGRAM_TABLE,
    Key: { pk: PROGRAM_TABLE, sk: programId },
    ConsistentRead: true,
  }));

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

  const surchargedAmount = Math.round(parsedAmount * (1 + SURCHARGE_RATE));
  const now = new Date().toISOString();

  const newInstallment = {
    installmentNumber: currentInstallments.length + 1,
    amount: parsedAmount,
    surchargedAmount,
    assignedAt: now,
  };

  // list_append es atómico en DynamoDB: añade al final sin reemplazar el array existente.
  // DynamoDBDocumentClient garantiza que ':new' y ':empty' se serializan correctamente.
  await docClient.send(new UpdateCommand({
    TableName: DYNAMODB_PROGRAM_TABLE,
    Key: { pk: PROGRAM_TABLE, sk: programId },
    UpdateExpression: 'SET assignedInstallments = list_append(if_not_exists(assignedInstallments, :empty), :new), updatedAt = :now',
    ExpressionAttributeValues: {
      ':new': [newInstallment],
      ':empty': [],
      ':now': now,
    },
  }));

  const updatedInstallments = [...currentInstallments, newInstallment];

  console.log(`[assign-installment] programa=${programId} cuotas_guardadas=${updatedInstallments.length}`);

  return success(200, { programId, newInstallment, assignedInstallments: updatedInstallments }, action);
};

export const main = standardMiddleware(handler);
