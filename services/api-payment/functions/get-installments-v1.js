import { success } from "../../../helpers/responses";
import * as dynamoDbLib from "../../../libs/dynamodb-v3";
import { standardMiddleware } from "../../../libs/middleware/index.js";
import { getProgram } from "../utils/program-utils.js";

const { DYNAMODB_PAYMENT_TABLE } = process.env;

/** Meses en español mapeados a índice (0-indexed). */
const MONTH_MAP = {
  Enero: 0, Febrero: 1, Marzo: 2, Abril: 3,
  Mayo: 4, Junio: 5, Julio: 6, Agosto: 7,
  Septiembre: 8, Octubre: 9, Noviembre: 10, Diciembre: 11,
};

/**
 * Retorna el último día del mes dado como ISO string.
 *
 * @param {number} year - Año
 * @param {number} month - Mes (0-indexed)
 * @returns {string} ISO string del último día del mes
 */
const lastDayOfMonth = (year, month) => new Date(year, month + 1, 0).toISOString();

/**
 * Calcula las cuotas de un programa con su estado de pago.
 * Lógica idéntica a la que existía en el frontend (fn-calculate-installments.ts).
 *
 * @param {Object} program - Registro del programa desde DynamoDB
 * @param {Array} payments - Pagos existentes del programa
 * @returns {Array} Array de cuotas calculadas
 */
const calculateInstallments = (program, payments) => {
  const installmentConfig = program.content?.[0]?.contract?.payments?.installments;
  if (!installmentConfig) return [];

  const { quantity, startMonth, groupInstallmentValue } = installmentConfig;

  const quantityNum = parseInt(quantity, 10);
  const installmentValueNum = parseFloat(groupInstallmentValue || '0');

  if (!quantityNum || quantityNum <= 0 || !installmentValueNum) return [];

  const startMonthNumber = MONTH_MAP[startMonth];
  if (startMonthNumber === undefined) {
    console.warn(`Mes de inicio inválido: ${startMonth}`);
    return [];
  }

  const programYear = program.startDate
    ? new Date(program.startDate).getFullYear()
    : new Date().getFullYear();

  // Indexar pagos AUTHORIZED o PENDING por número de cuota
  const paymentsByInstallment = new Map();
  for (const payment of (payments || [])) {
    if (payment.status === 'AUTHORIZED' || payment.status === 'PENDING') {
      paymentsByInstallment.set(payment.installmentNumber, payment);
    }
  }

  const result = [];
  for (let i = 1; i <= quantityNum; i++) {
    const monthOffset = i - 1;
    const dueMonth = (startMonthNumber + monthOffset) % 12;
    const yearOffset = Math.floor((startMonthNumber + monthOffset) / 12);

    const payment = paymentsByInstallment.get(i);
    const isPaid = !!payment && payment.status === 'AUTHORIZED';

    result.push({
      installmentNumber: i,
      amount: installmentValueNum,
      dueDate: lastDayOfMonth(programYear + yearOffset, dueMonth),
      isPaid,
      paymentId: payment?.id ?? null,
      paidAt: payment?.paidAt || null,
      // Permite al frontend detectar pagos PENDING recientes sin necesitar la lista de pagos
      pendingPaymentCreatedAt: (!isPaid && payment?.status === 'PENDING') ? payment.createdAt : null,
    });
  }

  return result;
};

/**
 * Construye las cuotas del cliente a partir del array de cuotas asignadas manualmente (sii = false).
 * Cada elemento del array es una cuota que el admin habilitó en un momento dado.
 *
 * @param {Object} program - Registro del programa desde DynamoDB
 * @param {Array} payments - Pagos existentes del programa
 * @returns {Array} Array de cuotas listo para mostrar al cliente
 */
const buildAssignedInstallments = (program, payments) => {
  const assigned = program.assignedInstallments;
  if (!Array.isArray(assigned) || assigned.length === 0) return [];

  // Indexar pagos AUTHORIZED o PENDING por número de cuota
  const paymentsByInstallment = new Map();
  for (const p of (payments || [])) {
    if (p.status === 'AUTHORIZED' || p.status === 'PENDING') {
      paymentsByInstallment.set(p.installmentNumber, p);
    }
  }

  return assigned.map(inst => {
    const payment = paymentsByInstallment.get(inst.installmentNumber);
    const isPaid = !!payment && payment.status === 'AUTHORIZED';
    return {
      installmentNumber: inst.installmentNumber,
      amount: inst.surchargedAmount,
      dueDate: inst.assignedAt,
      isPaid,
      paymentId: payment?.id ?? null,
      paidAt: payment?.paidAt || null,
      pendingPaymentCreatedAt: (!isPaid && payment?.status === 'PENDING') ? payment.createdAt : null,
    };
  });
};

/**
 * Obtiene las cuotas calculadas de un programa con su estado de pago.
 *
 * - Si sii = true: calcula cuotas desde el contrato (comportamiento estándar).
 * - Si sii = false: retorna la cuota asignada manualmente (o [] si aún no hay).
 *
 * @example
 * GET /v1/pagos/cuotas?programId=PRG%23uuid...
 */
const handler = async (event) => {
  const action = "Obtener cuotas del programa.";
  const rawProgramId = event.queryParams?.programId;

  if (!rawProgramId) {
    const error = new Error('El programId es requerido como query parameter.');
    error.statusCode = 400;
    throw error;
  }

  // API Gateway HTTP API no garantiza decodificación de query params; forzar decode
  const programId = decodeURIComponent(rawProgramId);

  // Obtener programa y pagos en paralelo para minimizar latencia
  const [program, payments] = await Promise.all([
    getProgram(programId),
    dynamoDbLib.query({
      TableName: DYNAMODB_PAYMENT_TABLE,
      IndexName: 'sk-index',
      KeyConditionExpression: 'sk = :sk',
      ExpressionAttributeValues: { ':sk': `PAY#${programId}` },
      ScanIndexForward: false,
    }),
  ]);

  if (!program) {
    const error = new Error('Programa no encontrado.');
    error.statusCode = 404;
    throw error;
  }

  const installments = program.sii === false
    ? buildAssignedInstallments(program, payments || [])
    : calculateInstallments(program, payments || []);

  return success(200, installments, action);
};

export const main = standardMiddleware(handler);
