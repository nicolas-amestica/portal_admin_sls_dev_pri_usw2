import { success } from "../../../helpers/responses";
import { getPresignedUrl } from "../../../libs/s3-v3";
import { standardMiddleware } from "../../../libs/middleware/index.js";

const { BUCKET_INFO_GI } = process.env;

/** Prefijos permitidos para lectura prefirmada (evita enumeración arbitraria del bucket). */
const ALLOWED_KEY_PREFIXES = [
  "contratos/",
  "comprobantes/",
  "signatures/",
  "assets/",
  "exports/",
  "contabilidad/",
  "fichas-medicas/",
  "inbox-adjuntos/",
  "tickets/",
];

/**
 * Obtiene una URL prefirmada para acceder a un objeto en S3.
 */
const handler = async (event) => {
  const action = "Obtención de objeto en S3.";
  const { key } = event.queryParams || {};

  if (!key || typeof key !== "string") {
    const error = new Error("Identificador de objeto inválido.");
    error.statusCode = 400;
    throw error;
  }

  const normalized = key.trim();
  if (normalized.includes("..") || normalized.startsWith("/")) {
    const error = new Error("Identificador de objeto inválido.");
    error.statusCode = 400;
    throw error;
  }

  const allowed = ALLOWED_KEY_PREFIXES.some((prefix) => normalized.startsWith(prefix));
  if (!allowed) {
    const error = new Error("No autorizado para acceder a este recurso.");
    error.statusCode = 403;
    throw error;
  }

  const url = await getPresignedUrl({ Bucket: BUCKET_INFO_GI, Key: normalized });

  return success(200, { url }, action);
};

export const main = standardMiddleware(handler);
