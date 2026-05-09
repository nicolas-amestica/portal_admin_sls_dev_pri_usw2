/**
 * @description Exige perfil con privilegios de administración IAM (Administrador, Operador o claim ACC#ADMIN).
 * @param {unknown[]} profiles - `profiles` del JWT (títulos de perfil).
 */
export function assertPortalAdministrador(profiles = []) {
  const list = Array.isArray(profiles) ? profiles : [];
  const normalized = list.map((p) => String(p ?? '').trim().toLowerCase()).filter(Boolean);

  const isAdmin = normalized.some(
    (p) => p.includes('acc#admin') || p === 'administrador' || p === 'operador'
  );
  if (!isAdmin) {
    const error = new Error('Acceso denegado.');
    error.statusCode = 403;
    throw error;
  }
}
