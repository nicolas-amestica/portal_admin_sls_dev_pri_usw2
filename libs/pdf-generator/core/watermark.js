import { PDFDocument, rgb, degrees } from 'pdf-lib';

/**
 * Agrega marca de agua al PDF
 * @param {Buffer|Uint8Array} pdfBytes - Bytes del PDF
 * @param {string} watermarkText - Texto de la marca de agua
 * @returns {Promise<Uint8Array>} PDF con marca de agua
 */
export const addWatermark = async (pdfBytes, watermarkText = 'BORRADOR') => {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const pages = pdfDoc.getPages();

  for (const page of pages) {
    const { width, height } = page.getSize();
    const fontSize = Math.min(width, height) / 5;
    const textWidth = fontSize * watermarkText.length * 0.5;
    const x = (width - textWidth) / 2 + 50;
    const y = (height / 2) - 270;

    page.drawText(watermarkText, {
      x,
      y,
      size: fontSize,
      color: rgb(0.7, 0.7, 0.7),
      opacity: 0.25,
      rotate: degrees(55),
      rotateOrigin: { x: x + textWidth / 2, y: y + fontSize / 2 }
    });
  }

  return await pdfDoc.save();
};
