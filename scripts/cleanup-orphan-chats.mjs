/**
 * @description Elimina ítems CHATS huérfanos (sin sesión CONV# correspondiente).
 * Uso: AWS_PROFILE=pa-prd node scripts/cleanup-orphan-chats.mjs prd
 *
 * Nota: usa Scan filtrado (one-shot mantenimiento; runtime usa Query sobre CHATS).
 */
import { DynamoDBClient, DeleteItemCommand, QueryCommand, ScanCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';

const stage = process.argv[2] ?? 'dev';
const region = process.argv[3] ?? 'us-west-2';
const tableName = `conversations-${stage}-pri-usw2`;
const CHATS_PK = 'CHATS';

const client = new DynamoDBClient({ region });

/**
 * @description Carga teléfonos con sesión CONV# activa.
 * @returns {Promise<Set<string>>}
 */
async function loadSessionPhones() {
  const phones = new Set();
  let lastKey;

  do {
    const res = await client.send(
      new ScanCommand({
        TableName: tableName,
        FilterExpression: 'begins_with(pk, :prefix) AND pk = sk',
        ExpressionAttributeValues: { ':prefix': { S: 'CONV#' } },
        ProjectionExpression: 'pk',
        ExclusiveStartKey: lastKey,
      })
    );

    for (const raw of res.Items ?? []) {
      const session = unmarshall(raw);
      const phone = session.pk?.replace(/^CONV#/, '');
      if (phone) phones.add(phone);
    }

    lastKey = res.LastEvaluatedKey;
  } while (lastKey);

  return phones;
}

async function main() {
  console.log(`[CLEANUP-ORPHAN-CHATS] Tabla: ${tableName}`);
  const sessionPhones = await loadSessionPhones();
  console.log(`[CLEANUP-ORPHAN-CHATS] Sesiones CONV#: ${sessionPhones.size}`);

  let lastKey;
  let scanned = 0;
  let removed = 0;

  do {
    const res = await client.send(
      new QueryCommand({
        TableName: tableName,
        KeyConditionExpression: 'pk = :pk',
        ExpressionAttributeValues: { ':pk': { S: CHATS_PK } },
        ExclusiveStartKey: lastKey,
      })
    );

    for (const raw of res.Items ?? []) {
      scanned += 1;
      const chat = unmarshall(raw);
      const phone = (chat.phone ?? chat.sk?.replace(/^CONV#/, '') ?? '').replace(/^\+/, '');
      if (!phone || sessionPhones.has(phone)) continue;

      await client.send(
        new DeleteItemCommand({
          TableName: tableName,
          Key: { pk: { S: CHATS_PK }, sk: { S: `CONV#${phone}` } },
        })
      );
      removed += 1;
      console.log(`[CLEANUP-ORPHAN-CHATS] Eliminado CHATS/CONV#${phone}`);
    }

    lastKey = res.LastEvaluatedKey;
  } while (lastKey);

  console.log(`[CLEANUP-ORPHAN-CHATS] Listo. ${removed} huérfanos eliminados de ${scanned} ítems CHATS.`);
}

main().catch((err) => {
  console.error('[CLEANUP-ORPHAN-CHATS] Error:', err);
  process.exit(1);
});
