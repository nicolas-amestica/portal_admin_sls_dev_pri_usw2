import { unsuccessful } from '../../helpers/responses.js';

/**
 * Middleware de manejo centralizado de errores
 * Compatible con el sistema de respuestas existente
 */
export const errorHandlerMiddleware = () => {
  const onError = async (request) => {
    const { error, context } = request;

    // Extraer statusCode del error si existe
    const statusCode = error.statusCode || error.status || 500;

    // Crear respuesta usando helper existente
    const errorResponse = unsuccessful(
      statusCode,
      {
        message: error.message,
        code: error.code,
        correlationId: context.correlationId
      },
      context.functionName || 'Unknown Action'
    );

    // Asignar respuesta
    request.response = errorResponse;
  };

  return { onError };
};
