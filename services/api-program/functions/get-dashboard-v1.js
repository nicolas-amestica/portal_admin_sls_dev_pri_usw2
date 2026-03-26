import { success } from "../../../helpers/responses.js";
import { CachedDynamoDB, CacheKeys } from '../../../libs/cache/index.js';
import { standardMiddleware } from "../../../libs/middleware/index.js";
import { getProgramsByPeriod, getAuthorizedPaymentsByProgram } from '../helpers/fn-query-programs.js';

const {
  DYNAMODB_MAINTAINER_TABLE,
  DYNAMODB_PK_MAINTAINER_TABLE,
} = process.env;

const STATUS_ACTIONS = {
  pending: 'creó la solicitud para',
  approved: 'aprobó el programa de',
  confirmed: 'confirmó el programa de',
  completed: 'completó el programa de',
  rejected: 'rechazó el programa de',
};

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
 * - Programas activos: programas que no están rechazados ni cancelados.
 * - Ingresos estimados: suma de contract.payments.totalGroup de programas approved/completed,
 *   más los montos pagados (pagos AUTHORIZED) de programas en estado canceled.
 * - Ingresos recibidos: suma de amounts de pagos AUTHORIZED de todos los programas.
 * - Pasajeros: fijados en 0 hasta que esa funcionalidad esté implementada.
 *
 * @param {Array} programs - Lista de programas del periodo.
 * @param {number} collectedRevenue - Total de pagos AUTHORIZED de todos los programas.
 * @param {Array<Array>} paymentResults - Pagos AUTHORIZED por programa (mismo orden que programs).
 */
const buildKpis = (programs, collectedRevenue, paymentResults) => {
  const active = programs.filter((p) => p.status !== 'rejected' && p.status !== 'canceled');

  const revenueFromContracts = programs
    .filter((p) => p.status === 'approved' || p.status === 'completed')
    .reduce((sum, p) => sum + (parseFloat(p.content?.[0]?.contract?.payments?.totalGroup) || 0), 0);

  const canceledPaidRevenue = programs
    .filter((p) => p.status === 'canceled')
    .reduce((sum, p) => {
      const idx = programs.indexOf(p);
      const payments = paymentResults[idx] ?? [];
      return sum + payments.reduce((s, pay) => s + (pay.amount ?? 0), 0);
    }, 0);

  const estimatedRevenue = revenueFromContracts + canceledPaidRevenue;

  return [
    { title: 'Programas Activos', value: String(active.length), icon: 'pi pi-briefcase', change: 0, changeType: 'neutral' },
    { title: 'Ingresos Estimados', value: formatCLP(estimatedRevenue), icon: 'pi pi-dollar', change: 0, changeType: 'neutral' },
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
  const kpis = buildKpis(programs, collectedRevenue, paymentResults);
  const upcomingTrips = buildUpcomingTrips(programs, today);
  const recentActivities = buildRecentActivity(programs);

  return success(200, { counts, kpis, upcomingTrips, recentActivities, banks }, action);
};

export const main = standardMiddleware(handler);
