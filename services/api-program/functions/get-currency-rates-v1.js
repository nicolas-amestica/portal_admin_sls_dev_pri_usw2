import { getWithRetry } from '../../../libs/axios.js';
import { success } from '../../../helpers/responses';
import { standardMiddleware } from '../../../libs/middleware/index.js';
import { cache, CacheKeys } from '../../../libs/cache/index.js';

const BASE_URL = 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies';
const ACTION = 'Obtención de tasas de cambio USD y BRL a CLP.';
const TIMEOUT_MS = 10_000;
const RETRY_OPTIONS = { retries: 3, delay: 500, factor: 2 };

const handler = async () => {
  const cacheKey = CacheKeys.currencyRates();
  const cached = cache.get(cacheKey);

  if (cached) {
    console.log('CACHE_HIT', { key: cacheKey });
    return success(200, cached, ACTION);
  }

  console.log('CACHE_MISS', { key: cacheKey });

  let usdRes, brlRes;

  try {
    [usdRes, brlRes] = await Promise.all([
      getWithRetry(`${BASE_URL}/usd.json`, { timeout: TIMEOUT_MS }, RETRY_OPTIONS),
      getWithRetry(`${BASE_URL}/brl.json`, { timeout: TIMEOUT_MS }, RETRY_OPTIONS),
    ]);
  } catch (err) {
    throw new Error(`Error consultando API de tasas de cambio: ${err.message}`);
  }

  const usdClp = usdRes.data?.usd?.clp;
  const brlClp = brlRes.data?.brl?.clp;

  if (!usdClp || !brlClp)
    throw new Error(`Respuesta inesperada de la API: usd.clp=${usdClp}, brl.clp=${brlClp}`);

  if (usdRes.data.date !== brlRes.data.date)
    console.warn(`Fechas inconsistentes: USD=${usdRes.data.date}, BRL=${brlRes.data.date}`);

  const data = {
    date: usdRes.data.date,
    usd: { clp: Math.round(usdClp) },
    brl: { clp: Math.round(brlClp) },
  };

  cache.set(cacheKey, data, CacheKeys.TTL.CURRENCY_RATES);
  console.log('CACHE_SET', { key: cacheKey, ttl: `${CacheKeys.TTL.CURRENCY_RATES}ms` });

  return success(200, data, ACTION);
};

export const main = standardMiddleware(handler);
