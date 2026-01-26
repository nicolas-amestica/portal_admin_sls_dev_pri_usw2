/**
 * Valida el payload de configuración de usuario.
 *
 * @function validateUserConfig
 * @param {Object} payload - Payload a validar.
 * @param {string} payload.language - Idioma del usuario ('es' | 'en').
 * @throws {Error} Error de validación con statusCode 400.
 *
 * @description
 * Valida que language sea 'es' o 'en'.
 */
export const validateUserConfig = (payload) => {
  if (!payload) {
    const error = new Error("Payload de configuración es requerido.");
    error.statusCode = 400;
    throw error;
  }

  const { language } = payload;

  if (!language || (language !== "es" && language !== "en")) {
    const error = new Error('language debe ser "es" o "en".');
    error.statusCode = 400;
    throw error;
  }

  return true;
};
