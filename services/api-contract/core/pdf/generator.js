import { PDF_STYLES } from "./styles.js";
import { PDF_CONFIG } from "../../config/constants.js";
const { PDFDocument, rgb, StandardFonts } = require("pdf-lib");
import {
  splitTextIntoLines,
  addHeaderAndFooter,
  getContentWidth,
} from "./layout.js";

/**
 * Genera un PDF del contrato con las imágenes especificadas
 */
export const generatePDF = async (
  contractData,
  headerImageBase64,
  footerImageBase64
) => {
  // 1. Crear documento
  const pdfDoc = await PDFDocument.create();

  // 2. Cargar fuentes
  const font = await pdfDoc.embedFont(StandardFonts.Courier);
  const fontBold = await pdfDoc.embedFont(StandardFonts.CourierBold);

  // 3. Embeber imágenes
  const headerImageBytes = Buffer.from(headerImageBase64, "base64");
  const footerImageBytes = Buffer.from(footerImageBase64, "base64");

  const headerImage = await pdfDoc.embedPng(headerImageBytes);
  const footerImage = await pdfDoc.embedPng(footerImageBytes);

  // 4. Configuración inicial
  const { PAGE_WIDTH, PAGE_HEIGHT, MARGIN, HEADER_HEIGHT, FOOTER_HEIGHT } =
    PDF_CONFIG;
  const contentWidth = getContentWidth();
  let yPosition = PAGE_HEIGHT - HEADER_HEIGHT - 100;

  // Función helper para verificar salto de página
  const checkPageBreak = (requiredSpace = 50) => {
    if (yPosition < MARGIN + FOOTER_HEIGHT + requiredSpace) {
      addHeaderAndFooter(page, pdfDoc, headerImage, footerImage, font);
      page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      yPosition = PAGE_HEIGHT - HEADER_HEIGHT - 100;
      return true;
    }
    return false;
  };

  // 5. Primera página
  let page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);

  // TÍTULO
  const titleLines = splitTextIntoLines(
    contractData.title,
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
    contractData.generalData,
    contentWidth,
    font,
    PDF_STYLES.generalData.size
  );

  generalLines.forEach((line) => {
    checkPageBreak(PDF_STYLES.generalData.lineHeight);
    page.drawText(line, {
      x: MARGIN,
      y: yPosition,
      size: PDF_STYLES.generalData.size,
      font: font,
      color: rgb(0, 0, 0),
    });
    yPosition -= PDF_STYLES.generalData.lineHeight;
  });
  yPosition -= 20;

  // CLÁUSULAS
  // CLÁUSULAS
  contractData.clauses.forEach((clause, index) => {
    checkPageBreak(30);

    const title = clause?.title || "";
    const text = clause?.text || "";

    // Combinar título + texto para calcular los saltos de línea
    const fullText = `${title} ${text}`;
    const lines = splitTextIntoLines(
      fullText,
      contentWidth,
      font, // Usar font normal para medir
      PDF_STYLES.clauseText.size
    );

    lines.forEach((line, lineIndex) => {
      checkPageBreak(PDF_STYLES.clauseText.lineHeight);

      let currentX = MARGIN;

      // Si la línea contiene parte del título
      if (lineIndex === 0 || line.includes(title.split(" ").slice(-1)[0])) {
        // Buscar dónde termina el título en esta línea
        const words = line.split(" ");
        const titleWords = title.split(" ");

        let titlePart = "";
        let textPart = "";
        let titleEnded = false;

        words.forEach((word, wordIndex) => {
          if (!titleEnded && titleWords.some((tw) => word.includes(tw))) {
            titlePart += (titlePart ? " " : "") + word;
          } else {
            titleEnded = true;
            textPart += (textPart ? " " : "") + word;
          }
        });

        // Dibujar parte del título en negrita
        if (titlePart) {
          page.drawText(titlePart, {
            x: currentX,
            y: yPosition,
            size: PDF_STYLES.clauseText.size,
            font: fontBold,
            color: rgb(0, 0, 0),
          });
          currentX += fontBold.widthOfTextAtSize(
            titlePart + " ",
            PDF_STYLES.clauseText.size
          );
        }

        // Dibujar parte del texto en normal
        if (textPart) {
          page.drawText(textPart, {
            x: currentX,
            y: yPosition,
            size: PDF_STYLES.clauseText.size,
            font: font,
            color: rgb(0, 0, 0),
          });
        }
      } else {
        // Líneas subsecuentes solo tienen texto normal
        page.drawText(line, {
          x: MARGIN,
          y: yPosition,
          size: PDF_STYLES.clauseText.size,
          font: font,
          color: rgb(0, 0, 0),
        });
      }

      yPosition -= PDF_STYLES.clauseText.lineHeight;
    });

    // Detalles (servicios incluidos)
    if (clause?.detail) {
      yPosition -= 10;

      checkPageBreak(25);
      page.drawText(clause?.detail?.title, {
        x: MARGIN,
        y: yPosition,
        size: PDF_STYLES.serviceTitle.size,
        font: fontBold,
        color: rgb(0, 0, 0),
      });
      yPosition -= PDF_STYLES.serviceTitle.marginBottom;

      checkPageBreak(15);
      page.drawText(
        `${clause?.detail?.days} días / ${clause?.detail?.nights} noches`,
        {
          x: MARGIN,
          y: yPosition,
          size: PDF_STYLES.clauseText.size,
          font: font,
          color: rgb(0, 0, 0),
        }
      );
      yPosition -= 20;

      checkPageBreak(20);
      page.drawText("Servicios incluidos:", {
        x: MARGIN,
        y: yPosition,
        size: PDF_STYLES.clauseText.size,
        font: fontBold,
        color: rgb(0, 0, 0),
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

        serviceLines?.forEach((line) => {
          checkPageBreak(PDF_STYLES.serviceItem.lineHeight);
          page.drawText(line, {
            x: MARGIN + PDF_STYLES.serviceItem.indent,
            y: yPosition,
            size: PDF_STYLES.serviceItem.size,
            font: font,
            color: rgb(0, 0, 0),
          });
          yPosition -= PDF_STYLES.serviceItem.lineHeight;
        });
      });
    }

    yPosition -= 15; // Espacio entre cláusulas
  });

  // Agregar header/footer a última página
  addHeaderAndFooter(page, pdfDoc, headerImage, footerImage, font);

  // PÁGINA DE FIRMAS
  page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  yPosition = PAGE_HEIGHT - HEADER_HEIGHT - 100;

  const signatureY = yPosition;
  const col1X = MARGIN + 50;
  const col2X = PAGE_WIDTH / 2 + 50;

  // Líneas de firma
  page.drawLine({
    start: { x: col1X - 50, y: signatureY },
    end: { x: col1X + 100, y: signatureY },
    thickness: 1,
    color: rgb(0, 0, 0),
  });

  page.drawLine({
    start: { x: col2X - 50, y: signatureY },
    end: { x: col2X + 100, y: signatureY },
    thickness: 1,
    color: rgb(0, 0, 0),
  });

  yPosition -= 20;

  // Textos de firma
  page.drawText("El Operador", {
    x: col1X,
    y: yPosition,
    size: PDF_STYLES.signature.size,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  page.drawText("El Representante", {
    x: col2X,
    y: yPosition,
    size: PDF_STYLES.signature.size,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  yPosition -= 15;

  page.drawText("GIRAS INDÓMITO LIMITADA", {
    x: col1X - 30,
    y: yPosition,
    size: PDF_STYLES.signatureDetail.size,
    font: font,
    color: rgb(0, 0, 0),
  });

  page.drawText("Claudia Droguett Caro", {
    x: col2X - 20,
    y: yPosition,
    size: PDF_STYLES.signatureDetail.size,
    font: font,
    color: rgb(0, 0, 0),
  });

  yPosition -= PDF_STYLES.signatureDetail.lineHeight;

  page.drawText("RUT 77.654.796-4", {
    x: col1X - 10,
    y: yPosition,
    size: PDF_STYLES.signatureDetail.size,
    font: font,
    color: rgb(0, 0, 0),
  });

  page.drawText("RUT 8.482.534-4", {
    x: col2X - 5,
    y: yPosition,
    size: PDF_STYLES.signatureDetail.size,
    font: font,
    color: rgb(0, 0, 0),
  });

  // Agregar header/footer a página de firmas
  addHeaderAndFooter(page, pdfDoc, headerImage, footerImage, font);

  // 7. Generar bytes finales
  const pdfBytes = await pdfDoc.save();
  const buffer = Buffer.from(pdfBytes);

  return buffer;
};
