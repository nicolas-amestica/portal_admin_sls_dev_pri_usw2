/**
 * Correos siempre incluidos como invitados en reuniones (mismo criterio que el portal Meet).
 */
export const MEET_DEFAULT_GUEST_EMAILS = [
  'abeltrami.travel@gmail.com',
  'susana.guevara.sotomayor@gmail.com',
];

/**
 * @description Construye `attendees` para crear reunión en Google Calendar: institucionales primero + email del cliente opcional (sin duplicar).
 * @param {string | undefined | null} emailClienteRaw
 * @returns {Array<{ email: string }>}
 */
export function buildAttendeesForNewMeet(emailClienteRaw) {
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

  MEET_DEFAULT_GUEST_EMAILS.forEach((e) => pushUnique(e));
  pushUnique(emailClienteRaw);
  return out;
}

/**
 * @description Asegura institucional + cliente en la lista preservando registros ya existentes (responseStatus u otros campos de Google Calendar).
 * @param {Array<{ email?: string }> | undefined | null} existing
 * @param {string | undefined | null} emailClienteRaw - Opcional si hay que garantizar que el cliente quede como invitado.
 * @returns {Array<object>}
 */
export function mergeAttendeesEnsuringDefaults(existing, emailClienteRaw) {
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

  MEET_DEFAULT_GUEST_EMAILS.forEach((e) => appendIfMissing(e));
  appendIfMissing(emailClienteRaw);
  return list;
}
