import * as dynamoDbLib from '../../../libs/dynamodb-v3.js';

const { DYNAMODB_PAYMENT_TABLE } = process.env;

const formatCLP = (amount) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount);

const formatDate = (dateString) => {
  if (!dateString) return 'No disponible';
  try {
    return new Intl.DateTimeFormat('es-CL', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
      timeZone: 'America/Santiago',
    }).format(new Date(dateString));
  } catch {
    return dateString;
  }
};

const obfuscateEmail = (email) => {
  if (!email || !email.includes('@')) return email;
  const [local, domain] = email.split('@');
  const visible = local.slice(0, 2);
  return `${visible}***@${domain}`;
};

const PAYMENT_METHOD_LABELS = {
  CASH: 'Efectivo',
  WEBPAY: 'Webpay Plus',
};

/**
 * Genera el HTML de la página de verificación de pago.
 *
 * @param {Object|null} payment - Registro del pago o null si no se encontró
 * @returns {string} HTML completo de la página
 */
const buildHTML = (payment) => {
  const found = !!payment;

  const statusColor = found ? '#16a34a' : '#dc2626';
  const statusBg = found ? '#f0fdf4' : '#fef2f2';
  const statusBorder = found ? '#bbf7d0' : '#fecaca';
  const statusIcon = found
    ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:56px;height:56px;color:#16a34a"><circle cx="12" cy="12" r="10"/><path d="M7.5 12.5l3 3 6-6"/></svg>`
    : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:56px;height:56px;color:#dc2626"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg>`;
  const statusTitle = found ? 'Pago Verificado' : 'Comprobante no encontrado';
  const statusDesc = found
    ? 'Este comprobante de pago es auténtico y fue emitido por Giras Indómito.'
    : 'No se encontró un pago asociado a este código. Si crees que es un error, contacta a Giras Indómito.';

  const detailRows = found ? `
    <div class="detail-row">
      <span class="detail-label">N° de Cuota</span>
      <span class="detail-value">${payment.installmentNumber}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">Monto Pagado</span>
      <span class="detail-value amount">${formatCLP(payment.amount)}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">Fecha de Pago</span>
      <span class="detail-value">${formatDate(payment.paidAt)}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">Método de Pago</span>
      <span class="detail-value">
        <span class="badge">${PAYMENT_METHOD_LABELS[payment.method] || payment.method}</span>
      </span>
    </div>
    ${payment.method !== 'CASH' && payment.transbankDetails?.authorizationCode ? `
    <div class="detail-row">
      <span class="detail-label">Código de Autorización</span>
      <span class="detail-value mono">${payment.transbankDetails.authorizationCode}</span>
    </div>` : ''}
    <div class="detail-row">
      <span class="detail-label">Comprobante enviado a</span>
      <span class="detail-value">${obfuscateEmail(payment.payerEmail)}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">ID de Transacción</span>
      <span class="detail-value mono small">${payment.id}</span>
    </div>
  ` : '';

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${statusTitle} | Giras Indómito</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f1f5f9;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 24px 16px;
      color: #1e293b;
    }

    header {
      width: 100%;
      max-width: 480px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      margin-bottom: 28px;
    }

    .logo-mark {
      width: 40px;
      height: 40px;
      background: #1e3a8a;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .logo-mark svg { color: white; width: 22px; height: 22px; }

    .brand-name {
      font-size: 18px;
      font-weight: 700;
      color: #1e3a8a;
      letter-spacing: -0.3px;
    }

    .brand-sub {
      font-size: 11px;
      color: #64748b;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }

    .card {
      background: white;
      border-radius: 20px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.08);
      width: 100%;
      max-width: 480px;
      overflow: hidden;
    }

    .status-banner {
      background: ${statusBg};
      border-bottom: 1px solid ${statusBorder};
      padding: 28px 24px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      text-align: center;
    }

    .status-title {
      font-size: 20px;
      font-weight: 700;
      color: ${statusColor};
    }

    .status-desc {
      font-size: 13px;
      color: #64748b;
      line-height: 1.5;
      max-width: 320px;
    }

    .details-section {
      padding: 20px 24px;
    }

    .section-label {
      font-size: 11px;
      font-weight: 600;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      margin-bottom: 14px;
    }

    .detail-row {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 12px;
      padding: 11px 0;
      border-bottom: 1px solid #f1f5f9;
    }

    .detail-row:last-child { border-bottom: none; }

    .detail-label {
      font-size: 13px;
      color: #64748b;
      flex-shrink: 0;
      padding-top: 1px;
    }

    .detail-value {
      font-size: 13px;
      font-weight: 600;
      color: #1e293b;
      text-align: right;
    }

    .detail-value.amount {
      font-size: 16px;
      color: #1e3a8a;
    }

    .detail-value.mono {
      font-family: 'SF Mono', 'Fira Code', Consolas, monospace;
      font-weight: 500;
      font-size: 12px;
      color: #475569;
      word-break: break-all;
    }

    .detail-value.small { font-size: 11px; }

    .badge {
      display: inline-block;
      background: #eff6ff;
      color: #1e3a8a;
      font-size: 12px;
      font-weight: 600;
      padding: 3px 10px;
      border-radius: 20px;
      border: 1px solid #bfdbfe;
    }

    footer {
      margin-top: 24px;
      text-align: center;
      width: 100%;
      max-width: 480px;
    }

    footer p {
      font-size: 12px;
      color: #94a3b8;
      line-height: 1.6;
    }

    footer a {
      color: #1e3a8a;
      text-decoration: none;
      font-weight: 500;
    }

    .verified-stamp {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 20px;
      padding: 4px 12px;
      font-size: 11px;
      color: #64748b;
      margin-top: 12px;
    }

    .verified-stamp svg { width: 12px; height: 12px; color: #1e3a8a; }
  </style>
</head>
<body>

  <header>
    <div class="logo-mark">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    </div>
    <div>
      <div class="brand-name">Giras Indómito</div>
      <div class="brand-sub">Verificación de pago</div>
    </div>
  </header>

  <div class="card">
    <div class="status-banner">
      ${statusIcon}
      <div class="status-title">${statusTitle}</div>
      <div class="status-desc">${statusDesc}</div>
    </div>

    ${found ? `
    <div class="details-section">
      <div class="section-label">Detalle del Comprobante</div>
      ${detailRows}
    </div>
    ` : ''}
  </div>

  <footer>
    <p>
      ¿Tienes dudas? Escríbenos a
      <a href="mailto:info@girasindomito.cl">info@girasindomito.cl</a>
    </p>
    <div class="verified-stamp">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
      Verificado por Giras Indómito
    </div>
  </footer>

</body>
</html>`;
};

/**
 * Página pública de verificación de comprobante de pago.
 *
 * Ruta pública (sin authorizer). Retorna HTML directamente.
 * Accedida al escanear el código QR del comprobante impreso o enviado por email.
 *
 * @example
 * GET /v1/pagos/verificar/{paymentId}
 */
export const main = async (event) => {
  const paymentId = event.pathParameters?.paymentId;

  if (!paymentId) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
      body: buildHTML(null),
    };
  }

  let payment = null;

  try {
    const result = await dynamoDbLib.query({
      TableName: DYNAMODB_PAYMENT_TABLE,
      KeyConditionExpression: 'pk = :pk',
      ExpressionAttributeValues: { ':pk': `PAY#${paymentId}` },
      Limit: 1,
    });

    payment = result?.[0] ?? null;
  } catch (err) {
    console.error(`[verify-payment] Error al consultar DynamoDB para paymentId=${paymentId}:`, err.message);
  }

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-store',
    },
    body: buildHTML(payment),
  };
};
