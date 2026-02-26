/**
 * Mapea un registro de pago de DynamoDB al formato de respuesta estándar.
 */
export const mapPayment = (payment) => ({
  pk: payment.pk,
  sk: payment.sk,
  id: payment.id,
  programId: payment.programId,
  userId: payment.userId,
  installmentNumber: payment.installmentNumber,
  amount: payment.amount,
  status: payment.status,
  createdAt: payment.createdAt,
  paidAt: payment.paidAt || null,
  transbankDetails: {
    token: payment.transbankDetails?.token || null,
    buyOrder: payment.transbankDetails?.buyOrder || null,
    sessionId: payment.transbankDetails?.sessionId || null,
    vci: payment.transbankDetails?.vci || null,
    authorizationCode: payment.transbankDetails?.authorizationCode || null,
    responseCode: payment.transbankDetails?.responseCode || null,
    paymentTypeCode: payment.transbankDetails?.paymentTypeCode || null,
    accountingDate: payment.transbankDetails?.accountingDate || null,
    transactionDate: payment.transbankDetails?.transactionDate || null,
    cardNumber: payment.transbankDetails?.cardNumber || null,
    installmentsNumber: payment.transbankDetails?.installmentsNumber || 0,
  },
});
