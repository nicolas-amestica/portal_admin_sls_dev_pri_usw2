import { rgb } from 'pdf-lib';
import { PDF_CONFIG } from '../../config/constants.js';

/**
 * Divide texto en líneas que caben en el ancho especificado
 */
export const splitTextIntoLines = (text, maxWidth, font, fontSize) => {
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';

  words.forEach(word => {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const width = font.widthOfTextAtSize(testLine, fontSize);

    if (width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  });

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
};

/**
 * Agrega header y footer a una página
 */
export const addHeaderAndFooter = (page, pdfDoc, headerImage, footerImage, font) => {
  const { PAGE_WIDTH, PAGE_HEIGHT, HEADER_HEIGHT } = PDF_CONFIG;

  // Header
  const headerDims = headerImage.scale(0.5);
  page.drawImage(headerImage, {
    x: (PAGE_WIDTH - headerDims.width) / 2,
    y: PAGE_HEIGHT - HEADER_HEIGHT - 80,
    width: headerDims.width,
    height: headerDims.height,
  });

  // Footer
  const footerDims = footerImage.scale(0.5);
  page.drawImage(footerImage, {
    x: (PAGE_WIDTH - footerDims.width) / 2,
    y: 0,
    width: footerDims.width,
    height: footerDims.height,
  });

  // Número de página
  const pageNumber = pdfDoc.getPages().indexOf(page) + 1;
  const pageText = `Página ${pageNumber}`;

  page.drawText(pageText, {
    x: PAGE_WIDTH - 60,
    y: 10,
    size: 8,
    font: font,
    color: rgb(1, 1, 1) // Color blanco
  });
};

/**
 * Calcula el ancho de contenido disponible
 */
export const getContentWidth = () => {
  const { PAGE_WIDTH, MARGIN } = PDF_CONFIG;
  return PAGE_WIDTH - (MARGIN * 2);
};