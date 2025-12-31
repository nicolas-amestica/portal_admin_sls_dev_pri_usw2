import * as S3 from "../../s3-v3.js";

// Cache en memoria para Lambda warm start
let cachedImages = null;

/**
 * Carga una imagen desde S3 y la convierte a base64
 */
const loadImageAsBase64 = async (bucket, key) => {
  const { Body } = await S3.getObject({ Bucket: bucket, Key: key });
  const byteArray = await Body.transformToByteArray();
  const base64 = Buffer.from(byteArray).toString('base64');
  return base64;
};

/**
 * Carga las imágenes de header y footer desde S3
 * Usa cache para optimizar warm starts
 */
export const loadImages = async (bucket, headerKey, footerKey) => {
  if (cachedImages)
    return cachedImages;

  const [headerImage, footerImage] = await Promise.all([
    loadImageAsBase64(bucket, headerKey),
    loadImageAsBase64(bucket, footerKey)
  ]);

  cachedImages = { headerImage, footerImage };

  return cachedImages;
};

/**
 * Limpia el cache de imágenes (útil para testing)
 */
export const clearImageCache = () => {
  cachedImages = null;
};
