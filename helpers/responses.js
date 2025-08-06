import winston from "winston";

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.json(),
  transports: [new winston.transports.Console()],
});

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

export function send(body) {
  return buildResponse(200, body, true);
}
