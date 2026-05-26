import * as XLSX from 'xlsx-js-style'
import { getWorkbook, setWorkbook } from './indexedDB.js'

const SHEET_NAME = 'Hoja 1'
const RESUMEN_SHEET = 'Resumen'

const COL = {
  NOMBRE:        0,  // A
  FECHA:         1,  // B — Excel date serial
  ID:            2,  // C — integer
  EDAD:          3,  // D — integer
  TELEFONO:      4,  // E — string (preserve leading zeros)
  DIRECCION:     5,  // F
  EMAIL:         6,  // G
  PROCEDIMIENTO: 7,  // H
  PRESUPUESTO:   8,  // I
  CLINICA:       9,  // J
  IMPLANTES:    10,  // K
  INSTRUM:      11,  // L
  TIEMPO:       12,  // M
  FACTURA_DIAN: 13,  // N — filled manually in Excel
  PROFIT:       14,  // O
  PROFIT_DIA:   15,  // P
  PROFIT_MES:   16,  // Q
  TIPO_DOC:     17,  // R
  GENERO:       18,  // S
}

const MONTH_NAMES = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre',
]

function dateSerial(isoDate) {
  const [y, m, d] = isoDate.split('-').map(Number)
  return Math.floor(new Date(Date.UTC(y, m - 1, d)).getTime() / 86400000) + 25569
}

function findAppendRow(ws) {
  if (!ws['!ref']) return 1
  const range = XLSX.utils.decode_range(ws['!ref'])
  const isRealPatient = (val) =>
    val != null &&
    String(val).trim() !== '' &&
    String(val).toLowerCase() !== 'nombre'
  let lastDataRow = 0
  for (let r = 0; r <= range.e.r; r++) {
    const cell = ws[XLSX.utils.encode_cell({ r, c: COL.NOMBRE })]
    if (cell && isRealPatient(cell.v)) {
      lastDataRow = r
    }
  }
  return lastDataRow + 1
}

function setCell(ws, row, col, value, type, fmt) {
  const addr = XLSX.utils.encode_cell({ r: row, c: col })
  const cell = { v: value, t: type }
  if (fmt) cell.z = fmt
  ws[addr] = cell
}

function expandRef(ws, row) {
  if (!ws['!ref']) {
    ws['!ref'] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: row, c: COL.GENERO } })
    return
  }
  const range = XLSX.utils.decode_range(ws['!ref'])
  if (row > range.e.r) range.e.r = row
  if (COL.GENERO > range.e.c) range.e.c = COL.GENERO
  ws['!ref'] = XLSX.utils.encode_range(range)
}

// Resumen sheet: bold headers, SUMPRODUCT formulas for each month, TOTAL row.
// No pre-computation — Excel evaluates formulas on open, so this always reflects
// whatever the user fills into Factura Dian (col N) directly in the spreadsheet.
function buildResumen(wb) {
  const ws = {}
  const bold = { font: { bold: true } }

  ws['A1'] = { v: 'Mes',               t: 's', s: bold }
  ws['B1'] = { v: 'Total Factura Dian', t: 's', s: bold }
  ws['C1'] = { v: 'Pacientes',          t: 's', s: bold }

  for (let m = 1; m <= 12; m++) {
    const row = m + 1
    ws[`A${row}`] = { v: MONTH_NAMES[m - 1], t: 's' }
    ws[`B${row}`] = {
      v: 0, t: 'n',
      f: `SUMPRODUCT((MONTH('Hoja 1'!$B$2:$B$1011)=${m})*(YEAR('Hoja 1'!$B$2:$B$1011)=2026)*('Hoja 1'!$N$2:$N$1011))`,
      z: '"$"#,##0',
    }
    ws[`C${row}`] = {
      v: 0, t: 'n',
      f: `SUMPRODUCT((MONTH('Hoja 1'!$B$2:$B$1011)=${m})*(YEAR('Hoja 1'!$B$2:$B$1011)=2026)*(LEN('Hoja 1'!$A$2:$A$1011)>6))`,
    }
  }

  ws['A14'] = { v: 'TOTAL 2026', t: 's', s: bold }
  ws['B14'] = { v: 0, t: 'n', f: 'SUM(B2:B13)', z: '"$"#,##0', s: bold }
  ws['C14'] = { v: 0, t: 'n', f: 'SUM(C2:C13)', s: bold }

  ws['!ref'] = 'A1:C14'

  if (wb.SheetNames.includes(RESUMEN_SHEET)) {
    wb.Sheets[RESUMEN_SHEET] = ws
  } else {
    XLSX.utils.book_append_sheet(wb, ws, RESUMEN_SHEET)
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function storeUploadedWorkbook(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: 'array' })
        if (!wb.SheetNames.includes(SHEET_NAME)) {
          reject(new Error(`El archivo no contiene la hoja "${SHEET_NAME}"`))
          return
        }
        await setWorkbook(XLSX.write(wb, { type: 'base64', bookType: 'xlsx' }))
        resolve()
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = () => reject(new Error('Error al leer el archivo'))
    reader.readAsArrayBuffer(file)
  })
}

export async function appendPatient(patient, dateStr) {
  const b64 = await getWorkbook()
  if (!b64) throw new Error('No hay plantilla guardada')

  const wb = XLSX.read(b64, { type: 'base64' })
  if (!wb.SheetNames.includes(SHEET_NAME)) throw new Error(`Hoja "${SHEET_NAME}" no encontrada`)

  const ws  = wb.Sheets[SHEET_NAME]
  const row = findAppendRow(ws)

  // Patient identity fields — always populated
  setCell(ws, row, COL.NOMBRE,    patient.nombre    ?? '',              's')
  setCell(ws, row, COL.FECHA,     dateSerial(dateStr),                  'n', 'dd/mm/yyyy')
  setCell(ws, row, COL.ID,        parseInt(patient.id,   10) || 0,      'n')
  setCell(ws, row, COL.EDAD,      parseInt(patient.edad, 10) || 0,      'n')
  setCell(ws, row, COL.TELEFONO,  String(patient.telefono  ?? ''),      's')
  setCell(ws, row, COL.DIRECCION, patient.direccion ?? '',              's')
  setCell(ws, row, COL.EMAIL,     patient.email     ?? '',              's')
  setCell(ws, row, COL.TIPO_DOC,  patient.tipoDoc || 'Cédula de ciudadanía', 's')
  setCell(ws, row, COL.GENERO,    'Femenino',                               's')

  // Save optional clinical fields when provided (from ClinicalData screen)
  if (patient.procedimiento) setCell(ws, row, COL.PROCEDIMIENTO, String(patient.procedimiento), 's')
  if (patient.clinica)       setCell(ws, row, COL.CLINICA,       String(patient.clinica),       's')
  if (patient.implantes)     setCell(ws, row, COL.IMPLANTES,     String(patient.implantes),     's')
  if (patient.presupuesto != null && patient.presupuesto !== '') {
    const n = Number(patient.presupuesto); if (!isNaN(n) && n !== 0) setCell(ws, row, COL.PRESUPUESTO, n, 'n', '"$"#,##0')
  }
  if (patient.instrum != null && patient.instrum !== '') {
    const n = Number(patient.instrum); if (!isNaN(n) && n !== 0) setCell(ws, row, COL.INSTRUM, n, 'n')
  }
  if (patient.tiempo != null && patient.tiempo !== '') {
    const n = Number(patient.tiempo); if (!isNaN(n) && n !== 0) setCell(ws, row, COL.TIEMPO, n, 'n')
  }
  if (patient.facturaDian != null && patient.facturaDian !== '') {
    const n = Number(patient.facturaDian); if (!isNaN(n) && n !== 0) setCell(ws, row, COL.FACTURA_DIAN, n, 'n', '"$"#,##0')
  }

  expandRef(ws, row)
  buildResumen(wb)

  await setWorkbook(XLSX.write(wb, { type: 'base64', bookType: 'xlsx' }))
}


export async function readPatients() {
  const b64 = await getWorkbook()
  if (!b64) return []

  const wb = XLSX.read(b64, { type: 'base64' })
  const ws = wb.Sheets[SHEET_NAME]
  if (!ws || !ws['!ref']) return []

  const range = XLSX.utils.decode_range(ws['!ref'])
  const patients = []

  for (let r = 1; r <= range.e.r; r++) {
    const nombreCell = ws[XLSX.utils.encode_cell({ r, c: COL.NOMBRE })]
    if (!nombreCell || !String(nombreCell.v ?? '').trim()) continue

    const get = (col) => {
      const cell = ws[XLSX.utils.encode_cell({ r, c: col })]
      return cell != null ? cell.v : null
    }

    patients.push({
      _row:          r,
      nombre:        String(get(COL.NOMBRE)        ?? ''),
      id:            get(COL.ID),
      edad:          get(COL.EDAD),
      telefono:      String(get(COL.TELEFONO)       ?? ''),
      direccion:     String(get(COL.DIRECCION)      ?? ''),
      email:         String(get(COL.EMAIL)          ?? ''),
      tipoDoc:       String(get(COL.TIPO_DOC)       ?? 'Cédula de ciudadanía'),
      genero:        String(get(COL.GENERO)         ?? 'Femenino'),
      fecha:         get(COL.FECHA),
      procedimiento: String(get(COL.PROCEDIMIENTO) ?? ''),
      presupuesto:   get(COL.PRESUPUESTO),
      clinica:       String(get(COL.CLINICA)        ?? ''),
      implantes:     String(get(COL.IMPLANTES)      ?? ''),
      instrum:       get(COL.INSTRUM),
      tiempo:        get(COL.TIEMPO),
      facturaDian:   get(COL.FACTURA_DIAN),
    })
  }

  return patients
}

export async function deletePatient(patientId) {
  const b64 = await getWorkbook()
  if (!b64) throw new Error('No hay plantilla guardada')

  const wb = XLSX.read(b64, { type: 'base64' })
  const ws = wb.Sheets[SHEET_NAME]
  if (!ws || !ws['!ref']) return

  const range    = XLSX.utils.decode_range(ws['!ref'])
  const targetId = String(patientId).trim()

  // Find the row matching by ID (col C) — never rely on row index alone
  let deleteRow = -1
  for (let r = 1; r <= range.e.r; r++) {
    const cell = ws[XLSX.utils.encode_cell({ r, c: COL.ID })]
    if (cell && String(cell.v ?? '').trim() === targetId) {
      deleteRow = r
      break
    }
  }
  if (deleteRow === -1) return

  // Shift every row after deleteRow up by one
  for (let r = deleteRow; r < range.e.r; r++) {
    for (let c = 0; c <= range.e.c; c++) {
      const src = XLSX.utils.encode_cell({ r: r + 1, c })
      const dst = XLSX.utils.encode_cell({ r, c })
      if (ws[src]) { ws[dst] = ws[src] } else { delete ws[dst] }
    }
  }
  // Clear the now-duplicate last row
  for (let c = 0; c <= range.e.c; c++) {
    delete ws[XLSX.utils.encode_cell({ r: range.e.r, c })]
  }

  range.e.r = Math.max(0, range.e.r - 1)
  ws['!ref'] = XLSX.utils.encode_range(range)

  buildResumen(wb)
  await setWorkbook(XLSX.write(wb, { type: 'base64', bookType: 'xlsx' }))
}

// Load a new .xlsx template, optionally preserving all patient rows from the
// current workbook. Returns the number of patient rows migrated.
export async function migrateWorkbook(newFile, keepPatients) {
  const existingRows = []

  if (keepPatients) {
    const b64 = await getWorkbook()
    if (b64) {
      const wb = XLSX.read(b64, { type: 'base64' })
      const ws = wb.Sheets[SHEET_NAME]
      if (ws && ws['!ref']) {
        const range = XLSX.utils.decode_range(ws['!ref'])
        for (let r = 1; r <= range.e.r; r++) {
          const nombreCell = ws[XLSX.utils.encode_cell({ r, c: COL.NOMBRE })]
          if (!nombreCell || !String(nombreCell.v ?? '').trim()) continue
          const row = {}
          for (let c = 0; c <= range.e.c; c++) {
            const addr = XLSX.utils.encode_cell({ r, c })
            if (ws[addr]) row[c] = { ...ws[addr] }
          }
          existingRows.push(row)
        }
      }
    }
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: 'array' })
        if (!wb.SheetNames.includes(SHEET_NAME)) {
          reject(new Error(`El archivo no contiene la hoja "${SHEET_NAME}"`))
          return
        }
        if (existingRows.length > 0) {
          const ws = wb.Sheets[SHEET_NAME]
          let row = findAppendRow(ws)
          for (const rowData of existingRows) {
            for (const [colStr, cell] of Object.entries(rowData)) {
              ws[XLSX.utils.encode_cell({ r: row, c: Number(colStr) })] = cell
            }
            expandRef(ws, row)
            row++
          }
          buildResumen(wb)
        }
        await setWorkbook(XLSX.write(wb, { type: 'base64', bookType: 'xlsx' }))
        resolve(existingRows.length)
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = () => reject(new Error('Error al leer el archivo'))
    reader.readAsArrayBuffer(newFile)
  })
}

// Rebuild Hoja 1 without the specified patient IDs. More reliable than
// repeated single-row shifts because it never mis-shifts adjacent rows.
export async function bulkDeletePatients(patientIds) {
  const idSet = new Set(
    patientIds.filter(id => id != null).map(id => String(id).trim())
  )
  if (idSet.size === 0) return

  const b64 = await getWorkbook()
  if (!b64) throw new Error('No hay plantilla guardada')

  const wb = XLSX.read(b64, { type: 'base64' })
  const ws = wb.Sheets[SHEET_NAME]
  if (!ws || !ws['!ref']) return

  const range    = XLSX.utils.decode_range(ws['!ref'])
  const newWs    = {}
  let   writeRow = 0

  for (let r = 0; r <= range.e.r; r++) {
    if (r > 0) {
      const idCell = ws[XLSX.utils.encode_cell({ r, c: COL.ID })]
      const rowId  = idCell ? String(idCell.v ?? '').trim() : ''
      if (rowId && idSet.has(rowId)) continue

      const nombreCell = ws[XLSX.utils.encode_cell({ r, c: COL.NOMBRE })]
      if (!nombreCell || !String(nombreCell.v ?? '').trim()) continue
    }

    for (let c = 0; c <= range.e.c; c++) {
      const src = XLSX.utils.encode_cell({ r, c })
      if (ws[src]) newWs[XLSX.utils.encode_cell({ r: writeRow, c })] = { ...ws[src] }
    }
    writeRow++
  }

  if (ws['!cols'])   newWs['!cols']   = ws['!cols']
  if (ws['!rows'])   newWs['!rows']   = ws['!rows']
  if (ws['!merges']) newWs['!merges'] = ws['!merges']
  newWs['!ref'] = XLSX.utils.encode_range({
    s: { r: 0, c: 0 },
    e: { r: Math.max(0, writeRow - 1), c: range.e.c },
  })

  wb.Sheets[SHEET_NAME] = newWs
  buildResumen(wb)
  await setWorkbook(XLSX.write(wb, { type: 'base64', bookType: 'xlsx' }))
}

export async function updatePatient(rowIndex, fields) {
  const b64 = await getWorkbook()
  if (!b64) throw new Error('No hay plantilla guardada')

  const wb = XLSX.read(b64, { type: 'base64' })
  const ws = wb.Sheets[SHEET_NAME]
  if (!ws) throw new Error(`Hoja "${SHEET_NAME}" no encontrada`)

  const save = (col, val, isNumeric, fmt) => {
    if (val === undefined) return
    if (isNumeric && val !== '') {
      const n = Number(val)
      if (!isNaN(n)) setCell(ws, rowIndex, col, n, 'n', fmt)
    } else {
      setCell(ws, rowIndex, col, String(val), 's')
    }
  }

  save(COL.PROCEDIMIENTO, fields.procedimiento, false)
  save(COL.PRESUPUESTO,   fields.presupuesto,   true,  '"$"#,##0')
  save(COL.CLINICA,       fields.clinica,        false)
  save(COL.IMPLANTES,     fields.implantes,      false)
  save(COL.INSTRUM,       fields.instrum,        true)
  save(COL.TIEMPO,        fields.tiempo,         true)
  save(COL.FACTURA_DIAN,  fields.facturaDian,    true,  '"$"#,##0')

  buildResumen(wb)
  await setWorkbook(XLSX.write(wb, { type: 'base64', bookType: 'xlsx' }))
}

// ── Styled standalone export ──────────────────────────────────────────────────

const MONTHS_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const COLUMNS = [
  'Nombre', 'Fecha', 'ID', 'Edad', 'Teléfono', 'Dirección', 'E-mail',
  'Procedimiento', 'Presupuesto', 'Clínica', 'Implantes', 'Instrum',
  'Tiempo', 'Factura Dian', 'Profit', 'Profit Día', 'Profit Acumulado Mes'
];

const STYLE_MONTH_HEADER = {
  font: { bold: true, color: { rgb: 'FFFFFF' }, name: 'Arial', sz: 12 },
  fill: { fgColor: { rgb: '172137' } },
  alignment: { horizontal: 'left', vertical: 'center', indent: 1 },
  border: {
    top:    { style: 'thin', color: { rgb: '172137' } },
    bottom: { style: 'thin', color: { rgb: '172137' } },
  },
};

const STYLE_COL_HEADER = {
  font: { bold: true, color: { rgb: '172137' }, name: 'Arial', sz: 10 },
  fill: { fgColor: { rgb: 'E8EAEF' } },
  alignment: { horizontal: 'left', vertical: 'center' },
  border: { bottom: { style: 'thin', color: { rgb: '172137' } } },
};

const STYLE_DATA     = { font: { name: 'Arial', sz: 10 }, alignment: { vertical: 'center' } };
const STYLE_DATA_ALT = { ...STYLE_DATA, fill: { fgColor: { rgb: 'F7F8FA' } } };
const STYLE_NO_DATE  = {
  ...STYLE_MONTH_HEADER,
  fill: { fgColor: { rgb: '8A93A6' } },
};

function parseDateExport(v) {
  if (!v && v !== 0) return null;
  if (v instanceof Date) {
    return isNaN(v.getTime()) ? null : v;
  }
  if (typeof v === 'number') {
    if (v > 0 && v < 60000) {
      const utcDays = v - 25569;
      return new Date(utcDays * 86400 * 1000);
    }
    if (v > 1e10) {
      const d = new Date(v);
      return isNaN(d.getTime()) ? null : d;
    }
    return null;
  }
  if (typeof v === 'string') {
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

function sortByFecha(patients) {
  return [...patients].sort((a, b) => {
    const da = parseDateExport(a.fecha), db = parseDateExport(b.fecha);
    if (!da && !db) return 0;
    if (!da) return 1;
    if (!db) return -1;
    return da - db;
  });
}

function patientToRow(p) {
  const idRaw = p.id ?? '';
  const idVal = idRaw !== '' ? String(parseInt(idRaw) || idRaw) : '';
  return [
    p.nombre ?? '',
    parseDateExport(p.fecha) ?? '',
    idVal,
    p.edad !== undefined && p.edad !== null ? Number(p.edad) : '',
    p.telefono ? String(p.telefono) : '',
    p.direccion ?? '',
    p.email ?? '',
    p.procedimiento ?? '',
    p.presupuesto !== undefined && p.presupuesto !== null
      ? Number(p.presupuesto) : '',
    p.clinica ?? '',
    p.implantes ?? '',
    p.instrum !== undefined && p.instrum !== null
      ? Number(p.instrum) : '',
    p.tiempo !== undefined && p.tiempo !== null
      ? Number(p.tiempo) : '',
    p.facturaDian !== undefined && p.facturaDian !== null
      ? Number(p.facturaDian) : '',
    p.profit ?? '',
    p.profitDia ?? '',
    p.profitAcumuladoMes ?? '',
  ];
}

export function exportToXlsx(patients, filename = 'Pacientes_2026.xlsx') {
  const sorted = sortByFecha(patients);

  const buckets = new Map();
  const noDate = [];
  for (const p of sorted) {
    const d = parseDateExport(p.fecha);
    if (!d) { noDate.push(p); continue; }
    const m = d.getMonth();
    if (!buckets.has(m)) buckets.set(m, []);
    buckets.get(m).push(p);
  }

  const aoa = [];
  const styles = new Map();
  const merges = [];
  let r = 0;

  const pushMonthSection = (label, monthPatients, headerStyle = STYLE_MONTH_HEADER) => {
    aoa.push([label, ...Array(COLUMNS.length - 1).fill('')]);
    for (let c = 0; c < COLUMNS.length; c++) {
      styles.set(XLSX.utils.encode_cell({ r, c }), headerStyle);
    }
    merges.push({ s: { r, c: 0 }, e: { r, c: COLUMNS.length - 1 } });
    r++;

    aoa.push([...COLUMNS]);
    for (let c = 0; c < COLUMNS.length; c++) {
      styles.set(XLSX.utils.encode_cell({ r, c }), STYLE_COL_HEADER);
    }
    r++;

    monthPatients.forEach((p, i) => {
      aoa.push(patientToRow(p));
      const rowStyle = i % 2 === 0 ? STYLE_DATA : STYLE_DATA_ALT;
      for (let c = 0; c < COLUMNS.length; c++) {
        styles.set(XLSX.utils.encode_cell({ r, c }), rowStyle);
      }
      r++;
    });

    aoa.push([]);
    r++;
  };

  for (let m = 0; m < 12; m++) {
    if (!buckets.has(m)) continue;
    pushMonthSection(MONTHS_ES[m], buckets.get(m));
  }

  if (noDate.length) {
    pushMonthSection('Sin fecha asignada', noDate, STYLE_NO_DATE);
  }

  const ws = XLSX.utils.aoa_to_sheet(aoa);

  for (const [addr, s] of styles.entries()) {
    if (!ws[addr]) ws[addr] = { t: 's', v: '' };
    ws[addr].s = s;
  }

  for (let row = 0; row < r; row++) {
    const addr = XLSX.utils.encode_cell({ r: row, c: 1 });
    if (ws[addr] && ws[addr].v instanceof Date) {
      ws[addr].t = 'd';
      ws[addr].z = 'dd/mm/yyyy';
    }
  }

  ws['!merges'] = merges;
  ws['!cols'] = [
    { wch: 28 }, { wch: 12 }, { wch: 14 }, { wch: 6 },  { wch: 14 }, { wch: 28 },
    { wch: 28 }, { wch: 28 }, { wch: 14 }, { wch: 16 }, { wch: 18 }, { wch: 14 },
    { wch: 10 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 22 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Hoja 1');
  XLSX.writeFile(wb, filename);
}
