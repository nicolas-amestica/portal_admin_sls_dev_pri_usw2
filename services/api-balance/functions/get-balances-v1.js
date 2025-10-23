import * as dynamoDbLib from '../../../libs/dynamodb-v3';
import { success, unsuccessful } from "../../../helpers/responses";

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

export const main = async (event) => {
  console.log("event ==>", event);
  const action = "Obtención de lista de balances del programa.";
  const queryParams = event.queryStringParameters;

  try {
    const { sk } = queryParams;
    if (!sk) return unsuccessful(400, { message: "Identificador de programa inválido." }, action);

    const params = {
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
    };

    const [result] = await dynamoDbLib.query(params);
    const payments = result?.content[0]?.payments || [];
    const totalWithUtilities = result.content[0].totalWithUtilities;
    const formattedPayments = await adaptBalances(totalWithUtilities, payments || []);

    return success(200, formattedPayments, action, queryParams);
  } catch (e) {
    let { statusCode } = e;
    if (!statusCode) statusCode = 500;
    return unsuccessful(statusCode, e, action);
  }
};


