/** Tolerancia de redondeo en CLP para comparaciones de ítems individuales. */
const ITEM_TOLERANCE = 2;
/** Tolerancia de redondeo en CLP para totales agregados (múltiples ítems). */
const AGGREGATE_TOLERANCE = 20;

/**
 * Crea un resultado de error de validación.
 *
 * @param {string} message - Mensaje descriptivo del error.
 * @returns {{ valid: false, error: string }}
 */
const fail = (message) => ({ valid: false, error: message });

/**
 * Verifica si dos números están dentro de una tolerancia de redondeo.
 *
 * @param {number} received - Valor recibido del cliente.
 * @param {number} expected - Valor esperado calculado en el servidor.
 * @param {number} [tolerance=ITEM_TOLERANCE] - Margen permitido.
 * @returns {boolean}
 */
const isClose = (received, expected, tolerance = ITEM_TOLERANCE) =>
  Math.abs(received - expected) <= tolerance;

/**
 * Acumula el subtotal de un ítem en el objeto de totales por moneda.
 *
 * @param {string|undefined} currencyId - ID de la moneda ('usd', 'brl', 'clp').
 * @param {number} subTotal - Subtotal del ítem en su moneda de origen.
 * @param {{ CLP: number, USD: number, BRL: number }} totals - Acumulador mutable.
 */
const accumulateCurrency = (currencyId, subTotal, totals) => {
  const key = (currencyId || 'clp').toUpperCase();
  if (key === 'USD') totals.USD += subTotal;
  else if (key === 'BRL') totals.BRL += subTotal;
  else totals.CLP += subTotal;
};

/**
 * Valida los datos financieros de un tripulante y acumula su subtotal.
 *
 * @param {Object} crew - Datos del tripulante.
 * @param {number} days - Días totales del programa.
 * @param {{ CLP: number, USD: number, BRL: number }} totals - Acumulador mutable.
 * @returns {{ valid: boolean, error: string|null }}
 */
const validateCrew = (crew, days, totals) => {
  if (!Number.isFinite(crew.price) || crew.price <= 0)
    return fail(`Precio inválido en tripulante "${crew.name}".`);

  const expectedSubTotal = crew.price * days;
  if (!isClose(crew.subTotal, expectedSubTotal))
    return fail(`Subtotal inconsistente en tripulante "${crew.name}" (esperado ~${Math.round(expectedSubTotal)}, recibido ${crew.subTotal}).`);

  if (!Number.isFinite(crew.iva) || crew.iva < 0)
    return fail(`IVA inválido en tripulante "${crew.name}".`);

  if (!isClose(crew.total, crew.subTotal + crew.iva))
    return fail(`Total inconsistente en tripulante "${crew.name}" (subTotal + iva ≠ total).`);

  accumulateCurrency(crew.currency?.id, crew.subTotal, totals);
  return { valid: true, error: null };
};

/**
 * Calcula el subtotal esperado de un servicio según su tipo.
 *
 * @param {Object} service - Datos del servicio.
 * @param {number} passengers - Número total de pasajeros.
 * @param {number} nightsStay - Número de noches de estadía.
 * @returns {number|null} Subtotal esperado, o null si el tipo es desconocido.
 */
const calcServiceExpectedSubTotal = (service, passengers, nightsStay) => {
  switch (service.type?.id) {
    case 'unique': return service.price;
    case 'per_passenger_once': return service.price * passengers;
    case 'per_passenger_night': return service.price * passengers * nightsStay;
    default: return null;
  }
};

/**
 * Valida los datos financieros de un servicio y acumula su subtotal.
 *
 * @param {Object} service - Datos del servicio.
 * @param {number} passengers - Número total de pasajeros.
 * @param {number} nightsStay - Noches de estadía.
 * @param {{ CLP: number, USD: number, BRL: number }} totals - Acumulador mutable.
 * @returns {{ valid: boolean, error: string|null }}
 */
const validateService = (service, passengers, nightsStay, totals) => {
  if (!Number.isFinite(service.price) || service.price <= 0)
    return fail(`Precio inválido en servicio "${service.name}".`);

  const expectedSubTotal = calcServiceExpectedSubTotal(service, passengers, nightsStay);
  if (expectedSubTotal === null)
    return fail(`Tipo de servicio desconocido en "${service.name}": "${service.type?.id}".`);

  if (!isClose(service.subTotal, expectedSubTotal))
    return fail(`Subtotal inconsistente en servicio "${service.name}" (esperado ~${Math.round(expectedSubTotal)}, recibido ${service.subTotal}).`);

  if (!Number.isFinite(service.iva) || service.iva < 0)
    return fail(`IVA inválido en servicio "${service.name}".`);

  if (!isClose(service.total, service.subTotal + service.iva))
    return fail(`Total inconsistente en servicio "${service.name}" (subTotal + iva ≠ total).`);

  accumulateCurrency(service.currency?.id, service.subTotal, totals);
  return { valid: true, error: null };
};

/**
 * Recalcula y valida todos los datos financieros del programa.
 * Detecta manipulaciones de precios y totales enviados desde el cliente.
 *
 * La validación cubre:
 * - Pasajeros y liberados dentro de rangos válidos.
 * - Subtotal de cada ítem consistente con precio × multiplicador según tipo.
 * - total = subTotal + iva para cada ítem.
 * - Total neto CLP consistente con la suma de ítems convertidos a CLP.
 * - netoWithUtilities >= neto (las utilidades no pueden ser negativas).
 * - pricePerPassengerWithRecharge dentro del rango [totalWithRecharge/passengers, totalWithRecharge/payingPassengers].
 *
 * @param {Object} data - Contenido del programa (content[0]).
 * @param {number} data.passengers - Total de pasajeros.
 * @param {number} data.freePassengers - Pasajeros liberados.
 * @param {number} data.days - Días totales.
 * @param {number} data.nightsStay - Noches de estadía.
 * @param {Object} data.rates - Tasas de cambio base ({ usd, brl }).
 * @param {Object} data.usdIncrease - Aumento por USD ({ id: number }).
 * @param {Object} data.brlIncrease - Aumento por BRL ({ id: number }).
 * @param {Array}  data.crews - Tripulantes.
 * @param {Array}  data.services - Servicios.
 * @param {number} data.neto - Total neto en CLP declarado por el cliente.
 * @param {number} data.netoWithUtilities - Neto + utilidad.
 * @param {number} data.totalWithRecharge - Neto + utilidad + recargo.
 * @param {number} data.pricePerPassengerWithRecharge - Precio por pasajero pagante (con recargo).
 * @returns {{ valid: boolean, error: string|null }}
 */
export const validateFinancialData = (data) => {
  const {
    crews = [], services = [],
    passengers, freePassengers,
    days, nightsStay,
    rates, usdIncrease, brlIncrease,
  } = data;

  // Validar pasajeros
  if (!Number.isFinite(passengers) || passengers <= 0)
    return fail('El número de pasajeros debe ser mayor a 0.');

  if (!Number.isFinite(freePassengers) || freePassengers < 0 || freePassengers >= passengers)
    return fail(`Los pasajeros liberados (${freePassengers}) son inválidos para ${passengers} pasajeros totales.`);

  if (!Number.isFinite(days) || days <= 0)
    return fail('El número de días debe ser mayor a 0.');

  if (!Number.isFinite(nightsStay) || nightsStay < 0)
    return fail('El número de noches de estadía es inválido.');

  // Acumular totales por moneda mientras se valida cada ítem
  const totals = { CLP: 0, USD: 0, BRL: 0 };

  for (const crew of crews) {
    const result = validateCrew(crew, days, totals);
    if (!result.valid) return result;
  }

  for (const service of services) {
    const result = validateService(service, passengers, nightsStay, totals);
    if (!result.valid) return result;
  }

  // Validar total neto CLP (sin utilidad ni IVA)
  const usdRate = (rates?.usd || 0) + Number(usdIncrease?.id || 0);
  const brlRate = (rates?.brl || 0) + Number(brlIncrease?.id || 0);
  const expectedNetCLP = Math.round(totals.CLP + totals.USD * usdRate + totals.BRL * brlRate);

  if (!isClose(data.neto, expectedNetCLP, AGGREGATE_TOLERANCE))
    return fail(`El total neto (${data.neto}) no coincide con la suma de los ítems (${expectedNetCLP}).`);

  // Validar que netoWithUtilities no sea menor al neto
  if (!Number.isFinite(data.netoWithUtilities) || data.netoWithUtilities < data.neto)
    return fail('El neto con utilidades no puede ser menor que el total neto.');

  // Validar pricePerPassengerWithRecharge dentro del rango posible
  const payingPassengers = Math.max(1, passengers - freePassengers);
  const minExpected = Math.floor(data.totalWithRecharge / passengers);
  const maxExpected = Math.ceil(data.totalWithRecharge / payingPassengers) + 10;

  if (!Number.isFinite(data.pricePerPassengerWithRecharge) || data.pricePerPassengerWithRecharge < minExpected || data.pricePerPassengerWithRecharge > maxExpected)
    return fail(`El precio por pasajero (${data.pricePerPassengerWithRecharge}) está fuera del rango esperado [${minExpected}, ${maxExpected}].`);

  return { valid: true, error: null };
};
