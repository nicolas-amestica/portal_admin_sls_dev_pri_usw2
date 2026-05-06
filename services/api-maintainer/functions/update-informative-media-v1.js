import { success } from '../../../helpers/responses.js';
import { standardMiddleware } from '../../../libs/middleware/index.js';
import * as dynamoDb from '../../../libs/dynamodb-v3.js';
import { deleteObject } from '../../../libs/s3-v3.js';
import { requireStaffProfile } from '../helpers/portal-jwt-auth.js';
import { INFO_MEDIA_PK, VALID_SCOPES } from '../helpers/informative-media-constants.js';
import { normalizeInformativeMediaLink } from '../helpers/validate-informative-media-link.js';

const { DYNAMODB_MAINTAINER_TABLE, BUCKET_INFO_GI } = process.env;

const MEDIA_TYPES = new Set(['image', 'video']);

function scopeFromSk(sk) {
  const idx = String(sk).indexOf('#');
  if (idx <= 0) return null;
  return sk.slice(0, idx);
}

function assertS3KeyForScope(s3Key, scope) {
  const prefix = `assets/informative-media/${scope}/`;
  return typeof s3Key === 'string' && s3Key.startsWith(prefix);
}

/**
 * @description Actualiza metadatos de un medio informativo (y opcionalmente la clave S3).
 */
const handler = async (event) => {
  await requireStaffProfile(event.headers ?? {});
  const action = 'Actualizar medio informativo.';
  const {
    sk,
    title,
    description,
    mediaType,
    s3Key,
    active,
    sortOrder,
    linkHref,
    linkLabel,
    requiredPath,
  } = event.body ?? {};

  if (!sk || typeof sk !== 'string') {
    const err = new Error('El campo sk es requerido.');
    err.statusCode = 400;
    throw err;
  }

  const sc = scopeFromSk(sk);
  if (!sc || !VALID_SCOPES.has(sc)) {
    const err = new Error('Sort key no válido para medios informativos.');
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
    const err = new Error('La clave S3 no coincide con el ámbito del ítem.');
    err.statusCode = 400;
    throw err;
  }

  const link = normalizeInformativeMediaLink(linkHref, linkLabel);

  const existing = await dynamoDb.getOne({
    TableName: DYNAMODB_MAINTAINER_TABLE,
    Key: { pk: INFO_MEDIA_PK, sk },
  });

  if (!existing?.sk) {
    const err = new Error('El recurso no existe.');
    err.statusCode = 404;
    throw err;
  }

  const prevKey = existing.s3Key;
  const now = new Date().toISOString();

  const updated = await dynamoDb.update({
    TableName: DYNAMODB_MAINTAINER_TABLE,
    Key: { pk: INFO_MEDIA_PK, sk },
    ConditionExpression: 'attribute_exists(sk)',
    UpdateExpression: [
      'SET #title = :title',
      '#description = :description',
      '#mediaType = :mediaType',
      '#s3Key = :s3Key',
      '#active = :active',
      '#sortOrder = :sortOrder',
      '#linkHref = :linkHref',
      '#linkLabel = :linkLabel',
      '#requiredPath = :requiredPath',
      '#updatedAt = :updatedAt',
    ].join(', '),
    ExpressionAttributeNames: {
      '#title': 'title',
      '#description': 'description',
      '#mediaType': 'mediaType',
      '#s3Key': 's3Key',
      '#active': 'active',
      '#sortOrder': 'sortOrder',
      '#linkHref': 'linkHref',
      '#linkLabel': 'linkLabel',
      '#requiredPath': 'requiredPath',
      '#updatedAt': 'updatedAt',
    },
    ExpressionAttributeValues: {
      ':title': String(title).trim(),
      ':description': String(description).trim(),
      ':mediaType': mediaType,
      ':s3Key': s3Key,
      ':active': Boolean(active),
      ':sortOrder': Number(sortOrder) || 0,
      ':linkHref': link.linkHref,
      ':linkLabel': link.linkLabel,
      ':requiredPath': requiredPath || null,
      ':updatedAt': now,
    },
  });

  if (prevKey && prevKey !== s3Key && BUCKET_INFO_GI) {
    try {
      await deleteObject({ Bucket: BUCKET_INFO_GI, Key: prevKey });
    } catch (e) {
      console.warn('[Actualizar medio informativo] No se pudo borrar objeto S3 anterior:', prevKey, e?.message);
    }
  }

  return success(200, updated ?? { ...existing, ...updated }, action);
};

export const main = standardMiddleware(handler);
