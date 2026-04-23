import * as dynamoDbLib from '../../../libs/dynamodb-v3.js';
import { standardMiddleware } from '../../../libs/middleware/index.js';
import { success } from '../../../helpers/responses.js';

const { DYNAMODB_ACCOUNTING_TABLE } = process.env;
const ACTION = 'Actualizar gasto';

const UPDATABLE_FIELDS = [
  'monto', 'montoNeto', 'montoIVA', 'categoria', 'subcategoria',
  'tipoDocumento', 'folio', 'rutEmisor', 'nombreEmisor',
  'motivoNegocio', 'tarjeta', 'personasInvitadas', 'receiptS3Key',
  'conciliadoCartola', 'fecha',
];

/**
 * Handler: actualiza los campos editables de un gasto.
 * PUT /v1/contabilidad/gastos/{sk}
 * Body: { userId, ...camposActualizados }
 */
const handler = async (event) => {
  const sk = decodeURIComponent(event.pathParameters?.sk ?? '');
  const { userId, ...fields } = event.body ?? {};

  if (!sk || !userId) {
    const error = new Error('El sk (path) y userId (body) son requeridos.');
    error.statusCode = 400;
    throw error;
  }

  const updateParts = [];
  const expressionValues = { ':updatedAt': new Date().toISOString() };
  const expressionNames = {};

  UPDATABLE_FIELDS.forEach((field) => {
    if (fields[field] !== undefined) {
      updateParts.push(`#${field} = :${field}`);
      expressionValues[`:${field}`] = fields[field];
      expressionNames[`#${field}`] = field;
    }
  });

  if (!updateParts.length) {
    const error = new Error('No se proporcionaron campos para actualizar.');
    error.statusCode = 400;
    throw error;
  }

  const result = await dynamoDbLib.update({
    TableName: DYNAMODB_ACCOUNTING_TABLE,
    Key: { pk: `USR#${userId}`, sk },
    UpdateExpression: `SET ${updateParts.join(', ')}, updatedAt = :updatedAt`,
    ExpressionAttributeValues: expressionValues,
    ExpressionAttributeNames: expressionNames,
  });

  return success(200, result, ACTION);
};

export const main = standardMiddleware(handler);
