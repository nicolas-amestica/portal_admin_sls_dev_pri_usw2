/**
 * @description Normaliza nombre de ciudad/comuna para clave de mapa (minúsculas, sin tildes, espacios → guión bajo).
 * @param {string} ciudad
 * @returns {string}
 */
export function normalizarClaveCiudad(ciudad) {
  return ciudad
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
}

/**
 * Comunas/ciudades comunes → código de carpeta regional en S3 presupuestos/{codigo}/.
 * Extender según logs de sin_presupuesto.
 */
const CIUDAD_A_REGION = {
  arica: 'xv',
  putre: 'xv',
  alto_hospicio: 'i',
  iquique: 'i',
  pica: 'i',
  huara: 'i',
  camina: 'i',
  antofagasta: 'ii',
  calama: 'ii',
  mejillones: 'ii',
  tocopilla: 'ii',
  san_pedro_de_atacama: 'ii',
  copiapo: 'iii',
  vallenar: 'iii',
  la_serena: 'iv',
  coquimbo: 'iv',
  ovalle: 'iv',
  illapel: 'iv',
  los_vilos: 'iv',
  valparaiso: 'v',
  vina_del_mar: 'v',
  vina: 'v',
  quilpue: 'v',
  villa_alemana: 'v',
  san_felipe: 'vi',
  los_andes: 'vi',
  rancagua: 'vi',
  curico: 'vii',
  talca: 'vii',
  linares: 'vii',
  chillan: 'xvi',
  chillan_viejo: 'xvi',
  concepcion: 'viii',
  los_angeles: 'viii',
  temuco: 'ix',
  villarrica: 'ix',
  pucon: 'ix',
  valdivia: 'xiv',
  osorno: 'x',
  puerto_montt: 'x',
  castro: 'x',
  ancud: 'x',
  coyhaique: 'xi',
  puerto_aysen: 'xi',
  aysen: 'xi',
  chile_chico: 'xi',
  cochrane: 'xi',
  puerto_cisnes: 'xi',
  cisnes: 'xi',
  lago_verde: 'xi',
  tortel: 'xi',
  caleta_tortel: 'xi',
  rio_ibanez: 'xi',
  puerto_natales: 'xii',
  punta_arenas: 'xii',
  santiago: 'rm',
  maipu: 'rm',
  puente_alto: 'rm',
  nunoa: 'rm',
  las_condes: 'rm',
  providencia: 'rm',
  vitacura: 'rm',
  la_florida: 'rm',
  penalolen: 'rm',
  huechuraba: 'rm',
  recoleta: 'rm',
  independencia: 'rm',
  estacion_central: 'rm',
  cerrillos: 'rm',
  pudahuel: 'rm',
  quilicura: 'rm',
  colina: 'rm',
  lampa: 'rm',
  melipilla: 'rm',
  talagante: 'rm',
  san_bernardo: 'rm',
  la_pintana: 'rm',
  el_bosque: 'rm',
  la_granja: 'rm',
  san_miguel: 'rm',
  san_fernando: 'vi',
  san_carlos: 'xvi',
  lago_ranco: 'xiv',
  futrono: 'xiv',
  rio_bueno: 'xiv',
  la_union: 'xiv',
  puerto_varas: 'x',
  frutillar: 'x',
  fresia: 'x',
};

/**
 * @description Devuelve código de región en S3 si la ciudad está en el mapa.
 * @param {string} ciudad - Comuna o ciudad mencionada por el cliente.
 * @returns {string|null}
 */
export function codigoRegionPorCiudad(ciudad) {
  if (!ciudad || typeof ciudad !== 'string') return null;
  const key = normalizarClaveCiudad(ciudad);
  return CIUDAD_A_REGION[key] ?? null;
}
