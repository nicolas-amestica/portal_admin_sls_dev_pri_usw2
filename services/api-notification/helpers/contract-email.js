const CONTRACT = {
    dev: {
        preview: {
            title: "Giras Indómito DEV",
            subject: "Borrador de contrato de viaje",
            body: 'Adjunto encontrará el borrador del contrato del viaje:'
        },
        confirmed: {
            title: "Giras Indómito DEV",
            subject: "Contrato de viaje confirmado",
            body: 'Adjunto encontrará el contrato del viaje:'
        },
        resend: {
            title: "Giras Indómito DEV",
            subject: "Reenvío de contrato de viaje aprobado",
            body: 'Le reenviamos el contrato aprobado de su viaje:'
        }
    },
    prd: {
        preview: {
            title: "Giras Indómito",
            subject: "Borrador de contrato de viaje",
            body: 'Adjunto encontrará el borrador del contrato del viaje:'
        },
        confirmed: {
            title: "Giras Indómito",
            subject: "Contrato de viaje confirmado",
            body: 'Adjunto encontrará el contrato del viaje:'
        },
        resend: {
            title: "Giras Indómito",
            subject: "Reenvío de contrato de viaje aprobado",
            body: 'Le reenviamos el contrato aprobado de su viaje:'
        }
    }
};

/**
 * Construye los datos del correo de contrato a partir del estado de la vista previa.
 * Encapsula la lógica de selección de template para que el lambda no conozca los detalles de contrato.
 *
 * @param {string} preview - Estado de la notificación: '1' (borrador), 'resend' (reenvío) o cualquier otro valor (confirmado).
 * @param {string} stage   - Ambiente ('dev' | 'prd').
 * @returns {{ subject: string, title: string, bodyHtml: string }}
 */
export const buildContractEmailData = (preview, stage = 'dev') => {
  const messages = stage === 'prd' ? CONTRACT.prd : CONTRACT.dev;
  const typeMessage = preview === '1'
    ? messages.preview
    : preview === 'resend'
      ? messages.resend
      : messages.confirmed;

  return {
    subject: typeMessage.subject,
    title: typeMessage.title,
    bodyHtml: typeMessage.body
  };
};
