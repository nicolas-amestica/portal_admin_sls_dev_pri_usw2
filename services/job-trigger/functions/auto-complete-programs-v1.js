import * as dynamoDbLib from '../../../libs/dynamodb-v3';

const { PROGRAM_TABLE, DYNAMODB_PROGRAM_TABLE } = process.env;

// Solo se completan programas en estado activo (no pendientes ni rechazados)
const ACTIVE_STATUSES = new Set(['approved']);

/**
 * Retorna la fecha de hoy en zona horaria de Chile (America/Santiago) como YYYY-MM-DD.
 */
const getTodayChile = () =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Santiago' }).format(new Date());

/**
 * Extrae la fecha de término (YYYY-MM-DD) desde el segundo elemento de content[0].dates.
 * Retorna null si la estructura no es la esperada.
 */
const getEndDate = (program) => {
  const dates = program?.content?.[0]?.dates;
  if (!Array.isArray(dates) || dates.length < 2) return null;
  return dates[1].slice(0, 10);
};

/**
 * Lambda scheduled diaria que busca todos los programas cuya fecha de término
 * coincide con el día de hoy (hora Chile) y los marca como completados.
 *
 * Trigger: EventBridge cron — 06:00 UTC (≈ 03:00 AM hora Chile)
 */
export const main = async () => {
  const today = getTodayChile();
  console.log(`[auto-complete-programs] Iniciando. Fecha hoy en Chile: ${today}`);

  // Traer todos los programas bajo la pk (con paginación automática)
  const allPrograms = await dynamoDbLib.iterativeQuery({
    TableName: DYNAMODB_PROGRAM_TABLE,
    KeyConditionExpression: 'pk = :pk',
    ExpressionAttributeValues: { ':pk': PROGRAM_TABLE },
  });

  if (!allPrograms || allPrograms.length === 0) {
    console.log('[auto-complete-programs] No se encontraron programas en la tabla.');
    return { completed: 0 };
  }

  console.log(`[auto-complete-programs] Total de programas consultados: ${allPrograms.length}`);

  // Filtrar: fecha de término = hoy y estado activo
  const toComplete = allPrograms.filter((program) => {
    if (!ACTIVE_STATUSES.has(program.status)) return false;
    return getEndDate(program) === today;
  });

  console.log(`[auto-complete-programs] Programas a completar hoy: ${toComplete.length}`);

  if (toComplete.length === 0) {
    return { completed: 0 };
  }

  // Actualizar en paralelo (mismo patrón que complete-program-v1.js)
  const timestamp = new Date().toISOString();

  await Promise.all(
    toComplete.map((program) => {
      program.status = 'completed';
      program.priority = 4;
      program.updatedAt = timestamp;
      return dynamoDbLib.put({ TableName: DYNAMODB_PROGRAM_TABLE, Item: program });
    })
  );

  console.log(`${toComplete.length} programa(s) completado(s): ${toComplete.map(p => p.sk).join(', ')}`);

  return { completed: toComplete.length, programs: toComplete.map(p => p.sk) };
};
