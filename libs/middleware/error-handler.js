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

    // Loguear respuesta de error de API externa (ej: Axios) para diagnóstico
    if (error.isAxiosError && error.response?.data) {
      console.error('[ERROR-HANDLER] API externa respondió:', JSON.stringify(error.response.data));
    }

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
