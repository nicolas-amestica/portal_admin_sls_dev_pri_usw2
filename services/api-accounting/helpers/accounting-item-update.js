import * as dynamoDbLib from '../../../libs/dynamodb-v3.js';
import {
  buildExpenseSortKey,
  buildIncomeSortKey,
  getAccountingPartitionPk,
  gsiExpensePeriod,
  gsiIncomePeriod,
} from './accounting-keys.js';

const EXPENSE_UPDATABLE = [
  'monto', 'montoNeto', 'montoIVA', 'categoria', 'subcategoria',
  'tipoDocumento', 'folio', 'rutEmisor', 'nombreEmisor',
  'motivoNegocio', 'tarjeta', 'personasInvitadas', 'receiptS3Key',
  'conciliadoCartola', 'fecha', 'programSk',
];

const INCOME_UPDATABLE = [
  'montoTotal', 'montoNeto', 'montoIVA', 'exentoIVA',
  'tipoDocumento', 'folio', 'rutCliente', 'nombreCliente',
  'concepto', 'numeroCuota', 'totalCuotas',
  'medioPago', 'cuentaBancaria', 'origenPago',
  'conciliadoBancario', 'comprobantePagoS3Key', 'fecha', 'programSk',
];

/**
 * @description Actualiza gasto in-place o Put+Delete si cambia SK (fecha/programSk/tipoDocumento).
 */
export async function updateExpenseWithOptionalRelocate({ tableName, sk, updates }) {
  const pk = getAccountingPartitionPk();
  const existing = await dynamoDbLib.getOne({
    TableName: tableName,
    Key: { pk, sk },
  });

  if (!existing) {
    const error = new Error('Gasto no encontrado.');
    error.statusCode = 404;
    throw error;
  }

  const merged = { ...existing };
  EXPENSE_UPDATABLE.forEach((field) => {
    if (updates[field] !== undefined) merged[field] = updates[field];
  });

  if (merged.fecha) merged.periodo = merged.fecha.slice(0, 7);

  const newSk = buildExpenseSortKey({
    programSk: merged.programSk,
    periodo: merged.periodo,
    tipoDocumento: merged.tipoDocumento,
    id: merged.id,
  });

  const now = new Date().toISOString();
  merged.updatedAt = now;
  merged.gsiOne = gsiExpensePeriod(merged.periodo);

  if (newSk !== sk) {
    const newItem = { ...merged, pk, sk: newSk };
    await dynamoDbLib.put({ TableName: tableName, Item: newItem });
    await dynamoDbLib.remove({ TableName: tableName, Key: { pk, sk } });
    return newItem;
  }

  const updateParts = [];
  const expressionValues = { ':updatedAt': now };
  const expressionNames = {};

  EXPENSE_UPDATABLE.forEach((field) => {
    if (updates[field] !== undefined) {
      updateParts.push(`#${field} = :${field}`);
      expressionValues[`:${field}`] = updates[field];
      expressionNames[`#${field}`] = field;
    }
  });

  if (!updateParts.length) {
    const error = new Error('No se proporcionaron campos para actualizar.');
    error.statusCode = 400;
    throw error;
  }

  if (updates.fecha !== undefined) {
    updateParts.push('#periodo = :periodo', '#gsiOne = :gsiOne');
    expressionValues[':periodo'] = merged.periodo;
    expressionValues[':gsiOne'] = merged.gsiOne;
    expressionNames['#periodo'] = 'periodo';
    expressionNames['#gsiOne'] = 'gsiOne';
  }

  await dynamoDbLib.update({
    TableName: tableName,
    Key: { pk, sk },
    UpdateExpression: `SET ${updateParts.join(', ')}, updatedAt = :updatedAt`,
    ExpressionAttributeValues: expressionValues,
    ExpressionAttributeNames: expressionNames,
  });

  return dynamoDbLib.getOne({ TableName: tableName, Key: { pk, sk } });
}

/**
 * @description Actualiza ingreso in-place o Put+Delete si cambia SK.
 */
export async function updateIncomeWithOptionalRelocate({ tableName, sk, updates }) {
  const pk = getAccountingPartitionPk();
  const existing = await dynamoDbLib.getOne({
    TableName: tableName,
    Key: { pk, sk },
  });

  if (!existing) {
    const error = new Error('Ingreso no encontrado.');
    error.statusCode = 404;
    throw error;
  }

  const merged = { ...existing };
  INCOME_UPDATABLE.forEach((field) => {
    if (updates[field] !== undefined) merged[field] = updates[field];
  });

  if (merged.fecha) merged.periodo = merged.fecha.slice(0, 7);

  const newSk = buildIncomeSortKey({
    programSk: merged.programSk,
    periodo: merged.periodo,
    tipoDocumento: merged.tipoDocumento,
    id: merged.id,
  });

  const now = new Date().toISOString();
  merged.updatedAt = now;
  merged.gsiOne = gsiIncomePeriod(merged.periodo);

  if (newSk !== sk) {
    const newItem = { ...merged, pk, sk: newSk };
    await dynamoDbLib.put({ TableName: tableName, Item: newItem });
    await dynamoDbLib.remove({ TableName: tableName, Key: { pk, sk } });
    return newItem;
  }

  const updateParts = [];
  const expressionValues = { ':updatedAt': now };
  const expressionNames = {};

  INCOME_UPDATABLE.forEach((field) => {
    if (updates[field] !== undefined) {
      updateParts.push(`#${field} = :${field}`);
      expressionValues[`:${field}`] = updates[field];
      expressionNames[`#${field}`] = field;
    }
  });

  if (!updateParts.length) {
    const error = new Error('No se proporcionaron campos para actualizar.');
    error.statusCode = 400;
    throw error;
  }

  if (updates.fecha !== undefined) {
    updateParts.push('#periodo = :periodo', '#gsiOne = :gsiOne');
    expressionValues[':periodo'] = merged.periodo;
    expressionValues[':gsiOne'] = merged.gsiOne;
    expressionNames['#periodo'] = 'periodo';
    expressionNames['#gsiOne'] = 'gsiOne';
  }

  await dynamoDbLib.update({
    TableName: tableName,
    Key: { pk, sk },
    UpdateExpression: `SET ${updateParts.join(', ')}, updatedAt = :updatedAt`,
    ExpressionAttributeValues: expressionValues,
    ExpressionAttributeNames: expressionNames,
  });

  return dynamoDbLib.getOne({ TableName: tableName, Key: { pk, sk } });
}
