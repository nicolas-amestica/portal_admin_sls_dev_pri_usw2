/**
 * Normaliza `clientRepresentative` del formulario a un arreglo homogéneo para el PDF.
 * Acepta objeto único (legado), arreglo o valores vacíos.
 *
 * @param {Object|Array<Object>|null|undefined} clientRepData
 * @returns {Array<Object>}
 */
export const normalizeClientRepresentatives = (clientRepData) => {
  if (clientRepData == null) {
    return [];
  }
  if (Array.isArray(clientRepData)) {
    return clientRepData.filter(
      (rep) => rep && typeof rep === 'object' && (rep.name || rep.dni)
    );
  }
  if (typeof clientRepData === 'object' && Object.keys(clientRepData).length > 0) {
    return [clientRepData];
  }
  return [];
};
