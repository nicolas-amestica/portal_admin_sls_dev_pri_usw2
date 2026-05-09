import bcrypt from 'bcryptjs';
import { uuidv7 } from 'uuidv7';
import * as dynamoDbLib from '../../../libs/dynamodb-v3.js';
import { success } from '../../../helpers/responses.js';
import { standardMiddleware } from '../../../libs/middleware/index.js';
import { getPortalJwtBodyFromEvent } from '../../../libs/fn-get-portal-jwt-body-from-event.js';
import { assertPortalAdministrador } from '../../../libs/assert-portal-administrador.js';

const { DYNAMODB_USER_TABLE } = process.env;
const APP_USERS_PK = 'APP#USERS';
const ACTION = 'Crear o actualizar usuario.';

/**
 * @description Crea un nuevo usuario (POST) o actualiza uno existente (PUT).
 * Escribe dos registros en DynamoDB:
 *   - pk=USR#{id}, sk=USR#{id}  → registro de autenticación
 *   - pk=APP#USERS, sk=USR#{email} → directorio para listado sin scan
 */
const handler = async (event) => {
  const jwtBody = await getPortalJwtBodyFromEvent(event);
  assertPortalAdministrador(jwtBody.profiles);

  const { sk, email, fullName, gsiOne, phoneNumber, password, isActive = true } = event.body || {};

  if (!email?.trim() || !fullName?.trim() || !gsiOne?.trim()) {
    const error = new Error('email, fullName y gsiOne son requeridos');
    error.statusCode = 400;
    throw error;
  }

  const now = new Date().toISOString();

  if (sk) {
    // UPDATE — sk = id del usuario
    const updates = ['fullName = :fn', 'gsiOne = :rut', 'isActive = :active', 'updatedAt = :ts'];
    const values = { ':fn': fullName.trim(), ':rut': gsiOne.trim(), ':active': isActive, ':ts': now };

    if (phoneNumber !== undefined) {
      updates.push('phoneNumber = :phone');
      values[':phone'] = phoneNumber;
    }

    if (password?.trim()) {
      updates.push('#pwd = :pwd');
      updates.push('failedLoginAttempts = :zero');
      updates.push('passwordResetRequired = :prFalse');
      const hashedPassword = await bcrypt.hash(password.trim(), 10);
      values[':pwd'] = hashedPassword;
      values[':zero'] = 0;
      values[':prFalse'] = false;
    }

    const dirUpdates = ['fullName = :fn', 'gsiOne = :rut', 'isActive = :active', 'updatedAt = :ts'];
    const dirValues = { ':fn': fullName.trim(), ':rut': gsiOne.trim(), ':active': isActive, ':ts': now };

    if (phoneNumber !== undefined) {
      dirUpdates.push('phoneNumber = :phone');
      dirValues[':phone'] = phoneNumber;
    }

    const [updatedUser] = await Promise.all([
      dynamoDbLib.update({
        TableName: DYNAMODB_USER_TABLE,
        Key: { pk: `USR#${sk}`, sk: `USR#${sk}` },
        UpdateExpression: password?.trim()
          ? `SET ${updates.join(', ')} REMOVE lockReason`
          : `SET ${updates.join(', ')}`,
        ExpressionAttributeNames: password?.trim() ? { '#pwd': 'password' } : undefined,
        ExpressionAttributeValues: values,
      }),
      dynamoDbLib.update({
        TableName: DYNAMODB_USER_TABLE,
        Key: { pk: APP_USERS_PK, sk: `USR#${email}` },
        UpdateExpression: `SET ${dirUpdates.join(', ')}`,
        ExpressionAttributeValues: dirValues,
      }),
    ]);

    return success(200, updatedUser, ACTION);
  }

  // CREATE
  const id = uuidv7();
  const hashedPassword = password?.trim() ? await bcrypt.hash(password.trim(), 10) : undefined;

  const authRecord = {
    pk: `USR#${id}`,
    sk: `USR#${id}`,
    id,
    email: email.trim(),
    fullName: fullName.trim(),
    gsiOne: gsiOne.trim(),
    phoneNumber: phoneNumber ?? null,
    isActive,
    failedLoginAttempts: 0,
    passwordResetRequired: false,
    createdAt: now,
    updatedAt: now,
    ...(hashedPassword && { password: hashedPassword }),
  };

  const directoryRecord = {
    pk: APP_USERS_PK,
    sk: `USR#${email.trim()}`,
    id,
    email: email.trim(),
    fullName: fullName.trim(),
    gsiOne: gsiOne.trim(),
    phoneNumber: phoneNumber ?? null,
    isActive,
    createdAt: now,
    updatedAt: now,
  };

  await Promise.all([
    dynamoDbLib.put({ TableName: DYNAMODB_USER_TABLE, Item: authRecord }),
    dynamoDbLib.put({ TableName: DYNAMODB_USER_TABLE, Item: directoryRecord }),
  ]);

  return success(201, directoryRecord, ACTION);
};

export const main = standardMiddleware(handler);
