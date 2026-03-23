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
 * @description Busca los PDFs de presupuesto en S3 para un destino y región del cliente.
 * Los archivos siguen la estructura: agente-ia/{destino}/{region}/presupuesto-N-v1.pdf
 * Por cada PDF encontrado genera una presigned URL válida por 24 horas.
 *
 * @param {object} params
 * @param {'bariloche'|'camboriu'|'pucon'|'valdivia'} params.destino - Destino del viaje.
 * @param {string} params.codigoRegion - Código de región de Chile (ej: 'rm', 'ix', 'x').
 * @returns {Promise<{encontrados: boolean, archivos: Array<{nombre: string, url: string}>}>}
 */
export async function buscarPresupuestos({ destino, codigoRegion }) {
  const bucket = process.env.BUCKET_INFO_GI;
  const destinoNorm = destino.toLowerCase().replace(/\s+/g, '-');
  const regionNorm = codigoRegion.toLowerCase();

  const prefijo = `agente-ia/${destinoNorm}/${regionNorm}/`;
  const keys = await listKeys(bucket, prefijo);

  if (keys.length === 0) return { encontrados: false, archivos: [] };

  const archivos = keys.map((key) => ({ nombre: key.split('/').pop(), key }));
  return { encontrados: true, archivos };
}
