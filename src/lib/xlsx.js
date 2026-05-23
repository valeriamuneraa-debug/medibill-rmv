import * as XLSX from 'xlsx'

export function exportToExcel(patients, date) {
  const rows = patients.map((p, i) => ({
    '#': i + 1,
    Fecha: date,
    Nombre: p.name ?? '',
    Procedimiento: p.procedure ?? '',
    Valor: p.value ?? '',
    EPS: p.eps ?? '',
    Notas: p.notes ?? '',
  }))

  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Pacientes')

  const fileName = `MediBill_${date}.xlsx`
  XLSX.writeFile(wb, fileName)
  return fileName
}
