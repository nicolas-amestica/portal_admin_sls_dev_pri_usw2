import * as dynamoDbLib from '../../../libs/dynamodb-v3.js';

const { DYNAMODB_PROGRAM_TABLE, PROGRAM_TABLE } = process.env;

/**
 * Obtiene un programa por su identificador (sk) usando GetItem.
 *
 * @param {string} programId - SK del programa (ej: "PRG#uuid")
 * @returns {Promise<Object|null>} El programa o null si no existe
 */
export const getProgram = async (programId) => {
  return dynamoDbLib.getOne({
    TableName: DYNAMODB_PROGRAM_TABLE,
    Key: { pk: PROGRAM_TABLE, sk: programId },
  });
};

/**
 * Lista todos los programas de la partición con un FilterExpression opcional.
 * Usa iterativeQuery para paginar automáticamente sin perder resultados.
 *
 * @param {Object} filter - Parámetros adicionales de filtro (FilterExpression, ExpressionAttributeValues, etc.)
 * @returns {Promise<Array>} Array de programas encontrados
 */
export const listPrograms = async (filter = {}) => {
  return dynamoDbLib.iterativeQuery({
    TableName: DYNAMODB_PROGRAM_TABLE,
    KeyConditionExpression: '#pk = :pk',
    ExpressionAttributeNames: { '#pk': 'pk', ...filter.ExpressionAttributeNames },
    ExpressionAttributeValues: { ':pk': PROGRAM_TABLE, ...filter.ExpressionAttributeValues },
    ...(filter.FilterExpression && { FilterExpression: filter.FilterExpression }),
  });
};

/**
 * Mapea un item de programa DynamoDB al formato de vista para el admin.
 *
 * @param {Object} program - Item del programa desde DynamoDB
 * @returns {Object} Datos del programa para respuesta de API
 */
export const mapProgramView = (program) => ({
  sk: program.sk,
  school: program.content?.[0]?.school || '',
  course: program.content?.[0]?.course || '',
  season: program.content?.[0]?.season || '',
  startDate: program.startDate || null,
  status: program.status || null,
  sii: program.sii === true,
  hasAssignedInstallment: !!program.assignedInstallment,
  assignedInstallment: program.assignedInstallment || null,
});
