import { getParameterValue } from '../../../libs/parameter-store.js';

/** Cache del token en memoria (reutilizado entre invocaciones en caliente). */
let _apiToken = null;

/** @type {Record<string, string>} Etiquetas legibles por canal. */
const CHANNEL_LABELS = {
  whatsapp: 'WhatsApp',
  messenger: 'Messenger',
  instagram: 'Instagram',
};

/** @type {Record<string, string>} Etiquetas legibles por motivo de derivación. */
const REASON_LABELS = {
  sin_presupuesto: 'No se encontró presupuesto disponible',
  sin_respuesta: 'Consulta fuera del alcance del agente',
  error_gemini: 'Error en el agente de IA (Gemini)',
};

/**
 * @description Obtiene o carga el token de acceso a la API de Chatwoot desde SSM.
 * @returns {Promise<string>}
 */
async function getApiToken() {
  if (_apiToken) return _apiToken;
  _apiToken = await getParameterValue(process.env.CHATWOOT_API_TOKEN_KEY);
  return _apiToken;
}

/**
 * @description Ejecuta una llamada autenticada a la API REST de Chatwoot.
 * @param {string} path - Ruta relativa (ej. /api/v1/accounts/1/contacts).
 * @param {RequestInit} [options] - Opciones de fetch.
 * @returns {Promise<object>}
 */
async function chatwootFetch(path, options = {}) {
  const { CHATWOOT_BASE_URL } = process.env;
  const token = await getApiToken();

  const response = await fetch(`${CHATWOOT_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'api_access_token': token,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    const error = new Error(`Chatwoot API ${response.status} ${options.method ?? 'GET'} ${path}: ${errorBody}`);
    error.status = response.status;
    error.body = errorBody;
    throw error;
  }

  return response.json();
}

/**
 * @description Busca o crea un contacto en Chatwoot según el canal de origen.
 * WhatsApp usa phone_number (E.164). Instagram y Messenger usan identifier (PSID numérico).
 * @param {string} phoneNumber - Número E.164 (WhatsApp) o PSID (Instagram/Messenger).
 * @param {string} accountId - ID de la cuenta Chatwoot.
 * @param {string} channel - Canal de origen ('whatsapp', 'messenger', 'instagram').
 * @returns {Promise<number>} ID del contacto.
 */
async function findOrCreateContact(phoneNumber, accountId, channel) {
  const isWhatsApp = channel === 'whatsapp';
  const searchResult = await chatwootFetch(
    `/api/v1/accounts/${accountId}/contacts/search?q=${encodeURIComponent(phoneNumber)}&page=1`
  );

  // Compatibilidad con Chatwoot v2 (payload: array) y v3 (payload: { contacts: array })
  const contacts = Array.isArray(searchResult.payload)
    ? searchResult.payload
    : (searchResult.payload?.contacts ?? []);

  const existing = isWhatsApp
    ? contacts.find((c) => c.phone_number === phoneNumber)
    : contacts.find((c) => c.identifier === phoneNumber);
  if (existing) return existing.id;

  const channelLabel = CHANNEL_LABELS[channel] ?? channel;
  const contactPayload = isWhatsApp
    ? { phone_number: phoneNumber, name: phoneNumber }
    : { identifier: phoneNumber, name: `${channelLabel}: ${phoneNumber}` };

  try {
    const contact = await chatwootFetch(`/api/v1/accounts/${accountId}/contacts`, {
      method: 'POST',
      body: JSON.stringify(contactPayload),
    });
    return contact.id;
  } catch (err) {
    // Si el contacto ya existe con otro formato, buscarlo por texto libre y reutilizarlo.
    if (err.status === 422) {
      const query = isWhatsApp ? phoneNumber.replace('+', '') : phoneNumber;
      const retry = await chatwootFetch(
        `/api/v1/accounts/${accountId}/contacts/search?q=${encodeURIComponent(query)}&page=1`
      );
      const retryContacts = Array.isArray(retry.payload) ? retry.payload : (retry.payload?.contacts ?? []);
      if (retryContacts.length > 0) return retryContacts[0].id;
    }
    throw err;
  }
}

/**
 * @description Obtiene el detalle de un contacto de Chatwoot por su ID.
 * @param {number} contactId - ID del contacto en Chatwoot.
 * @returns {Promise<object>} Objeto con los datos del contacto (phone_number, identifier, name, etc.).
 */
export async function obtenerContacto(contactId) {
  const { CHATWOOT_ACCOUNT_ID } = process.env;
  return chatwootFetch(`/api/v1/accounts/${CHATWOOT_ACCOUNT_ID}/contacts/${contactId}`);
}

/**
 * @description Lista las conversaciones abiertas en la bandeja de Chatwoot.
 * @param {number} [page=1] - Número de página para paginación.
 * @returns {Promise<object[]>} Array de conversaciones abiertas.
 */
export async function listarConversaciones(page = 1) {
  const { CHATWOOT_ACCOUNT_ID } = process.env;
  const result = await chatwootFetch(
    `/api/v1/accounts/${CHATWOOT_ACCOUNT_ID}/conversations?status=open&page=${page}`
  );
  return result?.data?.payload ?? [];
}

/**
 * @description Obtiene el detalle de una conversación por su ID.
 * @param {number} conversacionId - ID de la conversación en Chatwoot.
 * @returns {Promise<object>} Objeto con los datos de la conversación.
 */
export async function obtenerConversacion(conversacionId) {
  const { CHATWOOT_ACCOUNT_ID } = process.env;
  return chatwootFetch(`/api/v1/accounts/${CHATWOOT_ACCOUNT_ID}/conversations/${conversacionId}`);
}

/**
 * @description Registra un archivo adjunto como mensaje saliente en Chatwoot usando multipart/form-data.
 * Esto NO envía el archivo al cliente (eso se hace vía WhatsApp API directamente).
 * Solo persiste el registro en el historial de Chatwoot para que aparezca en la bandeja.
 * @param {number} conversacionId - ID de la conversación en Chatwoot.
 * @param {Buffer} buffer - Contenido binario del archivo.
 * @param {string} fileName - Nombre del archivo.
 * @param {string} mimeType - Tipo MIME del archivo.
 * @param {string} [caption=''] - Leyenda opcional del archivo.
 * @returns {Promise<object>} Objeto del mensaje creado.
 */
export async function enviarAdjuntoChatwoot(conversacionId, buffer, fileName, mimeType, caption = '') {
  const { CHATWOOT_ACCOUNT_ID, CHATWOOT_BASE_URL } = process.env;
  const token = await getApiToken();

  const formData = new FormData();
  if (caption) formData.append('content', caption);
  formData.append('message_type', 'outgoing');
  formData.append('private', 'false');
  formData.append('attachments[]', new Blob([buffer], { type: mimeType }), fileName);

  const response = await fetch(
    `${CHATWOOT_BASE_URL}/api/v1/accounts/${CHATWOOT_ACCOUNT_ID}/conversations/${conversacionId}/messages`,
    { method: 'POST', headers: { api_access_token: token }, body: formData }
  );

  if (!response.ok) {
    const body = await response.text();
    const err = new Error(`Chatwoot adjunto ${response.status}: ${body}`);
    err.status = response.status;
    throw err;
  }

  return response.json();
}

/**
 * @description Envía un mensaje saliente en una conversación de Chatwoot.
 * @param {number} conversacionId - ID de la conversación en Chatwoot.
 * @param {string} content - Texto del mensaje a enviar.
 * @returns {Promise<object>} Objeto del mensaje creado.
 */
export async function enviarMensaje(conversacionId, content) {
  const { CHATWOOT_ACCOUNT_ID } = process.env;
  return chatwootFetch(
    `/api/v1/accounts/${CHATWOOT_ACCOUNT_ID}/conversations/${conversacionId}/messages`,
    {
      method: 'POST',
      body: JSON.stringify({ content, message_type: 'outgoing' }),
    }
  );
}

/**
 * @description Crea o reutiliza una conversación en Chatwoot cuando el agente no puede responder.
 * Si ya existe una conversación abierta para el contacto en la bandeja, agrega el mensaje a ella
 * en lugar de crear una duplicada.
 *
 * @param {string} phoneNumber - Número o ID del cliente.
 * @param {string} userText - Mensaje original del cliente.
 * @param {'sin_presupuesto'|'sin_respuesta'|'error_gemini'} reason - Motivo de derivación.
 * @param {string} channel - Canal de origen ('whatsapp', 'messenger', 'instagram').
 * @param {object} [collectedData] - Datos recopilados por el agente antes de derivar.
 */
/**
 * @description Resuelve (cierra) una conversación en Chatwoot.
 * @param {number} chatwootId - ID de la conversación.
 */
export async function resolverConversacion(chatwootId) {
  const { CHATWOOT_ACCOUNT_ID } = process.env;
  return chatwootFetch(
    `/api/v1/accounts/${CHATWOOT_ACCOUNT_ID}/conversations/${chatwootId}/toggle_status`,
    { method: 'POST', body: JSON.stringify({ status: 'resolved' }) }
  );
}

/**
 * @description Actualiza el nombre/alias de un contacto en Chatwoot.
 * @param {number} contactId - ID del contacto en Chatwoot.
 * @param {string} name - Nuevo nombre/alias para el contacto.
 */
export async function actualizarContacto(contactId, name) {
  const { CHATWOOT_ACCOUNT_ID } = process.env;
  return chatwootFetch(`/api/v1/accounts/${CHATWOOT_ACCOUNT_ID}/contacts/${contactId}`, {
    method: 'PATCH',
    body: JSON.stringify({ name }),
  });
}

export async function derivarAHumano(phoneNumber, userText, reason, channel, collectedData = {}) {
  const { CHATWOOT_ACCOUNT_ID, CHATWOOT_INBOX_ID } = process.env;

  const contactId = await findOrCreateContact(phoneNumber, CHATWOOT_ACCOUNT_ID, channel);

  // Reusar conversación abierta existente para evitar duplicados en la bandeja.
  let conversationId;
  try {
    const contactConvs = await chatwootFetch(
      `/api/v1/accounts/${CHATWOOT_ACCOUNT_ID}/contacts/${contactId}/conversations`
    );
    const openConv = (contactConvs?.payload ?? []).find(
      (c) => c.status === 'open' && c.inbox_id === Number(CHATWOOT_INBOX_ID)
    );
    if (openConv) {
      conversationId = openConv.id;
      console.log(`[derivarAHumano] Reutilizando conversación abierta #${conversationId} para ${phoneNumber}`);
    }
  } catch (err) {
    console.warn(`[derivarAHumano] No se pudo verificar conversaciones existentes: ${err.message}`);
  }

  if (!conversationId) {
    const conversation = await chatwootFetch(`/api/v1/accounts/${CHATWOOT_ACCOUNT_ID}/conversations`, {
      method: 'POST',
      body: JSON.stringify({
        contact_id: contactId,
        inbox_id: Number(CHATWOOT_INBOX_ID),
      }),
    });
    conversationId = conversation.id;
  }

  const baseUrl = `/api/v1/accounts/${CHATWOOT_ACCOUNT_ID}/conversations/${conversationId}/messages`;

  // Mensaje entrante del cliente.
  await chatwootFetch(baseUrl, {
    method: 'POST',
    body: JSON.stringify({ content: userText ?? '(sin texto)', message_type: 'incoming' }),
  });

  // Nota privada con contexto para el equipo.
  const lines = [
    `**Canal:** ${CHANNEL_LABELS[channel] ?? channel}`,
    `**Motivo:** ${REASON_LABELS[reason] ?? reason}`,
  ];
  if (collectedData.destino) lines.push(`**Destino consultado:** ${collectedData.destino}`);
  if (collectedData.region) lines.push(`**Región:** ${collectedData.region}`);
  if (collectedData.codigoEvento) lines.push(`**Reunión agendada:** ${collectedData.codigoEvento}`);

  await chatwootFetch(baseUrl, {
    method: 'POST',
    body: JSON.stringify({ content: lines.join('\n'), private: true }),
  });

  return conversationId;
}
