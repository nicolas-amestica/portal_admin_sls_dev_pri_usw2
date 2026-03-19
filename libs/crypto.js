import { randomUUID as nativeRandomUUID } from 'crypto';

/**
 * Genera un UUID (Universally Unique Identifier) aleatorio v4.
 */
export const randomUUID = () => nativeRandomUUID();