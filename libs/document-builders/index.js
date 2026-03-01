import { buildDocumentData as buildCTTDocument } from './ctt-builder.js';
import { buildDocumentData as buildDBADocument } from './dba-builder.js';
import { buildDocumentData as buildDBRDocument } from './dbr-builder.js';

// PDF generators
export { generatePaymentReceipt } from './cpr-builder.js';

// Email data builders
export { buildContractEmailData } from './ctt-email-builder.js';
export { PAYMENT_RECEIPT } from './cpr-email-builder.js';

/**
 * Tipos de documentos soportados
 */
export const DOCUMENT_SCOPES = {
  CTT: 'CTT', // Contrato
  DBA: 'DBA', // Documento Borrador A
  DBR: 'DBR', // Documento Borrador R
};

/**
 * Mapeo de scopes a builders
 */
const BUILDERS = {
  [DOCUMENT_SCOPES.CTT]: buildCTTDocument,
  [DOCUMENT_SCOPES.DBA]: buildDBADocument,
  [DOCUMENT_SCOPES.DBR]: buildDBRDocument,
};

/**
 * Obtiene el builder adecuado según el scope
 *
 * @param {string} scope - Tipo de documento (CTT, DBA, DBR)
 * @returns {Function} Función builder para el tipo de documento
 * @throws {Error} Si el scope no es soportado
 */
export const getDocumentBuilder = (scope) => {
  const normalizedScope = scope?.toUpperCase();

  if (!normalizedScope) {
    throw new Error('El parámetro "scope" es requerido');
  }

  const builder = BUILDERS[normalizedScope];

  if (!builder) {
    throw new Error(
      `Scope "${scope}" no es soportado. Scopes válidos: ${Object.keys(DOCUMENT_SCOPES).join(', ')}`
    );
  }

  return builder;
};

/**
 * Valida que el scope sea soportado
 *
 * @param {string} scope - Tipo de documento
 * @returns {boolean} true si el scope es válido
 */
export const isValidScope = (scope) => {
  const normalizedScope = scope?.toUpperCase();
  return Object.values(DOCUMENT_SCOPES).includes(normalizedScope);
};

/**
 * Obtiene lista de scopes soportados
 *
 * @returns {Array<string>} Lista de scopes válidos
 */
export const getSupportedScopes = () => {
  return Object.values(DOCUMENT_SCOPES);
};
