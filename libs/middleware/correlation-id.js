/**
 * Middleware que genera/propaga X-Correlation-Id para trazabilidad
 */
export const correlationIdMiddleware = () => {
  const before = async (request) => {
    // Obtener correlation ID del header o generar uno nuevo
    const correlationId =
      request.event.headers?.['X-Correlation-Id'] ||
      request.event.headers?.['x-correlation-id'] ||
      `cid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Guardar en context para usar en handler
    request.context.correlationId = correlationId;

    // Agregar a logs
    console.log('Correlation-Id:', correlationId);
  };

  const after = async (request) => {
    // Agregar header a la respuesta
    if (request.response) {
      request.response.headers = {
        ...request.response.headers,
        'X-Correlation-Id': request.context.correlationId
      };
    }
  };

  return { before, after };
};
