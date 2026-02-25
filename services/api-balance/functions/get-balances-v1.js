import { success } from "../../../helpers/responses";
import * as dynamoDbLib from '../../../libs/dynamodb-v3.js';
import { standardMiddleware } from "../../../libs/middleware/index.js";

const {
  DYNAMODB_PROGRAM_TABLE,
  PROGRAM_TABLE_ID
} = process.env;

const adaptBalances = (totalWithUtilities, payments) => {
  let total = totalWithUtilities;
  return payments.map(payment => {
    const amount = parseInt(payment.amount, 10);
    const balance = {
      ...payment,
      amount,
      remaining: total - amount,
      totalWithUtilities: parseInt(total, 10),
    };
    total -= amount;
    return balance;
  });
};

const handler = async (event) => {
  const action = "Obtención de lista de balances del programa.";
  const { sk } = event.pathParams;

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

  const result = results?.[0] ?? null;

  if (!result) {
    const error = new Error('Programa no encontrado.');
    error.statusCode = 404;
    throw error;
  }

  const payments = result.content?.[0]?.payments || [];
  const totalWithUtilities = result.content[0].totalWithUtilities;
  const formattedPayments = adaptBalances(totalWithUtilities, payments);

  return success(200, formattedPayments, action, { sk });
};

export const main = standardMiddleware(handler);
