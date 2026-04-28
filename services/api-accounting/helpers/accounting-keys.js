/**
 * @description Claves DynamoDB para contabilidad: partición ACC compartida y SK por programa/período/tipo DTE.
 */

/** Prefijo programa cuando falta dato histórico (migración). */
export const LEGACY_PROGRAM_SEGMENT = '_LEGACY_NO_PROGRAM';

/**
 * @description Partition key fija de ítems ingreso/gasto (variable de entorno ACCOUNTING_PARTITION_PK).
 * @returns {string}
 */
export function getAccountingPartitionPk() {
  const pk = process.env.ACCOUNTING_PARTITION_PK;
  if (!pk || typeof pk !== 'string') {
    const err = new Error('Configuración ACCOUNTING_PARTITION_PK ausente.');
    err.statusCode = 500;
    throw err;
  }
  return pk.trim();
}

/**
 * @description Normaliza el segmento de programa para el SK (evita PRG# duplicado).
 * @param {string|undefined} programSk
 * @returns {string}
 */
export function normalizeProgramSegment(programSk) {
  const s = String(programSk ?? '').trim();
  if (!s) return LEGACY_PROGRAM_SEGMENT;
  return s.startsWith('PRG#') ? s.slice(4) : s;
}

/**
 * @description Mapa tipo documento gasto → código TPO en sort key.
 * @param {string} tipoDocumento
 * @returns {string}
 */
export function expenseTipoToTpo(tipoDocumento) {
  switch (tipoDocumento) {
    case 'FACTURA':
      return '33';
    case 'FACTURA_EXENTA':
      return '34';
    case 'BOLETA':
      return '39';
    case 'VOUCHER':
      return '61';
    case 'SIN_DOCUMENTO':
      return 'NODOC';
    default:
      return 'NODOC';
  }
}

/**
 * @description Mapa tipo documento ingreso → código TPO en sort key.
 * @param {string} tipoDocumento
 * @returns {string}
 */
export function incomeTipoToTpo(tipoDocumento) {
  switch (tipoDocumento) {
    case 'BOLETA_ELECTRONICA':
      return '39';
    case 'FACTURA_ELECTRONICA':
      return '33';
    case 'FACTURA_EXENTA':
      return '34';
    case 'SIN_DOCUMENTO':
      return 'NODOC';
    default:
      return 'NODOC';
  }
}

/**
 * @description Sort key gasto: PRG#…#EXP#DAT#YYYY-MM#TPO#…#<id>.
 */
export function buildExpenseSortKey({ programSk, periodo, tipoDocumento, id }) {
  const prog = normalizeProgramSegment(programSk);
  const tpo = expenseTipoToTpo(tipoDocumento);
  return `PRG#${prog}#EXP#DAT#${periodo}#TPO#${tpo}#${id}`;
}

/**
 * @description Sort key ingreso: PRG#…#INC#DAT#YYYY-MM#TPO#…#<id>.
 */
export function buildIncomeSortKey({ programSk, periodo, tipoDocumento, id }) {
  const prog = normalizeProgramSegment(programSk);
  const tpo = incomeTipoToTpo(tipoDocumento);
  return `PRG#${prog}#INC#DAT#${periodo}#TPO#${tpo}#${id}`;
}

/**
 * @description gsiOne para listar gastos por período.
 * @param {string} periodo - YYYY-MM
 */
export function gsiExpensePeriod(periodo) {
  return `EXPENSE_PERIOD#${periodo}`;
}

/**
 * @description gsiOne para listar ingresos por período.
 * @param {string} periodo - YYYY-MM
 */
export function gsiIncomePeriod(periodo) {
  return `INCOME_PERIOD#${periodo}`;
}

/**
 * @description Tipo DTE (string) para consulta Registro de Compras / validación factura recibida.
 * @param {{ tipoDocumento?: string }} gasto
 * @returns {string}
 */
export function expenseSiiQueryTipoRecibido(gasto) {
  const t = gasto?.tipoDocumento;
  if (t === 'FACTURA_EXENTA') return '34';
  return '33';
}

/**
 * @description userId de auditoría desde body (opcional): sin prefijo USR#.
 * @param {string|undefined} raw
 * @returns {string}
 */
export function normalizeAuditUserId(raw) {
  if (!raw || typeof raw !== 'string') return '';
  const t = raw.trim();
  if (!t) return '';
  return t.startsWith('USR#') ? t.slice(4) : t;
}
