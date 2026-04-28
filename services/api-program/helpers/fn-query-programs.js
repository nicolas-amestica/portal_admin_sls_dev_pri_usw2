import * as dynamoDbLib from '../../../libs/dynamodb-v3.js';

/**
 * Obtiene todos los programas del periodo desde DynamoDB usando el GSI de fecha.
 * Sin SCAN: Query paginada sobre `gsiStartDate-index`.
 *
 * @param {string} periodo - Prefijo de startDate (ej: año "2026")
 * @param {{ status?: string }} [options] - Si `status` está definido, filtra por ese estado (ej. approved).
 * @returns {Promise<Array>} Lista de ítems (vacía si no hay resultados).
 */
export const getProgramsByPeriod = async (periodo, options = {}) => {
  const { status } = options;
  const ExpressionAttributeValues = {
    ':pk': process.env.PROGRAM_TABLE,
    ':startDate': periodo,
  };
  const ExpressionAttributeNames = {
    '#pk': 'pk',
    '#startDate': 'startDate',
  };
  const params = {
    TableName: process.env.DYNAMODB_PROGRAM_TABLE,
    IndexName: 'gsiStartDate-index',
    KeyConditionExpression: '#pk = :pk AND begins_with(#startDate, :startDate)',
    ExpressionAttributeValues,
    ExpressionAttributeNames,
  };
  if (status) {
    params.FilterExpression = '#st = :st';
    ExpressionAttributeNames['#st'] = 'status';
    ExpressionAttributeValues[':st'] = status;
  }
  return dynamoDbLib.iterativeQuery(params);
};

/**
 * Obtiene los pagos AUTHORIZED de un programa usando el GSI `sk-index`.
 * El sk del pago sigue el patrón: PAY#<programSk>, donde programSk = PRG#<id>.
 * Sin SCAN: usa el índice secundario `sk-index`.
 *
 * @param {string} programSk - SK del programa (ej: "PRG#uuid")
 * @returns {Promise<Array|null>} Lista de pagos autorizados del programa, o null si no hay resultados.
 */
export const getAuthorizedPaymentsByProgram = (programSk) =>
  dynamoDbLib.query({
    TableName: process.env.DYNAMODB_PAYMENT_TABLE,
    IndexName: 'sk-index',
    KeyConditionExpression: 'sk = :sk',
    FilterExpression: '#status = :status',
    ExpressionAttributeNames: { '#status': 'status' },
    ExpressionAttributeValues: { ':sk': `PAY#${programSk}`, ':status': 'AUTHORIZED' },
  });
