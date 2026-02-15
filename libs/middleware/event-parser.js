import { parseEventBody } from '../../helpers/event-parser.js';

/**
 * Middleware que parsea el body del evento
 * Wrapper del helper existente parseEventBody
 */
export const eventParserMiddleware = () => {
  const before = async (request) => {
    const { event } = request;

    // Parsear body usando helper existente
    const parsedBody = parseEventBody(event);

    // Agregar body parseado al event
    event.body = parsedBody;

    // Agregar parámetros comunes al event para fácil acceso
    event.pathParams = event.pathParameters || {};
    event.queryParams = event.queryStringParameters || {};
  };

  return { before };
};
