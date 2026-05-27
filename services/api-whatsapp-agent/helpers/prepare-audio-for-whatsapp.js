import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { accessSync, constants } from 'node:fs';
import { writeFile, readFile, unlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';

const execFileAsync = promisify(execFile);

/** MIME requerido por WhatsApp Cloud API para notas de voz Opus. */
export const WHATSAPP_AUDIO_MIME = 'audio/ogg; codecs=opus';

const FFMPEG_PKG = process.platform === 'darwin'
  ? '@ffmpeg-installer/darwin-arm64'
  : '@ffmpeg-installer/linux-arm64';

/**
 * @description Resuelve la ruta del binario ffmpeg empaquetado en Lambda (/var/task/node_modules/...).
 * No usa createRequire(import.meta.url) — esbuild CJS deja import.meta.url undefined al cargar el módulo.
 */
function resolveFfmpegPath() {
  if (process.env.FFMPEG_PATH) {
    return process.env.FFMPEG_PATH;
  }

  const searchRoots = [
    process.cwd(),
    '/var/task',
    join(process.cwd(), '..'),
    join(process.cwd(), '../..'),
  ];

  for (const root of searchRoots) {
    const candidate = join(root, 'node_modules', FFMPEG_PKG, 'ffmpeg');
    try {
      accessSync(candidate, constants.X_OK);
      return candidate;
    } catch {
      // siguiente root
    }
  }

  const error = new Error(
    `ffmpeg no encontrado (${FFMPEG_PKG}). Ejecute: npm install @ffmpeg-installer/linux-arm64 --force --cpu=arm64 --os=linux`
  );
  error.statusCode = 500;
  throw error;
}

/**
 * @description Convierte un buffer WebM/Opus a OGG/Opus real con ffmpeg.
 */
async function convertWebmToOggOpus(buffer, fileName) {
  const ffmpegPath = resolveFfmpegPath();
  const id = randomUUID();
  const inputPath = join(tmpdir(), `${id}.webm`);
  const outputPath = join(tmpdir(), `${id}.ogg`);

  try {
    await writeFile(inputPath, buffer);
    await execFileAsync(ffmpegPath, [
      '-hide_banner',
      '-loglevel', 'error',
      '-y',
      '-i', inputPath,
      '-c:a', 'libopus',
      '-ar', '48000',
      '-ac', '1',
      '-b:a', '64k',
      outputPath,
    ], { timeout: 25000 });

    const outBuffer = await readFile(outputPath);
    if (!outBuffer.length) {
      throw new Error('Conversión ffmpeg produjo archivo vacío');
    }

    const oggFileName = fileName.replace(/\.webm$/i, '.ogg');
    console.log(`[prepareAudioForWhatsApp] Convertido ${fileName} → ${oggFileName} (${outBuffer.length} bytes)`);

    return {
      buffer: outBuffer,
      fileName: oggFileName,
      mimeType: WHATSAPP_AUDIO_MIME,
    };
  } catch (err) {
    const message = err.stderr?.toString?.() || err.message || String(err);
    console.error(`[prepareAudioForWhatsApp] ffmpeg falló: ${message}`);
    const error = new Error(`No se pudo convertir audio WebM a OGG: ${message}`);
    error.statusCode = 500;
    throw error;
  } finally {
    await Promise.allSettled([unlink(inputPath), unlink(outputPath)]);
  }
}

/**
 * @description Prepara audio grabado desde el navegador para envío como nota de voz en WhatsApp.
 * WebM solo renombrado no funciona — Meta requiere contenedor OGG con codec Opus.
 *
 * @param {Buffer} buffer - Contenido del archivo de audio.
 * @param {string} mimeType - MIME del adjunto (p. ej. audio/webm).
 * @param {string} fileName - Nombre original del archivo.
 * @returns {Promise<{ buffer: Buffer, fileName: string, mimeType: string }>}
 */
export async function prepareAudioForWhatsApp(buffer, mimeType, fileName) {
  const baseMime = (mimeType || '').split(';')[0].trim().toLowerCase();
  const isOgg = baseMime === 'audio/ogg' || /\.ogg$/i.test(fileName);

  if (isOgg) {
    return {
      buffer,
      fileName: /\.ogg$/i.test(fileName) ? fileName : `${fileName.replace(/\.\w+$/, '')}.ogg`,
      mimeType: WHATSAPP_AUDIO_MIME,
    };
  }

  const isWebm = baseMime === 'audio/webm' || /\.webm$/i.test(fileName);
  if (!isWebm) {
    const error = new Error(`Formato de audio no soportado para WhatsApp: ${mimeType}`);
    error.statusCode = 400;
    throw error;
  }

  return convertWebmToOggOpus(buffer, fileName);
}
