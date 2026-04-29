import { listObjects } from '../../../libs/s3-v3.js';
import { codigoRegionPorCiudad } from './region-presupuesto-ciudad.js';

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
 * @description Normaliza un nombre de ciudad para comparar con el nombre de carpeta en S3.
 * @param {string} ciudad - Nombre de la ciudad (ej: "Salamanca", "Puerto Montt").
 * @returns {string}
 */
function normalizarCiudad(ciudad) {
  return ciudad
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_');
}

/**
 * @description Lista keys PDF filtradas por destino bajo presupuestos/{region}/.
 * @param {string} bucket
 * @param {string} regionNorm
 * @param {string} destinoNorm
 * @returns {Promise<string[]>}
 */
async function keysPorRegionYDestino(bucket, regionNorm, destinoNorm) {
  const prefijo = `presupuestos/${regionNorm}/`;
  const keys = await listKeys(bucket, prefijo);
  return keys.filter((key) => archivoContieneDestino(key.split('/').pop(), destinoNorm));
}

/**
 * @description Busca los PDFs de presupuesto en S3 para un destino y región del cliente.
 * Camboriú usa siempre carpeta presupuestos/brasil/ y segmento brasil en nombre de archivo.
 * Si no hay resultados en la región que pasó el modelo y hay ciudad conocida en el mapa, reintenta con esa región.
 *
 * @param {object} params
 * @param {string} params.destino - Destino del viaje (ej: 'bariloche', 'camboriu').
 * @param {string} params.codigoRegion - Código de región de Chile o 'brasil' para Camboriú.
 * @param {string} [params.ciudad] - Ciudad o comuna del colegio (ej: 'Salamanca'). Opcional.
 * @returns {Promise<{encontrados: boolean, archivos: Array<{nombre: string, key: string}>}>}
 */
export async function buscarPresupuestos({ destino, codigoRegion, ciudad }) {
  const bucket = process.env.BUCKET_INFO_GI;
  const destinoRaw = destino.toLowerCase().replace(/\s+/g, '_');
  const isCamboriu = destinoRaw === 'camboriu';
  let destinoNorm = destinoRaw === 'camboriu' ? 'brasil' : destinoRaw;

  if (ciudad) {
    const ciudadNorm = normalizarCiudad(ciudad);
    const prefijoExcepcion = `presupuestos/excepciones/${ciudadNorm}/`;
    const keysExcepcion = await listKeys(bucket, prefijoExcepcion);
    const keysFiltradosExcepcion = keysExcepcion.filter((key) =>
      archivoContieneDestino(key.split('/').pop(), destinoNorm)
    );

    if (keysFiltradosExcepcion.length > 0) {
      const archivos = keysFiltradosExcepcion.map((key) => ({ nombre: key.split('/').pop(), key }));
      return { encontrados: true, archivos };
    }
  }

  let regionNorm = codigoRegion.toLowerCase();
  if (isCamboriu) regionNorm = 'brasil';

  let keysFiltrados = await keysPorRegionYDestino(bucket, regionNorm, destinoNorm);

  if (keysFiltrados.length === 0 && ciudad && !isCamboriu) {
    const hint = codigoRegionPorCiudad(ciudad);
    if (hint && hint !== regionNorm) {
      keysFiltrados = await keysPorRegionYDestino(bucket, hint, destinoNorm);
    }
  }

  if (keysFiltrados.length === 0) return { encontrados: false, archivos: [] };

  const archivos = keysFiltrados.map((key) => ({ nombre: key.split('/').pop(), key }));
  return { encontrados: true, archivos };
}
