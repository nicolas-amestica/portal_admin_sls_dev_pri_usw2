import { uuidv7 } from 'uuidv7';
import { success } from '../../../helpers/responses.js';
import { standardMiddleware } from '../../../libs/middleware/index.js';
import * as dynamoDb from '../../../libs/dynamodb-v3.js';
import { putPresignedUrl } from '../../../libs/s3-v3.js';
import { PDF_TO_WORD_JOB_PK, pdfToWordJobSk } from '../helpers/pdf-to-word-job-keys.js';
import { resolvePortalOwnerKey } from '../helpers/resolve-portal-owner-key.js';
import {
  slugPdfFileName,
  validatePdfFilesForPresign,
} from '../validators/validate-pdf-files-presign-body.js';

const { DYNAMODB_MAINTAINER_TABLE, BUCKET_INFO_GI } = process.env;

const ACTION = 'Presignar subida PDF para conversión DOCX';
const PRESIGNED_PUT_TTL_SECONDS = 300;

/**
 * @description Genera URLs prefirmadas PUT y crea job DRAFT en DynamoDB antes de iniciar conversión asíncrona.
 */
const handler = async (event) => {
  if (!BUCKET_INFO_GI || !DYNAMODB_MAINTAINER_TABLE) {
    const err = new Error('Tabla DynamoDB o bucket S3 no configurados.');
    err.statusCode = 500;
    throw err;
  }

  const ownerKey = await resolvePortalOwnerKey(event);
  const validated = validatePdfFilesForPresign(event.body);

  const jobId = uuidv7();
  const now = new Date().toISOString();
  const uploads = [];

  /** @type {Array<{ fileName: string, s3Key: string }>} */
  const inputs = [];

  for (let i = 0; i < validated.length; i++) {
    const { fileName, contentType } = validated[i];
    const slug = slugPdfFileName(fileName);
    const index = String(i).padStart(3, '0');
    const s3Key = `tools/pdf-to-word/${jobId}/incoming/${index}-${slug}.pdf`;

    inputs.push({ fileName, s3Key });

    const uploadUrl = await putPresignedUrl(
      { Bucket: BUCKET_INFO_GI, Key: s3Key, ContentType: contentType },
      PRESIGNED_PUT_TTL_SECONDS
    );

    uploads.push({
      uploadUrl,
      s3Key,
      fileName,
      contentType,
    });
  }

  /** Expiración opcional para limpiezas futuras (TTL en DynamoDB debe habilitarse en la tabla mantenedor si se usa). */
  const expireAt = Math.floor(Date.now() / 1000) + 24 * 60 * 60;

  await dynamoDb.put({
    TableName: DYNAMODB_MAINTAINER_TABLE,
    Item: {
      pk: PDF_TO_WORD_JOB_PK,
      sk: pdfToWordJobSk(jobId),
      jobType: 'PDF_TO_WORD',
      status: 'DRAFT',
      ownerKey,
      inputs,
      expireAt,
      createdAt: now,
      updatedAt: now,
    },
    ConditionExpression: 'attribute_not_exists(sk)',
  });

  return success(200, { jobId, uploads }, ACTION);
};

export const main = standardMiddleware(handler);
