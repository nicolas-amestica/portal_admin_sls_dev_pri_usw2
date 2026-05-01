import { success } from '../../../helpers/responses.js';
import { standardMiddleware } from '../../../libs/middleware/index.js';
import * as dynamoDb from '../../../libs/dynamodb-v3.js';
import { requireStaffProfile } from '../helpers/portal-jwt-auth.js';
import { INFO_MEDIA_PK, VALID_SCOPES } from '../helpers/informative-media-constants.js';

const { DYNAMODB_MAINTAINER_TABLE } = process.env;

/**
 * @description Lista todos los medios informativos de un ámbito (activos e inactivos). Solo staff.
 * Query: scope (requerido).
 */
const handler = async (event) => {
  await requireStaffProfile(event.headers ?? {});
  const action = 'Listar medios informativos (administración).';
  const scope = (event.queryParams?.scope ?? '').trim();

  if (!scope || !VALID_SCOPES.has(scope)) {
    const err = new Error(`Ámbito no válido. Permitidos: ${[...VALID_SCOPES].join(', ')}.`);
    err.statusCode = 400;
    throw err;
  }

  const skPrefix = `${scope}#`;

  const raw = await dynamoDb.iterativeQuery({
    TableName: DYNAMODB_MAINTAINER_TABLE,
    KeyConditionExpression: '#pk = :pk AND begins_with(#sk, :skPrefix)',
    ExpressionAttributeNames: { '#pk': 'pk', '#sk': 'sk' },
    ExpressionAttributeValues: {
      ':pk': INFO_MEDIA_PK,
      ':skPrefix': skPrefix,
    },
  });

  const items = (raw ?? [])
    .map(({ pk: _pk, ...rest }) => rest)
    .sort((a, b) => (Number(a.sortOrder) || 0) - (Number(b.sortOrder) || 0));

  return success(200, items, action);
};

export const main = standardMiddleware(handler);
