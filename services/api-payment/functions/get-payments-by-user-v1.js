import { success } from "../../../helpers/responses";
import * as dynamoDbLib from "../../../libs/dynamodb-v3";
import { standardMiddleware } from "../../../libs/middleware/index.js";
import { mapPayment } from "../utils/payment-mapper.js";

const { DYNAMODB_PAYMENT_TABLE } = process.env;

/**
 * Obtiene todos los pagos realizados por un usuario específico.
 */
const handler = async (event) => {
  const action = "Obtener pagos por usuario.";
  const userId = event.queryParams?.userId;

  if (!userId) {
    const error = new Error('El userId es requerido como query parameter.');
    error.statusCode = 400;
    throw error;
  }

  const params = {
    TableName: DYNAMODB_PAYMENT_TABLE,
    IndexName: "gsiTwo-index",
    KeyConditionExpression: "gsiTwo = :userId",
    ExpressionAttributeValues: {
      ":userId": userId,
    },
    ScanIndexForward: false,
  };

  const payments = await dynamoDbLib.query(params);

  return success(200, (payments || []).map(mapPayment), action);
};

export const main = standardMiddleware(handler);
