import { success } from "../../../helpers/responses";
import { getPresignedUrl } from "../../../libs/s3-v3";
import { standardMiddleware } from "../../../libs/middleware/index.js";

const { BUCKET_INFO_GI } = process.env;

/**
 * Obtiene una URL prefirmada para acceder a un objeto en S3.
 */
const handler = async (event) => {
  const action = "Obtención de objeto en S3.";
  const { key } = event.queryParams || {};

  if (!key) {
    const error = new Error("Identificador de objeto inválido.");
    error.statusCode = 400;
    throw error;
  }

  const url = await getPresignedUrl({ Bucket: BUCKET_INFO_GI, Key: key });

  return success(200, { url }, action);
};

export const main = standardMiddleware(handler);
