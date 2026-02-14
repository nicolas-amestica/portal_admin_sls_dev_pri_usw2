import { rgb } from 'pdf-lib';
import { PDF_CONFIG } from './config.js';

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
 * Calcula el espaciado adicional entre palabras para justificar una línea de texto
 */
export const calculateJustifiedSpacing = (line, maxWidth, font, fontSize) => {
  const words = line.trim().split(' ');
  if (words.length <= 1) return 0; // No justificar líneas con una sola palabra

  const textWithoutSpaces = words.join('');
  const textWidth = font.widthOfTextAtSize(textWithoutSpaces, fontSize);
  const totalSpaceNeeded = maxWidth - textWidth;
  const numberOfSpaces = words.length - 1;

  return totalSpaceNeeded / numberOfSpaces;
};

/**
 * Dibuja una línea de texto justificada
 */
export const drawJustifiedText = (page, line, x, y, maxWidth, font, fontSize, color, isLastLine = false) => {
  const words = line.trim().split(' ');

  // No justificar la última línea de un párrafo o líneas con una sola palabra
  if (isLastLine || words.length <= 1) {
    page.drawText(line, { x, y, size: fontSize, font, color });
    return;
  }

  const extraSpacing = calculateJustifiedSpacing(line, maxWidth, font, fontSize);
  let currentX = x;

  words.forEach((word, index) => {
    page.drawText(word, {
      x: currentX,
      y,
      size: fontSize,
      font,
      color
    });

    const wordWidth = font.widthOfTextAtSize(word, fontSize);
    const spaceWidth = font.widthOfTextAtSize(' ', fontSize);
    currentX += wordWidth + spaceWidth + extraSpacing;
  });
};

/**
 * Crea una función de verificación de salto de página
 */
export const createPageBreakChecker = (pdfDoc, currentPage, yPosition, onNewPage) => {
  return (requiredSpace = 50) => {
    const { MARGIN, FOOTER_HEIGHT, PAGE_WIDTH, PAGE_HEIGHT, HEADER_HEIGHT } = PDF_CONFIG;

    if (yPosition < MARGIN + FOOTER_HEIGHT + requiredSpace) {
      onNewPage(currentPage);

      const newPage = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      const newYPosition = PAGE_HEIGHT - HEADER_HEIGHT - 40;

      return { newPage, newYPosition, pageChanged: true };
    }

    return { newPage: currentPage, newYPosition: yPosition, pageChanged: false };
  };
};

/**
 * Agrega header y footer a una página
 */
export const addHeaderAndFooter = (page, pdfDoc, headerImage, footerImage, font) => {
  // Validar que las imágenes existan antes de intentar usarlas
  if (!headerImage || !footerImage) {
    console.warn('addHeaderAndFooter: Imágenes null/undefined, omitiendo header/footer');
    return;
  }

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
