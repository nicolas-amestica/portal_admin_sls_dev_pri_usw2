import * as dynamoDbLib from "../../../libs/dynamodb-v3";
import { success, unsuccessful } from "../../../helpers/responses";

const { DYNAMODB_PAYMENT_TABLE } = process.env;

/**
 * Cancela un pago PENDING para una cuota específica.
 *
 * Este endpoint permite al usuario cancelar manualmente un pago que quedó en estado PENDING,
 * por ejemplo si abandonó el proceso de pago en Transbank y quiere reintentar inmediatamente
 * sin esperar los 30 minutos de expiración automática.
 *
 * @async
 * @param {Object} event - Evento de API Gateway
 * @param {string} event.body - Cuerpo de la petición JSON con programId e installmentNumber
 * @returns {Promise<Object>} Respuesta con el pago cancelado o error
 *
 * @example
 * POST /v1/pagos/cuotas/cancelar
 * {
 *   "programId": "REQ#01JKXXX...",
 *   "installmentNumber": 1
 * }
 *
 * Response:
 * {
 *   "message": "Pago cancelado exitosamente",
 *   "paymentId": "01JKYYY...",
 *   "status": "CANCELLED",
 *   "installmentNumber": 1,
 *   "programId": "REQ#01JKXXX..."
 * }
 */
export const main = async (event) => {
  const action = "cancel-installment-payment-v1";

  try {
    console.log(`[${action}] Event:`, JSON.stringify(event, null, 2));

    const body = JSON.parse(event.body);
    const { programId, installmentNumber } = body;

    // Validaciones de entrada
    if (!programId || !installmentNumber) {
      return unsuccessful(
        400,
        {
          message: "Se requieren programId e installmentNumber",
        },
        action
      );
    }

    // Buscar pago PENDING usando GSI gsiOne (programId#INST#installmentNumber)
    const gsiOneValue = `${programId}#INST#${installmentNumber}`;

    console.log(
      `[${action}] Buscando pago PENDING con gsiOne:`,
      gsiOneValue
    );

    const queryParams = {
      TableName: DYNAMODB_PAYMENT_TABLE,
      IndexName: "gsiOne-index",
      KeyConditionExpression: "gsiOne = :gsiOne",
      ExpressionAttributeValues: {
        ":gsiOne": gsiOneValue,
      },
      ScanIndexForward: false, // Ordenar descendente por fecha (más reciente primero)
      Limit: 10, // Obtener los últimos 10 pagos para esta cuota
    };

    const result = await dynamoDbLib.query(queryParams);

    console.log(
      `[${action}] Resultado query:`,
      JSON.stringify(result, null, 2)
    );

    if (!result || !result.Items || result.Items.length === 0) {
      return unsuccessful(
        404,
        {
          message: "No se encontró ningún pago para esta cuota",
        },
        action
      );
    }

    // Buscar el primer pago PENDING (más reciente)
    const pendingPayment = result.Items.find((p) => p.status === "PENDING");

    if (!pendingPayment) {
      return unsuccessful(
        404,
        {
          message:
            "No hay ningún pago PENDING para cancelar. La cuota puede estar ya pagada o sin intentos recientes.",
        },
        action
      );
    }

    console.log(`[${action}] Pago PENDING encontrado:`, pendingPayment.pk);

    // Verificar que el pago esté en estado PENDING (doble verificación)
    if (pendingPayment.status !== "PENDING") {
      return unsuccessful(
        400,
        {
          message: `No se puede cancelar un pago con estado ${pendingPayment.status}`,
        },
        action
      );
    }

    // Actualizar el estado a CANCELLED
    const updateParams = {
      TableName: DYNAMODB_PAYMENT_TABLE,
      Key: {
        pk: pendingPayment.pk,
        sk: pendingPayment.sk,
      },
      UpdateExpression: "SET #status = :status, updatedAt = :updatedAt",
      ExpressionAttributeNames: {
        "#status": "status",
      },
      ExpressionAttributeValues: {
        ":status": "CANCELLED",
        ":updatedAt": new Date().toISOString(),
      },
      ReturnValues: "ALL_NEW",
    };

    const updatedPayment = await dynamoDbLib.update(updateParams);

    console.log(
      `[${action}] Pago cancelado exitosamente:`,
      updatedPayment.Attributes.pk
    );

    // Log de auditoría
    console.log(`[${action}] Cancelación registrada:`, {
      paymentId: pendingPayment.id,
      userId: pendingPayment.userId,
      programId,
      installmentNumber,
      originalStatus: pendingPayment.status,
      newStatus: "CANCELLED",
      timestamp: new Date().toISOString(),
    });

    return success(
      {
        message: "Pago cancelado exitosamente",
        paymentId: pendingPayment.id,
        status: "CANCELLED",
        installmentNumber,
        programId,
      },
      action
    );
  } catch (error) {
    console.error(`[${action}] Error:`, error);
    return unsuccessful(
      500,
      {
        message: error.message || "Error al cancelar el pago",
      },
      action
    );
  }
};
