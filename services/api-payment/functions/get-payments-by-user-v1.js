import { success } from "../../../helpers/responses";
import * as dynamoDbLib from "../../../libs/dynamodb-v3";
import { standardMiddleware } from "../../../libs/middleware/index.js";

const { DYNAMODB_PAYMENT_TABLE } = process.env;

/**
 * Obtiene todos los pagos realizados por un usuario específico.
 *
 * @async
 * @function
 * @param {Object} event - Objeto de evento recibido de API Gateway.
 * @param {Object} event.queryParams - Parámetros de query
 * @param {string} event.queryParams.userId - ID del usuario
 * @returns {Promise<Object>} Respuesta HTTP con el array de pagos del usuario.
 *
 * @description
 * Este método:
 * 1. Valida que el userId esté presente en los query parameters.
 * 2. Busca todos los pagos del usuario usando el GSI gsiTwo.
 * 3. Retorna el array de pagos ordenados por fecha de creación.
 */
const handler = async (event) => {
  console.log("Event ==>", event);
  const action = "Obtener pagos por usuario.";    const userId = event.queryParams?.userId;

    if (!userId) {
      const error = new Error('El userId es requerido como query parameter.');
      error.statusCode = 400;
      throw error;
    }

    // Construir query para obtener todos los pagos del usuario
    const params = {
      TableName: DYNAMODB_PAYMENT_TABLE,
      IndexName: "gsiTwo-index", // GSI para buscar por userId
      KeyConditionExpression: "gsiTwo = :userId",
      ExpressionAttributeValues: {
        ":userId": userId,
      },
      ScanIndexForward: false, // Ordenar por fecha de creación descendente
    };

    const payments = await dynamoDbLib.query(params);

    // Verificar si hubo un error
    if (payments instanceof Error) {
      throw payments;
    }

    // Mapear a formato de respuesta limpio
    const result = (payments || []).map(payment => ({
      pk: payment.pk,
      sk: payment.sk,
      id: payment.id,
      programId: payment.programId,
      userId: payment.userId,
      installmentNumber: payment.installmentNumber,
      amount: payment.amount,
      status: payment.status,
      createdAt: payment.createdAt,
      paidAt: payment.paidAt || null,
      transbankDetails: {
        token: payment.transbankDetails?.token || null,
        buyOrder: payment.transbankDetails?.buyOrder || null,
        sessionId: payment.transbankDetails?.sessionId || null,
        vci: payment.transbankDetails?.vci || null,
        authorizationCode: payment.transbankDetails?.authorizationCode || null,
        responseCode: payment.transbankDetails?.responseCode || null,
        paymentTypeCode: payment.transbankDetails?.paymentTypeCode || null,
        accountingDate: payment.transbankDetails?.accountingDate || null,
        transactionDate: payment.transbankDetails?.transactionDate || null,
        cardNumber: payment.transbankDetails?.cardNumber || null,
        installmentsNumber: payment.transbankDetails?.installmentsNumber || 0,
      },
    }));

    return success(200, result, action);
};

export const main = standardMiddleware(handler);
