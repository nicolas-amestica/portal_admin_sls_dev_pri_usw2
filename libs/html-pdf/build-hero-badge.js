/**
 * @description Arma el texto de la pastilla del hero del brochure (días, noches, días a bordo).
 * @param {number} dias
 * @param {number} noches
 * @param {number} diasAbordo
 * @returns {string}
 */
export const buildHeroBadgeText = (dias, noches, diasAbordo) =>
  `${dias} DÍAS - ${noches} NOCHES (${diasAbordo} A BORDO)`;

/** Texto fijo antes de la zona de salida en el hero (mayúsculas, brochure). */
export const HERO_ZONA_SALIDA_PREFIX = 'SALIENDO DESDE ';
