import { success } from "../../../helpers/responses.js";
import { standardMiddleware } from "../../../libs/middleware/index.js";
import { getProgramsByPeriod, getAuthorizedPaymentsByProgram } from '../helpers/fn-query-programs.js';

/**
 * Agrupa programas por estado para el dashboard de analytics.
 * Los programas 'confirmed' se agrupan en 'pending': tienen contrato generado
 * pero aún no han sido aprobados formalmente por la empresa.
 *
 * @param {Array} programs - Lista de programas del periodo.
 * @returns {{ pending: number, approved: number, completed: number, rejected: number }}
 */
const countByStatus = (programs) => {
  const counts = { pending: 0, approved: 0, completed: 0, rejected: 0 };
  for (const p of programs) {
    if (p.status === 'pending' || p.status === 'confirmed') counts.pending++;
    else if (p.status === 'approved') counts.approved++;
    else if (p.status === 'completed') counts.completed++;
    else if (p.status === 'rejected') counts.rejected++;
  }
  return counts;
};

/**
 * Construye el resumen de un programa individual para la lista de analytics.
 * - totalAmount: monto del contrato (contract.payments.totalGroup), 0 si no tiene contrato.
 * - paidAmount: suma de pagos AUTHORIZED del programa.
 * - participants: pasajeros del contrato o del contenido del programa.
 *
 * @param {Object} program - Objeto de programa desde DynamoDB.
 * @param {number} paidAmount - Suma de pagos AUTHORIZED del programa.
 * @returns {Object} Resumen del programa para analytics.
 */
const buildProgramSummary = (program, paidAmount) => {
  const content = program.content?.[0] ?? {};
  const totalAmount = parseFloat(content.contract?.payments?.totalGroup) || 0;
  return {
    sk: program.sk,
    programName: content.name ?? '',
    destination: content.destination?.display ?? '',
    departureDate: program.startDate,
    status: program.status,
    totalAmount,
    paidAmount,
    remainingAmount: Math.max(0, totalAmount - paidAmount),
    participants: content.contract?.payments?.totalPassengers ?? content.passengers ?? 0,
    currency: 'CLP',
  };
};

/**
 * Handler principal del endpoint de analytics.
 * Retorna estadísticas completas de programas y pagos para el periodo indicado:
 * - Total y conteo por estado de viajes.
 * - Cuotas configuradas (según contratos) y cuotas pagadas (pagos AUTHORIZED).
 * - Montos totales de contratos y pagos recibidos.
 * - Lista detallada de programas con montos y estado de pago.
 *
 * Sin SCAN: usa GSI `gsiStartDate-index` (programas) y `sk-index` (pagos).
 */
const handler = async (event) => {
  const action = 'Obtener datos de analytics.';
  const { periodo } = event.queryParams ?? {};

  if (!periodo) {
    const error = new Error('Falta el periodo en la solicitud.');
    error.statusCode = 400;
    throw error;
  }

  const programsRaw = await getProgramsByPeriod(periodo);
  const programs = programsRaw ?? [];

  const paymentResults = await Promise.all(
    programs.map((p) => getAuthorizedPaymentsByProgram(p.sk))
  );

  const tripsByStatus = countByStatus(programs);
  let totalInstallments = 0;
  let paidInstallments = 0;
  let totalProgramAmount = 0;
  let totalPaidAmount = 0;

  const programSummaries = programs.map((program, i) => {
    const content = program.content?.[0] ?? {};
    const installmentsQty = content.contract?.payments?.installments?.quantity ?? 0;
    const totalGroup = parseFloat(content.contract?.payments?.totalGroup) || 0;
    const programPayments = paymentResults[i] ?? [];
    const paidAmount = programPayments.reduce((sum, pay) => sum + (pay.amount ?? 0), 0);

    totalInstallments += installmentsQty;
    paidInstallments += programPayments.length;
    totalProgramAmount += totalGroup;
    totalPaidAmount += paidAmount;

    return buildProgramSummary(program, paidAmount);
  });

  return success(200, {
    totalTrips: programs.length,
    tripsByStatus,
    installments: { totalInstallments, paidInstallments },
    amounts: {
      totalProgramAmount,
      totalPaidAmount,
      totalByCurrency: [{ currency: 'CLP', amount: totalPaidAmount }],
    },
    totalCollected: totalPaidAmount,
    programs: programSummaries,
  }, action);
};

export const main = standardMiddleware(handler);
