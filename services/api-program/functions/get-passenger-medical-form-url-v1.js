import { success } from '../../../helpers/responses.js';
import * as dynamoDbLib from '../../../libs/dynamodb-v3.js';
import { getPresignedUrl } from '../../../libs/s3-v3.js';
import { standardMiddleware } from '../../../libs/middleware/index.js';
import { requireStaffProfile } from '../../api-maintainer/helpers/portal-jwt-auth.js';
import {
  isAllowedPassengerUploadedKey,
  passengerListReferencesKey,
} from '../helpers/medical-form-access.js';

const EXPIRES_IN = 300;
const ACTION = 'Generar URL de descarga de ficha médica de pasajero.';

const { BUCKET_INFO_GI, DYNAMODB_PROGRAM_TABLE, PROGRAM_TABLE } = process.env;

/**
 * Genera y retorna una URL prefirmada GET para descargar o visualizar
 * la ficha médica subida de un pasajero desde S3.
 *
 * @description Rechaza claves que no coinciden con el formato de subidas vía presign
 * y valida que estén asociadas a la nómina del programa indicado.
 * @example
 * GET /v1/pasajeros/ficha-medica/url?programId=PRG%23...&s3Key=fichas-medicas%2F...
 */
const handler = async (event) => {
  await requireStaffProfile(event.headers);

  const programId = decodeURIComponent(event.queryParams?.programId ?? '').trim();
  const s3Key = decodeURIComponent(event.queryParams?.s3Key ?? '').trim();

  if (!programId) {
    const error = new Error('El identificador del programa es requerido.');
    error.statusCode = 400;
    throw error;
  }

  if (!s3Key) {
    const error = new Error('La clave S3 del archivo es requerida.');
    error.statusCode = 400;
    throw error;
  }

  if (!isAllowedPassengerUploadedKey(s3Key)) {
    const error = new Error('Clave de objeto no permitida.');
    error.statusCode = 400;
    throw error;
  }

  const program = await dynamoDbLib.getOne({
    TableName: DYNAMODB_PROGRAM_TABLE,
    Key: { pk: PROGRAM_TABLE, sk: programId },
  });

  if (!program) {
    const error = new Error('Programa no encontrado.');
    error.statusCode = 404;
    throw error;
  }

  if (!passengerListReferencesKey(program.passengerList, s3Key)) {
    const error = new Error('La ficha médica no está asociada a la nómina del programa.');
    error.statusCode = 403;
    throw error;
  }

  const downloadUrl = await getPresignedUrl(
    { Bucket: BUCKET_INFO_GI, Key: s3Key },
    EXPIRES_IN,
  );

  return success(200, { downloadUrl }, ACTION);
};

export const main = standardMiddleware(handler);
