import { GoogleGenerativeAI } from '@google/generative-ai';
import { getParameterValue } from '../../../libs/parameter-store.js';
import { buscarPresupuestos } from '../tools/buscar-presupuestos.js';
import { crearReunion, buscarEventosPorTelefono } from '../tools/crear-reunion.js';
import { listarReunion } from '../tools/listar-reunion.js';
import { listarReuniones } from '../tools/listar-reuniones.js';
import { editarReunion } from '../tools/editar-reunion.js';
import { cancelarReunion } from '../tools/cancelar-reunion.js';
import { getCalendarAccessToken } from '../../../helpers/google-calendar-auth.js';

/** Cache del cliente Gemini en memoria. */
let _geminiClient = null;

/**
 * @description Obtiene o inicializa el cliente de Gemini con API key desde Parameter Store,
 * salvo que exista GEMINI_API_KEY_EVAL (solo evaluaciones locales/CI; no configurar en Lambda producción).
 * @returns {Promise<GoogleGenerativeAI>}
 */
async function getGeminiClient() {
  if (_geminiClient) return _geminiClient;
  let api_key;
  if (process.env.GEMINI_API_KEY_EVAL) {
    api_key = process.env.GEMINI_API_KEY_EVAL;
  } else {
    const secretJson = await getParameterValue(process.env.GEMINI_SECRET_KEY);
    ({ api_key } = JSON.parse(secretJson));
  }
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
          'Busca PDFs de presupuesto en S3. Para Camboriú (Brasil) usa destino camboriu y codigoRegion brasil; los archivos reales se llaman brasil-1.pdf, brasil-2.pdf (el sistema los encuentra por destino camboriu). Para Bariloche usa la región chilena real del colegio (no uses brasil). Llamar cuando haya destino y codigoRegion confirmados. Si el cliente mencionó ciudad/comuna, incluirla en ciudad.',
        parameters: {
          type: 'OBJECT',
          properties: {
            destino: {
              type: 'STRING',
              description:
                "Destino principal del viaje en minúsculas. 'bariloche' (Argentina/Bariloche). 'camboriu' para Camboriú-Brasil (los PDF en S3 usan nombre brasil-N.pdf; no cambiar el valor del argumento).",
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
        name: 'listar_reuniones',
        description:
          'Lista las reuniones del calendario de Giras Indómito en un rango de fechas. Usar antes de proponer horarios para verificar disponibilidad.',
        parameters: {
          type: 'OBJECT',
          properties: {
            fechaInicio: {
              type: 'STRING',
              description: 'Fecha de inicio del rango en formato YYYY-MM-DD.',
            },
            fechaFin: {
              type: 'STRING',
              description: 'Fecha de fin del rango en formato YYYY-MM-DD.',
            },
          },
          required: ['fechaInicio', 'fechaFin'],
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
          'Cancela la reunión del cliente. OBLIGATORIO: primero preguntar explícitamente si confirma cancelar la reunión y que la acción no se puede deshacer (sin usar caracteres de apertura ¿ ni ¡), esperar respuesta afirmativa del cliente. Solo entonces llamar esta función con confirmado=true.',
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
          'Último recurso: solo pagos/reclamos ya cursados en sistemas internos, datos bancarios privados no públicos, o situaciones legales/administrativas fuera del conocimiento base. NO usar para documentación de viaje, cuotas, equipaje, talonarios, grupos grandes, Bariloche, Camboriú ni pedida de PDFs. IMPORTANTE: Si llamas esta herramienta, tu salida para este turno debe ser ÚNICAMENTE la llamada a sin_respuesta sin ningún texto conversacional al cliente (ni despedida ni excusa ni promesa de contacto). El equipo atiende periódicamente las conversaciones pendientes.',
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
export function buildSystemPrompt(phoneNumber, collectedData, channel, hasHistory = false) {
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

  const estadoPresupuestosPdf =
    collectedData?.presupuestosPdfEnviados === true
      ? '\n  Cotizaciones PDF: Ya se enviaron presupuestos en PDF en esta conversación. Aplica la regla del flujo: no repitas el párrafo literal largo de descuentos y rifa en envíos posteriores.'
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
  - **Precios por persona:** Escenario 1: Antes de enviar cotizaciones, debes conocer región de salida y destino; si ya figuran en el historial de esta conversación para el pedido actual, no vuelvas a pedirlos. Escenario 2: Después de haberle entregado los programas, indica que al final de cada uno hay tabla de precios según cantidad de pasajeros.
  - **Transporte:** Dependiendo del destino, combinamos vuelos con buses de alto estándar para los tramos terrestres. Si el cliente indica que el tramo terrestre es muy corto (ej: cercano a paso fronterizo) y cuestiona que el programa mencione avión, reconoce la observación y ofrece reunión online para revisar coordinación operativa según el programa sin inventar rutas que no estén en la cotización.
  - **Adultos/Acompañantes:** Consideramos un número base de liberados (profesores/apoderados) dependiendo del tamaño del grupo.

  ## Consultas frecuentes (responder aquí; NO usar sin_respuesta)
  - **Grupos mayores a 40 personas:** Sí se puede evaluar. Los valores siguen la tabla de cotización; cuando la tabla llega hasta 40 pasajeros, aplica la misma referencia de precio para grupos mayores salvo que el programa indique otra cosa.
  - **Documentación para viajar:** Mayores de 18 años: carnet de identidad vigente y en buen estado. Menores de edad: permiso notarial autorizado por ambos padres, certificado de nacimiento y carnet de identidad vigente en buen estado. Si un padre está fallecido, se solicita certificado de defunción. Si un padre no puede comparecer por causas justificadas, en tribunal de familia puede gestionarse permiso para salir del país.
  - **Talonarios / rifa beneficio:** Hay 3 talonarios por persona que se entregan al firmar contrato o en los días siguientes a la firma. Cada número vale $1000 CLP; el dinero recaudado puede destinarse a costear el viaje u otros fines que el curso defina. Los premios los pone Giras Indómito y ustedes solo venden los números (coherente con el beneficio rifa ya mencionado en cotizaciones).
  - **Cuotas:** Las cuotas las define el curso y son sin interés. Si pagan una cuota en efectivo, aplica 10% de descuento sobre esa cuota (coherente con el descuento por efectivo ya mencionado).
  - **Equipaje (referencia aéreo):** Tarifa Zero: solo bolso de mano hasta 10 kg. Tarifa Light: bolso de mano hasta 10 kg más un equipaje de cabina hasta 10 kg.
  - **Plazos para reservar o vigencia de cotización:** Dependen del programa y temporada. Ofrece reunión online para revisarlo sin inventar fechas límite. Para disponibilidad de horarios de reunión puedes usar listar_reuniones.

  ## Ayuda memoria región Chile (codigoRegion para Bariloche)
  Ejemplos comunes: Tarapacá (Alto Hospicio, Iquique): i. Antofagasta: ii. Metropolitana (Puente Alto, Santiago): rm. Valparaíso: v. Ñuble: xvi. Biobío: viii. Araucanía: ix. Los Ríos (Valdivia, etc.): xiv. Los Lagos (Puerto Montt, etc.): x. Aysén: xi. Magallanes: xii. Arica y Parinacota: xv. Maule: vii. O'Higgins: vi. Atacama: iii. Coquimbo: iv.

  ## Reglas de Respuesta
  - Si el cliente pregunta algo que conoces (destinos, qué ofrecemos, etc.), responde amablemente y luego intenta guiarlo hacia el envío de un presupuesto o el agendamiento de una reunión.
  - **Brasil/Camboriú:** Siempre que pidan Camboriú o Brasil en esa ciudad, primero llama buscar_presupuestos con destino camboriu y codigoRegion brasil (sirve para todas las regiones de Chile). No digas que no tienes documentos si aún no ejecutaste la herramienta.
  - **Argentina en cotización escolar:** Para el lado argentino lo habitual para giras de estudio es Bariloche (patagonia argentina).
  - **Argentina vs Brasil:** Si piden cotizar "Argentina" y "Brasil" por separado, aclara que la alternativa argentina típica para giras es Bariloche: ejecuta buscar_presupuestos para bariloche con la región chilena del colegio y otra llamada para camboriu con codigoRegion brasil; responde con UN solo mensaje que mencione ambos envíos (sin duplicar introducción).
  - **Dos destinos mismo pedido:** Tras dos llamadas buscar_presupuestos (ej: Bariloche + Camboriú), un único mensaje cohesivo y una sola invitación a reunión.
  - **Sur de Chile / otros destinos:** El envío automático de PDF en esta herramienta es principalmente Bariloche (por región) y Camboriú (carpeta brasil). Para otros circuitos del Sur u ofertas sin PDF automático, explica que sí trabajan esos destinos cuando aplique, ofrece reunión informativa y orienta sin ejecutar sin_respuesta salvo que sea un tema fuera de alcance comercial.
  - **Derivación a humano (sin_respuesta):** Solo para temas que no puedas resolver con lo anterior ni con buscar_presupuestos ni con reuniones (ej: estado puntual de un pago ya registrado en sistemas internos que no tienes, reclamos legales muy específicos). No uses sin_respuesta para preguntas cubiertas en "Consultas frecuentes". Ver sección "Silencio total al derivar".

  ## Silencio total al derivar (sin_respuesta)
  - Si debes llamar sin_respuesta: este turno debe consistir SOLO en esa llamada a herramienta. No escribas ningún texto al cliente (ni despedida, ni disculpa, ni "te contactará alguien", ni excusa breve). La conversación queda sin respuesta automática para que un integrante del equipo la revise en la bandeja.
  - Motivo: evitar mensajes vacíos de contenido útil y que el humano sea quien responda cuando corresponda.

  ## Destinos con PDF automático (WhatsApp)
  - Bariloche: carpeta presupuestos/{codigoRegion}/ archivos bariloche-N.pdf según región del colegio.
  - Camboriú (Brasil): carpeta presupuestos/brasil/ con archivos brasil-N.pdf; para buscar_presupuestos usa destino camboriu y codigoRegion brasil siempre.

  ## Flujo para entregar presupuestos
  ${channel === 'messenger' || channel === 'instagram' ?
  `IMPORTANTE: Esta conversación llega por ${channel === 'messenger' ? 'Messenger' : 'Instagram'}. NO uses buscar_presupuestos. Cuando el cliente pida presupuestos o información de viajes, responde exactamente: "Para recibir toda la información y presupuestos de nuestras giras, te invitamos a contactarnos por WhatsApp al +56 9 8609 8787, donde te atenderemos con todos los detalles."` :
  `1. Identifica el destino de interés. Si el cliente menciona Argentina en una cotización escolar, aclara en una frase que del lado argentino lo habitual para giras es Bariloche.
  2. Pregunta desde qué región del país salen SOLO si en el historial de esta conversación aún no quedó clara la región para el pedido actual (Para Brasil/Camboriú al llamar la herramienta usa codigoRegion brasil). Si el cliente ya dio región y destino y no cambió de tema, no repitas la pregunta.
  3. Con destino y región, llama a buscar_presupuestos. Si en un mismo pedido quieren dos destinos (ej: Bariloche y Camboriú), llama buscar_presupuestos dos veces y responde con UN solo mensaje corto que mencione ambos envíos de PDF y una sola invitación a reunión (sin repetir presentación ni párrafos duplicados).
  4. Texto descuentos y rifa: Indica el siguiente párrafo literal solo la PRIMERA vez en esta conversación que envías PDFs de presupuesto (primera entrega de cotizaciones en el hilo). Si ya enviaste PDFs en mensajes anteriores y en este turno envías otros PDFs adicionales, NO repitas el párrafo completo; como máximo una línea breve del tipo "Los descuentos y la rifa siguen siendo los indicados en los programas que te enviamos" u omítelo si es redundante.
  Párrafo solo en primera entrega de cotizaciones por PDF: "Existen 2 descuentos; 10% descuento si cancelan en efectivo y 10% descuento al alumno que tenga un hermano que haya viajado con nosotros anteriormente, además tenemos un beneficio que sería una rifa pro-fondos donde los premios los ponemos nosotros y ustedes solo deben vender los números y el dinero recaudado lo pueden utilizar para costear el viaje o en lo que estimen conveniente".
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
  - **Antes de guardar o confirmar una fecha/hora**, valida que esté dentro del horario disponible:
    - Lunes a viernes: 09:00 a 23:00 hrs.
    - Sábado: 09:00 a 14:00 hrs.
    - Domingo: no disponible.
    Si la fecha/hora solicitada cae fuera de este horario, informa al cliente que no es posible agendar en ese momento e indícale los días y horarios disponibles para que elija uno nuevo. No llames a guardar_datos_reunion ni a crear_reunion con una hora fuera de horario.

  ## Reglas estrictas
  - No inventes precios. Guía siempre al envío del PDF o a la reunión informativa.
  - Respuestas siempre breves y directas.
  - No vuelvas a pedir región de salida ni destino si el cliente ya los indicó en esta conversación para el tema actual, salvo que cambien de pedido o contradigan lo anterior.
  - NUNCA uses los caracteres ¿ ni ¡. Usa solo ? y !.

  ## Contexto actual
  Fecha: ${today}
  Número WhatsApp del cliente: ${phoneNumber}
  Estado de reunión: ${estadoReunion}${datosPendientes}${estadoPresupuestosPdf}`;
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
  if (name === 'listar_reuniones') {
    return listarReuniones(args);
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
    generationConfig: {
      temperature: 0.35,
      topP: 0.95,
    },
  });

  const chat = model.startChat({ history });
  let response = await chat.sendMessage(newMessage);
  const toolsExecuted = [];

  while (true) {
    const candidate = response.response.candidates?.[0];
    const parts = candidate?.content?.parts || [];
    const calls = parts.filter((p) => p.functionCall);
    
    if (calls.length === 0) break;

    const responses = await Promise.all(calls.map(async (part) => {
      const { name, args } = part.functionCall;
      console.log(`[GEMINI] Herramienta: ${name}`, JSON.stringify(args));

      let result;
      try {
        result = await executeTool(name, args, collectedData, phoneNumber);
      } catch (err) {
        result = { error: err.message };
      }

      toolsExecuted.push({ name, args, result });
      console.log(`[GEMINI] Resultado ${name}:`, JSON.stringify(result));

      return {
        functionResponse: {
          name,
          response: sanitizeResultForModel(name, result),
        },
      };
    }));

    response = await chat.sendMessage(responses);
  }

  let responseText = response.response.text();
  if (toolsExecuted.some((t) => t.name === 'sin_respuesta')) {
    responseText = '';
  }
  return { responseText, toolsExecuted };
}
