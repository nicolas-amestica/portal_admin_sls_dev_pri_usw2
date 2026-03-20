import { listObjects } from '../../../libs/s3-v3.js';

/**
 * @description Lista los Keys de PDFs en S3 bajo un prefijo dado.
 * @param {string} bucket
 * @param {string} prefix
 * @returns {Promise<string[]>}
 */
async function listKeys(bucket, prefix) {
  const response = await listObjects({ Bucket: bucket, Prefix: prefix });
  return (response.Contents || []).filter((obj) => obj.Key.endsWith('.pdf')).map((obj) => obj.Key);
}

/**
 * @description Busca PDFs de presupuesto en S3 para un destino y ubicación del cliente.
 * Intenta primero con la comuna específica; si no encuentra, usa el prefijo _default.
 * Retorna los keys de S3 para que el orquestador envíe los archivos directamente.
 *
 * @param {object} params
 * @param {'bariloche'|'camboriu'|'pucon'|'valdivia'} params.destino
 * @param {string} params.codigoRegion
 * @param {string} params.nombreComuna
 * @returns {Promise<{encontrados: boolean, archivos: Array<{nombre: string, key: string}>}>}
 */
export async function buscarPresupuestos({ destino, codigoRegion, nombreComuna }) {
  const bucket = process.env.BUCKET_INFO_GI;
  const destinoNorm = destino.toLowerCase().replace(/\s+/g, '-');
  const regionNorm = codigoRegion.toLowerCase();
  const comunaNorm = nombreComuna.toLowerCase().replace(/\s+/g, '-');

  const prefijos = [
    `presupuestos/${destinoNorm}/${regionNorm}/${comunaNorm}/`,
    `presupuestos/${destinoNorm}/${regionNorm}/_default/`,
  ];

  let keys = [];
  for (const prefijo of prefijos) {
    keys = await listKeys(bucket, prefijo);
    if (keys.length > 0) break;
  }

  if (keys.length === 0) return { encontrados: false, archivos: [] };

  const archivos = keys.map((key) => ({ nombre: key.split('/').pop(), key }));
  return { encontrados: true, archivos };
}
