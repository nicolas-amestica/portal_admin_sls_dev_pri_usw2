import * as dynamoDbLib from "../../../libs/dynamodb-v3";
import { success, unsuccessful } from "../../../helpers/responses";

const { DYNAMODB_PAYMENT_TABLE } = process.env;

/**
 * ENDPOINT MOCK - SOLO PARA DESARROLLO Y TESTING
 * 
 * Simula una confirmación exitosa de Transbank sin necesidad de ir a Webpay.
 * Este endpoint NO debe estar disponible en producción.
 * 
 * @async
 * @function
 * @param {Object} event - Objeto de evento recibido de API Gateway.
 * @param {string} event.body - Cuerpo de la solicitud con el token y opcionalmente shouldFail.
 * @returns {Promise<Object>} Respuesta HTTP con la transacción confirmada simulada.
 */
export const main = async (event) => {
  console.log("🧪 MOCK Event:", JSON.stringify(event, null, 2));
  const action = "[MOCK] Confirmar transacción de pago.";

  try {
    const data = JSON.parse(event.body);
    const { token, shouldFail = false } = data;

    if (!token) {
      return unsuccessful(400, { message: "El token es requerido." }, action);
    }

    // Buscar la transacción en DynamoDB
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
    const transaction = dbResult && dbResult.length > 0 ? dbResult[0] : null;

    if (!transaction) {
      return unsuccessful(404, { message: "Transacción no encontrada." }, action);
    }

    console.log("🔍 Transacción encontrada:", transaction.transactionId);

    // Si ya fue confirmada, retornar el resultado guardado
    if (transaction.status === "AUTHORIZED" || transaction.status === "FAILED") {
      console.log("✅ Transacción ya procesada:", transaction.status);
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

    // Simular respuesta de Transbank
    const timestamp = new Date().toISOString();
    const status = shouldFail ? "FAILED" : "AUTHORIZED";
    const responseCode = shouldFail ? -1 : 0;

    console.log(`🎭 Simulando pago ${status}`);

    const mockResponse = {
      vci: shouldFail ? "TSN" : "TSY",
      amount: transaction.amount,
      status: status,
      buy_order: transaction.buyOrder,
      session_id: transaction.sessionId,
      card_detail: {
        card_number: "6623"
      },
      accounting_date: new Date().toISOString().slice(5, 10).replace("-", ""),
      transaction_date: timestamp,
      authorization_code: shouldFail ? "" : "1213",
      payment_type_code: "VN",
      response_code: responseCode,
      installments_number: 0
    };

    // Actualizar registro en DynamoDB
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
        ":vci": mockResponse.vci,
        ":authorizationCode": mockResponse.authorization_code,
        ":responseCode": mockResponse.response_code,
        ":paymentTypeCode": mockResponse.payment_type_code,
        ":accountingDate": mockResponse.accounting_date,
        ":transactionDate": mockResponse.transaction_date,
        ":cardNumber": mockResponse.card_detail.card_number,
        ":installmentsNumber": mockResponse.installments_number,
        ":updatedAt": timestamp,
      },
      ReturnValues: "ALL_NEW",
    };

    await dynamoDbLib.update(updateParams);
    console.log("💾 Transacción actualizada en DynamoDB");

    const result = {
      transactionId: transaction.transactionId,
      buyOrder: transaction.buyOrder,
      amount: transaction.amount,
      status: status,
      vci: mockResponse.vci,
      authorizationCode: mockResponse.authorization_code,
      responseCode: mockResponse.response_code,
      paymentTypeCode: mockResponse.payment_type_code,
      accountingDate: mockResponse.accounting_date,
      transactionDate: mockResponse.transaction_date,
      cardDetail: {
        cardNumber: mockResponse.card_detail.card_number,
      },
      installmentsNumber: mockResponse.installments_number,
      updatedAt: timestamp,
    };

    console.log("✅ Mock completado exitosamente");
    return success(200, result, action);
  } catch (error) {
    console.error("❌ Error en mock:", error);
    let statusCode = error.statusCode || 500;
    return unsuccessful(statusCode, { message: error.message || "Error al procesar mock." }, action);
  }
};
