import {
  isHtmlDocumentScope,
  normalizeHtmlDocumentScope,
  HTML_DOCUMENT_SCOPES,
} from '../../../libs/html-pdf/scopes.js';
import { buildHeroBadgeText } from '../../../libs/html-pdf/build-hero-badge.js';
import { validateAndNormalizeImageSrc } from '../../../libs/html-pdf/safe-image-src.js';

const IMAGE_PLACEMENTS = new Set([
  'headerBanner',
  'header',
  'headerListon',
  'afterDeparture',
  'beforePanoramas',
  'beforeFooter',
  'pageBackground1',
  'pageBackground2',
  'valoresPaymentBackground',
  'brochurePageFooter',
  'brochureSernaturLogo',
  'brochureItemTransporte',
  'brochureItemAlimentacion',
  'brochureItemAlojamiento',
  'brochureItemSeguridad',
  'brochureItemBeneficiosExclusivos',
  'brochureItemStaff',
  'page2Sidebar1',
  'page2Sidebar2',
  'page2Sidebar3',
  'page2Sidebar4',
  'webpayLogo',
  'paymentMethodArrow',
  'page2SectionVineta',
]);

const MAX_IMAGES = 12;

const ITEM_KEYS = [
  'transporte',
  'alimentacion',
  'alojamiento',
  'seguridad',
  'beneficiosExclusivos',
  'staff',
];

/**
 * @description Normaliza un día de itinerario desde distintas claves (day/dia, text/description).
 * @param {unknown} entry
 * @param {number} index
 * @returns {{ day: number, text: string }}
 */
const normalizeItineraryEntry = (entry, index) => {
  if (!entry || typeof entry !== 'object') {
    const err = new Error(`document.itinerario[${index}] debe ser un objeto con día y texto.`);
    err.statusCode = 400;
    throw err;
  }
  const rawDay = entry.day ?? entry.dia ?? entry.Day;
  const rawText = entry.text ?? entry.description ?? entry.descripcion;
  const dayNum = Number(rawDay);
  if (!Number.isFinite(dayNum) || !Number.isInteger(dayNum) || dayNum < 1) {
    const err = new Error(`document.itinerario[${index}].day (o dia) debe ser un entero ≥ 1.`);
    err.statusCode = 400;
    throw err;
  }
  if (rawText == null || String(rawText).trim() === '') {
    const err = new Error(`document.itinerario[${index}].text (o description) es requerido.`);
    err.statusCode = 400;
    throw err;
  }
  return { day: dayNum, text: String(rawText).trim() };
};

/**
 * @description Convierte a entero ≥ minVal; rechaza no finitos o decimales.
 * @param {unknown} raw
 * @param {string} fieldPath
 * @param {number} minVal
 * @returns {number}
 */
const parseRequiredInt = (raw, fieldPath, minVal) => {
  const n = Number(raw);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < minVal) {
    const err = new Error(
      `${fieldPath} debe ser un entero ≥ ${minVal}.`,
    );
    err.statusCode = 400;
    throw err;
  }
  return n;
};

/**
 * @description Lee duración del programa para el texto del hero (badge).
 * @param {object} document
 * @returns {{ dias: number, noches: number, diasAbordo: number, heroBadge: string }}
 */
const normalizeProgramHeroDuration = (document) => {
  const dias = parseRequiredInt(document.dias, 'document.dias', 1);
  const noches = parseRequiredInt(document.noches, 'document.noches', 1);
  const abordoRaw =
    document.diasAbordo ?? document.diasABordo ?? document.dias_a_bordo ?? document['dias a bordo'];
  const diasAbordo = parseRequiredInt(abordoRaw, 'document.diasAbordo (o dias_a_bordo)', 0);
  const heroBadge = buildHeroBadgeText(dias, noches, diasAbordo);
  return { dias, noches, diasAbordo, heroBadge };
};

/**
 * @description Valida una fila de la tabla Valores.
 * @param {unknown} row
 * @param {number} index
 * @returns {{ rangoPasajeros: string, cuposDisponibles: number, valorPorPersona: number, valorPorPersonaLight: number }}
 */
const normalizeValorRow = (row, index) => {
  if (!row || typeof row !== 'object') {
    const err = new Error(`document.valores[${index}] debe ser un objeto.`);
    err.statusCode = 400;
    throw err;
  }
  const rango =
    row.rangoPasajeros ?? row.rango ?? row.rangoDePasajeros ?? row.pasajeros;
  const cupos = row.cuposDisponibles ?? row.cupos;
  const valor = row.valorPorPersona ?? row.valor ?? row.precioPorPersona;

  if (rango == null || String(rango).trim() === '') {
    const err = new Error(
      `document.valores[${index}].rangoPasajeros (o rango) es requerido.`
    );
    err.statusCode = 400;
    throw err;
  }

  const cuposNum = Number(cupos);
  if (!Number.isFinite(cuposNum) || !Number.isInteger(cuposNum) || cuposNum < 0) {
    const err = new Error(
      `document.valores[${index}].cuposDisponibles (o cupos) debe ser un entero ≥ 0.`
    );
    err.statusCode = 400;
    throw err;
  }

  const valorNum = Number(valor);
  if (!Number.isFinite(valorNum) || valorNum < 0) {
    const err = new Error(
      `document.valores[${index}].valorPorPersona (o valor) debe ser un número ≥ 0.`
    );
    err.statusCode = 400;
    throw err;
  }

  const lightRaw = row.valorPorPersonaLight;
  const lightNum = Number(lightRaw);
  if (!Number.isFinite(lightNum) || lightNum < 0) {
    const err = new Error(
      `document.valores[${index}].valorPorPersonaLight debe ser un número ≥ 0.`
    );
    err.statusCode = 400;
    throw err;
  }

  return {
    rangoPasajeros: String(rango).trim(),
    cuposDisponibles: cuposNum,
    valorPorPersona: valorNum,
    valorPorPersonaLight: lightNum,
  };
};

/**
 * @description Valida bloque opcional QR promocional (primera página).
 * @param {unknown} raw
 * @returns {{ src: string, caption: string } | null}
 */
const normalizePromoQr = (raw) => {
  if (raw == null || raw === '') return null;
  if (typeof raw !== 'object' || Array.isArray(raw)) {
    const err = new Error('document.promoQr debe ser un objeto con src (imagen del código QR).');
    err.statusCode = 400;
    throw err;
  }
  const src = validateAndNormalizeImageSrc(raw.src);
  const caption =
    raw.caption != null && String(raw.caption).trim() !== ''
      ? String(raw.caption).trim().slice(0, 500)
      : '¿Quieres otras alternativas? Escanea el siguiente código y arma tu propio plan.';
  return { src, caption };
};

/**
 * @description Normaliza imágenes opcionales incrustadas en el PDF.
 * @param {unknown} raw
 * @returns {{ src: string, alt: string, placement: string, widthPx: number | null }[]}
 */
const normalizeDocumentImages = (raw) => {
  if (raw == null) return [];
  if (!Array.isArray(raw)) {
    const err = new Error('document.images debe ser un array.');
    err.statusCode = 400;
    throw err;
  }
  if (raw.length > MAX_IMAGES) {
    const err = new Error(`document.images admite como máximo ${MAX_IMAGES} elementos.`);
    err.statusCode = 400;
    throw err;
  }
  return raw.map((entry, index) => {
    if (!entry || typeof entry !== 'object') {
      const err = new Error(`document.images[${index}] debe ser un objeto.`);
      err.statusCode = 400;
      throw err;
    }
    const src = validateAndNormalizeImageSrc(entry.src);
    const alt = entry.alt != null ? String(entry.alt).trim().slice(0, 240) : '';
    const placementRaw = entry.placement != null ? String(entry.placement).trim() : 'header';
    if (!IMAGE_PLACEMENTS.has(placementRaw)) {
      const err = new Error(
        `document.images[${index}].placement debe ser uno de: ${[...IMAGE_PLACEMENTS].join(', ')}.`,
      );
      err.statusCode = 400;
      throw err;
    }
    const widthRaw = entry.widthPx ?? entry.width;
    let widthPx = null;
    if (widthRaw != null && widthRaw !== '') {
      const w = Number(widthRaw);
      if (!Number.isFinite(w) || w < 16 || w > 560) {
        const err = new Error(
          `document.images[${index}].widthPx (o width) debe ser un número entre 16 y 560.`,
        );
        err.statusCode = 400;
        throw err;
      }
      widthPx = Math.round(w);
    }
    return { src, alt, placement: placementRaw, widthPx };
  });
};

/**
 * @description Valida el cuerpo del request para generación PDF HTML.
 * @param {unknown} body
 * @throws {Error} Con statusCode 400 si la validación falla
 * @returns {{ scope: string, document: object, action: object }}
 */
export const validateHtmlDocumentPayload = (body) => {
  if (!body || typeof body !== 'object') {
    const err = new Error('El cuerpo de la petición debe ser un objeto JSON.');
    err.statusCode = 400;
    throw err;
  }

  const { scope: rawScope, document, action = {} } = body;

  if (rawScope == null || String(rawScope).trim() === '') {
    const err = new Error('El campo "scope" es requerido.');
    err.statusCode = 400;
    throw err;
  }

  const scope = normalizeHtmlDocumentScope(rawScope);
  if (!isHtmlDocumentScope(scope)) {
    const err = new Error(
      `Scope no válido. Use uno de: ${HTML_DOCUMENT_SCOPES.join(', ')} (BDA se acepta como alias de DBA).`
    );
    err.statusCode = 400;
    err.supportedScopes = HTML_DOCUMENT_SCOPES;
    throw err;
  }

  if (!document || typeof document !== 'object') {
    const err = new Error('El campo "document" es requerido y debe ser un objeto.');
    err.statusCode = 400;
    throw err;
  }

  const { title, items } = document;

  if (document.title == null || String(document.title).trim() === '') {
    const err = new Error('document.title es requerido.');
    err.statusCode = 400;
    throw err;
  }

  let departureLocationOut;
  if (document.departureLocation != null && String(document.departureLocation).trim() !== '') {
    departureLocationOut = String(document.departureLocation).trim();
  }

  if (document.zonaSalida == null || String(document.zonaSalida).trim() === '') {
    const err = new Error(
      'document.zonaSalida es requerido (ciudad o zona de salida; se muestra como "SALIENDO DESDE …").',
    );
    err.statusCode = 400;
    throw err;
  }
  const zonaSalida = String(document.zonaSalida).trim().slice(0, 200);

  const { dias, noches, diasAbordo, heroBadge } = normalizeProgramHeroDuration(document);

  if (!items || typeof items !== 'object') {
    const err = new Error('document.items es requerido y debe ser un objeto.');
    err.statusCode = 400;
    throw err;
  }

  /** @type {Record<string, string[]>} */
  const itemsClean = {};

  for (const key of ITEM_KEYS) {
    if (!(key in items)) {
      const err = new Error(`document.items debe incluir la clave "${key}".`);
      err.statusCode = 400;
      throw err;
    }
    const raw = items[key];
    if (!Array.isArray(raw) || raw.length === 0) {
      const err = new Error(
        `document.items.${key} debe ser un array de textos con al menos un elemento (listado como panoramas).`
      );
      err.statusCode = 400;
      throw err;
    }
    itemsClean[key] = raw.map((line, i) => {
      if (line == null || String(line).trim() === '') {
        const err = new Error(`document.items.${key}[${i}] debe ser texto no vacío.`);
        err.statusCode = 400;
        throw err;
      }
      return String(line).trim();
    });
  }

  const { panoramas, itinerario } = document;

  if (!Array.isArray(panoramas) || panoramas.length === 0) {
    const err = new Error('document.panoramas es requerido y debe ser un array con al menos un elemento.');
    err.statusCode = 400;
    throw err;
  }
  const panoramasClean = panoramas.map((p, i) => {
    if (p == null || String(p).trim() === '') {
      const err = new Error(`document.panoramas[${i}] debe ser texto no vacío.`);
      err.statusCode = 400;
      throw err;
    }
    return String(p).trim();
  });

  if (!Array.isArray(itinerario) || itinerario.length === 0) {
    const err = new Error('document.itinerario es requerido y debe ser un array con al menos un día.');
    err.statusCode = 400;
    throw err;
  }
  const itinerarioClean = itinerario
    .map((entry, i) => normalizeItineraryEntry(entry, i))
    .sort((a, b) => a.day - b.day);

  const rawValores = document.valores;
  if (!Array.isArray(rawValores) || rawValores.length === 0) {
    const err = new Error(
      'document.valores es requerido y debe ser un array con al menos una fila (rango, cupos, valorPorPersona, valorPorPersonaLight).'
    );
    err.statusCode = 400;
    throw err;
  }
  const valoresClean = rawValores.map((row, i) => normalizeValorRow(row, i));

  const rawFooter = document.footer;
  if (!rawFooter || typeof rawFooter !== 'object') {
    const err = new Error(
      'document.footer es requerido: objeto con instagram, facebook, website (o paginaWeb/web) y whatsapp.'
    );
    err.statusCode = 400;
    throw err;
  }

  const instagram = rawFooter.instagram ?? rawFooter.Instagram;
  const facebook = rawFooter.facebook ?? rawFooter.Facebook;
  const website = rawFooter.website ?? rawFooter.paginaWeb ?? rawFooter.web ?? rawFooter.sitioWeb;
  const whatsapp = rawFooter.whatsapp ?? rawFooter.WhatsApp;

  /** @type {Record<string, string>} */
  const footerClean = { instagram, facebook, website, whatsapp };
  for (const [name, val] of Object.entries(footerClean)) {
    if (val == null || String(val).trim() === '') {
      const err = new Error(`document.footer.${name} es requerido (texto o URL).`);
      err.statusCode = 400;
      throw err;
    }
    footerClean[name] = String(val).trim();
  }

  const imagesClean = normalizeDocumentImages(document.images);

  const promoQrClean = normalizePromoQr(document.promoQr);

  return {
    scope,
    document: {
      title: String(title).trim(),
      zonaSalida,
      dias,
      noches,
      diasAbordo,
      heroBadge,
      ...(departureLocationOut ? { departureLocation: departureLocationOut } : {}),
      items: itemsClean,
      panoramas: panoramasClean,
      itinerario: itinerarioClean,
      valores: valoresClean,
      footer: {
        instagram: footerClean.instagram,
        facebook: footerClean.facebook,
        website: footerClean.website,
        whatsapp: footerClean.whatsapp,
      },
      images: imagesClean,
      ...(promoQrClean ? { promoQr: promoQrClean } : {}),
    },
    action: {
      isPreview: action.isPreview === true,
    },
  };
};
