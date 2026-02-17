import axios from 'axios';

const DEFAULT_TIMEOUT_MS = 10_000;

/**
 * Opciones de reintento para requestWithRetry.
 *
 * @typedef {Object} RetryOptions
 * @property {number} [retries=3]          - Número máximo de reintentos.
 * @property {number} [delay=500]          - Delay base en ms entre reintentos.
 * @property {number} [factor=2]           - Factor multiplicador para backoff exponencial.
 * @property {Function} [retryCondition]   - Función `(error) => boolean` que decide si reintentar.
 *                                           Por defecto reintenta en errores de red o status >= 500.
 */

const defaultRetryCondition = (error) =>
  !error.response || error.response.status >= 500;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Realiza una solicitud HTTP sin reintentos.
 *
 * @async
 * @param {import('axios').AxiosRequestConfig} config - Configuración de la solicitud.
 * @returns {Promise<import('axios').AxiosResponse>}
 */
export const request = async (config) => {
  const mergedConfig = { timeout: DEFAULT_TIMEOUT_MS, ...config };
  return axios(mergedConfig);
};

/**
 * Realiza una solicitud HTTP con reintentos y backoff exponencial.
 *
 * @async
 * @param {import('axios').AxiosRequestConfig} config - Configuración de la solicitud.
 * @param {RetryOptions} [retryOptions={}]
 * @returns {Promise<import('axios').AxiosResponse>}
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
 *
 * @param {string} url
 * @param {import('axios').AxiosRequestConfig} [config={}]
 */
export const get = (url, config = {}) =>
  request({ ...config, method: 'get', url });

/**
 * POST sin reintentos.
 *
 * @param {string} url
 * @param {*} data
 * @param {import('axios').AxiosRequestConfig} [config={}]
 */
export const post = (url, data, config = {}) =>
  request({ ...config, method: 'post', url, data });

/**
 * PUT sin reintentos.
 *
 * @param {string} url
 * @param {*} data
 * @param {import('axios').AxiosRequestConfig} [config={}]
 */
export const put = (url, data, config = {}) =>
  request({ ...config, method: 'put', url, data });

/**
 * DELETE sin reintentos.
 *
 * @param {string} url
 * @param {import('axios').AxiosRequestConfig} [config={}]
 */
export const del = (url, config = {}) =>
  request({ ...config, method: 'delete', url });

/**
 * GET con reintentos.
 *
 * @param {string} url
 * @param {import('axios').AxiosRequestConfig} [config={}]
 * @param {RetryOptions} [retryOptions={}]
 */
export const getWithRetry = (url, config = {}, retryOptions = {}) =>
  requestWithRetry({ ...config, method: 'get', url }, retryOptions);

/**
 * POST con reintentos.
 *
 * @param {string} url
 * @param {*} data
 * @param {import('axios').AxiosRequestConfig} [config={}]
 * @param {RetryOptions} [retryOptions={}]
 */
export const postWithRetry = (url, data, config = {}, retryOptions = {}) =>
  requestWithRetry({ ...config, method: 'post', url, data }, retryOptions);

/**
 * PUT con reintentos.
 *
 * @param {string} url
 * @param {*} data
 * @param {import('axios').AxiosRequestConfig} [config={}]
 * @param {RetryOptions} [retryOptions={}]
 */
export const putWithRetry = (url, data, config = {}, retryOptions = {}) =>
  requestWithRetry({ ...config, method: 'put', url, data }, retryOptions);

/**
 * DELETE con reintentos.
 *
 * @param {string} url
 * @param {import('axios').AxiosRequestConfig} [config={}]
 * @param {RetryOptions} [retryOptions={}]
 */
export const delWithRetry = (url, config = {}, retryOptions = {}) =>
  requestWithRetry({ ...config, method: 'delete', url }, retryOptions);
