/**
 * Construye la lista `endpoints` del JWT a partir de los paths IAM (`Access.path`).
 * Cada elemento debe ser substring del `routeArn` de API Gateway HTTP v2 (incluye rutas `/v1/...`).
 *
 * @typedef {{ path?: string }} AccessLike
 */

/** Prefijos API permitidos para cualquier sesión portal tras login (perfil, renovación, menú, favoritos). */
export const JWT_ENDPOINT_ALWAYS_PREFIXES = [
  '/v1/sesiones/renovar-sesion',
  '/v1/usuarios/perfil',
  '/v1/iam/accesos/aplicaciones/GI/user',
  '/v1/favoritos',
];

/**
 * Mapa path canónico IAM (UI) → prefijos API necesarios para ese módulo.
 * Claves alineadas a `ROUTE_KEYS` del frontend / `path` en módulos DynamoDB.
 */
const PERMISSION_PATH_TO_API_PREFIXES = {
  inicio: ['/v1/dashboard'],
  'mi-perfil': ['/v1/usuarios/perfil'],

  'gestion-administrativa/crear-programa': [
    '/v1/programas',
    '/v1/contratos',
    '/v1/notificaciones',
    '/v1/mantenedor/catalogo',
    '/v1/mantenedor/bancos',
    '/v1/pagos/programas',
    '/v1/extracciones/object',
    '/v1/favoritos',
  ],
  'gestion-administrativa/programas-lista': [
    '/v1/programas',
    '/v1/contratos',
    '/v1/notificaciones',
    '/v1/pagos/programas',
    '/v1/pagos/cuotas',
    '/v1/balances',
    '/v1/pasajeros',
    '/v1/extracciones/object',
    '/v1/favoritos',
  ],
  'gestion-administrativa/historial-pagos': ['/v1/balances', '/v1/pagos', '/v1/programas', '/v1/extracciones/object'],
  'gestion-administrativa/asignar-cuota': [
    '/v1/pagos/admin',
    '/v1/programas',
    '/v1/balances',
    '/v1/pagos/programas',
    '/v1/extracciones/object',
  ],

  'cliente/inicio': ['/v1/dashboard', '/v1/programas'],
  'cliente/pagos': ['/v1/pagos', '/v1/programas', '/v1/balances'],
  'cliente/pagos/resultado': ['/v1/pagos', '/v1/programas'],
  'cliente/lista-pasajeros': ['/v1/pasajeros', '/v1/programas', '/v1/extracciones/object'],

  'agenda/calendario': ['/v1/reuniones'],

  'comunicaciones/conversaciones': [
    '/v1/inbox',
    '/v1/inbox/adjuntos',
    '/v1/extracciones/object',
  ],

  'analytics/dashboard': ['/v1/analytics', '/v1/dashboard'],

  'contabilidad/gastos': ['/v1/contabilidad'],
  'contabilidad/listado-gastos': ['/v1/contabilidad/gastos', '/v1/contabilidad/exportar', '/v1/extracciones/object'],
  'contabilidad/ingresos': ['/v1/contabilidad'],
  'contabilidad/listado-ingresos': ['/v1/contabilidad/ingresos', '/v1/contabilidad/exportar', '/v1/extracciones/object'],

  'tickets/gestion-casos': ['/v1/tickets', '/v1/extracciones/object'],
  'tickets/resolucion-casos': ['/v1/tickets', '/v1/extracciones/object'],

  'configuracion/tasas-sistema': ['/v1/configuracion/global'],
  'configuracion/costo-servicio': ['/v1/configuracion/global'],
  'configuracion/usuarios-permisos': ['/v1/iam', '/v1/usuarios'],
  'configuracion/presentadores': ['/v1/mantenedor/presentadores'],
  'configuracion/medios-informativos': ['/v1/mantenedor/medios-informativos'],
  'configuracion/reglas-perfiles-auto': ['/v1/iam/reglas-perfiles-auto'],
};

/**
 * @param {AccessLike[]} access - Lista `access` devuelta por `resolveUserSession`.
 * @returns {string[]} Lista única de fragmentos para `routeArn.includes(...)`.
 */
export function buildJwtEndpointsFromAccess(access = []) {
  const set = new Set(JWT_ENDPOINT_ALWAYS_PREFIXES);

  for (const item of access) {
    const path = typeof item?.path === 'string' ? item.path.trim() : '';
    if (!path) continue;

    const mapped = PERMISSION_PATH_TO_API_PREFIXES[path];
    if (mapped?.length) {
      for (const p of mapped) set.add(p);
      continue;
    }

    if (path.startsWith('tickets/')) {
      for (const p of ['/v1/tickets', '/v1/extracciones/object']) set.add(p);
    }
  }

  return [...set];
}
