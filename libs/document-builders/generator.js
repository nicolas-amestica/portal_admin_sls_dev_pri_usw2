import { generateContract, loadImages, loadSignatures } from '../pdf-generator/index.js';
import { getDocumentBuilder, isValidScope, getSupportedScopes } from './index.js';

/**
 * Opciones para la generación de documentos
 * @typedef {Object} DocumentAction
 * @property {boolean} [isPreview=false] - Si es true, agrega marca de agua "BORRADOR"
 * @property {boolean} [hasSigned=true] - Si es false, incluye firmas digitales desde S3
 * @property {boolean} [hasHeaderFooter=false] - Si es true, carga header.png y footer.png desde S3
 */

/**
 * Resultado de la generación de documentos
 * @typedef {Object} GenerateDocumentResult
 * @property {boolean} success - Indica si la generación fue exitosa
 * @property {string} [base64] - PDF generado en base64 (solo si success = true)
 * @property {Buffer} [buffer] - PDF como buffer (solo en resultado intermedio de generateDocumentBuffer)
 * @property {string} [error] - Mensaje de error (solo si success = false)
 * @property {number} [statusCode] - Código de error HTTP (solo si success = false)
 * @property {Array<string>} [supportedScopes] - Lista de scopes soportados (solo en errores de validación)
 */

/**
 * Genera el PDF como Buffer (única implementación de la lógica de generación).
 *
 * @param {Object} params - Mismos parámetros que {@link generateDocument}.
 * @returns {Promise<GenerateDocumentResult>} success + buffer, o error
 */
export const generateDocumentBuffer = async ({ scope, form, action = {}, bucket }) => {
  try {
    // 1. Validar parámetros requeridos
    if (!scope) {
      return {
        success: false,
        error: 'El parámetro "scope" es requerido.',
        statusCode: 400,
        supportedScopes: getSupportedScopes()
      };
    }

    if (!form) {
      return {
        success: false,
        error: 'El parámetro "form" es requerido.',
        statusCode: 400
      };
    }

    if (!bucket) {
      return {
        success: false,
        error: 'El parámetro "bucket" es requerido.',
        statusCode: 400
      };
    }

    // 2. Validar que el scope sea soportado
    if (!isValidScope(scope)) {
      return {
        success: false,
        error: `Scope "${scope}" no es soportado.`,
        statusCode: 400,
        supportedScopes: getSupportedScopes()
      };
    }

    // 3. Obtener builder según el scope
    const buildDocumentData = getDocumentBuilder(scope);

    // 4. Construir datos del documento
    const documentData = buildDocumentData(form);

    // 5. Cargar imágenes de header y footer desde S3 (solo si hasHeaderFooter = true)
    let headerImage = null;
    let footerImage = null;

    if (action.hasHeaderFooter === true) {
      try {
        const images = await loadImages(
          bucket,
          'assets/header.png',
          'assets/footer.png'
        );
        headerImage = images.headerImage;
        footerImage = images.footerImage;
      } catch (error) {
        console.warn('Error al cargar header/footer desde S3:', error.message);
        // Continuar sin imágenes en caso de error
      }
    }

    // 6. Cargar firmas digitales si hasSigned = false (documento con firmas)
    let signatures = [];
    if (action.hasSigned === false && documentData.signatures) {
      // Recolectar todos los DNIs de operadores y clientes
      const allRepresentatives = [
        ...(documentData.signatures.operators || []),
        ...(documentData.signatures.clients || [])
      ];

      if (allRepresentatives.length > 0) {
        try {
          signatures = await loadSignatures(bucket, allRepresentatives);
        } catch (error) {
          console.warn('Error al cargar firmas desde S3:', error.message);
          // Continuar sin firmas en caso de error
        }
      }
    }

    // 7. Configurar opciones del generador de PDF
    const pdfOptions = {
      addWatermark: action.isPreview === true,        // Marca de agua solo si isPreview = true
      watermarkText: 'BORRADOR',
      signatures: signatures,                          // Firmas solo si hasSigned = true
      hasHeaderFooter: action.hasHeaderFooter === true // Header/footer solo si hasHeaderFooter = true
    };

    // 8. Generar PDF
    const pdfBuffer = await generateContract(
      documentData,
      headerImage,
      footerImage,
      pdfOptions
    );

    // 9. Validar buffer generado
    if (!Buffer.isBuffer(pdfBuffer)) {
      return {
        success: false,
        error: 'El PDF generado no es un buffer válido',
        statusCode: 500
      };
    }

    return {
      success: true,
      buffer: pdfBuffer,
    };
  } catch (error) {
    console.error('Error en generateDocumentBuffer:', error);
    return {
      success: false,
      error: error.message || 'Error desconocido al generar el documento',
      statusCode: error.statusCode || 500,
    };
  }
};

/**
 * Genera un documento PDF genérico en formato base64.
 *
 * @param {Object} params - Parámetros de generación
 * @returns {Promise<GenerateDocumentResult>}
 */
export const generateDocument = async (params) => {
  const result = await generateDocumentBuffer(params);
  if (!result.success) {
    return result;
  }
  return {
    success: true,
    base64: result.buffer.toString('base64'),
  };
};
