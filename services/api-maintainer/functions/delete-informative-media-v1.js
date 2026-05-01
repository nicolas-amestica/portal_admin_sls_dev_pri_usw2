import { success } from '../../../helpers/responses.js';
import { standardMiddleware } from '../../../libs/middleware/index.js';
import * as dynamoDb from '../../../libs/dynamodb-v3.js';
import { deleteObject } from '../../../libs/s3-v3.js';
import { requireStaffProfile } from '../helpers/portal-jwt-auth.js';
import { INFO_MEDIA_PK } from '../helpers/informative-media-constants.js';

const { DYNAMODB_MAINTAINER_TABLE, BUCKET_INFO_GI } = process.env;

/**
 * @description Elimina un medio informativo y el objeto en S3 si existe.
 * Query: sk (requerido).
 */
const handler = async (event) => {
  await requireStaffProfile(event.headers ?? {});
  const action = 'Eliminar medio informativo.';
  const sk = (event.queryParams?.sk ?? '').trim();

  if (!sk) {
    const err = new Error('El parámetro sk es requerido.');
    err.statusCode = 400;
    throw err;
  }

  const existing = await dynamoDb.getOne({
    TableName: DYNAMODB_MAINTAINER_TABLE,
    Key: { pk: INFO_MEDIA_PK, sk },
  });

  if (!existing?.sk) {
    const err = new Error('El recurso no existe.');
    err.statusCode = 404;
    throw err;
  }

  await dynamoDb.remove({
    TableName: DYNAMODB_MAINTAINER_TABLE,
    Key: { pk: INFO_MEDIA_PK, sk },
    ConditionExpression: 'attribute_exists(sk)',
  });

  if (existing.s3Key && BUCKET_INFO_GI) {
    try {
      await deleteObject({ Bucket: BUCKET_INFO_GI, Key: existing.s3Key });
    } catch (e) {
      console.warn('[Eliminar medio informativo] No se pudo borrar S3:', existing.s3Key, e?.message);
    }
  }

  return success(200, { sk }, action);
};

export const main = standardMiddleware(handler);
