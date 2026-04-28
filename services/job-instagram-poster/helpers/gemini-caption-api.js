import { GoogleGenerativeAI } from '@google/generative-ai';

/** Modelo rápido y económico para captions cortos (alineado al uso en otros servicios). */
const MODEL = 'gemini-2.0-flash';

const CATEGORY_CONTEXTS = {
  aventura: 'actividades de aventura al aire libre como trekking, rappel y camping',
  destinos: 'destinos naturales y culturales de Chile y Sudamérica',
  grupos: 'experiencias grupales, trabajo en equipo y convivencia entre jóvenes',
  naturaleza: 'paisajes naturales, flora y fauna de Chile',
};

/**
 * Genera un caption para Instagram con Gemini (misma convención de secreto que api-whatsapp-agent).
 *
 * @param {string} geminiSecretJson - JSON desde SSM: `{"api_key":"..."}`
 * @param {string} category - Categoría de la imagen (aventura | destinos | grupos | naturaleza)
 * @returns {Promise<string>} Caption listo para publicar
 */
export const generateCaption = async (geminiSecretJson, category) => {
  const { api_key } = JSON.parse(geminiSecretJson);
  const context = CATEGORY_CONTEXTS[category] ?? 'viajes educativos grupales para jóvenes';

  const prompt = `Eres el community manager de "Giras Indómito", empresa chilena de viajes educativos grupales para jóvenes.
Genera un caption para Instagram sobre ${context}.

Requisitos estrictos:
- Tono: inspirador, juvenil, aventurero — sin sonar corporativo
- Idioma: español chileno natural (evita "os", usa "ustedes")
- Estructura: 3-4 líneas de texto inspirador + línea en blanco + 15 hashtags relevantes
- Máximo 1-2 emojis, bien ubicados
- NO uses comillas, NO agregues explicaciones, NO pongas "Caption:" al inicio

Responde SOLO con el caption listo para copiar y pegar.`;

  const genAI = new GoogleGenerativeAI(api_key);
  const model = genAI.getGenerativeModel({ model: MODEL });
  const result = await model.generateContent(prompt);
  const text = result.response.text();

  if (!text?.trim()) throw new Error(`Gemini API: respuesta vacía para caption (category=${category})`);

  return text.trim();
};
