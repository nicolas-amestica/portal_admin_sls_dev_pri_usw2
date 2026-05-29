import { detectRegionFromText } from '../tools/region-presupuesto-ciudad.js';
import { collectQuoteIntentTexts } from './prepare-turn-context.js';

const REGION_LABELS = {
  xv: "Arica y Parinacota",
  i: 'Tarapacá',
  ii: 'Antofagasta',
  iii: 'Atacama',
  iv: 'Coquimbo',
  v: "Valparaíso (V Región)",
  rm: 'Metropolitana',
  vi: "O'Higgins (VI Región)",
  vii: 'Maule',
  xvi: 'Ñuble',
  viii: 'Biobío',
  ix: 'Araucanía',
  xiv: 'Los Ríos',
  x: 'Los Lagos',
  xi: 'Aysén',
  xii: 'Magallanes',
};

const DESTINO_PATTERNS = [
  { destino: 'camboriu', label: 'Camboriú', patterns: [/cambori[uú]/i, /\bbrasil\b/i] },
  { destino: 'bariloche', label: 'Bariloche', patterns: [/bariloche/i, /\bargentina\b/i] },
  {
    destino: 'sur_de_chile',
    label: 'Sur de Chile',
    patterns: [/sur\s+de\s+chile/i, /circuito\s+sur/i, /\bsur\s+y\b/i, /\b(el\s+)?sur\b/i],
  },
  { destino: 'chiloe', label: 'Chiloé', patterns: [/chilo[eé]/i] },
  { destino: 'pucon', label: 'Pucón', patterns: [/\bpuc[oó]n\b/i] },
  { destino: 'valdivia', label: 'Valdivia', patterns: [/valdivia/i] },
  { destino: 'puerto_varas', label: 'Puerto Varas', patterns: [/puerto\s+varas/i] },
];

const SUR_DESTINOS = new Set(['sur_de_chile', 'chiloe', 'pucon', 'valdivia', 'puerto_varas']);

/**
 * @description Detecta destinos mencionados en un texto.
 * @param {string} text
 * @returns {Array<{ destino: string, label: string }>}
 */
export function detectDestinosFromText(text) {
  if (!text?.trim()) return [];

  const found = [];
  const seen = new Set();

  for (const entry of DESTINO_PATTERNS) {
    if (seen.has(entry.destino)) continue;
    if (entry.patterns.some((pattern) => pattern.test(text))) {
      found.push({ destino: entry.destino, label: entry.label });
      seen.add(entry.destino);
    }
  }

  return found;
}

/**
 * @description Construye contexto estructurado de cotización a partir del historial reciente.
 * @param {object[]} turnItems
 * @returns {object|null}
 */
export function extractQuoteContext(turnItems) {
  const combinedText = collectQuoteIntentTexts(turnItems);
  if (!combinedText) return null;

  const destinos = detectDestinosFromText(combinedText);
  const region = detectRegionFromText(combinedText);

  if (destinos.length === 0 && !region) return null;

  const surDestinos = destinos.filter((d) => SUR_DESTINOS.has(d.destino));
  const surPdfDisponible = surDestinos.length > 0 ? region?.codigoRegion === 'v' : null;

  const accionesSugeridas = [];
  if (region?.codigoRegion) {
    const bariloche = destinos.find((d) => d.destino === 'bariloche');
    if (bariloche) {
      accionesSugeridas.push(`buscar_presupuestos(destino: bariloche, codigoRegion: ${region.codigoRegion})`);
    }
    const camboriu = destinos.find((d) => d.destino === 'camboriu');
    if (camboriu) {
      accionesSugeridas.push('buscar_presupuestos(destino: camboriu, codigoRegion: brasil)');
    }
    if (surPdfDisponible === true) {
      surDestinos.forEach((d) => {
        accionesSugeridas.push(`buscar_presupuestos(destino: ${d.destino}, codigoRegion: v)`);
      });
    }
  }

  return {
    textoAnalizado: combinedText.slice(0, 300),
    destinos: destinos.map((d) => d.destino),
    destinosLabel: destinos.map((d) => d.label),
    ...(region
      ? {
          codigoRegion: region.codigoRegion,
          regionLabel: REGION_LABELS[region.codigoRegion] ?? region.codigoRegion,
          ciudad: region.ciudad ?? null,
        }
      : {}),
    ...(surDestinos.length > 0
      ? {
          surPdfDisponible,
          surNota:
            surPdfDisponible === false
              ? 'Sur de Chile: PDF automático solo para colegios de V Región. Confirma que sí trabajan esos circuitos y ofrece reunión; envía PDF de otros destinos si aplican.'
              : surPdfDisponible === true
                ? 'Sur de Chile: origen V Región confirmado; puedes llamar buscar_presupuestos para los destinos del sur mencionados.'
                : 'Sur de Chile mencionado; falta confirmar región de origen antes de decidir PDF o reunión.',
        }
      : {}),
    ...(accionesSugeridas.length > 0 ? { accionesSugeridas } : {}),
    noRepreguntar:
      destinos.length > 0 && region?.codigoRegion
        ? 'Destino y región ya detectados en la conversación. NO vuelvas a pedirlos; ejecuta las acciones sugeridas.'
        : destinos.length > 0
          ? 'Destino(s) ya detectado(s). NO vuelvas a pedir destino; solo pide región si falta.'
          : region?.codigoRegion
            ? 'Región ya detectada. NO vuelvas a pedir región; solo pide destino si falta.'
            : null,
  };
}
