import axios from 'axios';

/**
 * @description Acorta una URL usando la API gratuita de TinyURL.
 * No requiere API key. En caso de error retorna la URL original.
 * @param {string} url - URL larga a acortar.
 * @returns {Promise<string>} URL acortada o la original si falla.
 */
export async function shortenUrl(url) {
  try {
    const response = await axios.get('https://tinyurl.com/api-create.php', {
      params: { url },
      timeout: 3000,
    });
    return response.data?.trim() || url;
  } catch {
    return url;
  }
}
