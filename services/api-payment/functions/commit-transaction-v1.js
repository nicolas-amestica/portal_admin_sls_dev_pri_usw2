import { unsuccessful } from "../../../helpers/responses";
import { standardMiddleware } from "../../../libs/middleware/index.js";

/**
 * Endpoint legacy descontinuado.
 * Para confirmar pagos, usar POST /v1/pagos/cuotas/confirmar.
 */
const handler = async () => {
  return unsuccessful(410, {
    message: "Este endpoint ha sido descontinuado. Use POST /v1/pagos/cuotas/confirmar para confirmar pagos de cuotas.",
  }, "Confirmar transacción (legacy).");
};

export const main = standardMiddleware(handler);
