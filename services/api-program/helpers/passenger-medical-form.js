/** Prefijo donde el presign de subida coloca fichas individuales. */
const PREFIX = 'fichas-medicas';

/**
 * @description Valida claves de fichas individuales y excluye la plantilla base.
 * @param {string} key Clave decodificada ya sin espacios externos sobrantes.
 * @param {string} programId Identificador del programa solicitado.
 */
export const isAllowedPassengerUploadedKey = (key, programId) => {
  const trimmed = key.trim();
  if (!trimmed || trimmed.includes('..')) return false;
  const segments = trimmed.split('/');
  if (segments[0] !== PREFIX) return false;
  if (segments.length === 3 && segments[1] !== programId) return false;
  if (segments.length !== 2 && segments.length !== 3) return false;
  const fileSegment = segments.at(-1);
  if (!fileSegment) return false;
  const allowedExt = /\.(pdf|jpg|jpeg|png)$/i;
  return allowedExt.test(fileSegment);
};

/**
 * @description Verifica que la clave solicitada esté registrada en la nómina del programa.
 * @param {Array} passengers Nómina persistida del programa.
 * @param {string} s3Key Clave S3 normalizada.
 */
export const passengerListHasMedicalFormKey = (passengers, s3Key) => {
  if (!Array.isArray(passengers)) return false;
  return passengers.some((passenger) => {
    const directKeys = [
      passenger.medicalFormS3Key,
      passenger.medicalFormKey,
      passenger.medicalForm?.s3Key,
      passenger.medicalForm?.key,
      passenger.fichaMedicaS3Key,
      passenger.fichaMedica?.s3Key,
      passenger.fichaMedica?.key,
      passenger.s3Key,
    ];
    return directKeys.some((key) => typeof key === 'string' && key.trim() === s3Key);
  });
};
