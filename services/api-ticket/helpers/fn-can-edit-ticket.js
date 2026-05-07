/**
 * @description Permite editar si es administrador (JWT profiles) o si el email coincide con el creador.
 */
export const canEditTicket = (ticket, authCtx) => {
  if (!ticket || !authCtx?.email) return false;
  const profiles = authCtx.profiles || [];
  const isAdmin = profiles.some(
    (p) =>
      String(p).toLowerCase() === 'administrador' ||
      String(p).includes('ACC#ADMIN'),
  );
  const creatorEmail = ticket.createdBy?.email;
  const sameUser =
    creatorEmail &&
    String(creatorEmail).toLowerCase() === String(authCtx.email).toLowerCase();
  return isAdmin || Boolean(sameUser);
};
