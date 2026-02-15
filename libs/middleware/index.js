import middy from '@middy/core';
import httpErrorHandler from '@middy/http-error-handler';
import httpJsonBodyParser from '@middy/http-json-body-parser';
import cors from '@middy/http-cors';

import { correlationIdMiddleware } from './correlation-id.js';
import { loggerMiddleware } from './logger.js';
import { errorHandlerMiddleware } from './error-handler.js';
import { eventParserMiddleware } from './event-parser.js';

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
      origin: '*',
      headers: '*'
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
