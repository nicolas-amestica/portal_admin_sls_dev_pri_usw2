#!/usr/bin/env node
/**
 * Migración one-shot: ítems contables USR# + EXP#/ING# → ACC# + SK PRG#…#EXP|INC#DAT#…
 *
 * Uso (desde la raíz del monorepo):
 *   ACCOUNTING_PARTITION_PK=ACC#... TABLE_NAME=accounting-dev-pri-usw2 AWS_PROFILE=pa-dev \
 *     node services/api-accounting/scripts/migrate-partition.mjs
 *
 * El valor ACC# debe coincidir con custom.accountingPartitionPk del stage en serverless.
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  DeleteCommand,
  PutCommand,
  ScanCommand,
} from '@aws-sdk/lib-dynamodb';
import {
  buildExpenseSortKey,
  buildIncomeSortKey,
  gsiExpensePeriod,
  gsiIncomePeriod,
  LEGACY_PROGRAM_SEGMENT,
} from '../helpers/accounting-keys.js';

function reqEnv(name) {
  const v = process.env[name];
  if (!v?.trim()) {
    console.error(`Falta variable de entorno ${name}`);
    process.exit(1);
  }
  return v.trim();
}

const tableName = reqEnv('DYNAMODB_ACCOUNTING_TABLE');
const targetPk = reqEnv('ACCOUNTING_PARTITION_PK');

process.env.ACCOUNTING_PARTITION_PK = targetPk;

const client = DynamoDBDocumentClient.from(new DynamoDBClient({ region: process.env.AWS_REGION || 'us-west-2' }));

async function scanAll() {
  const items = [];
  let lastKey;
  do {
    const res = await client.send(
      new ScanCommand({
        TableName: tableName,
        ExclusiveStartKey: lastKey,
        FilterExpression:
          'begins_with(pk, :usr) AND (begins_with(sk, :exp) OR begins_with(sk, :ing))',
        ExpressionAttributeValues: {
          ':usr': 'USR#',
          ':exp': 'EXP#',
          ':ing': 'ING#',
        },
      })
    );
    if (res.Items?.length) items.push(...res.Items);
    lastKey = res.LastEvaluatedKey;
  } while (lastKey);
  return items;
}

function programSkForMigration(item) {
  const p = String(item.programSk ?? '').trim();
  if (p) return p;
  return `PRG#${LEGACY_PROGRAM_SEGMENT}`;
}

async function main() {
  console.log(`Tabla: ${tableName}`);
  console.log(`PK destino: ${targetPk}`);
  const legacy = await scanAll();
  console.log(`Ítems legacy encontrados: ${legacy.length}`);

  let moved = 0;
  let skipped = 0;

  for (const item of legacy) {
    if (!item.id || !item.tipoDocumento || !item.periodo) {
      console.warn('Omitido (faltan id/tipoDocumento/periodo):', item.pk, item.sk);
      skipped += 1;
      continue;
    }

    const programSk = programSkForMigration(item);
    let newSk;
    if (item.tipo === 'GASTO') {
      newSk = buildExpenseSortKey({
        programSk,
        periodo: item.periodo,
        tipoDocumento: item.tipoDocumento,
        id: item.id,
      });
    } else if (item.tipo === 'INGRESO') {
      newSk = buildIncomeSortKey({
        programSk,
        periodo: item.periodo,
        tipoDocumento: item.tipoDocumento,
        id: item.id,
      });
    } else {
      console.warn('Omitido (tipo desconocido):', item.tipo, item.sk);
      skipped += 1;
      continue;
    }

    const gsiOne =
      item.tipo === 'GASTO'
        ? gsiExpensePeriod(item.periodo)
        : gsiIncomePeriod(item.periodo);

    const newItem = {
      ...item,
      pk: targetPk,
      sk: newSk,
      gsiOne,
      programSk: item.programSk?.trim() ? item.programSk.trim() : programSk,
    };

    await client.send(new PutCommand({ TableName: tableName, Item: newItem }));
    await client.send(
      new DeleteCommand({ TableName: tableName, Key: { pk: item.pk, sk: item.sk } })
    );
    moved += 1;
    console.log(`OK ${item.sk} → ${newSk}`);
  }

  console.log(`Migrados: ${moved}, omitidos: ${skipped}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
