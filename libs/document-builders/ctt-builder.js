import { formatDate, formatCurrency } from '../pdf-generator/helpers/formatters.js';
import { normalizeClientRepresentatives } from './normalize-client-representatives.js';

/**
 * Builder para documentos de tipo CONTRATO (CTT)
 *
 * Este builder genera la estructura de datos necesaria para crear un PDF
 * de contrato de prestación de servicios turísticos.
 */

/**
 * Genera los servicios incluidos formateados
 */
const buildServicesIncluded = (services = []) => {
  return services.map(service => service.description);
};

/**
 * Construye texto de representantes del cliente evitando redundancia
 */
const buildClientRepresentativesText = (clientRepresentative = [], institutionName = '') => {
  if (!Array.isArray(clientRepresentative) || clientRepresentative.length === 0) {
    return ':::SIN REPRESENTANTE NO ESPECIFICADO:::';
  }

  // Verificar si todos tienen el mismo curso
  const courses = [...new Set(clientRepresentative.map(rep => rep.course))];
  const sameCourse = courses.length === 1;

  if (sameCourse) {
    // Todos del mismo curso: listar nombres y DNIs, curso e institución al final
    const namesWithDNI = clientRepresentative
      .map(rep => `${rep.name || ':::SIN NOMBRE CLIENTE:::'}, cédula nacional de identidad número ${rep.dni || ':::SIN DNI CLIENTE:::'}`)
      .join(', y ');

    return `${namesWithDNI}, en representación del curso ${courses[0] || ':::SIN CURSO ESPECIFICADO:::'} del ${institutionName || ':::SIN INSTITUCIÓN NO ESPECIFICADA:::'}`;
  } else {
    // Cursos diferentes: incluir curso con cada representante
    return clientRepresentative
      .map(rep => `${rep.name || ':::SIN NOMBRE CLIENTE:::'}, cédula nacional de identidad número ${rep.dni || ':::SIN DNI CLIENTE:::'}, en representación del curso ${rep.course || ':::SIN CURSO ESPECIFICADO:::'}`)
      .join(', y ') + ` del ${institutionName || ':::SIN INSTITUCIÓN NO ESPECIFICADA:::'}`;
  }
};

/**
 * Construye el contenido completo del contrato para el PDF
 *
 * @param {Object} form - Datos del formulario de contrato
 * @returns {Object} Estructura de datos para generar el PDF
 */
export const buildDocumentData = (form = {}) => {

  const {
    trip = {},
    plan = {},
    institution = {},
    clientRepresentative: clientRepData = {},
    representatives = [],
    payments = {}
  } = form;

  const clientRepresentative = normalizeClientRepresentatives(clientRepData);

  // Fechas formateadas
  const contractDate = trip.contractDate ? formatDate(trip.contractDate) : { simple: '' };
  const departureDate = trip.departureDate ? formatDate(trip.departureDate) : { full: '' };
  const returnDate = trip.returnDate ? formatDate(trip.returnDate) : { full: '' };

  // Datos de pago
  const {
    bankAccount = {},
    conditions = {},
    downPayment = 0,
    groupBalance = 0,
    installments = {},
    maxExchangeRate = 0,
    priceInUSD = 0,
    pricePerPerson = 0,
    totalPassengers = 0,
    freePassengers = 0
  } = payments;

  // Construir texto de representantes legales de Giras Indómito
  const representativesText = representatives.length > 0
    ? representatives.map(rep => `${rep.name || ':::SIN NOMBRE REPRESENTANTE:::'}, cédula nacional de identidad número ${rep.dni || ':::SIN DNI REPRESENTANTE:::'}`).join(', y ')
    : ':::SIN REPRESENTANTE ESPECIFICADO:::';

  // Construir texto de representantes del cliente (optimizado para evitar redundancia)
  const clientRepresentativesText = buildClientRepresentativesText(
    clientRepresentative,
    institution.name || ':::SIN INSTITUCIÓN ESPECIFICADA:::'
  );

  // Construir contrato dinámico
  const contractData = {
    title: "CONTRATO DE PRESTACIÓN DE SERVICIOS TURÍSTICOS",

    generalData: `En ${trip.city || ':::SIN CIUDAD:::'}, ${contractDate.simple || ':::SIN FECHA:::'}, entre GIRAS INDÓMITO LIMITADA, RUT ${bankAccount.holderDNI || ':::SIN RUT:::'}, representada legalmente por ${representativesText || ':::SIN EMPRESA:::'}, según se acredita, en adelante "El Operador", por una parte; y por otra, ${clientRepresentativesText || ':::SIN REPRESENTANTES:::'}, en adelante "El Pasajero" o "Los Representantes".`,

    clauses: [
      {
        number: 1,
        title: "PRIMERO:",
        text: `El Operador y el Pasajero han convenido la realización de un programa de viaje con destino a ${trip.destination || ':::SIN DESTINO ACORDADO:::'}, con fecha de salida el ${departureDate.full || ':::SIN FECHA DE SALIDA:::'} y retorno el ${returnDate.full || ':::SIN FECHA DE RETORNO:::'}, partiendo desde ${trip.departurePoint || ':::SIN PUNTO DE SALIDA ACORDADO:::'}, domiciliado en ${institution.address || ':::SIN DIRECCIÓN NO ESPECIFICADA:::'}, y retornando al mismo lugar de origen. El programa detallado ha sido firmado por los comparecientes y forma parte integrante de este contrato por acuerdo unánime de ambas partes.`
      },
      {
        number: 2,
        title: "SEGUNDO:",
        text: `El transporte de los pasajeros se realizará en los medios pactados en el presente contrato, ya sean aéreos, terrestres o marítimos, cuya prestación es de exclusiva responsabilidad del Operador.`
      },
      {
        number: 3,
        title: "TERCERO:",
        text: `El alojamiento hotelero de los pasajeros se realizará en los hoteles, habitaciones y regímenes pactados. Sin perjuicio de lo anterior, estos podrán ser modificados garantizando la misma categoría y condiciones de los servicios contratados, asegurando que todos los pasajeros del grupo permanezcan en un mismo establecimiento.`
      },
      {
        number: 4,
        title: "CUARTO:",
        text: `El Operador podrá introducir cambios en las rutas y horarios previamente establecidos, siempre que sean acordados con los Representantes del viaje, por las siguientes razones: a) De fuerza mayor, cuando pudieran afectar la seguridad de los pasajeros; b) Aquellas destinadas a mejorar el cumplimiento de los objetivos previstos.`
      },
      {
        number: 5,
        title: "QUINTO:",
        text: `El programa deberá cumplirse en los términos estipulados. En todo caso, el representante del Operador (Coordinador) podrá convenir con los Representantes otras actividades que sean consideradas apropiadas por las partes. Estas ampliaciones del programa original serán de exclusivo cargo de los Representantes.`
      },
      {
        number: 6,
        title: "SEXTO:",
        text: `La seguridad de los pasajeros es responsabilidad común de ambas partes. Las responsabilidades que se originen por conducta inadecuada de los pasajeros son de carácter individual, según corresponda al o los autores directos.`
      },
      {
        number: 7,
        title: "SÉPTIMO:",
        text: `Cualquier daño, desperfecto o deterioro parcial de partes, piezas, instalaciones o accesorios de los vehículos o de los establecimientos comerciales, hoteles, moteles, restaurantes y otros que presten servicios previstos en el programa, ocasionado por hecho o culpa del pasajero o sus acompañantes, será de responsabilidad exclusiva de sus autores, si se pueden identificar, o del grupo en su totalidad si ello no fuera posible. Corresponderá al pasajero o sus acompañantes indemnizar inmediatamente a los afectados. El Operador deslinda toda responsabilidad en dichos eventos, sin perjuicio de cooperar en la búsqueda de soluciones apropiadas y justas.`
      },
      {
        number: 8,
        title: "OCTAVO:",
        text: `El Operador no se responsabilizará por daños y perjuicios que pudieran sufrir los pasajeros, sus bienes o personas, cuando la responsabilidad sea de estos mismos. Es deber del o los pasajeros mayores de edad velar por la integridad de los estudiantes, así como también controlar y regular el consumo de bebidas alcohólicas, drogas y/o medicamentos.`
      },
      {
        number: 9,
        title: "NOVENO:",
        text: `Todos los gastos que se generen como consecuencia de acciones u omisiones de los pasajeros serán de exclusivo cargo de estos. Asimismo, los gastos que se generen como consecuencia de acciones u omisiones del Operador serán de exclusivo cargo de este último.`
      },
      {
        number: 10,
        title: "DÉCIMO:",
        text: `En caso de que el viaje tuviera que acortarse o prolongarse de los términos pactados por razones fuera de control de ambas partes, tales como catástrofes naturales, accidentes, cortes de puentes, caminos obstruidos u otras no imputables al Operador ni al Pasajero, se considerará que no se pudieron cumplir por fuerza mayor. Sin perjuicio de lo anterior, el Operador prestará toda la ayuda necesaria para dar por cumplido el servicio o buscar las compensaciones que correspondan.`
      },
      {
        number: 11,
        title: "DÉCIMO PRIMERO:",
        text: `Los participantes del programa quedan cubiertos por el seguro correspondiente a los vehículos de transporte de pasajeros, según la legislación del país de destino.`
      },
      {
        number: 12,
        title: "DÉCIMO SEGUNDO:",
        text: `Los programas incluirán exclusivamente lo señalado en el presente contrato y serán confirmados bajo previa reserva con una cuota inicial correspondiente al ${conditions.depositPercentageWithFlight || ':::SIN PORCENTAJE DE DEPÓSITO CON AÉREOS:::'}% del valor del programa con aéreos y ${conditions.depositPercentageWithoutFlight || ':::SIN PORCENTAJE DE DEPÓSITO SIN AÉREOS:::'}% en aquellos que no incluyen aéreos, o la suma de ${conditions.specialProgramDeposit ? formatCurrency(conditions.specialProgramDeposit) : ':::SIN DEPÓSITO DE PROGRAMAS ESPECIALES:::'} en caso de Programas Especiales. Dicho monto será abonado al valor total. El saldo faltante deberá estar cancelado en un plazo no superior a ${conditions.daysBeforeFlightBalance || ':::SIN DÍAS ANTES DEL VUELO:::'} días antes de la salida del vuelo o ${conditions.daysBeforeTerrestrialBalance || ':::SIN DÍAS ANTES DE LOS SERVICIOS TERRESTRES:::'} días antes de la ocupación de los servicios terrestres. En caso de que el pasajero no haya pagado el valor total en las fechas señaladas, sus reservas serán automáticamente anuladas y se procederá a las devoluciones, previo descuento de los gastos de anulación de las reservas según correspondan.`
      },
      {
        number: 13,
        title: "DÉCIMO TERCERO:",
        text: `Todo pasajero que documente o cancele la totalidad del viaje con posterioridad al tiempo estipulado en el contrato estará sujeto a las diferencias de precio que pudieran producirse por variación del tipo de cambio y/o intereses que procedieran.`
      },
      {
        number: 14,
        title: "DÉCIMO CUARTO:",
        text: `En caso de modificaciones al programa contratado en fechas posteriores por parte del Pasajero, dichos cambios podrán hacerse efectivos siempre que existan disponibilidades por parte de los prestadores de servicios. Se deja constancia de que cualquier costo adicional al programa por dicha modificación será de exclusiva responsabilidad del Pasajero.`
      },
      {
        number: 15,
        title: "DÉCIMO QUINTO:",
        text: `Será de exclusiva responsabilidad del Pasajero cumplir con toda la documentación y requisitos para ingresar al país de destino, como la presentación de documentos vigentes en aeropuertos y aduanas. Los costos adicionales que puedan producirse por el incumplimiento de esto serán de exclusiva responsabilidad del Pasajero.`
      },
      {
        number: 16,
        title: "DÉCIMO SEXTO:",
        text: `El programa contratado incluirá los siguientes servicios:`,
        detail: {
          title: plan.name || "PROGRAMA TURÍSTICO NO ESPECIFICADO",
          days: trip.days || "DÍAS NO ESPECIFICADOS",
          nights: trip.nights || "NOCHES NO ESPECIFICADAS",
          services: buildServicesIncluded(plan.servicesIncluded)
        }
      },
      {
        number: 17,
        title: "DÉCIMO SÉPTIMO:",
        text: `La cantidad inicial es de ${totalPassengers || ':::SIN TOTAL DE PASAJEROS:::'} pasajeros más ${freePassengers || ':::SIN PASAJEROS LIBERADOS:::'} liberados de pago. Para efectos de la realización del programa seleccionado, cada uno cancela la suma de ${pricePerPerson ? formatCurrency(pricePerPerson) : ':::SIN PRECIO POR PERSONA:::'} (precio del día: ${priceInUSD || ':::SIN PRECIO DEL DÍA:::'} USD), totalizando ${payments.totalGroup ? formatCurrency(payments.totalGroup) : ':::SIN TOTAL GRUPAL:::'} para el grupo. La firma de este contrato se realiza mediante la cancelación de un abono de ${downPayment ? formatCurrency(downPayment) : ':::SIN ABONO:::'}, quedando un saldo grupal de ${groupBalance ? formatCurrency(groupBalance) : ':::SIN SALDO GRUPAL:::'}, el cual se pagará en ${installments.quantity || ':::SIN CUOTAS:::'} cuotas mensuales a partir de ${installments.startMonth || ':::SIN FECHA DE INICIO DE PAGO:::'} de ${installments.groupInstallmentValue ? formatCurrency(installments.groupInstallmentValue) : ':::SIN VALOR DE CUOTA GRUPAL:::'}, o cuotas individuales de ${installments.individualInstallmentValue ? formatCurrency(installments.individualInstallmentValue) : ':::SIN VALOR DE CUOTA INDIVIDUAL:::'}. El viaje debe estar pagado en su totalidad como máximo ${payments.daysBeforePayment || ':::SIN DÍAS ANTES DE PAGO:::'} días antes de la fecha de salida. En caso de existir un alza excesiva en el dólar que supere los ${maxExchangeRate ? formatCurrency(maxExchangeRate) : ':::SIN VALOR DE TASA DE CAMBIO:::'}, el viaje deberá ser reprogramado (en caso de no querer pagar la diferencia) o bien pagar la diferencia por persona que pueda generar el alza, debido a que la mayoría de los servicios se paga en dólares americanos. Las formas de pago son las siguientes: transferencia o depósito bancario a la cuenta corriente número ${bankAccount.accountNumber || ':::SIN NÚMERO DE CUENTA:::'} (${bankAccount.accountHolder || ':::SIN TITULAR DE CUENTA:::'}, RUT ${bankAccount.holderDNI || ':::SIN RUT DE CUENTA:::'}, ${bankAccount.bank || ':::SIN BANCO DE CUENTA:::'}). Enviar confirmación de depósito o transferencia al correo: ${bankAccount.email || ':::SIN EMAIL DE CUENTA:::'}.`
      },
      {
        number: 18,
        title: "DÉCIMO OCTAVO:",
        text: `En la eventualidad de que no se cumpla con la cantidad de pasajeros acordada en el artículo DÉCIMO SÉPTIMO, se deberá cancelar la cantidad total acordada en el artículo anterior. En caso de no alcanzar el monto, se debe avisar con anterioridad al Operador para buscar una solución que implique el cambio del programa, de modo que se pueda realizar de todas formas.`
      },
      {
        number: 19,
        title: "DÉCIMO NOVENO:",
        text: `Ante cualquier reclamo que surja respecto de los servicios contratados, el Pasajero deberá enviar por escrito la situación en conflicto, teniendo un plazo de ${conditions.complaintDeadlineDays || ':::SIN DÍAS PARA RECLAMO:::'} días para hacer pública dicha solicitud. Cualquier dificultad que surja entre las partes con ocasión del cumplimiento, interpretación o incumplimiento del presente contrato, y que no pueda ser solucionada armoniosamente entre ellas, se someterá al conocimiento de un árbitro arbitrador designado de común acuerdo entre las partes y, en subsidio de ello, por la justicia ordinaria, en cuyo caso será árbitro de derecho. Dicho árbitro conocerá en única instancia y contra sus resoluciones no procederá recurso alguno.`
      },
      {
        number: 20,
        title: "VIGÉSIMO:",
        text: `El presente contrato tendrá vigencia únicamente en las fechas estipuladas. Ante cualquier cambio de fecha por parte de las personas que firmaron este contrato, estas deberán dar aviso en forma escrita con ${conditions.cancellationNoticeDays || ':::SIN DÍAS DE AVISO DE CANCELACIÓN:::'} días de anticipación a la salida para un posible cambio de fecha.`
      },
      {
        number: 21,
        title: "VIGÉSIMO PRIMERO:",
        text: `En caso de que el pasajero, los pasajeros o el grupo completo desista del viaje, perderá automáticamente el ${conditions.cancellationPenaltyPercentage || ':::SIN PORCENTAJE DE PENALIZACIÓN:::'}% del valor total del viaje, el cual será tomado como compensación para cubrir reservas y gastos operacionales.`
      },
      {
        number: 22,
        text: `En comprobante, previa lectura, firman y ratifican como representantes.`
      }
    ],

    // Datos para página de firmas
    signatures: {
      operators: Array.isArray(representatives)
        ? representatives.map(rep => ({
            name: rep?.name || ':::SIN NOMBRE REPRESENTANTE:::',
            dni: rep?.dni || ':::SIN DNI REPRESENTANTE:::',
          }))
        : [],
      clients: Array.isArray(clientRepresentative)
        ? clientRepresentative.map(rep => ({
            name: rep?.name || ':::SIN NOMBRE CLIENTE:::',
            dni: rep?.dni || ':::SIN DNI CLIENTE:::',
          }))
        : [],
      companyName: 'GIRAS INDÓMITO LIMITADA',
      companyRut: bankAccount.holderDNI || ':::SIN RUT DE CUENTA:::'
    }
  };

  return contractData;
};
