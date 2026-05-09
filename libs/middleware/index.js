import middy from '@middy/core';
import httpErrorHandler from '@middy/http-error-handler';
import httpJsonBodyParser from '@middy/http-json-body-parser';
import cors from '@middy/http-cors';

import { correlationIdMiddleware } from './correlation-id.js';
import { loggerMiddleware } from './logger.js';
import { errorHandlerMiddleware } from './error-handler.js';
import { eventParserMiddleware } from './event-parser.js';

/** Orígenes CORS permitidos (alineados a CloudFront del portal). */
const DEFAULT_CORS_ORIGINS = [
  "http://localhost:4200",
  "http://localhost:4300",
  "https://d2q00w63koc9yz.cloudfront.net",
  "https://d2e3zvke409odp.cloudfront.net",
];

const corsOriginOption = () => {
  const fromEnv = process.env.CORS_ALLOWED_ORIGINS;
  if (fromEnv?.trim()) {
    return fromEnv
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return DEFAULT_CORS_ORIGINS;
};

/**
 * Middleware stack completo para handlers estándar
 */
export const standardMiddleware = (handler) => {
  return middy(handler)
    .use(correlationIdMiddleware())
    .use(loggerMiddleware())
    .use(httpJsonBodyParser({
      disableContentTypeError: true  // No fallar en peticiones sin JSON body (ej: GET)
    }))
    .use(eventParserMiddleware())
    .use(cors({
      origin: corsOriginOption(),
      headers:
        "Content-Type,Authorization,X-Correlation-Id,X-Amz-Date,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent",
    }))
    .use(errorHandlerMiddleware())
    .use(httpErrorHandler());  // Middy nativo - catch-all
};

// Exportar middlewares individuales para uso custom
export {
  correlationIdMiddleware,
  loggerMiddleware,
  errorHandlerMiddleware,
  eventParserMiddleware
};
