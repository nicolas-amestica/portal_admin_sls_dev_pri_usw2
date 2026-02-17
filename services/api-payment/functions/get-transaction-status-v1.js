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
import { standardMiddleware } from "../../../libs/middleware/index.js";

const {
  DYNAMODB_PAYMENT_TABLE,
  TRANSBANK_ENVIRONMENT,
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
 * Obtiene el estado de una transacción desde Transbank.
 *
 * @async
 * @function
 * @param {Object} event - Objeto de evento recibido de API Gateway.
 * @param {Object} event.pathParams - Parámetros de la ruta.
 * @param {string} event.pathParams.token - Token de la transacción.
 * @returns {Promise<Object>} Respuesta HTTP con el estado de la transacción.
 *
 * @description
 * Este método consulta el estado actual de una transacción en Transbank
 * y opcionalmente actualiza el registro local en DynamoDB.
 */
const handler = async (event) => {
  console.log("Event ==>", event);
  const action = "Obtener estado de transacción.";

  try {
    const { token } = event.pathParams;

    if (!token) {
      const error = new Error('El token es requerido.');
    error.statusCode = 400;
    throw error;
    }

    // Buscar en DynamoDB primero
    const params = {
      TableName: DYNAMODB_PAYMENT_TABLE,
      IndexName: "token-index",
      KeyConditionExpression: "#token = :token",
      ExpressionAttributeNames: {
        "#token": "token",
      },
      ExpressionAttributeValues: {
        ":token": token,
      },
      Limit: 1,
    };

    const dbResult = await dynamoDbLib.query(params);
    const transaction =
      dbResult.Items && dbResult.Items.length > 0 ? dbResult.Items[0] : null;

    // Si la transacción está confirmada en DB, retornar ese resultado
    if (
      transaction &&
      (transaction.status === "AUTHORIZED" || transaction.status === "FAILED")
    ) {
      const result = {
        transactionId: transaction.transactionId,
        buyOrder: transaction.buyOrder,
        amount: transaction.amount,
        status: transaction.status,
        vci: transaction.vci,
        authorizationCode: transaction.authorizationCode,
        responseCode: transaction.responseCode,
        paymentTypeCode: transaction.paymentTypeCode,
        accountingDate: transaction.accountingDate,
        transactionDate: transaction.transactionDate,
        cardDetail: {
          cardNumber: transaction.cardNumber,
        },
        installmentsNumber: transaction.installmentsNumber,
        createdAt: transaction.createdAt,
        updatedAt: transaction.updatedAt,
      };
      return success(200, result, action);
    }

    // Si está pendiente, consultar en Transbank
    const options = await configureTransbank();
    const tx = new WebpayPlus.Transaction(options);
    const response = await tx.status(token);

    const result = {
      transactionId: transaction?.transactionId,
      buyOrder: response.buy_order,
      sessionId: response.session_id,
      amount: response.amount,
      status: response.status,
      vci: response.vci,
      authorizationCode: response.authorization_code,
      responseCode: response.response_code,
      paymentTypeCode: response.payment_type_code,
      accountingDate: response.accounting_date,
      transactionDate: response.transaction_date,
      cardDetail: {
        cardNumber: response.card_detail?.card_number,
      },
      installmentsNumber: response.installments_number,
    };

    return success(200, result, action);
  } catch (error) {
    console.error("Error al obtener estado de transacción:", error);
    let statusCode = error.statusCode || 500;
    return unsuccessful(
      statusCode,
      { message: error.message || "Error al obtener estado." },
      action
    );
  }
};


export const main = standardMiddleware(handler);
