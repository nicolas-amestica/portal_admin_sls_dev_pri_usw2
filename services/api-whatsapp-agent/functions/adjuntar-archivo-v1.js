import { uuidv7 } from 'uuidv7';
import * as dynamoDbLib from '../../../libs/dynamodb-v3.js';
import { parseEventBody } from '../../../helpers/event-parser.js';
import { success, unsuccessful } from '../../../helpers/responses.js';
import { obtenerConversacion, enviarAdjuntoChatwoot } from '../helpers/chatwoot-api.js';
import { uploadMedia, sendDocumentById, sendImageById } from '../helpers/whatsapp-api.js';
import { getObjectBuffer, deleteObject } from '../../../libs/s3-v3.js';
import { buildTurnItem } from '../mappers/map-conversacion-item.js';

const ACTION = 'Adjuntar archivo a conversación';
const MAX_FILE_SIZE_MB = 7;

/**
 * @description Descarga un adjunto desde S3, lo envía al cliente vía WhatsApp Media API
 * y lo registra en Chatwoot para que aparezca en el historial.
 * El frontend subió el archivo directamente a S3 usando la URL prefirmada de presign-adjunto-v1.
 *
 * Resolución del phone del cliente:
 * 1. Intenta el caché DynamoDB (CHATWOOT#<id> → PHONE) — evita llamar a Chatwoot.
 * 2. Si hay cache miss, llama a obtenerConversacion como fallback.
 *
 * @param {object} event - Evento HTTP con pathParameters.chatwootId
 *   y body { s3Key, fileName, mimeType, caption? }.
 */
export const main = async (event) => {
  try {
    const chatwootId = Number(event.pathParameters?.chatwootId);
    if (!chatwootId) {
      return unsuccessful(400, Object.assign(new Error('chatwootId es requerido'), { statusCode: 400 }), ACTION);
    }

    const { s3Key, fileName, mimeType, caption = '' } = parseEventBody(event);

    if (!s3Key || !fileName || !mimeType) {
      return unsuccessful(400, Object.assign(new Error('s3Key, fileName y mimeType son requeridos'), { statusCode: 400 }), ACTION);
    }

    const { CONVERSATIONS_TABLE, BUCKET_INFO_GI } = process.env;

    // Descargar el archivo desde S3 y resolver el phone en paralelo.
    const [buffer, phoneItem] = await Promise.all([
      getObjectBuffer({ Bucket: BUCKET_INFO_GI, Key: s3Key }),
      dynamoDbLib.getOne({ TableName: CONVERSATIONS_TABLE, Key: { pk: `CHATWOOT#${chatwootId}`, sk: 'PHONE' } }),
    ]);

    const fileSizeMB = buffer.length / (1024 * 1024);
    if (fileSizeMB > MAX_FILE_SIZE_MB) {
      return unsuccessful(400, Object.assign(new Error(`El archivo excede el límite de ${MAX_FILE_SIZE_MB} MB`), { statusCode: 400 }), ACTION);
    }

    console.log(`[${ACTION}] "${fileName}" (${mimeType}, ${fileSizeMB.toFixed(2)} MB) descargado desde S3`);

    // Resolver el phone del cliente: caché DynamoDB primero, Chatwoot como fallback.
    let phoneNumber = phoneItem?.phone ?? null;
    if (phoneNumber) {
      console.log(`[${ACTION}] Phone resuelto desde caché DynamoDB: ${phoneNumber}`);
    } else {
      console.log(`[${ACTION}] Cache miss — resolviendo phone desde Chatwoot`);
      const conv = await obtenerConversacion(chatwootId);
      const sender = conv.meta?.sender ?? {};
      phoneNumber = sender.phone_number || sender.identifier;
    }

    if (!phoneNumber) {
      return unsuccessful(400, Object.assign(new Error('No se pudo obtener el número del cliente'), { statusCode: 400 }), ACTION);
    }

    // Subir archivo a la Media API de WhatsApp y enviar al cliente.
    const mediaId = await uploadMedia(buffer, fileName, mimeType);
    if (mimeType.startsWith('image/')) {
      await sendImageById(phoneNumber, mediaId, caption);
    } else {
      await sendDocumentById(phoneNumber, mediaId, fileName, caption);
    }

    // Registrar en Chatwoot para que aparezca en el historial de la bandeja.
    // Caption omitido: ya viajó como leyenda del archivo en WhatsApp.
    try {
      await enviarAdjuntoChatwoot(chatwootId, buffer, fileName, mimeType);
    } catch (chatwootErr) {
      console.warn(`[${ACTION}] Archivo enviado pero no pudo registrarse en Chatwoot: ${chatwootErr.message}`);
    }

    // Write-through: guardar la caption en DynamoDB para que persista en el historial del portal.
    // La caption no se pasa a Chatwoot (evita reenvío como segundo mensaje de texto a WhatsApp).
    if (caption?.trim() && phoneItem?.phone) {
      const captionItem = buildTurnItem(phoneItem.phone, `MSG#${uuidv7()}`, 'team', caption.trim());
      dynamoDbLib.put({ TableName: CONVERSATIONS_TABLE, Item: captionItem }).catch((err) =>
        console.warn(`[${ACTION}] Write-through caption DynamoDB falló (no crítico): ${err.message}`)
      );
    }

    // Eliminar objeto temporal de S3 (fire and forget).
    deleteObject({ Bucket: BUCKET_INFO_GI, Key: s3Key }).catch((err) =>
      console.warn(`[${ACTION}] No se pudo eliminar objeto S3 "${s3Key}": ${err.message}`)
    );

    console.log(`[${ACTION}] "${fileName}" enviado a ${phoneNumber} en conversación ${chatwootId}`);
    return success(200, {}, ACTION);
  } catch (error) {
    console.error(`[${ACTION}] Error:`, error.message, error.stack);
    return unsuccessful(error.statusCode || 500, error, ACTION);
  }
};
