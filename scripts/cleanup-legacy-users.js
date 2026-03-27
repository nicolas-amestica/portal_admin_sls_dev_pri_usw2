/**
 * Script de limpieza de datos obsoletos de la tabla users-{stage}-pri-{region}.
 *
 * Elimina registros del formato IAM anterior:
 *   - pk=PER#<uuid>, sk=ACC#<ROLE>#<Title>  (definiciones de permisos legacy)
 *   - Atributos `profiles` y `access` en ítems de usuario (pk=USR#*, sk=USR#*)
 *
 * Uso:
 *   node scripts/cleanup-legacy-users.js [stage] [--dry-run]
 *
 * Ejemplos:
 *   node scripts/cleanup-legacy-users.js dev --dry-run
 *   AWS_PROFILE=pa-dev node scripts/cleanup-legacy-users.js dev
 */

import {
  DynamoDBClient,
  ScanCommand,
  BatchWriteItemCommand,
  UpdateItemCommand,
} from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";

const STAGE = process.argv[2] || "dev";
const DRY_RUN = process.argv.includes("--dry-run");
const REGION = "us-west-2";
const SHORT_REGION = "usw2";
const TABLE = `users-${STAGE}-pri-${SHORT_REGION}`;

const client = new DynamoDBClient({ region: REGION });

const chunkArray = (arr, size) => {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
  return chunks;
};

const scanAll = async () => {
  const items = [];
  let lastKey;
  do {
    const command = new ScanCommand({
      TableName: TABLE,
      ...(lastKey ? { ExclusiveStartKey: lastKey } : {}),
    });
    const response = await client.send(command);
    for (const raw of response.Items ?? []) items.push(unmarshall(raw));
    lastKey = response.LastEvaluatedKey;
  } while (lastKey);
  return items;
};

const deleteItems = async (keys) => {
  const chunks = chunkArray(keys, 25);
  for (const chunk of chunks) {
    const requests = chunk.map(({ pk, sk }) => ({
      DeleteRequest: { Key: marshall({ pk, sk }) },
    }));
    const command = new BatchWriteItemCommand({ RequestItems: { [TABLE]: requests } });
    const response = await client.send(command);
    const unprocessed = response.UnprocessedItems?.[TABLE];
    if (unprocessed?.length) {
      console.warn(`⚠  ${unprocessed.length} ítems no procesados — reintentando...`);
      await client.send(new BatchWriteItemCommand({ RequestItems: { [TABLE]: unprocessed } }));
    }
  }
};

const removeObsoleteAttributes = async (pk, sk) => {
  const command = new UpdateItemCommand({
    TableName: TABLE,
    Key: marshall({ pk, sk }),
    UpdateExpression: "REMOVE #profiles, #access",
    ExpressionAttributeNames: { "#profiles": "profiles", "#access": "access" },
  });
  await client.send(command);
};

const run = async () => {
  console.log(`\n🧹  Cleanup Legacy Users — Portal Admin GI`);
  console.log(`   Tabla : ${TABLE}`);
  if (DRY_RUN) console.log(`   Modo  : DRY-RUN\n`);
  else console.log(`   Modo  : REAL (cambios irreversibles)\n`);

  console.log("🔍  Escaneando tabla...");
  const allItems = await scanAll();
  console.log(`   Total ítems: ${allItems.length}\n`);

  // Registros legacy: pk=PER#*, sk=ACC#*
  const legacyPerms = allItems.filter(
    (i) => i.pk?.startsWith("PER#") && i.sk?.startsWith("ACC#")
  );

  // Usuarios con atributos obsoletos
  const usersWithOldAttrs = allItems.filter(
    (i) =>
      i.pk?.startsWith("USR#") &&
      i.sk?.startsWith("USR#") &&
      (i.profiles !== undefined || i.access !== undefined)
  );

  console.log(`📋  Resumen:`);
  console.log(`   - Registros PER# legacy a eliminar : ${legacyPerms.length}`);
  console.log(`   - Usuarios con atributos obsoletos : ${usersWithOldAttrs.length}\n`);

  if (legacyPerms.length === 0 && usersWithOldAttrs.length === 0) {
    console.log("✅  No hay datos obsoletos. La tabla ya está limpia.\n");
    return;
  }

  if (DRY_RUN) {
    legacyPerms.forEach((i) => console.log(`  [DEL] pk=${i.pk}  sk=${i.sk}`));
    usersWithOldAttrs.forEach((i) =>
      console.log(`  [UPD] pk=${i.pk}  sk=${i.sk}`)
    );
    console.log("\n   Ejecuta sin --dry-run para aplicar.\n");
    return;
  }

  if (legacyPerms.length > 0) {
    console.log(`🗑  Eliminando ${legacyPerms.length} registros PER#...`);
    await deleteItems(legacyPerms.map(({ pk, sk }) => ({ pk, sk })));
    console.log("   ✓ Hecho.");
  }

  if (usersWithOldAttrs.length > 0) {
    console.log(`\n✂️  Limpiando atributos de ${usersWithOldAttrs.length} usuarios...`);
    for (const user of usersWithOldAttrs) {
      await removeObsoleteAttributes(user.pk, user.sk);
      console.log(`   ✓ ${user.pk}`);
    }
  }

  console.log(`\n✅  Cleanup completado.\n`);
};

run().catch((err) => {
  console.error("❌  Error:", err.message);
  process.exit(1);
});
