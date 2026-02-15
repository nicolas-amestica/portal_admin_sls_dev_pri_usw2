import * as dynamoDbLib from "../../../libs/dynamodb-v3";
import { success, unsuccessful } from "../../../helpers/responses";
import { standardMiddleware } from "../../../libs/middleware/index.js";

const { DYNAMODB_PAYMENT_TABLE } = process.env;

/**
 * Lista todas las transacciones de pago con filtros opcionales.
 *
 * @async
 * @function
 * @param {Object} event - Objeto de evento recibido de API Gateway.
 * @param {Object} event.queryParams - Parámetros de consulta opcionales.
 * @param {string} [event.queryParams.userId] - Filtrar por usuario.
 * @param {string} [event.queryParams.status] - Filtrar por estado (PENDING, AUTHORIZED, FAILED).
 * @param {string} [event.queryParams.buyOrder] - Filtrar por orden de compra.
 * @param {number} [event.queryParams.limit] - Límite de resultados.
 * @param {string} [event.queryParams.lastEvaluatedKey] - Para paginación.
 * @returns {Promise<Object>} Respuesta HTTP con la lista de transacciones.
 *
 * @description
 * Este método lista todas las transacciones almacenadas en DynamoDB
 * con capacidad de filtrado y paginación.
 */
const handler = async (event) => {
  console.log(event);
  const action = "Listar transacciones de pago.";

  try {
    const queryParams = event.queryParams || {};
    const {
      userId,
      status,
      buyOrder,
      limit = 20,
      lastEvaluatedKey,
    } = queryParams;

    let params = {
      TableName: DYNAMODB_PAYMENT_TABLE,
      Limit: parseInt(limit),
    };

    // Si hay paginación
    if (lastEvaluatedKey) {
      try {
        params.ExclusiveStartKey = JSON.parse(
          decodeURIComponent(lastEvaluatedKey)
        );
      } catch (error) {
        return unsuccessful(
          400,
          { message: "lastEvaluatedKey inválido." },
          action
        );
      }
    }

    // Filtrar por usuario usando GSI
    if (userId) {
      params.IndexName = "gsiTwo-index";
      params.KeyConditionExpression = "gsiTwo = :userId";
      params.ExpressionAttributeValues = {
        ":userId": userId,
      };

      // Agregar filtro de estado si se proporciona
      if (status) {
        params.FilterExpression = "#status = :status";
        params.ExpressionAttributeNames = { "#status": "status" };
        params.ExpressionAttributeValues[":status"] = status;
      }

      const result = await dynamoDbLib.query(params);
      return success(200, result, action, queryParams);
    }

    // Filtrar por orden de compra usando GSI
    if (buyOrder) {
      params.IndexName = "gsiOne-index";
      params.KeyConditionExpression = "gsiOne = :buyOrder";
      params.ExpressionAttributeValues = {
        ":buyOrder": buyOrder,
      };

      // Agregar filtro de estado si se proporciona
      if (status) {
        params.FilterExpression = "#status = :status";
        params.ExpressionAttributeNames = { "#status": "status" };
        params.ExpressionAttributeValues[":status"] = status;
      }

      const result = await dynamoDbLib.query(params);
      return success(200, result, action, queryParams);
    }

    // ⚠️ IMPORTANTE: No permitir Scan para evitar costos excesivos
    // Se requiere obligatoriamente userId o buyOrder para usar Query eficiente
    return unsuccessful(400, {
      message: "Debe proporcionar al menos un filtro: userId o buyOrder. " +
               "El escaneo completo de la tabla está deshabilitado para evitar costos elevados y problemas de rendimiento.",
      suggestion: "Usa uno de los siguientes parámetros: ?userId=... o ?buyOrder=...",
      note: "Si necesitas filtrar solo por estado, combínalo con userId o buyOrder: ?userId=...&status=PENDING"
    }, action);
  } catch (error) {
    console.error("Error al listar transacciones:", error);
    let statusCode = error.statusCode || 500;
    return unsuccessful(
      statusCode,
      { message: error.message || "Error al listar transacciones." },
      action
    );
  }
};


export const main = standardMiddleware(handler);
