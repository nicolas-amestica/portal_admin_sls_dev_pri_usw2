#!/usr/bin/env node

/**
 * Script para aplicar resultados de Lambda Power Tuning
 * Uso: node scripts/apply-power-tuning-results.js <results-file>
 *
 * Ejemplo de results-file (JSON):
 * {
 *   "build_document_by_form_v1": 768,
 *   "approve_program_v1": 512,
 *   "confirm_program_v1": 896
 * }
 */

import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

// Resultados por defecto basados en estimaciones
const DEFAULT_RESULTS = {
  // api-contract
  'build_document_by_form_v1': 768,
  'get_pdf_document_by_sk_from_program_v1': 896,
  'save_contract_data_v1': 512,
  'get_pdf_document_by_sk_v1': 1024,

  // api-program
  'approve_program_v1': 896,
  'confirm_program_v1': 896,
  'create_program_v1': 512,
  'update_program_v1': 512,
  'get_program_v1': 256,
  'get_programs_v1': 512,

  // api-payment
  'create_installment_payment_v1': 512,
  'confirm_installment_payment_v1': 512,

  // api-entity
  'login': 256,
  'forgot_password_v1': 512,
  'reset_password_v1': 256,

  // api-notification
  'send_notification_contract_v1': 512
};

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
 * Mapea nombre de función a servicio
 */
const FUNCTION_TO_SERVICE = {
  // api-contract
  'build_document_by_form_v1': 'api-contract',
  'get_pdf_document_by_sk_from_program_v1': 'api-contract',
  'save_contract_data_v1': 'api-contract',
  'get_pdf_document_by_sk_v1': 'api-contract',

  // api-program
  'approve_program_v1': 'api-program',
  'confirm_program_v1': 'api-program',
  'create_program_v1': 'api-program',
  'update_program_v1': 'api-program',
  'get_program_v1': 'api-program',
  'get_programs_v1': 'api-program',
  'complete_program_v1': 'api-program',
  'reject_program_v1': 'api-program',

  // api-payment
  'create_installment_payment_v1': 'api-payment',
  'confirm_installment_payment_v1': 'api-payment',
  'get_payments_by_program_v1': 'api-payment',
  'get_payments_by_user_v1': 'api-payment',

  // api-entity
  'login': 'api-entity',
  'forgot_password_v1': 'api-entity',
  'reset_password_v1': 'api-entity',
  'get_access_v1': 'api-entity',

  // api-notification
  'send_notification_contract_v1': 'api-notification',

  // api-balance
  'create_balance_v1': 'api-balance',
  'get_balances_v1': 'api-balance'
};

/**
 * Actualiza memorySize en serverless.yml
 */
function updateServerlessYml(serviceName, functionName, memorySize) {
  const ymlPath = path.join(PROJECT_ROOT, 'services', serviceName, 'serverless.yml');

  if (!fs.existsSync(ymlPath)) {
    log(COLORS.red, `❌ No se encontró: ${ymlPath}`);
    return false;
  }

  try {
    const content = fs.readFileSync(ymlPath, 'utf8');
    const config = yaml.load(content);

    if (!config.functions || !config.functions[functionName]) {
      log(COLORS.yellow, `⚠️  Función ${functionName} no encontrada en ${serviceName}`);
      return false;
    }

    const currentMemory = config.functions[functionName].memorySize || 1024;

    if (currentMemory === memorySize) {
      log(COLORS.blue, `⏭️  ${serviceName}/${functionName}: ${memorySize}MB (sin cambios)`);
      return false;
    }

    config.functions[functionName].memorySize = memorySize;

    // Escribir de vuelta
    const newContent = yaml.dump(config, {
      indent: 2,
      lineWidth: 120,
      noRefs: true
    });

    fs.writeFileSync(ymlPath, newContent, 'utf8');

    const savings = currentMemory > memorySize
      ? `↓ ${Math.round((1 - memorySize / currentMemory) * 100)}%`
      : `↑ ${Math.round((memorySize / currentMemory - 1) * 100)}%`;

    log(COLORS.green, `✅ ${serviceName}/${functionName}: ${currentMemory}MB → ${memorySize}MB (${savings})`);

    return true;
  } catch (error) {
    log(COLORS.red, `❌ Error actualizando ${serviceName}/${functionName}: ${error.message}`);
    return false;
  }
}

/**
 * Main
 */
function main() {
  log(COLORS.blue, '\n========================================');
  log(COLORS.blue, '  Aplicar Resultados de Power Tuning');
  log(COLORS.blue, '========================================\n');

  const args = process.argv.slice(2);
  const resultsFile = args[0];

  let results = DEFAULT_RESULTS;

  if (resultsFile) {
    if (!fs.existsSync(resultsFile)) {
      log(COLORS.red, `❌ Archivo no encontrado: ${resultsFile}`);
      process.exit(1);
    }

    try {
      results = JSON.parse(fs.readFileSync(resultsFile, 'utf8'));
      log(COLORS.green, `✅ Resultados cargados desde: ${resultsFile}\n`);
    } catch (error) {
      log(COLORS.red, `❌ Error leyendo resultados: ${error.message}`);
      process.exit(1);
    }
  } else {
    log(COLORS.yellow, '⚠️  No se especificó archivo de resultados');
    log(COLORS.yellow, '   Usando configuración optimizada por defecto\n');
  }

  let updated = 0;
  let skipped = 0;

  for (const [functionName, memorySize] of Object.entries(results)) {
    const serviceName = FUNCTION_TO_SERVICE[functionName];

    if (!serviceName) {
      log(COLORS.yellow, `⚠️  Servicio desconocido para función: ${functionName}`);
      skipped++;
      continue;
    }

    if (updateServerlessYml(serviceName, functionName, memorySize)) {
      updated++;
    } else {
      skipped++;
    }
  }

  // Resumen
  log(COLORS.blue, '\n========================================');
  log(COLORS.blue, '  Resumen');
  log(COLORS.blue, '========================================');
  log(COLORS.green, `✅ Actualizadas: ${updated}`);
  log(COLORS.yellow, `⏭️  Omitidas: ${skipped}`);

  if (updated > 0) {
    log(COLORS.blue, '\n📝 Próximos pasos:');
    log(COLORS.blue, '   1. Revisar cambios: git diff');
    log(COLORS.blue, '   2. Redesplegar servicios: ./deploy-all.sh dev');
    log(COLORS.blue, '   3. Monitorear CloudWatch Metrics');
  }

  log(COLORS.reset, '');
}

main();
