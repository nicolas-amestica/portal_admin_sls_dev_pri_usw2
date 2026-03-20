import { TranscribeClient, StartTranscriptionJobCommand, GetTranscriptionJobCommand } from '@aws-sdk/client-transcribe';
import { putObject, getObject } from '../../../libs/s3-v3.js';

let _client = null;
const getClient = () => {
  if (!_client) _client = new TranscribeClient({ region: process.env.AWS_REGION || 'us-west-2' });
  return _client;
};

const POLL_INTERVAL_MS = 3000;
const MAX_POLLS = 15; // ~45 segundos máximo

/**
 * @description Mapea un tipo MIME de audio al formato que espera AWS Transcribe.
 * @param {string} mimeType
 * @returns {string}
 */
function mimeTypeToFormat(mimeType) {
  const base = mimeType.split(';')[0].trim();
  const map = { 'audio/ogg': 'ogg', 'audio/mpeg': 'mp3', 'audio/mp4': 'mp4', 'audio/wav': 'wav', 'audio/webm': 'webm', 'audio/amr': 'amr', 'audio/flac': 'flac' };
  return map[base] || 'ogg';
}

/**
 * @description Transcribe un audio usando AWS Transcribe.
 * Sube el audio a S3, inicia un job de transcripción, hace polling hasta obtener el resultado.
 *
 * @param {Buffer} buffer - Contenido binario del audio (nota de voz de WhatsApp).
 * @param {string} mimeType - Tipo MIME del audio (ej: "audio/ogg; codecs=opus").
 * @returns {Promise<string>} Texto transcrito en español.
 */
export async function transcribeAudio(buffer, mimeType) {
  const bucket = process.env.BUCKET_INFO_GI;
  const jobName = `wa-${Date.now()}`;
  const inputKey = `temp/transcribe/${jobName}.ogg`;
  const outputKey = `temp/transcribe/${jobName}-result.json`;

  // 1. Subir el audio a S3.
  await putObject({
    Bucket: bucket,
    Key: inputKey,
    Body: buffer,
    ContentType: mimeType.split(';')[0].trim(),
  });

  // 2. Iniciar el job de transcripción en español.
  await getClient().send(new StartTranscriptionJobCommand({
    TranscriptionJobName: jobName,
    Media: { MediaFileUri: `s3://${bucket}/${inputKey}` },
    MediaFormat: mimeTypeToFormat(mimeType),
    LanguageCode: 'es-US',
    OutputBucketName: bucket,
    OutputKey: outputKey,
  }));

  // 3. Polling hasta completar o fallar.
  for (let i = 0; i < MAX_POLLS; i++) {
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));

    const { TranscriptionJob: job } = await getClient().send(
      new GetTranscriptionJobCommand({ TranscriptionJobName: jobName })
    );

    if (job.TranscriptionJobStatus === 'COMPLETED') {
      const response = await getObject({ Bucket: bucket, Key: outputKey });
      const text = await response.Body.transformToString();
      return JSON.parse(text).results.transcripts[0].transcript;
    }

    if (job.TranscriptionJobStatus === 'FAILED') {
      throw new Error(`AWS Transcribe falló: ${job.FailureReason}`);
    }
  }

  throw new Error('AWS Transcribe excedió el tiempo máximo de espera (45s)');
}
