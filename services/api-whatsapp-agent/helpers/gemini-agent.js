import { GoogleGenerativeAI } from '@google/generative-ai';
import { getParameterValue } from '../../../libs/parameter-store.js';
import { buscarPresupuestos } from '../tools/buscar-presupuestos.js';
import { crearReunion, buscarEventosPorTelefono } from '../tools/crear-reunion.js';
import { listarReunion } from '../tools/listar-reunion.js';
import { editarReunion } from '../tools/editar-reunion.js';
import { cancelarReunion } from '../tools/cancelar-reunion.js';
import { getCalendarAccessToken } from '../../../helpers/google-calendar-auth.js';

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
          'Busca los PDFs de presupuesto disponibles en S3 para un destino y región del cliente. Un archivo puede incluir varios destinos en su nombre (ej: pucon-bariloche-valdivia-camboriu-brasil-1.pdf). Llamar cuando se tengan destino y codigoRegion confirmados. Si el cliente mencionó su ciudad o comuna específica o camboriú (brasil), incluirla también.',
        parameters: {
          type: 'OBJECT',
          properties: {
            destino: {
              type: 'STRING',
              description:
                "Destino principal del viaje en minúsculas. Valores válidos actualmente: 'bariloche', 'camboriu'.",
              enum: ['bariloche', 'camboriu'],
            },
            codigoRegion: {
              type: 'STRING',
              description:
                "Código de región de Chile en minúsculas. Valores válidos: 'xv' (Arica y Parinacota), 'i' (Tarapacá), 'ii' (Antofagasta), 'iii' (Atacama), 'iv' (Coquimbo), 'v' (Valparaíso), 'rm' (Metropolitana), 'vi' (O'Higgins), 'vii' (Maule), 'xvi' (Ñuble), 'viii' (Biobío), 'ix' (Araucanía), 'xiv' (Los Ríos), 'x' (Los Lagos), 'xi' (Aysén), 'xii' (Magallanes), 'brasil' (usar 'brasil' siempre para cotizaciones de Camboriú/Brasil, sin importar la región origen).",
            },
            ciudad: {
              type: 'STRING',
              description:
                'Ciudad o comuna del colegio, solo si el cliente la mencionó explícitamente (ej: "Salamanca", "Viña del Mar"). No preguntar si no fue mencionada.',
            },
          },
          required: ['destino', 'codigoRegion'],
        },
      },
      {
        name: 'crear_reunion',
        description:
          'Crea una reunión de Google Meet. Usar SOLO cuando el cliente confirme explícitamente que quiere la videollamada.',
        parameters: {
          type: 'OBJECT',
          properties: {
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
          required: ['nombreCliente', 'fechaSugerida', 'horaSugerida'],
        },
      },
      {
        name: 'guardar_datos_reunion',
        description:
          'Persiste datos parciales de la reunión a medida que el cliente los proporciona. Llamar CADA VEZ que el cliente entregue nombre, fecha, hora o correo, ANTES de responderle. Así los datos no se pierden si la conversación se interrumpe.',
        parameters: {
          type: 'OBJECT',
          properties: {
            nombreCliente: {
              type: 'STRING',
              description: 'Nombre del cliente si lo proporcionó en este turno.',
            },
            fechaSugerida: {
              type: 'STRING',
              description: 'Fecha en formato YYYY-MM-DD si la proporcionó en este turno.',
            },
            horaSugerida: {
              type: 'STRING',
              description: 'Hora en formato HH:MM si la proporcionó en este turno.',
            },
            emailCliente: {
              type: 'STRING',
              description: 'Correo electrónico si lo proporcionó en este turno.',
            },
          },
          required: [],
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
            emailCliente: {
              type: 'STRING',
              description: 'Correo electrónico del cliente para enviarle la invitación actualizada. Requerido antes de reagendar.',
            },
          },
          required: ['nuevaFecha', 'nuevaHora', 'emailCliente'],
        },
      },
      {
        name: 'cancelar_reunion',
        description:
          'Cancela la reunión del cliente. OBLIGATORIO: primero preguntar explícitamente "¿Confirmas que deseas cancelar tu reunión? Esta acción no se puede deshacer." y esperar que el cliente responda afirmativamente. Solo entonces llamar esta función con confirmado=true.',
        parameters: {
          type: 'OBJECT',
          properties: {
            confirmado: {
              type: 'BOOLEAN',
              description: 'Debe ser true solo si el cliente respondió afirmativamente a la pregunta de confirmación. Nunca asumir confirmación implícita.',
            },
          },
          required: ['confirmado'],
        },
      },
      {
        name: 'sin_respuesta',
        description:
          'Llamar SOLO cuando el cliente realice consultas administrativas muy específicas que no puedas responder con tu conocimiento base (ej: estados de pago, problemas técnicos, reclamos complejos). No generar ningún texto de respuesta al cliente si usas esta herramienta.',
        parameters: {
          type: 'OBJECT',
          properties: {
            motivo: {
              type: 'STRING',
              description: 'Breve descripción interna de por qué no se puede responder. El cliente no verá esto.',
            },
          },
          required: ['motivo'],
        },
      },
    ],
  },
];

/**
 * @description System prompt del agente de Giras Indómito.
 * @param {string} phoneNumber
 * @param {object} collectedData - Datos recopilados en la sesión del cliente.
 * @param {string} channel - Canal de origen ('whatsapp', 'messenger', 'instagram').
 * @returns {string}
 */
function buildSystemPrompt(phoneNumber, collectedData, channel, hasHistory = false) {
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

  const pending = collectedData?.pendingMeeting;
  const datosPendientes = pending && Object.keys(pending).length > 0
    ? `\n  Datos de reunión ya recopilados (NO volver a solicitar): ${JSON.stringify(pending)}`
    : '';

  return `

  ## Eres Susana Guevara, encargada de operaciones y ventas de Giras Indómito, empresa chilena especializada en giras de estudio para estudiantes.

  ${hasHistory
  ? '## Conversación en curso — NO saludar\nNUNCA te presentes ni saludes. El cliente ya sabe quién eres. Responde directamente al mensaje sin ninguna introducción.'
  : `## Presentación al inicio de conversación\nEs el primer mensaje del cliente. Preséntate exactamente así:\n"${saludo}, mi nombre es Susana Guevara, encargada de operaciones y ventas de Giras Indómito."\nLuego continúa el flujo normalmente.`
  }

  ## Tu propósito
  Ayudar a los clientes (principalmente padres y alumnos) a organizar su gira de estudios. Tus funciones principales son:
  1. Entregar presupuestos en PDF según el destino y región del cliente.
  2. Gestionar la reunión de Google Meet del cliente (crear, consultar, reagendar o cancelar).
  3. Responder dudas generales sobre nuestros servicios, destinos y modalidades de viaje.

  ## Tu tono
  Amigable, profesional y conciso. Español chileno formal pero cercano. Sin emojis.

  ## Información de la Empresa y Servicios (Conocimiento Base)
  - **Nuestra Historia:** Giras Indómito nace del sueño de crear experiencias educativas inolvidables para estudiantes de todo Chile. Con años de trayectoria en el turismo estudiantil, nos hemos consolidado como una empresa líder en la organización de giras de estudio. Nuestra pasión es conectar a los jóvenes con destinos increíbles, promoviendo el aprendizaje, la convivencia y el desarrollo personal a través de experiencias únicas que marcan sus vidas. Cada viaje es cuidadosamente planificado considerando todos los detalles, desde la seguridad hasta las actividades recreativas, garantizando que cada momento sea memorable.
  - **Nuestra Misión:** Proporcionar experiencias educativas y recreativas de calidad excepcional para estudiantes, fomentando su desarrollo personal y social a través de viajes seguros, organizados e inolvidables.
  - **Nuestra Visión:** Ser la empresa líder en giras estudiantiles de Chile y la región, reconocida por nuestra excelencia en servicio, innovación constante y compromiso con la educación y el desarrollo integral de los jóvenes.
  - **Destinos Principales:** Bariloche (nuestra especialidad), Camboriú (Brasil), y giras por el Sur de Chile. (En Brasil solo hacemos giras para Camboriú).
  - **Actividades:**
    - *Brasil:* Visita a playa Laranjeiras, navegación en barco pirata en Porto Belo, Beto Carrero World (parque temático y de atracciones), parque de Aguas con fiesta de espumas, noches de disco, visita a Cristo Luz, visita parque Unipraias, entre otras.
    - *Bariloche:* Walking tour por Bariloche, visita a fábrica de chocolates, Bowling, circuito chico, noches de disco, termas de Puyehue, visita a Cerro Viejo, Foto grupal icónica de Bariloche con perro San Bernardo llamado Pocho, Escape Room, Paintball, Cuadrimotos, actividades sobre puentes colgantes y asado argentino.
    - *Sur de Chile:* En Pucón sería Canopy, Rafting, Lago Caburgua, Huilo-Huilo y visita Villarica. También se visita Chiloé, Lago LLanquihue, entre otros.
  - **Aventuras:**
    - *Brasil:* No hay e indicar las de Bariloche y Sur de Chile.
    - *Bariloche:* Paintball, Cuadrimotos, actividades en puentes colgantes.
    - *Sur de Chile:* Canopy, Rafting, Paintball.
  - **Precios por persona:** Existen 2 escenarios. Escenario 1: Antes de enviarle los programas/cotizaciones, debes solicitar la región de la que sale el grupo y el destino, luego sigue el flujo normal. Escenario 2: Después de haberle entregado las cotizaciones, debes indicarle que en la parte de abajo de los programas sale una tabla de precios según la cantidad de pasajeros.
  - **Transporte:** Dependiendo del destino, combinamos vuelos con buses de alto estándar para los tramos terrestres.
  - **Adultos/Acompañantes:** Consideramos un número base de liberados (profesores/apoderados) dependiendo del tamaño del grupo.

  ## Reglas de Respuesta
  - Si el cliente pregunta algo que conoces (destinos, qué ofrecemos, etc.), responde amablemente y luego intenta guiarlo hacia el envío de un presupuesto o el agendamiento de una reunión.
  - Si el cliente menciona un destino como Brasil, Camboriú o el Sur de Chile, y no tienes un PDF específico en "buscar_presupuestos", infórmale que sí trabajamos esos destinos y ofrécele agendar una reunión informativa para darle todos los detalles o que dentro de un momento se le enviará la información detallada (flujo "sin_respuesta").
  - **Derivación a Humano:** Llama a la herramienta "sin_respuesta" SOLO cuando la pregunta sea algo administrativo muy específico (ej: estado de un pago ya realizado, reclamos legales, no tienes los presupuestos solicitados o preguntas técnicas que no están en este conocimiento base). Para todo lo demás, intenta responder tú.

  ## Destinos disponibles para envío automático
  - Bariloche
  - Brasil (Camboriú)

  Nota: Solo puedes enviar PDFs automáticamente para Bariloche y Brasil (Camboriú). Para otros destinos, informa, ofrece la reunión y por último ejecuta "sin_respuesta".

  ## Flujo para entregar presupuestos
  ${channel === 'messenger' || channel === 'instagram' ?
  `IMPORTANTE: Esta conversación llega por ${channel === 'messenger' ? 'Messenger' : 'Instagram'}. NO uses buscar_presupuestos. Cuando el cliente pida presupuestos o información de viajes, responde exactamente: "Para recibir toda la información y presupuestos de nuestras giras, te invitamos a contactarnos por WhatsApp al +56 9 8609 8787, donde te atenderemos con todos los detalles."` :
  `1. Identifica el destino de interés.
  2. Pregunta desde qué región del país salen (Para Brasil, los presupuestos sirven para todas las regiones de Chile, usa 'brasil' como codigoRegion).
  3. Con destino y región, llama a buscar_presupuestos.
  4. Después de enviar los presupuestos/planes/cotizaciones, DEBES indicar exactamente lo siguiente: "Existen 2 descuentos; 10% descuento si cancelan en efectivo y 10% descuento al alumno que tenga un hermano que haya viajado con nosotros anteriormente, además tenemos un beneficio que sería una rifa pro-fondos donde los premios los ponemos nosotros y ustedes solo deben vender los números y el dinero recaudado lo pueden utilizar para costear el viaje o en lo que estimen conveniente".
  5. Finalmente, ofrece agendar la reunión online para entregar más detalles y esclarecer dudas. NO seas insistente, con ofrecerla 1 o 2 veces en toda la conversación es suficiente.`
  }

  ## Flujo para gestionar reuniones
  - **Si el cliente YA tiene una reunión** (ver "Estado de reunión" en el contexto):
    - Para cambiar fecha/hora: llamar SIEMPRE a editar_reunion. NUNCA llamar a crear_reunion aunque tengas todos los datos.
    - Para cancelar: pedir confirmación explícita, luego llamar cancelar_reunion.
    - Para consultar: llamar listar_reunion.
  - **Si el cliente NO tiene reunión** — Crear (seguir en orden):
    1. Cada vez que el cliente proporcione nombre, fecha, hora o correo, llama PRIMERO a guardar_datos_reunion con los datos recibidos en ese turno.
    2. Verifica si ya tienes TODOS los datos: nombre, fecha, hora y correo electrónico (revisa el historial Y los "Datos ya recopilados" del contexto).
    3. Si tienes TODOS los datos: llama a crear_reunion INMEDIATAMENTE. No pidas confirmación adicional.
    4. Si faltan datos: pide SOLO lo que falta en un único mensaje.
  - NUNCA repitas una pregunta sobre un dato que el cliente ya te proporcionó en esta conversación.

  ## Reglas estrictas
  - No inventes precios. Guía siempre al envío del PDF o a la reunión informativa.
  - Respuestas siempre breves y directas.
  - NUNCA uses los caracteres ¿ ni ¡. Usa solo ? y !.

  ## Contexto actual
  Fecha: ${today}
  Número WhatsApp del cliente: ${phoneNumber}
  Estado de reunión: ${estadoReunion}${datosPendientes}`;
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
 * @param {string} [phoneNumber] - Número del cliente (con o sin '+'). Fallback para sesiones stale.
 * @returns {Promise<object>} Resultado de la herramienta.
 */
async function executeTool(name, args, collectedData, phoneNumber) {
  const phone = phoneNumber?.replace(/^\+/, '') || null;

  if (name === 'sin_respuesta') {
    return { derivado: true, motivo: args.motivo };
  }
  if (name === 'guardar_datos_reunion') {
    // Los datos se persisten vía mergeCollectedData en ejecutar-agente-v1.js; nada que hacer aquí.
    return { guardado: true };
  }
  if (name === 'buscar_presupuestos') {
    return buscarPresupuestos(args);
  }
  if (name === 'crear_reunion') {
    // Eliminar reuniones previas: por teléfono (cubre sesiones stale) y por eventId (sesión activa).
    if (phone) {
      const accessToken = await getCalendarAccessToken();
      const previos = await buscarEventosPorTelefono(process.env.GOOGLE_CALENDAR_ID || 'primary', phone, accessToken).catch(() => []);
      await Promise.all(previos.map((e) =>
        cancelarReunion({ eventId: e.id }).catch((err) => console.warn('[GEMINI] No se pudo eliminar evento previo:', err.message))
      ));
    }
    if (collectedData?.eventId) {
      await cancelarReunion({ eventId: collectedData.eventId }).catch((err) =>
        console.warn('[GEMINI] No se pudo cancelar reunión por eventId:', err.message)
      );
    }
    return crearReunion({ ...args, destino: collectedData?.destino, phoneNumber: phone });
  }
  if (name === 'listar_reunion') {
    // El código viene siempre de la sesión, no del modelo.
    return listarReunion({ codigoEvento: collectedData?.codigoEvento });
  }
  if (name === 'editar_reunion') {
    return editarReunion({
      ...args,
      codigoEvento: collectedData?.codigoEvento,
      eventId: collectedData?.eventId,
      phoneNumber: phone,
    });
  }
  if (name === 'cancelar_reunion') {
    // Guard programático: bloquear la cancelación si el modelo no obtuvo confirmación explícita.
    if (args.confirmado !== true) {
      return { exito: false, mensaje: 'Confirmación requerida. Pregunta al cliente si confirma la cancelación antes de proceder.' };
    }
    return cancelarReunion({ codigoEvento: collectedData?.codigoEvento, eventId: collectedData?.eventId, phoneNumber: phone });
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
 * @param {string} [channel='whatsapp'] - Canal de origen ('whatsapp', 'messenger', 'instagram').
 * @returns {Promise<{
 *   responseText: string,
 *   toolsExecuted: Array<{name: string, args: object, result: object}>
 * }>}
 */
export async function runConversationTurn(history, newMessage, phoneNumber, collectedData = {}, channel = 'whatsapp', hasHistory = false) {
  const genAI = await getGeminiClient();

  const model = genAI.getGenerativeModel({
    model: 'gemini-3.1-pro-preview-customtools',
    systemInstruction: buildSystemPrompt(phoneNumber, collectedData, channel, hasHistory),
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
      result = await executeTool(name, args, collectedData, phoneNumber);
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
