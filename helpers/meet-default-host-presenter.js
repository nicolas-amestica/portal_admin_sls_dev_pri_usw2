/** Anfitrión por defecto para reuniones creadas por el agente WhatsApp (Susana Guevara). */
const FALLBACK_HOST = {
  hostSk: 'PRESENTER#a4f8c2b1-3d7e-4f9a-8b5c-6d1e2f3a4b5c',
  hostName: 'Susana Guevara Sotomayor',
  hostColor: '#6366f1',
};

/**
 * @description Obtiene el anfitrión por defecto para reuniones del agente.
 * Override opcional vía env: MEET_DEFAULT_HOST_SK, MEET_DEFAULT_HOST_NAME, MEET_DEFAULT_HOST_COLOR.
 * @returns {{ hostSk: string, hostName: string, hostColor: string }}
 */
export function getDefaultMeetHostPresenter() {
  return {
    hostSk: process.env.MEET_DEFAULT_HOST_SK?.trim() || FALLBACK_HOST.hostSk,
    hostName: process.env.MEET_DEFAULT_HOST_NAME?.trim() || FALLBACK_HOST.hostName,
    hostColor: process.env.MEET_DEFAULT_HOST_COLOR?.trim() || FALLBACK_HOST.hostColor,
  };
}

/**
 * @description Construye `extendedProperties.shared` para reuniones del agente con anfitrión por defecto.
 * @param {Record<string, string>|undefined|null} existingShared
 * @param {string} [phoneNumber]
 * @returns {Record<string, string>}
 */
export function buildAgentMeetingSharedProperties(existingShared, phoneNumber) {
  const host = getDefaultMeetHostPresenter();
  const prev = existingShared && typeof existingShared === 'object' ? existingShared : {};

  return {
    ...prev,
    agent: 'true',
    hostSk: prev.hostSk?.trim() || host.hostSk,
    hostName: prev.hostName?.trim() || host.hostName,
    hostColor: prev.hostColor?.trim() || host.hostColor,
    ...(phoneNumber && { phoneNumber }),
  };
}

/**
 * @description Construye `extendedProperties.shared` al crear una reunión nueva del agente.
 * @param {string} [phoneNumber]
 * @returns {Record<string, string>}
 */
export function buildNewAgentMeetingSharedProperties(phoneNumber) {
  const host = getDefaultMeetHostPresenter();

  return {
    agent: 'true',
    hostSk: host.hostSk,
    hostName: host.hostName,
    hostColor: host.hostColor,
    ...(phoneNumber && { phoneNumber }),
  };
}
