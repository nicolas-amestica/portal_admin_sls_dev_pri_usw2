/**
 * Resuelve un array de promesas y retorna los resultados exitosos y los rechazados.
 *
 * @async
 * @param {Promise[]} promises - Un array de promesas a resolver.
 * @param {string|null} [destructure=null] - Si se proporciona, extrae la propiedad especificada de cada valor resuelto.
 * @returns {Promise<Array>} Una promesa que resuelve a un array con dos elementos:
 *   - El primer elemento es un array con los valores exitosos (puede estar aplanado si los valores son arrays).
 *   - El segundo elemento es un array con los resultados rechazados.
 */
export const resolvePromises = async (promises, destructure = null) => {
  const success = [];
  const responses = await Promise.allSettled(promises);
  const fulfills = responses.filter(
    (item) => item.status === "fulfilled" && item.value !== undefined
  );
  fulfills.forEach(({ value }) => {
    if (Array.isArray(value)) return success.push(...value);
    if (destructure) return success.push(value[destructure]);

    return success.push(value);
  });
  const rejected = responses.filter((item) => item.status === "rejected");

  return [success, rejected];
};