import { success } from '../../../helpers/responses';
import { standardMiddleware } from '../../../libs/middleware/index.js';
import { getProgramsByPeriod } from '../helpers/fn-query-programs.js';

/**
 * Adapta y ordena los resultados de DynamoDB al formato de vista requerido.
 * Ordena primero por prioridad y luego por fecha de inicio.
 */
const adaptPrograms = (programs) => {
  if (!programs?.length) return [];
  const adaptedPrograms = programs
    .filter((p) => p.content?.[0])
    .map(({ sk, status, content, priority, startDate, sii }) => ({
      sk,
      status,
      type: content[0].type.id,
      school: content[0].school,
      course: content[0].course,
      season: content[0].season,
      representativeName: content[0].representative.name,
      startDate,
      sii,
      priority,
    }));

  adaptedPrograms.sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    return a.startDate.localeCompare(b.startDate);
  });

  return adaptedPrograms;
};

/**
 * Referencia mínima para selects: id = sk del programa, display = nombre legible + id.
 *
 * @param {object} program - Ítem DynamoDB del programa
 * @returns {{ id: string, display: string }}
 */
const buildProgramRef = (program) => {
  const c = program.content?.[0] ?? {};
  const name = (c.name || '').trim();
  const school = (c.school || '').trim();
  const course = (c.course || '').trim();
  const startDate = program.startDate || '';
  const label = name || [school, course].filter(Boolean).join(' — ') || program.sk;
  const withDate = startDate ? `${label} · ${startDate}` : label;
  return { id: program.sk, display: `${withDate} — ${program.sk}` };
};

/**
 * Handler: GET /v1/programas?periodo=YYYY[&status=approved][&refs=true]
 * - Sin `refs`: respuesta histórica (vista tabla de programas).
 * - Con `refs=true`: arreglo { id, display } para selects (ej. contabilidad).
 */
const handler = async (event) => {
  const action = 'Obtener programas por periodo.';
  const { periodo, status, refs } = event.queryParams ?? {};

  if (!periodo) {
    const error = new Error('Falta el periodo en la solicitud.');
    error.statusCode = 400;
    throw error;
  }

  const statusFilter = status && String(status).trim() ? String(status).trim() : undefined;
  const programs = await getProgramsByPeriod(periodo, { status: statusFilter });

  const wantsRefs = refs === 'true' || refs === '1';
  if (wantsRefs) {
    const refsList = (programs || [])
      .filter((p) => p.content?.[0])
      .map(buildProgramRef)
      .sort((a, b) => a.display.localeCompare(b.display, 'es'));
    return success(200, refsList, action);
  }

  const adaptedPrograms = adaptPrograms(programs || []);
  return success(200, adaptedPrograms, action);
};

export const main = standardMiddleware(handler);
