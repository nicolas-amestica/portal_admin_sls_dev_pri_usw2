import { WebpayPlus } from "transbank-sdk";
import * as dynamoDbLib from "../../../libs/dynamodb-v3";
import { success, unsuccessful } from "../../../helpers/responses";
import { standardMiddleware } from "../../../libs/middleware/index.js";
import { configureTransbank } from "../utils/transbank.js";

const { DYNAMODB_PAYMENT_TABLE } = process.env;

/**
 * Obtiene el estado de una transacción desde Transbank (legacy).
 * Usa token-index GSI (estructura de transacciones legacy).
 */
const handler = async (event) => {
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
      ExpressionAttributeNames: { "#token": "token" },
      ExpressionAttributeValues: { ":token": token },
      Limit: 1,
    };

    const dbResult = await dynamoDbLib.query(params);
    const transaction = dbResult && dbResult.length > 0 ? dbResult[0] : null;

    // Si la transacción está confirmada en DB, retornar ese resultado
    if (transaction && (transaction.status === "AUTHORIZED" || transaction.status === "FAILED")) {
      return success(200, {
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
        cardDetail: { cardNumber: transaction.cardNumber },
        installmentsNumber: transaction.installmentsNumber,
        createdAt: transaction.createdAt,
        updatedAt: transaction.updatedAt,
      }, action);
    }

    // Si está pendiente, consultar en Transbank
    const options = await configureTransbank();
    const tx = new WebpayPlus.Transaction(options);
    const response = await tx.status(token);

    return success(200, {
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
      cardDetail: { cardNumber: response.card_detail?.card_number },
      installmentsNumber: response.installments_number,
    }, action);
  } catch (error) {
    console.error("Error al obtener estado de transacción:", error);
    return unsuccessful(
      error.statusCode || 500,
      { message: error.message || "Error al obtener estado." },
      action
    );
  }
};


export const main = standardMiddleware(handler);
