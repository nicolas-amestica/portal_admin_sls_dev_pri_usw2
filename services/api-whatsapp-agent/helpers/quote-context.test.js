import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { detectRegionFromText } from '../tools/region-presupuesto-ciudad.js';
import { detectDestinosFromText, extractQuoteContext } from './fn-extract-quote-context.js';
import { prepareTurnContext } from './prepare-turn-context.js';

function msg(role, text, sk) {
  return { sk: sk ?? `MSG#${role}`, role, parts: [{ text }] };
}

describe('detectRegionFromText', () => {
  it('detecta Los Andes como VI Región', () => {
    const r = detectRegionFromText('Somos de los andes');
    assert.equal(r?.codigoRegion, 'vi');
    assert.equal(r?.ciudad, 'los andes');
  });

  it('detecta Temuco como IX Región', () => {
    const r = detectRegionFromText('Somos de Temuco y queremos cotizar');
    assert.equal(r?.codigoRegion, 'ix');
  });
});

describe('detectDestinosFromText', () => {
  it('detecta sur y bariloche en el mismo mensaje', () => {
    const destinos = detectDestinosFromText('Quiero saber los valores para el sur y bariloche');
    assert.deepEqual(
      destinos.map((d) => d.destino).sort(),
      ['bariloche', 'sur_de_chile']
    );
  });
});

describe('extractQuoteContext', () => {
  it('reconstruye cotización en burst de dos mensajes', () => {
    const turnItems = [
      msg('user', 'Hola quisiera mas información de gira de estudio', 'MSG#1'),
      msg('model', 'Buenos días... qué destino y región?', 'MSG#2'),
      msg('user', 'Quiero saber los valores para el sur y bariloche', 'MSG#3'),
      msg('user', 'Somos de los andes', 'MSG#4'),
    ];

    const ctx = extractQuoteContext(turnItems);
    assert.ok(ctx);
    assert.equal(ctx.codigoRegion, 'vi');
    assert.ok(ctx.destinos.includes('bariloche'));
    assert.ok(ctx.destinos.includes('sur_de_chile'));
    assert.equal(ctx.surPdfDisponible, false);
    assert.ok(ctx.accionesSugeridas.some((a) => a.includes('bariloche')));
    assert.ok(ctx.noRepreguntar.includes('NO vuelvas'));
  });
});

describe('prepareTurnContext', () => {
  it('fusiona burst user pendiente en un solo newMessage', () => {
    const turnItems = [
      msg('user', 'Hola', 'MSG#1'),
      msg('model', 'Respuesta', 'MSG#2'),
      msg('user', 'sur y bariloche', 'MSG#3'),
      msg('user', 'Somos de los andes', 'MSG#4'),
    ];

    const { history, pendingUserText, hasHistory } = prepareTurnContext(turnItems);
    assert.equal(hasHistory, true);
    assert.equal(pendingUserText, 'sur y bariloche\nSomos de los andes');
    assert.equal(history[history.length - 1].role, 'model');
  });
});
