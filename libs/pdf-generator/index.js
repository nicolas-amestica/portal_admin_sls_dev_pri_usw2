import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { PDF_STYLES, PDF_CONFIG } from "./core/config.js";
import { addWatermark } from "./core/watermark.js";
import { sanitizeRut } from "./helpers/formatters.js";
import {
  splitTextIntoLines,
  drawJustifiedText,
  addHeaderAndFooter,
  getContentWidth,
} from "./core/layout.js";

// Re-exportar funciones útiles
export { loadImages, clearImageCache } from "./core/image-loader.js";
export { formatDate, formatCurrency, sanitizeRut as formatRut } from "./helpers/formatters.js";
export { PDF_CONFIG, PDF_STYLES } from "./core/config.js";

/**
 * Genera un PDF con los datos proporcionados
 *
 * @param {Object} contract - Datos estructurados del documento
 * @param {string} contract.title - Título del documento
 * @param {string} contract.generalData - Datos generales/introducción
 * @param {Array} contract.clauses - Cláusulas del documento
 * @param {Object} contract.signatures - Datos de firmas
 * @param {string|null} headerImageBase64 - Imagen del header en base64 (null si no hay)
 * @param {string|null} footerImageBase64 - Imagen del footer en base64 (null si no hay)
 * @param {Object} options - Opciones adicionales
 * @param {string} options.watermarkText - Texto de marca de agua (opcional)
 * @param {boolean} options.addWatermark - Si agregar marca de agua (default: false)
 * @param {boolean} options.hasHeaderFooter - Si el documento tiene header/footer (default: false)
 *
 * @returns {Promise<Buffer>} Buffer del PDF generado
 */
export const generateContract = async (
  documentData,
  headerImageBase64,
  footerImageBase64,
  options = {}
) => {
  const {
    watermarkText = 'BORRADOR',
    addWatermark: shouldAddWatermark = false,
    hasHeaderFooter = false
  } = options;

  // 1. Crear documento
  const pdfDoc = await PDFDocument.create();

  // 2. Cargar fuentes
  const font = await pdfDoc.embedFont(StandardFonts.Courier);
  const fontBold = await pdfDoc.embedFont(StandardFonts.CourierBold);

  // 3. Embeber imágenes (solo si hasHeaderFooter = true)
  let headerImage = null;
  let footerImage = null;

  if (hasHeaderFooter && headerImageBase64 && footerImageBase64) {
    try {
      const headerImageBytes = Buffer.from(headerImageBase64, "base64");
      const footerImageBytes = Buffer.from(footerImageBase64, "base64");

      headerImage = await pdfDoc.embedPng(headerImageBytes);
      footerImage = await pdfDoc.embedPng(footerImageBytes);
    } catch (error) {
      console.warn('Error al embeber imágenes de header/footer:', error.message);
      // Continuar sin imágenes
    }
  }

  // 4. Configuración inicial
  const { PAGE_WIDTH, PAGE_HEIGHT, MARGIN, HEADER_HEIGHT, FOOTER_HEIGHT } =
    PDF_CONFIG;
  const contentWidth = getContentWidth();

  // Calcular posición inicial según si hay o no header/footer
  const topMargin = hasHeaderFooter ? HEADER_HEIGHT + 100 : MARGIN + 20;
  const bottomMargin = hasHeaderFooter ? MARGIN + FOOTER_HEIGHT : MARGIN;
  let yPosition = PAGE_HEIGHT - topMargin;

  // Track de páginas que ya tienen header/footer para evitar duplicados
  const pagesWithHeaderFooter = new Set();

  // Función helper para verificar salto de página
  const checkPageBreak = (requiredSpace = 50) => {
    if (yPosition < bottomMargin + requiredSpace) {
      // Solo agregar header/footer si la página no lo tiene y hasHeaderFooter = true
      if (hasHeaderFooter && !pagesWithHeaderFooter.has(page) && headerImage && footerImage) {
        addHeaderAndFooter(page, pdfDoc, headerImage, footerImage, font);
        pagesWithHeaderFooter.add(page);
      }
      page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      yPosition = PAGE_HEIGHT - topMargin;
      return true;
    }
    return false;
  };

  // 5. Primera página
  let page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);

  // TÍTULO
  const titleLines = splitTextIntoLines(
    documentData.title,
    contentWidth,
    fontBold,
    PDF_STYLES.title.size
  );

  titleLines.forEach((line) => {
    checkPageBreak(20);
    page.drawText(line, {
      x:
        PAGE_WIDTH / 2 -
        fontBold.widthOfTextAtSize(line, PDF_STYLES.title.size) / 2,
      y: yPosition,
      size: PDF_STYLES.title.size,
      font: fontBold,
      color: rgb(0, 0, 0),
    });
    yPosition -= 20;
  });
  yPosition -= 10;

  // DATOS GENERALES
  const generalLines = splitTextIntoLines(
    documentData.generalData,
    contentWidth,
    font,
    PDF_STYLES.generalData.size
  );

  const textColor = rgb(0, 0, 0);
  generalLines.forEach((line, lineIndex) => {
    checkPageBreak(PDF_STYLES.generalData.lineHeight);
    const isLastLine = lineIndex === generalLines.length - 1;
    drawJustifiedText(
      page,
      line,
      MARGIN,
      yPosition,
      contentWidth,
      font,
      PDF_STYLES.generalData.size,
      textColor,
      isLastLine
    );
    yPosition -= PDF_STYLES.generalData.lineHeight;
  });
  yPosition -= 20;

  // CLÁUSULAS (título en negrita en línea propia; cuerpo justificado)
  documentData.clauses.forEach((clause) => {
    checkPageBreak(30);

    const title = (clause?.title || "").trim();
    const text = (clause?.text || "").trim();

    if (title) {
      const titleLines = splitTextIntoLines(
        title,
        contentWidth,
        fontBold,
        PDF_STYLES.clauseText.size
      );
      titleLines.forEach((tline) => {
        checkPageBreak(PDF_STYLES.clauseText.lineHeight);
        page.drawText(tline, {
          x: MARGIN,
          y: yPosition,
          size: PDF_STYLES.clauseText.size,
          font: fontBold,
          color: textColor,
        });
        yPosition -= PDF_STYLES.clauseText.lineHeight;
      });
    }

    if (text) {
      const bodyLines = splitTextIntoLines(
        text,
        contentWidth,
        font,
        PDF_STYLES.clauseText.size
      );
      bodyLines.forEach((line, lineIndex) => {
        checkPageBreak(PDF_STYLES.clauseText.lineHeight);
        const isLastLine = lineIndex === bodyLines.length - 1;
        drawJustifiedText(
          page,
          line,
          MARGIN,
          yPosition,
          contentWidth,
          font,
          PDF_STYLES.clauseText.size,
          textColor,
          isLastLine
        );
        yPosition -= PDF_STYLES.clauseText.lineHeight;
      });
    }

    // Detalles (servicios incluidos)
    if (clause?.detail) {
      yPosition -= 10;

      checkPageBreak(25);
      page.drawText(clause?.detail?.title, {
        x: MARGIN,
        y: yPosition,
        size: PDF_STYLES.serviceTitle.size,
        font: fontBold,
        color: textColor,
      });
      yPosition -= PDF_STYLES.serviceTitle.marginBottom;

      checkPageBreak(15);
      page.drawText(
        `${clause?.detail?.days} días / ${clause?.detail?.nights} noches de estadía`,
        {
          x: MARGIN,
          y: yPosition,
          size: PDF_STYLES.clauseText.size,
          font: font,
          color: textColor,
        }
      );
      yPosition -= 20;

      checkPageBreak(20);
      page.drawText("Servicios incluidos:", {
        x: MARGIN,
        y: yPosition,
        size: PDF_STYLES.clauseText.size,
        font: fontBold,
        color: textColor,
      });
      yPosition -= 15;

      // Lista de servicios
      clause?.detail?.services.forEach((service) => {
        const serviceLines = splitTextIntoLines(
          `• ${service}`,
          contentWidth - PDF_STYLES.serviceItem.indent,
          font,
          PDF_STYLES.serviceItem.size
        );

        const serviceBlockWidth = contentWidth - PDF_STYLES.serviceItem.indent;
        const serviceX = MARGIN + PDF_STYLES.serviceItem.indent;
        serviceLines?.forEach((line, lineIndex) => {
          checkPageBreak(PDF_STYLES.serviceItem.lineHeight);
          const isLastLine = lineIndex === serviceLines.length - 1;
          drawJustifiedText(
            page,
            line,
            serviceX,
            yPosition,
            serviceBlockWidth,
            font,
            PDF_STYLES.serviceItem.size,
            textColor,
            isLastLine
          );
          yPosition -= PDF_STYLES.serviceItem.lineHeight;
        });
      });
    }

    yPosition -= 15;
  });

  // PÁGINA DE FIRMAS DINÁMICA
  // Solo agregamos header/footer a la página anterior si no lo tiene
  if (!pagesWithHeaderFooter.has(page)) {
    addHeaderAndFooter(page, pdfDoc, headerImage, footerImage, font);
    pagesWithHeaderFooter.add(page);
  }

  page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  yPosition = PAGE_HEIGHT - HEADER_HEIGHT - 150;

  const {
    operators = [],
    clients = [],
    companyName,
  } = documentData.signatures || {};

  const SIGNATURE_SPACE = 90;
  const SIGNATURE_LINE_LENGTH = 200;
  /** Dibuja el espacio para una firma manual, sin estampar imágenes. */
  const drawSignatureSlot = (pageRef, x, lineY) => {
    pageRef.drawLine({
      start: { x, y: lineY },
      end: { x: x + SIGNATURE_LINE_LENGTH, y: lineY },
      thickness: 1,
      color: rgb(0, 0, 0),
    });
    return lineY - 15;
  };

  const totalSignatures = operators.length + clients.length;
  const useDoubleColumn = totalSignatures <= 4;

  if (useDoubleColumn && operators.length > 0 && clients.length > 0) {
    // Layout de 2 columnas
    const col1X = MARGIN + 40;
    const col2X = PAGE_WIDTH / 2 + 40;

    let operatorY = yPosition;
    let clientY = yPosition;

    // COLUMNA OPERADORES
    operatorY -= 12;
    operatorY -= 35;

    operators.forEach((operator) => {
      if (operatorY < MARGIN + FOOTER_HEIGHT + SIGNATURE_SPACE) {
        if (!pagesWithHeaderFooter.has(page)) {
          addHeaderAndFooter(page, pdfDoc, headerImage, footerImage, font);
          pagesWithHeaderFooter.add(page);
        }
        page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
        operatorY = PAGE_HEIGHT - HEADER_HEIGHT - 150;
      }

      operatorY = drawSignatureSlot(page, col1X, operatorY);

      page.drawText("El Operador", {
        x: col1X,
        y: operatorY,
        size: PDF_STYLES.signatureDetail.size,
        font: fontBold,
        color: rgb(0, 0, 0),
      });
      operatorY -= 10;

      page.drawText(operator.name, {
        x: col1X,
        y: operatorY - 3,
        size: PDF_STYLES.signatureDetail.size,
        font: font,
        color: rgb(0, 0, 0),
      });
      operatorY -= 13;

      page.drawText(`RUT ${sanitizeRut(operator.dni)}`, {
        x: col1X,
        y: operatorY - 3,
        size: PDF_STYLES.signatureDetail.size,
        font: font,
        color: rgb(0, 0, 0),
      });
      operatorY -= SIGNATURE_SPACE - 28;
    });

    // COLUMNA CLIENTES
    clientY -= 47;

    clients.forEach((client) => {
      if (clientY < MARGIN + FOOTER_HEIGHT + SIGNATURE_SPACE) {
        if (!pagesWithHeaderFooter.has(page)) {
          addHeaderAndFooter(page, pdfDoc, headerImage, footerImage, font);
          pagesWithHeaderFooter.add(page);
        }
        page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
        clientY = PAGE_HEIGHT - HEADER_HEIGHT - 150;
      }

      clientY = drawSignatureSlot(page, col2X, clientY);

      page.drawText("El Representante", {
        x: col2X,
        y: clientY,
        size: PDF_STYLES.signatureDetail.size,
        font: fontBold,
        color: rgb(0, 0, 0),
      });
      clientY -= 10;

      page.drawText(client.name, {
        x: col2X,
        y: clientY - 3,
        size: PDF_STYLES.signatureDetail.size,
        font: font,
        color: rgb(0, 0, 0),
      });
      clientY -= 14;

      page.drawText(`RUT ${sanitizeRut(client.dni)}`, {
        x: col2X,
        y: clientY - 3,
        size: PDF_STYLES.signatureDetail.size,
        font: font,
        color: rgb(0, 0, 0),
      });
      clientY -= SIGNATURE_SPACE - 31;
    });
  } else {
    // Layout de 1 columna
    const centerX = MARGIN + 40;

    // SECCIÓN OPERADORES
    if (operators.length > 0) {
      page.drawText(operators.length > 1 ? "Los Operadores" : "El Operador", {
        x: centerX,
        y: yPosition,
        size: PDF_STYLES.signature.size + 1,
        font: fontBold,
        color: rgb(0, 0, 0),
      });
      yPosition -= 12;

      page.drawText(companyName || "GIRAS INDÓMITO LIMITADA", {
        x: centerX,
        y: yPosition,
        size: PDF_STYLES.signatureDetail.size,
        font: font,
        color: rgb(0, 0, 0),
      });
      yPosition -= 35;

      operators.forEach((operator) => {
        if (yPosition < MARGIN + FOOTER_HEIGHT + SIGNATURE_SPACE) {
          if (!pagesWithHeaderFooter.has(page)) {
            addHeaderAndFooter(page, pdfDoc, headerImage, footerImage, font);
            pagesWithHeaderFooter.add(page);
          }
          page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
          yPosition = PAGE_HEIGHT - HEADER_HEIGHT - 150;
        }

        yPosition = drawSignatureSlot(page, centerX, yPosition);

        page.drawText(operator.name, {
          x: centerX,
          y: yPosition,
          size: PDF_STYLES.signatureDetail.size,
          font: font,
          color: rgb(0, 0, 0),
        });
        yPosition -= 13;

        page.drawText(`RUT ${sanitizeRut(operator.dni)}`, {
          x: centerX,
          y: yPosition,
          size: PDF_STYLES.signatureDetail.size,
          font: font,
          color: rgb(0, 0, 0),
        });
        yPosition -= SIGNATURE_SPACE - 28;
      });

      yPosition -= 30;
    }

    // SECCIÓN CLIENTES
    if (clients.length > 0) {
      if (yPosition < MARGIN + FOOTER_HEIGHT + 100) {
        if (!pagesWithHeaderFooter.has(page)) {
          addHeaderAndFooter(page, pdfDoc, headerImage, footerImage, font);
          pagesWithHeaderFooter.add(page);
        }
        page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
        yPosition = PAGE_HEIGHT - HEADER_HEIGHT - 150;
      }

      page.drawText(
        clients.length > 1 ? "Los Representantes" : "El Representante",
        {
          x: centerX,
          y: yPosition,
          size: PDF_STYLES.signature.size + 1,
          font: fontBold,
          color: rgb(0, 0, 0),
        }
      );
      yPosition -= 35;

      clients.forEach((client) => {
        if (yPosition < MARGIN + FOOTER_HEIGHT + SIGNATURE_SPACE) {
          if (!pagesWithHeaderFooter.has(page)) {
            addHeaderAndFooter(page, pdfDoc, headerImage, footerImage, font);
            pagesWithHeaderFooter.add(page);
          }
          page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
          yPosition = PAGE_HEIGHT - HEADER_HEIGHT - 150;
        }

        yPosition = drawSignatureSlot(page, centerX, yPosition);

        page.drawText(client.name, {
          x: centerX,
          y: yPosition,
          size: PDF_STYLES.signatureDetail.size,
          font: font,
          color: rgb(0, 0, 0),
        });
        yPosition -= 13;

        page.drawText(`RUT ${sanitizeRut(client.dni)}`, {
          x: centerX,
          y: yPosition,
          size: PDF_STYLES.signatureDetail.size,
          font: font,
          color: rgb(0, 0, 0),
        });
        yPosition -= SIGNATURE_SPACE - 28;
      });
    }
  }

  // Agregar header/footer a todas las páginas que no lo tengan (solo si hasHeaderFooter = true)
  if (hasHeaderFooter && headerImage && footerImage) {
    const allPages = pdfDoc.getPages();

    allPages.forEach((p) => {
      if (!pagesWithHeaderFooter.has(p)) {
        addHeaderAndFooter(p, pdfDoc, headerImage, footerImage, font);
      }
    });
  }

  // 7. Generar bytes finales
  const pdfBytes = await pdfDoc.save();

  // 8. Agregar marca de agua (opcional)
  let finalPdfBytes = pdfBytes;
  if (shouldAddWatermark) {
    finalPdfBytes = await addWatermark(pdfBytes, watermarkText);
  }

  // 9. Convertir a Buffer
  const buffer = Buffer.from(finalPdfBytes);

  return buffer;
};
