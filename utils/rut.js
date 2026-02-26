/**
 * Elimina puntos y guión de un RUT/DNI chileno para búsqueda o comparación.
 */
export const cleanRut = (rut) => rut.replace(/\./g, "").replace(/-/g, "");
