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
 * @description Busca un contacto por número de teléfono en Chatwoot.
 * Si no existe, lo crea. Retorna el ID del contacto.
 * @param {string} phoneNumber - Número en formato E.164 (ej. +56912345678).
 * @param {string} accountId - ID de la cuenta Chatwoot.
 * @returns {Promise<number>} ID del contacto.
 */
async function findOrCreateContact(phoneNumber, accountId) {
  const searchResult = await chatwootFetch(
    `/api/v1/accounts/${accountId}/contacts/search?q=${encodeURIComponent(phoneNumber)}&page=1`
  );

  // Compatibilidad con Chatwoot v2 (payload: array) y v3 (payload: { contacts: array })
  const contacts = Array.isArray(searchResult.payload)
    ? searchResult.payload
    : (searchResult.payload?.contacts ?? []);

  const existing = contacts.find((c) => c.phone_number === phoneNumber);
  if (existing) return existing.id;

  try {
    const contact = await chatwootFetch(`/api/v1/accounts/${accountId}/contacts`, {
      method: 'POST',
      body: JSON.stringify({ phone_number: phoneNumber, name: phoneNumber }),
    });
    return contact.id;
  } catch (err) {
    // Si el teléfono ya existe con otro formato, buscarlo por texto libre y reutilizarlo.
    if (err.status === 422) {
      const retry = await chatwootFetch(
        `/api/v1/accounts/${accountId}/contacts/search?q=${encodeURIComponent(phoneNumber.replace('+', ''))}&page=1`
      );
      const retryContacts = Array.isArray(retry.payload) ? retry.payload : (retry.payload?.contacts ?? []);
      if (retryContacts.length > 0) return retryContacts[0].id;
    }
    throw err;
  }
}

/**
 * @description Crea una conversación en Chatwoot cuando el agente no puede responder.
 * Incluye el mensaje del cliente como mensaje entrante y una nota privada con el contexto
 * de la derivación (canal, motivo y datos recopilados).
 *
 * @param {string} phoneNumber - Número o ID del cliente.
 * @param {string} userText - Mensaje original del cliente.
 * @param {'sin_presupuesto'|'sin_respuesta'|'error_gemini'} reason - Motivo de derivación.
 * @param {string} channel - Canal de origen ('whatsapp', 'messenger', 'instagram').
 * @param {object} [collectedData] - Datos recopilados por el agente antes de derivar.
 */
export async function derivarAHumano(phoneNumber, userText, reason, channel, collectedData = {}) {
  const { CHATWOOT_ACCOUNT_ID, CHATWOOT_INBOX_ID } = process.env;

  const contactId = await findOrCreateContact(phoneNumber, CHATWOOT_ACCOUNT_ID);

  const conversation = await chatwootFetch(`/api/v1/accounts/${CHATWOOT_ACCOUNT_ID}/conversations`, {
    method: 'POST',
    body: JSON.stringify({
      contact_id: contactId,
      inbox_id: Number(CHATWOOT_INBOX_ID),
    }),
  });

  const conversationId = conversation.id;
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
}
