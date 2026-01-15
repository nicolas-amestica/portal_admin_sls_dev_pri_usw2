import * as S3 from "../../s3-v3.js";

// Cache en memoria para Lambda warm start
let cachedImages = null;

/**
 * Carga una imagen desde S3 y la convierte a base64
 */
const loadImageAsBase64 = async (bucket, key) => {
  try {
    console.log(`Cargando imagen: s3://${bucket}/${key}`);
    const { Body } = await S3.getObject({ Bucket: bucket, Key: key });
    const byteArray = await Body.transformToByteArray();
    const base64 = Buffer.from(byteArray).toString('base64');
    console.log(`Imagen cargada exitosamente: ${key} (${base64.length} bytes en base64)`);
    return base64;
  } catch (error) {
    console.error(`Error cargando imagen desde S3: s3://${bucket}/${key}`, {
      message: error.message,
      code: error.Code || error.code,
      statusCode: error.$metadata?.httpStatusCode
    });
    throw new Error(`No se pudo cargar la imagen ${key} desde S3: ${error.message}`);
  }
};

/**
 * Carga las imágenes de header y footer desde S3
 * Usa cache para optimizar warm starts
 */
export const loadImages = async (bucket, headerKey, footerKey) => {
  if (cachedImages) {
    console.log("Usando imágenes en caché");
    return cachedImages;
  }

  console.log(`Cargando imágenes desde S3 bucket: ${bucket}`);

  try {
    const [headerImage, footerImage] = await Promise.all([
      loadImageAsBase64(bucket, headerKey),
      loadImageAsBase64(bucket, footerKey)
    ]);

    cachedImages = { headerImage, footerImage };
    console.log("Imágenes almacenadas en caché para futuros usos");

    return cachedImages;
  } catch (error) {
    console.error("Error al cargar imágenes:", error.message);
    throw error;
  }
};

/**
 * Carga múltiples firmas desde S3 basadas en los DNIs de los representantes
 * @param {string} bucket - Nombre del bucket de S3
 * @param {Array} representatives - Array de representantes con propiedad 'dni'
 * @returns {Promise<Array>} Array de objetos con dni y signature en base64
 */
export const loadSignatures = async (bucket, representatives) => {
  if (!representatives || representatives.length === 0) {
    console.log("No hay representantes para cargar firmas");
    return [];
  }

  console.log(`Cargando ${representatives.length} firmas desde S3 bucket: ${bucket}`);

  const signaturePromises = representatives.map(async (rep) => {
    const dni = rep.dni || rep.rut;
    if (!dni) {
      console.warn("Representante sin DNI/RUT, omitiendo firma");
      return null;
    }

    try {
      const signatureKey = `signatures/signature-${dni}.png`;
      const signatureBase64 = await loadImageAsBase64(bucket, signatureKey);
      return {
        dni,
        signature: signatureBase64,
        name: rep.name
      };
    } catch (error) {
      console.warn(`No se pudo cargar la firma para DNI ${dni}:`, error.message);
      return null;
    }
  });

  const signatures = await Promise.all(signaturePromises);

  // Filtrar firmas nulas (que no se pudieron cargar)
  const validSignatures = signatures.filter(sig => sig !== null);

  console.log(`Se cargaron exitosamente ${validSignatures.length} de ${representatives.length} firmas`);

  return validSignatures;
};

/**
 * Limpia el cache de imágenes (útil para testing)
 */
export const clearImageCache = () => {
  cachedImages = null;
};
