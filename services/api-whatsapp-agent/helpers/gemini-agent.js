import { GoogleGenerativeAI } from '@google/generative-ai';
import { getParameterValue } from '../../../libs/parameter-store.js';
import { buscarPresupuestos } from '../tools/buscar-presupuestos.js';
import { crearReunion } from '../tools/crear-reunion.js';
import { listarReuniones } from '../tools/listar-reuniones.js';
import { reagendarReunion } from '../tools/reagendar-reunion.js';
import { eliminarReunion } from '../tools/eliminar-reunion.js';

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
          'Busca los PDFs de presupuesto disponibles en S3 para un destino y ubicación geográfica del cliente. Llamar solo cuando se tengan destino, codigoRegion y nombreComuna.',
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
                "Código de región de Chile en minúsculas. Ejemplos: 'i' (Tarapacá), 'ii' (Antofagasta), 'iii' (Atacama), 'iv' (Coquimbo), 'v' (Valparaíso), 'rm' (Metropolitana), 'vi' (O'Higgins), 'vii' (Maule), 'xvi' (Ñuble), 'viii' (Biobío), 'ix' (Araucanía), 'xiv' (Los Ríos), 'x' (Los Lagos), 'xi' (Aysén), 'xii' (Magallanes), 'xv' (Arica y Parinacota).",
            },
            nombreComuna: {
              type: 'STRING',
              description:
                "Nombre de la comuna en minúsculas y con guiones. Ejemplos: 'las-condes', 'temuco', 'concepcion'. Usar '_default' si no se especifica.",
            },
          },
          required: ['destino', 'codigoRegion', 'nombreComuna'],
        },
      },
      {
        name: 'listar_reuniones',
        description:
          'Lista las reuniones agendadas en el calendario de Giras Indómito dentro de un rango de fechas. SIEMPRE llamar antes de proponer horarios o de crear/reagendar reuniones para verificar disponibilidad. Retorna los eventos con su id, fecha, hora de inicio y hora de fin.',
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
    ],
  },
];

/**
 * @description System prompt del agente de Giras Indómito.
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

  return `Eres Valentina, asesora de viajes de Giras Indómito, empresa chilena de giras de estudio para 1° a 4° Medio.

## Cómo comunicarte
Escribe como lo haría una persona real por WhatsApp: natural, cálida, directa. Frases cortas.
No uses lenguaje corporativo ni frases de chatbot ("¡Claro que sí!", "¡Por supuesto!").
Un emoji ocasional está bien, pero sin excesos.
Nunca menciones que eres una IA ni un asistente virtual.

## Destinos disponibles
- Pucón (Sur de Chile)
- Valdivia (Sur de Chile)
- Bariloche (Argentina)
- Camboriú (Brasil)

## Flujo de atención
1. Saluda de forma natural e identifica el destino de interés.
2. Pregunta la fecha aproximada del viaje.
3. Pregunta región y comuna del cliente.
4. Con destino + región + comuna confirmados, llama buscar_presupuestos y comparte los documentos.
5. Si el cliente quiere más detalles, ofrece una videollamada.
6. Para agendar: PRIMERO llama listar_reuniones sobre el rango de fechas propuesto. Solo propón horarios que estén libres. Nunca propongas un horario ya ocupado ni fechas pasadas.
7. Con fecha y hora confirmadas, llama crear_reunion. El campo destino es obligatorio.
8. Si el cliente quiere reagendar: llama listar_reuniones para verificar disponibilidad y luego reagendar_reunion.
9. Si el cliente quiere cancelar: pide confirmación explícita y luego llama eliminar_reunion.

## Reglas
- Solo atiendes colegios chilenos.
- Nunca inventes precios, disponibilidad ni información que no tengas confirmada.
- Si no hay presupuesto disponible, indica que el equipo preparará uno personalizado.
- No pidas datos que el cliente ya entregó en el historial.
- No uses herramientas de calendario sin que el cliente lo haya pedido explícitamente.
- No agendes dos reuniones el mismo día y hora.

## Contexto
Fecha de hoy: ${today}
Número WhatsApp del cliente: ${phoneNumber}`;
}

/**
 * @description Ejecuta una herramienta según el nombre retornado por Gemini.
 * @param {string} name
 * @param {object} args
 * @returns {Promise<object>}
 */
async function executeTool(name, args) {
  switch (name) {
    case 'buscar_presupuestos': return buscarPresupuestos(args);
    case 'listar_reuniones':    return listarReuniones(args);
    case 'crear_reunion':       return crearReunion(args);
    case 'reagendar_reunion':   return reagendarReunion(args);
    case 'eliminar_reunion':    return eliminarReunion(args);
    default: throw new Error(`Herramienta desconocida: ${name}`);
  }
}

/**
 * @description Ejecuta un turno de conversación con Gemini, manejando el loop de function calling.
 *
 * @param {Array<{role: string, parts: Array<{text: string}>}>} history
 * @param {string} newMessage
 * @param {string} phoneNumber
 * @returns {Promise<{responseText: string, toolsExecuted: Array<{name: string, args: object, result: object}>}>}
 */
export async function runConversationTurn(history, newMessage, phoneNumber) {
  const genAI = await getGeminiClient();

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-pro-preview-05-06',
    systemInstruction: buildSystemPrompt(phoneNumber),
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
      result = await executeTool(name, args);
    } catch (err) {
      result = { error: err.message };
    }

    toolsExecuted.push({ name, args, result });
    console.log(`[GEMINI] Resultado ${name}:`, JSON.stringify(result));

    response = await chat.sendMessage([{ functionResponse: { name, response: result } }]);
  }

  const responseText = response.response.text();
  return { responseText, toolsExecuted };
}
