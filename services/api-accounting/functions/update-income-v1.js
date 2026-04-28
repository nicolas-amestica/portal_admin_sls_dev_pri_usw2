import * as dynamoDbLib from '../../../libs/dynamodb-v3.js';
import { standardMiddleware } from '../../../libs/middleware/index.js';
import { success } from '../../../helpers/responses.js';
import { normalizeOwnerPk } from '../helpers/owner-pk.js';

const { DYNAMODB_ACCOUNTING_TABLE } = process.env;
const ACTION = 'Actualizar ingreso';

const UPDATABLE_FIELDS = [
  'montoTotal', 'montoNeto', 'montoIVA', 'exentoIVA',
  'tipoDocumento', 'folio', 'rutCliente', 'nombreCliente',
  'concepto', 'numeroCuota', 'totalCuotas',
  'medioPago', 'cuentaBancaria', 'origenPago',
  'conciliadoBancario', 'comprobantePagoS3Key', 'fecha', 'programSk',
];

/**
 * Handler: actualiza los campos editables de un ingreso.
 * PUT /v1/contabilidad/ingresos/{sk}
 * Body: { pk, ...camposActualizados }
 */
const handler = async (event) => {
  const sk = decodeURIComponent(event.pathParameters?.sk ?? '');
  const { pk, ...fields } = event.body ?? {};
  const owner = normalizeOwnerPk(pk);

  if (!sk || !owner) {
    const error = new Error('El sk (path) y pk (body, partition key USR#...) son requeridos.');
    error.statusCode = 400;
    throw error;
  }

  const partitionKey = owner.pk;

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
    Key: { pk: partitionKey, sk },
    UpdateExpression: `SET ${updateParts.join(', ')}, updatedAt = :updatedAt`,
    ExpressionAttributeValues: expressionValues,
    ExpressionAttributeNames: expressionNames,
  });

  return success(200, result, ACTION);
};

export const main = standardMiddleware(handler);
