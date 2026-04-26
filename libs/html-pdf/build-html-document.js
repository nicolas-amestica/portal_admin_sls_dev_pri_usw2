import { HERO_ZONA_SALIDA_PREFIX } from './build-hero-badge.js';
import { BROCHURE_ITEM_ICONS } from './brochure-item-icons.js';
import { escapeHtml, formatDetailAsHtml } from './escape-html.js';
import { FOOTER_SOCIAL_SVG } from './footer-social-icons.js';
import { buildPaymentMethodsSectionHtml } from './payment-methods-hardcoded.js';
import { getBudgetAssetUrl } from './resolve-document-image-urls.js';
import { SCOPE_THEMES } from './scopes.js';

/**
 * Definición fija de los 6 bloques (etiqueta + clave).
 */
const ITEM_DEFINITIONS = [
  { key: 'transporte', label: 'Transporte' },
  { key: 'alimentacion', label: 'Alimentación' },
  { key: 'alojamiento', label: 'Alojamiento' },
  { key: 'seguridad', label: 'Seguridad' },
  { key: 'beneficiosExclusivos', label: 'Beneficios exclusivos' },
  { key: 'staff', label: 'Staff' },
];

/** Filas del brochure: [izquierda, derecha]; misma fila comparte altura entre columnas. */
const ITEM_ROW_PAIRS = [
  ['transporte', 'alimentacion'],
  ['alojamiento', 'seguridad'],
  ['beneficiosExclusivos', 'staff'],
];

/** Placement en `document.images` tras resolve (PNG por defecto desde bucket). */
const BROCHURE_ITEM_ICON_PLACEMENT_BY_KEY = {
  transporte: 'brochureItemTransporte',
  alimentacion: 'brochureItemAlimentacion',
  alojamiento: 'brochureItemAlojamiento',
  seguridad: 'brochureItemSeguridad',
  beneficiosExclusivos: 'brochureItemBeneficiosExclusivos',
  staff: 'brochureItemStaff',
};

/** Galería columna derecha página 2 (orden: chocolateria, motos, bowling, lago). */
const PAGE2_SIDEBAR_PLACEMENTS = ['page2Sidebar1', 'page2Sidebar2', 'page2Sidebar3', 'page2Sidebar4'];

/** Misma clave que default `pageBackground1` (contenido bajo listón hero). */
const FONDO_1_OBJECT_KEY = 'assets/budget/fondo_1.png';
const VINETA_VERDE_OBJECT_KEY = 'assets/budget/vineta_verde.png';

const BROCHURE_LIME = '#d4e157';
const BROCHURE_LIME_DEEP = '#c5d84a';
const BROCHURE_BAR = '#424242';
const BROCHURE_BODY_BG = '#e4e4e4';

const LABEL_BY_KEY = Object.fromEntries(ITEM_DEFINITIONS.map((d) => [d.key, d.label]));

/**
 * @typedef {Object} HtmlDocumentItems
 * @property {string[]} transporte
 * @property {string[]} alimentacion
 * @property {string[]} alojamiento
 * @property {string[]} seguridad
 * @property {string[]} beneficiosExclusivos
 * @property {string[]} staff
 */

/**
 * @typedef {{ day: number, text: string }} ItineraryDay
 *
 * @typedef {Object} HtmlDocumentPayload
 * @property {string} title
 * @property {string} zonaSalida — zona mostrada tras el prefijo fijo «SALIENDO DESDE »
 * @property {number} dias
 * @property {number} noches
 * @property {number} diasAbordo
 * @property {string} heroBadge — pastilla generada (días / noches / a bordo)
 * @property {string} [departureLocation] — opcional; ya no se muestra en el brochure
 * @property {HtmlDocumentItems} items
 * @property {string[]} panoramas
 * @property {ItineraryDay[]} itinerario
 * @property {{ rangoPasajeros: string, cuposDisponibles: number, valorPorPersona: number, valorPorPersonaLight: number }[]} valores
 * @property {{ instagram: string, facebook: string, website: string, whatsapp: string }} footer
 * @property {{ src: string, alt: string, placement: string, widthPx: number | null }[]} [images]
 * @property {boolean} [skipDefaultHeaderBanner]
 * @property {boolean} [skipDefaultBudgetAssets]
 * @property {{ src: string, caption?: string } | null} [promoQr] — QR esquina inferior primera página
 * Imágenes con placement internos (inyectados en resolve): pageBackground1 (fondo `fondo_1` detrás de cabecera en hero + ítems + pie pág. 1), headerBanner (`fondo_cabecera` encima de `fondo_1` en hero), headerListon (`liston.png` sobre la cabecera, borde inferior), valoresPaymentBackground, brochurePageFooter (mochilas pie pág. 1), brochureSernaturLogo, pageBackground2 (fondo pág. 2), page2SectionVineta (`vineta_verde.png` títulos Panoramas/Itinerario), page2Sidebar1–4 (columna imágenes), webpayLogo, paymentMethodArrow (flecha tabla métodos de pago), brochureItem*.
 */

/**
 * @description Escapa comillas y barras invertidas para usar URL dentro de `url("...")` en CSS.
 * @param {string} src
 * @returns {string}
 */
const escapeCssUrl = (src) => String(src).replace(/\\/g, '\\\\').replace(/"/g, '\\"');

/**
 * @description Tamaño de fuente del título hero (pt) según cantidad de caracteres (puntos de código, tras trim).
 * Umbrales calibrados para cabecera brochure (~74% ancho columna izquierda).
 * @param {number} charCount
 * @returns {number}
 */
const resolveHeroTitleFontSizePt = (charCount) => {
  const n = Number(charCount);
  const len = Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
  if (len <= 22) return 55;
  if (len <= 34) return 48;
  if (len <= 46) return 40;
  if (len <= 58) return 34;
  if (len <= 72) return 28;
  return 24;
};

/**
 * @description Primer `src` de imagen con placement headerBanner (fondo hero).
 * @param {HtmlDocumentPayload} doc
 * @returns {string}
 */
const getHeaderBannerSrc = (doc) => {
  const found = (doc.images || []).find((i) => i.placement === 'headerBanner');
  return found && found.src ? found.src : '';
};

/**
 * @description Primer `src` resuelto (p.ej. data URL) para un placement concreto.
 * @param {HtmlDocumentPayload} doc
 * @param {string} placement
 * @returns {string}
 */
const getFirstImageSrcByPlacement = (doc, placement) => {
  const found = (doc.images || []).find((i) => i.placement === placement);
  return found?.src ? String(found.src) : '';
};

/**
 * @description Genera etiqueta img para logos laterales (placement header).
 * @param {{ src: string, alt: string, widthPx: number | null }} img
 * @returns {string}
 */
const renderHeaderLogoTag = (img) => {
  const w =
    img.widthPx != null && Number.isFinite(img.widthPx)
      ? Math.min(200, Math.max(40, img.widthPx))
      : 160;
  return `<img class="hero-logo-img" src="${img.src}" alt="${escapeHtml(img.alt)}" width="${w}" style="width:${w}px;height:auto;display:block;border-radius:10px;" />`;
};

/**
 * @description HTML de imágenes en placement dado (excepto headerBanner: va al fondo CSS del hero, encima de `pageBackground1`).
 * @param {HtmlDocumentPayload} doc
 * @param {string} placement
 * @param {string} extraClass
 * @returns {string}
 */
const renderImagesForPlacement = (doc, placement, extraClass = '') => {
  const list = (doc.images || []).filter((i) => i.placement === placement);
  if (list.length === 0) return '';
  const inner = list.map((img) => renderHeaderLogoTag(img)).join('');
  return `<div class="${extraClass}" role="presentation">${inner}</div>`;
};

/**
 * @description Lista con viñetas tipo chevron `>`.
 * @param {string[]} lines
 * @returns {string}
 */
const buildBrochureChevronList = (lines) =>
  (lines || [])
    .map(
      (line) =>
        `<li class="brochure-li"><span class="brochure-chevron" aria-hidden="true">&gt;</span><span class="brochure-li-text">${formatDetailAsHtml(line)}</span></li>`,
    )
    .join('');

/**
 * @description Un bloque de categoría (barra oscura + lista).
 * @param {string} key
 * @param {HtmlDocumentPayload} document
 * @returns {string}
 */
const buildBrochureItemBlock = (key, document) => {
  const label = LABEL_BY_KEY[key] || key;
  const lines = document.items[key];
  const placement = BROCHURE_ITEM_ICON_PLACEMENT_BY_KEY[key];
  const iconSrc = placement ? getFirstImageSrcByPlacement(document, placement) : '';
  const iconHtml = iconSrc
    ? `<img class="brochure-item-head-icon-img" src="${iconSrc}" alt="" width="24" height="24" />`
    : BROCHURE_ITEM_ICONS[key] || '';
  const listInner = buildBrochureChevronList(lines);
  return `
      <section class="brochure-item">
        <div class="brochure-item-head">
          <span class="brochure-item-head-label">${escapeHtml(label)}</span>
          <span class="brochure-item-head-icon" aria-hidden="true">${iconHtml}</span>
        </div>
        <ul class="brochure-item-list">${listInner}</ul>
      </section>`;
};

const HERO_TEAR_SVG = `<svg class="hero-tear-svg" viewBox="0 0 1200 28" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path fill="${BROCHURE_LIME_DEEP}" d="M0,8 C80,28 160,0 240,14 C320,28 400,0 480,14 C560,28 640,0 720,14 C800,28 880,0 960,14 C1040,28 1120,0 1200,10 L1200,28 L0,28 Z"/></svg>`;

/**
 * @description Construye el HTML completo del PDF a partir del scope y el documento.
 * @param {string} scope - CTM | CTT | DBA | DBR (ya normalizado)
 * @param {HtmlDocumentPayload} document
 * @param {{ isPreview?: boolean }} [options]
 * @returns {string}
 */
export const buildHtmlDocument = (scope, document, options = {}) => {
  const { isPreview = false } = options;
  const theme = SCOPE_THEMES[scope] || SCOPE_THEMES.CTM;

  const titleTrimmed = String(document.title ?? '').trim();
  const title = escapeHtml(titleTrimmed);
  const heroTitleCharCount = [...titleTrimmed].length || 1;
  const heroTitleFontSizePt = resolveHeroTitleFontSizePt(heroTitleCharCount);
  const heroTitleFontAttr = ` style="font-size: ${heroTitleFontSizePt}pt"`;
  const zonaSalida = escapeHtml(String(document.zonaSalida ?? '').trim());
  const heroBadgeText = String(document.heroBadge ?? '').trim();
  const heroBadgeHtml = heroBadgeText
    ? `<div class="hero-badge">${escapeHtml(heroBadgeText)}</div>`
    : '';

  const page1BgSrc = getFirstImageSrcByPlacement(document, 'pageBackground1');
  /** `fondo_1` detrás de cabecera en hero + bajo ítems y pie pág. 1 (resuelto o URL bucket). */
  const fondo1BelowHeroSrc = page1BgSrc || getBudgetAssetUrl(FONDO_1_OBJECT_KEY);
  const fondo1UrlEscaped = escapeCssUrl(fondo1BelowHeroSrc);

  const bannerSrc = getHeaderBannerSrc(document);
  const heroDualBgClass = bannerSrc ? ' hero--dual-bg' : '';
  const heroBgStyle = bannerSrc
    ? `background-image:url("${escapeCssUrl(bannerSrc)}"),linear-gradient(rgba(255,255,255,0.58),rgba(255,255,255,0.58)),url("${fondo1UrlEscaped}");background-color:${BROCHURE_BAR};`
    : `background-image:url("${fondo1UrlEscaped}");background-color:${BROCHURE_BAR};`;
  const brochureFondo1StackStyle = `background-image:url(&quot;${escapeCssUrl(fondo1BelowHeroSrc)}&quot;);background-size:cover;background-position:center top;background-repeat:no-repeat;background-color:transparent;`;
  /** Inline en la sección de ítems: evita que el `background-color` del CSS gris quede encima de `fondo_1` en Chromium/PDF. */
  const brochureItemsBodyFondo1Attr = ` style="${brochureFondo1StackStyle}"`;

  const page2BgSrc = getFirstImageSrcByPlacement(document, 'pageBackground2');
  const page2VinetaSrc =
    getFirstImageSrcByPlacement(document, 'page2SectionVineta') || getBudgetAssetUrl(VINETA_VERDE_OBJECT_KEY);
  const page2TitleVinetaClass = ' page2-section-title--vineta';
  const page2TitleVinetaStyleAttr = ` style="background-image:url(&quot;${escapeCssUrl(page2VinetaSrc)}&quot;);background-repeat:no-repeat;background-position:left center;background-size:auto 100%;"`;
  const mainStyleAttr = page2BgSrc
    ? ` style="background-image:url(&quot;${escapeCssUrl(page2BgSrc)}&quot;);background-size:cover;background-position:center center;background-repeat:no-repeat;"`
    : '';

  const valoresPaymentBgSrc = getFirstImageSrcByPlacement(document, 'valoresPaymentBackground');
  const valoresPaymentShellStyle = valoresPaymentBgSrc
    ? `background-image:url(&quot;${escapeCssUrl(valoresPaymentBgSrc)}&quot;);background-size:cover;background-position:top center;background-repeat:no-repeat;background-color:transparent;`
    : `background-color:${BROCHURE_BAR};`;

  const webpayLogoSrc = getFirstImageSrcByPlacement(document, 'webpayLogo');
  const paymentArrowSrc = getFirstImageSrcByPlacement(document, 'paymentMethodArrow');
  const paymentMethodsSectionHtml = buildPaymentMethodsSectionHtml(webpayLogoSrc, paymentArrowSrc);

  const brochureFooterSrc = getFirstImageSrcByPlacement(document, 'brochurePageFooter');
  const sernaturLogoSrc = getFirstImageSrcByPlacement(document, 'brochureSernaturLogo');
  /** Un solo bloque con `fondo_1` bajo el listón (ítems + mochilas), sin franja respecto al pie. */
  const fondo1StackOpen = `<div class="brochure-fondo1-stack" style="${brochureFondo1StackStyle}">`;
  const fondo1StackClose = '</div>';

  let brochureFooterHtml = '';
  if (brochureFooterSrc) {
    const sernaturOverlay = sernaturLogoSrc
      ? `<img class="brochure-sernatur-logo" src="${sernaturLogoSrc}" alt="" />`
      : '';
    brochureFooterHtml = `<div class="brochure-page-footer-decor" role="presentation"><div class="brochure-footer-composite"><img class="brochure-mochilas-img" src="${brochureFooterSrc}" alt="" />${sernaturOverlay}</div></div>`;
  } else if (sernaturLogoSrc) {
    brochureFooterHtml = `<div class="brochure-page-footer-decor" role="presentation"><div class="brochure-footer-composite"><img class="brochure-sernatur-logo brochure-sernatur-logo--solo" src="${sernaturLogoSrc}" alt="" /></div></div>`;
  }

  const headerLogosHtml = renderImagesForPlacement(document, 'header', 'hero-logos-wrap');

  const headerListonSrc = getFirstImageSrcByPlacement(document, 'headerListon');
  const heroListonOverlayHtml = headerListonSrc
    ? `<div class="hero-liston-overlay" role="presentation"><img class="hero-liston-overlay-img" src="${escapeHtml(headerListonSrc)}" alt="" /></div>`
    : '';
  /** Si no hay listón, SVG entre hero y `fondo_1`; con listón el PNG va dentro del hero (evita doble separador). */
  const heroDividerHtml = headerListonSrc
    ? ''
    : `<div class="hero-liston-stack"><div class="hero-liston-wrap" role="presentation"><div class="hero-tear-wrap">${HERO_TEAR_SVG}</div></div></div>`;

  const itemsTwoColRowsHtml = ITEM_ROW_PAIRS.map(
    ([leftKey, rightKey]) => `
        <div class="items-row">
          <div class="items-row-cell">${buildBrochureItemBlock(leftKey, document)}</div>
          <div class="items-row-vsep" aria-hidden="true"></div>
          <div class="items-row-cell">${buildBrochureItemBlock(rightKey, document)}</div>
        </div>`,
  ).join('');

  const promoQr = document.promoQr;
  const promoQrHtml =
    promoQr && promoQr.src
      ? `<div class="brochure-promo-qr">
      <img class="brochure-promo-qr-img" src="${promoQr.src}" alt="" />
      <p class="brochure-promo-qr-caption">${escapeHtml(promoQr.caption || '')}</p>
    </div>`
      : '';

  const afterDepartureImagesHtml = renderImagesForPlacement(
    document,
    'afterDeparture',
    'inject-images-block inject-images-block--after-departure',
  );
  const beforePanoramasImagesHtml = renderImagesForPlacement(
    document,
    'beforePanoramas',
    'inject-images-block inject-images-block--before-panoramas',
  );
  const beforeFooterImagesHtml = renderImagesForPlacement(
    document,
    'beforeFooter',
    'inject-images-block inject-images-block--before-footer',
  );

  const buildPage2PanoramaLi = (line) =>
    `<li class="page2-panorama-li"><span class="page2-pan-chevron" aria-hidden="true">&gt;</span><span class="page2-panorama-text">${formatDetailAsHtml(line)}</span></li>`;

  const panoramasArr = document.panoramas || [];
  const panMid = Math.ceil(panoramasArr.length / 2);
  const panLeft = panoramasArr.slice(0, panMid);
  const panRight = panoramasArr.slice(panMid);
  const page2PanColHtml = (arr) =>
    `<ul class="page2-panoramas-list">${arr.map(buildPage2PanoramaLi).join('')}</ul>`;
  const page2PanoramasBlockHtml =
    panoramasArr.length > 0
      ? panRight.length > 0
        ? `<div class="page2-panoramas-row"><div class="page2-panoramas-col">${page2PanColHtml(panLeft)}</div><div class="page2-panoramas-vsep" aria-hidden="true"></div><div class="page2-panoramas-col">${page2PanColHtml(panRight)}</div></div>`
        : `<div class="page2-panoramas-row"><div class="page2-panoramas-col">${page2PanColHtml(panLeft)}</div></div>`
      : '';

  const itinerarioSorted = [...(document.itinerario || [])].sort((a, b) => a.day - b.day);
  const page2ItinerarioHtml = itinerarioSorted
    .map(({ day, text }) => {
      const body = formatDetailAsHtml(text);
      return `<div class="page2-itinerary-item"><span class="page2-itinerary-chevron" aria-hidden="true">&gt;</span><p class="page2-itinerary-line"><span class="page2-itinerary-day">DÍA ${escapeHtml(String(day))}</span> <span class="page2-itinerary-body">${body}</span></p></div>`;
    })
    .join('');

  const page2SidebarHtml = (() => {
    const srcs = PAGE2_SIDEBAR_PLACEMENTS.map((p) => getFirstImageSrcByPlacement(document, p)).filter(
      Boolean,
    );
    if (srcs.length === 0) return '';
    const imgs = srcs.map((src) => `<img class="page2-sidebar-img" src="${src}" alt="" />`).join('');
    return `<aside class="page2-sidebar" aria-label="Galería">${imgs}</aside>`;
  })();

  const page2UpperColumnsClass = page2SidebarHtml
    ? 'page2-upper-columns'
    : 'page2-upper-columns page2-upper-columns--single';

  const enteroFmt = new Intl.NumberFormat('es-CL', { maximumFractionDigits: 0 });
  const moneyFmt = new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  });

  const valoresRowsHtml = (document.valores || [])
    .map(
      (row) => `
      <tr>
        <td>${escapeHtml(row.rangoPasajeros)}</td>
        <td class="valores-num">${enteroFmt.format(row.cuposDisponibles)}</td>
        <td class="valores-num">${moneyFmt.format(row.valorPorPersona)}</td>
        <td class="valores-num">${moneyFmt.format(row.valorPorPersonaLight)}</td>
      </tr>`,
    )
    .join('');

  const valoresFootnoteZeroText =
    '*Equipaje en tarifa zero incluye:\n1 bolso en mano de hasta 10kg bajo asiento.';
  const valoresFootnoteLightText =
    '*Equipaje en tarifa light incluye:\n1 bolso en mano de hasta 10kg';
  const valoresFootnoteZeroHtml = escapeHtml(valoresFootnoteZeroText).replace(/\n/g, '<br>');
  const valoresFootnoteLightHtml = escapeHtml(valoresFootnoteLightText).replace(/\n/g, '<br>');

  const valoresTableHtml = `
    <div class="valores-table-block">
    <table class="valores-table">
      <thead>
        <tr>
          <th scope="col">Pasajeros</th>
          <th scope="col">Cupos liberados</th>
          <th scope="col">Valor p/p equipaje zero</th>
          <th scope="col">Valor p/p equipaje light</th>
        </tr>
      </thead>
      <tbody>${valoresRowsHtml}</tbody>
    </table>
    <div class="valores-footnotes" role="note">
      <div class="valores-footnotes-placeholder" aria-hidden="true"></div>
      <div class="valores-footnotes-placeholder" aria-hidden="true"></div>
      <p class="valores-footnotes-note">${valoresFootnoteZeroHtml}</p>
      <p class="valores-footnotes-note">${valoresFootnoteLightHtml}</p>
    </div>
    </div>`;

  const renderFooterDisplayValue = (value) => {
    const s = String(value).trim();
    if (/^https?:\/\//i.test(s)) {
      return `<a class="footer-link" href="${escapeHtml(s)}">${escapeHtml(s)}</a>`;
    }
    return `<span class="footer-plain">${escapeHtml(s)}</span>`;
  };

  const FOOTER_ROWS = [
    { key: 'instagram', label: 'Instagram' },
    { key: 'facebook', label: 'Facebook' },
    { key: 'website', label: 'Página web' },
    { key: 'whatsapp', label: 'WhatsApp' },
  ];

  const footerInnerHtml = `<div class="footer-social-row">${FOOTER_ROWS.map(({ key, label }) => {
    const val = document.footer[key];
    const iconSvg = FOOTER_SOCIAL_SVG[key] || '';
    return `<div class="footer-social-item" title="${escapeHtml(label)}"><span class="footer-social-icon" aria-hidden="true">${iconSvg}</span><span class="footer-social-text">${renderFooterDisplayValue(val)}</span></div>`;
  }).join('')}</div>`;

  const watermark = isPreview ? '<div class="watermark">BORRADOR</div>' : '';

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@600;700;800&display=swap" rel="stylesheet" />
  <style>
    * { box-sizing: border-box; }
    @page {
      margin: 0;
      size: A4 portrait;
    }
    body {
      font-family: 'Montserrat', 'Segoe UI', system-ui, sans-serif;
      color: #2d2d2d;
      font-size: 10.5pt;
      line-height: 1.4;
      margin: 0;
      padding: 0;
      background: #fff;
    }
    .page {
      padding: 0;
    }
    .brochure-first-page {
      page-break-after: always;
      position: relative;
      box-sizing: border-box;
      min-height: 297mm;
      display: flex;
      flex-direction: column;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .hero {
      position: relative;
      flex-shrink: 0;
      ${heroBgStyle}
      background-size: cover;
      background-position: center center;
      background-repeat: no-repeat;
    }
    .hero.hero--dual-bg {
      background-size: contain, cover, cover;
      background-position: center calc(50% - 30px), center center, center center;
      background-repeat: no-repeat, no-repeat, no-repeat;
    }
    /* Velo sobre el fondo del hero (legibilidad del texto); desactivado para ver cabecera sin oscurecer.
    .hero-scrim {
      position: absolute;
      inset: 0;
      z-index: 1;
      background: linear-gradient(90deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.15) 55%, rgba(0,0,0,0.25) 100%);
      pointer-events: none;
    }
    */
    .hero-liston-overlay {
      position: absolute;
      left: 0;
      right: 0;
      bottom: 40px;
      z-index: 2;
      line-height: 0;
      pointer-events: none;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .hero-liston-overlay-img {
      display: block;
      width: 100%;
      height: auto;
      margin: 0;
      padding: 0;
      vertical-align: top;
    }
    .hero-content {
      position: relative;
      z-index: 3;
      display: flex;
      flex-direction: row;
      justify-content: space-between;
      align-items: flex-start;
      gap: 0px;
      padding: 24px 0 0px 0;
      min-height: 370px;
    }
    .hero-left { flex: 1; min-width: 0; max-width: 74%; padding: 0 10px 0 10px; }
    .hero-title {
      margin: 0 0 8px 0;
      font-size: 55pt;
      font-weight: 800;
      line-height: 1.05;
      color: ${BROCHURE_LIME};
      text-transform: uppercase;
      letter-spacing: 0.02em;
      text-shadow: 0 2px 8px rgba(0,0,0,0.45);
    }
    .hero-badge {
      display: inline-block;
      background: ${BROCHURE_BAR};
      color: #fff;
      font-size: 8pt;
      font-weight: 700;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      padding: 6px 12px;
      border: 1px solid ${BROCHURE_LIME};
      border-radius: 999px;
      margin-bottom: 8px;
    }
    .hero-tagline {
      margin: 0;
      font-size: 9.5pt;
      font-weight: 700;
      color: ${BROCHURE_LIME};
      text-transform: uppercase;
      letter-spacing: 0.03em;
      text-shadow: 0 1px 4px rgba(0,0,0,0.5);
    }
    .hero-logos-wrap {
      flex-shrink: 0;
      align-self: flex-start;
      margin-top: -24px;
      padding-right: 10px;
    }
    .hero-liston-stack {
      position: relative;
      flex-shrink: 0;
      width: 100%;
      margin: 0;
      padding: 0;
      line-height: 0;
      z-index: 2;
    }
    .hero-liston-wrap {
      position: relative;
      z-index: 1;
      display: block;
      width: 100%;
      margin: 0;
      padding: 0;
      line-height: 0;
    }
    .hero-liston-wrap .hero-tear-wrap {
      position: relative;
      z-index: 1;
      line-height: 0;
      margin: 0;
    }
    .hero-tear-svg { display: block; width: 100%; height: 20px; }
    .brochure-fondo1-stack {
      width: 100%;
      flex: 1 1 auto;
      min-height: 0;
      display: flex;
      flex-direction: column;
      margin-top: 0;
      position: relative;
      z-index: 1;
      background-color: transparent;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .brochure-first-page > .brochure-items-body {
      flex: 1 1 auto;
      min-height: 0;
    }
    .brochure-fondo1-stack > .brochure-items-body {
      flex: 1 1 auto;
      min-height: 0;
    }
    .brochure-items-body {
      padding: 10px 0 12px 0;
      position: relative;
      z-index: 1;
    }
    .brochure-items-body:not(.brochure-items-body--in-fondo1-stack) {
      background: rgba(228, 228, 228, 0.82);
    }
    .brochure-items-body--in-fondo1-stack {
      margin-top: -35px;
      padding-bottom: 0;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .brochure-items-body--in-fondo1-stack::before {
      content: '';
      position: absolute;
      top: 0;
      bottom: 12px;
      left: 50%;
      transform: translateX(-50%);
      width: 2px;
      background: repeating-linear-gradient(
        to bottom,
        #b0b0b0 0px,
        #b0b0b0 26px,
        transparent 26px,
        transparent 40px
      );
      pointer-events: none;
      z-index: 3;
    }
    .brochure-page-footer-decor {
      position: relative;
      z-index: 1;
      width: 100%;
      margin: 0;
      margin-top: auto;
      flex-shrink: 0;
      padding: 0;
      line-height: 0;
      text-align: center;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .brochure-footer-composite {
      position: relative;
      display: block;
      width: 100%;
      max-width: none;
      margin: 0;
      line-height: 0;
    }
    .brochure-mochilas-img {
      display: block;
      width: 100%;
      max-width: none;
      height: auto;
      margin: 0;
      vertical-align: top;
    }
    .brochure-sernatur-logo {
      position: absolute;
      left: 50%;
      bottom: 33%;
      transform: translateX(-50%);
      width: 26%;
      max-width: 150px;
      min-width: 72px;
      height: auto;
      object-fit: contain;
      z-index: 2;
      pointer-events: none;
    }
    .brochure-sernatur-logo--solo {
      position: relative;
      left: auto;
      bottom: auto;
      transform: none;
      display: block;
      margin: 8px auto 0;
      width: 130px;
      max-width: 42%;
      z-index: auto;
    }
    .items-two-col {
      display: flex;
      flex-direction: column;
      width: 100%;
    }
    .items-row {
      display: flex;
      flex-direction: row;
      align-items: stretch;
      width: 100%;
      gap: 0;
    }
    .items-row:not(:last-child) {
      margin-bottom: 11px;
    }
    .items-row-vsep {
      display: none;
    }
    .items-row-cell {
      flex: 1 1 0;
      min-width: 0;
      padding: 0 8px;
      display: flex;
      flex-direction: column;
    }
    .items-row .brochure-item {
      flex: 1 1 auto;
      display: flex;
      flex-direction: column;
      width: 100%;
      min-height: 100%;
      margin-bottom: 0;
    }
    .items-row .brochure-item-list {
      flex: 1 1 auto;
    }
    .brochure-item {
      margin-bottom: 16px;
    }
    .brochure-item-head {
      position: relative;
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: center;
      gap: 8px;
      background: ${BROCHURE_BAR};
      color: #fff;
      padding: 7px 15px;
      border-radius: 20px 20px 20px 20px;
      margin: 0 25px 25px;
      border: none;
      outline: none;
      box-shadow: none;
    }
    .brochure-item-head-label {
      text-align: center;
      font-size: 9pt;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .brochure-item-head-icon {
      position: absolute;
      right: 8px;
      top: 50%;
      transform: translateY(-50%);
      color: #fff;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .brochure-item-head-icon-img {
      display: block;
      width: 24px;
      height: 24px;
      object-fit: contain;
    }
    .brochure-item-icon-svg { display: block; }
    .brochure-item-list {
      list-style: none;
      margin: 0;
      padding: 0 4px 0 2px;
    }
    .brochure-li {
      display: flex;
      flex-direction: row;
      align-items: flex-start;
      gap: 6px;
      margin-bottom: 4px;
      margin-left: 25px;
      font-size: 7.5pt;
      color: #333;
      line-height: 1.38;
    }
    .brochure-chevron {
      flex-shrink: 0;
      color: ${BROCHURE_LIME_DEEP};
      font-weight: 800;
      font-size: 10pt;
      line-height: 1.3;
    }
    .brochure-li-text { flex: 1; min-width: 0; }
    .brochure-promo-qr {
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: center;
      flex-wrap: wrap;
      gap: 8px;
      width: 50%;
      margin: 10px 0 0 50%;
      padding: 0 8px;
      box-sizing: border-box;
      border: none;
      outline: none;
    }
    .brochure-promo-qr-img {
      width: 44px;
      height: 44px;
      object-fit: contain;
      flex-shrink: 0;
      border: none;
      outline: none;
      box-shadow: none;
    }
    .brochure-promo-qr-caption {
      margin: 0;
      max-width: 200px;
      font-size: 7.8pt;
      font-weight: 600;
      color: #444;
      line-height: 1.3;
      text-align: center;
    }
    .inject-images-block { margin: 14px 0; }
    .brochure-items-body--in-fondo1-stack .brochure-items-body__inner > :last-child {
      margin-bottom: 0;
    }
    .inject-images-block--after-departure { text-align: left; }
    .inject-images-block--before-panoramas,
    .inject-images-block--before-footer { text-align: center; }
    .doc-main {
      margin: 0;
      padding: 0;
    }
    .doc-main--page2-bg {
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .second-section {
      page-break-before: always;
    }
    .second-section--page2-upper {
      margin-top: 0;
      padding: 20px 16px 18px;
      border-top: none;
      background: transparent;
    }
    .page2-upper-columns {
      display: flex;
      flex-direction: row;
      align-items: flex-start;
      gap: 14px;
    }
    .page2-upper-columns--single {
      display: block;
    }
    .page2-upper-main {
      flex: 1;
      min-width: 0;
    }
    .page2-sidebar {
      flex: 0 0 28%;
      max-width: 200px;
      min-width: 112px;
      display: flex;
      flex-direction: column;
      gap: 0;
      line-height: 0;
    }
    .page2-sidebar-img {
      display: block;
      width: 100%;
      height: auto;
      object-fit: cover;
      border-radius: 0;
    }
    .page2-section-title {
      box-sizing: border-box;
      margin: 0 0 10px 0;
      padding: 7px 14px 7px 0;
      font-size: 13pt;
      font-weight: 800;
      color: #111;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }
    .page2-section-title:not(.page2-section-title--vineta) {
      width: 100%;
      background: ${BROCHURE_LIME};
      border-radius: 0 10px 10px 0;
    }
    .page2-section-title--vineta {
      display: inline-block;
      width: auto;
      max-width: 92%;
      min-height: 1.85em;
      margin-left: 0;
      padding: 8px 24px 8px 24px;
      text-align: center;
      background-color: transparent;
      border-top-right-radius: 50px;
      border-bottom-right-radius: 50px;
      overflow: hidden;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      box-decoration-break: clone;
      -webkit-box-decoration-break: clone;
    }
    .page2-section-title--spaced {
      margin-top: 18px;
    }
    .page2-panoramas-row {
      display: flex;
      flex-direction: row;
      align-items: stretch;
      margin: 0 0 4px;
    }
    .page2-panoramas-col {
      flex: 1;
      min-width: 0;
    }
    .page2-panoramas-vsep {
      flex: 0 0 auto;
      width: 2px;
      margin: 0 11px;
      border-right: none;
      background: repeating-linear-gradient(
        to bottom,
        #b8b8b8 0px,
        #b8b8b8 22px,
        transparent 22px,
        transparent 34px
      );
      align-self: stretch;
      min-height: 2.5em;
    }
    .page2-panoramas-list {
      margin: 0;
      padding: 0;
      list-style: none;
    }
    .page2-panorama-li {
      display: flex;
      flex-direction: row;
      align-items: flex-start;
      gap: 6px;
      margin: 0 0 5px;
      font-size: 10.5pt;
      color: #1a1a1a;
      line-height: 1.45;
    }
    .page2-pan-chevron {
      flex-shrink: 0;
      color: ${BROCHURE_LIME_DEEP};
      font-weight: 800;
      font-size: 10.5pt;
      line-height: 1.45;
    }
    .page2-panorama-text {
      flex: 1;
      min-width: 0;
    }
    .page2-itinerary-list {
      margin: 0;
      padding: 0;
    }
    .page2-itinerary-item {
      display: flex;
      flex-direction: row;
      align-items: flex-start;
      gap: 6px;
      margin: 0 0 10px;
    }
    .page2-itinerary-chevron {
      flex-shrink: 0;
      color: ${BROCHURE_LIME_DEEP};
      font-weight: 800;
      font-size: 10.5pt;
      line-height: 1.5;
    }
    .page2-itinerary-line {
      margin: 0;
      flex: 1;
      min-width: 0;
      font-size: 9 pt;
      color: #1a1a1a;
      line-height: 1.5;
    }
    .page2-itinerary-day {
      font-weight: 800;
      color: #111;
    }
    .page2-itinerary-body {
      font-weight: 400;
    }
    .page2-itinerary-body strong {
      font-weight: 700;
      color: #111;
    }
    .page2-valores-payment-shell {
      position: relative;
      padding: 26px 0 32px;
      margin: 0;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .page2-valores-block {
      margin: 12px 36px 0;
    }
    .page2-valores-payment-shell .section-title {
      color: #fff;
      text-align: center;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      font-weight: 400;
      font-size: 11pt;
      border-bottom: none;
    }
    .page2-valores-payment-shell .section-title--spaced {
      margin-top: 26px;
    }
    .page2-valores-payment-shell .valores-table-block {
      margin-top: 10px;
    }
    .page2-valores-payment-shell .valores-table-block .valores-table {
      margin-top: 0;
    }
    .page2-valores-payment-shell .valores-footnotes {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      margin-top: 8px;
      font-size: 7pt;
      line-height: 1.38;
      color: rgba(255, 255, 255, 0.78);
      text-align: left;
    }
    .page2-valores-payment-shell .valores-footnotes-placeholder {
      min-width: 0;
    }
    .page2-valores-payment-shell .valores-footnotes-note {
      margin: 0;
      padding: 2px 10px 0;
      font-weight: 400;
    }
    .page2-valores-payment-shell .valores-table {
      table-layout: fixed;
      font-size: 9pt;
    }
    .page2-valores-payment-shell .valores-table th,
    .page2-valores-payment-shell .valores-table td {
      border: 1px solid ${BROCHURE_LIME};
      color: #fff;
      background: transparent;
      padding: 6px 8px;
    }
    .page2-valores-payment-shell .valores-table th {
      background: transparent;
      color: #fff;
      font-weight: 400;
    }
    .page2-valores-payment-shell .payment-methods-section {
      margin: 20px 56px 0;
    }
    .page2-valores-payment-shell .payment-methods-section .section-title--spaced {
      margin-top: 0;
    }
    .page2-valores-payment-shell .payment-methods-block {
      margin-top: 10px;
    }
    .page2-valores-payment-shell .payment-methods-table {
      margin-top: 0;
      font-size: 9pt;
    }
    .page2-valores-payment-shell .payment-methods-table .payment-method-cell:first-child {
      border-left: none;
    }
    .page2-valores-payment-shell .payment-methods-table .payment-method-cell:last-child {
      border-right: none;
    }
    .page2-valores-payment-shell .payment-method-cell {
      border: 1px solid ${BROCHURE_LIME};
      color: #fff;
      background: transparent;
      vertical-align: middle;
      font-weight: 400;
    }
    .page2-valores-payment-shell .payment-method-cell--cash-promo {
      background: ${BROCHURE_LIME};
      color: #2d2d2d;
      text-align: center;
      padding: 10px 14px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .page2-valores-payment-shell .payment-method-cell--cash-promo .payment-method-cell-inner--cash-promo {
      justify-content: center;
      width: 100%;
    }
    .page2-valores-payment-shell .payment-method-cell--cash-promo .payment-method-arrow-img--cash-promo-table-tone {
      filter: grayscale(1) brightness(0.42) contrast(1.08);
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .page2-valores-payment-shell .payment-method-cell--cash-promo .payment-method-arrow-fallback--cash-promo-table-tone {
      color: ${BROCHURE_BAR};
      font-weight: 800;
      font-size: 11pt;
      line-height: 1;
    }
    .page2-valores-payment-shell .payment-method-cell--cash-promo .payment-method-label strong {
      font-weight: 800;
      color: #111;
    }
    .page2-valores-payment-shell .payment-method-cell--full {
      border-left: none;
      border-right: none;
      color: #fff;
      background: transparent;
      font-weight: 400;
    }
    .page2-valores-payment-shell .payment-method-cell-inner {
      display: inline-flex;
      flex-direction: row;
      align-items: center;
      justify-content: center;
      gap: 6px;
      text-align: left;
    }
    .page2-valores-payment-shell .payment-method-arrow-img {
      flex-shrink: 0;
      width: 11px;
      height: auto;
      max-height: 14px;
      object-fit: contain;
      display: block;
    }
    .page2-valores-payment-shell .payment-method-arrow-fallback {
      flex-shrink: 0;
      color: ${BROCHURE_LIME_DEEP};
      font-weight: 800;
      font-size: 11pt;
      line-height: 1;
    }
    .page2-valores-payment-shell .payment-method-label {
      font-weight: 400;
    }
    .page2-valores-payment-shell .payment-method-label strong {
      font-weight: 600;
    }
    .page2-valores-payment-shell .webpay-logo-wrap {
      margin-top: 22px;
    }
    .page2-valores-payment-shell .webpay-logo-img {
      max-width: 165px;
      max-height: 44px;
    }
    .page2-valores-payment-shell .webpay-badge {
      box-shadow: 0 1px 4px rgba(0,0,0,0.35);
    }
    .section-title {
      font-size: 13pt;
      margin: 0 0 12px;
      color: ${theme.accent};
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .section-title--spaced { margin-top: 22px; }
    .valores-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10pt;
      margin-top: 8px;
    }
    .valores-table th,
    .valores-table td {
      border: 1px solid #cbd5e0;
      padding: 8px 10px;
      vertical-align: top;
    }
    .valores-table th {
      background: ${theme.accentSoft};
      color: ${theme.accent};
      font-weight: 700;
      text-align: left;
    }
    .valores-table td.valores-num {
      text-align: right;
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
    }
    .payment-methods-block { margin-top: 4px; }
    .payment-methods-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10pt;
      margin-top: 8px;
    }
    .payment-method-cell {
      border: 1px solid #cbd5e0;
      padding: 10px 8px;
      text-align: center;
      font-weight: 600;
      color: #2d3748;
      vertical-align: middle;
      width: 33.33%;
    }
    .payment-method-cell--full {
      font-weight: 600;
      line-height: 1.4;
      padding: 12px 14px;
    }
    .payment-method-cell-inner {
      display: inline-flex;
      flex-direction: row;
      align-items: center;
      justify-content: center;
      gap: 6px;
      text-align: left;
    }
    .payment-method-arrow-img {
      flex-shrink: 0;
      width: 11px;
      height: auto;
      max-height: 14px;
      object-fit: contain;
      display: block;
    }
    .payment-method-arrow-fallback {
      flex-shrink: 0;
      color: ${BROCHURE_LIME_DEEP};
      font-weight: 800;
      font-size: 11pt;
      line-height: 1;
    }
    .payment-method-label strong {
      font-weight: 800;
    }
    .webpay-logo-wrap { margin-top: 18px; text-align: center; }
    .webpay-logo-img {
      display: block;
      margin: 0 auto;
      max-width: 165px;
      width: auto;
      height: auto;
      max-height: 44px;
      object-fit: contain;
    }
    .webpay-logo {
      display: inline-flex;
      align-items: center;
      font-family: Arial, Helvetica, sans-serif;
    }
    .webpay-badge {
      background: #e31837;
      color: #fff;
      padding: 6px 14px;
      border-radius: 4px;
      font-weight: 700;
      font-size: 14pt;
      letter-spacing: 0.08em;
    }
    .webpay-plus {
      color: #e31837;
      font-weight: 800;
      font-size: 17pt;
      margin-left: 8px;
      letter-spacing: 0.02em;
    }
    .doc-footer {
      margin-top: 28px;
      padding: 14px 0 20px;
      border-top: 2px solid ${theme.border};
      page-break-inside: avoid;
    }
    .doc-footer--page2 {
      margin-top: 7px;
      padding: 22px 16px 28px;
      border-top: none;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .footer-social-row {
      display: flex;
      flex-direction: row;
      flex-wrap: nowrap;
      align-items: center;
      justify-content: center;
      gap: 18px;
      width: 100%;
      padding: 0 24px;
    }
    .footer-social-item {
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: center;
      gap: 5px;
      min-width: 0;
      flex: 0 1 auto;
      font-size: 7.6pt;
      color: #2d3748;
      line-height: 1.25;
      text-align: center;
    }
    .footer-social-icon {
      flex-shrink: 0;
      line-height: 0;
    }
    .footer-social-icon .footer-icon-svg {
      display: block;
      width: 16px;
      height: 16px;
    }
    .footer-social-text {
      min-width: 0;
      overflow-wrap: anywhere;
      word-break: break-word;
    }
    .footer-link {
      color: ${theme.accent};
      text-decoration: underline;
      word-break: break-all;
    }
    .footer-plain { word-break: break-word; }
    .watermark {
      position: fixed;
      top: 40%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-35deg);
      font-size: 72px;
      color: rgba(0, 0, 0, 0.08);
      font-weight: 700;
      pointer-events: none;
      z-index: 1000;
      white-space: nowrap;
    }
  </style>
</head>
<body>
  <div class="page">
    ${watermark}
    <div class="brochure-first-page">
      <header class="hero${heroDualBgClass}" role="banner">
        <!-- <div class="hero-scrim"></div> velo desactivado -->
        <div class="hero-content">
          <div class="hero-left">
            <h1 class="hero-title"${heroTitleFontAttr}>${title}</h1>
            ${heroBadgeHtml}
            <p class="hero-tagline">${HERO_ZONA_SALIDA_PREFIX}${zonaSalida}</p>
          </div>
          ${headerLogosHtml}
        </div>
        ${heroListonOverlayHtml}
      </header>
      ${heroDividerHtml}
      ${fondo1StackOpen}
      <section class="brochure-items-body brochure-items-body--in-fondo1-stack"${brochureItemsBodyFondo1Attr} aria-label="Detalle del programa">
        <div class="brochure-items-body__inner">
          <div class="items-two-col">
            ${itemsTwoColRowsHtml}
          </div>
          ${promoQrHtml}
          ${afterDepartureImagesHtml}
        </div>
      </section>
      ${brochureFooterHtml}
      ${fondo1StackClose}
    </div>
    <main class="doc-main${page2BgSrc ? ' doc-main--page2-bg' : ''}"${mainStyleAttr}>
      <section class="second-section second-section--page2-upper" aria-label="Panoramas e itinerario">
        <div class="${page2UpperColumnsClass}">
          <div class="page2-upper-main">
            ${beforePanoramasImagesHtml}
            <h2 class="page2-section-title${page2TitleVinetaClass}"${page2TitleVinetaStyleAttr}>Panoramas</h2>
            ${page2PanoramasBlockHtml}
            <h2 class="page2-section-title page2-section-title--spaced${page2TitleVinetaClass}"${page2TitleVinetaStyleAttr}>Itinerario</h2>
            <div class="page2-itinerary-list">${page2ItinerarioHtml}</div>
          </div>
          ${page2SidebarHtml}
        </div>
      </section>
      <div class="page2-valores-payment-shell"${valoresPaymentShellStyle ? ` style="${valoresPaymentShellStyle}"` : ''} aria-label="Valores y medios de pago">
        <div class="page2-valores-block">
          <h2 class="section-title">VALORES POR PERSONA Y EQUIPAJE</h2>
          ${valoresTableHtml}
        </div>
        ${paymentMethodsSectionHtml}
      </div>
      ${beforeFooterImagesHtml}
      <footer class="doc-footer doc-footer--page2" style="${brochureFondo1StackStyle}" aria-label="Redes sociales y contacto">
        ${footerInnerHtml}
      </footer>
    </main>
  </div>
</body>
</html>`;
};
