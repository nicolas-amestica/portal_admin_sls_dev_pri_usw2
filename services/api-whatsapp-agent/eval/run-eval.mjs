/**
 * @description Evaluación MVP del prompt del agente WhatsApp (sin Lambda).
 * Pruebas estáticas del system prompt siempre.
 * Integración Gemini opcional con GEMINI_API_KEY_EVAL (humo + logs).
 *
 * Desde la raíz del monorepo: npm run eval:agent
 * Con API: GEMINI_API_KEY_EVAL=tu_key npm run eval:agent
 */
import assert from 'node:assert/strict';

async function runStaticPromptAssertions(buildSystemPrompt) {
  const base = buildSystemPrompt('+56912345678', {}, 'whatsapp', false);
  assert.ok(base.includes('Silencio total al derivar'), 'prompt debe incluir política de silencio al derivar');
  assert.ok(base.includes('buscar_presupuestos'), 'prompt debe referenciar flujo presupuestos');
  assert.ok(base.includes('10:00 a 22:00'), 'prompt debe incluir horario L-V actualizado');
  assert.ok(base.includes('1 hora 30 minutos'), 'prompt debe indicar duración de reunión');

  const conPdf = buildSystemPrompt('+56912345678', { presupuestosPdfEnviados: true }, 'whatsapp', true);
  assert.ok(
    conPdf.includes('Ya se enviaron presupuestos en PDF'),
    'contexto debe indicar PDFs ya enviados cuando presupuestosPdfEnviados=true'
  );

  const sinPdf = buildSystemPrompt('+56912345678', {}, 'whatsapp', true);
  assert.ok(
    !sinPdf.includes('Ya se enviaron presupuestos en PDF'),
    'sin flag presupuestosPdfEnviados no debe afirmar envío previo de PDF'
  );

  console.log('[eval] Pruebas estáticas del system prompt: OK');
}

async function runIntegrationSmoke(runConversationTurn) {
  const phone = '+56900000000';
  const msg = 'Hola, somos de Temuco y queremos cotizar Bariloche para el curso.';
  const out = await runConversationTurn([], msg, phone, {}, 'whatsapp', false);
  assert.ok(Array.isArray(out.toolsExecuted), 'toolsExecuted debe ser un array');
  console.log('[eval] Integración Gemini: herramientas:', out.toolsExecuted.map((t) => t.name).join(', ') || '(ninguna)');
  console.log('[eval] Humo API Gemini: OK');
}

async function main() {
  const { buildSystemPrompt, runConversationTurn } = await import('../helpers/gemini-agent.js');

  runStaticPromptAssertions(buildSystemPrompt);

  if (!process.env.GEMINI_API_KEY_EVAL) {
    console.log('[eval] Omitiendo llamada a Gemini (exporta GEMINI_API_KEY_EVAL para humo de un turno).');
    return;
  }

  await runIntegrationSmoke(runConversationTurn);
}

main().catch((err) => {
  console.error('[eval] Falló:', err.message);
  process.exitCode = 1;
});
