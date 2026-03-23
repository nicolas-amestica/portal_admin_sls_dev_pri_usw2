import { GoogleGenerativeAI } from '@google/generative-ai';
import { getParameterValue } from '../../../libs/parameter-store.js';
import { buscarPresupuestos } from '../tools/buscar-presupuestos.js';
import { crearReunion } from '../tools/crear-reunion.js';
import { listarReunion } from '../tools/listar-reunion.js';
import { editarReunion } from '../tools/editar-reunion.js';
import { cancelarReunion } from '../tools/cancelar-reunion.js';

/** Cache del cliente Gemini en memoria. */
let _geminiClient = null;

/**
 * @description Obtiene o inicializa el cliente de Gemini con la API key desde Parameter Store.
 * @returns {Promise<GoogleGenerativeAI>}
 */
async function getGeminiClient() {
  if (_geminiClient) return _geminiClient;
  const secretJson = await getParameterValue(process.env.GEMINI_SECRET_KEY);
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
          'Busca los PDFs de presupuesto disponibles en S3 para un destino y región del cliente. Retorna URLs de descarga válidas por 24 horas. Llamar solo cuando se tengan destino y codigoRegion confirmados.',
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
                "Código de región de Chile en minúsculas. Ejemplos: 'rm' (Metropolitana), 'v' (Valparaíso), 'vi' (O'Higgins), 'vii' (Maule), 'viii' (Biobío), 'ix' (Araucanía), 'xiv' (Los Ríos), 'x' (Los Lagos), 'xi' (Aysén), 'xii' (Magallanes), 'xvi' (Ñuble), 'i' (Tarapacá), 'ii' (Antofagasta), 'iii' (Atacama), 'iv' (Coquimbo).",
            },
          },
          required: ['destino', 'codigoRegion'],
        },
      },
      {
        name: 'listar_reuniones',
        description:
          'Crea una reunión de Google Meet y retorna el link y un código único del evento. Usar SOLO cuando el cliente confirme explícitamente que quiere una videollamada para conocer más detalles.',
        parameters: {
          type: 'OBJECT',
          properties: {
            fechaInicio: {
              type: 'STRING',
              description: 'Fecha de inicio del rango a consultar en formato YYYY-MM-DD.',
            },
            fechaFin: {
              type: 'STRING',
              description: 'Fecha de fin del rango a consultar en formato YYYY-MM-DD.',
            },
          },
          required: ['fechaInicio', 'fechaFin'],
        },
      },
      {
        name: 'crear_reunion',
        description:
          'Crea una reunión de Google Meet. Usar SOLO cuando el cliente confirme explícitamente que quiere la videollamada y ya se haya verificado disponibilidad con listar_reuniones.',
        parameters: {
          type: 'OBJECT',
          properties: {
            destino: {
              type: 'STRING',
              description: 'Destino del viaje (se incluye en el título de la reunión).',
              enum: ['bariloche', 'camboriu', 'pucon', 'valdivia'],
            },
            nombreCliente: {
              type: 'STRING',
              description: 'Nombre del apoderado o persona de contacto.',
            },
            emailCliente: {
              type: 'STRING',
              description: 'Correo electrónico del cliente. Solo incluir si lo proporcionó voluntariamente.',
            },
            fechaSugerida: {
              type: 'STRING',
              description: 'Fecha en formato YYYY-MM-DD. Debe estar libre según listar_reuniones y no ser fecha pasada.',
            },
            horaSugerida: {
              type: 'STRING',
              description: "Hora de inicio en formato HH:MM (zona horaria America/Santiago).",
            },
          },
          required: ['destino', 'nombreCliente', 'fechaSugerida', 'horaSugerida'],
        },
      },
      {
        name: 'reagendar_reunion',
        description:
          'Reagenda una reunión existente a una nueva fecha y hora. Verificar disponibilidad con listar_reuniones antes de llamar esta función. El eventId se obtiene de listar_reuniones.',
        parameters: {
          type: 'OBJECT',
          properties: {
            eventId: {
              type: 'STRING',
              description: 'ID del evento de Google Calendar a reagendar. Obtenido de listar_reuniones.',
            },
            nuevaFecha: {
              type: 'STRING',
              description: 'Nueva fecha en formato YYYY-MM-DD. No puede ser fecha pasada.',
            },
            nuevaHora: {
              type: 'STRING',
              description: 'Nueva hora de inicio en formato HH:MM (America/Santiago).',
            },
          },
          required: ['eventId', 'nuevaFecha', 'nuevaHora'],
        },
      },
      {
        name: 'eliminar_reunion',
        description:
          'Cancela y elimina una reunión del calendario. Usar SOLO con confirmación explícita del cliente. El eventId se obtiene de listar_reuniones.',
        parameters: {
          type: 'OBJECT',
          properties: {
            eventId: {
              type: 'STRING',
              description: 'ID del evento de Google Calendar a eliminar. Obtenido de listar_reuniones.',
            },
          },
          required: ['eventId'],
        },
      },
      {
        name: 'listar_reunion',
        description:
          'Muestra la información de la reunión agendada por el cliente. Solo funciona si el cliente ya creó una reunión previamente en esta conversación.',
        parameters: {
          type: 'OBJECT',
          properties: {},
          required: [],
        },
      },
      {
        name: 'editar_reunion',
        description:
          'Reagenda la reunión del cliente a una nueva fecha y hora. Solo funciona si el cliente ya tiene una reunión creada. Solicitar confirmación antes de ejecutar.',
        parameters: {
          type: 'OBJECT',
          properties: {
            nuevaFecha: {
              type: 'STRING',
              description: 'Nueva fecha en formato YYYY-MM-DD.',
            },
            nuevaHora: {
              type: 'STRING',
              description: "Nueva hora de inicio en formato HH:MM (America/Santiago). Ejemplos: '10:00', '15:00'.",
            },
          },
          required: ['nuevaFecha', 'nuevaHora'],
        },
      },
      {
        name: 'cancelar_reunion',
        description:
          'Cancela la reunión del cliente. Solo funciona si el cliente ya tiene una reunión creada. Solicitar confirmación explícita antes de ejecutar.',
        parameters: {
          type: 'OBJECT',
          properties: {},
          required: [],
        },
      },
    ],
  },
];

/**
 * @description System prompt del agente de Giras Indómito.
 * @param {string} phoneNumber
 * @param {object} collectedData - Datos recopilados en la sesión del cliente.
 * @returns {string}
 */
function buildSystemPrompt(phoneNumber, collectedData) {
  const now = new Date();

  const today = now.toLocaleDateString('es-CL', {
    timeZone: 'America/Santiago',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const hour = Number(now.toLocaleString('es-CL', { timeZone: 'America/Santiago', hour: 'numeric', hour12: false }));
  const saludo = hour >= 6 && hour < 13 ? 'Buenos días' : hour >= 13 && hour < 21 ? 'Buenas tardes' : 'Buenas noches';

  const tieneReunion = !!collectedData?.codigoEvento;
  const estadoReunion = tieneReunion
    ? `El cliente YA tiene una reunión agendada con código [${collectedData.codigoEvento}].`
    : 'El cliente aún NO tiene una reunión agendada.';

  return `Eres Susana Guevara, encargada de ventas y asesoramiento de Giras Indómito, empresa chilena especializada en giras de estudio para estudiantes de 1° a 4° Medio.

## Tu único propósito
Tienes DOS funciones exclusivas y no realizas ninguna otra:
1. Entregar presupuestos en PDF según el destino y región del cliente.
2. Gestionar la reunión de Google Meet del cliente (crear, consultar, reagendar o cancelar).

Si el cliente pregunta algo que no esté relacionado con estas dos funciones, deja el mensaje como "No leído" para que yo como administrador después responda directamente al cliente.

## Tu tono
Amigable, profesional y conciso. Español chileno formal pero cercano. Sin emojis excesivos.

## Destinos disponibles
- Bariloche

## Flujo para entregar presupuestos
1. Identifica el destino de interés.
2. Pregunta desde qué región del país salen.
3. Con destino y región confirmados, llama a buscar_presupuestos. Los archivos se envían automáticamente al cliente.
4. Tras enviar los presupuestos, consulta si desea agendar una reunión informativa por Google Meet.

## Flujo para gestionar reuniones
- Crear: llama a crear_reunion solo con confirmación explícita del cliente. Al finalizar, comunica el código del evento (ej: AB3X7F9K) e indica que con ese código puede consultar, reagendar o cancelar su reunión.
- Consultar: usa listar_reunion cuando el cliente lo solicite.
- Reagendar: usa editar_reunion. Confirma siempre la nueva fecha y hora antes de ejecutar.
- Cancelar: usa cancelar_reunion. Pide confirmación explícita antes de ejecutar.
- El código del evento se asigna automáticamente; el cliente no puede gestionar reuniones de otras personas.
- Si el cliente no tiene reunión agendada, informa amablemente y ofrece crear una.

## Reglas estrictas
- SOLO presupuestos y reuniones. Cualquier otra consulta, redirige amablemente.
- No inventes precios ni condiciones. Si no hay presupuesto disponible, indica que el equipo se contactará para preparar uno personalizado.
- No llames buscar_presupuestos si te falta destino o región.
- No uses crear_reunion sin confirmación explícita del cliente.
- Si el cliente ya entregó datos anteriormente, no los pidas de nuevo.
- Respuestas siempre breves y directas.
- NUNCA uses los caracteres ¿ ni ¡. Usa solo ? y !.

## Presentación al inicio de conversación
Cuando el cliente escriba por primera vez (historial vacío), preséntate exactamente así:
"${saludo}, mi nombre es Susana Guevara, encargada de ventas y asesoramiento de Giras Indómito. Te ayudaré con lo que necesites."
Luego continúa el flujo de atención normalmente.

## Contexto actual
Fecha: ${today}
Número WhatsApp del cliente: ${phoneNumber}
Estado de reunión: ${estadoReunion}`;
}

/**
 * @description Filtra el resultado de una herramienta antes de enviarlo a Gemini.
 * Elimina datos sensibles o internos que el modelo no debe ver (ej: URLs prefirmadas de S3).
 * El resultado completo (con URLs) se conserva en toolsExecuted para uso interno.
 *
 * @param {string} name - Nombre de la herramienta.
 * @param {object} result - Resultado completo de la herramienta.
 * @returns {object} Resultado seguro para enviar al modelo.
 */
function sanitizeResultForModel(name, result) {
  if (name === 'buscar_presupuestos' && Array.isArray(result.archivos)) {
    return {
      ...result,
      // Solo exponer nombres de archivo al modelo; las URLs las maneja el sistema.
      archivos: result.archivos.map(({ nombre }) => ({ nombre })),
    };
  }
  return result;
}

/**
 * @description Ejecuta una herramienta según el nombre retornado por Gemini y devuelve el resultado.
 * El codigoEvento siempre se toma de collectedData (nunca del modelo) para garantizar aislamiento.
 *
 * @param {string} name - Nombre de la función.
 * @param {object} args - Argumentos de la función provistos por Gemini.
 * @param {object} collectedData - Datos de sesión del cliente (incluye codigoEvento si ya creó reunión).
 * @returns {Promise<object>} Resultado de la herramienta.
 */
async function executeTool(name, args, collectedData) {
  if (name === 'buscar_presupuestos') {
    return buscarPresupuestos(args);
  }
  if (name === 'crear_reunion') {
    return crearReunion(args);
  }
  if (name === 'listar_reunion') {
    // El código viene siempre de la sesión, no del modelo.
    return listarReunion({ codigoEvento: collectedData?.codigoEvento });
  }
  if (name === 'editar_reunion') {
    return editarReunion({ ...args, codigoEvento: collectedData?.codigoEvento });
  }
  if (name === 'cancelar_reunion') {
    return cancelarReunion({ codigoEvento: collectedData?.codigoEvento });
  }
  throw new Error(`Herramienta desconocida: ${name}`);
}

/**
 * @description Ejecuta un turno de conversación con Gemini, manejando el loop de function calling.
 *
 * @param {Array<{role: string, parts: Array<{text: string}>}>} history - Historial previo de la conversación.
 * @param {string} newMessage - Nuevo mensaje del usuario.
 * @param {string} phoneNumber - Número de teléfono del cliente.
 * @param {object} collectedData - Datos de sesión del cliente (codigoEvento, destino, etc.).
 * @returns {Promise<{
 *   responseText: string,
 *   toolsExecuted: Array<{name: string, args: object, result: object}>
 * }>}
 */
export async function runConversationTurn(history, newMessage, phoneNumber, collectedData = {}) {
  const genAI = await getGeminiClient();

  const model = genAI.getGenerativeModel({
    model: 'gemini-3.1-pro-preview-customtools',
    systemInstruction: buildSystemPrompt(phoneNumber, collectedData),
    tools: TOOLS,
  });

  const chat = model.startChat({ history });
  let response = await chat.sendMessage(newMessage);
  const toolsExecuted = [];

  while (true) {
    const candidate = response.response.candidates?.[0];
    const parts = candidate?.content?.parts || [];
    const functionCallPart = parts.find((p) => p.functionCall);
    if (!functionCallPart) break;

    const { name, args } = functionCallPart.functionCall;
    console.log(`[GEMINI] Herramienta: ${name}`, JSON.stringify(args));

    let result;
    try {
      result = await executeTool(name, args, collectedData);
    } catch (err) {
      result = { error: err.message };
    }

    toolsExecuted.push({ name, args, result });
    console.log(`[GEMINI] Resultado ${name}:`, JSON.stringify(result));

    response = await chat.sendMessage([
      { functionResponse: { name, response: sanitizeResultForModel(name, result) } },
    ]);
  }

  const responseText = response.response.text();
  return { responseText, toolsExecuted };
}
