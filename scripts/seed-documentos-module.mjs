#!/usr/bin/env node
/**
 * Registra en DynamoDB (tabla users) el módulo LV2 "Documentos" bajo Gestión Administrativa
 * (ROUTE_KEYS: gestion-administrativa/documentos) y asigna CRUD al perfil Administrador.
 *
 * No crea ni modifica el LV1 padre; falla si no existe APP#ADMIN_PORTAL#LV1#GAS (Gestión Administrativa).
 *
 * Uso:
 *   AWS_PROFILE=pa-dev node scripts/seed-documentos-module.mjs --stage dev
 *   AWS_PROFILE=pa-dev node scripts/seed-documentos-module.mjs --stage dev --skipPermissions
 */
import { parseArgs } from 'node:util';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';

const SHORT_REGION = 'usw2';
const APP_PK = 'APP#ADMIN_PORTAL';
const PROFILES_PK = 'APP#PROFILES';
const PROFILE_PERMS_PK = 'APP#PROFILE#PERMISSIONS';

const LV1_ID = 'GAS';
const LV1_SK = `${APP_PK}#LV1#${LV1_ID}`;

const LV2_MODULE = {
  id: 'DOC',
  title: 'Documentos',
  icon: 'pi pi-folder-open',
  path: 'gestion-administrativa/documentos',
  tooltip: 'Plantillas y formatos disponibles para descarga',
  order: 6,
};

const { values } = parseArgs({
  options: {
    stage: { type: 'string', default: 'dev' },
    region: { type: 'string', default: 'us-west-2' },
    skipPermissions: { type: 'boolean', default: false },
  },
});

const stage = values.stage;
const region = values.region;
const tableName = `users-${stage}-pri-${SHORT_REGION}`;

process.env.AWS_PROFILE ||= `pa-${stage}`;

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region }));

async function assertLv1Exists() {
  const res = await ddb.send(
    new GetCommand({
      TableName: tableName,
      Key: { pk: APP_PK, sk: LV1_SK },
    }),
  );

  if (!res.Item) {
    throw new Error(
      `No existe el LV1 ${LV1_SK} (Gestión Administrativa / Programas). Verifica la tabla users en DynamoDB.`,
    );
  }

  console.log(`✔ LV1 encontrado: ${res.Item.title ?? LV1_ID}`);
}

async function upsertDocumentosModule() {
  const now = new Date().toISOString();
  const m = LV2_MODULE;

  await ddb.send(
    new PutCommand({
      TableName: tableName,
      Item: {
        pk: APP_PK,
        sk: `${LV1_SK}#LV2#${m.id}`,
        id: m.id,
        title: m.title,
        icon: m.icon,
        path: m.path,
        tooltip: m.tooltip,
        order: m.order,
        createdAt: now,
        updatedAt: now,
      },
    }),
  );

  console.log(`✔ LV2 ${m.path} (id=${m.id})`);
}

async function findAdministradorProfileId() {
  const items = [];
  let lastKey;

  do {
    const res = await ddb.send(
      new QueryCommand({
        TableName: tableName,
        KeyConditionExpression: 'pk = :pk',
        ExpressionAttributeValues: { ':pk': PROFILES_PK },
        ExclusiveStartKey: lastKey,
      }),
    );
    items.push(...(res.Items ?? []));
    lastKey = res.LastEvaluatedKey;
  } while (lastKey);

  const admin = items.find((p) => String(p.title ?? '').trim().toLowerCase() === 'administrador');
  if (!admin?.sk?.startsWith('PFL#')) return null;
  return admin.sk.replace(/^PFL#/, '');
}

async function attachPermissionsToAdministrador() {
  if (values.skipPermissions) {
    console.log('— Omitiendo permisos (--skipPermissions)');
    return;
  }

  const profileId = await findAdministradorProfileId();
  if (!profileId) {
    console.warn(
      '⚠ No hay perfil con title "Administrador". Asigna el módulo desde Configuración → Usuarios y permisos.',
    );
    return;
  }

  const now = new Date().toISOString();
  const allowances = '[create, read, update, delete]';
  const sk = `PFL#${profileId}#${APP_PK}#${LV2_MODULE.id}`;

  await ddb.send(
    new PutCommand({
      TableName: tableName,
      Item: {
        pk: PROFILE_PERMS_PK,
        sk,
        id: LV2_MODULE.id,
        allowances,
        expiration: 'null',
        createdAt: now,
      },
    }),
  );

  console.log(`✔ Permiso Administrador → ${LV2_MODULE.id}`);
}

async function main() {
  console.log(`Tabla: ${tableName} | perfil AWS: ${process.env.AWS_PROFILE ?? '(default)'}`);
  await assertLv1Exists();
  await upsertDocumentosModule();
  await attachPermissionsToAdministrador();
  console.log('Listo. Los usuarios deben cerrar sesión o esperar refresh de menú para ver la ruta en el JWT.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
