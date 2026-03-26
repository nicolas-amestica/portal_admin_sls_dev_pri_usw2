import * as dynamoDbLib from '../../../libs/dynamodb-v3.js';

/**
 * Obtiene todos los programas del periodo desde DynamoDB usando el GSI de fecha.
 * Sin SCAN: usa el índice `gsiStartDate-index`.
 *
 * @param {string} periodo - Año del periodo (ej: "2026")
 * @returns {Promise<Array|null>} Lista de programas del periodo, o null si no hay resultados.
 */
export const getProgramsByPeriod = (periodo) =>
  dynamoDbLib.query({
    TableName: process.env.DYNAMODB_PROGRAM_TABLE,
    IndexName: 'gsiStartDate-index',
    KeyConditionExpression: '#pk = :pk AND begins_with(#startDate, :startDate)',
    ExpressionAttributeValues: { ':pk': process.env.PROGRAM_TABLE, ':startDate': periodo },
    ExpressionAttributeNames: { '#pk': 'pk', '#startDate': 'startDate' },
  });

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
