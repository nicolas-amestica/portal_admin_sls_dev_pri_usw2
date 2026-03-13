import { success } from "../../../helpers/responses";
import * as dynamoDbLib from "../../../libs/dynamodb-v3";
import { standardMiddleware } from "../../../libs/middleware/index.js";

const { DYNAMODB_PAYMENT_TABLE, DYNAMODB_PROGRAM_TABLE, PROGRAM_TABLE } = process.env;

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
 * Obtiene las cuotas calculadas de un programa con su estado de pago.
 *
 * Combina los datos del contrato del programa (estructura de cuotas)
 * con los pagos existentes para devolver un array de cuotas listo para mostrar.
 *
 * @example
 * GET /v1/pagos/cuotas?programId=REQ%2301JKXXX...
 */
const handler = async (event) => {
  const action = "Obtener cuotas del programa.";
  const programId = event.queryParams?.programId;

  if (!programId) {
    const error = new Error('El programId es requerido como query parameter.');
    error.statusCode = 400;
    throw error;
  }

  // Obtener programa y pagos en paralelo para minimizar latencia
  const [programResults, payments] = await Promise.all([
    dynamoDbLib.query({
      TableName: DYNAMODB_PROGRAM_TABLE,
      KeyConditionExpression: '#pk = :pk AND begins_with(#sk, :sk)',
      ExpressionAttributeValues: { ':pk': PROGRAM_TABLE, ':sk': programId },
      ExpressionAttributeNames: { '#pk': 'pk', '#sk': 'sk' },
    }),
    dynamoDbLib.query({
      TableName: DYNAMODB_PAYMENT_TABLE,
      IndexName: 'sk-index',
      KeyConditionExpression: 'sk = :sk',
      ExpressionAttributeValues: { ':sk': `PAY#${programId}` },
      ScanIndexForward: false,
    }),
  ]);

  const program = programResults?.[0] ?? null;

  if (!program) {
    const error = new Error('Programa no encontrado.');
    error.statusCode = 404;
    throw error;
  }

  const installments = calculateInstallments(program, payments || []);

  return success(200, installments, action);
};

export const main = standardMiddleware(handler);
