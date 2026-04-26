/**
 * Sección fija: métodos de pago aceptados y marca Webpay Plus (sin datos de entrada).
 */

import { escapeHtml } from './escape-html.js';

const WEBPAY_FALLBACK_INNER = `<div class="webpay-logo webpay-logo--fallback" aria-label="Webpay Plus"><span class="webpay-badge">Webpay</span><span class="webpay-plus">Plus</span></div>`;

/**
 * @description Fila de celda: flecha (PNG o `>`) + etiqueta HTML ya segura.
 * @param {string} [arrowSrc]
 * @param {string} labelHtml
 * @returns {string}
 */
const paymentMethodCellInner = (arrowSrc, labelHtml) => {
  const src = arrowSrc && String(arrowSrc).trim();
  const arrow = src
    ? `<img class="payment-method-arrow-img" src="${escapeHtml(src)}" alt="" role="presentation" />`
    : `<span class="payment-method-arrow-fallback" aria-hidden="true">&gt;</span>`;
  return `<span class="payment-method-cell-inner">${arrow}<span class="payment-method-label">${labelHtml}</span></span>`;
};

/**
 * @description Celda promoción efectivo: `flecha_verde.png` (mismo asset que el resto) teñida vía CSS al gris del bloque métodos de pago.
 * @param {string} [arrowSrc]
 * @param {string} labelHtml
 * @returns {string}
 */
const paymentMethodCashPromoInner = (arrowSrc, labelHtml) => {
  const src = arrowSrc && String(arrowSrc).trim();
  const arrow = src
    ? `<img class="payment-method-arrow-img payment-method-arrow-img--cash-promo-table-tone" src="${escapeHtml(src)}" alt="" role="presentation" />`
    : `<span class="payment-method-arrow-fallback payment-method-arrow-fallback--cash-promo-table-tone" aria-hidden="true">&gt;</span>`;
  return `<span class="payment-method-cell-inner payment-method-cell-inner--cash-promo">${arrow}<span class="payment-method-label">${labelHtml}</span></span>`;
};

/**
 * @description HTML de métodos de pago; logo Webpay y flecha junto a cada opción si hay `src` resuelto.
 * @param {string} [webpaySrc]
 * @param {string} [paymentArrowSrc]
 * @returns {string}
 */
export const buildPaymentMethodsSectionHtml = (webpaySrc, paymentArrowSrc) => {
  const w = webpaySrc && String(webpaySrc).trim();
  const webpayInner = w
    ? `<img class="webpay-logo-img" src="${escapeHtml(w)}" alt="Webpay Plus" />`
    : WEBPAY_FALLBACK_INNER;

  const a = paymentArrowSrc;
  const cell = (labelHtml) => paymentMethodCellInner(a, labelHtml);

  return `
<div class="payment-methods-section">
<h2 class="section-title section-title--spaced">Métodos de pago</h2>
<div class="payment-methods-block">
  <table class="payment-methods-table">
    <tbody>
      <tr>
        <td class="payment-method-cell payment-method-cell--cash-promo">${paymentMethodCashPromoInner(a, 'Efectivo <strong>10% dcto</strong>')}</td>
        <td class="payment-method-cell">${cell('Transferencia')}</td>
        <td class="payment-method-cell">${cell('Tarjeta de débito o crédito')}</td>
      </tr>
      <tr>
        <td class="payment-method-cell payment-method-cell--full" colspan="3">
          ${cell('Opción de convenio directo con la agencia en cuotas prepago mensuales sin interés')}
        </td>
      </tr>
    </tbody>
  </table>
  <div class="webpay-logo-wrap">
    ${webpayInner}
  </div>
</div>
</div>`;
};
