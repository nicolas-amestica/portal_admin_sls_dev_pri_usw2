import * as dynamoDbLib from "../../../libs/dynamodb-v3";
import { success } from "../../../helpers/responses";
import { standardMiddleware } from "../../../libs/middleware/index.js";
import { mapPayment } from "../utils/payment-mapper.js";

const { DYNAMODB_PAYMENT_TABLE } = process.env;

/**
 * Obtiene todos los pagos realizados para un programa específico.
 */
const handler = async (event) => {
  console.log("Event ==>", event);
  const action = "Obtener pagos por programa.";
  const programId = event.queryParams?.programId;

  if (!programId) {
    const error = new Error('El programId es requerido como query parameter.');
    error.statusCode = 400;
    throw error;
  }

  const params = {
    TableName: DYNAMODB_PAYMENT_TABLE,
    IndexName: "sk-index",
    KeyConditionExpression: "sk = :sk",
    ExpressionAttributeValues: {
      ":sk": `PAY#${programId}`,
    },
    ScanIndexForward: false,
  };

  const payments = await dynamoDbLib.query(params);

  return success(200, (payments || []).map(mapPayment), action);
};

export const main = standardMiddleware(handler);
