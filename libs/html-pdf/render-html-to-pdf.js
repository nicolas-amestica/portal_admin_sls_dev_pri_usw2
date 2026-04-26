import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

/**
 * @description Normaliza ruta al navegador desde variable de entorno (comillas, separadores Windows).
 * @param {string | undefined} raw
 * @returns {string}
 */
const normalizeBrowserExecutablePath = (raw) => {
  if (raw == null) return '';
  let s = String(raw).trim();
  if (
    (s.startsWith('"') && s.endsWith('"')) ||
    (s.startsWith("'") && s.endsWith("'"))
  ) {
    s = s.slice(1, -1).trim();
  }
  return path.normalize(s);
};

/** Argumentos seguros para Chrome/Edge instalado en máquina de desarrollo (no usar flags de chrome-headless-shell de Lambda). */
const LOCAL_CHROME_ARGS = [
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-dev-shm-usage',
  '--disable-gpu',
];

/** Flags extra para acortar arranque y trabajo en segundo plano en modo PDF (se añaden sin duplicar prefijos ya presentes). */
const CHROME_PDF_PERF_ARGS = [
  '--disable-extensions',
  '--mute-audio',
  '--disable-background-networking',
];

/**
 * @description Añade flags de rendimiento a los argumentos de Chromium.
 * @param {string[]} args
 * @returns {string[]}
 */
const withPdfPerfArgs = (args) => {
  const base = [...args];
  for (const flag of CHROME_PDF_PERF_ARGS) {
    if (!base.some((a) => a === flag || a.startsWith(`${flag}=`))) {
      base.push(flag);
    }
  }
  return base;
};

/**
 * @description Rutinas candidatas a ejecutable de Chrome o Edge según el SO.
 * @returns {string[]}
 */
const getSystemChromeCandidates = () => {
  const platform = process.platform;
  if (platform === 'win32') {
    const localApp =
      process.env.LOCALAPPDATA ||
      (process.env.USERPROFILE
        ? path.join(process.env.USERPROFILE, 'AppData', 'Local')
        : '');
    const programFiles =
      process.env.ProgramFiles || process.env.PROGRAMFILES || process.env['ProgramFiles'];
    const programFilesX86 =
      process.env['ProgramFiles(x86)'] || process.env['PROGRAMFILES(X86)'];
    return [
      // Edge suele estar en perfil de usuario (instalación predeterminada Win10/11).
      localApp ? path.join(localApp, 'Microsoft', 'Edge', 'Application', 'msedge.exe') : '',
      localApp ? path.join(localApp, 'Google', 'Chrome', 'Application', 'chrome.exe') : '',
      localApp ? path.join(localApp, 'Google', 'Chrome SxS', 'Application', 'chrome.exe') : '',
      programFiles ? path.join(programFiles, 'Google', 'Chrome', 'Application', 'chrome.exe') : '',
      programFilesX86 ? path.join(programFilesX86, 'Google', 'Chrome', 'Application', 'chrome.exe') : '',
      programFiles ? path.join(programFiles, 'Microsoft', 'Edge', 'Application', 'msedge.exe') : '',
      programFilesX86 ? path.join(programFilesX86, 'Microsoft', 'Edge', 'Application', 'msedge.exe') : '',
      programFiles
        ? path.join(programFiles, 'BraveSoftware', 'Brave-Browser', 'Application', 'brave.exe')
        : '',
      programFilesX86
        ? path.join(programFilesX86, 'BraveSoftware', 'Brave-Browser', 'Application', 'brave.exe')
        : '',
    ].filter(Boolean);
  }
  if (platform === 'darwin') {
    return [
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    ];
  }
  return [
    '/usr/bin/google-chrome-stable',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
  ];
};

/**
 * @description Indica si una línea de salida de `where` es una ruta absoluta a un .exe (excluye mensajes INFORMACIÓN / INFO).
 * @param {string} line
 * @returns {boolean}
 */
const isPlausibleWindowsExePath = (line) => {
  const s = String(line).trim();
  if (!s || !/\.exe$/i.test(s)) return false;
  const upper = s.toUpperCase();
  if (upper.startsWith('INFORMACI') || upper.startsWith('INFO:')) return false;
  if (/no se pudo encontrar|could not find files/i.test(s)) return false;
  if (!/^([a-zA-Z]:\\|\\\\)/.test(s)) return false;
  return existsSync(s);
};

/**
 * @description En Windows, primera ruta existente que devuelve `where.exe` (PATH y App Paths del registro).
 * `execFileSync` lanzaba cuando no había coincidencias y el mensaje en español llegaba al cliente; `spawnSync` no lanza por código de salida.
 * @param {string} executableName
 * @returns {string | null}
 */
const resolveWindowsWhere = (executableName) => {
  const systemRoot = process.env.SystemRoot || process.env.windir || 'C:\\Windows';
  const wherePath = path.join(systemRoot, 'System32', 'where.exe');
  const r = spawnSync(wherePath, [executableName], {
    encoding: 'utf8',
    windowsHide: true,
    timeout: 8000,
    maxBuffer: 1024 * 1024,
  });
  if (r.error) return null;
  if (r.status !== 0) return null;
  const combined = `${r.stdout || ''}\n${r.stderr || ''}`;
  const line = combined
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean)
    .find((s) => isPlausibleWindowsExePath(s));
  return line ? line.trim() : null;
};

/**
 * @description Busca el primer Chrome/Chromium/Edge instalado en el sistema.
 * @returns {string | null}
 */
const findSystemChromeExecutable = () => {
  for (const candidate of getSystemChromeCandidates()) {
    if (candidate && existsSync(candidate)) {
      return candidate;
    }
  }
  if (process.platform === 'win32') {
    for (const name of ['msedge.exe', 'chrome.exe', 'brave.exe', 'chromium.exe']) {
      const found = resolveWindowsWhere(name);
      if (found) return found;
    }
  }
  return null;
};

/**
 * @description True solo en AWS Lambda real. serverless-offline define AWS_LAMBDA_FUNCTION_NAME pero también IS_OFFLINE; sin AWS_EXECUTION_ENV no es Lambda real.
 * @returns {boolean}
 */
const isRealAwsLambda = () => {
  if (process.env.IS_OFFLINE === 'true') return false;
  if (process.env.AWS_SAM_LOCAL) return false;
  const execEnv = process.env.AWS_EXECUTION_ENV;
  return Boolean(execEnv && String(execEnv).startsWith('AWS_Lambda_'));
};

/**
 * @description Resuelve ejecutable y argumentos de Chromium (Lambda vs local).
 * @returns {Promise<{ executablePath: string, args: string[], defaultViewport: { width: number, height: number, deviceScaleFactor?: number } }>}
 */
const resolveLaunchConfig = async () => {
  const defaultViewport = { width: 1280, height: 900, deviceScaleFactor: 1 };

  if (isRealAwsLambda()) {
    return {
      executablePath: await chromium.executablePath(),
      args: withPdfPerfArgs(chromium.args),
      defaultViewport: chromium.defaultViewport ?? defaultViewport,
    };
  }

  const envChrome = normalizeBrowserExecutablePath(
    process.env.CHROME_EXECUTABLE_PATH || process.env.PUPPETEER_EXECUTABLE_PATH,
  );
  if (envChrome) {
    if (!existsSync(envChrome)) {
      const err = new Error(
        `CHROME_EXECUTABLE_PATH / PUPPETEER_EXECUTABLE_PATH apunta a un archivo inexistente: ${envChrome}`,
      );
      err.statusCode = 500;
      throw err;
    }
    return {
      executablePath: envChrome,
      args: withPdfPerfArgs(LOCAL_CHROME_ARGS),
      defaultViewport,
    };
  }

  const systemChrome = findSystemChromeExecutable();
  if (systemChrome) {
    return {
      executablePath: systemChrome,
      args: withPdfPerfArgs(LOCAL_CHROME_ARGS),
      defaultViewport,
    };
  }

  // @sparticuz/chromium es un binario Linux para Lambda; en Windows/macOS suele fallar o generar rutas inválidas.
  if (os.platform() === 'linux') {
    try {
      return {
        executablePath: await chromium.executablePath(),
        args: withPdfPerfArgs(chromium.args),
        defaultViewport: chromium.defaultViewport ?? defaultViewport,
      };
    } catch {
      // continúa al error final
    }
  }

  const err = new Error(
    'Chrome/Edge no detectado en local. Instálalos o define CHROME_EXECUTABLE_PATH en el proceso que arranca serverless-offline (api-document-html la reenvía vía serverless.yml; con npm start se carga la .env de la raíz del repo).',
  );
  err.statusCode = 500;
  throw err;
};

/**
 * @description Directorio temporal fiable. En serverless-offline no suelen llegar TEMP/TMP al handler y Chrome arma rutas `undefined\\temp\\...`.
 * @returns {string}
 */
const resolveTempBase = () => {
  const bad = (v) => !v || typeof v !== 'string' || v.includes('undefined');
  const candidates = [
    process.env.TEMP,
    process.env.TMP,
    os.tmpdir(),
    process.platform === 'win32'
      ? path.join(process.env.SystemRoot || process.env.windir || 'C:\\Windows', 'Temp')
      : '/tmp',
  ];
  for (const c of candidates) {
    if (!bad(c)) {
      const n = path.normalize(String(c));
      try {
        if (existsSync(n)) return n;
      } catch {
        /* continuar */
      }
    }
  }
  return process.platform === 'win32' ? 'C:\\Windows\\Temp' : '/tmp';
};

/**
 * @description Variables de entorno para el proceso hijo del navegador (Puppeteer/Chrome).
 * @param {string} tempBase
 * @returns {NodeJS.ProcessEnv}
 */
const getEnvForBrowserChild = (tempBase) => {
  const home = process.env.USERPROFILE || process.env.HOME || os.homedir();
  const env = { ...process.env, TEMP: tempBase, TMP: tempBase, TMPDIR: tempBase };
  if (process.platform === 'win32') {
    env.USERPROFILE = home;
    env.LOCALAPPDATA =
      process.env.LOCALAPPDATA || path.join(home, 'AppData', 'Local');
    env.APPDATA = process.env.APPDATA || path.join(home, 'AppData', 'Roaming');
  }
  return env;
};

/**
 * @description Indica si Chromium se reutiliza entre invocaciones (misma instancia Lambda o proceso Node).
 * En AWS suele ahorrar varios segundos tras el primer PDF del contenedor. En local: `HTML_PDF_REUSE_BROWSER=1`.
 * Forzar arranque frío por petición: `HTML_PDF_DISABLE_BROWSER_REUSE=1`.
 * @returns {boolean}
 */
const shouldReuseBrowser = () => {
  if (process.env.HTML_PDF_DISABLE_BROWSER_REUSE === '1') return false;
  return isRealAwsLambda() || process.env.HTML_PDF_REUSE_BROWSER === '1';
};

/** @type {Promise<import('puppeteer-core').Browser> | null} */
let sharedBrowserPromise = null;
/** @type {string | null} */
let sharedUserDataDir = null;

/**
 * @description Arranca o devuelve el Chromium compartido (un proceso por contenedor / proceso Node).
 * @param {number} [depth]
 * @returns {Promise<import('puppeteer-core').Browser>}
 */
const acquireSharedBrowser = async (depth = 0) => {
  if (depth > 3) {
    const err = new Error('Chromium no quedó disponible para generar el PDF tras reintentos.');
    err.statusCode = 500;
    throw err;
  }
  if (!sharedBrowserPromise) {
    sharedBrowserPromise = (async () => {
      const { executablePath, args, defaultViewport } = await resolveLaunchConfig();
      const tempBase = resolveTempBase();
      const userDataDir = mkdtempSync(path.join(tempBase, 'puppeteer-html-pdf-shared-'));
      sharedUserDataDir = userDataDir;
      const browserEnv = getEnvForBrowserChild(tempBase);
      const browser = await puppeteer.launch({
        args,
        defaultViewport,
        executablePath,
        headless: true,
        userDataDir,
        env: browserEnv,
      });
      browser.on('disconnected', () => {
        sharedBrowserPromise = null;
        if (sharedUserDataDir) {
          try {
            rmSync(sharedUserDataDir, { recursive: true, force: true });
          } catch {
            /* ignore */
          }
          sharedUserDataDir = null;
        }
      });
      return browser;
    })().catch((err) => {
      sharedBrowserPromise = null;
      if (sharedUserDataDir) {
        try {
          rmSync(sharedUserDataDir, { recursive: true, force: true });
        } catch {
          /* ignore */
        }
        sharedUserDataDir = null;
      }
      throw err;
    });
  }
  const browser = await sharedBrowserPromise;
  if (!browser.connected) {
    sharedBrowserPromise = null;
    return acquireSharedBrowser(depth + 1);
  }
  return browser;
};

/**
 * @description Abre una pestaña, imprime a PDF y la cierra.
 * @param {import('puppeteer-core').Browser} browser
 * @param {string} html
 * @returns {Promise<Buffer>}
 */
const htmlToPdfBuffer = async (browser, html) => {
  const page = await browser.newPage();
  try {
    await page.setContent(html, { waitUntil: 'domcontentloaded' });
    const pdfUint8 = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0', bottom: '0', left: '0', right: '0' },
    });
    return Buffer.from(pdfUint8);
  } finally {
    await page.close();
  }
};

/**
 * @description Renderiza HTML a buffer PDF (A4, sin márgenes de página, fondos impresos).
 * @param {string} html
 * @returns {Promise<Buffer>}
 */
export const renderHtmlToPdf = async (html) => {
  if (shouldReuseBrowser()) {
    const browser = await acquireSharedBrowser();
    return htmlToPdfBuffer(browser, html);
  }

  const { executablePath, args, defaultViewport } = await resolveLaunchConfig();
  const tempBase = resolveTempBase();
  const userDataDir = mkdtempSync(path.join(tempBase, 'puppeteer-html-pdf-'));
  const browserEnv = getEnvForBrowserChild(tempBase);
  const browser = await puppeteer.launch({
    args,
    defaultViewport,
    executablePath,
    headless: true,
    userDataDir,
    env: browserEnv,
  });
  try {
    return await htmlToPdfBuffer(browser, html);
  } finally {
    await browser.close();
    try {
      rmSync(userDataDir, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
  }
};
