import { success } from "../../../helpers/responses";
import * as dynamoDbLib from '../../../libs/dynamodb-v3.js';
import { standardMiddleware } from "../../../libs/middleware/index.js";

const {
  DYNAMODB_PROGRAM_TABLE,
  PROGRAM_TABLE_ID
} = process.env;

const adaptBalances = async (totalWithUtilities, payments) => {
  let total = totalWithUtilities;
  return payments.map(payment => {
    const balance = {
      ...payment,
      amount: parseInt(payment.amount),
      remaining: total - parseInt(payment.amount),
      totalWithUtilities: parseInt(total),
    };
    total -= parseInt(payment.amount);
    return balance;
  }) || [];
};

const handler = async (event) => {
  console.log("event ==>", event);
  const action = "Obtención de lista de balances del programa.";
  const pathParams = event.pathParams;
  const { sk } = pathParams;

  if (!sk) {
    const error = new Error('Identificador de programa inválido.');
    error.statusCode = 400;
    throw error;
  }

  const results = await dynamoDbLib.query({
    TableName: DYNAMODB_PROGRAM_TABLE,
    ReturnConsumedCapacity: 'TOTAL',
    KeyConditionExpression: '#pk = :pk AND begins_with(#sk, :sk)',
    ExpressionAttributeValues: {
      ':pk': PROGRAM_TABLE_ID,
      ':sk': sk,
    },
    ExpressionAttributeNames: {
      '#pk': 'pk',
      '#sk': 'sk'
    }
  });

  const result = results && results.length > 0 ? results[0] : null;
  const payments = result?.content[0]?.payments || [];
  const totalWithUtilities = result.content[0].totalWithUtilities;
  const formattedPayments = await adaptBalances(totalWithUtilities, payments || []);

  return success(200, formattedPayments, action, pathParams);
};

export const main = standardMiddleware(handler);
