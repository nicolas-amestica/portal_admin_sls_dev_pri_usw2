import * as dynamoDbLib from '../../../libs/dynamodb-v3.js';

/**
 * @description Obtiene un ticket por id y período MMYYYY (clave compuesta exacta).
 */
export const findTicketById = async (id, periodo) =>
  dynamoDbLib.getOne({
    TableName: process.env.DYNAMODB_TICKET_TABLE,
    Key: {
      pk: process.env.TICKET_TABLE_PK,
      sk: `PER#${periodo}#${id}`,
    },
  });
