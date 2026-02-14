/**
 * Builder para documentos de tipo DBR (Documento Borrador R)
 *
 * Este builder genera la estructura de datos necesaria para crear un PDF
 * de tipo DBR.
 *
 * TODO: Implementar lógica específica para documentos DBR
 */

/**
 * Construye el contenido del documento DBR para el PDF
 *
 * @param {Object} form - Datos del formulario DBR
 * @returns {Object} Estructura de datos para generar el PDF
 */
export const buildDocumentData = (form = {}) => {
  // TODO: Implementar la construcción de datos para DBR
  // Por ahora retorna una estructura básica placeholder

  return {
    title: "DOCUMENTO TIPO DBR",
    generalData: "Este es un documento placeholder para DBR. Pendiente de implementación.",
    clauses: [
      {
        number: 1,
        title: "INFORMACIÓN:",
        text: "La estructura de este documento debe ser definida según los requerimientos específicos del tipo DBR."
      }
    ],
    signatures: {
      operators: [],
      clients: [],
      companyName: 'GIRAS INDÓMITO LIMITADA',
      companyRut: ''
    }
  };
};
