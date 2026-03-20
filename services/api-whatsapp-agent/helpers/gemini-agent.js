import { GoogleGenerativeAI } from '@google/generative-ai';
import { getSecretManagerValue } from '../../../libs/secret-manager.js';
import { buscarPresupuestos } from '../tools/buscar-presupuestos.js';
import { crearReunion } from '../tools/crear-reunion.js';

/** Cache del cliente Gemini en memoria. */
let _geminiClient = null;

/**
 * @description Obtiene o inicializa el cliente de Gemini con la API key desde Secrets Manager.
 * @returns {Promise<GoogleGenerativeAI>}
 */
async function getGeminiClient() {
  if (_geminiClient) return _geminiClient;
  const secretJson = await getSecretManagerValue(process.env.GEMINI_SECRET_KEY);
  const { api_key } = JSON.parse(secretJson);
  _geminiClient = new GoogleGenerativeAI(api_key);
  return _geminiClient;
}

/** Definición de herramientas disponibles para Gemini (function calling). */
const TOOLS = [
  {
    functionDeclarations: [
      {
        name: 'buscar_presupuestos',
        description:
          'Busca los PDFs de presupuesto disponibles en S3 para un destino y ubicación geográfica del cliente. Retorna URLs de descarga válidas por 24 horas. Llamar solo cuando se tengan destino, codigoRegion y nombreComuna.',
        parameters: {
          type: 'OBJECT',
          properties: {
            destino: {
              type: 'STRING',
              description: 'Destino del viaje.',
              enum: ['bariloche', 'camboriu', 'pucon', 'valdivia'],
            },
            codigoRegion: {
              type: 'STRING',
              description:
                "Código de región de Chile en minúsculas. Ejemplos: 'rm' (Metropolitana), 'v' (Valparaíso), 'vi' (O'Higgins), 'vii' (Maule), 'viii' (Biobío), 'ix' (Araucanía), 'xiv' (Los Ríos), 'x' (Los Lagos), 'xi' (Aysén), 'xii' (Magallanes), 'i' (Tarapacá), 'ii' (Antofagasta), 'iii' (Atacama), 'iv' (Coquimbo).",
            },
            nombreComuna: {
              type: 'STRING',
              description:
                "Nombre de la comuna en minúsculas y con guiones en lugar de espacios. Ejemplos: 'las-condes', 'temuco', 'concepcion'. Usar '_default' si no se especifica una comuna.",
            },
          },
          required: ['destino', 'codigoRegion', 'nombreComuna'],
        },
      },
      {
        name: 'crear_reunion',
        description:
          'Crea una reunión de Google Meet y retorna el link. Usar SOLO cuando el cliente confirme explícitamente que quiere una videollamada para conocer más detalles.',
        parameters: {
          type: 'OBJECT',
          properties: {
            nombreCliente: {
              type: 'STRING',
              description: 'Nombre del apoderado o persona de contacto.',
            },
            emailCliente: {
              type: 'STRING',
              description:
                'Correo electrónico del cliente para enviar la invitación. Solo incluir si el cliente lo proporcionó voluntariamente.',
            },
            fechaSugerida: {
              type: 'STRING',
              description:
                'Fecha sugerida para la reunión en formato YYYY-MM-DD. Si el cliente no especifica, proponer el siguiente día hábil.',
            },
            horaSugerida: {
              type: 'STRING',
              description:
                "Hora de inicio en formato HH:MM (zona horaria America/Santiago). Opciones habituales: '10:00', '11:00', '15:00', '16:00'.",
            },
          },
          required: ['nombreCliente', 'fechaSugerida', 'horaSugerida'],
        },
      },
    ],
  },
];

/**
 * @description System prompt con el contexto completo del negocio Giras Indómito.
 * @param {string} phoneNumber
 * @returns {string}
 */
function buildSystemPrompt(phoneNumber) {
  const today = new Date().toLocaleDateString('es-CL', {
    timeZone: 'America/Santiago',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `Eres el asistente virtual de Giras Indómito, empresa chilena especializada en giras de estudio para estudiantes de 1° a 4° Medio.

## Tu rol
Atiendes a apoderados interesados en contratar una gira de estudio para sus hijos. Eres amigable, profesional y conciso. Respondes en español chileno formal pero cercano. Nunca uses emojis excesivos.

## Destinos disponibles
- Pucón (Sur de Chile)
- Valdivia (Sur de Chile)
- Bariloche (Argentina)
- Camboriú (Brasil)

## Flujo de atención
1. Saluda cordialmente e identifica el destino de interés.
2. Pregunta la fecha aproximada del viaje (mes/año).
3. Pregunta desde qué región y comuna del país salen (necesario para el presupuesto correcto).
4. Con los tres datos confirmados (destino + región + comuna), llama a buscar_presupuestos y comparte los documentos encontrados.
5. Una vez enviados los presupuestos, consulta si el cliente desea más información detallada. Si confirma, ofrece agendar una reunión por Google Meet. Si acepta, llama a crear_reunion.

## Reglas estrictas
- Solo atiendes clientes en Chile. Si alguien indica estar fuera del país, indica que actualmente solo trabajan con colegios chilenos.
- No inventes precios ni condiciones. Si no hay presupuesto disponible para esa combinación, indica que el equipo se contactará a la brevedad para preparar uno personalizado.
- No uses crear_reunion sin confirmación explícita del cliente.
- No llames buscar_presupuestos si te faltan alguno de los tres datos: destino, región y comuna.
- Si el cliente ya entregó algunos datos en mensajes anteriores, no los pidas de nuevo. Recupera esa información del historial.
- Mantén las respuestas breves y al punto.

## Contexto actual
Fecha: ${today}
Número WhatsApp del cliente: ${phoneNumber}`;
}

/**
 * @description Ejecuta una herramienta según el nombre retornado por Gemini y devuelve el resultado.
 * @param {string} name - Nombre de la función.
 * @param {object} args - Argumentos de la función.
 * @returns {Promise<object>} Resultado de la herramienta.
 */
async function executeTool(name, args) {
  if (name === 'buscar_presupuestos') {
    return buscarPresupuestos(args);
  }
  if (name === 'crear_reunion') {
    return crearReunion(args);
  }
  throw new Error(`Herramienta desconocida: ${name}`);
}

/**
 * @description Ejecuta un turno de conversación con Gemini, manejando el loop de function calling.
 * Continúa llamando al modelo hasta obtener una respuesta de texto final.
 *
 * @param {Array<{role: string, parts: Array<{text: string}>}>} history - Historial previo de la conversación.
 * @param {string} newMessage - Nuevo mensaje del usuario.
 * @param {string} phoneNumber - Número de teléfono del cliente.
 * @returns {Promise<{
 *   responseText: string,
 *   toolsExecuted: Array<{name: string, args: object, result: object}>
 * }>}
 */
export async function runConversationTurn(history, newMessage, phoneNumber) {
  const genAI = await getGeminiClient();

  const model = genAI.getGenerativeModel({
    model: 'gemini-3.1-pro-preview-customtools',
    systemInstruction: buildSystemPrompt(phoneNumber),
    tools: TOOLS,
  });

  const chat = model.startChat({ history });

  let response = await chat.sendMessage(newMessage);
  const toolsExecuted = [];

  // Loop de function calling: Gemini puede pedir varias herramientas antes de responder con texto.
  while (true) {
    const candidate = response.response.candidates?.[0];
    const parts = candidate?.content?.parts || [];

    const functionCallPart = parts.find((p) => p.functionCall);
    if (!functionCallPart) break;

    const { name, args } = functionCallPart.functionCall;
    console.log(`[GEMINI] Llamando herramienta: ${name}`, JSON.stringify(args));

    let result;
    try {
      result = await executeTool(name, args);
    } catch (err) {
      result = { error: err.message };
    }

    toolsExecuted.push({ name, args, result });
    console.log(`[GEMINI] Resultado de ${name}:`, JSON.stringify(result));

    response = await chat.sendMessage([
      { functionResponse: { name, response: result } },
    ]);
  }

  const responseText = response.response.text();
  return { responseText, toolsExecuted };
}
