/**
 * Helper de integración directa con el SII (Servicio de Impuestos Internos de Chile).
 * Autenticación: APIs nativas de Node.js 20.
 * Firma XMLDSIG de DTEs: xml-crypto (maneja C14N inclusive correctamente).
 *
 * Flujo de autenticación SII:
 *   GET /DTEWS/CrSeed.jws → semilla aleatoria
 *   Firma semilla con RSA-SHA1 (XMLDSIG) usando la llave privada de la empresa
 *   POST /DTEWS/GetTokenFromSeed.jws → TOKEN (válido ~2 min)
 */

import { createSign, createHash, createPrivateKey } from 'crypto';
import { SignedXml } from 'xml-crypto';

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

// ─── Funciones de emisión de DTEs ─────────────────────────────────────────────

/**
 * Construye y firma un DTE tipo 39 (boleta electrónica).
 * Incluye el TED (Timbre Electrónico) firmado con la llave del CAF.
 *
 * @param {object} ingreso - Ingreso de DynamoDB (fecha, montoTotal, concepto).
 * @param {number} folio - Folio autorizado por el CAF.
 * @param {string} cafXml - Contenido XML del CAF descargado del SII.
 * @param {object} config - Config del emisor (certPem, llavePem, rutEmpresa, razonSocial, giro, direccion, comuna, ciudad).
 * @returns {Promise<string>} DTE XML con Signature embebida.
 */
export async function buildAndSignBoleta39(ingreso, folio, cafXml, config) {
  const timestamp = isoTimestamp();
  const ted = buildTed(ingreso, folio, cafXml, config, timestamp);
  const dteXml = buildBoleta39Xml(ingreso, folio, config, ted, timestamp);
  return signDteXml(dteXml, config.llavePem, config.certPem, folio, 39);
}

/**
 * Envuelve un DTE firmado en el sobre EnvioDTE y lo firma con la llave de la empresa.
 *
 * @param {string} signedDteXml - DTE XML ya firmado (salida de buildAndSignBoleta39).
 * @param {number} tipoDte - Tipo de DTE (39, 33, 34...).
 * @param {object} config - Config del emisor + nroResolucion + fchResolucion.
 * @returns {Promise<string>} EnvioDTE XML con Signature embebida.
 */
export async function buildAndSignEnvioDte(signedDteXml, tipoDte, config) {
  const timestamp = isoTimestamp();
  const envioDteXml = buildEnvioDteXml(signedDteXml, tipoDte, config, timestamp);
  return signEnvioDteXml(envioDteXml, config.llavePem, config.certPem);
}

/**
 * Envía un EnvioDTE firmado al SII vía multipart/form-data.
 *
 * @param {string} token - Token SII obtenido con getSiiToken().
 * @param {string} signedEnvioDteXml - EnvioDTE XML firmado.
 * @param {object} config - Config del emisor (rutEmpresa).
 * @param {string} siiHost - Host del SII.
 * @returns {Promise<{ trackId: string, estado: string }>}
 */
export async function sendDteToSii(token, signedEnvioDteXml, config, siiHost) {
  const { numero, dv } = parseRut(config.rutEmpresa);
  const form = new FormData();
  form.append('rutSender', numero);
  form.append('dvSender', dv);
  form.append('rutCompany', numero);
  form.append('dvCompany', dv);
  form.append('archivo', new Blob([signedEnvioDteXml], { type: 'text/xml' }), 'dte.xml');

  const responseText = await fetchWithRetry(
    `https://${siiHost}/cgi_dte/UPL/DTEUpload`,
    { method: 'POST', headers: { Cookie: `TOKEN=${token}` }, body: form }
  );

  const trackId = extractTag(responseText, 'TRACKID') ?? '';
  const estado = extractTag(responseText, 'ESTADO') ?? '';
  if (!trackId) throw new Error(`SII no retornó TRACKID. Respuesta: ${responseText}`);
  return { trackId, estado };
}

/**
 * Consulta el estado de un DTE emitido usando su folio y datos del ingreso.
 *
 * @returns {Promise<{ estado: string, glosa: string, dteStatus: string }>}
 */
export async function checkDteEmisionStatus({ token, rutEmpresa, tipoDte, folio, fecha, monto, siiHost }) {
  const { numero, dv } = parseRut(rutEmpresa);
  const fechaSii = String(fecha).replace(/-/g, '');

  const soapBody = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/">',
    '<SOAP-ENV:Body>',
    '<getEstDte>',
    `<Rut>${numero}</Rut>`,
    `<Dv>${dv}</Dv>`,
    `<RutEmisor>${numero}</RutEmisor>`,
    `<DvEmisor>${dv}</DvEmisor>`,
    `<TipoDte>${tipoDte}</TipoDte>`,
    `<Folio>${folio}</Folio>`,
    `<FechaEmisionDte>${fechaSii}</FechaEmisionDte>`,
    `<MontoDte>${monto}</MontoDte>`,
    '</getEstDte>',
    '</SOAP-ENV:Body>',
    '</SOAP-ENV:Envelope>',
  ].join('');

  const responseText = await fetchWithRetry(
    `https://${siiHost}/DTEWS/QueryEstDte.jws`,
    { method: 'POST', headers: { 'Content-Type': 'text/xml; charset=UTF-8', 'SOAPAction': '""', 'Cookie': `TOKEN=${token}` }, body: soapBody }
  );

  const estado = extractTag(responseText, 'ESTADO') ?? extractTag(responseText, 'Estado') ?? '';
  const glosa = extractTag(responseText, 'GLOSA') ?? extractTag(responseText, 'Glosa') ?? '';
  const dteStatus = mapEstadoSiiEmision(estado);
  return { estado, glosa, dteStatus };
}

// ─── Helpers internos de emisión ──────────────────────────────────────────────

function buildBoleta39Xml(ingreso, folio, config, tedXml, timestamp) {
  const { numero, dv } = parseRut(config.rutEmpresa);
  const rutConDv = `${numero}-${dv}`;
  return [
    `<DTE version="1.0" xmlns="http://www.sii.cl/SiiDte">`,
    `<Documento ID="F${folio}T39">`,
    '<Encabezado><IdDoc>',
    '<TipoDTE>39</TipoDTE>',
    `<Folio>${folio}</Folio>`,
    `<FchEmis>${ingreso.fecha}</FchEmis>`,
    '<IndServicio>1</IndServicio>',
    '</IdDoc><Emisor>',
    `<RUTEmisor>${rutConDv}</RUTEmisor>`,
    `<RznSoc>${config.razonSocial}</RznSoc>`,
    `<GiroEmis>${config.giro}</GiroEmis>`,
    `<DirOrigen>${config.direccion}</DirOrigen>`,
    `<CmnaOrigen>${config.comuna}</CmnaOrigen>`,
    `<CiudadOrigen>${config.ciudad}</CiudadOrigen>`,
    '</Emisor><Receptor>',
    '<RUTRecep>66666666-6</RUTRecep>',
    '<RznSocRecep>Consumidor Final</RznSocRecep>',
    '</Receptor><Totales>',
    `<MntTotal>${ingreso.montoTotal}</MntTotal>`,
    '</Totales></Encabezado>',
    '<Detalle>',
    '<NroLinDet>1</NroLinDet>',
    `<NmbItem>${String(ingreso.concepto).substring(0, 80)}</NmbItem>`,
    `<MntItem>${ingreso.montoTotal}</MntItem>`,
    '</Detalle>',
    tedXml,
    `<TmstFirma>${timestamp}</TmstFirma>`,
    '</Documento>',
    '</DTE>',
  ].join('');
}

function buildTed(ingreso, folio, cafXml, config, timestamp) {
  const { numero, dv } = parseRut(config.rutEmpresa);
  const rutConDv = `${numero}-${dv}`;
  const cafElement = extractCafElement(cafXml);
  const ddXml = [
    '<DD>',
    `<RE>${rutConDv}</RE>`,
    '<TD>39</TD>',
    `<F>${folio}</F>`,
    `<FE>${ingreso.fecha}</FE>`,
    '<RR>66666666-6</RR>',
    '<RSR>Consumidor Final</RSR>',
    `<MNT>${ingreso.montoTotal}</MNT>`,
    `<IT1>${String(ingreso.concepto).substring(0, 40)}</IT1>`,
    cafElement,
    `<TSTED>${timestamp}</TSTED>`,
    '</DD>',
  ].join('');

  const cafKey = extractCafKey(cafXml);
  const frma = createSign('SHA1').update(ddXml).sign(cafKey, 'base64');
  return `<TED version="1.0">${ddXml}<FRMA algoritmo="SHA1withRSA">${frma}</FRMA></TED>`;
}

function buildEnvioDteXml(signedDteXml, tipoDte, config, timestamp) {
  const { numero, dv } = parseRut(config.rutEmpresa);
  const rutConDv = `${numero}-${dv}`;
  return [
    '<?xml version="1.0" encoding="ISO-8859-1"?>',
    '<EnvioDTE version="1.0" xmlns="http://www.sii.cl/SiiDte"',
    ' xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"',
    ' xsi:schemaLocation="http://www.sii.cl/SiiDte EnvioDTE_v10.xsd">',
    '<SetDTE ID="SetDoc">',
    '<Caratula version="1.0">',
    `<RutEmisor>${rutConDv}</RutEmisor>`,
    `<RutEnvia>${rutConDv}</RutEnvia>`,
    '<RutReceptor>60803000-K</RutReceptor>',
    `<FchResol>${config.fchResolucion}</FchResol>`,
    `<NroResol>${config.nroResolucion}</NroResol>`,
    `<TmstFirmaEnv>${timestamp}</TmstFirmaEnv>`,
    '<SubTotDTE>',
    `<TpoDTE>${tipoDte}</TpoDTE>`,
    '<NroDTE>1</NroDTE>',
    '</SubTotDTE>',
    '</Caratula>',
    signedDteXml,
    '</SetDTE>',
    '</EnvioDTE>',
  ].join('');
}

function signDteXml(dteXml, llavePem, certPem, folio, tipo) {
  const certContent = certPem
    .replace(/-----BEGIN CERTIFICATE-----/g, '')
    .replace(/-----END CERTIFICATE-----/g, '')
    .replace(/\r?\n/g, '');

  const sig = new SignedXml({ privateKey: llavePem });
  sig.addReference({
    xpath: `//*[@ID='F${folio}T${tipo}']`,
    transforms: ['http://www.w3.org/TR/2001/REC-xml-c14n-20010315'],
    digestAlgorithm: 'http://www.w3.org/2000/09/xmldsig#sha1',
  });
  sig.canonicalizationAlgorithm = 'http://www.w3.org/TR/2001/REC-xml-c14n-20010315';
  sig.signatureAlgorithm = 'http://www.w3.org/2000/09/xmldsig#rsa-sha1';
  sig.keyInfoProvider = { getKeyInfo: () => `<X509Data><X509Certificate>${certContent}</X509Certificate></X509Data>` };
  sig.computeSignature(dteXml, { location: { reference: `//*[@ID='F${folio}T${tipo}']`, action: 'after' } });
  return sig.getSignedXml();
}

function signEnvioDteXml(envioDteXml, llavePem, certPem) {
  const certContent = certPem
    .replace(/-----BEGIN CERTIFICATE-----/g, '')
    .replace(/-----END CERTIFICATE-----/g, '')
    .replace(/\r?\n/g, '');

  const sig = new SignedXml({ privateKey: llavePem });
  sig.addReference({
    xpath: `//*[@ID='SetDoc']`,
    transforms: ['http://www.w3.org/TR/2001/REC-xml-c14n-20010315'],
    digestAlgorithm: 'http://www.w3.org/2000/09/xmldsig#sha1',
  });
  sig.canonicalizationAlgorithm = 'http://www.w3.org/TR/2001/REC-xml-c14n-20010315';
  sig.signatureAlgorithm = 'http://www.w3.org/2000/09/xmldsig#rsa-sha1';
  sig.keyInfoProvider = { getKeyInfo: () => `<X509Data><X509Certificate>${certContent}</X509Certificate></X509Data>` };
  sig.computeSignature(envioDteXml, { location: { reference: `//*[@ID='SetDoc']`, action: 'after' } });
  return sig.getSignedXml();
}

/** Extrae el elemento <CAF version="1.0">...</CAF> del XML del CAF. */
function extractCafElement(cafXml) {
  const match = cafXml.match(/<CAF\b[^>]*>[\s\S]*?<\/CAF>/);
  if (!match) throw new Error('No se encontró elemento <CAF> en el archivo del CAF');
  return match[0];
}

/** Extrae la llave privada del CAF desde el elemento <RSASK>. Soporta PKCS#8 y PKCS#1 en base64. */
function extractCafKey(cafXml) {
  const rsaskB64 = extractTag(cafXml, 'RSASK');
  if (!rsaskB64) throw new Error('No se encontró <RSASK> en el CAF');
  const keyData = rsaskB64.trim();
  if (keyData.includes('-----')) return createPrivateKey(keyData);
  const der = Buffer.from(keyData, 'base64');
  try {
    return createPrivateKey({ key: der, format: 'der', type: 'pkcs8' });
  } catch {
    return createPrivateKey({ key: der, format: 'der', type: 'pkcs1' });
  }
}

/** Mapea código de estado SII de emisión a nuestro enum interno. */
function mapEstadoSiiEmision(estado) {
  if (estado === 'DOK' || estado === 'RPR') return 'ACEPTADO';
  if (estado === 'RCT' || estado === 'FAU' || estado === 'FNA') return 'RECHAZADO';
  return 'PROCESANDO';
}

/** Retorna timestamp ISO sin milisegundos: "YYYY-MM-DDTHH:MM:SS". */
function isoTimestamp() {
  return new Date().toISOString().replace(/\.\d{3}Z$/, '');
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
