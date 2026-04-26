/**
 * Levanta serverless-offline en cada servicio Node (puertos internos) y un proxy HTTP
 * en el puerto 3200 que enruta por el primer segmento tras /v1/ (misma URL base que el front).
 *
 * Solo algunos servicios: OFFLINE_SERVICES=api-document-html npm start
 * (varios: OFFLINE_SERVICES=api-document-html,api-entity npm start)
 */

const http = require('http');
const { spawn } = require('child_process');
const path = require('path');

const ROOT = path.join(__dirname, '..');
try {
  require('dotenv').config({ path: path.join(ROOT, '.env') });
} catch (_) {
  /* dotenv es devDependency; opcional */
}
const PROXY_PORT = 3200;

/** Primer segmento de path tras /v1/ → puerto del servicio offline correspondiente */
const ROUTE_PORT_BY_SEGMENT = {
  documentos: 3202,
  sesiones: 3201,
  iam: 3201,
  usuarios: 3201,
  autorizador: 3203,
  accesos: 3203,
  whatsapp: 3204,
  programas: 3205,
  dashboard: 3205,
  analytics: 3205,
  pagos: 3206,
  notificaciones: 3207,
  favoritos: 3208,
  reuniones: 3209,
  mantenedor: 3210,
  extracciones: 3211,
  contratos: 3212,
  configuracion: 3213,
  balances: 3214,
};

const SERVICES = [
  { name: 'api-entity', cwd: 'services/api-entity', port: 3201 },
  { name: 'api-document-html', cwd: 'services/api-document-html', port: 3202 },
  { name: 'job-authorizer', cwd: 'services/job-authorizer', port: 3203 },
  { name: 'api-whatsapp-agent', cwd: 'services/api-whatsapp-agent', port: 3204 },
  { name: 'api-program', cwd: 'services/api-program', port: 3205 },
  { name: 'api-payment', cwd: 'services/api-payment', port: 3206 },
  { name: 'api-notification', cwd: 'services/api-notification', port: 3207 },
  { name: 'api-favorites', cwd: 'services/api-favorites', port: 3208 },
  { name: 'api-meet', cwd: 'services/api-meet', port: 3209 },
  { name: 'api-maintainer', cwd: 'services/api-maintainer', port: 3210 },
  { name: 'api-extraction', cwd: 'services/api-extraction', port: 3211 },
  { name: 'api-contract', cwd: 'services/api-contract', port: 3212 },
  { name: 'api-configuration', cwd: 'services/api-configuration', port: 3213 },
  { name: 'api-balance', cwd: 'services/api-balance', port: 3214 },
];

const offlineFilter = process.env.OFFLINE_SERVICES?.trim();
let servicesToStart = SERVICES;
if (offlineFilter) {
  const want = new Set(
    offlineFilter
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  );
  servicesToStart = SERVICES.filter((s) => want.has(s.name));
  if (servicesToStart.length === 0) {
    console.error(
      '[run-offline-all] OFFLINE_SERVICES no coincide con ningún name. Válidos:',
      SERVICES.map((s) => s.name).join(', '),
    );
    process.exit(1);
  }
  console.log('[run-offline-all] Modo filtrado OFFLINE_SERVICES →', servicesToStart.map((s) => s.name).join(', '));
}

const children = [];

function startService(svc) {
  const cwd = path.join(ROOT, svc.cwd);
  const lambdaPort = svc.port + 10000;
  const websocketPort = svc.port + 11000;
  const albPort = svc.port + 12000;
  const cmd = [
    'npx serverless offline --stage dev',
    `--httpPort ${svc.port}`,
    `--lambdaPort ${lambdaPort}`,
    `--websocketPort ${websocketPort}`,
    `--albPort ${albPort}`,
  ].join(' ');
  const child = spawn(cmd, {
    cwd,
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      AWS_PROFILE: process.env.AWS_PROFILE || 'pa-dev',
    },
  });
  child.on('exit', (code, signal) => {
    if (code !== 0 && code !== null) {
      console.error(`[run-offline-all] ${svc.name} terminó con código ${code}`);
    }
    if (signal) {
      console.error(`[run-offline-all] ${svc.name} terminó por señal ${signal}`);
    }
  });
  children.push(child);
}

function createProxy() {
  return http.createServer((clientReq, clientRes) => {
    const rawPath = clientReq.url || '/';
    const pathname = rawPath.split('?')[0];
    const match = pathname.match(/^\/v1\/([^/?]+)/);
    const segment = match && match[1];
    const targetPort = segment && ROUTE_PORT_BY_SEGMENT[segment];

    if (!targetPort) {
      clientRes.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
      clientRes.end(
        JSON.stringify({
          message: 'Offline proxy: ruta no mapeada. Añade el segmento en scripts/run-offline-all.cjs si es nuevo.',
          path: pathname,
        }),
      );
      return;
    }

    const headers = { ...clientReq.headers };
    headers.host = `localhost:${targetPort}`;

    const opts = {
      hostname: 'localhost',
      port: targetPort,
      path: rawPath,
      method: clientReq.method,
      headers,
    };

    const proxyReq = http.request(opts, (proxyRes) => {
      clientRes.writeHead(proxyRes.statusCode || 502, proxyRes.headers);
      proxyRes.pipe(clientRes);
    });

    proxyReq.on('error', (err) => {
      if (!clientRes.headersSent) {
        clientRes.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' });
        clientRes.end(
          JSON.stringify({
            message: 'Backend offline no responde en el puerto asignado.',
            segment,
            port: targetPort,
            error: err.message,
          }),
        );
      }
    });

    clientReq.pipe(proxyReq);
  });
}

function shutdown() {
  console.log('\n[run-offline-all] Cerrando procesos...');
  for (const c of children) {
    if (!c.killed) c.kill('SIGINT');
  }
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

const portMin = Math.min(...servicesToStart.map((s) => s.port));
const portMax = Math.max(...servicesToStart.map((s) => s.port));
console.log(`[run-offline-all] Proxy en http://localhost:${PROXY_PORT} → HTTP offline ${portMin}–${portMax}`);
console.log('[run-offline-all] Levantando servicios (puede tardar unos segundos)...\n');

for (const svc of servicesToStart) {
  startService(svc);
}

const proxy = createProxy();
proxy.listen(PROXY_PORT, () => {
  console.log(`\n[run-offline-all] Listo: API unificada en http://localhost:${PROXY_PORT}`);
});

proxy.on('error', (err) => {
  console.error('[run-offline-all] No se pudo abrir el puerto del proxy:', err.message);
  shutdown();
});
