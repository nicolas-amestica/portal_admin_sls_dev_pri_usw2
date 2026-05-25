/** Correos institucionales incluidos por defecto si no hay override en env. */
const FALLBACK_DEFAULTS = [
  'susana.guevara.sotomayor@gmail.com',
];

/**
 * @description Obtiene la lista de correos institucionales para invitaciones de reuniones.
 * Override opcional vía `MEET_DEFAULT_GUEST_EMAILS` (JSON array) en serverless.yml.
 * @returns {string[]}
 */
export function getMeetDefaultGuestEmails() {
  try {
    const raw = process.env.MEET_DEFAULT_GUEST_EMAILS;
    if (!raw) return [...FALLBACK_DEFAULTS];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : [...FALLBACK_DEFAULTS];
  } catch {
    return [...FALLBACK_DEFAULTS];
  }
}

/**
 * @description Normaliza correos del cliente a un arreglo único.
 * @param {string | string[] | undefined | null} clientEmailsRaw
 * @returns {string[]}
 */
function normalizeClientEmails(clientEmailsRaw) {
  if (clientEmailsRaw == null) return [];
  if (typeof clientEmailsRaw === 'string') {
    const email = clientEmailsRaw.trim();
    return email ? [email] : [];
  }
  if (Array.isArray(clientEmailsRaw)) {
    return clientEmailsRaw
      .filter((e) => typeof e === 'string' && e.trim())
      .map((e) => e.trim());
  }
  return [];
}

/**
 * @description Construye `attendees` para crear reunión: institucionales + correos del cliente (sin duplicar).
 * @param {string | string[] | undefined | null} clientEmailsRaw
 * @returns {Array<{ email: string }>}
 */
export function buildAttendeesForNewMeet(clientEmailsRaw) {
  /** @type {Set<string>} */
  const seen = new Set();
  /** @type {Array<{ email: string }>} */
  const out = [];

  const pushUnique = (raw) => {
    const email = typeof raw === 'string' ? raw.trim() : '';
    if (!email) return;
    const key = email.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ email });
  };

  getMeetDefaultGuestEmails().forEach((e) => pushUnique(e));
  normalizeClientEmails(clientEmailsRaw).forEach((e) => pushUnique(e));
  return out;
}

/**
 * @description Asegura institucionales + cliente en la lista preservando registros existentes (responseStatus u otros campos de Google Calendar).
 * @param {Array<{ email?: string }> | undefined | null} existing
 * @param {string | string[] | undefined | null} clientEmailsRaw
 * @returns {Array<object>}
 */
export function mergeAttendeesEnsuringDefaults(existing, clientEmailsRaw) {
  const list = [...(existing || []).filter((a) => typeof a.email === 'string' && a.email.trim())];

  /** @type {Set<string>} */
  const seen = new Set(list.map((a) => a.email.trim().toLowerCase()));

  const appendIfMissing = (raw) => {
    const email = typeof raw === 'string' ? raw.trim() : '';
    if (!email) return;
    const key = email.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    list.push({ email });
  };

  getMeetDefaultGuestEmails().forEach((e) => appendIfMissing(e));
  normalizeClientEmails(clientEmailsRaw).forEach((e) => appendIfMissing(e));
  return list;
}
