import axios from 'axios';

const DEFAULT_TIMEOUT_MS = 10_000;

/**
 * Opciones de reintento para requestWithRetry.
 */
const defaultRetryCondition = (error) =>
  !error.response || error.response.status >= 500;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Realiza una solicitud HTTP sin reintentos.
 */
export const request = async (config) => {
  const mergedConfig = { timeout: DEFAULT_TIMEOUT_MS, ...config };
  return axios(mergedConfig);
};

/**
 * Realiza una solicitud HTTP con reintentos y backoff exponencial.
 */
export const requestWithRetry = async (config, retryOptions = {}) => {
  const {
    retries = 3,
    delay = 500,
    factor = 2,
    retryCondition = defaultRetryCondition,
  } = retryOptions;

  const mergedConfig = { timeout: DEFAULT_TIMEOUT_MS, ...config };
  let lastError;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await axios(mergedConfig);
    } catch (error) {
      lastError = error;
      const isLastAttempt = attempt === retries;

      if (isLastAttempt || !retryCondition(error)) {
        throw error;
      }

      const waitMs = delay * Math.pow(factor, attempt);
      console.warn(`[http-client] Intento ${attempt + 1}/${retries} fallido para ${config.url}. Reintentando en ${waitMs}ms...`, {
        status: error.response?.status,
        message: error.message,
      });

      await sleep(waitMs);
    }
  }

  throw lastError;
};

/**
 * GET sin reintentos.
 */
export const get = (url, config = {}) =>
  request({ ...config, method: 'get', url });

/**
 * POST sin reintentos.
 */
export const post = (url, data, config = {}) =>
  request({ ...config, method: 'post', url, data });

/**
 * PUT sin reintentos.
 */
export const put = (url, data, config = {}) =>
  request({ ...config, method: 'put', url, data });

/**
 * DELETE sin reintentos.
 */
export const del = (url, config = {}) =>
  request({ ...config, method: 'delete', url });

/**
 * GET con reintentos.
 */
export const getWithRetry = (url, config = {}, retryOptions = {}) =>
  requestWithRetry({ ...config, method: 'get', url }, retryOptions);

/**
 * POST con reintentos.
 */
export const postWithRetry = (url, data, config = {}, retryOptions = {}) =>
  requestWithRetry({ ...config, method: 'post', url, data }, retryOptions);

/**
 * PUT con reintentos.
 */
export const putWithRetry = (url, data, config = {}, retryOptions = {}) =>
  requestWithRetry({ ...config, method: 'put', url, data }, retryOptions);

/**
 * DELETE con reintentos.
 */
export const delWithRetry = (url, config = {}, retryOptions = {}) =>
  requestWithRetry({ ...config, method: 'delete', url }, retryOptions);

export default {
  request,
  requestWithRetry,
  get,
  post,
  put,
  delete: del,
  getWithRetry,
  postWithRetry,
  putWithRetry,
  delWithRetry,
};
