import { getAWSConfigs } from './configs';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
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

/**
 * Genera una URL prefirmada para subir (PUT) un objeto a S3 sin credenciales.
 * @param {Object} params - Parámetros de S3 (Bucket, Key, ContentType).
 * @param {number} expiresIn - Segundos de validez (default: 300).
 */
export const putPresignedUrl = async (params, expiresIn = 300) => {
  if (!s3) await initClient();
  const command = new PutObjectCommand(params);
  return getSignedUrl(s3, command, { expiresIn });
};

/**
 * Elimina un objeto de S3.
 * @param {Object} params - Parámetros de S3 (Bucket, Key).
 */
export const deleteObject = async (params) => {
  if (!s3) await initClient();
  const command = new DeleteObjectCommand(params);
  return s3.send(command);
};

/**
 * Lista objetos en un bucket de S3 bajo un prefijo dado.
 * @param {Object} params - Parámetros de S3 (Bucket, Prefix, etc.).
 * @returns {Promise<import('@aws-sdk/client-s3').ListObjectsV2CommandOutput>}
 */
export const listObjects = async (params) => {
  if (!s3) await initClient();
  const command = new ListObjectsV2Command(params);
  return s3.send(command);
};

/**
 * Descarga un objeto de S3 y retorna su contenido como Buffer.
 * @param {Object} params - Parámetros de S3 (Bucket, Key).
 * @returns {Promise<Buffer>}
 */
export const getObjectBuffer = async (params) => {
  const response = await getObject(params);
  const chunks = [];
  for await (const chunk of response.Body) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
};