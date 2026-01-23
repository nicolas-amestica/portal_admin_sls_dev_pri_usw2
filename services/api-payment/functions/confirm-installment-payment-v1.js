import { WebpayPlus } from "transbank-sdk";
import {
  Options,
  IntegrationApiKeys,
  Environment,
  IntegrationCommerceCodes,
} from "transbank-sdk";
import * as dynamoDbLib from "../../../libs/dynamodb-v3";
import { success, unsuccessful } from "../../../helpers/responses";
import { getSecretManagerValue } from "../../../libs/secret-manager";

const {
  TRANSBANK_ENVIRONMENT,
  DYNAMODB_PAYMENT_TABLE,
  TRANSBANK_COMMERCE_CODE,
  TRANSBANK_API_KEY_SECRET,
} = process.env;

/**
 * Configura las opciones de Transbank según el ambiente.
 *
 * @async
 * @returns {Promise<Options>} Opciones configuradas para Transbank
 */
const configureTransbank = async () => {
  if (TRANSBANK_ENVIRONMENT === "production") {
    const apiKey = await getSecretManagerValue(TRANSBANK_API_KEY_SECRET);
    return new Options(TRANSBANK_COMMERCE_CODE, apiKey, Environment.Production);
  }
  return new Options(
    IntegrationCommerceCodes.WEBPAY_PLUS,
    IntegrationApiKeys.WEBPAY,
    Environment.Integration
  );
};

/**
 * Obtiene el registro de pago desde DynamoDB usando el token de Transbank.
 *
 * @async
 * @param {string} token - Token de la transacción de Transbank
 * @returns {Promise<Object|null>} Registro del pago o null si no existe
 */
const getPaymentByToken = async (token) => {
  try {
    // Como DynamoDB no permite nested attributes en KeyConditionExpression,
    // hacemos un scan con FilterExpression
    const scanParams = {
      TableName: DYNAMODB_PAYMENT_TABLE,
      FilterExpression: "transbankDetails.#token = :token",
      ExpressionAttributeNames: {
        "#token": "token",
      },
      ExpressionAttributeValues: {
        ":token": token,
      },
      Limit: 1,
    };

    const result = await dynamoDbLib.scan(scanParams);
    return result && result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error("Error al buscar pago por token:", error);
    return null;
  }
};

/**
 * Confirma un pago de cuota después de la autorización de Transbank.
 *
 * @async
 * @function
 * @param {Object} event - Objeto de evento recibido de API Gateway.
 * @param {string} event.body - Cuerpo de la solicitud en formato JSON
 * @param {string} event.body.token - Token de la transacción de Transbank
 * @returns {Promise<Object>} Respuesta HTTP con los detalles del pago confirmado.
 *
 * @description
 * Este método:
 * 1. Obtiene el registro del pago desde DynamoDB usando el token.
 * 2. Verifica si el pago ya fue confirmado previamente.
 * 3. Confirma la transacción con Transbank usando el token.
 * 4. Actualiza el registro en DynamoDB con todos los detalles de Transbank.
 * 5. Retorna los detalles completos del pago confirmado.
 */
export const main = async (event) => {
  console.log(event);
  const action = "Confirmar pago de cuota.";

  try {
    const data = JSON.parse(event.body);
    const { token } = data;

    if (!token) return unsuccessful(400, { message: "El token es requerido." }, action);

    // Buscar el pago en DynamoDB
    const payment = await getPaymentByToken(token);

    if (!payment) return unsuccessful(404, { message: "Pago no encontrado." }, action);

    // Si el pago ya fue confirmado, retornar el resultado guardado
    if (payment.status === "AUTHORIZED" || payment.status === "FAILED") {
      return success(200, {
        paymentId: payment.id,
        status: payment.status,
        amount: payment.amount,
        authorizationCode: payment.transbankDetails?.authorizationCode || null,
        cardNumber: payment.transbankDetails?.cardNumber || null,
        transactionDate: payment.paidAt || payment.updatedAt,
      }, action);
    }

    // Configurar y confirmar transacción en Transbank
    const options = await configureTransbank();
    const tx = new WebpayPlus.Transaction(options);
    const response = await tx.commit(token);

    // Determinar el estado del pago
    const status = response.response_code === 0 ? "AUTHORIZED" : "FAILED";
    const timestamp = new Date().toISOString();

    // Actualizar registro en DynamoDB
    const updateParams = {
      TableName: DYNAMODB_PAYMENT_TABLE,
      Key: {
        pk: payment.pk,
        sk: payment.sk,
      },
      UpdateExpression: `SET
        #status = :status,
        paidAt = :paidAt,
        updatedAt = :updatedAt,
        transbankDetails.vci = :vci,
        transbankDetails.authorizationCode = :authorizationCode,
        transbankDetails.responseCode = :responseCode,
        transbankDetails.paymentTypeCode = :paymentTypeCode,
        transbankDetails.accountingDate = :accountingDate,
        transbankDetails.transactionDate = :transactionDate,
        transbankDetails.cardNumber = :cardNumber,
        transbankDetails.installmentsNumber = :installmentsNumber
      `,
      ExpressionAttributeNames: {
        "#status": "status",
      },
      ExpressionAttributeValues: {
        ":status": status,
        ":paidAt": status === "AUTHORIZED" ? timestamp : null,
        ":updatedAt": timestamp,
        ":vci": response.vci || null,
        ":authorizationCode": response.authorization_code || null,
        ":responseCode": response.response_code,
        ":paymentTypeCode": response.payment_type_code || null,
        ":accountingDate": response.accounting_date || null,
        ":transactionDate": response.transaction_date || null,
        ":cardNumber": response.card_detail?.card_number || null,
        ":installmentsNumber": response.installments_number || 0,
      },
      ReturnValues: "ALL_NEW",
    };

    await dynamoDbLib.update(updateParams);

    const result = {
      paymentId: payment.id,
      programId: payment.programId,
      installmentNumber: payment.installmentNumber,
      status,
      amount: payment.amount,
      authorizationCode: response.authorization_code,
      cardNumber: response.card_detail?.card_number,
      transactionDate: response.transaction_date,
    };

    return success(200, result, action);
  } catch (error) {
    console.error("Error al confirmar pago de cuota:", error);
    let statusCode = error.statusCode || 500;
    return unsuccessful(statusCode, { message: error.message || "Error al confirmar pago de cuota." }, action);
  }
};
