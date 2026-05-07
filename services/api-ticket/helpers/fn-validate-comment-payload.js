import { validateTicketFiles } from './fn-validate-ticket-files.js';

const MAX_COMMENT_LEN = 10000;

/**
 * @description Valida cuerpo para crear comentario (texto + adjuntos + autor).
 */
export const validateCreateCommentBody = (body, authEmail) => {
  const { comment, files, createdBy } = body ?? {};
  if (!comment || typeof comment !== 'string' || !comment.trim()) {
    const err = new Error('comment es requerido');
    err.statusCode = 400;
    throw err;
  }
  const trimmed = comment.trim();
  if (trimmed.length > MAX_COMMENT_LEN) {
    const err = new Error(`comment no puede superar ${MAX_COMMENT_LEN} caracteres`);
    err.statusCode = 400;
    throw err;
  }
  if (!createdBy?.id || !createdBy?.email || !createdBy?.name) {
    const err = new Error('createdBy con id, email y name es requerido');
    err.statusCode = 400;
    throw err;
  }
  if (
    authEmail &&
    String(createdBy.email).trim().toLowerCase() !== String(authEmail).trim().toLowerCase()
  ) {
    const err = new Error('createdBy.email debe coincidir con el usuario autenticado');
    err.statusCode = 403;
    throw err;
  }
  const safeFiles = validateTicketFiles(files);
  return { comment: trimmed, files: safeFiles, createdBy };
};

/**
 * @description Valida actualización parcial de comentario.
 */
export const validateUpdateCommentBody = (body) => {
  const { comment, files } = body ?? {};
  if (comment === undefined && files === undefined) {
    const err = new Error('Indique comment y/o files para actualizar');
    err.statusCode = 400;
    throw err;
  }
  let nextComment;
  if (comment !== undefined) {
    if (typeof comment !== 'string' || !comment.trim()) {
      const err = new Error('comment inválido');
      err.statusCode = 400;
      throw err;
    }
    nextComment = comment.trim();
    if (nextComment.length > MAX_COMMENT_LEN) {
      const err = new Error(`comment no puede superar ${MAX_COMMENT_LEN} caracteres`);
      err.statusCode = 400;
      throw err;
    }
  }
  let nextFiles;
  if (files !== undefined) {
    nextFiles = validateTicketFiles(files);
  }
  return { comment: nextComment, files: nextFiles };
};
