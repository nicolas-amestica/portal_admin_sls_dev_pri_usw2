/**
 * Construye el contenido completo del contrato para el PDF
 */
export const buildContractData = (template, programData = {}) => {
  // Aquí puedes mezclar datos del template con datos del programa
  // Por ahora solo retornamos el template
  const contractData = {
    ...template,
    // Puedes agregar lógica para personalizar con programData
  };
  return contractData;
};
