/**
 * @description Script de migración one-time: agrega extendedProperties.shared.agent='true'
 * a todas las reuniones de Google Calendar creadas por el agente IA.
 *
 * Las reuniones del agente se identifican porque su título contiene "AG —"
 * (formato: "AG — Nombre Cliente | Destino [CODIGO]").
 *
 * Ejecutar:
 *   AWS_PROFILE=pa-dev node scripts/backfill-agent-meetings.mjs [--dry-run]
 *
 * Flags:
 *   --dry-run   Muestra qué haría sin modificar nada en Google Calendar
 */

import * as httpClient from '../libs/axios.js';
import { getCalendarAccessToken, buildCalendarApiUrl } from '../helpers/google-calendar-auth.js';

const CALENDAR_ID =
  process.env.GOOGLE_CALENDAR_ID ??
  'c_22d82dc32bd2255c8e0a5de671df98c7338ca03b8528c26c9e091ea79bf4118c@group.calendar.google.com';

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');

// Variables de entorno requeridas por getCalendarAccessToken
process.env.GOOGLE_CALENDAR_OAUTH_SECRET_KEY ??= '/pa/dev/google-calendar-oauth';
process.env.GOOGLE_CALENDAR_ID ??= CALENDAR_ID;

/**
 * @description Lista todos los eventos del calendario con paginación completa.
 * @param {string} accessToken
 * @returns {Promise<object[]>}
 */
async function listarTodosLosEventos(accessToken) {
  const eventos = [];
  let pageToken = undefined;
  let pagina = 1;

  do {
    const params = {
      singleEvents: 'true',
      orderBy: 'startTime',
      timeMin: '2023-01-01T00:00:00Z',
      maxResults: '250',
      ...(pageToken && { pageToken }),
    };

    const url = buildCalendarApiUrl(CALENDAR_ID, null, params);
    const { data } = await httpClient.get(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const items = data.items || [];
    eventos.push(...items);
    pageToken = data.nextPageToken;

    console.log(`  Página ${pagina}: ${items.length} eventos (total acumulado: ${eventos.length})`);
    pagina++;
  } while (pageToken);

  return eventos;
}

/**
 * @description Aplica PATCH al evento para agregar agent='true' en extendedProperties.shared.
 * La API de Google Calendar hace merge en shared, por lo que no se pierden otros campos.
 * @param {string} eventId
 * @param {string} accessToken
 */
async function patchFlagAgent(eventId, accessToken) {
  const url = buildCalendarApiUrl(CALENDAR_ID, eventId);
  await httpClient.request({
    method: 'patch',
    url,
    data: { extendedProperties: { shared: { agent: 'true' } } },
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });
}

async function main() {
  console.log('══════════════════════════════════════════════════');
  console.log('  Backfill: flag agent en reuniones del agente IA ');
  console.log('══════════════════════════════════════════════════');

  if (DRY_RUN) {
    console.log('\n  ⚠  MODO DRY-RUN — no se modificará nada en Google Calendar\n');
  }

  console.log('\n[1/3] Obteniendo token de Google Calendar...');
  const accessToken = await getCalendarAccessToken();
  console.log('  Token obtenido.\n');

  console.log('[2/3] Listando todos los eventos del calendario...');
  const todos = await listarTodosLosEventos(accessToken);
  console.log(`  Total de eventos en el calendario: ${todos.length}\n`);

  // Identificar reuniones del agente IA (título contiene "AG —")
  const reunionesAgente = todos.filter((e) => e.summary?.includes('AG —'));

  console.log(`[3/3] Reuniones del agente IA encontradas: ${reunionesAgente.length}`);

  if (reunionesAgente.length === 0) {
    console.log('  No se encontraron reuniones del agente. Saliendo.');
    return;
  }

  const yaActualizadas = reunionesAgente.filter(
    (e) => e.extendedProperties?.shared?.agent === 'true'
  );
  const pendientes = reunionesAgente.filter(
    (e) => e.extendedProperties?.shared?.agent !== 'true'
  );

  console.log(`  Ya tienen el flag: ${yaActualizadas.length}`);
  console.log(`  Pendientes:        ${pendientes.length}\n`);

  if (pendientes.length === 0) {
    console.log('  Todas las reuniones ya tienen el flag agent=true. Nada que hacer.');
    return;
  }

  console.log('Reuniones a actualizar:');
  pendientes.forEach((e, i) => {
    const fecha = e.start?.dateTime?.slice(0, 10) ?? 'sin fecha';
    const phone = e.extendedProperties?.private?.phoneNumber ?? 'sin teléfono';
    const existente = Object.keys(e.extendedProperties?.shared ?? {}).join(', ') || 'vacío';
    console.log(
      `  ${String(i + 1).padStart(2)}. [${fecha}] ${e.summary}\n` +
      `      tel: ${phone}  |  shared actual: { ${existente} }`
    );
  });

  if (DRY_RUN) {
    console.log('\n  Dry-run completado. Ejecuta sin --dry-run para aplicar los cambios.');
    return;
  }

  console.log('\nAplicando actualizaciones...');
  let ok = 0;
  let fallidas = 0;

  for (const evento of pendientes) {
    try {
      await patchFlagAgent(evento.id, accessToken);
      ok++;
      console.log(`  ✓ ${evento.summary}`);
    } catch (err) {
      fallidas++;
      const detalle = err.response?.data?.error?.message ?? err.message;
      console.error(`  ✗ ${evento.summary}: ${detalle}`);
    }
    // Pausa de 200 ms por evento para respetar el rate limit de Google Calendar API
    await new Promise((r) => setTimeout(r, 200));
  }

  console.log(`\n══ COMPLETADO ══`);
  console.log(`  Actualizadas: ${ok}`);
  console.log(`  Fallidas:     ${fallidas}`);
}

main().catch((err) => {
  console.error('\n[ERROR FATAL]', err.message);
  process.exit(1);
});
