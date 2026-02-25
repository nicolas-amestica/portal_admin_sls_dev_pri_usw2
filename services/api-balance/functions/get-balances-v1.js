import { success } from "../../../helpers/responses";
import * as dynamoDbLib from '../../../libs/dynamodb-v3.js';
import { standardMiddleware } from "../../../libs/middleware/index.js";

const {
  DYNAMODB_PROGRAM_TABLE,
  PROGRAM_TABLE_ID
} = process.env;

/**
 * Adapta los pagos calculando el balance acumulativo restante tras cada pago.
 */
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

/**
 * Obtiene un programa desde DynamoDB usando una clave de ordenación (con prefijo).
 */
const getProgramFromDynamodb = (sortKey) =>
  dynamoDbLib.query({
    TableName: DYNAMODB_PROGRAM_TABLE,
    KeyConditionExpression: '#pk = :pk AND begins_with(#sk, :sk)',
    ExpressionAttributeValues: {
      ':pk': PROGRAM_TABLE_ID,
      ':sk': sortKey,
    },
    ExpressionAttributeNames: {
      '#pk': 'pk',
      '#sk': 'sk'
    }
  });

/**
 * Handler principal para obtener la lista de balances de un programa.
 */
const handler = async (event) => {
  const action = "Obtención de lista de balances del programa.";
  const { sk } = event.pathParams;

  if (!sk) {
    const error = new Error('Identificador de programa no válido.');
    error.statusCode = 400;
    throw error;
  }

  const programs = await getProgramFromDynamodb(sk);
  const program = programs?.[0] ?? null;

  if (!program) {
    const error = new Error('Programa no encontrado.');
    error.statusCode = 404;
    throw error;
  }

  const payments = program.content?.[0]?.payments || [];
  const totalWithUtilities = program.content[0].totalWithUtilities;
  const formattedPayments = adaptBalances(totalWithUtilities, payments);

  return success(200, formattedPayments, action, { sk });
};

export const main = standardMiddleware(handler);
