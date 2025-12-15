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

  // Track de páginas que ya tienen header/footer para evitar duplicados
  const pagesWithHeaderFooter = new Set();

  // Función helper para verificar salto de página
  const checkPageBreak = (requiredSpace = 50) => {
    if (yPosition < MARGIN + FOOTER_HEIGHT + requiredSpace) {
      // Solo agregar header/footer si la página no lo tiene
      if (!pagesWithHeaderFooter.has(page)) {
        addHeaderAndFooter(page, pdfDoc, headerImage, footerImage, font);
        pagesWithHeaderFooter.add(page);
      }
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
  contractData.clauses.forEach((clause) => {
    checkPageBreak(30);

    const title = clause?.title || "";
    const text = clause?.text || "";

    // Combinar título + texto para calcular los saltos de línea
    const fullText = `${title} ${text}`;
    const lines = splitTextIntoLines(
      fullText,
      contentWidth,
      font,
      PDF_STYLES.clauseText.size
    );

    lines.forEach((line, lineIndex) => {
      checkPageBreak(PDF_STYLES.clauseText.lineHeight);

      let currentX = MARGIN;

      // Si la línea contiene parte del título
      if (lineIndex === 0 || line.includes(title.split(" ").slice(-1)[0])) {
        const words = line.split(" ");
        const titleWords = title.split(" ");

        let titlePart = "";
        let textPart = "";
        let titleEnded = false;

        words.forEach((word) => {
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
  } = contractData.signatures || {};

  const SIGNATURE_SPACE = 90;
  const SIGNATURE_LINE_LENGTH = 200;

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

      page.drawLine({
        start: { x: col1X, y: operatorY },
        end: { x: col1X + SIGNATURE_LINE_LENGTH, y: operatorY },
        thickness: 1,
        color: rgb(0, 0, 0),
      });
      operatorY -= 15;

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

      page.drawText(`RUT ${sanitizeRut(operator.rut)}`, {
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

      page.drawLine({
        start: { x: col2X, y: clientY },
        end: { x: col2X + SIGNATURE_LINE_LENGTH, y: clientY },
        thickness: 1,
        color: rgb(0, 0, 0),
      });
      clientY -= 15;

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

      page.drawText(`RUT ${sanitizeRut(client.rut)}`, {
        x: col2X,
        y: clientY - 3,
        size: PDF_STYLES.signatureDetail.size,
        font: font,
        color: rgb(0, 0, 0),
      });
      clientY -= SIGNATURE_SPACE - 29;
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

        page.drawLine({
          start: { x: centerX, y: yPosition },
          end: { x: centerX + SIGNATURE_LINE_LENGTH, y: yPosition },
          thickness: 1,
          color: rgb(0, 0, 0),
        });
        yPosition -= 15;

        page.drawText(operator.name, {
          x: centerX,
          y: yPosition,
          size: PDF_STYLES.signatureDetail.size,
          font: font,
          color: rgb(0, 0, 0),
        });
        yPosition -= 13;

        page.drawText(`RUT ${sanitizeRut(operator.rut)}`, {
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

        page.drawLine({
          start: { x: centerX, y: yPosition },
          end: { x: centerX + SIGNATURE_LINE_LENGTH, y: yPosition },
          thickness: 1,
          color: rgb(0, 0, 0),
        });
        yPosition -= 15;

        page.drawText(client.name, {
          x: centerX,
          y: yPosition,
          size: PDF_STYLES.signatureDetail.size,
          font: font,
          color: rgb(0, 0, 0),
        });
        yPosition -= 13;

        page.drawText(`RUT ${sanitizeRut(client.rut)}`, {
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

  // Agregar header/footer a todas las páginas que no lo tengan
  const allPages = pdfDoc.getPages();

  allPages.forEach((p) => {
    if (!pagesWithHeaderFooter.has(p)) {
      addHeaderAndFooter(p, pdfDoc, headerImage, footerImage, font);
    }
    // p.drawText('BORRADOR', {
    //   x: 5,
    //   y: 100 / 2 + 300,
    //   size: 50,
    //   color: rgb(0.5, 0.5, 0.5),
    //   opacity: 0.3,
    //   // rotate: degrees(-45),
    // });
  });

  // 7. Generar bytes finales
  const pdfBytes = await pdfDoc.save();
  const buffer = Buffer.from(pdfBytes);

  return buffer;
};

const sanitizeRut = (rut) => {
  if (!rut) return "";

  const cleanRut = rut.replace(/\./g, "").replace(/-/g, "");
  const rutBody = cleanRut.slice(0, -1);
  const rutDv = cleanRut.slice(-1);
  const formattedBody = rutBody.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

  return `${formattedBody}-${rutDv}`;
};
