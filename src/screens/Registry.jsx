import { useEffect, useRef, useState } from 'react'
import { readPatients, bulkDeletePatients } from '../lib/xlsx.js'

const EXTENSION_ID = 'ojjbjnbminciinjlfmgmggccjebafjap'

async function sendToEmision(patientData) {
  if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
    return new Promise((resolve) => {
      try {
        chrome.runtime.sendMessage(
          EXTENSION_ID,
          { type: 'ADD_TO_QUEUE', patient: patientData },
          (response) => {
            if (chrome.runtime.lastError || !response?.ok) {
              navigator.clipboard.writeText(JSON.stringify(patientData, null, 2))
                .then(() => resolve('copied')).catch(() => resolve('error'))
            } else { resolve('sent') }
          }
        )
      } catch {
        navigator.clipboard.writeText(JSON.stringify(patientData, null, 2))
          .then(() => resolve('copied')).catch(() => resolve('error'))
      }
    })
  }
  try {
    await navigator.clipboard.writeText(JSON.stringify(patientData, null, 2))
    return 'copied'
  } catch { return 'error' }
}

const EMISION_TOAST = {
  sent:   { text: 'Enviado a la cola de emisión', tone: 'success' },
  copied: { text: 'Extensión no detectada — datos copiados, pégalos en e-Misión', tone: 'attention' },
  error:  { text: 'No se pudo enviar — verifica la extensión', tone: 'attention' },
}

async function sendBatchToEmision(allPatients) {
  if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
    return new Promise((resolve) => {
      try {
        chrome.runtime.sendMessage(
          EXTENSION_ID,
          { type: 'ADD_BATCH_TO_QUEUE', patients: allPatients },
          (response) => {
            if (chrome.runtime.lastError || !response?.ok) { resolve('error') } else { resolve('sent') }
          }
        )
      } catch { resolve('error') }
    })
  }
  return 'error'
}

function serialToDateStr(serial) {
  if (!serial || typeof serial !== 'number') return '—'
  const d = new Date(Math.round((serial - 25569) * 86400000))
  const months = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic']
  return `${d.getUTCDate()} ${months[d.getUTCMonth()]}`
}

function formatPeso(v) {
  if (v == null || v === '') return '—'
  const n = Number(v)
  if (isNaN(n)) return '—'
  return '$' + n.toLocaleString('es-CO')
}

function toEmisionPayload(p) {
  return {
    nombre:    p.nombre    ?? '',
    id:        p.id != null ? String(p.id) : '',
    edad:      p.edad != null ? String(p.edad) : '',
    telefono:  p.telefono  ?? '',
    direccion: p.direccion ?? '',
    email:     p.email     ?? '',
    tipoDoc:   p.tipoDoc   ?? 'Cédula de ciudadanía',
    genero:    p.genero    ?? 'Femenino',
    fecha:     '',
  }
}

function ExportIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M3 12v2a1 1 0 001 1h10a1 1 0 001-1v-2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M9 3v8M6 8l3 3 3-3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function Checkbox({ checked }) {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
      <circle
        cx="11" cy="11" r="10"
        stroke={checked ? '#ffffff' : 'rgba(255,255,255,0.38)'}
        strokeWidth="1.5"
        fill={checked ? '#ffffff' : 'transparent'}
        style={{ transition: 'fill 150ms ease, stroke 150ms ease' }}
      />
      {checked && (
        <path
          d="M7 11.5l3 3 5-5.5"
          stroke="#172137"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  )
}

const TH = ({ children, width, right }) => (
  <th style={{
    padding: '10px 12px',
    textAlign: right ? 'right' : 'left',
    fontSize: '11px',
    fontWeight: 600,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.5)',
    whiteSpace: 'nowrap',
    width,
    background: '#172137',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
    position: 'sticky',
    top: 0,
    zIndex: 1,
  }}>
    {children}
  </th>
)

export default function Registry({ onBack, onEditPatient, onExport, exporting, onDelete }) {
  const [patients, setPatients]         = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting]         = useState(false)
  const [emisionToast, setEmisionToast] = useState(null)
  const [bulkConfirm, setBulkConfirm]   = useState(false)
  const [bulkSending, setBulkSending]   = useState(false)

  // Selection mode
  const [selectionMode, setSelectionMode]       = useState(false)
  const [selectedIds, setSelectedIds]           = useState(new Set())
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false)
  const [bulkDeleting, setBulkDeleting]         = useState(false)
  const [bulkEmitting, setBulkEmitting]         = useState(false)
  const [searchQuery, setSearchQuery]           = useState('')

  // Long-press (touch) selection entry
  const longPressTimer = useRef(null)
  const longPressFired = useRef(false)

  useEffect(() => {
    if (!emisionToast) return
    const delay = emisionToast.tone === 'attention' ? 6000 : 3500
    const t = setTimeout(() => setEmisionToast(null), delay)
    return () => clearTimeout(t)
  }, [emisionToast])

  useEffect(() => {
    readPatients()
      .then(rows => setPatients(
        rows.filter(p => p.nombre && p.nombre.trim() !== '' && p.nombre !== 'Nombre')
      ))
      .catch(() => setPatients([]))
  }, [])

  // ── Selection mode ────────────────────────────────────────────────────────

  function enterSelectionMode(patient) {
    setSelectionMode(true)
    setSelectedIds(new Set([patient._row]))
  }

  function exitSelectionMode() {
    setSelectionMode(false)
    setSelectedIds(new Set())
    setBulkDeleteConfirm(false)
  }

  function toggleSelect(patient) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(patient._row)) { next.delete(patient._row) } else { next.add(patient._row) }
      return next
    })
  }

  const allSelected = !!(patients?.length > 0 && selectedIds.size === patients.length)

  function toggleSelectAll() {
    if (allSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(patients.map(p => p._row)))
    }
  }

  function handleRowClick(patient) {
    if (longPressFired.current) {
      longPressFired.current = false
      return
    }
    if (selectionMode) {
      toggleSelect(patient)
    } else {
      onEditPatient(patient)
    }
  }

  // ── Long-press (touch) selection entry ────────────────────────────────────

  function handleRowTouchStart(patient) {
    longPressFired.current = false
    clearTimeout(longPressTimer.current)
    longPressTimer.current = setTimeout(() => {
      longPressFired.current = true
      if (!selectionMode) enterSelectionMode(patient)
    }, 500)
  }

  function handleRowTouchMove() {
    clearTimeout(longPressTimer.current)
  }

  function handleRowTouchEnd() {
    clearTimeout(longPressTimer.current)
  }

  // ── Individual delete (context-menu / desktop) ────────────────────────────

  async function handleDelete() {
    if (deleting || !deleteTarget) return
    setDeleting(true)
    try { await onDelete(deleteTarget.id) }
    finally { setDeleting(false); setDeleteTarget(null) }
  }

  // ── Per-row emisión ───────────────────────────────────────────────────────

  async function handleEmision(e, patient) {
    e.stopPropagation()
    const result = await sendToEmision(toEmisionPayload(patient))
    setEmisionToast(EMISION_TOAST[result])
  }

  // ── Bulk send (all patients, from normal-mode footer) ─────────────────────

  async function handleBulkEmision() {
    const targets = searchQuery.trim()
      ? patients.filter(p => p.nombre?.toLowerCase().includes(searchQuery.toLowerCase()))
      : patients
    if (!targets?.length || bulkSending) return
    setBulkSending(true)
    setBulkConfirm(false)
    try {
      const result = await sendBatchToEmision(targets.map(toEmisionPayload))
      const n = targets.length
      setEmisionToast(
        result === 'sent'
          ? { text: `${n} paciente${n !== 1 ? 's' : ''} enviado${n !== 1 ? 's' : ''} a la cola`, tone: 'success' }
          : EMISION_TOAST.error
      )
    } finally {
      setBulkSending(false)
    }
  }

  // ── Bulk emisión (selected, from selection-mode action bar) ───────────────

  async function handleBulkEmisionSelected() {
    if (!selectedIds.size || bulkEmitting) return
    setBulkEmitting(true)
    try {
      const sel = patients.filter(p => selectedIds.has(p._row))
      const result = await sendBatchToEmision(sel.map(toEmisionPayload))
      const n = sel.length
      setEmisionToast(
        result === 'sent'
          ? { text: `${n} paciente${n !== 1 ? 's' : ''} enviado${n !== 1 ? 's' : ''} a emisión`, tone: 'success' }
          : EMISION_TOAST.error
      )
      exitSelectionMode()
    } finally {
      setBulkEmitting(false)
    }
  }

  // ── Bulk delete ───────────────────────────────────────────────────────────

  async function handleBulkDelete() {
    if (!selectedIds.size || bulkDeleting) return
    setBulkDeleting(true)
    setBulkDeleteConfirm(false)
    try {
      const sel = patients.filter(p => selectedIds.has(p._row))
      const ids = sel.map(p => p.id).filter(id => id != null)
      await bulkDeletePatients(ids)
      const n = sel.length
      const updated = await readPatients()
      setPatients(updated.filter(p => p.nombre && p.nombre.trim() !== '' && p.nombre !== 'Nombre'))
      setEmisionToast({ text: `${n} paciente${n !== 1 ? 's' : ''} eliminado${n !== 1 ? 's' : ''}`, tone: 'success' })
      exitSelectionMode()
    } finally {
      setBulkDeleting(false)
    }
  }

  // ── Row press feedback ────────────────────────────────────────────────────

  const rowPress   = (e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }
  const rowRelease = (e) => {
    const row = e.currentTarget
    // Keep selected highlight if in selection mode and this row is selected
    const rowKey = Number(row.dataset.rowKey)
    if (selectionMode && selectedIds.has(rowKey)) {
      row.style.background = 'rgba(255,255,255,0.08)'
    } else {
      row.style.background = 'transparent'
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const selectedCount = selectedIds.size
  const filtered = patients
    ? (searchQuery.trim()
        ? patients.filter(p => p.nombre?.toLowerCase().includes(searchQuery.toLowerCase()))
        : patients)
    : null

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100dvh',
        overflow: 'hidden',
        background: '#172137',
        fontFamily: 'Outfit, sans-serif',
        color: '#ffffff',
      }}
    >
      {/* ── Header ── */}
      <header style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px 20px 12px', flexShrink: 0, minHeight: '72px' }}>
        {selectionMode ? (
          <>
            {/* Cancel */}
            <button
              onClick={exitSelectionMode}
              aria-label="Cancelar selección"
              style={{
                fontFamily: 'Outfit, sans-serif',
                fontSize: '15px',
                fontWeight: 500,
                color: 'rgba(255,255,255,0.75)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '8px 16px',
                minHeight: '44px',
                position: 'absolute',
                left: 0,
                touchAction: 'manipulation',
                transition: 'color 150ms ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#ffffff' }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.75)' }}
            >
              ✕ Cancelar
            </button>

            {/* Count */}
            <div
              role="status"
              aria-live="polite"
              aria-atomic="true"
              style={{ textAlign: 'center', fontSize: '16px', fontWeight: 600, letterSpacing: '0.01em' }}
            >
              {selectedCount} seleccionado{selectedCount !== 1 ? 's' : ''}
            </div>

            {/* Select all toggle */}
            <button
              onClick={toggleSelectAll}
              style={{
                fontFamily: 'Outfit, sans-serif',
                fontSize: '13px',
                fontWeight: 500,
                color: 'rgba(255,255,255,0.65)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '8px 16px',
                minHeight: '44px',
                position: 'absolute',
                right: 0,
                touchAction: 'manipulation',
                transition: 'color 150ms ease',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#ffffff' }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.65)' }}
            >
              {allSelected ? 'Deseleccionar todo' : 'Seleccionar todo'}
            </button>
          </>
        ) : (
          <>
            {/* Back */}
            <button
              onClick={onBack}
              aria-label="Volver"
              style={{
                fontFamily: 'Outfit, sans-serif',
                fontSize: '22px',
                color: '#ffffff',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                width: '44px',
                minHeight: '64px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
                opacity: 0.8,
                position: 'absolute',
                left: '12px',
                touchAction: 'manipulation',
                transition: 'opacity 150ms ease, transform 100ms ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = '1' }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.8'; e.currentTarget.style.transform = 'scale(1)' }}
              onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.9)' }}
              onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
              onTouchStart={(e) => { e.currentTarget.style.transform = 'scale(0.9)' }}
              onTouchEnd={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
            >
              ←
            </button>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
              <span
                style={{
                  fontSize: 'clamp(26px, 8vw, 38px)',
                  fontWeight: 700,
                  letterSpacing: '0.22em',
                  lineHeight: 1,
                  userSelect: 'none',
                }}
                aria-label="Iniciales: R M V"
              >
                RMV
              </span>
              <span style={{ fontSize: '12px', fontWeight: 400, letterSpacing: '0.04em', color: 'rgba(255,255,255,0.45)' }}>
                Registro de pacientes
              </span>
            </div>

            <button
              onClick={() => setSelectionMode(true)}
              style={{
                fontFamily: 'Outfit, sans-serif',
                fontSize: '13px',
                fontWeight: 500,
                color: 'rgba(255,255,255,0.75)',
                background: 'none',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: '8px',
                padding: '7px 12px',
                minHeight: '36px',
                cursor: 'pointer',
                touchAction: 'manipulation',
                transition: 'color 150ms ease, border-color 150ms ease',
                letterSpacing: '0.01em',
                position: 'absolute',
                right: '16px',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#ffffff'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.65)' }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.75)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)' }}
            >
              Seleccionar
            </button>
          </>
        )}
      </header>

      {/* ── Hint text (static below header, outside scroll) ── */}
      {patients && patients.length > 0 && (
        <p style={{
          flexShrink: 0,
          fontSize: '12px',
          color: 'rgba(255,255,255,0.5)',
          textAlign: 'center',
          margin: 0,
          padding: '4px 16px 10px',
          letterSpacing: '0.01em',
          background: '#172137',
        }}>
          {selectionMode
            ? 'Toca filas para seleccionar o deseleccionar'
            : 'Mantén presionado para seleccionar varios'}
        </p>
      )}

      {/* ── Search bar ── */}
      {patients && patients.length > 0 && !selectionMode && (
        <div style={{ flexShrink: 0, padding: '0 16px 8px', background: '#172137' }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <svg
              width="16" height="16" viewBox="0 0 16 16" fill="none"
              aria-hidden="true"
              style={{ position: 'absolute', left: '12px', pointerEvents: 'none' }}
            >
              <circle cx="6.5" cy="6.5" r="5" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
              <path d="M11 11L14.5 14.5" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <input
              type="search"
              className="search-input"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre..."
              aria-label="Buscar por nombre"
              autoComplete="off"
              style={{
                width: '100%',
                height: '40px',
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '8px',
                color: '#ffffff',
                fontSize: '15px',
                fontFamily: 'Outfit, sans-serif',
                padding: '0 36px 0 38px',
                outline: 'none',
                touchAction: 'manipulation',
              }}
              onFocus={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)' }}
              onBlur={e => { e.currentTarget.style.borderColor = searchQuery ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.15)' }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                aria-label="Limpiar búsqueda"
                style={{
                  position: 'absolute',
                  right: '8px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  minHeight: '32px',
                  minWidth: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  touchAction: 'manipulation',
                }}
              >
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
                  <path d="M1 1l11 11M12 1L1 12" stroke="rgba(255,255,255,0.55)" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </button>
            )}
          </div>
          {searchQuery.trim() ? (
            <p style={{
              fontSize: '12px',
              color: 'rgba(255,255,255,0.4)',
              margin: '6px 0 0',
              textAlign: 'center',
              fontFamily: 'Outfit, sans-serif',
              letterSpacing: '0.01em',
            }}>
              {filtered.length} paciente{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}
            </p>
          ) : (
            <p style={{
              fontSize: '13px',
              color: 'rgba(255,255,255,0.5)',
              margin: '6px 0 0',
              textAlign: 'center',
              fontFamily: 'Outfit, sans-serif',
              letterSpacing: '0.01em',
            }}>
              {patients.length} paciente{patients.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      )}

      {/* ── Scrollable rows ── */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {patients === null ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 24px' }}>
            <div
              className="animate-spin"
              style={{
                width: '32px',
                height: '32px',
                border: '2.5px solid rgba(255,255,255,0.2)',
                borderTopColor: '#ffffff',
                borderRadius: '50%',
              }}
              aria-label="Cargando registro"
            />
          </div>
        ) : patients.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '80px 32px',
            gap: '12px',
            textAlign: 'center',
          }}>
            <p style={{ fontSize: '18px', fontWeight: 500, color: 'rgba(255,255,255,0.7)', margin: 0 }}>
              Aún no hay pacientes
            </p>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.35)', margin: 0, lineHeight: 1.6 }}>
              Los pacientes que apruebes aparecerán aquí.
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '80px 32px',
            gap: '12px',
            textAlign: 'center',
          }}>
            <p style={{ fontSize: '18px', fontWeight: 500, color: 'rgba(255,255,255,0.7)', margin: 0 }}>
              Sin resultados
            </p>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.35)', margin: 0, lineHeight: 1.6 }}>
              No se encontraron pacientes con ese nombre.
            </p>
          </div>
        ) : (
          <>
              <table style={{
                borderCollapse: 'collapse',
                width: '100%',
                minWidth: selectionMode ? '640px' : '740px',
              }}>
                <thead>
                  <tr>
                    {selectionMode && <TH width="44px" />}
                    <TH width="150px">Nombre</TH>
                    <TH width="72px">Fecha</TH>
                    <TH width="120px">Procedimiento</TH>
                    <TH width="140px" right>Factura Dian</TH>
                    <TH width="140px" right>Presupuesto</TH>
                    {!selectionMode && <TH width="28px" />}
                    {!selectionMode && <TH width="88px" />}
                  </tr>
                </thead>
                <tbody>
                  <tr aria-hidden="true"><td colSpan={100} style={{ height: '10px', padding: 0, border: 'none' }} /></tr>
                  {filtered.map((p) => {
                    const isSelected = selectedIds.has(p._row)
                    return (
                      <tr
                        key={p._row}
                        data-row-key={p._row}
                        onClick={() => handleRowClick(p)}
                        onContextMenu={(e) => {
                          e.preventDefault()
                          if (!selectionMode) setDeleteTarget(p)
                        }}
                        onTouchStart={() => handleRowTouchStart(p)}
                        onTouchMove={handleRowTouchMove}
                        onTouchEnd={handleRowTouchEnd}
                        style={{
                          cursor: 'pointer',
                          background: isSelected ? 'rgba(255,255,255,0.08)' : 'transparent',
                          transition: 'background 120ms ease',
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = isSelected ? 'rgba(255,255,255,0.08)' : 'transparent'
                        }}
                        onMouseDown={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)' }}
                        onMouseUp={(e) => {
                          e.currentTarget.style.background = isSelected ? 'rgba(255,255,255,0.08)' : 'transparent'
                        }}
                      >
                        {/* Checkbox cell (selection mode only) */}
                        {selectionMode && (
                          <td style={{
                            padding: '0 4px 0 12px',
                            borderBottom: '1px solid rgba(255,255,255,0.07)',
                            verticalAlign: 'middle',
                          }}>
                            <div
                              style={{
                                width: '44px',
                                height: '48px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                              role="checkbox"
                              aria-checked={isSelected}
                              aria-label={`Seleccionar a ${p.nombre || 'paciente'}`}
                            >
                              <Checkbox checked={isSelected} />
                            </div>
                          </td>
                        )}

                        <td style={{
                          padding: '14px 12px',
                          fontSize: '15px',
                          fontWeight: 500,
                          borderBottom: '1px solid rgba(255,255,255,0.07)',
                          maxWidth: '150px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}>
                          {p.nombre || '—'}
                        </td>
                        <td style={{
                          padding: '14px 12px',
                          fontSize: '13px',
                          color: 'rgba(255,255,255,0.6)',
                          borderBottom: '1px solid rgba(255,255,255,0.07)',
                          whiteSpace: 'nowrap',
                        }}>
                          {serialToDateStr(p.fecha)}
                        </td>
                        <td style={{
                          padding: '14px 12px',
                          fontSize: '13px',
                          color: p.procedimiento ? '#ffffff' : 'rgba(255,255,255,0.25)',
                          borderBottom: '1px solid rgba(255,255,255,0.07)',
                          maxWidth: '120px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}>
                          {p.procedimiento || '—'}
                        </td>
                        <td style={{
                          padding: '14px 12px',
                          fontSize: '13px',
                          textAlign: 'right',
                          fontVariantNumeric: 'tabular-nums',
                          color: p.facturaDian != null ? '#ffffff' : 'rgba(255,255,255,0.25)',
                          borderBottom: '1px solid rgba(255,255,255,0.07)',
                          whiteSpace: 'nowrap',
                        }}>
                          {formatPeso(p.facturaDian)}
                        </td>
                        <td style={{
                          padding: '14px 12px',
                          fontSize: '13px',
                          textAlign: 'right',
                          fontVariantNumeric: 'tabular-nums',
                          color: p.presupuesto != null ? '#ffffff' : 'rgba(255,255,255,0.25)',
                          borderBottom: '1px solid rgba(255,255,255,0.07)',
                          whiteSpace: 'nowrap',
                        }}>
                          {formatPeso(p.presupuesto)}
                        </td>

                        {/* Chevron (normal mode only) */}
                        {!selectionMode && (
                          <td style={{
                            padding: '14px 8px 14px 4px',
                            fontSize: '16px',
                            color: 'rgba(255,255,255,0.28)',
                            borderBottom: '1px solid rgba(255,255,255,0.07)',
                            whiteSpace: 'nowrap',
                            userSelect: 'none',
                          }}>
                            ›
                          </td>
                        )}

                        {/* Emisión button (normal mode only) */}
                        {!selectionMode && (
                          <td
                            style={{
                              padding: '8px 10px',
                              borderBottom: '1px solid rgba(255,255,255,0.07)',
                              whiteSpace: 'nowrap',
                            }}
                            onClick={(e) => e.stopPropagation()}
                            onTouchStart={(e) => e.stopPropagation()}
                            onContextMenu={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={(e) => handleEmision(e, p)}
                              style={{
                                fontFamily: 'Outfit, sans-serif',
                                fontSize: '11px',
                                fontWeight: 500,
                                color: 'rgba(255,255,255,0.65)',
                                background: 'none',
                                border: '1px solid rgba(255,255,255,0.2)',
                                borderRadius: '8px',
                                padding: '6px 10px',
                                minHeight: '36px',
                                cursor: 'pointer',
                                touchAction: 'manipulation',
                                whiteSpace: 'nowrap',
                                letterSpacing: '0.02em',
                                transition: 'border-color 150ms ease, color 150ms ease',
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.45)'; e.currentTarget.style.color = '#ffffff' }}
                              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.color = 'rgba(255,255,255,0.65)' }}
                            >
                              → Emisión
                            </button>
                          </td>
                        )}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
          </>
        )}
      </div>

      {/* ── Normal-mode footer ── */}
      {!selectionMode && patients && patients.length > 0 && (
        <footer style={{
          flexShrink: 0,
          padding: '16px 24px 32px',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          background: '#172137',
        }}>
          {/* Bulk send to emisión */}
          {!bulkConfirm ? (
            <button
              onClick={() => setBulkConfirm(true)}
              disabled={bulkSending}
              style={{
                fontFamily: 'Outfit, sans-serif',
                fontSize: '14px',
                fontWeight: 500,
                color: bulkSending ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.55)',
                background: 'none',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '10px',
                padding: '13px 16px',
                width: '100%',
                minHeight: '48px',
                cursor: bulkSending ? 'default' : 'pointer',
                touchAction: 'manipulation',
                transition: 'color 150ms ease, border-color 150ms ease, transform 100ms ease',
                letterSpacing: '0.01em',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginBottom: '10px',
              }}
              onMouseEnter={(e) => { if (!bulkSending) { e.currentTarget.style.color = 'rgba(255,255,255,0.8)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)' } }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.55)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)' }}
              onMouseDown={(e) => { if (!bulkSending) e.currentTarget.style.transform = 'scale(0.98)' }}
              onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
              onTouchStart={(e) => { if (!bulkSending) e.currentTarget.style.transform = 'scale(0.98)' }}
              onTouchEnd={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
            >
              {bulkSending ? (
                <>
                  <div
                    className="animate-spin"
                    style={{ width: '14px', height: '14px', border: '1.5px solid rgba(255,255,255,0.2)', borderTopColor: 'rgba(255,255,255,0.5)', borderRadius: '50%', flexShrink: 0 }}
                    aria-hidden="true"
                  />
                  Enviando...
                </>
              ) : (
                (searchQuery.trim()
                  ? `Enviar resultados a emisión (${filtered.length})`
                  : `Enviar todos a emisión (${filtered.length})`)
              )}
            </button>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0', marginBottom: '10px' }}>
              <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '13px', color: 'rgba(255,255,255,0.48)', flex: 1, lineHeight: 1.4 }}>
                {searchQuery.trim()
                  ? `¿Enviar los ${filtered.length} resultado${filtered.length !== 1 ? 's' : ''} a la cola?`
                  : `¿Enviar ${filtered.length} paciente${filtered.length !== 1 ? 's' : ''} a la cola?`}
              </span>
              <button
                onClick={handleBulkEmision}
                style={{
                  fontFamily: 'Outfit, sans-serif', fontSize: '13px', fontWeight: 500,
                  color: 'rgba(255,255,255,0.65)', background: 'rgba(255,255,255,0.1)',
                  border: 'none', borderRadius: '8px', padding: '9px 14px',
                  minHeight: '36px', cursor: 'pointer', flexShrink: 0,
                  transition: 'background 120ms ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.16)' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)' }}
              >
                Sí, enviar
              </button>
              <button
                onClick={() => setBulkConfirm(false)}
                style={{
                  fontFamily: 'Outfit, sans-serif', fontSize: '13px', fontWeight: 600,
                  color: '#172137', background: '#ffffff', border: 'none',
                  borderRadius: '8px', padding: '9px 14px',
                  minHeight: '36px', cursor: 'pointer', flexShrink: 0,
                }}
              >
                Cancelar
              </button>
            </div>
          )}

          {/* Export */}
          <button
            onClick={onExport}
            disabled={exporting}
            aria-disabled={exporting}
            aria-busy={exporting}
            style={{
              fontFamily: 'Outfit, sans-serif',
              fontSize: '17px',
              fontWeight: 500,
              color: exporting ? 'rgba(255,255,255,0.4)' : '#ffffff',
              background: 'none',
              border: '1.5px solid rgba(255,255,255,0.35)',
              borderRadius: '12px',
              padding: '18px 20px',
              width: '100%',
              minHeight: '64px',
              cursor: exporting ? 'default' : 'pointer',
              touchAction: 'manipulation',
              transition: 'border-color 150ms ease, color 150ms ease, transform 100ms ease',
              letterSpacing: '0.02em',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
            }}
            onMouseEnter={(e) => { if (!exporting) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.65)' }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.35)'; e.currentTarget.style.transform = 'scale(1)' }}
            onMouseDown={(e) => { if (!exporting) e.currentTarget.style.transform = 'scale(0.98)' }}
            onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
            onTouchStart={(e) => { if (!exporting) e.currentTarget.style.transform = 'scale(0.98)' }}
            onTouchEnd={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
          >
            {exporting ? (
              <>
                <div
                  className="animate-spin"
                  style={{
                    width: '18px', height: '18px',
                    border: '2px solid rgba(255,255,255,0.2)',
                    borderTopColor: 'rgba(255,255,255,0.6)',
                    borderRadius: '50%', flexShrink: 0,
                  }}
                  aria-hidden="true"
                />
                Descargando...
              </>
            ) : (
              <>
                <ExportIcon />
                Exportar Excel actualizado
              </>
            )}
          </button>
        </footer>
      )}

      {/* ── Selection-mode bulk action bar ── */}
      {selectionMode && (
        <div
          role="toolbar"
          aria-label="Acciones para seleccionados"
          style={{
            flexShrink: 0,
            background: '#172137',
            borderTop: '1px solid rgba(255,255,255,0.14)',
            padding: '12px 16px 28px',
            display: 'flex',
            gap: '10px',
          }}
        >
          {/* Emisión */}
          <button
            onClick={handleBulkEmisionSelected}
            disabled={!selectedCount || bulkEmitting}
            aria-disabled={!selectedCount || bulkEmitting}
            aria-busy={bulkEmitting}
            style={{
              fontFamily: 'Outfit, sans-serif',
              fontSize: '15px',
              fontWeight: 500,
              color: (!selectedCount || bulkEmitting) ? 'rgba(255,255,255,0.28)' : '#ffffff',
              background: 'none',
              border: `1.5px solid ${(!selectedCount || bulkEmitting) ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.4)'}`,
              borderRadius: '12px',
              padding: '14px 12px',
              flex: 1,
              minHeight: '52px',
              cursor: (!selectedCount || bulkEmitting) ? 'default' : 'pointer',
              touchAction: 'manipulation',
              transition: 'border-color 150ms ease, color 150ms ease, transform 100ms ease',
              letterSpacing: '0.01em',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
            onMouseEnter={(e) => { if (selectedCount && !bulkEmitting) { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.7)' } }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = (!selectedCount || bulkEmitting) ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.4)' }}
            onMouseDown={(e) => { if (selectedCount && !bulkEmitting) e.currentTarget.style.transform = 'scale(0.97)' }}
            onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
            onTouchStart={(e) => { if (selectedCount && !bulkEmitting) e.currentTarget.style.transform = 'scale(0.97)' }}
            onTouchEnd={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
          >
            {bulkEmitting ? (
              <div
                className="animate-spin"
                style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.2)', borderTopColor: 'rgba(255,255,255,0.6)', borderRadius: '50%' }}
                aria-hidden="true"
              />
            ) : '→ Emisión'}
          </button>

          {/* Delete */}
          <button
            onClick={() => { if (selectedCount) setBulkDeleteConfirm(true) }}
            disabled={!selectedCount || bulkDeleting}
            aria-disabled={!selectedCount || bulkDeleting}
            style={{
              fontFamily: 'Outfit, sans-serif',
              fontSize: '15px',
              fontWeight: 500,
              color: (!selectedCount || bulkDeleting) ? 'rgba(255,100,100,0.3)' : 'rgba(255,100,100,0.9)',
              background: 'none',
              border: `1.5px solid ${(!selectedCount || bulkDeleting) ? 'rgba(255,100,100,0.15)' : 'rgba(255,100,100,0.35)'}`,
              borderRadius: '12px',
              padding: '14px 12px',
              flex: 1,
              minHeight: '52px',
              cursor: (!selectedCount || bulkDeleting) ? 'default' : 'pointer',
              touchAction: 'manipulation',
              transition: 'border-color 150ms ease, color 150ms ease, transform 100ms ease',
              letterSpacing: '0.01em',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onMouseEnter={(e) => { if (selectedCount && !bulkDeleting) e.currentTarget.style.borderColor = 'rgba(255,100,100,0.6)' }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = (!selectedCount || bulkDeleting) ? 'rgba(255,100,100,0.15)' : 'rgba(255,100,100,0.35)' }}
            onMouseDown={(e) => { if (selectedCount && !bulkDeleting) e.currentTarget.style.transform = 'scale(0.97)' }}
            onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
            onTouchStart={(e) => { if (selectedCount && !bulkDeleting) e.currentTarget.style.transform = 'scale(0.97)' }}
            onTouchEnd={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
          >
            {bulkDeleting ? (
              <div
                className="animate-spin"
                style={{ width: '16px', height: '16px', border: '2px solid rgba(255,100,100,0.2)', borderTopColor: 'rgba(255,100,100,0.6)', borderRadius: '50%' }}
                aria-hidden="true"
              />
            ) : 'Eliminar'}
          </button>
        </div>
      )}

      {/* ── Toast ── */}
      {emisionToast && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: 'fixed',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(255,255,255,0.12)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '10px',
            padding: '12px 20px',
            fontFamily: 'Outfit, sans-serif',
            fontSize: '14px',
            fontWeight: 500,
            color: '#ffffff',
            whiteSpace: 'nowrap',
            zIndex: 30,
            letterSpacing: '0.01em',
            pointerEvents: 'none',
          }}
        >
          {emisionToast.text}
        </div>
      )}

      {/* ── Bulk delete confirmation dialog ── */}
      {bulkDeleteConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Confirmar eliminación masiva"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            zIndex: 40,
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setBulkDeleteConfirm(false) }}
        >
          <div style={{
            background: '#172137',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '16px',
            padding: '28px 24px',
            width: '100%',
            maxWidth: '340px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <p style={{
                fontSize: '16px',
                lineHeight: 1.45,
                color: '#ffffff',
                textAlign: 'center',
                margin: 0,
                fontFamily: 'Outfit, sans-serif',
                fontWeight: 600,
              }}>
                ¿Eliminar {selectedCount} paciente{selectedCount !== 1 ? 's' : ''} del registro?
              </p>
              <p style={{
                fontSize: '13px',
                lineHeight: 1.55,
                color: 'rgba(255,255,255,0.45)',
                textAlign: 'center',
                margin: 0,
                fontFamily: 'Outfit, sans-serif',
              }}>
                Esta acción eliminará sus datos del Excel y no se puede deshacer.
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                onClick={() => setBulkDeleteConfirm(false)}
                style={{
                  fontFamily: 'Outfit, sans-serif',
                  fontSize: '16px', fontWeight: 600,
                  color: '#172137', background: '#ffffff',
                  border: 'none', borderRadius: '12px',
                  padding: '16px', minHeight: '56px',
                  cursor: 'pointer', touchAction: 'manipulation',
                  transition: 'transform 100ms ease',
                }}
                onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.98)' }}
                onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
                onTouchStart={(e) => { e.currentTarget.style.transform = 'scale(0.98)' }}
                onTouchEnd={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
              >
                Cancelar
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={bulkDeleting}
                aria-busy={bulkDeleting}
                style={{
                  fontFamily: 'Outfit, sans-serif',
                  fontSize: '15px', fontWeight: 500,
                  color: bulkDeleting ? 'rgba(255,100,100,0.4)' : 'rgba(255,100,100,0.9)',
                  background: 'none',
                  border: '1.5px solid rgba(255,100,100,0.3)',
                  borderRadius: '12px',
                  padding: '14px', minHeight: '52px',
                  cursor: bulkDeleting ? 'default' : 'pointer',
                  touchAction: 'manipulation',
                  transition: 'transform 100ms ease, color 150ms ease',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                }}
                onMouseDown={(e) => { if (!bulkDeleting) e.currentTarget.style.transform = 'scale(0.98)' }}
                onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
                onTouchStart={(e) => { if (!bulkDeleting) e.currentTarget.style.transform = 'scale(0.98)' }}
                onTouchEnd={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
              >
                {bulkDeleting ? (
                  <>
                    <div
                      className="animate-spin"
                      style={{
                        width: '16px', height: '16px',
                        border: '2px solid rgba(255,100,100,0.2)',
                        borderTopColor: 'rgba(255,100,100,0.6)',
                        borderRadius: '50%', flexShrink: 0,
                      }}
                      aria-hidden="true"
                    />
                    Eliminando...
                  </>
                ) : (
                  `Eliminar ${selectedCount} paciente${selectedCount !== 1 ? 's' : ''}`
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Individual delete confirmation dialog (context-menu) ── */}
      {deleteTarget && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Confirmar eliminación"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            zIndex: 40,
          }}
          onClick={(e) => { if (e.target === e.currentTarget && !deleting) setDeleteTarget(null) }}
        >
          <div style={{
            background: '#172137',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '16px',
            padding: '28px 24px',
            width: '100%',
            maxWidth: '340px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <p style={{
                fontSize: '16px', lineHeight: 1.55,
                color: '#ffffff', textAlign: 'center',
                margin: 0, fontFamily: 'Outfit, sans-serif', fontWeight: 600,
              }}>
                ¿Eliminar a {deleteTarget.nombre || 'este paciente'} del registro?
              </p>
              <p style={{
                fontSize: '14px', lineHeight: 1.5,
                color: 'rgba(255,255,255,0.45)', textAlign: 'center',
                margin: 0, fontFamily: 'Outfit, sans-serif',
              }}>
                Esta acción no se puede deshacer.
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                style={{
                  fontFamily: 'Outfit, sans-serif',
                  fontSize: '16px', fontWeight: 600,
                  color: '#172137', background: '#ffffff',
                  border: 'none', borderRadius: '12px',
                  padding: '16px', minHeight: '56px',
                  cursor: deleting ? 'default' : 'pointer',
                  opacity: deleting ? 0.5 : 1,
                  touchAction: 'manipulation', transition: 'transform 100ms ease',
                }}
                onMouseDown={(e) => { if (!deleting) e.currentTarget.style.transform = 'scale(0.98)' }}
                onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
                onTouchStart={(e) => { if (!deleting) e.currentTarget.style.transform = 'scale(0.98)' }}
                onTouchEnd={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                aria-busy={deleting}
                style={{
                  fontFamily: 'Outfit, sans-serif',
                  fontSize: '15px', fontWeight: 500,
                  color: deleting ? 'rgba(255,100,100,0.4)' : 'rgba(255,100,100,0.9)',
                  background: 'none',
                  border: '1.5px solid rgba(255,100,100,0.3)',
                  borderRadius: '12px',
                  padding: '14px', minHeight: '52px',
                  cursor: deleting ? 'default' : 'pointer',
                  touchAction: 'manipulation',
                  transition: 'transform 100ms ease, color 150ms ease',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                }}
                onMouseDown={(e) => { if (!deleting) e.currentTarget.style.transform = 'scale(0.98)' }}
                onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
                onTouchStart={(e) => { if (!deleting) e.currentTarget.style.transform = 'scale(0.98)' }}
                onTouchEnd={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
              >
                {deleting ? (
                  <>
                    <div
                      className="animate-spin"
                      style={{
                        width: '16px', height: '16px',
                        border: '2px solid rgba(255,100,100,0.2)',
                        borderTopColor: 'rgba(255,100,100,0.6)',
                        borderRadius: '50%', flexShrink: 0,
                      }}
                      aria-hidden="true"
                    />
                    Eliminando...
                  </>
                ) : (
                  'Eliminar'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
