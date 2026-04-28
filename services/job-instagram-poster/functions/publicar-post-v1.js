import * as dynamoDbLib from '../../../libs/dynamodb-v3.js';
import * as s3Lib from '../../../libs/s3-v3.js';
import { getParameterValue } from '../../../libs/parameter-store.js';
import { generateCaption } from '../helpers/gemini-caption-api.js';
import { publishToInstagram } from '../helpers/instagram-api.js';
import { randomUUID } from 'crypto';

const { IMAGES_TABLE, POSTS_TABLE, BUCKET_INSTAGRAM } = process.env;

// Prefijo S3 donde viven las imágenes del pool de Instagram
const IG_IMAGES_PREFIX = 'instagram/pool/';
// Partición fija para todas las imágenes del pool
const IMAGES_PK = 'IG#IMAGES';
// Partición fija para el historial de posts
const POSTS_PK = 'IG#POSTS';

/**
 * Obtiene una imagen disponible del pool (status = 'available') vía GSI.
 * Fallback: si todas están usadas, las resetea y elige de nuevo (pool cíclico).
 */
const getAvailableImage = async () => {
  let items = await dynamoDbLib.query({
    TableName: IMAGES_TABLE,
    IndexName: 'status-index',
    KeyConditionExpression: '#status = :available',
    ExpressionAttributeNames: { '#status': 'status' },
    ExpressionAttributeValues: { ':available': 'available' },
    Limit: 10,
  });

  // Pool cíclico: si no hay disponibles, resetear todas a 'available'
  if (!items || items.length === 0) {
    console.log('[instagram-poster] Pool agotado — reseteando imágenes a disponible');
    const allItems = await dynamoDbLib.query({
      TableName: IMAGES_TABLE,
      KeyConditionExpression: 'pk = :pk',
      ExpressionAttributeValues: { ':pk': IMAGES_PK },
    });

    if (!allItems || allItems.length === 0) throw new Error('No hay imágenes en el pool de Instagram');

    await Promise.all(
      allItems.map((img) =>
        dynamoDbLib.update({
          TableName: IMAGES_TABLE,
          Key: { pk: img.pk, sk: img.sk },
          UpdateExpression: 'SET #status = :available REMOVE usedAt',
          ExpressionAttributeNames: { '#status': 'status' },
          ExpressionAttributeValues: { ':available': 'available' },
        })
      )
    );

    items = allItems;
  }

  // Elegir aleatoriamente entre las disponibles para evitar repetición de orden
  return items[Math.floor(Math.random() * items.length)];
};

/**
 * Handler principal: genera caption con IA y publica en Instagram.
 * Trigger: EventBridge cron L/M/V 14:00 UTC
 */
export const main = async () => {
  console.log('[instagram-poster] Iniciando publicación programada');

  // 1. Obtener secrets desde SSM (cacheados en el proceso Lambda por warm starts)
  const [geminiSecretJson, igConfigRaw] = await Promise.all([
    getParameterValue(process.env.GEMINI_SECRET_KEY),
    getParameterValue(process.env.IG_SECRET_KEY),
  ]);
  const igConfig = JSON.parse(igConfigRaw); // { userId, accessToken }

  // 2. Obtener imagen del pool
  const image = await getAvailableImage();
  console.log(`[instagram-poster] Imagen seleccionada: ${image.sk} (categoría: ${image.category})`);

  // 3. Generar URL prefirmada S3 (válida 10 min — suficiente para Meta Graph API)
  const imageUrl = await s3Lib.getPresignedUrl(
    { Bucket: BUCKET_INSTAGRAM, Key: `${IG_IMAGES_PREFIX}${image.s3Key}` },
    600
  );

  // 4. Generar caption con Anthropic API
  const caption = await generateCaption(geminiSecretJson, image.category);
  console.log(`[instagram-poster] Caption generado: ${caption.slice(0, 80)}...`);

  // 5. Publicar en Instagram
  const igMediaId = await publishToInstagram(igConfig.userId, igConfig.accessToken, imageUrl, caption);
  console.log(`[instagram-poster] Publicado. igMediaId: ${igMediaId}`);

  // 6. Registrar post en historial
  const now = new Date().toISOString();
  const postId = randomUUID();
  await dynamoDbLib.put({
    TableName: POSTS_TABLE,
    Item: {
      pk: POSTS_PK,
      sk: now,
      postId,
      igMediaId,
      caption,
      imageId: image.sk,
      category: image.category,
      createdAt: now,
    },
  });

  // 7. Marcar imagen como usada
  await dynamoDbLib.update({
    TableName: IMAGES_TABLE,
    Key: { pk: image.pk, sk: image.sk },
    UpdateExpression: 'SET #status = :used, usedAt = :now',
    ExpressionAttributeNames: { '#status': 'status' },
    ExpressionAttributeValues: { ':used': 'used', ':now': now },
  });

  console.log(`[instagram-poster] ✓ Post registrado. postId: ${postId}`);
  return { postId, igMediaId, category: image.category };
};
