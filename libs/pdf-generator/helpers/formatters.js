/**
 * Formatea fecha en español
 * @param {string} dateString - Fecha en formato DD-MM-YYYY o ISO
 * @returns {Object} Objeto con formato completo y simple
 */
export const formatDate = (dateString) => {
  let date;

  // Si viene en formato DD-MM-YYYY, parsear manualmente
  if (dateString.includes('-') && dateString.split('-')[0].length <= 2) {
    const [day, month, year] = dateString.split('-');
    date = new Date(year, month - 1, day); // month - 1 porque Date usa 0-11
  } else {
    date = new Date(dateString);
  }

  const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
                  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const days = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

  return {
    full: `${days[date.getDay()]} ${date.getDate()} de ${months[date.getMonth()]} de ${date.getFullYear()}`,
    simple: `${date.getDate()} de ${months[date.getMonth()]} de ${date.getFullYear()}`
  };
};

/**
 * Formatea número como moneda chilena
 * @param {number} amount - Monto a formatear
 * @returns {string} Monto formateado
 */
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0
  }).format(amount);
};

/**
 * Sanitiza y formatea RUT chileno
 * @param {string} rut - RUT sin formato
 * @returns {string} RUT formateado con puntos y guión
 */
export const sanitizeRut = (rut) => {
  if (!rut) return "";

  const cleanRut = rut.replace(/\./g, "").replace(/-/g, "");
  const rutBody = cleanRut.slice(0, -1);
  const rutDv = cleanRut.slice(-1);
  const formattedBody = rutBody.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

  return `${formattedBody}-${rutDv}`;
};
