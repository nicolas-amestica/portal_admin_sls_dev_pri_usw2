import { buildDocumentData } from '../core/contract/builder.js';
import { success, unsuccessful } from "../../../helpers/responses.js";
import { generatePDF, loadImages } from '../../../libs/pdf-generator/index.js';

const {
  BUCKET_INFO_GI
} = process.env;

/**
 * Handler principal para generar contratos en PDF
 *
 * @param {Object} event - Evento de API Gateway
 * @returns {Object} Respuesta con PDF en base64
 */
export const main = async (event) => {
  console.log("Event ==>", JSON.stringify(event, null, 2));
  const action = "Generar documento pdf.";

  try {
    // 1. Validar parámetros
    console.log("Paso 1: Validando parámetros...");
    console.log("event.body tipo:", typeof event.body);
    console.log("event.isBase64Encoded:", event.isBase64Encoded);

    // Manejar body que puede venir en diferentes formatos
    let body;
    if (typeof event.body === 'string') {
      // Si está en base64, decodificarlo primero
      if (event.isBase64Encoded) {
        const decodedBody = Buffer.from(event.body, 'base64').toString('utf-8');
        console.log("Body decodificado de base64");
        body = JSON.parse(decodedBody);
      } else {
        body = JSON.parse(event.body);
      }
    } else {
      body = event.body;
    }

    const { documentData } = body;

    if (!documentData) {
      console.error("Error: Falta el formulario del documento");
      return unsuccessful(400, { message: 'Falta el formulario del documento.' }, action);
    }

    if (!documentData.contract) {
      console.error("Error: Falta el contrato en documentData");
      return unsuccessful(400, { message: 'Falta el contrato en el documento.' }, action);
    }

    // 2. Construir datos del documento dinámicamente
    console.log("Paso 2: Construyendo datos del documento...");
    const adaptedDocumentData = buildDocumentData(documentData.contract);
    console.log("Datos adaptados:", JSON.stringify(adaptedDocumentData, null, 2));

    // 3. Cargar imágenes desde S3
    console.log(`Paso 3: Cargando imágenes desde S3 (bucket: ${BUCKET_INFO_GI})...`);
    if (!BUCKET_INFO_GI) {
      console.error("Error: Variable de entorno BUCKET_INFO_GI no definida");
      return unsuccessful(500, { message: 'Configuración de bucket S3 no disponible.' }, action);
    }

    const { headerImage, footerImage } = await loadImages(
      BUCKET_INFO_GI,
      'assets/header.png',
      'assets/footer.png'
    );
    console.log("Imágenes cargadas exitosamente");

    // 4. Generar PDF
    console.log("Paso 4: Generando PDF...");
    const pdfBuffer = await generatePDF(adaptedDocumentData, headerImage, footerImage);

    if (!Buffer.isBuffer(pdfBuffer)) {
      console.error("Error: El PDF generado no es un buffer válido");
      return unsuccessful(500, { message: "El PDF generado no es un buffer válido" }, action);
    }

    console.log(`PDF generado exitosamente. Tamaño: ${pdfBuffer.length} bytes`);

    // 5. Retornar respuesta
    console.log("Paso 5: Retornando respuesta...");
    return success(200, { base64: pdfBuffer.toString('base64') }, action);
  } catch (e) {
    console.error("Error en generación de PDF:", {
      message: e.message,
      stack: e.stack,
      statusCode: e.statusCode,
      name: e.name
    });

    return unsuccessful(
      e.statusCode || 500,
      {
        message: e.message || 'Error desconocido al generar PDF',
        error: e.name,
        details: process.env.STAGE === 'dev' ? e.stack : undefined
      },
      action
    );
  }
};
