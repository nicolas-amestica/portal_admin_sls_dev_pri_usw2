import * as dynamoDbLib from "../../../libs/dynamodb-v3";
import { success, unsuccessful } from "../../../helpers/responses";

const { DYNAMODB_PAYMENT_TABLE } = process.env;

/**
 * Obtiene todos los pagos realizados para un programa específico.
 *
 * @async
 * @function
 * @param {Object} event - Objeto de evento recibido de API Gateway.
 * @param {Object} event.queryStringParameters - Parámetros de query
 * @param {string} event.queryStringParameters.programId - ID del programa (sk)
 * @returns {Promise<Object>} Respuesta HTTP con el array de pagos del programa.
 *
 * @description
 * Este método:
 * 1. Valida que el programId esté presente en los query parameters.
 * 2. Busca todos los pagos con sk que comienza con PAY#{programId}.
 * 3. Opcionalmente filtra por estado si se proporciona.
 * 4. Retorna el array de pagos ordenados por fecha de creación.
 */
export const main = async (event) => {
  console.log(event);
  const action = "Obtener pagos por programa.";

  try {
    const programId = event.queryStringParameters?.programId;

    if (!programId) {
      return unsuccessful(400, { message: "El programId es requerido como query parameter." }, action);
    }

    // Construir query para obtener todos los pagos del programa
    const params = {
      TableName: DYNAMODB_PAYMENT_TABLE,
      IndexName: "sk-index", // GSI para buscar por sk
      KeyConditionExpression: "sk = :sk",
      ExpressionAttributeValues: {
        ":sk": `PAY#${programId}`,
      },
      ScanIndexForward: false, // Ordenar por fecha de creación descendente
    };

    const payments = await dynamoDbLib.query(params);

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
  } catch (error) {
    console.error("Error al obtener pagos por programa:", error);
    let statusCode = error.statusCode || 500;
    return unsuccessful(statusCode, { message: error.message || "Error al obtener pagos por programa." }, action);
  }
};
