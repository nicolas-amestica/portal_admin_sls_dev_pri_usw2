/** Prefijo donde el presign de subida coloca fichas individuales. */
const PASSENGER_MEDICAL_FORM_PREFIX = 'fichas-medicas';
const MEDICAL_FORM_KEY_FIELDS = new Set(['s3key', 's3Key', 'key', 'medicalFormKey', 'medicalFormS3Key']);

/**
 * Solo fichas subidas por presign (`fichas-medicas/<nombre>` sin subcarpetas).
 * Plantilla `fichas-medicas/formato-base/...` queda fuera.
 *
 * @description Evita uso del endpoint como lector arbitrario del bucket.
 * @param {string} key Clave decodificada ya sin espacios externos sobrantes.
 * @returns {boolean}
 */
export const isAllowedPassengerUploadedKey = (key) => {
  const trimmed = key.trim();
  if (!trimmed || trimmed.includes('..')) return false;
  const segments = trimmed.split('/').filter(Boolean);
  if (segments.length !== 2 || segments[0] !== PASSENGER_MEDICAL_FORM_PREFIX) return false;
  const fileSegment = segments[1];
  if (!fileSegment) return false;
  const allowedExt = /\.(pdf|jpg|jpeg|png)$/i;
  return allowedExt.test(fileSegment);
};

/**
 * @description Verifica si un valor de la nómina referencia exactamente la clave S3 solicitada.
 * @param {unknown} value Valor a revisar dentro de un pasajero.
 * @param {string} s3Key Clave S3 normalizada.
 * @returns {boolean}
 */
export const containsMedicalFormKey = (value, s3Key) => {
  if (typeof value === 'string') return false;
  if (!value || typeof value !== 'object') return false;
  if (Array.isArray(value)) return value.some((entry) => containsMedicalFormKey(entry, s3Key));
  return Object.entries(value).some(([field, entry]) => {
    if (typeof entry === 'string' && MEDICAL_FORM_KEY_FIELDS.has(field)) {
      return entry.trim() === s3Key;
    }
    return containsMedicalFormKey(entry, s3Key);
  });
};

/**
 * @description Determina si la ficha médica pertenece a la nómina guardada del programa.
 * @param {Array<object>} passengerList Nómina de pasajeros del programa.
 * @param {string} s3Key Clave S3 normalizada.
 * @returns {boolean}
 */
export const passengerListReferencesKey = (passengerList, s3Key) =>
  Array.isArray(passengerList)
    && passengerList.some((passenger) => containsMedicalFormKey(passenger, s3Key));
