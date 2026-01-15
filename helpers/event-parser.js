/**
 * Parse el body de un evento de API Gateway
 * Maneja tanto eventos normales como eventos con base64
 *
 * @param {Object} event - Evento de API Gateway
 * @returns {Object} Body parseado como objeto JavaScript
 */
export const parseEventBody = (event) => {
  if (!event.body) {
    return {};
  }

  let body = event.body;

  // Si el body viene codificado en base64, decodificarlo primero
  if (event.isBase64Encoded && typeof body === 'string') {
    body = Buffer.from(body, 'base64').toString('utf-8');
  }

  // Si el body es string, parsearlo como JSON
  if (typeof body === 'string') {
    return JSON.parse(body);
  }

  // Si ya es un objeto, retornarlo directamente
  return body;
};
