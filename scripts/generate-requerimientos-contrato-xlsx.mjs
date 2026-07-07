#!/usr/bin/env node
/**
 * Genera el Excel de requerimientos de contrato (celdas bloqueadas + validaciones)
 * y lo sube a S3 bajo documentos/requerimientos-contrato.xlsx.
 *
 * Capacidad por sección (filas editables preasignadas):
 * - Representantes: 5 filas (máximo 5)
 * - Viaje: 1 fila
 * - Curso / aduana: STUDENT_ROWS (alumnos, apoderados, profesores y demás viajeros)
 *
 * Uso:
 *   AWS_PROFILE=pa-dev node scripts/generate-requerimientos-contrato-xlsx.mjs --stage dev
 *   AWS_PROFILE=pa-dev node scripts/generate-requerimientos-contrato-xlsx.mjs --stage dev --dry-run
 */
import { writeFileSync } from 'node:fs';
import { parseArgs } from 'node:util';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import ExcelJS from 'exceljs';

const SHORT_REGION = 'usw2';
const S3_KEY = 'documentos/requerimientos-contrato.xlsx';
const SHEET_NAME = 'Requerimientos';
const REPRESENTATIVE_ROWS = 5;
const STUDENT_ROWS = 200;
const SHEET_COLS = 6;

const REP_HEADERS = [
  'Nombre',
  'Apellido',
  'RUT (sin puntos, con guión)',
  'Profesión / Ocupación',
  'Teléfono',
  'Email',
];
const TRIP_HEADERS = [
  'Establecimiento educacional',
  'Lugar de salida del grupo',
  'Dirección de salida del grupo',
  'Nombre del programa a contratar',
];
const COURSE_HEADERS = [
  'Nombres',
  'Apellidos',
  'RUT (sin puntos, con guión)',
  'Fecha de nacimiento (dd/mm/aaaa)',
  'Género',
  'Nacionalidad',
];

const COURSE_NOTICE =
  'IMPORTANTE: Incluya también apoderados y profesores que viajen. ' +
  'Registre en esta sección a todas las personas que cruzarán la aduana.';

const { values } = parseArgs({
  options: {
    stage: { type: 'string', default: 'dev' },
    region: { type: 'string', default: 'us-west-2' },
    'dry-run': { type: 'boolean', default: false },
  },
});

const stage = values.stage;
const region = values.region;
const bucket = `giras-indomito-${stage}-info`;

process.env.AWS_PROFILE ||= `pa-${stage}`;

const SECTION_STYLE = {
  font: { bold: true, size: 12, color: { argb: 'FFFFFFFF' } },
  fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2E75B6' } },
  alignment: { horizontal: 'left', vertical: 'middle' },
};

const HEADER_STYLE = {
  font: { bold: true, size: 10 },
  fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E2F3' } },
  alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
  border: {
    top: { style: 'thin' },
    bottom: { style: 'thin' },
    left: { style: 'thin' },
    right: { style: 'thin' },
  },
};

const INPUT_BORDER = {
  top: { style: 'thin' },
  bottom: { style: 'thin' },
  left: { style: 'thin' },
  right: { style: 'thin' },
};

const GENDER_LIST = '"Masculino,Femenino"';

const RUT_PROMPT =
  'Ingrese el RUT sin puntos y con guión antes del dígito verificador. Ejemplo: 12345678-9 o 1234567-K';
const RUT_ERROR =
  'RUT inválido. Use solo números, un guión "-" y el dígito verificador (0-9 o K). ' +
  'Sin puntos ni comas. Ejemplo: 12345678-9';

/** Aplica estilo a una celda. */
function styleCell(cell, style) {
  if (style.font) cell.font = { ...(cell.font ?? {}), ...style.font };
  if (style.fill) cell.fill = style.fill;
  if (style.alignment) cell.alignment = { ...(cell.alignment ?? {}), ...style.alignment };
  if (style.border) cell.border = style.border;
}

/** Marca una celda como editable (desbloqueada). */
function unlockCell(cell) {
  cell.protection = { locked: false };
  cell.border = INPUT_BORDER;
}

/** Crea título de sección en una fila. */
function writeSectionTitle(ws, row, title) {
  const cell = ws.getCell(row, 1);
  cell.value = title;
  styleCell(cell, SECTION_STYLE);
  ws.mergeCells(row, 1, row, SHEET_COLS);
  ws.getRow(row).height = 22;
}

/** Aviso en rojo bajo el título de sección. */
function writeRedNotice(ws, row, text) {
  const cell = ws.getCell(row, 1);
  cell.value = text;
  cell.font = { bold: true, size: 10, color: { argb: 'FFC00000' } };
  cell.alignment = { wrapText: true, vertical: 'middle' };
  ws.mergeCells(row, 1, row, SHEET_COLS);
  ws.getRow(row).height = 32;
}

/** Crea fila de encabezados de tabla. */
function writeHeaderRow(ws, row, headers) {
  headers.forEach((header, index) => {
    const cell = ws.getCell(row, index + 1);
    cell.value = header;
    styleCell(cell, HEADER_STYLE);
  });
  ws.getRow(row).height = 30;
}

/** Fórmula Excel: RUT chileno sin puntos, con guión y dígito verificador (0-9 o K). */
function rutValidationFormula(colLetter, row) {
  const c = `${colLetter}${row}`;
  return (
    `AND(` +
    `ISERROR(SEARCH(".",${c})),ISERROR(SEARCH(",",${c})),ISERROR(SEARCH(" ",${c})),` +
    `LEN(${c})-LEN(SUBSTITUTE(${c},"-",""))=1,` +
    `FIND("-",${c})>=8,FIND("-",${c})<=9,` +
    `LEN(${c})>=9,LEN(${c})<=11,` +
    `ISNUMBER(VALUE(LEFT(${c},FIND("-",${c})-1))),` +
    `OR(ISNUMBER(VALUE(RIGHT(${c},1))),UPPER(RIGHT(${c},1))="K")` +
    `)`
  );
}

/** Aplica validación de RUT a una celda editable. */
function applyRutValidation(ws, row, colIndex) {
  const rutCell = ws.getCell(row, colIndex);
  const colLetter = wsColLetter(colIndex);
  rutCell.numFmt = '@';
  rutCell.dataValidation = {
    type: 'custom',
    allowBlank: true,
    showInputMessage: true,
    promptTitle: 'RUT',
    prompt: RUT_PROMPT,
    showErrorMessage: true,
    errorStyle: 'stop',
    errorTitle: 'RUT inválido',
    error: RUT_ERROR,
    formulae: [rutValidationFormula(colLetter, row)],
  };
}

/** Fórmula Excel: fecha obligatoria en formato dd/mm/aaaa con fecha real y rango de año. */
function birthDateValidationFormula(colLetter, row) {
  const c = `${colLetter}${row}`;
  return (
    `AND(LEN(${c})=10,` +
    `MID(${c},3,1)="/",MID(${c},6,1)="/",` +
    `ISNUMBER(DATE(VALUE(RIGHT(${c},4)),VALUE(MID(${c},4,2)),VALUE(LEFT(${c},2)))),` +
    `VALUE(RIGHT(${c},4))>=1920,VALUE(RIGHT(${c},4))<=2015)`
  );
}

/** Aplica validaciones de RUT, fecha y género a una fila de viajero. */
function applyTravelerRowValidations(ws, row) {
  applyRutValidation(ws, row, 3);

  const dateCell = ws.getCell(row, 4);
  const colLetter = wsColLetter(4);
  dateCell.numFmt = '@';
  dateCell.dataValidation = {
    type: 'custom',
    allowBlank: true,
    showInputMessage: true,
    promptTitle: 'Fecha de nacimiento',
    prompt: 'Ingrese la fecha exactamente como dd/mm/aaaa. Ejemplo: 15/03/2010',
    showErrorMessage: true,
    errorStyle: 'stop',
    errorTitle: 'Formato de fecha inválido',
    error:
      'Use el formato dd/mm/aaaa con barras (ejemplo: 15/03/2010). ' +
      'No use guiones ni otros separadores.',
    formulae: [birthDateValidationFormula(colLetter, row)],
  };

  const genderCell = ws.getCell(row, 5);
  genderCell.dataValidation = {
    type: 'list',
    allowBlank: true,
    showInputMessage: true,
    promptTitle: 'Género',
    prompt: 'Seleccione Masculino o Femenino desde la lista desplegable.',
    showErrorMessage: true,
    errorStyle: 'stop',
    errorTitle: 'Género inválido',
    error: 'Seleccione Masculino o Femenino.',
    formulae: [GENDER_LIST],
  };
}

/** Aplica validaciones de RUT y email a una fila de representante. */
function applyRepresentativeRowValidations(ws, row) {
  applyRutValidation(ws, row, 3);

  const emailCell = ws.getCell(row, 6);
  emailCell.dataValidation = {
    type: 'custom',
    allowBlank: true,
    showErrorMessage: true,
    errorStyle: 'warning',
    errorTitle: 'Email inválido',
    error: 'Ingrese un correo electrónico válido (ejemplo@dominio.cl).',
    formulae: [`ISNUMBER(SEARCH("@",F${row}))`],
  };
}

/** Registra celdas editables de una fila de datos tabulares. */
function pushEditableRow(editableCells, row, colCount) {
  for (let col = 1; col <= colCount; col += 1) {
    editableCells.push(wsColLetter(col) + row);
  }
}

/** Convierte índice de columna 1-based a letra Excel (A–Z). */
function wsColLetter(col) {
  return String.fromCharCode(64 + col);
}

/** Bloquea toda la hoja salvo las celdas indicadas. */
function protectWorksheet(ws, editableCells) {
  for (const address of editableCells) {
    unlockCell(ws.getCell(address));
  }

  ws.protect('', {
    selectLockedCells: true,
    selectUnlockedCells: true,
    formatCells: false,
    formatColumns: false,
    formatRows: false,
    insertColumns: false,
    insertRows: false,
    insertHyperlinks: false,
    deleteColumns: false,
    deleteRows: false,
    sort: false,
    autoFilter: false,
    pivotTables: false,
  });
}

/** Hoja oculta con coordenadas fijas para importación programática. */
function writeImportMetadataSheet(workbook, layout) {
  const meta = workbook.addWorksheet('_import', { state: 'veryHidden' });
  const rows = [
    ['sheet', SHEET_NAME],
    ['representatives_start_row', layout.repStartRow],
    ['representatives_end_row', layout.repEndRow],
    ['representatives_columns', 'A:F'],
    ['trip_data_row', layout.tripDataRow],
    ['trip_columns', 'A:D'],
    ['course_notice_row', layout.courseNoticeRow],
    ['course_header_row', layout.courseHeaderRow],
    ['course_start_row', layout.courseStartRow],
    ['course_end_row', layout.courseEndRow],
    ['course_columns', 'A:F'],
    ['representative_capacity', REPRESENTATIVE_ROWS],
    ['traveler_capacity', STUDENT_ROWS],
  ];

  rows.forEach(([key, value], index) => {
    meta.getCell(index + 1, 1).value = key;
    meta.getCell(index + 1, 2).value = value;
  });
}

async function buildWorkbook() {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Giras Indomito';
  workbook.created = new Date();

  const ws = workbook.addWorksheet(SHEET_NAME, {
    views: [{ state: 'frozen', ySplit: 0 }],
    properties: { defaultGridType: 1 },
  });

  ws.columns = [
    { width: 22 },
    { width: 22 },
    { width: 26 },
    { width: 28 },
    { width: 16 },
    { width: 30 },
  ];

  const instruction = ws.getCell('A1');
  instruction.value =
    'Complete únicamente las celdas en blanco con borde. Máximo 5 representantes. ' +
    `En la sección de viajeros registre hasta ${STUDENT_ROWS} personas (alumnos, apoderados, profesores y demás). ` +
    'Deje vacías las filas que no use. No modifique títulos ni encabezados.';
  instruction.font = { italic: true, size: 10, color: { argb: 'FF555555' } };
  instruction.alignment = { wrapText: true };
  ws.mergeCells(1, 1, 1, SHEET_COLS);
  ws.getRow(1).height = 40;

  // ── 1. Datos de los representantes ───────────────────────────────────────
  writeSectionTitle(ws, 2, `1. Datos de los representantes (máximo ${REPRESENTATIVE_ROWS})`);
  writeHeaderRow(ws, 3, REP_HEADERS);

  const repStartRow = 4;
  const repEndRow = repStartRow + REPRESENTATIVE_ROWS - 1;

  // ── 2. Datos del viaje ───────────────────────────────────────────────────
  const tripSectionRow = repEndRow + 2;
  const tripHeaderRow = tripSectionRow + 1;
  const tripDataRow = tripHeaderRow + 1;

  writeSectionTitle(ws, tripSectionRow, '2. Datos del viaje');
  writeHeaderRow(ws, tripHeaderRow, TRIP_HEADERS);

  // ── 3. Datos del curso / personas que cruzan aduana ───────────────────────
  const courseSectionRow = tripDataRow + 2;
  const courseNoticeRow = courseSectionRow + 1;
  const courseHeaderRow = courseNoticeRow + 1;
  const courseStartRow = courseHeaderRow + 1;
  const courseEndRow = courseStartRow + STUDENT_ROWS - 1;

  writeSectionTitle(ws, courseSectionRow, `3. Datos del curso (hasta ${STUDENT_ROWS} personas)`);
  writeRedNotice(ws, courseNoticeRow, COURSE_NOTICE);
  writeHeaderRow(ws, courseHeaderRow, COURSE_HEADERS);

  const editableCells = [];

  for (let row = repStartRow; row <= repEndRow; row += 1) {
    ws.getRow(row).height = 20;
    pushEditableRow(editableCells, row, REP_HEADERS.length);
    applyRepresentativeRowValidations(ws, row);
  }

  ws.getRow(tripDataRow).height = 20;
  pushEditableRow(editableCells, tripDataRow, TRIP_HEADERS.length);

  for (let row = courseStartRow; row <= courseEndRow; row += 1) {
    ws.getRow(row).height = 20;
    pushEditableRow(editableCells, row, COURSE_HEADERS.length);
    applyTravelerRowValidations(ws, row);
  }

  protectWorksheet(ws, editableCells);

  writeImportMetadataSheet(workbook, {
    repStartRow,
    repEndRow,
    tripDataRow,
    courseNoticeRow,
    courseHeaderRow,
    courseStartRow,
    courseEndRow,
  });

  return workbook;
}

async function main() {
  const workbook = await buildWorkbook();
  const buffer = Buffer.from(await workbook.xlsx.writeBuffer());

  if (values['dry-run']) {
    const localPath = './requerimientos-contrato.xlsx';
    writeFileSync(localPath, buffer);
    console.log(`✔ Excel generado localmente: ${localPath}`);
    console.log(`  Representantes: ${REPRESENTATIVE_ROWS} filas | Viajeros: ${STUDENT_ROWS} filas`);
    return;
  }

  const s3 = new S3Client({ region });
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: S3_KEY,
      Body: buffer,
      ContentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }),
  );

  console.log(`✔ Subido s3://${bucket}/${S3_KEY}`);
  console.log(`  Representantes: ${REPRESENTATIVE_ROWS} filas | Viajeros: ${STUDENT_ROWS} filas`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
