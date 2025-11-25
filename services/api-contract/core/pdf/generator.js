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
  const { PAGE_WIDTH, PAGE_HEIGHT, MARGIN, HEADER_HEIGHT, FOOTER_HEIGHT } = PDF_CONFIG;
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

  // PÁGINA DE FIRMAS DINÁMICA
  page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  yPosition = PAGE_HEIGHT - HEADER_HEIGHT - 80;

  const { operators = [], clients = [], companyName, companyRut } = contractData.signatures || {};
  
  const SIGNATURE_HEIGHT = 80; // Altura por cada firma
  const SIGNATURE_LINE_LENGTH = 200;
  const SIGNATURE_LINE_Y_OFFSET = 50; // Offset de la línea desde el inicio

  // Calcular si necesitamos 1 o 2 columnas
  const totalSignatures = operators.length + clients.length;
  const useDoubleColumn = totalSignatures <= 4; // Si hay 4 o menos, usar 2 columnas

  if (useDoubleColumn && operators.length > 0 && clients.length > 0) {
    // Layout de 2 columnas: Operadores a la izquierda, Clientes a la derecha
    const col1X = MARGIN + 40;
    const col2X = PAGE_WIDTH / 2 + 40;
    
    let operatorY = yPosition;
    let clientY = yPosition;

    // Título Operadores
    page.drawText(operators.length > 1 ? "Los Operadores" : "El Operador", {
      x: col1X,
      y: operatorY,
      size: PDF_STYLES.signature.size + 1,
      font: fontBold,
      color: rgb(0, 0, 0),
    });
    operatorY -= 10;

    page.drawText(companyName || "GIRAS INDÓMITO LIMITADA", {
      x: col1X,
      y: operatorY,
      size: PDF_STYLES.signatureDetail.size,
      font: font,
      color: rgb(0, 0, 0),
    });
    operatorY -= 30;

    // Firmas de operadores
    operators.forEach((operator, idx) => {
      // Check si necesitamos nueva página
      if (operatorY < MARGIN + FOOTER_HEIGHT + SIGNATURE_HEIGHT) {
        addHeaderAndFooter(page, pdfDoc, headerImage, footerImage, font);
        page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
        operatorY = PAGE_HEIGHT - HEADER_HEIGHT - 80;
        clientY = PAGE_HEIGHT - HEADER_HEIGHT - 80;
      }

      // Línea de firma
      page.drawLine({
        start: { x: col1X, y: operatorY + SIGNATURE_LINE_Y_OFFSET },
        end: { x: col1X + SIGNATURE_LINE_LENGTH, y: operatorY + SIGNATURE_LINE_Y_OFFSET },
        thickness: 1,
        color: rgb(0, 0, 0),
      });
      operatorY -= 15;

      // Nombre
      page.drawText(operator.name, {
        x: col1X,
        y: operatorY,
        size: PDF_STYLES.signatureDetail.size,
        font: font,
        color: rgb(0, 0, 0),
      });
      operatorY -= PDF_STYLES.signatureDetail.lineHeight;

      // RUT
      page.drawText(`RUT ${operator.rut}`, {
        x: col1X,
        y: operatorY,
        size: PDF_STYLES.signatureDetail.size,
        font: font,
        color: rgb(0, 0, 0),
      });
      operatorY -= SIGNATURE_HEIGHT - 30;
    });

    // Título Clientes
    clientY = yPosition;
    page.drawText(clients.length > 1 ? "Los Representantes" : "El Representante", {
      x: col2X,
      y: clientY,
      size: PDF_STYLES.signature.size + 1,
      font: fontBold,
      color: rgb(0, 0, 0),
    });
    clientY -= 40;

    // Firmas de clientes
    clients.forEach((client, idx) => {
      // Check si necesitamos nueva página
      if (clientY < MARGIN + FOOTER_HEIGHT + SIGNATURE_HEIGHT) {
        addHeaderAndFooter(page, pdfDoc, headerImage, footerImage, font);
        page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
        clientY = PAGE_HEIGHT - HEADER_HEIGHT - 80;
      }

      // Línea de firma
      page.drawLine({
        start: { x: col2X, y: clientY + SIGNATURE_LINE_Y_OFFSET },
        end: { x: col2X + SIGNATURE_LINE_LENGTH, y: clientY + SIGNATURE_LINE_Y_OFFSET },
        thickness: 1,
        color: rgb(0, 0, 0),
      });
      clientY -= 15;

      // Nombre
      page.drawText(client.name, {
        x: col2X,
        y: clientY,
        size: PDF_STYLES.signatureDetail.size,
        font: font,
        color: rgb(0, 0, 0),
      });
      clientY -= PDF_STYLES.signatureDetail.lineHeight;

      // RUT
      page.drawText(`RUT ${client.rut}`, {
        x: col2X,
        y: clientY,
        size: PDF_STYLES.signatureDetail.size,
        font: font,
        color: rgb(0, 0, 0),
      });
      clientY -= SIGNATURE_HEIGHT - 30;
    });

  } else {
    // Layout de 1 columna: Todos los firmantes en secuencia vertical
    const centerX = MARGIN + 40;

    // Sección Operadores
    if (operators.length > 0) {
      page.drawText(operators.length > 1 ? "Los Operadores" : "El Operador", {
        x: centerX,
        y: yPosition,
        size: PDF_STYLES.signature.size + 1,
        font: fontBold,
        color: rgb(0, 0, 0),
      });
      yPosition -= 10;

      page.drawText(companyName || "GIRAS INDÓMITO LIMITADA", {
        x: centerX,
        y: yPosition,
        size: PDF_STYLES.signatureDetail.size,
        font: font,
        color: rgb(0, 0, 0),
      });
      yPosition -= 30;

      operators.forEach((operator) => {
        if (yPosition < MARGIN + FOOTER_HEIGHT + SIGNATURE_HEIGHT) {
          addHeaderAndFooter(page, pdfDoc, headerImage, footerImage, font);
          page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
          yPosition = PAGE_HEIGHT - HEADER_HEIGHT - 80;
        }

        // Línea de firma
        page.drawLine({
          start: { x: centerX, y: yPosition + SIGNATURE_LINE_Y_OFFSET },
          end: { x: centerX + SIGNATURE_LINE_LENGTH, y: yPosition + SIGNATURE_LINE_Y_OFFSET },
          thickness: 1,
          color: rgb(0, 0, 0),
        });
        yPosition -= 15;

        // Nombre
        page.drawText(operator.name, {
          x: centerX,
          y: yPosition,
          size: PDF_STYLES.signatureDetail.size,
          font: font,
          color: rgb(0, 0, 0),
        });
        yPosition -= PDF_STYLES.signatureDetail.lineHeight;

        // RUT
        page.drawText(`RUT ${operator.rut}`, {
          x: centerX,
          y: yPosition,
          size: PDF_STYLES.signatureDetail.size,
          font: font,
          color: rgb(0, 0, 0),
        });
        yPosition -= SIGNATURE_HEIGHT - 30;
      });

      yPosition -= 20; // Espacio entre secciones
    }

    // Sección Clientes
    if (clients.length > 0) {
      if (yPosition < MARGIN + FOOTER_HEIGHT + 100) {
        addHeaderAndFooter(page, pdfDoc, headerImage, footerImage, font);
        page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
        yPosition = PAGE_HEIGHT - HEADER_HEIGHT - 80;
      }

      page.drawText(clients.length > 1 ? "Los Representantes" : "El Representante", {
        x: centerX,
        y: yPosition,
        size: PDF_STYLES.signature.size + 1,
        font: fontBold,
        color: rgb(0, 0, 0),
      });
      yPosition -= 30;

      clients.forEach((client) => {
        if (yPosition < MARGIN + FOOTER_HEIGHT + SIGNATURE_HEIGHT) {
          addHeaderAndFooter(page, pdfDoc, headerImage, footerImage, font);
          page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
          yPosition = PAGE_HEIGHT - HEADER_HEIGHT - 80;
        }

        // Línea de firma
        page.drawLine({
          start: { x: centerX, y: yPosition + SIGNATURE_LINE_Y_OFFSET },
          end: { x: centerX + SIGNATURE_LINE_LENGTH, y: yPosition + SIGNATURE_LINE_Y_OFFSET },
          thickness: 1,
          color: rgb(0, 0, 0),
        });
        yPosition -= 15;

        // Nombre
        page.drawText(client.name, {
          x: centerX,
          y: yPosition,
          size: PDF_STYLES.signatureDetail.size,
          font: font,
          color: rgb(0, 0, 0),
        });
        yPosition -= PDF_STYLES.signatureDetail.lineHeight;

        // RUT
        page.drawText(`RUT ${client.rut}`, {
          x: centerX,
          y: yPosition,
          size: PDF_STYLES.signatureDetail.size,
          font: font,
          color: rgb(0, 0, 0),
        });
        yPosition -= SIGNATURE_HEIGHT - 30;
      });
    }
  }

  // Agregar header/footer a página de firmas
  addHeaderAndFooter(page, pdfDoc, headerImage, footerImage, font);

  // 7. Generar bytes finales
  const pdfBytes = await pdfDoc.save();
  const buffer = Buffer.from(pdfBytes);

  return buffer;
};
