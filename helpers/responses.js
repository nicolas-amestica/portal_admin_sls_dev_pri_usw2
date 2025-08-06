import winston from "winston";

/**
 * Logger configurado utilizando Winston.
 * 
 * @constant
 * @type {import('winston').Logger}
 * @description
 * Crea un logger con el nivel de log definido por la variable de entorno LOG_LEVEL (por defecto "info").
 * El formato de salida es JSON y los logs se envían a la consola.
 */
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.json(),
  transports: [new winston.transports.Console()],
});

/**
 * Construye una respuesta HTTP estándar para una API, serializando el cuerpo y manejando valores bigint.
 *
 * @param {number} statusCode - Código de estado HTTP de la respuesta.
 * @param {Object} body - Objeto que representa el cuerpo de la respuesta.
 * @param {string} status - Estado de la respuesta (por ejemplo, 'success', 'error').
 * @param {boolean} [debug=true] - Si es true, registra el cuerpo de la respuesta para depuración.
 * @returns {Object} Objeto de respuesta con statusCode, headers y body serializado en JSON.
 */
function buildResponse(statusCode, body, status, debug = true) {
  if (debug) logger.info(body);
  const content = JSON.parse(
    JSON.stringify(body, (key, value) =>
      typeof value === "bigint" ? value.toString() : value
    )
  );
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Allow-Origin": "*",
    },
    body: JSON.stringify({ state: status, ...content }),
  };
}

/**
 * Genera una respuesta de éxito con metadatos y datos relevantes.
 *
 * @param {number} code - Código de estado HTTP de la respuesta.
 * @param {object} body - Cuerpo de la respuesta, puede contener propiedades como Count, ScannedCount, ConsumedCapacity, LastEvaluatedKey, Item, Attributes o Items.
 * @param {string} action - Acción realizada que se describe en la metadata.
 * @param {object} params - Parámetros de consulta utilizados en la petición.
 * @param {boolean} [debug=true] - Indica si se debe incluir información de depuración en la respuesta.
 * @returns {object} Respuesta formateada con metadatos y datos.
 */
export function success(code, body, action, params, debug = true) {
  const response = {
    metadata: {
      statusCode: code,
      action,
      count: body.Count,
      scannedCount: body.ScannedCount,
      queryParams: { ...params },
      consumedCapacity: body.ConsumedCapacity
        ? body.ConsumedCapacity.CapacityUnits
        : null,
      lastEvaluatedKey: body.LastEvaluatedKey || null,
    },
    data: body.Item ? body.Item : body.Attributes || body.Items || body,
  };
  return buildResponse(code, response, true, debug);
}

/**
 * Genera una respuesta de error no exitosa.
 *
 * @param {number} code - Código de estado HTTP para la respuesta.
 * @param {Object} err - Objeto de error que contiene información sobre el error ocurrido.
 * @param {string} action - Descripción de la acción que se intentó realizar.
 * @returns {Object} Objeto de respuesta formateado indicando el fallo de la operación.
 */
export function unsuccessful(code, err, action) {
  const response = {
    metadata: {
      action,
      statusCode: err.code,
    },
    data: { ...err },
  };

  return buildResponse(code, response, false);
}

/**
 * Envía una respuesta exitosa con el cuerpo proporcionado.
 *
 * @param {*} body - El contenido que se incluirá en la respuesta.
 * @returns {*} La respuesta construida con código de estado 200.
 */
export function send(body) {
  return buildResponse(200, body, true);
}
