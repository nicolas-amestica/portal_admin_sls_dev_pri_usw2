/**
 * Valida el payload de configuración global.
 *
 * @function validateGlobalConfig
 * @param {Object} payload - Payload a validar.
 * @param {number} payload.ivaRateCrew - Tasa de IVA para crew (0-1).
 * @param {number} payload.ivaRateService - Tasa de IVA para services (0-1).
 * @throws {Error} Error de validación con statusCode 400.
 *
 * @description
 * Valida que:
 * - ivaRateCrew sea un número entre 0 y 1
 * - ivaRateService sea un número entre 0 y 1
 */
export const validateGlobalConfig = (payload) => {
  if (!payload) {
    const error = new Error("Payload de configuración es requerido.");
    error.statusCode = 400;
    throw error;
  }

  const { ivaRateCrew, ivaRateService } = payload;

  if (typeof ivaRateCrew !== "number" || ivaRateCrew < 0 || ivaRateCrew > 1) {
    const error = new Error(
      "ivaRateCrew debe ser un número entre 0 y 1 (ej: 0.1525 para 15.25%).",
    );
    error.statusCode = 400;
    throw error;
  }

  if (
    typeof ivaRateService !== "number" ||
    ivaRateService < 0 ||
    ivaRateService > 1
  ) {
    const error = new Error(
      "ivaRateService debe ser un número entre 0 y 1 (ej: 0.19 para 19%).",
    );
    error.statusCode = 400;
    throw error;
  }

  return true;
};
