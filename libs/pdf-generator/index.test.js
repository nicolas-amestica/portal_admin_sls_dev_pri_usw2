import assert from 'node:assert/strict';
import test from 'node:test';
import { PDFDocument, PDFName } from 'pdf-lib';
import { generateContract } from './index.js';

const ONE_PIXEL_PNG =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';

test('does not embed automatic signature images in the signature page', async () => {
  const documentData = {
    title: 'Contrato',
    generalData: 'Datos generales',
    clauses: [],
    signatures: {
      operators: [{ name: 'Operador', dni: '11111111-1' }],
      clients: [{ name: 'Cliente', dni: '22222222-2' }],
      companyName: 'Empresa',
    },
  };

  const originalWarn = console.warn;
  console.warn = () => {};

  try {
    const bytes = await generateContract(documentData, null, null, {
      // La opción legacy debe ser ignorada para evitar que contratos vuelvan a firmarse solos.
      signatures: [{ dni: '11111111-1', signature: ONE_PIXEL_PNG, name: 'Operador' }],
    });
    const pdf = await PDFDocument.load(bytes);
    const subtype = PDFName.of('Subtype');
    const embeddedImages = pdf.context
      .enumerateIndirectObjects()
      .filter(([, object]) => object?.dict?.get?.(subtype)?.toString() === '/Image');

    assert.equal(pdf.getPageCount(), 2);
    assert.equal(embeddedImages.length, 0);
  } finally {
    console.warn = originalWarn;
  }
});
