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

/** Ciudades ordenadas por longitud descendente para evitar matches parciales. */
const CIUDADES_ORDENADAS = Object.keys(CIUDAD_A_REGION).sort((a, b) => b.length - a.length);

const REGION_ROMAN_PATTERNS = [
  { codigoRegion: 'xv', patterns: [/\bxv\b/i, /arica\s+y\s+parinacota/i, /\barica\b/i] },
  { codigoRegion: 'i', patterns: [/\btarapac[aá]\b/i] },
  { codigoRegion: 'ii', patterns: [/\bantofagasta\b/i] },
  { codigoRegion: 'iii', patterns: [/\batacama\b/i] },
  { codigoRegion: 'iv', patterns: [/\bcoquimbo\b/i] },
  {
    codigoRegion: 'v',
    patterns: [
      /\bv\s*regi[oó]n\b/i,
      /quinta\s+regi[oó]n/i,
      /\bvalpara[ií]so\b/i,
      /\bvi[nñ]a\s+del\s+mar\b/i,
    ],
  },
  {
    codigoRegion: 'rm',
    patterns: [/\brm\b/i, /regi[oó]n\s+metropolitana/i, /\bmetropolitana\b/i, /\bsantiago\b/i],
  },
  {
    codigoRegion: 'vi',
    patterns: [/\bvi\s*regi[oó]n\b/i, /sexta\s+regi[oó]n/i, /\bo['']?higgins\b/i],
  },
  { codigoRegion: 'vii', patterns: [/\bvii\s*regi[oó]n\b/i, /s[eé]ptima\s+regi[oó]n/i, /\bmaule\b/i] },
  { codigoRegion: 'xvi', patterns: [/\bxvi\b/i, /regi[oó]n\s+de\s+[nñ]uble/i, /\b[nñ]uble\b/i] },
  { codigoRegion: 'viii', patterns: [/\bviii\s*regi[oó]n/i, /octava\s+regi[oó]n/i, /\bb[ií]ob[ií]o\b/i] },
  { codigoRegion: 'ix', patterns: [/\bix\s*regi[oó]n/i, /novena\s+regi[oó]n/i, /\baraucan[ií]a\b/i] },
  { codigoRegion: 'xiv', patterns: [/\bxiv\b/i, /los\s+r[ií]os\b/i] },
  { codigoRegion: 'x', patterns: [/\bx\s*regi[oó]n/i, /d[eé]cima\s+regi[oó]n/i, /los\s+lagos\b/i] },
  { codigoRegion: 'xi', patterns: [/\bxi\s*regi[oó]n/i, /\bays[eé]n\b/i] },
  { codigoRegion: 'xii', patterns: [/\bxii\b/i, /magallanes\b/i] },
];

/**
 * @description Detecta código de región chilena a partir de texto libre del cliente.
 * @param {string} text
 * @returns {{ codigoRegion: string, ciudad?: string, source: 'ciudad'|'region' }|null}
 */
export function detectRegionFromText(text) {
  if (!text || typeof text !== 'string') return null;

  const normalized = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  for (const cityKey of CIUDADES_ORDENADAS) {
    const cityPattern = cityKey.replace(/_/g, '[\\s_]+');
    const regex = new RegExp(`(?:\\bde\\s+|\\bdesde\\s+|\\ben\\s+|\\bsomos\\s+de\\s+)?${cityPattern}\\b`, 'i');
    if (regex.test(normalized)) {
      return {
        codigoRegion: CIUDAD_A_REGION[cityKey],
        ciudad: cityKey.replace(/_/g, ' '),
        source: 'ciudad',
      };
    }
  }

  for (const entry of REGION_ROMAN_PATTERNS) {
    if (entry.patterns.some((pattern) => pattern.test(normalized))) {
      return { codigoRegion: entry.codigoRegion, source: 'region' };
    }
  }

  return null;
}
