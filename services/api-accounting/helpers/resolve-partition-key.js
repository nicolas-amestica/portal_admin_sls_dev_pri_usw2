/**
 * @description Decodifica el query/body param `pk` (partition key Dynamo, ej. USR%23uuid).
 * @param {string|undefined} pk - Valor del parámetro pk.
 * @returns {string|null} Partition key o null.
 */
export function decodeAccountingPk(pk) {
  if (!pk || typeof pk !== 'string') return null;
  try {
    return decodeURIComponent(pk);
  } catch {
    return String(pk);
  }
}
