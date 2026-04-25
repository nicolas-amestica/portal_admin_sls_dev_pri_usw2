/**
 * Helper de integración directa con el SII (Servicio de Impuestos Internos de Chile).
 * Implementado con APIs nativas de Node.js 20 — sin dependencias externas.
 *
 * Flujo de autenticación SII:
 *   GET /DTEWS/CrSeed.jws → semilla aleatoria
 *   Firma semilla con RSA-SHA1 (XMLDSIG) usando la llave privada de la empresa
 *   POST /DTEWS/GetTokenFromSeed.jws → TOKEN (válido ~2 min)
 */

import { createSign, createHash } from 'crypto';

const FETCH_TIMEOUT_MS = 10_000;
const MAX_RETRIES = 3;

/**
 * Obtiene un token de autenticación del SII.
 * Flujo: GET semilla → firma RSA-SHA1 (XMLDSIG) → POST → TOKEN.
 *
 * @param {string} certPem - Certificado digital X.509 en formato PEM.
 * @param {string} llavePem - Llave privada RSA en formato PEM.
 * @param {string} siiHost - Host del SII (maullin.sii.cl para cert, palena.sii.cl para prd).
 * @returns {Promise<string>} Token de autenticación SII.
 */
export async function getSiiToken(certPem, llavePem, siiHost) {
  const seed = await fetchSeed(siiHost);
  const reqXml = buildTokenRequestXml(seed, llavePem, certPem);
  return fetchToken(reqXml, siiHost);
}

/**
 * Consulta si un DTE recibido (factura de proveedor) existe en el Registro de Compras del SII.
 *
 * @param {object} params
 * @param {string} params.token - Token SII obtenido con getSiiToken().
 * @param {string} params.rutEmpresa - RUT de la empresa que recibe (con puntos y guión).
 * @param {string} params.rutEmisor - RUT del proveedor emisor (con puntos y guión).
 * @param {string|number} params.folio - Número de folio del DTE.
 * @param {string} params.tipo - Tipo de DTE (33 = factura, 34 = exenta).
 * @param {string} params.fecha - Fecha de emisión del DTE (YYYY-MM-DD).
 * @param {number} params.monto - Monto total del DTE.
 * @param {string} params.siiHost - Host del SII.
 * @returns {Promise<{ existe: boolean, estado: string, glosa: string }>}
 */
export async function queryDteRecibido({ token, rutEmpresa, rutEmisor, folio, tipo, fecha, monto, siiHost }) {
  const { numero: numEmpresa, dv: dvEmpresa } = parseRut(rutEmpresa);
  const { numero: numEmisor, dv: dvEmisor } = parseRut(rutEmisor);
  const fechaSii = String(fecha ?? '').replace(/-/g, '');

  const soapBody = buildQueryEstDteRecibXml({
    numEmpresa, dvEmpresa, numEmisor, dvEmisor, tipo, folio, fechaSii, monto,
  });

  const responseText = await fetchWithRetry(
    `https://${siiHost}/DTEWS/QueryEstDteRecib.jws`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=UTF-8',
        'SOAPAction': '""',
        'Cookie': `TOKEN=${token}`,
      },
      body: soapBody,
    }
  );

  const estado = extractTag(responseText, 'ESTADO') ?? extractTag(responseText, 'Estado') ?? '';
  const glosa = extractTag(responseText, 'GLOSA') ?? extractTag(responseText, 'Glosa') ?? '';

  return { existe: estado === '00', estado, glosa };
}

// ─── Helpers internos ─────────────────────────────────────────────────────────

async function fetchSeed(siiHost) {
  const text = await fetchWithRetry(`https://${siiHost}/DTEWS/CrSeed.jws`, { method: 'GET' });
  const seed = extractTag(text, 'SEMILLA');
  if (!seed) throw new Error('SII no devolvió semilla válida');
  return seed;
}

/**
 * Construye el XML de solicitud de token con firma XMLDSIG (RSA-SHA1).
 * El elemento firmado es <item><Semilla>...</Semilla></item>.
 * Se usa C14N inclusivo para item y SignedInfo (ambos triviales sin namespaces anidados).
 */
function buildTokenRequestXml(seed, llavePem, certPem) {
  // C14N de <item> — sin namespace ni atributos, la forma C14N es idéntica al string
  const itemC14n = `<item><Semilla>${seed}</Semilla></item>`;
  const sha1Digest = createHash('sha1').update(itemC14n).digest('base64');

  // C14N de <SignedInfo> — el xmlns declarado en el elemento raíz propaga a hijos en C14N
  const signedInfoC14n = [
    '<SignedInfo xmlns="http://www.w3.org/2000/09/xmldsig#">',
    '<CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"></CanonicalizationMethod>',
    '<SignatureMethod Algorithm="http://www.w3.org/2000/09/xmldsig#rsa-sha1"></SignatureMethod>',
    '<Reference URI="">',
    '<Transforms>',
    '<Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"></Transform>',
    '</Transforms>',
    '<DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1"></DigestMethod>',
    `<DigestValue>${sha1Digest}</DigestValue>`,
    '</Reference>',
    '</SignedInfo>',
  ].join('');

  const signatureValue = createSign('SHA1').update(signedInfoC14n).sign(llavePem, 'base64');
  const certContent = certPem
    .replace(/-----BEGIN CERTIFICATE-----/g, '')
    .replace(/-----END CERTIFICATE-----/g, '')
    .replace(/\r?\n/g, '');

  return [
    '<getToken>',
    '<item>',
    `<Semilla>${seed}</Semilla>`,
    '<Signature xmlns="http://www.w3.org/2000/09/xmldsig#">',
    '<SignedInfo>',
    '<CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"></CanonicalizationMethod>',
    '<SignatureMethod Algorithm="http://www.w3.org/2000/09/xmldsig#rsa-sha1"></SignatureMethod>',
    '<Reference URI="">',
    '<Transforms>',
    '<Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"></Transform>',
    '</Transforms>',
    '<DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1"></DigestMethod>',
    `<DigestValue>${sha1Digest}</DigestValue>`,
    '</Reference>',
    '</SignedInfo>',
    `<SignatureValue>${signatureValue}</SignatureValue>`,
    '<KeyInfo>',
    '<X509Data>',
    `<X509Certificate>${certContent}</X509Certificate>`,
    '</X509Data>',
    '</KeyInfo>',
    '</Signature>',
    '</item>',
    '</getToken>',
  ].join('');
}

async function fetchToken(reqXml, siiHost) {
  const text = await fetchWithRetry(
    `https://${siiHost}/DTEWS/GetTokenFromSeed.jws`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'text/xml; charset=UTF-8' },
      body: reqXml,
    }
  );

  const estado = extractTag(text, 'ESTADO');
  if (estado !== '00') {
    const glosa = extractTag(text, 'GLOSA') ?? '';
    throw new Error(`SII rechazó el token: estado=${estado}, glosa=${glosa}`);
  }

  const token = extractTag(text, 'TOKEN');
  if (!token) throw new Error('SII no retornó TOKEN en la respuesta');
  return token;
}

function buildQueryEstDteRecibXml({ numEmpresa, dvEmpresa, numEmisor, dvEmisor, tipo, folio, fechaSii, monto }) {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/">',
    '<SOAP-ENV:Body>',
    '<getEstDteRecibidos>',
    `<Rut>${numEmpresa}</Rut>`,
    `<Dv>${dvEmpresa}</Dv>`,
    `<RutEmisor>${numEmisor}</RutEmisor>`,
    `<DvEmisor>${dvEmisor}</DvEmisor>`,
    `<TipoDte>${tipo}</TipoDte>`,
    `<Folio>${folio}</Folio>`,
    `<FecEmis>${fechaSii}</FecEmis>`,
    `<MntTotal>${monto}</MntTotal>`,
    '</getEstDteRecibidos>',
    '</SOAP-ENV:Body>',
    '</SOAP-ENV:Envelope>',
  ].join('');
}

/**
 * Extrae el contenido de texto de la primera etiqueta XML con el nombre dado.
 * Ejemplo: extractTag('<ESTADO>00</ESTADO>', 'ESTADO') → '00'
 */
function extractTag(xml, tagName) {
  const match = xml.match(new RegExp(`<${tagName}[^>]*>([^<]*)<\/${tagName}>`));
  return match?.[1] ?? null;
}

/** Divide un RUT chileno (con o sin puntos/guión) en número y dígito verificador. */
function parseRut(rut) {
  const clean = String(rut).replace(/\./g, '').replace(/\s/g, '');
  const lastDash = clean.lastIndexOf('-');
  if (lastDash === -1) throw new Error(`RUT inválido: ${rut}`);
  return { numero: clean.slice(0, lastDash), dv: clean.slice(lastDash + 1).toUpperCase() };
}

/**
 * fetch con reintentos y backoff exponencial (1s, 2s, 3s).
 * Reintenta en errores de red y respuestas HTTP 5xx.
 */
async function fetchWithRetry(url, options) {
  let lastErr;
  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      const res = await fetch(url, { ...options, signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
      if (res.status < 500) return res.text();
      throw new Error(`HTTP ${res.status} desde SII`);
    } catch (err) {
      lastErr = err;
      if (i < MAX_RETRIES - 1) await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
  throw lastErr;
}
