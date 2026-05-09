import { success } from '../../../helpers/responses.js';
import { standardMiddleware } from '../../../libs/middleware/index.js';
import { createPortalUser } from '../helpers/create-user.js';
import { getPortalJwtBodyFromEvent } from '../../../libs/fn-get-portal-jwt-body-from-event.js';
import { assertPortalAdministrador } from '../../../libs/assert-portal-administrador.js';

const { DYNAMODB_USER_TABLE } = process.env;
const ACTION = 'Crear usuario portal.';

/**
 * @description Crea un nuevo usuario en el portal con perfiles opcionales.
 * POST /v1/iam/usuarios
 * Body: { email, fullName, gsiOne, phoneNumber?, profiles?: [{ id, title }] }
 * Response: { user, temporaryPassword }
 */
const handler = async (event) => {
  const jwtBody = await getPortalJwtBodyFromEvent(event);
  assertPortalAdministrador(jwtBody.profiles);

  const { email, fullName, gsiOne, phoneNumber, profiles = [] } = event.body || {};

  if (!email || !fullName || !gsiOne) {
    const err = new Error('email, fullName y gsiOne son requeridos');
    err.statusCode = 400;
    throw err;
  }

  const { user, generatedPassword, isExisting } = await createPortalUser(
    { email, fullName, gsiOne, phoneNumber, profiles, metadata: { source: 'admin-portal' } },
    DYNAMODB_USER_TABLE,
  );

  if (isExisting) {
    const err = new Error(`El email ${email} ya está registrado en el sistema.`);
    err.statusCode = 409;
    throw err;
  }

  return success(201, { user, temporaryPassword: generatedPassword }, ACTION);
};

export const main = standardMiddleware(handler);
