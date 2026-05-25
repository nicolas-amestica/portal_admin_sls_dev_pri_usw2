import { success } from '../../../helpers/responses.js';
import { standardMiddleware } from '../../../libs/middleware/index.js';
import * as dynamoDb from '../../../libs/dynamodb-v3.js';
import { getPresignedUrl } from '../../../libs/s3-v3.js';
import { PDF_TO_WORD_JOB_PK, pdfToWordJobSk } from '../helpers/pdf-to-word-job-keys.js';
import { resolvePortalOwnerKey } from '../helpers/resolve-portal-owner-key.js';

const { DYNAMODB_MAINTAINER_TABLE, BUCKET_INFO_GI } = process.env;

const ACTION = 'Estado trabajo PDF→Word y URL prefirmada de descarga';
const DOWNLOAD_URL_TTL = 600;

/**
 * @description Devuelve el estado del job y, cuando está DONE, una URL prefirmada GET temporal para DOCX/ZIP resultante.
 */
const handler = async (event) => {
  const ownerKey = await resolvePortalOwnerKey(event);

  let jobId = event.pathParams?.jobId ?? event.pathParams?.JobId ?? '';
  if (Array.isArray(jobId)) jobId = jobId[0];
  jobId = String(jobId ?? '').trim();
  if (!jobId) {
    const err = new Error('Identificador de trabajo inválido.');
    err.statusCode = 400;
    throw err;
  }

  const sk = pdfToWordJobSk(jobId);
  const row = await dynamoDb.getOne({
    TableName: DYNAMODB_MAINTAINER_TABLE,
    Key: { pk: PDF_TO_WORD_JOB_PK, sk },
  });

  if (!row) {
    const err = new Error('El trabajo solicitado no existe.');
    err.statusCode = 404;
    throw err;
  }

  if (row.ownerKey !== ownerKey) {
    const err = new Error('No autorizado para consultar este trabajo.');
    err.statusCode = 403;
    throw err;
  }

  const status = typeof row.status === 'string' ? row.status : 'UNKNOWN';

  if (status !== 'DONE') {
    return success(
      200,
      {
        status,
        downloadUrl: null,
        outputFileName: null,
        outputContentType: null,
        error: row.error ?? null,
      },
      ACTION,
    );
  }

  const outKey =
    typeof row.outputS3Key === 'string' && row.outputS3Key.startsWith(`tools/pdf-to-word/${jobId}/output/`)
      ? row.outputS3Key
      : null;

  if (!outKey) {
    const err = new Error('Salida incompleta: falta outputS3Key.');
    err.statusCode = 500;
    throw err;
  }

  const downloadUrl = await getPresignedUrl(
    { Bucket: BUCKET_INFO_GI, Key: outKey },
    DOWNLOAD_URL_TTL,
  );

  return success(
    200,
    {
      status: 'DONE',
      downloadUrl,
      outputFileName: row.outputFileName ?? null,
      outputContentType: row.outputContentType ?? null,
      error: null,
    },
    ACTION,
  );
};

export const main = standardMiddleware(handler);
