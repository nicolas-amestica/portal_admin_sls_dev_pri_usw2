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
 * @description Normaliza un nombre de ciudad para comparar con el nombre de carpeta en S3.
 * Convierte a minúsculas, elimina tildes y reemplaza espacios por guión bajo.
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
 * @description Busca los PDFs de presupuesto en S3 para un destino y región del cliente.
 * Si se proporciona una ciudad, primero busca en presupuestos/excepciones/{ciudad}/.
 * Si hay archivos en la excepción, los retorna directamente (precio especial para esa ciudad).
 * Si no hay excepción, cae en la carpeta regional presupuestos/{region}/.
 *
 * Estructura S3:
 * - presupuestos/{region}/{destinos}-{numero}.pdf  (precio general por región)
 * - presupuestos/excepciones/{ciudad}/{destinos}-{numero}.pdf  (precio especial por ciudad)
 *
 * @param {object} params
 * @param {string} params.destino - Destino del viaje (ej: 'bariloche', 'pucon', 'puerto_varas').
 * @param {string} params.codigoRegion - Código de región de Chile (ej: 'rm', 'ix', 'x').
 * @param {string} [params.ciudad] - Ciudad o comuna del colegio (ej: 'Salamanca'). Opcional.
 * @returns {Promise<{encontrados: boolean, archivos: Array<{nombre: string, key: string}>}>}
 */
export async function buscarPresupuestos({ destino, codigoRegion, ciudad }) {
  const bucket = process.env.BUCKET_INFO_GI;
  // Los espacios se normalizan a guión bajo para coincidir con la convención del nombre de archivo.
  const destinoNorm = destino.toLowerCase().replace(/\s+/g, '_');

  // Verificar si la ciudad tiene presupuesto de excepción antes de usar el regional.
  if (ciudad) {
    const ciudadNorm = normalizarCiudad(ciudad);
    const prefijoExcepcion = `presupuestos/excepciones/${ciudadNorm}/`;
    const keysExcepcion = await listKeys(bucket, prefijoExcepcion);
    const keysFiltradosExcepcion = keysExcepcion.filter((key) => archivoContieneDestino(key.split('/').pop(), destinoNorm));

    if (keysFiltradosExcepcion.length > 0) {
      const archivos = keysFiltradosExcepcion.map((key) => ({ nombre: key.split('/').pop(), key }));
      return { encontrados: true, archivos };
    }
  }

  // Sin excepción: usar la carpeta regional.
  const regionNorm = codigoRegion.toLowerCase();
  const prefijo = `presupuestos/${regionNorm}/`;
  const keys = await listKeys(bucket, prefijo);

  const keysFiltrados = keys.filter((key) => archivoContieneDestino(key.split('/').pop(), destinoNorm));

  if (keysFiltrados.length === 0) return { encontrados: false, archivos: [] };

  const archivos = keysFiltrados.map((key) => ({ nombre: key.split('/').pop(), key }));
  return { encontrados: true, archivos };
}
