import { success } from '../../../helpers/responses.js';
import { standardMiddleware } from '../../../libs/middleware/index.js';
import * as dynamoDb from '../../../libs/dynamodb-v3.js';
import { requireStaffProfile } from '../helpers/portal-jwt-auth.js';
import { INFO_MEDIA_PK, VALID_SCOPES } from '../helpers/informative-media-constants.js';

const { DYNAMODB_MAINTAINER_TABLE } = process.env;

const MEDIA_TYPES = new Set(['image', 'video']);

function assertS3KeyForScope(s3Key, scope) {
  const prefix = `assets/informative-media/${scope}/`;
  return typeof s3Key === 'string' && s3Key.startsWith(prefix);
}

/**
 * @description Crea un registro de medio informativo enlazado a una clave S3 ya subida vía presign.
 */
const handler = async (event) => {
  await requireStaffProfile(event.headers ?? {});
  const action = 'Crear medio informativo.';
  const {
    scope,
    title,
    description,
    mediaType,
    s3Key,
    active = true,
    sortOrder = 0,
  } = event.body ?? {};

  const sc = String(scope ?? '').trim();
  if (!VALID_SCOPES.has(sc)) {
    const err = new Error(`Ámbito no válido. Permitidos: ${[...VALID_SCOPES].join(', ')}.`);
    err.statusCode = 400;
    throw err;
  }

  if (!title || String(title).trim().length < 2) {
    const err = new Error('El título es requerido (mínimo 2 caracteres).');
    err.statusCode = 400;
    throw err;
  }

  if (description === undefined || description === null || String(description).trim().length < 1) {
    const err = new Error('La descripción es requerida.');
    err.statusCode = 400;
    throw err;
  }

  if (!mediaType || !MEDIA_TYPES.has(mediaType)) {
    const err = new Error('mediaType debe ser "image" o "video".');
    err.statusCode = 400;
    throw err;
  }

  if (!assertS3KeyForScope(s3Key, sc)) {
    const err = new Error('La clave S3 no coincide con el ámbito indicado.');
    err.statusCode = 400;
    throw err;
  }

  const id = crypto.randomUUID();
  const sk = `${sc}#${id}`;
  const now = new Date().toISOString();

  const item = {
    pk: INFO_MEDIA_PK,
    sk,
    scope: sc,
    title: String(title).trim(),
    description: String(description).trim(),
    mediaType,
    s3Key,
    active: Boolean(active),
    sortOrder: Number(sortOrder) || 0,
    createdAt: now,
    updatedAt: now,
  };

  await dynamoDb.put({
    TableName: DYNAMODB_MAINTAINER_TABLE,
    Item: item,
    ConditionExpression: 'attribute_not_exists(sk)',
  });

  return success(201, item, action);
};

export const main = standardMiddleware(handler);
