#!/usr/bin/env node

/**
 * Script de migración automática de handlers al patrón middleware
 * Uso: node scripts/migrate-handlers.js <service-name> [--dry-run]
 *
 * Ejemplos:
 *   node scripts/migrate-handlers.js api-program
 *   node scripts/migrate-handlers.js api-entity --dry-run
 *   node scripts/migrate-handlers.js all
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

const args = process.argv.slice(2);
const serviceName = args[0];
const isDryRun = args.includes('--dry-run');

if (!serviceName) {
  console.error('❌ Uso: node scripts/migrate-handlers.js <service-name> [--dry-run]');
  console.error('   Servicios disponibles: api-program, api-entity, api-payment, api-balance, etc.');
  console.error('   O usa "all" para migrar todos los servicios');
  process.exit(1);
}

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m'
};

function log(color, message) {
  console.log(`${color}${message}${COLORS.reset}`);
}

/**
 * Migra un archivo handler al patrón middleware
 */
function migrateHandler(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changes = [];

  // 1. Agregar import de middleware si no existe
  if (!content.includes('standardMiddleware')) {
    const middlewareImport = `import { standardMiddleware } from "../../../libs/middleware/index.js";\n`;

    // Insertar después del último import
    const lastImportIndex = content.lastIndexOf('import ');
    if (lastImportIndex !== -1) {
      const nextLineIndex = content.indexOf('\n', lastImportIndex);
      content = content.slice(0, nextLineIndex + 1) + middlewareImport + content.slice(nextLineIndex + 1);
      changes.push('+ Import standardMiddleware');
    }
  }

  // 2. Remover import de parseEventBody si existe
  if (content.includes('parseEventBody')) {
    content = content.replace(/import.*parseEventBody.*\n/g, '');
    changes.push('- Remover import parseEventBody');
  }

  // 3. Remover import de unsuccessful si no se usa en success/unsuccessful returns
  // (Solo si está en imports pero no en el código)
  const unsuccessfulInImport = content.match(/import.*unsuccessful.*from/);
  const unsuccessfulInCode = content.match(/return unsuccessful\(/);

  if (unsuccessfulInImport && !unsuccessfulInCode) {
    content = content.replace(/,?\s*unsuccessful/g, '');
    changes.push('- Remover import unsuccessful no usado');
  }

  // 4. Cambiar export const main = async (event) => { a const handler = async (event) => {
  if (content.includes('export const main = async (event)')) {
    content = content.replace(
      /export const main = async \(event(?:, context)?\) => \{/g,
      'const handler = async (event) => {'
    );
    changes.push('~ Cambiar main a handler');
  }

  // 5. Remover try-catch externo (el más común)
  const tryPattern = /(\s+)try \{\n([\s\S]*?)\n\s+\} catch.*\{[\s\S]*?return unsuccessful.*?\n\s+\}/;
  if (tryPattern.test(content)) {
    content = content.replace(tryPattern, (match, indent, body) => {
      // Mantener el contenido del try, remover el try-catch wrapper
      return body;
    });
    changes.push('- Remover try-catch externo');
  }

  // 6. Reemplazar parseEventBody(event) por event.body
  if (content.includes('parseEventBody(event)')) {
    content = content.replace(/const body = parseEventBody\(event\);?/g, '// event.body ya está parseado por middleware');
    content = content.replace(/parseEventBody\(event\)/g, 'event.body');
    changes.push('~ Usar event.body (parseado por middleware)');
  }

  // 7. Reemplazar event.pathParameters por event.pathParams
  if (content.includes('event.pathParameters')) {
    content = content.replace(/event\.pathParameters/g, 'event.pathParams');
    changes.push('~ pathParameters → pathParams');
  }

  // 8. Reemplazar event.queryStringParameters por event.queryParams
  if (content.includes('event.queryStringParameters')) {
    content = content.replace(/event\.queryStringParameters/g, 'event.queryParams');
    changes.push('~ queryStringParameters → queryParams');
  }

  // 9. Cambiar returns de unsuccessful a throw Error
  // Ejemplo: return unsuccessful(400, { message: '...' }, ACTION);
  // A: const error = new Error('...'); error.statusCode = 400; throw error;
  const unsuccessfulReturns = content.match(/return unsuccessful\((\d+),\s*\{?\s*message:\s*['"]([^'"]+)['"]\s*\}?,?\s*.*?\);/g);

  if (unsuccessfulReturns) {
    unsuccessfulReturns.forEach(returnStmt => {
      const match = returnStmt.match(/return unsuccessful\((\d+),\s*\{?\s*message:\s*['"]([^'"]+)['"]\s*\}?/);
      if (match) {
        const [, statusCode, message] = match;
        const replacement = `const error = new Error('${message}');\n    error.statusCode = ${statusCode};\n    throw error;`;
        content = content.replace(returnStmt, replacement);
      }
    });
    changes.push('~ Convertir unsuccessful returns a throw Error');
  }

  // 10. Agregar export al final si no existe
  if (!content.includes('export const main = standardMiddleware')) {
    // Verificar si hay export existente
    const exportMatch = content.match(/export \{ main \}/);
    if (exportMatch) {
      content = content.replace(/export \{ main \}/, 'export const main = standardMiddleware(handler);');
      changes.push('~ Actualizar export con middleware');
    } else {
      content += '\n\nexport const main = standardMiddleware(handler);\n';
      changes.push('+ Agregar export con middleware');
    }
  }

  // 11. Remover parámetro context si no se usa
  if (content.includes('async (event, context)') && !content.includes('context.')) {
    content = content.replace(/async \(event, context\)/g, 'async (event)');
    changes.push('- Remover parámetro context no usado');
  }

  return { content, changes };
}

/**
 * Procesa todos los handlers de un servicio
 */
function processService(servicePath) {
  const functionsDir = path.join(servicePath, 'functions');

  if (!fs.existsSync(functionsDir)) {
    log(COLORS.yellow, `⚠️  No se encontró directorio functions/ en ${servicePath}`);
    return { processed: 0, migrated: 0, skipped: 0 };
  }

  const files = fs.readdirSync(functionsDir).filter(f => f.endsWith('.js'));

  let stats = { processed: 0, migrated: 0, skipped: 0 };

  files.forEach(file => {
    const filePath = path.join(functionsDir, file);
    const content = fs.readFileSync(filePath, 'utf8');

    stats.processed++;

    // Skip si ya tiene middleware
    if (content.includes('standardMiddleware')) {
      log(COLORS.blue, `⏭️  ${file} - Ya migrado`);
      stats.skipped++;
      return;
    }

    log(COLORS.yellow, `\n📝 Migrando: ${file}`);

    const { content: newContent, changes } = migrateHandler(filePath);

    if (changes.length > 0) {
      changes.forEach(change => {
        const symbol = change[0];
        const color = symbol === '+' ? COLORS.green : symbol === '-' ? COLORS.red : COLORS.yellow;
        log(color, `   ${change}`);
      });

      if (!isDryRun) {
        fs.writeFileSync(filePath, newContent, 'utf8');
        log(COLORS.green, `   ✅ Guardado`);
        stats.migrated++;
      } else {
        log(COLORS.blue, `   🔍 Dry-run (no guardado)`);
      }
    } else {
      log(COLORS.yellow, `   ⚠️  Sin cambios necesarios`);
    }
  });

  return stats;
}

/**
 * Main
 */
function main() {
  log(COLORS.blue, '\n========================================');
  log(COLORS.blue, '  Migración de Handlers a Middleware');
  log(COLORS.blue, '========================================\n');

  if (isDryRun) {
    log(COLORS.yellow, '🔍 Modo DRY-RUN: No se guardarán cambios\n');
  }

  const services = serviceName === 'all'
    ? ['api-program', 'api-entity', 'api-payment', 'api-balance', 'api-extraction', 'api-notification']
    : [serviceName];

  let totalStats = { processed: 0, migrated: 0, skipped: 0 };

  services.forEach(service => {
    const servicePath = path.join(PROJECT_ROOT, 'services', service);

    if (!fs.existsSync(servicePath)) {
      log(COLORS.red, `❌ Servicio no encontrado: ${service}`);
      return;
    }

    log(COLORS.blue, `\n📦 Procesando: ${service}`);
    log(COLORS.blue, '─'.repeat(40));

    const stats = processService(servicePath);

    totalStats.processed += stats.processed;
    totalStats.migrated += stats.migrated;
    totalStats.skipped += stats.skipped;

    log(COLORS.blue, `\n   Procesados: ${stats.processed}`);
    log(COLORS.green, `   Migrados: ${stats.migrated}`);
    log(COLORS.yellow, `   Omitidos: ${stats.skipped}`);
  });

  // Resumen final
  log(COLORS.blue, '\n========================================');
  log(COLORS.blue, '  Resumen Final');
  log(COLORS.blue, '========================================');
  log(COLORS.blue, `📊 Total procesados: ${totalStats.processed}`);
  log(COLORS.green, `✅ Total migrados: ${totalStats.migrated}`);
  log(COLORS.yellow, `⏭️  Total omitidos: ${totalStats.skipped}`);

  if (isDryRun) {
    log(COLORS.yellow, '\n💡 Ejecuta sin --dry-run para aplicar los cambios');
  } else if (totalStats.migrated > 0) {
    log(COLORS.green, '\n✨ Migración completada exitosamente');
    log(COLORS.blue, '\n📝 Próximos pasos:');
    log(COLORS.blue, '   1. Revisar cambios: git diff');
    log(COLORS.blue, '   2. Verificar compilación: cd services/<servicio> && npx sls package');
    log(COLORS.blue, '   3. Testing local: npx sls offline');
  }

  log(COLORS.reset, '');
}

main();
