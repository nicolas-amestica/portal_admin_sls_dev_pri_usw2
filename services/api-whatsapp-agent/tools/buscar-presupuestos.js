import { listObjects } from '../../../libs/s3-v3.js';

/**
 * @description Verifica si el nombre de archivo contiene el destino como segmento.
 * Los archivos siguen el patrón: dest1-dest2-...-N.pdf donde N es el número correlativo.
 * Los destinos con más de una palabra usan guión bajo (ej: puerto_varas).
 * @param {string} filename - Nombre del archivo (ej: "pucon-bariloche-valdivia-1.pdf").
 * @param {string} destinoNorm - Destino normalizado en minúsculas (ej: "bariloche").
 * @returns {boolean}
 */
function archivoContieneDestino(filename, destinoNorm) {
  const nombre = filename.replace('.pdf', '');
  const partes = nombre.split('-');
  // El último segmento es el número correlativo; los anteriores son los destinos del tour.
  const destinos = partes.slice(0, -1);
  return destinos.includes(destinoNorm);
}

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
 * Los archivos siguen la estructura: presupuestos/{region}/{destinos}-{numero}.pdf
 * Un archivo puede incluir varios destinos en su nombre (ej: pucon-bariloche-valdivia-1.pdf).
 * Se retornan todos los archivos de la región cuyo nombre contenga el destino solicitado.
 *
 * @param {object} params
 * @param {string} params.destino - Destino del viaje (ej: 'bariloche', 'pucon', 'puerto_varas').
 * @param {string} params.codigoRegion - Código de región de Chile (ej: 'rm', 'ix', 'x').
 * @returns {Promise<{encontrados: boolean, archivos: Array<{nombre: string, key: string}>}>}
 */
export async function buscarPresupuestos({ destino, codigoRegion }) {
  const bucket = process.env.BUCKET_INFO_GI;
  // Los espacios se normalizan a guión bajo para coincidir con la convención del nombre de archivo.
  const destinoNorm = destino.toLowerCase().replace(/\s+/g, '_');
  const regionNorm = codigoRegion.toLowerCase();

  const prefijo = `presupuestos/${regionNorm}/`;
  const keys = await listKeys(bucket, prefijo);

  const keysFiltrados = keys.filter((key) => archivoContieneDestino(key.split('/').pop(), destinoNorm));

  if (keysFiltrados.length === 0) return { encontrados: false, archivos: [] };

  const archivos = keysFiltrados.map((key) => ({ nombre: key.split('/').pop(), key }));
  return { encontrados: true, archivos };
}
