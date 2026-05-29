/**
 * @description Convierte un ítem MSG de DynamoDB al DTO de mensaje del portal Angular.
 * @param {object} item
 * @returns {object}
 */
export function mapTurnToPortalMessage(item) {
  const tipo =
    item.role === 'user' ? 'cliente' : item.role === 'team' ? 'equipo' : 'agente_ia';

  return {
    contenido: item.parts?.[0]?.text ?? '',
    timestamp: item.createdAt,
    tipo,
    msgSk: item.sk,
    ...(item.attachments?.length
      ? {
          adjuntos: item.attachments.map((a) => ({
            url: a.url ?? '',
            fileName: a.fileName,
            mimeType: a.mimeType,
          })),
        }
      : {}),
    ...(item.whatsappMessageId ? { whatsappMessageId: item.whatsappMessageId } : {}),
    ...(item.deliveryStatus ? { deliveryStatus: item.deliveryStatus } : {}),
    ...(item.deliveryFailureReason ? { deliveryFailureReason: item.deliveryFailureReason } : {}),
  };
}
