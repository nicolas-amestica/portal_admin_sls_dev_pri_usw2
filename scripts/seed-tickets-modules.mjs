#!/usr/bin/env node
/**
 * Registra en DynamoDB (tabla users) la categoría Tickets + dos módulos LV2 alineados
 * con ROUTE_KEYS (tickets/gestion-casos, tickets/resolucion-casos) y asigna CRUD al perfil
 * cuyo título sea exactamente "Administrador" (insensible a mayúsculas).
 *
 * Formato igual que upsert-module-v1.js + save-profile-permissions-v1.js (sin Scan).
 *
 * Uso:
 *   AWS_PROFILE=pa-dev  node scripts/seed-tickets-modules.mjs --stage dev
 *   AWS_PROFILE=pa-prd  node scripts/seed-tickets-modules.mjs --stage prd
 */
import { parseArgs } from 'node:util';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';

const SHORT_REGION = 'usw2';
const APP_PK = 'APP#ADMIN_PORTAL';
const PROFILES_PK = 'APP#PROFILES';
const PROFILE_PERMS_PK = 'APP#PROFILE#PERMISSIONS';

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

const LV1_ID = 'tickets';
const LV1_SK = `${APP_PK}#LV1#${LV1_ID}`;

const LV2_MODULES = [
  {
    id: 'tickets-gestion-casos',
    title: 'Gestión de Casos',
    icon: 'pi pi-plus-circle',
    path: 'tickets/gestion-casos',
    tooltip: 'Crear tickets con adjuntos',
    order: 1,
  },
  {
    id: 'tickets-resolucion-casos',
    title: 'Resolución de Casos',
    icon: 'pi pi-list',
    path: 'tickets/resolucion-casos',
    tooltip: 'Listado y seguimiento de casos',
    order: 2,
  },
];

async function upsertModules() {
  const now = new Date().toISOString();

  await ddb.send(
    new PutCommand({
      TableName: tableName,
      Item: {
        pk: APP_PK,
        sk: LV1_SK,
        id: LV1_ID,
        title: 'Tickets',
        icon: 'pi pi-ticket',
        path: '',
        tooltip: 'Tickets del portal',
        order: 40,
        createdAt: now,
        updatedAt: now,
      },
    }),
  );
  console.log(`✔ LV1 ${LV1_SK}`);

  for (const m of LV2_MODULES) {
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
    console.warn('⚠ No hay perfil con title "Administrador". Asigna los módulos desde Configuración → Usuarios y permisos.');
    return;
  }

  const now = new Date().toISOString();
  const allowances = '[create, read, update, delete]';

  for (const m of LV2_MODULES) {
    const sk = `PFL#${profileId}#${APP_PK}#${m.id}`;
    await ddb.send(
      new PutCommand({
        TableName: tableName,
        Item: {
          pk: PROFILE_PERMS_PK,
          sk,
          id: m.id,
          allowances,
          expiration: 'null',
          createdAt: now,
        },
      }),
    );
    console.log(`✔ Permiso Administrador → ${m.id}`);
  }
}

async function main() {
  console.log(`Tabla: ${tableName} | perfil AWS: ${process.env.AWS_PROFILE ?? '(default)'}`);
  await upsertModules();
  await attachPermissionsToAdministrador();
  console.log('Listo. Los usuarios deben cerrar sesión o esperar refresh de menú para ver rutas nuevas en el JWT.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
