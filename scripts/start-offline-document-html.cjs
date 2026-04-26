/**
 * @description Equivale a npm start con solo api-document-html (ruta /v1/documentos/html-pdf vía proxy 3200).
 */
process.env.OFFLINE_SERVICES = 'api-document-html';
require('./run-offline-all.cjs');
