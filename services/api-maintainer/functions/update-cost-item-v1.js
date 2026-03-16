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
 * Actualiza un item existente del catálogo del mantenedor.
 * Modifica: label, active, category, priceType y precio del año actual.
 * El historial de precios de años anteriores se preserva.
 *
 * Body (JSON):
 *  - pk        (requerido) - Partition Key del catálogo (ej: 'COST_ITEM').
 *  - sk        (requerido) - Sort Key del item a actualizar.
 *  - label     (requerido) - Nuevo nombre del item.
 *  - category  (requerido) - Categoría del servicio.
 *  - priceType (requerido) - Tipo de cálculo del precio.
 *  - price     (requerido) - Precio del año actual.
 *  - currency  (requerido) - Moneda del precio: 'clp', 'usd', 'brl'.
 *  - active    (requerido) - Estado activo del item.
 */
const handler = async (event) => {
  const action = "Actualizar item del mantenedor.";
  const { pk, sk, label, price, active, category, priceType, currency } = event.body ?? {};

  if (!pk || !ALLOWED_PKS.has(pk) || !sk) {
    const error = new Error('Los campos "pk" y "sk" son requeridos y deben ser válidos.');
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

  const normalizedCurrency = String(currency ?? 'clp').toLowerCase();
  if (!VALID_CURRENCIES.has(normalizedCurrency)) {
    const error = new Error(`Moneda no válida. Valores permitidos: ${[...VALID_CURRENCIES].join(', ')}.`);
    error.statusCode = 400;
    throw error;
  }

  const updated = await dynamoDb.update({
    TableName: DYNAMODB_MAINTAINER_TABLE,
    Key: { pk, sk },
    UpdateExpression: [
      'SET #label = :label',
      '#active = :active',
      '#category = :category',
      '#priceType = :priceType',
      '#currency = :currency',
      'prices.#year = :price',
      '#updatedAt = :updatedAt',
    ].join(', '),
    ConditionExpression: 'attribute_exists(sk)',
    ExpressionAttributeNames: {
      '#label': 'label',
      '#active': 'active',
      '#category': 'category',
      '#priceType': 'priceType',
      '#currency': 'currency',
      '#year': CURRENT_YEAR,
      '#updatedAt': 'updatedAt',
    },
    ExpressionAttributeValues: {
      ':label': label.trim(),
      ':active': Boolean(active),
      ':category': category,
      ':priceType': priceType,
      ':currency': normalizedCurrency,
      ':price': Number(price) || 0,
      ':updatedAt': new Date().toISOString(),
    },
  });

  return success(200, { ...updated, price: updated?.prices?.[CURRENT_YEAR] ?? 0 }, action);
};

export const main = standardMiddleware(handler);
