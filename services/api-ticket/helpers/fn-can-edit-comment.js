/**
 * @description Admin puede editar/eliminar cualquier comentario; autor solo los propios.
 */
export const canEditComment = (comment, authCtx) => {
  if (!comment || !authCtx?.email) return false;
  const profiles = authCtx.profiles || [];
  const isAdmin = profiles.some(
    (p) =>
      String(p).toLowerCase() === 'administrador' ||
      String(p).includes('ACC#ADMIN'),
  );
  const authorEmail = comment.createdBy?.email;
  const sameAuthor =
    authorEmail &&
    String(authorEmail).toLowerCase() === String(authCtx.email).toLowerCase();
  return isAdmin || Boolean(sameAuthor);
};
