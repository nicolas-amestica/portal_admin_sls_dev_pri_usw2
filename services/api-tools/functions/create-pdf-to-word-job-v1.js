import { InvokeCommand, LambdaClient } from '@aws-sdk/client-lambda';
import { success } from '../../../helpers/responses.js';
import { standardMiddleware } from '../../../libs/middleware/index.js';
import * as dynamoDb from '../../../libs/dynamodb-v3.js';
import { PDF_TO_WORD_JOB_PK, pdfToWordJobSk } from '../helpers/pdf-to-word-job-keys.js';
import { resolvePortalOwnerKey } from '../helpers/resolve-portal-owner-key.js';

const { DYNAMODB_MAINTAINER_TABLE, WORKER_FUNCTION_ARN } = process.env;

const ACTION = 'Encolar trabajo PDF→Word (invocación async al worker)';

let lambdaClient;

const getLambdaClient = () => {
  if (!lambdaClient) lambdaClient = new LambdaClient({ region: process.env.AWS_REGION || 'us-west-2' });
  return lambdaClient;
};

async function invokeWorker(jobId) {
  const name = WORKER_FUNCTION_ARN?.trim();
  if (!name) {
    const err = new Error('WORKER_FUNCTION_ARN no configurado en el servidor.');
    err.statusCode = 500;
    throw err;
  }
  await getLambdaClient().send(
    new InvokeCommand({
      FunctionName: name,
      InvocationType: 'Event',
      Payload: Buffer.from(JSON.stringify({ jobId })),
    })
  );
}

/**
 * @description Marca job como PROCESSING e invoca el worker Python asíncronamente tras verificar pertenencia y estado DRAFT.
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
    const err = new Error('No autorizado para operar sobre este trabajo.');
    err.statusCode = 403;
    throw err;
  }

  if (row.status !== 'DRAFT') {
    const err = new Error(`El trabajo no puede iniciarse (estado: ${String(row.status)}).`);
    err.statusCode = 409;
    throw err;
  }

  const now = new Date().toISOString();

  await dynamoDb.update({
    TableName: DYNAMODB_MAINTAINER_TABLE,
    Key: { pk: PDF_TO_WORD_JOB_PK, sk },
    UpdateExpression: 'SET #status = :proc, updatedAt = :now',
    ExpressionAttributeNames: { '#status': 'status' },
    ExpressionAttributeValues: {
      ':proc': 'PROCESSING',
      ':now': now,
      ':draft': 'DRAFT',
      ':owner': ownerKey,
    },
    ConditionExpression: '#status = :draft AND ownerKey = :owner',
  });

  await invokeWorker(jobId);

  return success(200, { jobId, status: 'PROCESSING' }, ACTION);
};

export const main = standardMiddleware(handler);
