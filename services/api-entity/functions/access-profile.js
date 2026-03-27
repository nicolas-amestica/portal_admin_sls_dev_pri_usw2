import * as dynamoDbLib from "../../../libs/dynamodb-v3.js";

const { DYNAMODB_USER_TABLE } = process.env;

export const APP_PK = "APP#ADMIN_PORTAL";

const TABLE = {
  Permissions: "APP#PERMISSIONS",
  UserProfiles: "APP#PROFILE#USER",
  ProfileModules: "APP#PROFILE#PERMISSIONS",
};

/**
 * Busca los perfiles IAM asignados a un usuario para una aplicación.
 *
 * @param {string} email - Email del usuario.
 * @param {string} appPk - PK de la aplicación (ej: APP#ADMIN_PORTAL).
 * @returns {Promise<Array>} Lista de perfiles del usuario.
 */
const findUserProfiles = async (email, appPk) => {
  const params = {
    TableName: DYNAMODB_USER_TABLE,
    KeyConditionExpression: "pk = :pk AND begins_with(sk, :skPrefix)",
    ExpressionAttributeValues: {
      ":pk": TABLE.UserProfiles,
      ":skPrefix": `UPL#USR#${email}#${appPk}`,
    },
  };
  return (await dynamoDbLib.query(params)) ?? [];
};

/**
 * Obtiene los permisos de módulos para un perfil y aplicación específicos.
 *
 * @param {string} profileId - ID del perfil (ej: ADM, CLI).
 * @param {string} appPk - PK de la aplicación.
 * @returns {Promise<Array>} Lista de permisos del perfil.
 */
const findModulesByProfile = async (profileId, appPk) => {
  const params = {
    TableName: DYNAMODB_USER_TABLE,
    KeyConditionExpression: "pk = :pk AND begins_with(sk, :skPrefix)",
    ExpressionAttributeValues: {
      ":pk": TABLE.ProfileModules,
      ":skPrefix": `PFL#${profileId}#${appPk}`,
    },
  };
  return (await dynamoDbLib.query(params)) ?? [];
};

/**
 * Obtiene los permisos directos de un usuario para una aplicación.
 * Estos permisos tienen mayor precedencia que los del perfil.
 *
 * @param {string} email - Email del usuario.
 * @param {string} appPk - PK de la aplicación.
 * @returns {Promise<Array>} Lista de permisos directos.
 */
const findDirectPermissions = async (email, appPk) => {
  const params = {
    TableName: DYNAMODB_USER_TABLE,
    KeyConditionExpression: "pk = :pk AND begins_with(sk, :skPrefix)",
    ExpressionAttributeValues: {
      ":pk": TABLE.Permissions,
      ":skPrefix": `PMS#USR#${email}#${appPk}`,
    },
  };
  return (await dynamoDbLib.query(params)) ?? [];
};

/**
 * Obtiene la definición de todos los módulos (LV1 y LV2) de una aplicación.
 *
 * @param {string} appPk - PK de la aplicación.
 * @returns {Promise<Array>} Lista completa de módulos.
 */
const findAppModules = async (appPk) => {
  const params = {
    TableName: DYNAMODB_USER_TABLE,
    KeyConditionExpression: "pk = :pk",
    ExpressionAttributeValues: { ":pk": appPk },
  };
  return (await dynamoDbLib.query(params)) ?? [];
};

/**
 * Verifica si un permiso ha expirado.
 *
 * @param {string|null} expiration - Fecha de expiración o "null".
 * @returns {boolean}
 */
const isExpired = (expiration) => {
  if (!expiration || expiration === "null") return false;
  return new Date(expiration).getTime() < new Date().setHours(0, 0, 0, 0);
};

/**
 * Construye la lista plana de accesos (Access[]) a partir de los módulos de la
 * aplicación, los permisos de perfil y los permisos directos del usuario.
 * Solo incluye módulos LV2 (páginas navegables).
 * Los permisos directos tienen precedencia sobre los de perfil.
 *
 * @param {Array} appModules - Definición completa de módulos de la app.
 * @param {Array} profilePermissions - Permisos heredados del perfil.
 * @param {Array} directPermissions - Permisos directos del usuario.
 * @returns {Array} Lista de accesos en formato Access[].
 */
const buildAccessList = (appModules, profilePermissions, directPermissions) => {
  const permissionMap = new Map();
  for (const perm of profilePermissions) permissionMap.set(perm.id, perm);
  for (const perm of directPermissions) permissionMap.set(perm.id, perm); // directos sobrescriben perfil

  // Mapa de orden de LV1 para ordenar el menú correctamente
  const lv1OrderMap = new Map();
  for (const m of appModules) {
    if (m.sk.includes("#LV1#") && !m.sk.includes("#LV2#")) {
      lv1OrderMap.set(m.sk, Number(m.order) || 99);
    }
  }

  const lv2Modules = appModules
    .filter((m) => m.sk.includes("#LV2#"))
    .sort((a, b) => {
      const aLv1Sk = a.sk.split("#LV2#")[0];
      const bLv1Sk = b.sk.split("#LV2#")[0];
      const aLv1Order = lv1OrderMap.get(aLv1Sk) ?? 99;
      const bLv1Order = lv1OrderMap.get(bLv1Sk) ?? 99;
      if (aLv1Order !== bLv1Order) return aLv1Order - bLv1Order;
      return (Number(a.order) || 0) - (Number(b.order) || 0);
    });

  return lv2Modules.reduce((acc, module) => {
    const permission = permissionMap.get(module.id);
    if (!permission || isExpired(permission.expiration)) return acc;

    acc.push({
      allow: permission.allowances || "[create, read, update, delete]",
      icon: module.icon || "",
      tooltip: module.tooltip || "",
      path: module.path || "",
      title: module.title || "",
      option: module.sk,
    });
    return acc;
  }, []);
};

/**
 * Resuelve la sesión IAM completa de un usuario: accesos del menú, IDs de perfil y títulos de perfil.
 * Combina permisos de perfil y permisos directos con la definición de módulos.
 * Ejecuta las consultas en paralelo para máxima eficiencia.
 *
 * @param {string} email - Email del usuario.
 * @param {string} [appPk] - PK de la aplicación. Default: APP#ADMIN_PORTAL.
 * @returns {Promise<{access: Array, profileIds: string[], profileTitles: string[]}>}
 */
export const resolveUserSession = async (email, appPk = APP_PK) => {
  const profiles = await findUserProfiles(email, appPk);
  if (!profiles || profiles.length === 0) return { access: [], profileIds: [], profileTitles: [] };

  const profileIds = profiles
    .map((p) => p.sk.split("PFL#").pop())
    .filter(Boolean);

  const profileTitles = profiles.map((p) => p.title).filter(Boolean);

  const profileModulePromises = profileIds.map((id) => findModulesByProfile(id, appPk));

  const [appModules, directPermissions, ...profileModulesArrays] = await Promise.all([
    findAppModules(appPk),
    findDirectPermissions(email, appPk),
    ...profileModulePromises,
  ]);

  const profilePermissions = profileModulesArrays.flat();
  const access = buildAccessList(appModules, profilePermissions, directPermissions);

  return { access, profileIds, profileTitles };
};
