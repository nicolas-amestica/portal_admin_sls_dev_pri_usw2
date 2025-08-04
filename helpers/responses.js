import winston from 'winston';

export const logger = winston.createLogger({
  level     : process.env.LOG_LEVEL || 'info',
  format    : winston.format.json(),
  transports: [new winston.transports.Console()],
});

function buildResponse(statusCode, body, status, debug = true) {
  if(debug) logger.info(body);
  const content = JSON.parse(JSON.stringify(body, (key, value) =>
    typeof value === 'bigint' ? value.toString() : value,
  ));
  return {
    statusCode,
    headers: {
      'Content-Type'                : 'application/json',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Allow-Origin' : '*',
    },
    body   : JSON.stringify({state: status, ...content}),
  };
}

/**
 * Devolver respuestas satisfactorias al cliente como el resultado de la ejecución de una función lambda
 *
 * {@link https://developer.mozilla.org/es/docs/Web/HTTP/Status | MozillaMDN}
 *
 * @export libs/respond
 * @param {number} code
 * @param {Object} body
 * @param {string} action
 * @param {Object} params query params
 * @param {boolean} debug si es verdadero, escribe logs de la respuesta
 * @returns {Object} Respuesta satisfactoria
 */
export function success(code, body, action, params, debug = true) {
  const response = {
    metadata: {
      statusCode      : code,
      action,
      count           : body.Count,
      scannedCount    : body.ScannedCount,
      queryParams     : {...params},
      consumedCapacity: body.ConsumedCapacity ? body.ConsumedCapacity.CapacityUnits : null,
      lastEvaluatedKey: body.LastEvaluatedKey || null,
    },
    data    : body.Item ? body.Item : body.Attributes || body.Items || body,
  };
  return buildResponse(code, response, true, debug);
}

/**
 * Devolver errores de servidor al cliente como el resultado de la ejecución de una función lambda
 *
 * {@link https://developer.mozilla.org/es/docs/Web/HTTP/Status | MozillaMDN}
 *
 * @export libs/respond
 * @param {number} code
 * @param {Object} err
 * @param {string} action
 * @returns {Object} Respuesta con codigo de estado HTTP 4xx | 5xx
 */
export function unsuccessful(code, err, action) {
  const response = {
    metadata: {
      action,
      statusCode: err.code,
    },
    data    : {...err},
  };

  return buildResponse(code, response, false);
}

// Esta es para desarrollo, se usa para devolver datos a postman
export function send(body) {
  return buildResponse(200, body, true);
}
