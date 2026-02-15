/**
 * Handler simple para peticiones OPTIONS (CORS preflight)
 * Este handler devuelve los headers CORS necesarios para todas las peticiones OPTIONS
 */
export const handler = async (event) => {
  console.log('CORS Preflight Request:', {
    path: event.rawPath,
    method: event.requestContext.http.method,
    origin: event.headers.origin
  });

  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Max-Age': '300',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ message: 'OK' })
  };
};
