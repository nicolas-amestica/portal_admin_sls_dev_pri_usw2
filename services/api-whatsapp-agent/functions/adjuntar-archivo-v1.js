import { uuidv7 } from 'uuidv7';
import * as dynamoDbLib from '../../../libs/dynamodb-v3.js';
import { parseEventBody } from '../../../helpers/event-parser.js';
import { success, unsuccessful } from '../../../helpers/responses.js';
import { uploadMedia, sendDocumentById, sendImageById, sendAudioById } from '../helpers/whatsapp-api.js';
import { getObjectBuffer, deleteObject } from '../../../libs/s3-v3.js';
import { broadcastToScope } from '../helpers/ws-broadcast.js';
import { buildTurnItem } from '../mappers/map-conversacion-item.js';

const ACTION = 'Adjuntar archivo a conversación';
const MAX_FILE_SIZE_MB = 7;

/**
 * @description Descarga un adjunto desde S3, lo envía al cliente vía WhatsApp Media API
 * y lo registra en DynamoDB para que aparezca en el historial del portal.
 *
 * @param {object} event - Evento HTTP con pathParameters.phone
 *   y body { s3Key, fileName, mimeType, caption? }.
 */
export const main = async (event) => {
  try {
    const phone = event.pathParameters?.phone;
    if (!phone) {
      return unsuccessful(400, Object.assign(new Error('phone es requerido'), { statusCode: 400 }), ACTION);
    }

    const { s3Key, fileName, mimeType, caption = '' } = parseEventBody(event);
    if (!s3Key || !fileName || !mimeType) {
      return unsuccessful(400, Object.assign(new Error('s3Key, fileName y mimeType son requeridos'), { statusCode: 400 }), ACTION);
    }

    const { CONVERSATIONS_TABLE, BUCKET_INFO_GI } = process.env;

    const buffer = await getObjectBuffer({ Bucket: BUCKET_INFO_GI, Key: s3Key });

    const fileSizeMB = buffer.length / (1024 * 1024);
    if (fileSizeMB > MAX_FILE_SIZE_MB) {
      return unsuccessful(400, Object.assign(new Error(`El archivo excede el límite de ${MAX_FILE_SIZE_MB} MB`), { statusCode: 400 }), ACTION);
    }

    console.log(`[${ACTION}] "${fileName}" (${mimeType}, ${fileSizeMB.toFixed(2)} MB) descargado desde S3`);

    // WhatsApp Cloud API no acepta audio/webm — remapear a audio/ogg (mismo codec Opus).
    const isAudio = mimeType.startsWith('audio/');
    const uploadMime = (mimeType === 'audio/webm') ? 'audio/ogg' : mimeType;
    const uploadFileName = (mimeType === 'audio/webm') ? fileName.replace(/\.webm$/, '.ogg') : fileName;

    // Subir archivo a la Media API de WhatsApp y enviar al cliente.
    const mediaId = await uploadMedia(buffer, uploadFileName, uploadMime);
    const phoneWithPrefix = `+${phone}`;
    if (mimeType.startsWith('image/')) {
      await sendImageById(phoneWithPrefix, mediaId, caption);
    } else if (isAudio) {
      await sendAudioById(phoneWithPrefix, mediaId);
    } else {
      await sendDocumentById(phoneWithPrefix, mediaId, fileName, caption);
    }

    // Write-through: guardar el adjunto en DynamoDB para el historial del portal.
    const attachmentItem = buildTurnItem(
      phone,
      `MSG#${uuidv7()}`,
      'team',
      caption?.trim() ?? '',
      [{ s3Key, fileName, mimeType }]
    );
    dynamoDbLib.put({ TableName: CONVERSATIONS_TABLE, Item: attachmentItem }).catch((err) =>
      console.warn(`[${ACTION}] Write-through adjunto DynamoDB falló (no crítico): ${err.message}`)
    );

    // Actualizar item INBOX con el último adjunto como preview.
    const preview = caption?.trim() || `📎 ${fileName}`;
    const now = new Date().toISOString();
    dynamoDbLib.update({
      TableName: CONVERSATIONS_TABLE,
      Key: { pk: 'INBOX', sk: `CONV#${phone}` },
      UpdateExpression: 'SET lastMessage = :txt, lastMessageAt = :now, unreadCount = :zero',
      ConditionExpression: 'attribute_exists(pk)',
      ExpressionAttributeValues: { ':txt': preview.slice(0, 200), ':now': now, ':zero': 0 },
    }).catch(() => {});

    // Eliminar objeto temporal de S3 (fire and forget).
    deleteObject({ Bucket: BUCKET_INFO_GI, Key: s3Key }).catch((err) =>
      console.warn(`[${ACTION}] No se pudo eliminar objeto S3 "${s3Key}": ${err.message}`)
    );

    // Propagar a otras pestañas.
    await Promise.allSettled([
      broadcastToScope({ phone }, { type: 'new_message', phone }),
      broadcastToScope('LIST', {
        type: 'conversation_updated',
        phone,
        lastMessage: preview.slice(0, 100),
        lastMessageAt: now,
      }),
    ]);

    console.log(`[${ACTION}] "${fileName}" enviado a ${phone}`);
    return success(200, {}, ACTION);
  } catch (error) {
    console.error(`[${ACTION}] Error:`, error.message, error.stack);
    return unsuccessful(error.statusCode || 500, error, ACTION);
  }
};
