/**
 * @description Backfill único: indexa sesiones CONV# existentes en la partición CHATS.
 * Uso: AWS_PROFILE=pa-dev node scripts/backfill-chats-index.mjs dev
 *
 * Nota: usa Scan filtrado (solo migración one-shot; la lógica runtime usa Query sobre CHATS).
 */
import { DynamoDBClient, ScanCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';

const stage = process.argv[2] ?? 'dev';
const region = process.argv[3] ?? 'us-west-2';
const tableName = `conversations-${stage}-pri-usw2`;
const CHATS_PK = 'CHATS';

const client = new DynamoDBClient({ region });

/**
 * @description Indexa una sesión CONV# en CHATS.
 */
async function indexSession(session) {
  const phone = session.phoneNumber ?? session.pk?.replace(/^CONV#/, '');
  if (!phone) return false;

  const now = session.lastMessageAt ?? session.updatedAt ?? new Date().toISOString();
  const ttl = Math.floor(Date.now() / 1000) + 90 * 24 * 60 * 60;

  await client.send(
    new UpdateItemCommand({
      TableName: tableName,
      Key: {
        pk: { S: CHATS_PK },
        sk: { S: `CONV#${phone}` },
      },
      UpdateExpression:
        'SET phone = if_not_exists(phone, :phone), contactName = if_not_exists(contactName, :cn), channel = if_not_exists(channel, :ch), lastMessage = if_not_exists(lastMessage, :msg), lastMessageAt = if_not_exists(lastMessageAt, :lma), #s = if_not_exists(#s, :status), unreadCount = if_not_exists(unreadCount, :zero), createdAt = if_not_exists(createdAt, :now), updatedAt = :now, #ttl = :ttl',
      ExpressionAttributeNames: { '#s': 'status', '#ttl': 'ttl' },
      ExpressionAttributeValues: {
        ':phone': { S: phone },
        ':cn': { S: session.contactName ?? phone },
        ':ch': { S: session.channel ?? 'whatsapp' },
        ':msg': { S: (session.lastMessageText ?? '').slice(0, 200) },
        ':lma': { S: now },
        ':status': { S: session.status === 'derived' ? 'derived' : 'bot' },
        ':zero': { N: '0' },
        ':now': { S: now },
        ':ttl': { N: String(ttl) },
      },
    })
  );
  return true;
}

async function main() {
  console.log(`[BACKFILL-CHATS] Tabla: ${tableName}`);
  let lastKey;
  let scanned = 0;
  let indexed = 0;

  do {
    const res = await client.send(
      new ScanCommand({
        TableName: tableName,
        FilterExpression: 'begins_with(pk, :prefix) AND pk = sk',
        ExpressionAttributeValues: { ':prefix': { S: 'CONV#' } },
        ExclusiveStartKey: lastKey,
      })
    );

    for (const raw of res.Items ?? []) {
      scanned += 1;
      const session = unmarshall(raw);
      if (await indexSession(session)) indexed += 1;
    }

    lastKey = res.LastEvaluatedKey;
    console.log(`[BACKFILL-CHATS] Progreso: ${indexed}/${scanned} sesiones indexadas...`);
  } while (lastKey);

  // Promover metadatos de derivación desde INBOX (reason, reasonLabel).
  lastKey = undefined;
  let inboxMerged = 0;
  do {
    const res = await client.send(
      new ScanCommand({
        TableName: tableName,
        FilterExpression: 'pk = :pk',
        ExpressionAttributeValues: { ':pk': { S: 'INBOX' } },
        ExclusiveStartKey: lastKey,
      })
    );

    for (const raw of res.Items ?? []) {
      const inbox = unmarshall(raw);
      const phone = inbox.phone;
      if (!phone) continue;

      await client.send(
        new UpdateItemCommand({
          TableName: tableName,
          Key: { pk: { S: CHATS_PK }, sk: { S: `CONV#${phone}` } },
          UpdateExpression:
            'SET #s = :derived, reason = :reason, reasonLabel = :rl, contactName = if_not_exists(contactName, :cn)',
          ExpressionAttributeNames: { '#s': 'status' },
          ExpressionAttributeValues: {
            ':derived': { S: 'derived' },
            ':reason': { S: inbox.reason ?? 'sin_respuesta' },
            ':rl': { S: inbox.reasonLabel ?? inbox.reason ?? '' },
            ':cn': { S: inbox.contactName ?? phone },
          },
        })
      );
      inboxMerged += 1;
    }

    lastKey = res.LastEvaluatedKey;
  } while (lastKey);

  console.log(`[BACKFILL-CHATS] Listo. ${indexed} sesiones indexadas, ${inboxMerged} metadatos INBOX fusionados.`);
}

main().catch((err) => {
  console.error('[BACKFILL-CHATS] Error:', err);
  process.exit(1);
});
