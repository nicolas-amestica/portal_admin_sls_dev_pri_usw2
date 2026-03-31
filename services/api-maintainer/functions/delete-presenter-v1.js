import { success } from "../../../helpers/responses.js";
import { standardMiddleware } from "../../../libs/middleware/index.js";
import * as dynamoDb from "../../../libs/dynamodb-v3.js";

const { DYNAMODB_MAINTAINER_TABLE } = process.env;

/**
 * Elimina permanentemente un presentador del mantenedor.
 *
 * Query params:
 *  - sk (requerido) - Sort Key del presentador a eliminar.
 */
const handler = async (event) => {
  const action = "Eliminar presentador.";
  const sk = event.queryParams?.sk ?? "";

  if (!sk) {
    const error = new Error('El parámetro "sk" es requerido.');
    error.statusCode = 400;
    throw error;
  }

  const deleted = await dynamoDb.remove({
    TableName: DYNAMODB_MAINTAINER_TABLE,
    Key: { pk: "PRESENTER", sk },
  });

  if (!deleted) {
    const error = new Error("Presentador no encontrado.");
    error.statusCode = 404;
    throw error;
  }

  return success(200, { success: true, message: "Presentador eliminado correctamente." }, action);
};

export const main = standardMiddleware(handler);
