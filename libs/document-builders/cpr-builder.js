import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { addHeaderAndFooter } from '../pdf-generator/core/layout.js';
import { generateQRCodeBuffer, buildPaymentVerificationUrl, buildPaymentQRPayload } from '../qr-generator.js';

const formatCLP = (amount) =>
  new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(amount);

const formatDate = (dateString) => {
  if (!dateString) return "No disponible";
  try {
    return new Intl.DateTimeFormat("es-CL", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "America/Santiago",
    }).format(new Date(dateString));
  } catch {
    return String(dateString);
  }
};

/**
 * Genera un comprobante de pago en PDF con header, footer y código QR de verificación.
 *
 * El QR apunta a la URL pública de verificación cuando se provee verifyBaseUrl.
 * Si no está disponible, el QR codifica un JSON con los datos del pago como respaldo.
 *
 * @param {Object} params
 * @param {string} params.paymentId            - ID del pago
 * @param {number} params.installmentNumber    - Número de cuota
 * @param {number} params.amount              - Monto pagado (CLP)
 * @param {string|null} params.authorizationCode - Código de autorización Transbank
 * @param {string|null} params.cardNumber     - Últimos 4 dígitos de la tarjeta
 * @param {string|null} params.transactionDate - Fecha ISO de la transacción
 * @param {string|null} params.buyOrder       - Orden de compra
 * @param {string|null} params.payerEmail     - Correo del pagador
 * @param {string} [params.method]            - Método de pago (CASH | WEBPAY). Default: WEBPAY
 * @param {string|null} [params.verifyBaseUrl] - URL base del API para la página de verificación
 * @param {string|null} params.headerImageBase64 - Header en base64 (desde S3)
 * @param {string|null} params.footerImageBase64 - Footer en base64 (desde S3)
 * @returns {Promise<Buffer>} Buffer del PDF generado
 */
export const generatePaymentReceipt = async ({
  paymentId,
  installmentNumber,
  amount,
  authorizationCode,
  cardNumber,
  transactionDate,
  buyOrder,
  payerEmail,
  method = 'WEBPAY',
  verifyBaseUrl = null,
  headerImageBase64 = null,
  footerImageBase64 = null,
}) => {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4

  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const { width, height } = page.getSize();
  const margin = 50;

  const indigo = rgb(0.118, 0.227, 0.541);
  const indigoLight = rgb(0.937, 0.949, 0.996);
  const dark = rgb(0.15, 0.15, 0.15);
  const gray = rgb(0.45, 0.45, 0.45);
  const grayLight = rgb(0.8, 0.8, 0.9);

  // Embeber header y footer si vienen desde S3
  let headerImage = null;
  let footerImage = null;
  if (headerImageBase64 && footerImageBase64) {
    try {
      headerImage = await pdfDoc.embedPng(Buffer.from(headerImageBase64, 'base64'));
      footerImage = await pdfDoc.embedPng(Buffer.from(footerImageBase64, 'base64'));
    } catch (e) {
      console.warn('Error al embeber header/footer en comprobante:', e.message);
    }
  }

  // Generar QR: URL de verificación si hay baseUrl válida, JSON como respaldo
  const validUrl = typeof verifyBaseUrl === 'string' && verifyBaseUrl.startsWith('http');
  let qrImage = null;
  try {
    const qrContent = validUrl
      ? buildPaymentVerificationUrl(paymentId, verifyBaseUrl)
      : buildPaymentQRPayload({ paymentId, installmentNumber, amount, method, transactionDate });

    const qrBuffer = await generateQRCodeBuffer(qrContent, { width: 150 });
    qrImage = await pdfDoc.embedPng(qrBuffer);
  } catch (e) {
    console.warn('Error al generar QR en comprobante:', e.message);
  }

  // Título principal — posicionado bajo el header
  const topOffset = headerImage ? 160 : 60;
  let y = height - topOffset;

  page.drawText("COMPROBANTE DE PAGO", {
    x: margin, y,
    size: 18, font: bold, color: indigo,
  });
  y -= 20;

  page.drawText("Giras Indómito Ltda.", {
    x: margin, y,
    size: 11, font: regular, color: gray,
  });
  y -= 15;

  page.drawText(`Emitido: ${formatDate(new Date().toISOString())}`, {
    x: margin, y,
    size: 9, font: regular, color: gray,
  });
  y -= 30;

  // Sección detalles
  page.drawText("Detalles de la Transacción", {
    x: margin, y,
    size: 13, font: bold, color: indigo,
  });
  y -= 12;

  page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 1, color: grayLight });
  y -= 28;

  const rows = [
    ["Fecha de Transacción", formatDate(transactionDate)],
    ["Código de Autorización", authorizationCode || "N/A"],
    ["Orden de Compra", buyOrder || paymentId],
    ["Cuota N°", String(installmentNumber)],
    ["Monto Pagado", formatCLP(amount)],
    ["Tarjeta", cardNumber ? `**** **** **** ${cardNumber}` : "N/A"],
    ["Comprobante enviado a", payerEmail || "N/A"],
  ];

  const colLabel = margin;
  const colValue = width / 2;

  rows.forEach(([label, value], i) => {
    if (i % 2 === 0) {
      page.drawRectangle({
        x: margin - 10, y: y - 7,
        width: width - (margin - 10) * 2, height: 26,
        color: indigoLight,
      });
    }

    page.drawText(`${label}:`, {
      x: colLabel, y,
      size: 10, font: bold, color: indigo,
    });

    const maxWidth = width - colValue - margin;
    let displayValue = value;
    while (
      displayValue.length > 0 &&
      regular.widthOfTextAtSize(displayValue, 10) > maxWidth
    ) {
      displayValue = displayValue.slice(0, -1);
    }

    page.drawText(displayValue, {
      x: colValue, y,
      size: 10, font: regular, color: dark,
    });

    y -= 32;
  });

  y -= 10;
  page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 1, color: grayLight });
  y -= 22;

  // Sección inferior: texto de contacto (izquierda) + QR (derecha)
  const qrSize = 80;
  const qrX = width - margin - qrSize;
  const contactY = y;

  page.drawText("Este comprobante es válido como constancia de pago.", {
    x: margin, y,
    size: 9, font: regular, color: gray,
  });
  y -= 14;
  page.drawText("Consultas: info@girasindomito.cl | www.girasindomito.cl", {
    x: margin, y,
    size: 9, font: regular, color: gray,
  });

  // QR a la derecha del bloque de contacto
  if (qrImage) {
    const qrLabel = validUrl ? "Escanear para verificar" : "Datos del pago";
    const qrLabelWidth = regular.widthOfTextAtSize(qrLabel, 7);

    page.drawText(qrLabel, {
      x: qrX + (qrSize - qrLabelWidth) / 2,
      y: contactY + qrSize + 4,
      size: 7, font: regular, color: gray,
    });

    page.drawImage(qrImage, {
      x: qrX,
      y: contactY - qrSize + 14,
      width: qrSize,
      height: qrSize,
    });
  }

  // Aplicar header y footer de Giras Indómito
  if (headerImage && footerImage) {
    addHeaderAndFooter(page, pdfDoc, headerImage, footerImage, regular);
  }

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
};
