import { success } from "../../../helpers/responses.js";
import { standardMiddleware } from "../../../libs/middleware/index.js";
import * as dynamoDb from "../../../libs/dynamodb-v3.js";

const { DYNAMODB_MAINTAINER_TABLE } = process.env;
const CURRENT_YEAR = String(new Date().getFullYear());

/** PKs administrables por este endpoint. */
const ALLOWED_PKS = new Set(['COST_ITEM']);

/** Categorías válidas para ítems de costo. */
const VALID_CATEGORIES = new Set([
  'administrativo', 'alimentacion', 'actividad', 'personal', 'transporte', 'alojamiento',
]);

/** Tipos de precio válidos para ítems de costo. */
const VALID_PRICE_TYPES = new Set(['per_passenger_once', 'per_passenger_night', 'unique']);

/** Monedas válidas para ítems de costo. */
const VALID_CURRENCIES = new Set(['clp', 'usd', 'brl']);

/**
 * Crea un nuevo item en el catálogo del mantenedor.
 *
 * Body (JSON):
 *  - pk        (requerido) - Partition Key del catálogo (ej: 'COST_ITEM').
 *  - label     (requerido) - Nombre del item (mínimo 2 caracteres).
 *  - category  (requerido) - Categoría del servicio (ej: 'transporte').
 *  - priceType (requerido) - Tipo de cálculo del precio (ej: 'per_passenger_once').
 *  - currency  (opcional)  - Moneda del precio: 'clp', 'usd', 'brl' (default: 'clp').
 *  - price     (opcional)  - Precio del año actual (default: 0).
 *  - active    (opcional)  - Estado activo (default: true).
 */
const handler = async (event) => {
  const action = "Crear item en el mantenedor.";
  const { pk, label, price, active = true, category, priceType, currency = 'clp' } = event.body ?? {};

  if (!pk || !ALLOWED_PKS.has(pk)) {
    const error = new Error(`Catálogo no válido. Valores permitidos: ${[...ALLOWED_PKS].join(', ')}.`);
    error.statusCode = 400;
    throw error;
  }

  if (!label || typeof label !== 'string' || label.trim().length < 2) {
    const error = new Error('El campo "label" es requerido (mínimo 2 caracteres).');
    error.statusCode = 400;
    throw error;
  }

  if (!category || !VALID_CATEGORIES.has(category)) {
    const error = new Error(`Categoría no válida. Valores permitidos: ${[...VALID_CATEGORIES].join(', ')}.`);
    error.statusCode = 400;
    throw error;
  }

  if (!priceType || !VALID_PRICE_TYPES.has(priceType)) {
    const error = new Error(`Tipo de precio no válido. Valores permitidos: ${[...VALID_PRICE_TYPES].join(', ')}.`);
    error.statusCode = 400;
    throw error;
  }

  const normalizedCurrency = String(currency).toLowerCase();
  if (!VALID_CURRENCIES.has(normalizedCurrency)) {
    const error = new Error(`Moneda no válida. Valores permitidos: ${[...VALID_CURRENCIES].join(', ')}.`);
    error.statusCode = 400;
    throw error;
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  const item = {
    pk,
    sk: `${pk}#${id}`,
    label: label.trim(),
    active: Boolean(active),
    category,
    priceType,
    currency: normalizedCurrency,
    prices: { [CURRENT_YEAR]: Number(price) || 0 },
    createdAt: now,
    updatedAt: now,
  };

  await dynamoDb.put({
    TableName: DYNAMODB_MAINTAINER_TABLE,
    ConditionExpression: 'attribute_not_exists(sk)',
    Item: item,
  });

  return success(201, { ...item, price: item.prices[CURRENT_YEAR] }, action);
};

export const main = standardMiddleware(handler);
