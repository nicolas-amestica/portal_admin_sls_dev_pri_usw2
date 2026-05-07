import * as dynamoDbLib from '../../../libs/dynamodb-v3.js';

/**
 * @description Lista todos los tickets de un período (Query + paginación interna). Sin Scan.
 */
export const queryTicketsByPeriod = async (periodo) =>
  dynamoDbLib.iterativeQuery({
    TableName: process.env.DYNAMODB_TICKET_TABLE,
    KeyConditionExpression: 'pk = :pk AND begins_with(sk, :sk_prefix)',
    ExpressionAttributeValues: {
      ':pk': process.env.TICKET_TABLE_PK,
      ':sk_prefix': `PER#${periodo}`,
    },
  });
