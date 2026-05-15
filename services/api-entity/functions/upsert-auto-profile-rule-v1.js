import { uuidv7 } from 'uuidv7';
import * as dynamoDbLib from '../../../libs/dynamodb-v3.js';
import { success } from '../../../helpers/responses.js';
import { standardMiddleware } from '../../../libs/middleware/index.js';
import { getPortalJwtBodyFromEvent } from '../../../libs/fn-get-portal-jwt-body-from-event.js';
import { assertPortalAdministrador } from '../../../libs/assert-portal-administrador.js';

const { DYNAMODB_USER_TABLE } = process.env;
const AUTO_PROFILE_RULES_PK = 'APP#AUTO_PROFILE_RULES';
const VALID_TRIGGERS = ['PROGRAM_APPROVAL', 'PUBLIC_SIGNUP', 'MANUAL'];
const ACTION = 'Actualizar regla de perfil automático.';

/**
 * @description Crea o actualiza una regla de asignación automática de perfil.
 * Una regla por trigger (SK = RULE#{trigger}), upsert idempotente.
 * PUT /v1/iam/reglas-perfiles-auto
 * Body: { trigger, profileId?, profileTitle?, isActive? }
 */
const handler = async (event) => {
  const jwtBody = await getPortalJwtBodyFromEvent(event);
  assertPortalAdministrador(jwtBody.profiles);

  const { trigger, profileId, profileTitle, isActive } = event.body || {};

  if (!trigger || !VALID_TRIGGERS.includes(trigger)) {
    const err = new Error(`trigger inválido. Valores permitidos: ${VALID_TRIGGERS.join(', ')}`);
    err.statusCode = 400;
    throw err;
  }

  const now = new Date().toISOString();
  const existing = await dynamoDbLib.getOne({
    TableName: DYNAMODB_USER_TABLE,
    Key: { pk: AUTO_PROFILE_RULES_PK, sk: `RULE#${trigger}` },
  });

  const item = {
    pk: AUTO_PROFILE_RULES_PK,
    sk: `RULE#${trigger}`,
    ruleId: existing?.ruleId || uuidv7(),
    trigger,
    profileId: profileId ?? null,
    profileTitle: profileTitle ?? null,
    isActive: isActive !== false,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };

  await dynamoDbLib.put({ TableName: DYNAMODB_USER_TABLE, Item: item });
  return success(200, item, ACTION);
};

export const main = standardMiddleware(handler);
