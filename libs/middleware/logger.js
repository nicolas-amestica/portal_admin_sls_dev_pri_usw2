/**
 * Middleware de logging estandarizado
 */
export const loggerMiddleware = () => {
  const before = async (request) => {
    const { event, context } = request;

    console.log('REQUEST START', {
      correlationId: context.correlationId,
      requestId: context.requestId,
      path: event.path || event.requestContext?.resourcePath,
      method: event.httpMethod || event.requestContext?.http?.method,
      sourceIp: event.requestContext?.identity?.sourceIp,
      userAgent: event.headers?.['User-Agent']
    });

    // Timestamp de inicio
    request.context.startTime = Date.now();
  };

  const after = async (request) => {
    const duration = Date.now() - request.context.startTime;

    console.log('REQUEST END', {
      correlationId: request.context.correlationId,
      statusCode: request.response?.statusCode,
      duration: `${duration}ms`
    });
  };

  const onError = async (request) => {
    const duration = Date.now() - request.context.startTime;

    console.error('REQUEST ERROR', {
      correlationId: request.context.correlationId,
      error: request.error.message,
      stack: request.error.stack,
      duration: `${duration}ms`
    });
  };

  return { before, after, onError };
};
