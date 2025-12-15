import { PDFDocument, rgb, degrees } from 'pdf-lib';

export const addWatermark = async (pdfBytes, watermarkText = 'BORRADOR') => {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const pages = pdfDoc.getPages();

  for (const page of pages) {
    const { width, height } = page.getSize();
    const fontSize = Math.min(width, height) / 5;
    const textWidth = fontSize * watermarkText.length * 0.5;
    const x = (width - textWidth) / 2 + 50; // AJUSTE HORIZONTAL
    const y = (height / 2) - 270; // AJUSTE VERTICAL

    page.drawText(watermarkText, {
      x,
      y,
      size: fontSize,
      color: rgb(0.7, 0.7, 0.7), // TONALIDAD
      opacity: 0.25, // OPACIDAD
      rotate: degrees(55), // ÁNGULO
      rotateOrigin: { x: x + textWidth / 2, y: y + fontSize / 2 } // CENTRADO DE ROTACIÓN
    });
  }

  return await pdfDoc.save();
};