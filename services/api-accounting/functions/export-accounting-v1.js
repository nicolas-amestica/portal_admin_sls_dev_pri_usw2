import * as dynamoDbLib from '../../../libs/dynamodb-v3.js';
import { standardMiddleware } from '../../../libs/middleware/index.js';
import { success } from '../../../helpers/responses.js';

const { DYNAMODB_ACCOUNTING_TABLE } = process.env;
const ACTION = 'Exportar contabilidad del período';

/**
 * Handler: retorna gastos e ingresos del período para exportación CSV.
 * El frontend convierte el JSON a CSV (sin costo S3 ni Lambda adicional).
 * GET /v1/contabilidad/exportar?periodo=YYYY-MM[&tipo=gastos|ingresos|todo]
 */
const handler = async (event) => {
  const { periodo, tipo = 'todo' } = event.queryStringParameters || {};

  if (!periodo) {
    const error = new Error('El parámetro periodo es requerido (formato YYYY-MM).');
    error.statusCode = 400;
    throw error;
  }

  const queries = [];

  if (tipo === 'gastos' || tipo === 'todo') {
    queries.push(
      dynamoDbLib.query({
        TableName: DYNAMODB_ACCOUNTING_TABLE,
        IndexName: 'gsiOne-index',
        KeyConditionExpression: 'gsiOne = :gsiOne',
        ExpressionAttributeValues: { ':gsiOne': `EXPENSE_PERIOD#${periodo}` },
        ScanIndexForward: false,
      })
    );
  }

  if (tipo === 'ingresos' || tipo === 'todo') {
    queries.push(
      dynamoDbLib.query({
        TableName: DYNAMODB_ACCOUNTING_TABLE,
        IndexName: 'gsiOne-index',
        KeyConditionExpression: 'gsiOne = :gsiOne',
        ExpressionAttributeValues: { ':gsiOne': `INCOME_PERIOD#${periodo}` },
        ScanIndexForward: false,
      })
    );
  }

  const results = await Promise.all(queries);
  const items = results.flatMap((r) => r ?? []);

  return success(200, { Items: items, Count: items.length, periodo, tipo }, ACTION);
};

export const main = standardMiddleware(handler);
