#!/usr/bin/env node
/**
 * scripts/seed-instagram-images.js
 *
 * Carga el pool inicial de imágenes en DynamoDB leyendo los objetos
 * que ya existen en S3 bajo el prefijo instagram/pool/.
 *
 * Uso:
 *   STAGE=dev node scripts/seed-instagram-images.js
 *
 * Requisitos:
 *   - AWS_PROFILE o credenciales configuradas
 *   - Las imágenes deben estar subidas previamente en S3:
 *     giras-indomito-{stage}-info/instagram/pool/{categoria}/{archivo.jpg}
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';

const STAGE = process.env.STAGE ?? 'dev';
const REGION = process.env.AWS_REGION ?? 'us-west-2';
const SHORT_REGION = 'usw2';
const BUCKET = `giras-indomito-${STAGE}-info`;
const PREFIX = 'instagram/pool/';
const TABLE = `ig-images-${STAGE}-pri-${SHORT_REGION}`;
const IMAGES_PK = 'IG#IMAGES';

const s3 = new S3Client({ region: REGION });
const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }));

/**
 * Infiere la categoría desde el path S3.
 * instagram/pool/aventura/foto.jpg → aventura
 */
const inferCategory = (key) => {
  const parts = key.replace(PREFIX, '').split('/');
  return parts.length >= 2 ? parts[0] : 'general';
};

const run = async () => {
  console.log(`[seed] Listando imágenes en s3://${BUCKET}/${PREFIX}`);

  const { Contents } = await s3.send(new ListObjectsV2Command({ Bucket: BUCKET, Prefix: PREFIX }));

  if (!Contents || Contents.length === 0) {
    console.error(`[seed] No se encontraron objetos en s3://${BUCKET}/${PREFIX}`);
    process.exit(1);
  }

  const images = Contents.filter(({ Key }) => /\.(jpe?g|png|webp)$/i.test(Key));
  console.log(`[seed] ${images.length} imágenes encontradas`);

  let seeded = 0;
  for (const { Key } of images) {
    const imageId = randomUUID();
    const category = inferCategory(Key);
    const s3Key = Key.replace(PREFIX, '');

    await dynamo.send(new PutCommand({
      TableName: TABLE,
      Item: {
        pk: IMAGES_PK,
        sk: imageId,
        s3Key,
        category,
        status: 'available',
        createdAt: new Date().toISOString(),
      },
      ConditionExpression: 'attribute_not_exists(sk)',
    })).catch((e) => {
      if (e.name !== 'ConditionalCheckFailedException') throw e;
    });

    seeded++;
    console.log(`[seed] ✓ ${category}/${s3Key}`);
  }

  console.log(`\n[seed] ✅ ${seeded} imágenes registradas en ${TABLE}`);
};

run().catch((e) => {
  console.error('[seed] Error:', e.message);
  process.exit(1);
});
