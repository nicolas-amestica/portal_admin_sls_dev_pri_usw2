import * as httpClient from '../../../libs/axios.js';

const GRAPH_API_BASE = 'https://graph.facebook.com/v19.0';

/**
 * Crea un media container en Instagram (paso 1 de 2 para publicar).
 * @param {string} userId - IG User ID
 * @param {string} accessToken
 * @param {string} imageUrl - URL pública (o prefirmada S3) de la imagen
 * @param {string} caption
 * @returns {Promise<string>} containerId
 */
const createMediaContainer = async (userId, accessToken, imageUrl, caption) => {
  const { data } = await httpClient.postWithRetry(
    `${GRAPH_API_BASE}/${userId}/media`,
    new URLSearchParams({ image_url: imageUrl, caption, access_token: accessToken }).toString(),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
    { retries: 2, delay: 1000 }
  );

  if (!data?.id) throw new Error(`Meta API: no se obtuvo containerId. Response: ${JSON.stringify(data)}`);
  return data.id;
};

/**
 * Publica un media container previamente creado (paso 2 de 2).
 * @param {string} userId
 * @param {string} accessToken
 * @param {string} containerId
 * @returns {Promise<string>} igMediaId
 */
const publishMediaContainer = async (userId, accessToken, containerId) => {
  const { data } = await httpClient.postWithRetry(
    `${GRAPH_API_BASE}/${userId}/media_publish`,
    new URLSearchParams({ creation_id: containerId, access_token: accessToken }).toString(),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
    { retries: 2, delay: 1000 }
  );

  if (!data?.id) throw new Error(`Meta API: no se obtuvo igMediaId. Response: ${JSON.stringify(data)}`);
  return data.id;
};

/**
 * Flujo completo: crea container → publica → retorna igMediaId.
 * @param {string} userId
 * @param {string} accessToken
 * @param {string} imageUrl
 * @param {string} caption
 * @returns {Promise<string>} igMediaId
 */
export const publishToInstagram = async (userId, accessToken, imageUrl, caption) => {
  const containerId = await createMediaContainer(userId, accessToken, imageUrl, caption);
  return publishMediaContainer(userId, accessToken, containerId);
};

/**
 * Refresca un Long-Lived Token de Instagram (válido 60 días).
 * @param {string} accessToken - Token actual (debe ser Long-Lived)
 * @returns {Promise<string>} Nuevo access token
 */
export const refreshLongLivedToken = async (accessToken) => {
  const { data } = await httpClient.getWithRetry(
    `${GRAPH_API_BASE}/oauth/access_token`,
    {
      params: {
        grant_type: 'ig_refresh_token',
        access_token: accessToken,
      },
    },
    { retries: 2, delay: 1000 }
  );

  if (!data?.access_token) throw new Error(`Meta API: no se obtuvo nuevo token. Response: ${JSON.stringify(data)}`);
  return data.access_token;
};

export default { publishToInstagram, refreshLongLivedToken };
