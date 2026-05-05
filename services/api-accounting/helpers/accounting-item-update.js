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
  'motivoNegocio', 'tarjeta', 'personasInvitadas', 'receiptS3Key', 'receiptS3Keys',
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
 * @description Normaliza comprobantes aceptando formato nuevo (receiptS3Keys) o legado (receiptS3Key).
 */
function normalizeExpenseReceiptKeys(updates, existing = {}) {
  if (Array.isArray(updates.receiptS3Keys)) {
    return [...new Set(updates.receiptS3Keys.filter((key) => typeof key === 'string' && key.trim()).map((key) => key.trim()))];
  }

  if (typeof updates.receiptS3Key === 'string') {
    const trimmed = updates.receiptS3Key.trim();
    return trimmed ? [trimmed] : [];
  }

  if (Array.isArray(existing.receiptS3Keys)) {
    return [...new Set(existing.receiptS3Keys.filter((key) => typeof key === 'string' && key.trim()).map((key) => key.trim()))];
  }

  if (typeof existing.receiptS3Key === 'string' && existing.receiptS3Key.trim()) {
    return [existing.receiptS3Key.trim()];
  }

  return [];
}

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

  const normalizedReceiptKeys = normalizeExpenseReceiptKeys(updates, existing);
  const normalizedUpdates = { ...updates };
  if (updates.receiptS3Keys !== undefined || updates.receiptS3Key !== undefined) {
    normalizedUpdates.receiptS3Keys = normalizedReceiptKeys;
    normalizedUpdates.receiptS3Key = normalizedReceiptKeys[0] ?? '';
  }

  const merged = { ...existing };
  EXPENSE_UPDATABLE.forEach((field) => {
    if (normalizedUpdates[field] !== undefined) merged[field] = normalizedUpdates[field];
  });

  // Garantiza ambos campos para compatibilidad temporal.
  merged.receiptS3Keys = normalizeExpenseReceiptKeys(normalizedUpdates, merged);
  merged.receiptS3Key = merged.receiptS3Keys[0] ?? '';

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
    if (normalizedUpdates[field] !== undefined) {
      updateParts.push(`#${field} = :${field}`);
      expressionValues[`:${field}`] = normalizedUpdates[field];
      expressionNames[`#${field}`] = field;
    }
  });

  if (!updateParts.length) {
    const error = new Error('No se proporcionaron campos para actualizar.');
    error.statusCode = 400;
    throw error;
  }

  if (normalizedUpdates.fecha !== undefined) {
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
