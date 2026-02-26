import * as dynamoDbLib from "../../../libs/dynamodb-v3";
import { success, unsuccessful } from "../../../helpers/responses";
import { standardMiddleware } from "../../../libs/middleware/index.js";

const { DYNAMODB_PAYMENT_TABLE } = process.env;

/**
 * Cancela un pago PENDING para una cuota específica.
 *
 * Permite al usuario cancelar manualmente un pago pendiente sin esperar
 * los 30 minutos de expiración automática.
 *
 * @example
 * POST /v1/pagos/cuotas/cancelar
 * { "programId": "REQ#01JKXXX...", "installmentNumber": 1 }
 */
const handler = async (event) => {
  const action = "cancel-installment-payment-v1";

  try {
    console.log(`[${action}] Event:`, JSON.stringify(event, null, 2));

    const { programId, installmentNumber } = event.body;

    if (!programId || !installmentNumber) {
      return unsuccessful(400, { message: "Se requieren programId e installmentNumber" }, action);
    }

    const gsiOneValue = `${programId}#INST#${installmentNumber}`;
    console.log(`[${action}] Buscando pago PENDING con gsiOne:`, gsiOneValue);

    const queryParams = {
      TableName: DYNAMODB_PAYMENT_TABLE,
      IndexName: "gsiOne-index",
      KeyConditionExpression: "gsiOne = :gsiOne",
      ExpressionAttributeValues: { ":gsiOne": gsiOneValue },
      ScanIndexForward: false,
      Limit: 10,
    };

    const result = await dynamoDbLib.query(queryParams);

    if (!result || result.length === 0) {
      return unsuccessful(404, { message: "No se encontró ningún pago para esta cuota" }, action);
    }

    const pendingPayment = result.find((p) => p.status === "PENDING");

    if (!pendingPayment) {
      return unsuccessful(404, {
        message: "No hay ningún pago PENDING para cancelar. La cuota puede estar ya pagada o sin intentos recientes.",
      }, action);
    }

    console.log(`[${action}] Pago PENDING encontrado:`, pendingPayment.pk);

    await dynamoDbLib.update({
      TableName: DYNAMODB_PAYMENT_TABLE,
      Key: { pk: pendingPayment.pk, sk: pendingPayment.sk },
      UpdateExpression: "SET #status = :status, updatedAt = :updatedAt",
      ExpressionAttributeNames: { "#status": "status" },
      ExpressionAttributeValues: {
        ":status": "CANCELLED",
        ":updatedAt": new Date().toISOString(),
      },
    });

    console.log(`[${action}] Cancelación registrada:`, {
      paymentId: pendingPayment.id,
      userId: pendingPayment.userId,
      programId,
      installmentNumber,
      newStatus: "CANCELLED",
    });

    return success(200, {
      message: "Pago cancelado exitosamente",
      paymentId: pendingPayment.id,
      status: "CANCELLED",
      installmentNumber,
      programId,
    }, action);
  } catch (error) {
    console.error(`[${action}] Error:`, error);
    return unsuccessful(error.statusCode || 500, { message: error.message || "Error al cancelar el pago" }, action);
  }
};

export const main = standardMiddleware(handler);
