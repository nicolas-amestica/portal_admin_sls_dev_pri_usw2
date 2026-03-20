import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getPresignedUrl } from '../../../libs/s3-v3.js';

let s3Client;
const getS3Client = () => {
  if (!s3Client) s3Client = new S3Client({ region: process.env.AWS_REGION });
  return s3Client;
};

const PRESIGNED_URL_EXPIRY = 86400; // 24 horas

/**
 * @description Lista objetos S3 bajo un prefijo dado.
 * @param {string} bucket
 * @param {string} prefix
 * @returns {Promise<string[]>} Lista de Keys encontrados.
 */
async function listKeys(bucket, prefix) {
  const command = new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix });
  const response = await getS3Client().send(command);
  return (response.Contents || []).filter((obj) => obj.Key.endsWith('.pdf')).map((obj) => obj.Key);
}

/**
 * @description Busca los PDFs de presupuesto en S3 para un destino y ubicación del cliente.
 * Intenta primero con la comuna específica; si no encuentra, usa el prefijo _default.
 * Por cada PDF encontrado genera una presigned URL válida por 24 horas.
 *
 * @param {object} params
 * @param {'bariloche'|'camboriu'|'pucon'|'valdivia'} params.destino - Destino del viaje.
 * @param {string} params.codigoRegion - Código de región de Chile (ej: 'rm', 'ix', 'x').
 * @param {string} params.nombreComuna - Nombre de la comuna en minúsculas con guiones (ej: 'las-condes').
 * @returns {Promise<{encontrados: boolean, archivos: Array<{nombre: string, url: string}>}>}
 */
export async function buscarPresupuestos({ destino, codigoRegion, nombreComuna }) {
  const bucket = process.env.BUCKET_INFO_GI;
  const destinoNorm = destino.toLowerCase().replace(/\s+/g, '-');
  const regionNorm = codigoRegion.toLowerCase();
  const comunaNorm = nombreComuna.toLowerCase().replace(/\s+/g, '-');

  // Buscar primero con la comuna específica, luego fallback a _default.
  const prefijos = [
    `presupuestos/${destinoNorm}/${regionNorm}/${comunaNorm}/`,
    `presupuestos/${destinoNorm}/${regionNorm}/_default/`,
  ];

  let keys = [];
  for (const prefijo of prefijos) {
    keys = await listKeys(bucket, prefijo);
    if (keys.length > 0) break;
  }

  if (keys.length === 0) {
    return { encontrados: false, archivos: [] };
  }

  const archivos = await Promise.all(
    keys.map(async (key) => {
      const url = await getPresignedUrl({ Bucket: bucket, Key: key }, PRESIGNED_URL_EXPIRY);
      const nombre = key.split('/').pop();
      return { nombre, url };
    })
  );

  return { encontrados: true, archivos };
}
