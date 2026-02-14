/**
 * Builder para documentos de tipo DBA (Documento Borrador A)
 *
 * Este builder genera la estructura de datos necesaria para crear un PDF
 * de tipo DBA.
 *
 * TODO: Implementar lógica específica para documentos DBA
 */

/**
 * Construye el contenido del documento DBA para el PDF
 *
 * @param {Object} form - Datos del formulario DBA
 * @returns {Object} Estructura de datos para generar el PDF
 */
export const buildDocumentData = (form = {}) => {
  // TODO: Implementar la construcción de datos para DBA
  // Por ahora retorna una estructura básica placeholder

  return {
    title: "DOCUMENTO TIPO DBA",
    generalData: "Este es un documento placeholder para DBA. Pendiente de implementación.",
    clauses: [
      {
        number: 1,
        title: "INFORMACIÓN:",
        text: "La estructura de este documento debe ser definida según los requerimientos específicos del tipo DBA."
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
