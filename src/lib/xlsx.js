import * as XLSX from 'xlsx'
import { getWorkbook, setWorkbook } from './indexedDB.js'

const SHEET_NAME = 'Hoja 1'
const RESUMEN_SHEET = 'Resumen'

const COL = {
  NOMBRE:       0,  // A
  FECHA:        1,  // B — Excel date serial
  ID:           2,  // C — numeric
  EDAD:         3,  // D — numeric
  TELEFONO:     4,  // E — string (preserve leading zeros)
  DIRECCION:    5,  // F
  EMAIL:        6,  // G
  PROCEDIMIENTO: 7, // H — empty
  PRESUPUESTO:  8,  // I — empty
  CLINICA:      9,  // J — empty
  IMPLANTES:   10,  // K — empty
  INSTRUM:     11,  // L — empty
  TIEMPO:      12,  // M — empty
  FACTURA_DIAN:13,  // N — empty
  PROFIT:      14,  // O — empty
  PROFIT_DIA:  15,  // P — empty
  PROFIT_MES:  16,  // Q — empty
  TIPO_DOC:    17,  // R
  GENERO:      18,  // S
}

function dateSerial(isoDate) {
  const [y, m, d] = isoDate.split('-').map(Number)
  return XLSX.utils.datenum(new Date(Date.UTC(y, m - 1, d)))
}

function findFirstEmptyRow(ws) {
  if (!ws['!ref']) return 1
  const range = XLSX.utils.decode_range(ws['!ref'])
  return range.e.r + 1
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

function buildResumen(wb) {
  const dataSheet = wb.Sheets[SHEET_NAME]
  if (!dataSheet || !dataSheet['!ref']) return

  const range = XLSX.utils.decode_range(dataSheet['!ref'])
  const totals = {}

  for (let r = 1; r <= range.e.r; r++) {
    const dateCell = dataSheet[XLSX.utils.encode_cell({ r, c: COL.FECHA })]
    const facturaCell = dataSheet[XLSX.utils.encode_cell({ r, c: COL.FACTURA_DIAN })]
    if (!dateCell || dateCell.v == null) continue

    const serial = dateCell.v
    const jsDate = new Date(Math.round((serial - 25569) * 86400000))
    const key = `${jsDate.getUTCFullYear()}-${String(jsDate.getUTCMonth() + 1).padStart(2, '0')}`

    const amount = (facturaCell && typeof facturaCell.v === 'number') ? facturaCell.v : 0
    totals[key] = (totals[key] ?? 0) + amount
  }

  const ws = XLSX.utils.aoa_to_sheet([['Mes', 'Total Factura Dian']])
  const months = Object.keys(totals).sort()
  months.forEach((month, i) => {
    const addr1 = XLSX.utils.encode_cell({ r: i + 1, c: 0 })
    const addr2 = XLSX.utils.encode_cell({ r: i + 1, c: 1 })
    ws[addr1] = { v: month, t: 's' }
    ws[addr2] = { v: totals[month], t: 'n', z: '#,##0' }
  })
  ws['!ref'] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: Math.max(months.length, 1), c: 1 } })

  if (wb.SheetNames.includes(RESUMEN_SHEET)) {
    wb.Sheets[RESUMEN_SHEET] = ws
  } else {
    XLSX.utils.book_append_sheet(wb, ws, RESUMEN_SHEET)
  }
}

export async function storeUploadedWorkbook(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const data = e.target.result
        const wb = XLSX.read(data, { type: 'array' })
        if (!wb.SheetNames.includes(SHEET_NAME)) {
          reject(new Error(`El archivo no contiene la hoja "${SHEET_NAME}"`))
          return
        }
        const b64 = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' })
        await setWorkbook(b64)
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

  const ws = wb.Sheets[SHEET_NAME]
  const row = findFirstEmptyRow(ws)

  setCell(ws, row, COL.NOMBRE,       patient.nombre ?? '',                     's')
  setCell(ws, row, COL.FECHA,        dateSerial(dateStr),                      'n', 'dd/mm/yyyy')
  setCell(ws, row, COL.ID,           parseInt(patient.id, 10) || 0,            'n')
  setCell(ws, row, COL.EDAD,         parseInt(patient.edad, 10) || 0,          'n')
  setCell(ws, row, COL.TELEFONO,     String(patient.telefono ?? ''),            's')
  setCell(ws, row, COL.DIRECCION,    patient.direccion ?? '',                   's')
  setCell(ws, row, COL.EMAIL,        patient.email ?? '',                       's')
  setCell(ws, row, COL.PROCEDIMIENTO, '',                                       's')
  setCell(ws, row, COL.PRESUPUESTO,  '',                                        's')
  setCell(ws, row, COL.CLINICA,      '',                                        's')
  setCell(ws, row, COL.IMPLANTES,    '',                                        's')
  setCell(ws, row, COL.INSTRUM,      '',                                        's')
  setCell(ws, row, COL.TIEMPO,       '',                                        's')
  setCell(ws, row, COL.FACTURA_DIAN, '',                                        's')
  setCell(ws, row, COL.PROFIT,       '',                                        's')
  setCell(ws, row, COL.PROFIT_DIA,   '',                                        's')
  setCell(ws, row, COL.PROFIT_MES,   '',                                        's')
  setCell(ws, row, COL.TIPO_DOC,     'Cédula de ciudadanía',                   's')
  setCell(ws, row, COL.GENERO,       'Femenino',                                's')

  expandRef(ws, row)
  buildResumen(wb)

  const updated = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' })
  await setWorkbook(updated)
}

export async function downloadWorkbook(dateStr) {
  const b64 = await getWorkbook()
  if (!b64) throw new Error('No hay plantilla guardada')

  const wb = XLSX.read(b64, { type: 'base64' })
  const fileName = `MediBill_${dateStr}.xlsx`
  XLSX.writeFile(wb, fileName)
  return fileName
}
