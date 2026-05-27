import { uuidv7 } from 'uuidv7';
import * as dynamoDbLib from '../../../libs/dynamodb-v3.js';
import { parseEventBody } from '../../../helpers/event-parser.js';
import { success, unsuccessful } from '../../../helpers/responses.js';
import { uploadMedia, sendDocumentById, sendImageById, sendAudioById } from '../helpers/whatsapp-api.js';
import { getObjectBuffer, deleteObject } from '../../../libs/s3-v3.js';
import { broadcastToScope, SCOPES } from '../../../libs/websocket.js';
import { upsertChatListItem } from '../helpers/chat-list-index.js';
import { prepareAudioForWhatsApp } from '../helpers/prepare-audio-for-whatsapp.js';
import { buildTurnItem, normalizePhone } from '../mappers/map-conversacion-item.js';

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
    const rawPhone = event.pathParameters?.phone;
    if (!rawPhone) {
      return unsuccessful(400, Object.assign(new Error('phone es requerido'), { statusCode: 400 }), ACTION);
    }

    const phone = normalizePhone(rawPhone);

    const { s3Key, fileName, mimeType, caption = '' } = parseEventBody(event);
    if (!s3Key || !fileName || !mimeType) {
      return unsuccessful(400, Object.assign(new Error('s3Key, fileName y mimeType son requeridos'), { statusCode: 400 }), ACTION);
    }

    if (typeof s3Key !== 'string' || !s3Key.startsWith('inbox-adjuntos/') || s3Key.includes('..')) {
      return unsuccessful(403, Object.assign(new Error('Clave S3 no permitida'), { statusCode: 403 }), ACTION);
    }

    const { CONVERSATIONS_TABLE, BUCKET_INFO_GI } = process.env;

    const buffer = await getObjectBuffer({ Bucket: BUCKET_INFO_GI, Key: s3Key });

    const fileSizeMB = buffer.length / (1024 * 1024);
    if (fileSizeMB > MAX_FILE_SIZE_MB) {
      return unsuccessful(400, Object.assign(new Error(`El archivo excede el límite de ${MAX_FILE_SIZE_MB} MB`), { statusCode: 400 }), ACTION);
    }

    console.log(`[${ACTION}] "${fileName}" (${mimeType}, ${fileSizeMB.toFixed(2)} MB) descargado desde S3`);

    const isAudio = mimeType.startsWith('audio/');
    let uploadBuffer = buffer;
    let uploadMime = mimeType;
    let uploadFileName = fileName;

    if (isAudio) {
      const prepared = await prepareAudioForWhatsApp(buffer, mimeType, fileName);
      uploadBuffer = prepared.buffer;
      uploadMime = prepared.mimeType;
      uploadFileName = prepared.fileName;
    }

    // Subir archivo a la Media API de WhatsApp y enviar al cliente.
    const mediaId = await uploadMedia(uploadBuffer, uploadFileName, uploadMime);
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
    const preview = caption?.trim() || `📎 ${fileName}`;
    const now = new Date().toISOString();

    await Promise.all([
      dynamoDbLib.put({ TableName: CONVERSATIONS_TABLE, Item: attachmentItem }),
      dynamoDbLib.update({
        TableName: CONVERSATIONS_TABLE,
        Key: { pk: 'INBOX', sk: `CONV#${phone}` },
        UpdateExpression: 'SET lastMessage = :txt, lastMessageAt = :now, unreadCount = :zero',
        ConditionExpression: 'attribute_exists(pk)',
        ExpressionAttributeValues: { ':txt': preview.slice(0, 200), ':now': now, ':zero': 0 },
      }).catch(() => {}),
      upsertChatListItem({
        phone,
        lastMessage: preview.slice(0, 200),
        lastMessageAt: now,
        unreadSet: 0,
      }),
    ]).catch((err) =>
      console.warn(`[${ACTION}] Write-through adjunto DynamoDB falló (no crítico): ${err.message}`)
    );

    // Eliminar objeto temporal de S3 (fire and forget).
    deleteObject({ Bucket: BUCKET_INFO_GI, Key: s3Key }).catch((err) =>
      console.warn(`[${ACTION}] No se pudo eliminar objeto S3 "${s3Key}": ${err.message}`)
    );

    // Propagar a otras pestañas.
    await Promise.allSettled([
      broadcastToScope({ phone }, { type: 'new_message', phone }),
      broadcastToScope(SCOPES.LIST, {
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
