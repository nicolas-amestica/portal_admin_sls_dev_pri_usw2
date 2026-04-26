/**
 * Descarga `document.images[].src` cuando es http(s) y los sustituye por data URLs
 * antes del HTML→PDF (Chromium no depende de red; presigned S3 funciona vía Node fetch).
 */

import * as S3Lib from '../s3-v3.js';

const HEADER_BANNER_KEY = 'assets/budget/fondo_cabecera.png';

const FALLBACK_BUCKET_HOST = 'giras-indomito-dev-info.s3.us-west-2.amazonaws.com';

/**
 * @description URL HTTPS de un objeto en el bucket de información (stage vía BUCKET_INFO_GI).
 * @param {string} objectKey - p.ej. assets/budget/fondo_1.png
 * @returns {string}
 */
export const getBudgetAssetUrl = (objectKey) => {
  const key = String(objectKey).replace(/^\//, '');
  const bucket = process.env.BUCKET_INFO_GI?.trim();
  const region = process.env.AWS_REGION?.trim() || 'us-west-2';
  if (bucket) {
    return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
  }
  return `https://${FALLBACK_BUCKET_HOST}/${key}`;
};

/**
 * @description Defaults de maquetación budget (fondos, `liston.png` sobre cabecera, viñeta títulos pág. 2 `vineta_verde.png`, pie brochure, bloque valores+pago pág. 2).
 * Solo se inyectan si el cliente no envía ya una imagen con el mismo `placement`.
 */
const BUDGET_LAYOUT_DEFAULTS = [
  { objectKey: 'assets/budget/fondo_1.png', placement: 'pageBackground1' },
  { objectKey: 'assets/budget/liston.png', placement: 'headerListon' },
  { objectKey: 'assets/budget/fondo_pie.png', placement: 'valoresPaymentBackground' },
  { objectKey: 'assets/budget/mochilas.png', placement: 'brochurePageFooter' },
  { objectKey: 'assets/budget/logo_sernatur.png', placement: 'brochureSernaturLogo' },
  { objectKey: 'assets/budget/logo_giras.png', placement: 'header', widthPx: 160 },
  { objectKey: 'assets/budget/fondo_2.png', placement: 'pageBackground2' },
  { objectKey: 'assets/budget/vineta_verde.png', placement: 'page2SectionVineta' },
  { objectKey: 'assets/budget/webpay.png', placement: 'webpayLogo' },
  { objectKey: 'assets/budget/flecha_verde.png', placement: 'paymentMethodArrow' },
];

/** Iconos PNG de categorías en el brochure (barra gris). */
const BROCHURE_ITEM_ICON_DEFAULTS = [
  { objectKey: 'assets/budget/bus.png', placement: 'brochureItemTransporte' },
  { objectKey: 'assets/budget/alimentacion.png', placement: 'brochureItemAlimentacion' },
  { objectKey: 'assets/budget/alojamiento.png', placement: 'brochureItemAlojamiento' },
  { objectKey: 'assets/budget/seguridad.png', placement: 'brochureItemSeguridad' },
  { objectKey: 'assets/budget/estrella.png', placement: 'brochureItemBeneficiosExclusivos' },
  { objectKey: 'assets/budget/personas.png', placement: 'brochureItemStaff' },
];

/** Columna derecha pág. 2 (orden fijo: chocolateria → motos → bowling → lago). */
const PAGE2_SIDEBAR_DEFAULTS = [
  { objectKey: 'assets/budget/chocolateria.png', placement: 'page2Sidebar1' },
  { objectKey: 'assets/budget/motos.png', placement: 'page2Sidebar2' },
  { objectKey: 'assets/budget/bowling.png', placement: 'page2Sidebar3' },
  { objectKey: 'assets/budget/lago.png', placement: 'page2Sidebar4' },
];

/**
 * @description URL pública del fondo de cabecera (bucket del stage vía BUCKET_INFO_GI).
 * @returns {string}
 */
export const getDefaultHeaderBannerUrl = () => {
  const explicit = process.env.HTML_PDF_HEADER_BANNER_URL?.trim();
  if (explicit) return explicit;
  return getBudgetAssetUrl(HEADER_BANNER_KEY);
};

const MAX_IMAGE_BYTES = 6 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 15000;
const MAX_REDIRECTS = 5;
const MAX_RATE_LIMIT_RETRIES = 5;
const RETRYABLE_HTTP_STATUS = new Set([429, 503]);
const ALLOWED_MIMES = new Set(['image/png', 'image/jpeg', 'image/gif', 'image/webp']);

/**
 * @description Pausa entre reintentos ante 429/503 (CDN, Wikimedia, etc.).
 * @param {number} ms
 * @returns {Promise<void>}
 */
const sleepMs = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * @description Detecta MIME por firma mágica si el Content-Type no es fiable.
 * @param {Buffer} buf
 * @returns {string | null}
 */
const sniffImageMime = (buf) => {
  if (buf.length < 12) return null;
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'image/png';
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x38) return 'image/gif';
  if (
    buf[0] === 0x52 &&
    buf[1] === 0x49 &&
    buf[2] === 0x46 &&
    buf[3] === 0x46 &&
    buf[8] === 0x57 &&
    buf[9] === 0x45 &&
    buf[10] === 0x42 &&
    buf[11] === 0x50
  ) {
    return 'image/webp';
  }
  return null;
};

/**
 * @description Indica si el host es loopback o RFC1918 (bloqueado en producción al descargar).
 * @param {string} hostname
 * @returns {boolean}
 */
const isNonRoutableOrLoopbackHost = (hostname) => {
  const h = hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (h === 'localhost' || h.endsWith('.localhost')) return true;
  if (h === '::1') return true;

  const m = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!m) return false;
  const a = Number(m[1]);
  const b = Number(m[2]);
  const c = Number(m[3]);
  const d = Number(m[4]);
  if ([a, b, c, d].some((x) => x > 255)) return true;
  if (a === 10) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 127) return true;
  if (a === 169 && b === 254) return true;
  if (a === 0) return true;
  return false;
};

/**
 * @description Evita SSRF obvio al descargar imágenes en Lambda.
 * @param {string} urlString
 */
const assertUrlSafeForServerFetch = (urlString) => {
  let u;
  try {
    u = new URL(urlString);
  } catch {
    const err = new Error('URL de imagen inválida.');
    err.statusCode = 400;
    throw err;
  }

  const host = u.hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (host === '169.254.169.254' || host === 'metadata.google.internal' || host.endsWith('.metadata.google.internal')) {
    const err = new Error('Host no permitido para descarga de imágenes.');
    err.statusCode = 400;
    throw err;
  }

  const offline = process.env.IS_OFFLINE === 'true';
  if (u.protocol === 'http:' && !offline) {
    const err = new Error('Las URLs de imagen deben usar https (http solo en entorno offline).');
    err.statusCode = 400;
    throw err;
  }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') {
    const err = new Error('La URL de imagen debe ser http o https.');
    err.statusCode = 400;
    throw err;
  }

  if (!offline && isNonRoutableOrLoopbackHost(host)) {
    const err = new Error('No se permiten imágenes desde hosts privados o loopback.');
    err.statusCode = 400;
    throw err;
  }
};

/**
 * @description Parsea URL estilo virtual-hosted de S3: `https://bucket.s3.region.amazonaws.com/key`.
 * @param {string} urlString
 * @returns {{ bucket: string, key: string } | null}
 */
const parseVirtualHostedS3Url = (urlString) => {
  try {
    const u = new URL(urlString);
    const m = u.hostname.match(/^([^.]+)\.s3\.([a-z0-9-]+)\.amazonaws\.com$/i);
    if (!m) return null;
    const key = decodeURIComponent(u.pathname.replace(/^\//, '').split('?')[0]);
    if (!key) return null;
    return { bucket: m[1], key };
  } catch {
    return null;
  }
};

/**
 * @description Valida buffer de imagen y devuelve data URL.
 * @param {Buffer} buffer
 * @param {string} contentType
 * @returns {string}
 */
const buildDataUrlFromBuffer = (buffer, contentType) => {
  if (buffer.length > MAX_IMAGE_BYTES) {
    const err = new Error(
      `La imagen supera el tamaño máximo permitido (${Math.floor(MAX_IMAGE_BYTES / (1024 * 1024))} MB).`,
    );
    err.statusCode = 413;
    throw err;
  }
  let mime = contentType && contentType.startsWith('image/') ? contentType : null;
  if (!mime || !ALLOWED_MIMES.has(mime)) {
    mime = sniffImageMime(buffer);
  }
  if (!mime || !ALLOWED_MIMES.has(mime)) {
    const err = new Error(
      'La imagen no es PNG, JPEG, GIF o WebP válida (Content-Type o firma no reconocidos).',
    );
    err.statusCode = 422;
    throw err;
  }
  return `data:${mime};base64,${buffer.toString('base64')}`;
};

/**
 * @description Obtiene imagen por SDK si la URL apunta al bucket configurado (objeto puede ser privado).
 * @param {string} urlString
 * @returns {Promise<string | null>} data URL o null
 */
const tryLoadImageFromSameBucket = async (urlString) => {
  const parsed = parseVirtualHostedS3Url(urlString);
  const expected = process.env.BUCKET_INFO_GI?.trim();
  if (!parsed || !expected || parsed.bucket !== expected) return null;
  try {
    const res = await S3Lib.getObject({ Bucket: parsed.bucket, Key: parsed.key });
    if (!res.Body) return null;
    const chunks = [];
    for await (const chunk of res.Body) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    const buf = Buffer.concat(chunks);
    const rawCt = (res.ContentType || '').split(';')[0].trim().toLowerCase();
    return buildDataUrlFromBuffer(buf, rawCt);
  } catch (e) {
    if (e && typeof e.statusCode === 'number') throw e;
    console.warn('tryLoadImageFromSameBucket:', e?.message || e);
    return null;
  }
};

/**
 * @description GET con redirecciones acotadas; valida cada URL destino.
 * @param {string} initialUrl
 * @returns {Promise<{ buffer: Buffer, contentType: string }>}
 */
const fetchImageResponse = async (initialUrl) => {
  let current = initialUrl;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    assertUrlSafeForServerFetch(current);
    /** @type {Response | undefined} */
    let res;
    for (let attempt = 0; attempt < MAX_RATE_LIMIT_RETRIES; attempt++) {
      res = await fetch(current, {
        method: 'GET',
        redirect: 'manual',
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
        headers: {
          Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
          'User-Agent': 'GirasIndomito-html-pdf/1',
        },
      });

      if (RETRYABLE_HTTP_STATUS.has(res.status) && attempt < MAX_RATE_LIMIT_RETRIES - 1) {
        const ra = res.headers.get('retry-after');
        let waitMs = Math.min(800 * 2 ** attempt, 16000);
        if (ra != null && /^\d+$/.test(String(ra).trim())) {
          waitMs = Math.min(parseInt(String(ra).trim(), 10) * 1000, 60000);
        }
        try {
          await res.arrayBuffer();
        } catch {
          /* ignorar cuerpo de error */
        }
        await sleepMs(waitMs);
        continue;
      }
      break;
    }

    if (!res) {
      const err = new Error('No se obtuvo respuesta al descargar la imagen.');
      err.statusCode = 502;
      throw err;
    }

    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get('location');
      if (!loc) {
        const err = new Error('Redirección de imagen sin Location.');
        err.statusCode = 502;
        throw err;
      }
      current = new URL(loc, current).href;
      continue;
    }

    if (!res.ok) {
      const shown = current.length > 180 ? `${current.slice(0, 180)}…` : current;
      const err = new Error(`No se pudo descargar la imagen (HTTP ${res.status}). URL: ${shown}`);
      err.statusCode = 502;
      err.responseStatus = res.status;
      throw err;
    }

    const buf = Buffer.from(await res.arrayBuffer());
    const rawCt = (res.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
    return { buffer: buf, contentType: rawCt };
  }

  const err = new Error('Demasiadas redirecciones al obtener la imagen.');
  err.statusCode = 502;
  throw err;
};

/**
 * @description Descarga una URL y devuelve data URL base64 (sin caché).
 * @param {string} urlString
 * @returns {Promise<string>}
 */
const fetchImageUrlAsDataUrl = async (urlString) => {
  const fromS3 = await tryLoadImageFromSameBucket(urlString);
  if (fromS3) return fromS3;

  const { buffer, contentType } = await fetchImageResponse(urlString);
  return buildDataUrlFromBuffer(buffer, contentType);
};

/**
 * @description Devuelve un resolvedor que deduplica por URL (una sola descarga por `src` repetido en el documento).
 * @returns {(url: string) => Promise<string>}
 */
const createHttpImageDataUrlResolver = () => {
  /** @type {Map<string, Promise<string>>} */
  const cache = new Map();
  return (urlString) => {
    const key = urlString;
    const hit = cache.get(key);
    if (hit) return hit;
    const pending = fetchImageUrlAsDataUrl(key);
    cache.set(key, pending);
    return pending;
  };
};

/**
 * @description Si `src` es http(s), lo reemplaza por data URL; si ya es data:, no hace nada.
 * @param {{ src: string, alt?: string, placement?: string, widthPx?: number | null }} img
 * @param {(url: string) => Promise<string>} resolveHttpToDataUrl
 * @returns {Promise<object>}
 */
const resolveImageEntry = async (img, resolveHttpToDataUrl) => {
  const src = typeof img.src === 'string' ? img.src.trim() : '';
  if (!src.startsWith('http://') && !src.startsWith('https://')) {
    return img;
  }
  const dataUrl = await resolveHttpToDataUrl(src);
  return { ...img, src: dataUrl };
};

/**
 * @description Clona `document` y resuelve URLs de imágenes a data URLs para el pipeline PDF.
 * Antepone cabecera `fondo_cabecera.png` del bucket salvo `skipDefaultHeaderBanner` o env `HTML_PDF_SKIP_DEFAULT_HEADER_BANNER=1`.
 * Antepone assets budget (`fondo_1` → `pageBackground1`, fondo continuo ítems+pie pág. 1; mochilas, SERNATUR, **logo_giras** en `header`, iconos de ítems, etc.) salvo `skipDefaultBudgetAssets` o env `HTML_PDF_SKIP_DEFAULT_BUDGET_ASSETS=1`. Con budget activo, las imágenes del cliente con `placement: header` se omiten.
 * @param {object} document
 * @returns {Promise<object>}
 */
export const resolveDocumentImageSources = async (document) => {
  const skipBanner =
    document.skipDefaultHeaderBanner === true || process.env.HTML_PDF_SKIP_DEFAULT_HEADER_BANNER === '1';
  const skipBudget =
    document.skipDefaultBudgetAssets === true || process.env.HTML_PDF_SKIP_DEFAULT_BUDGET_ASSETS === '1';
  const base = Array.isArray(document.images) ? [...document.images] : [];
  /** Con assets budget, el logo de cabecera siempre es `logo_giras.png` (se ignoran imágenes `header` del cliente). */
  const mergeBase = !skipBudget ? base.filter((img) => !img || img.placement !== 'header') : base;
  const withBanner = skipBanner
    ? mergeBase
    : [
        {
          src: getDefaultHeaderBannerUrl(),
          alt: '',
          placement: 'headerBanner',
          widthPx: null,
        },
        ...mergeBase,
      ];

  const budgetExtras = [];
  if (!skipBudget) {
    for (const entry of BUDGET_LAYOUT_DEFAULTS) {
      const { objectKey, placement, widthPx: wPx } = entry;
      if (placement === 'header') {
        budgetExtras.push({
          src: getBudgetAssetUrl(objectKey),
          alt: 'Giras Indómito',
          placement: 'header',
          widthPx: wPx != null && Number.isFinite(wPx) ? wPx : 88,
        });
        continue;
      }
      if (!base.some((img) => img && img.placement === placement)) {
        budgetExtras.push({
          src: getBudgetAssetUrl(objectKey),
          alt: '',
          placement,
          widthPx: wPx ?? null,
        });
      }
    }
    for (const { objectKey, placement } of BROCHURE_ITEM_ICON_DEFAULTS) {
      if (!base.some((img) => img && img.placement === placement)) {
        budgetExtras.push({
          src: getBudgetAssetUrl(objectKey),
          alt: '',
          placement,
          widthPx: null,
        });
      }
    }
    for (const { objectKey, placement } of PAGE2_SIDEBAR_DEFAULTS) {
      if (!base.some((img) => img && img.placement === placement)) {
        budgetExtras.push({
          src: getBudgetAssetUrl(objectKey),
          alt: '',
          placement,
          widthPx: null,
        });
      }
    }
  }

  const merged = [...budgetExtras, ...withBanner];
  const resolveHttpToDataUrl = createHttpImageDataUrlResolver();
  const resolvedImages = await Promise.all(merged.map((img) => resolveImageEntry(img, resolveHttpToDataUrl)));
  let next = { ...document, images: resolvedImages };

  if (next.promoQr && typeof next.promoQr.src === 'string') {
    const s = next.promoQr.src.trim();
    if (s.startsWith('http://') || s.startsWith('https://')) {
      next = {
        ...next,
        promoQr: { ...next.promoQr, src: await resolveHttpToDataUrl(s) },
      };
    }
  }

  return next;
};
