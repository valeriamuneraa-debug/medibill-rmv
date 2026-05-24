import * as XLSX from 'xlsx'
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
  PROCEDIMIENTO: 7,  // H — empty
  PRESUPUESTO:   8,  // I — empty
  CLINICA:       9,  // J — empty
  IMPLANTES:    10,  // K — empty
  INSTRUM:      11,  // L — empty
  TIEMPO:       12,  // M — empty
  FACTURA_DIAN: 13,  // N — empty (filled manually in Excel later)
  PROFIT:       14,  // O — empty
  PROFIT_DIA:   15,  // P — empty
  PROFIT_MES:   16,  // Q — empty
  TIPO_DOC:     17,  // R
  GENERO:       18,  // S
}

const MONTH_NAMES = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre',
]

function dateSerial(isoDate) {
  const [y, m, d] = isoDate.split('-').map(Number)
  return XLSX.utils.datenum(new Date(Date.UTC(y, m - 1, d)))
}

// Scan column A downward to find the row after the last non-empty Nombre cell.
// This is safer than using range.e.r which may include formatted-but-empty rows.
function findAppendRow(ws) {
  if (!ws['!ref']) return 1
  const range = XLSX.utils.decode_range(ws['!ref'])
  let lastDataRow = 0
  for (let r = 0; r <= range.e.r; r++) {
    const cell = ws[XLSX.utils.encode_cell({ r, c: COL.NOMBRE })]
    if (cell && cell.v != null && String(cell.v).trim() !== '') {
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

// Regenerate Resumen sheet: 3 columns, 12 fixed rows (Enero–Diciembre 2026).
// Writes SUMIFS/COUNTIFS formulas plus cached JS-computed values so the sheet
// is immediately readable and auto-updates when Factura Dian is filled manually.
function buildResumen(wb) {
  const dataSheet = wb.Sheets[SHEET_NAME]

  // Pre-compute cached values from current workbook data
  const totals = new Array(12).fill(0)
  const counts = new Array(12).fill(0)

  if (dataSheet && dataSheet['!ref']) {
    const range = XLSX.utils.decode_range(dataSheet['!ref'])
    for (let r = 1; r <= range.e.r; r++) {
      const nombreCell = dataSheet[XLSX.utils.encode_cell({ r, c: COL.NOMBRE })]
      const dateCell   = dataSheet[XLSX.utils.encode_cell({ r, c: COL.FECHA })]
      if (!nombreCell || !String(nombreCell.v ?? '').trim()) continue
      if (!dateCell   || dateCell.v == null) continue

      const jsDate = new Date(Math.round((Number(dateCell.v) - 25569) * 86400000))
      if (jsDate.getUTCFullYear() !== 2026) continue

      const mi = jsDate.getUTCMonth()
      counts[mi]++
      const facturaCell = dataSheet[XLSX.utils.encode_cell({ r, c: COL.FACTURA_DIAN })]
      if (facturaCell && typeof facturaCell.v === 'number') totals[mi] += facturaCell.v
    }
  }

  const ws = {}

  // Header row (row 1)
  ws['A1'] = { v: 'Mes',                  t: 's' }
  ws['B1'] = { v: 'Total Factura Dian',   t: 's' }
  ws['C1'] = { v: 'Número de pacientes',  t: 's' }

  // One row per month (rows 2–13)
  for (let m = 1; m <= 12; m++) {
    const row     = m + 1
    const nextM   = m === 12 ? 1  : m + 1
    const nextY   = m === 12 ? 2027 : 2026
    const mi      = m - 1

    ws[`A${row}`] = { v: MONTH_NAMES[mi], t: 's' }

    // SUMIFS: sum Factura Dian (col N) where Fecha (col B) falls in this month of 2026
    ws[`B${row}`] = {
      v: totals[mi],
      t: 'n',
      f: `SUMIFS('Hoja 1'!$N$2:$N$5000,'Hoja 1'!$B$2:$B$5000,">="&DATE(2026,${m},1),'Hoja 1'!$B$2:$B$5000,"<"&DATE(${nextY},${nextM},1))`,
      z: '"$"#,##0',
    }

    // COUNTIFS: count rows where Fecha is in month AND Nombre is non-empty
    ws[`C${row}`] = {
      v: counts[mi],
      t: 'n',
      f: `COUNTIFS('Hoja 1'!$B$2:$B$5000,">="&DATE(2026,${m},1),'Hoja 1'!$B$2:$B$5000,"<"&DATE(${nextY},${nextM},1),'Hoja 1'!$A$2:$A$5000,"<>")`,
    }
  }

  ws['!ref'] = 'A1:C13'

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

  setCell(ws, row, COL.NOMBRE,        patient.nombre   ?? '',                  's')
  setCell(ws, row, COL.FECHA,         dateSerial(dateStr),                     'n', 'dd/mm/yyyy')
  setCell(ws, row, COL.ID,            parseInt(patient.id,    10) || 0,        'n')
  setCell(ws, row, COL.EDAD,          parseInt(patient.edad,  10) || 0,        'n')
  setCell(ws, row, COL.TELEFONO,      String(patient.telefono ?? ''),           's')
  setCell(ws, row, COL.DIRECCION,     patient.direccion ?? '',                  's')
  setCell(ws, row, COL.EMAIL,         patient.email     ?? '',                  's')
  setCell(ws, row, COL.PROCEDIMIENTO, '',                                        's')
  setCell(ws, row, COL.PRESUPUESTO,   '',                                        's')
  setCell(ws, row, COL.CLINICA,       '',                                        's')
  setCell(ws, row, COL.IMPLANTES,     '',                                        's')
  setCell(ws, row, COL.INSTRUM,       '',                                        's')
  setCell(ws, row, COL.TIEMPO,        '',                                        's')
  setCell(ws, row, COL.FACTURA_DIAN,  '',                                        's')
  setCell(ws, row, COL.PROFIT,        '',                                        's')
  setCell(ws, row, COL.PROFIT_DIA,    '',                                        's')
  setCell(ws, row, COL.PROFIT_MES,    '',                                        's')
  setCell(ws, row, COL.TIPO_DOC,      'Cédula de ciudadanía',                   's')
  setCell(ws, row, COL.GENERO,        'Femenino',                                's')

  expandRef(ws, row)
  buildResumen(wb)

  await setWorkbook(XLSX.write(wb, { type: 'base64', bookType: 'xlsx' }))
}

export async function downloadWorkbook(dateStr) {
  const b64 = await getWorkbook()
  if (!b64) throw new Error('No hay plantilla guardada')

  const wb = XLSX.read(b64, { type: 'base64' })
  const [y, m, d] = dateStr.split('-')
  XLSX.writeFile(wb, `Pacientes_2026_${d}-${m}-${y}.xlsx`)
}
