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
 * Obtiene el registro de transacción desde DynamoDB usando el token.
 *
 * @async
 * @param {string} token - Token de la transacción de Transbank
 * @returns {Promise<Object|null>} Registro de la transacción o null si no existe
 */
const getTransactionByToken = async (token) => {
  const params = {
    TableName: DYNAMODB_PAYMENT_TABLE,
    IndexName: "token-index", // Necesitarás crear este GSI
    KeyConditionExpression: "#token = :token",
    ExpressionAttributeNames: {
      "#token": "token",
    },
    ExpressionAttributeValues: {
      ":token": token,
    },
    Limit: 1,
  };

  try {
    const result = await dynamoDbLib.query(params);
    return result.Items && result.Items.length > 0 ? result.Items[0] : null;
  } catch (error) {
    console.error("Error al buscar transacción:", error);
    return null;
  }
};

/**
 * Confirma una transacción de pago con Transbank Webpay Plus.
 *
 * @async
 * @function
 * @param {Object} event - Objeto de evento recibido de API Gateway.
 * @param {string} event.body - Cuerpo de la solicitud en formato JSON, debe incluir `token`.
 * @returns {Promise<Object>} Respuesta HTTP con los detalles de la transacción confirmada.
 *
 * @description
 * Este método:
 * 1. Obtiene el registro de la transacción desde DynamoDB.
 * 2. Confirma la transacción con Transbank usando el token.
 * 3. Actualiza el registro en DynamoDB con el resultado.
 * 4. Retorna los detalles completos de la transacción.
 */
export const main = async (event) => {
  console.log("Event:", JSON.stringify(event, null, 2));
  const action = "Confirmar transacción de pago.";

  try {
    const data = JSON.parse(event.body);
    const { token } = data;

    if (!token) return unsuccessful(400, { message: "El token es requerido." }, action);

    // Buscar la transacción en DynamoDB
    const transaction = await getTransactionByToken(token);

    if (!transaction) return unsuccessful(404, { message: "Transacción no encontrada." }, action);

    // Si la transacción ya fue confirmada, retornar el resultado guardado
    if (transaction.status === "AUTHORIZED" || transaction.status === "FAILED")
      return success(200, transaction, action);

    // Configurar y confirmar transacción en Transbank
    const options = await configureTransbank();
    const tx = new WebpayPlus.Transaction(options);
    const response = await tx.commit(token);

    // Actualizar registro en DynamoDB
    const timestamp = new Date().toISOString();
    const status = response.response_code === 0 ? "AUTHORIZED" : "FAILED";

    const updateParams = {
      TableName: DYNAMODB_PAYMENT_TABLE,
      Key: {
        pk: transaction.pk,
        sk: transaction.sk,
      },
      UpdateExpression: `SET 
        #status = :status,
        vci = :vci,
        authorizationCode = :authorizationCode,
        responseCode = :responseCode,
        paymentTypeCode = :paymentTypeCode,
        accountingDate = :accountingDate,
        transactionDate = :transactionDate,
        cardNumber = :cardNumber,
        installmentsNumber = :installmentsNumber,
        updatedAt = :updatedAt
      `,
      ExpressionAttributeNames: {
        "#status": "status",
      },
      ExpressionAttributeValues: {
        ":status": status,
        ":vci": response.vci || null,
        ":authorizationCode": response.authorization_code || null,
        ":responseCode": response.response_code,
        ":paymentTypeCode": response.payment_type_code || null,
        ":accountingDate": response.accounting_date || null,
        ":transactionDate": response.transaction_date || null,
        ":cardNumber": response.card_detail?.card_number || null,
        ":installmentsNumber": response.installments_number || 0,
        ":updatedAt": timestamp,
      },
      ReturnValues: "ALL_NEW",
    };

    await dynamoDbLib.update(updateParams);

    const result = {
      transactionId: transaction.transactionId,
      buyOrder: transaction.buyOrder,
      amount: transaction.amount,
      status,
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
      updatedAt: timestamp,
    };

    return success(200, result, action);
  } catch (error) {
    console.error("Error al confirmar transacción:", error);
    let statusCode = error.statusCode || 500;
    return unsuccessful(statusCode, { message: error.message || "Error al confirmar transacción." }, action);
  }
};
