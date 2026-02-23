import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

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
 * Genera un comprobante de pago en PDF.
 *
 * @param {Object} params
 * @param {string} params.paymentId        - ID del pago
 * @param {number} params.installmentNumber - Número de cuota
 * @param {number} params.amount           - Monto pagado (CLP)
 * @param {string|null} params.authorizationCode - Código de autorización Transbank
 * @param {string|null} params.cardNumber  - Últimos 4 dígitos de la tarjeta
 * @param {string|null} params.transactionDate   - Fecha ISO de la transacción
 * @param {string|null} params.buyOrder    - Orden de compra
 * @param {string|null} params.payerEmail  - Correo del pagador
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
}) => {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4

  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const { width, height } = page.getSize();
  const margin = 50;

  const indigo = rgb(0.118, 0.227, 0.541);
  const indigoLight = rgb(0.937, 0.949, 0.996);
  const white = rgb(1, 1, 1);
  const dark = rgb(0.15, 0.15, 0.15);
  const gray = rgb(0.45, 0.45, 0.45);
  const grayLight = rgb(0.8, 0.8, 0.9);

  // ── Header ──────────────────────────────────────────────────────
  page.drawRectangle({ x: 0, y: height - 110, width, height: 110, color: indigo });

  page.drawText("COMPROBANTE DE PAGO", {
    x: margin, y: height - 52,
    size: 22, font: bold, color: white,
  });
  page.drawText("Giras Indómito Ltda.", {
    x: margin, y: height - 76,
    size: 11, font: regular, color: rgb(0.8, 0.9, 1),
  });
  page.drawText(`Emitido: ${formatDate(new Date().toISOString())}`, {
    x: margin, y: height - 96,
    size: 9, font: regular, color: rgb(0.7, 0.8, 0.95),
  });

  // ── Sección detalles ────────────────────────────────────────────
  let y = height - 148;

  page.drawText("Detalles de la Transacción", {
    x: margin, y,
    size: 13, font: bold, color: indigo,
  });
  y -= 12;

  page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 1, color: grayLight });
  y -= 28;

  // ── Filas ────────────────────────────────────────────────────────
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

    // Truncar valor largo para que no salga del borde
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

  // ── Footer ───────────────────────────────────────────────────────
  page.drawText("Este comprobante es válido como constancia de pago.", {
    x: margin, y,
    size: 9, font: regular, color: gray,
  });
  y -= 14;
  page.drawText("Consultas: info@girasindomito.cl | www.girasindomito.cl", {
    x: margin, y,
    size: 9, font: regular, color: gray,
  });

  // Barra inferior
  page.drawRectangle({ x: 0, y: 0, width, height: 8, color: indigo });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
};
