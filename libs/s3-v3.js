import { getAWSConfigs } from './configs';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

let s3;

const initClient = async () => {
  const config = await getAWSConfigs();
  s3 = new S3Client(config);
};

export const putObject = async (params) => {
  if (!s3) await initClient();
  const command = new PutObjectCommand(params);
  const response = await s3.send(command);
  return response;
};

export const getObject = async (params) => {
  if (!s3) await initClient();
  const command = new GetObjectCommand(params);
  const response = await s3.send(command);
  return response;
};

/**
 * Genera una URL prefirmada para acceder a un objeto de S3 sin credenciales.
 * @param {Object} params - Parámetros de S3 (Bucket, Key).
 * @param {number} expiresIn - Segundos de validez de la URL (default: 300).
 */
export const getPresignedUrl = async (params, expiresIn = 300) => {
  if (!s3) await initClient();
  const command = new GetObjectCommand(params);
  return getSignedUrl(s3, command, { expiresIn });
};