import { buildHtmlDocument } from './build-html-document.js';
import { resolveDocumentImageSources } from './resolve-document-image-urls.js';
import { renderHtmlToPdf } from './render-html-to-pdf.js';

export {
  HTML_DOCUMENT_SCOPES,
  normalizeHtmlDocumentScope,
  isHtmlDocumentScope,
  SCOPE_THEMES,
} from './scopes.js';

export { escapeHtml, formatDetailAsHtml } from './escape-html.js';
export { validateAndNormalizeImageSrc } from './safe-image-src.js';
export {
  getBudgetAssetUrl,
  getDefaultHeaderBannerUrl,
  resolveDocumentImageSources,
} from './resolve-document-image-urls.js';
export { buildHtmlDocument, renderHtmlToPdf };

/**
 * @description Genera PDF desde payload scope + document (HTML intermedio).
 * @param {Object} params
 * @param {string} params.scope
 * @param {Object} params.document
 * @param {{ isPreview?: boolean }} [params.action]
 * @returns {Promise<{ success: true, base64: string } | { success: false, error: string, statusCode: number }>}
 */
export const generateHtmlTemplatePdf = async ({ scope, document, action = {} }) => {
  try {
    const documentForHtml = await resolveDocumentImageSources(document);
    const html = buildHtmlDocument(scope, documentForHtml, { isPreview: action.isPreview === true });
    const buffer = await renderHtmlToPdf(html);

    if (!Buffer.isBuffer(buffer)) {
      return { success: false, error: 'El PDF generado no es un buffer válido', statusCode: 500 };
    }

    return { success: true, base64: buffer.toString('base64') };
  } catch (error) {
    console.error('generateHtmlTemplatePdf:', error);
    return {
      success: false,
      error: error.message || 'Error al generar el PDF desde HTML',
      statusCode: error.statusCode || 500,
    };
  }
};
