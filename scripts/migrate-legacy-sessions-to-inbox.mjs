/**
 * @description Script de migración one-time: crea items INBOX para sesiones legacy
 * que existían bajo la arquitectura Chatwoot (sin status ni contactName).
 *
 * Ejecutar:
 *   AWS_PROFILE=pa-prd node scripts/migrate-legacy-sessions-to-inbox.mjs [--dry-run] [--days=30]
 *
 * Flags:
 *   --dry-run   Muestra qué haría sin escribir nada en DynamoDB
 *   --days=N    Solo migra sesiones con actividad en los últimos N días (default: 30)
 *   --all       Migra todas las sesiones independientemente de la fecha
 */

import { DynamoDBClient, ScanCommand, PutItemCommand, UpdateItemCommand, GetItemCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall, marshall } from '@aws-sdk/util-dynamodb';

const TABLE = 'conversations-prd-pri-usw2';
const REGION = 'us-west-2';

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const ALL = args.includes('--all');
const daysArg = args.find((a) => a.startsWith('--days='));
const DAYS = daysArg ? parseInt(daysArg.split('=')[1], 10) : 30;

const client = new DynamoDBClient({ region: REGION });

/** @description Normaliza el teléfono eliminando el prefijo + */
function normalizePhone(phone) {
  return (phone ?? '').replace(/^\+/, '');
}

/** @description Detecta el canal según el formato del identificador */
function detectChannel(phone) {
  // PSIDs de Messenger/Instagram son IDs numéricos largos (> 15 dígitos)
  const normalized = normalizePhone(phone);
  if (/^\d{15,}$/.test(normalized)) return 'messenger';
  return 'whatsapp';
}

/** @description Obtiene todos los items de una partición CONV# que son sesiones (sk = pk) */
async function scanAllSessions() {
  const sessions = [];
  let lastEvaluatedKey;

  do {
    const command = new ScanCommand({
      TableName: TABLE,
      FilterExpression: 'begins_with(pk, :conv) AND begins_with(sk, :conv)',
      ExpressionAttributeValues: { ':conv': { S: 'CONV#' } },
      ...(lastEvaluatedKey ? { ExclusiveStartKey: lastEvaluatedKey } : {}),
    });

    const result = await client.send(command);
    const items = (result.Items ?? []).map(unmarshall);

    // Solo sesiones: pk === sk
    const onlySessions = items.filter((i) => i.pk === i.sk);
    sessions.push(...onlySessions);
    lastEvaluatedKey = result.LastEvaluatedKey;
  } while (lastEvaluatedKey);

  return sessions;
}

/** @description Verifica si ya existe un item INBOX para este phone */
async function inboxItemExists(phone) {
  const result = await client.send(new GetItemCommand({
    TableName: TABLE,
    Key: { pk: { S: 'INBOX' }, sk: { S: `CONV#${phone}` } },
  }));
  return !!result.Item;
}

/** @description Crea el item INBOX y actualiza la sesión con status + channel */
async function migrateSession(session, phone) {
  const ttl = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60; // 30 días
  const channel = session.channel ?? detectChannel(phone);
  const now = new Date().toISOString();

  const inboxItem = {
    pk: 'INBOX',
    sk: `CONV#${phone}`,
    phone,
    contactName: session.contactName ?? phone,
    channel,
    reason: 'migrado',
    reasonLabel: 'Migración legacy',
    lastMessage: session.lastMessageText ?? '',
    lastMessageAt: session.lastMessageAt ?? now,
    unreadCount: session.unreadCount ?? 0,
    status: 'derived',
    createdAt: session.createdAt ?? now,
    ttl,
  };

  if (!DRY_RUN) {
    // 1. Crear item INBOX
    await client.send(new PutItemCommand({
      TableName: TABLE,
      Item: marshall(inboxItem),
      ConditionExpression: 'attribute_not_exists(pk)', // no sobrescribir si ya existe
    }));

    // 2. Actualizar sesión con status + channel (sin sobrescribir contactName si ya existe)
    await client.send(new UpdateItemCommand({
      TableName: TABLE,
      Key: { pk: { S: session.pk }, sk: { S: session.sk } },
      UpdateExpression: 'SET #s = :s, #ch = :ch',
      ExpressionAttributeNames: { '#s': 'status', '#ch': 'channel' },
      ExpressionAttributeValues: {
        ':s': { S: 'derived' },
        ':ch': { S: channel },
      },
    }));
  }

  return inboxItem;
}

async function main() {
  console.log(`\n=== Migración de sesiones legacy a INBOX ===`);
  console.log(`Tabla: ${TABLE}`);
  console.log(`Modo: ${DRY_RUN ? 'DRY-RUN (sin escrituras)' : 'REAL (escribe en DynamoDB)'}`);
  if (!ALL) console.log(`Filtro: actividad en últimos ${DAYS} días`);
  else console.log('Filtro: todas las sesiones');
  console.log('');

  const sessions = await scanAllSessions();
  console.log(`Sesiones totales encontradas: ${sessions.length}`);

  // Filtrar las que ya tienen status (ya migradas o nuevas)
  const legacy = sessions.filter((s) => !s.status);
  console.log(`Sin status (legacy): ${legacy.length}`);

  // Filtrar por fecha si no es --all
  const cutoff = new Date(Date.now() - DAYS * 24 * 60 * 60 * 1000).toISOString();
  const candidates = ALL
    ? legacy
    : legacy.filter((s) => s.lastMessageAt && s.lastMessageAt >= cutoff);

  console.log(`Candidatos a migrar: ${candidates.length}`);
  if (!ALL) console.log(`  (lastMessageAt >= ${cutoff.slice(0, 10)})`);
  console.log('');

  let migrated = 0;
  let skipped = 0;
  let errors = 0;

  for (const session of candidates) {
    const rawPhone = session.phoneNumber ?? session.pk.replace('CONV#', '');
    const phone = normalizePhone(rawPhone);
    const channel = detectChannel(phone);
    const unread = session.unreadCount ?? 0;

    // Verificar si ya existe el item INBOX
    const exists = DRY_RUN ? false : await inboxItemExists(phone);
    if (exists) {
      console.log(`  ⏭  SKIP   ${phone} — INBOX item ya existe`);
      skipped++;
      continue;
    }

    try {
      const item = await migrateSession(session, phone);
      const tag = DRY_RUN ? '🔍 DRY' : '✅ OK ';
      console.log(`  ${tag}  ${phone.padEnd(20)} | channel=${channel.padEnd(10)} | unread=${String(unread).padStart(2)} | lastAt=${session.lastMessageAt?.slice(0, 10) ?? 'N/A'}`);
      migrated++;
    } catch (err) {
      if (err.name === 'ConditionalCheckFailedException') {
        console.log(`  ⏭  SKIP   ${phone} — INBOX item ya existe (condition check)`);
        skipped++;
      } else {
        console.error(`  ❌ ERROR  ${phone}: ${err.message}`);
        errors++;
      }
    }
  }

  console.log('');
  console.log(`=== Resultado ===`);
  console.log(`  ${DRY_RUN ? 'Simulados' : 'Migrados'}: ${migrated}`);
  console.log(`  Omitidos (ya existían): ${skipped}`);
  console.log(`  Errores: ${errors}`);
  console.log(`  Total procesados: ${migrated + skipped + errors} / ${candidates.length}`);
  if (DRY_RUN) {
    console.log('\n💡 Para ejecutar la migración real: node scripts/migrate-legacy-sessions-to-inbox.mjs --days=30');
  }
}

main().catch((err) => {
  console.error('Error fatal:', err);
  process.exit(1);
});
