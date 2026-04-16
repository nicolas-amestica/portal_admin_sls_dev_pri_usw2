import { parseEventBody } from '../../../helpers/event-parser.js';
import { success, unsuccessful } from '../../../helpers/responses.js';
import { obtenerConversacion } from '../helpers/chatwoot-api.js';
import { uploadMedia, sendDocumentById, sendImageById } from '../helpers/whatsapp-api.js';

const ACTION = 'Adjuntar archivo a conversación';
const MAX_FILE_SIZE_MB = 7;

/**
 * @description Envía un archivo (PDF o imagen) al cliente de una conversación derivada.
 * Sube el archivo a la Media API de WhatsApp y lo envía directamente al número del cliente.
 * El texto del campo caption se incluye como leyenda del archivo si se proporciona.
 *
 * @param {object} event - Evento HTTP de API Gateway con pathParameters.chatwootId
 *   y body { fileBase64, fileName, mimeType, caption? }.
 */
export const main = async (event) => {
  try {
    const chatwootId = Number(event.pathParameters?.chatwootId);
    if (!chatwootId) {
      return unsuccessful(400, Object.assign(new Error('chatwootId es requerido'), { statusCode: 400 }), ACTION);
    }

    const { fileBase64, fileName, mimeType, caption = '' } = parseEventBody(event);

    if (!fileBase64 || !fileName || !mimeType) {
      return unsuccessful(400, Object.assign(new Error('fileBase64, fileName y mimeType son requeridos'), { statusCode: 400 }), ACTION);
    }

    const buffer = Buffer.from(fileBase64, 'base64');
    const fileSizeMB = buffer.length / (1024 * 1024);
    if (fileSizeMB > MAX_FILE_SIZE_MB) {
      return unsuccessful(400, Object.assign(new Error(`El archivo excede el límite de ${MAX_FILE_SIZE_MB} MB`), { statusCode: 400 }), ACTION);
    }

    // Obtener número del cliente desde la conversación de Chatwoot.
    const conv = await obtenerConversacion(chatwootId);
    const sender = conv.meta?.sender ?? {};
    const phoneNumber = sender.phone_number || sender.identifier;
    if (!phoneNumber) {
      return unsuccessful(400, Object.assign(new Error('No se pudo obtener el número del cliente'), { statusCode: 400 }), ACTION);
    }

    // Subir archivo a la Media API de WhatsApp.
    const mediaId = await uploadMedia(buffer, fileName, mimeType);

    // Enviar como imagen o documento según el tipo MIME.
    if (mimeType.startsWith('image/')) {
      await sendImageById(phoneNumber, mediaId, caption);
    } else {
      await sendDocumentById(phoneNumber, mediaId, fileName, caption);
    }

    console.log(`[${ACTION}] "${fileName}" (${mimeType}, ${fileSizeMB.toFixed(2)} MB) enviado a ${phoneNumber} en conversación ${chatwootId}`);
    return success(200, {}, ACTION);
  } catch (error) {
    console.error(`[${ACTION}] Error:`, error.message, error.stack);
    return unsuccessful(error.statusCode || 500, error, ACTION);
  }
};
