import { success } from "../../../helpers/responses.js";
import * as dynamoDbLib from '../../../libs/dynamodb-v3.js';
import { CachedDynamoDB, CacheKeys } from '../../../libs/cache/index.js';
import { standardMiddleware } from "../../../libs/middleware/index.js";

const {
  DYNAMODB_PROGRAM_TABLE,
  PROGRAM_TABLE,
  DYNAMODB_MAINTAINER_TABLE,
  DYNAMODB_PK_MAINTAINER_TABLE,
  DYNAMODB_PAYMENT_TABLE,
} = process.env;

const STATUS_ACTIONS = {
  pending: 'creó la solicitud para',
  approved: 'aprobó el programa de',
  confirmed: 'confirmó el programa de',
  completed: 'completó el programa de',
  rejected: 'rechazó el programa de',
};

/**
 * Obtiene todos los programas del periodo desde DynamoDB usando el GSI de fecha.
 */
const getProgramsByPeriod = (periodo) =>
  dynamoDbLib.query({
    TableName: DYNAMODB_PROGRAM_TABLE,
    IndexName: 'gsiStartDate-index',
    KeyConditionExpression: '#pk = :pk AND begins_with(#startDate, :startDate)',
    ExpressionAttributeValues: { ':pk': PROGRAM_TABLE, ':startDate': periodo },
    ExpressionAttributeNames: { '#pk': 'pk', '#startDate': 'startDate' },
  });

/**
 * Obtiene la lista de bancos desde el mantenedor con caché en memoria.
 */
const getBanksList = () =>
  CachedDynamoDB.query(
    {
      TableName: DYNAMODB_MAINTAINER_TABLE,
      ReturnConsumedCapacity: 'TOTAL',
      KeyConditionExpression: '#pk = :pk',
      ExpressionAttributeValues: { ':pk': DYNAMODB_PK_MAINTAINER_TABLE },
      ExpressionAttributeNames: { '#pk': 'pk' },
    },
    CacheKeys.bankList(),
    CacheKeys.TTL.BANK_LIST
  );

/**
 * Obtiene los pagos AUTHORIZED de un programa usando el GSI sk-index.
 * El sk del pago sigue el patrón: PAY#<programSk>, donde programSk = PRG#<id>.
 */
const getAuthorizedPaymentsByProgram = (programSk) =>
  dynamoDbLib.query({
    TableName: DYNAMODB_PAYMENT_TABLE,
    IndexName: 'sk-index',
    KeyConditionExpression: 'sk = :sk',
    FilterExpression: '#status = :status',
    ExpressionAttributeNames: { '#status': 'status' },
    ExpressionAttributeValues: { ':sk': `PAY#${programSk}`, ':status': 'AUTHORIZED' },
  });

/**
 * Calcula contadores de programas agrupados por estado.
 */
const countProgramsByStatus = (programs) => {
  const counts = { pending: 0, approved: 0, confirmed: 0, completed: 0, rejected: 0 };
  for (const p of programs) {
    if (p.status in counts) counts[p.status]++;
  }
  return { ...counts, total: programs.length };
};

/**
 * Formatea un número como moneda CLP sin decimales.
 */
const formatCLP = (value) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(value);

/**
 * Construye los KPIs del dashboard.
 * - Ingresos estimados: suma de totalWithUtilities de programas no rechazados.
 * - Ingresos recibidos: suma de amounts de pagos AUTHORIZED (se recibe como parámetro).
 * - Pasajeros: fijados en 0 hasta que esa funcionalidad esté implementada.
 */
const buildKpis = (programs, collectedRevenue) => {
  const active = programs.filter((p) => p.status !== 'rejected');
  const totalRevenue = active.reduce((sum, p) => sum + (p.content?.[0]?.totalWithUtilities ?? 0), 0);
  return [
    { title: 'Programas Activos', value: String(active.length), icon: 'pi pi-briefcase', change: 0, changeType: 'neutral' },
    { title: 'Ingresos Estimados', value: formatCLP(totalRevenue), icon: 'pi pi-dollar', change: 0, changeType: 'neutral' },
    { title: 'Ingresos Recibidos', value: formatCLP(collectedRevenue), icon: 'pi pi-credit-card', change: 0, changeType: 'neutral' },
    { title: 'Pasajeros Totales', value: '0', icon: 'pi pi-users', change: 0, changeType: 'neutral' },
  ];
};

/**
 * Filtra y ordena los próximos viajes (status != rejected y fecha >= hoy).
 */
const buildUpcomingTrips = (programs, today) =>
  programs
    .filter((p) => p.status !== 'rejected' && p.startDate >= today)
    .sort((a, b) => a.startDate.localeCompare(b.startDate))
    .slice(0, 10)
    .map((p) => ({
      id: p.id,
      destination: p.content?.[0]?.name ?? '',
      school: p.content?.[0]?.school ?? '',
      departureDate: p.startDate,
      status: p.status,
      passengerCount: 0,
    }));

/**
 * Construye la actividad reciente a partir de los últimos programas actualizados.
 */
const buildRecentActivity = (programs) =>
  [...programs]
    .filter((p) => p.updatedAt || p.createdAt)
    .sort((a, b) => (b.updatedAt ?? b.createdAt).localeCompare(a.updatedAt ?? a.createdAt))
    .slice(0, 8)
    .map((p) => ({
      id: p.id,
      user: p.user?.display ?? 'Sistema',
      action: STATUS_ACTIONS[p.status] ?? 'actualizó',
      target: `${p.content?.[0]?.school ?? ''} — ${p.content?.[0]?.name ?? ''}`,
      timestamp: p.updatedAt ?? p.createdAt,
      userAvatar: '/images/user-avatar.png',
    }));

/**
 * Handler principal del dashboard.
 * Retorna en una sola llamada: counts, KPIs (con ingresos reales desde payments),
 * próximos viajes, actividad reciente y cuentas bancarias.
 */
const handler = async (event) => {
  const action = 'Obtener datos del panel de control.';
  const { periodo } = event.queryParams ?? {};

  if (!periodo) {
    const error = new Error('Falta el periodo en la solicitud.');
    error.statusCode = 400;
    throw error;
  }

  const today = new Date().toISOString().split('T')[0];

  const [programsRaw, banksRaw] = await Promise.all([
    getProgramsByPeriod(periodo),
    getBanksList(),
  ]);

  const programs = programsRaw ?? [];
  const banks = banksRaw?.map(({ pk, sk, ...rest }) => rest) ?? [];

  // Consultar pagos de cada programa en paralelo usando sk-index
  const paymentResults = await Promise.all(programs.map((p) => getAuthorizedPaymentsByProgram(p.sk)));
  const collectedRevenue = paymentResults
    .flatMap((result) => result ?? [])
    .reduce((sum, payment) => sum + (payment.amount ?? 0), 0);

  const counts = countProgramsByStatus(programs);
  const kpis = buildKpis(programs, collectedRevenue);
  const upcomingTrips = buildUpcomingTrips(programs, today);
  const recentActivities = buildRecentActivity(programs);

  return success(200, { counts, kpis, upcomingTrips, recentActivities, banks }, action);
};

export const main = standardMiddleware(handler);
