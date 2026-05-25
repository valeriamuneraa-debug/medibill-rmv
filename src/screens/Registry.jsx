import { useEffect, useRef, useState } from 'react'
import { readPatients } from '../lib/xlsx.js'

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

function ExportIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M3 12v2a1 1 0 001 1h10a1 1 0 001-1v-2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M9 3v8M6 8l3 3 3-3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const TH = ({ children, width, right }) => (
  <th style={{
    padding: '10px 12px',
    textAlign: right ? 'right' : 'left',
    fontSize: '11px',
    fontWeight: 600,
    letterSpacing: '0.07em',
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.5)',
    whiteSpace: 'nowrap',
    width,
    background: '#172137',
    borderBottom: '1px solid rgba(255,255,255,0.12)',
    position: 'sticky',
    top: 0,
    zIndex: 1,
  }}>
    {children}
  </th>
)

export default function Registry({ onBack, onEditPatient, onExport, exporting, onDelete }) {
  const [patients, setPatients]       = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting]       = useState(false)

  const longPressTimer  = useRef(null)
  const longPressFired  = useRef(false)

  useEffect(() => {
    readPatients()
      .then(rows => setPatients(
        rows.filter(p => p.nombre && p.nombre.trim() !== '' && p.nombre !== 'Nombre')
      ))
      .catch(() => setPatients([]))
  }, [])

  function startLongPress(patient) {
    longPressFired.current = false
    longPressTimer.current = setTimeout(() => {
      longPressFired.current = true
      setDeleteTarget(patient)
    }, 500)
  }

  function cancelLongPress() {
    clearTimeout(longPressTimer.current)
  }

  function handleRowClick(patient) {
    if (longPressFired.current) return
    onEditPatient(patient)
  }

  async function handleDelete() {
    if (deleting || !deleteTarget) return
    setDeleting(true)
    try {
      await onDelete(deleteTarget.id)
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  const rowPress   = (e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }
  const rowRelease = (e) => { e.currentTarget.style.background = 'transparent' }

  return (
    <div
      className="min-h-dvh flex flex-col"
      style={{ background: '#172137', fontFamily: 'Outfit, sans-serif', color: '#ffffff' }}
    >
      {/* Header */}
      <header style={{ display: 'flex', alignItems: 'center', padding: '16px 20px 12px', flexShrink: 0 }}>
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
            justifyContent: 'flex-start',
            padding: 0,
            opacity: 0.8,
            flexShrink: 0,
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

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
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

        <div style={{ width: '44px', flexShrink: 0 }} aria-hidden="true" />
      </header>

      {/* Scrollable content */}
      <main style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
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
        ) : (
          <>
            <p style={{
              fontSize: '12px',
              color: 'rgba(255,255,255,0.28)',
              textAlign: 'center',
              margin: '8px 0 0',
              letterSpacing: '0.01em',
            }}>
              Mantén presionado para eliminar un paciente
            </p>
            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: '560px' }}>
                <thead>
                  <tr>
                    <TH width="150px">Nombre</TH>
                    <TH width="72px">Fecha</TH>
                    <TH width="120px">Procedimiento</TH>
                    <TH width="105px" right>Factura Dian</TH>
                    <TH width="105px" right>Presupuesto</TH>
                    <TH width="28px" />
                  </tr>
                </thead>
                <tbody>
                  {patients.map((p) => (
                    <tr
                      key={p._row}
                      onClick={() => handleRowClick(p)}
                      onTouchStart={() => startLongPress(p)}
                      onTouchEnd={cancelLongPress}
                      onTouchMove={cancelLongPress}
                      onContextMenu={(e) => { e.preventDefault(); setDeleteTarget(p) }}
                      style={{ cursor: 'pointer', transition: 'background 100ms ease' }}
                      onMouseEnter={rowPress}
                      onMouseLeave={rowRelease}
                      onMouseDown={rowPress}
                      onMouseUp={rowRelease}
                    >
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>

      {/* Footer export button — only when patients exist */}
      {patients && patients.length > 0 && (
        <footer style={{
          flexShrink: 0,
          padding: '16px 24px 32px',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          background: '#172137',
        }}>
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
                    width: '18px',
                    height: '18px',
                    border: '2px solid rgba(255,255,255,0.2)',
                    borderTopColor: 'rgba(255,255,255,0.6)',
                    borderRadius: '50%',
                    flexShrink: 0,
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

      {/* Delete confirmation dialog */}
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
            zIndex: 50,
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
                fontSize: '16px',
                lineHeight: 1.55,
                color: '#ffffff',
                textAlign: 'center',
                margin: 0,
                fontFamily: 'Outfit, sans-serif',
                fontWeight: 600,
              }}>
                ¿Eliminar a {deleteTarget.nombre || 'este paciente'} del registro?
              </p>
              <p style={{
                fontSize: '14px',
                lineHeight: 1.5,
                color: 'rgba(255,255,255,0.45)',
                textAlign: 'center',
                margin: 0,
                fontFamily: 'Outfit, sans-serif',
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
                  fontSize: '16px',
                  fontWeight: 600,
                  color: '#172137',
                  background: '#ffffff',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '16px',
                  minHeight: '56px',
                  cursor: deleting ? 'default' : 'pointer',
                  opacity: deleting ? 0.5 : 1,
                  touchAction: 'manipulation',
                  transition: 'transform 100ms ease',
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
                  fontSize: '15px',
                  fontWeight: 500,
                  color: deleting ? 'rgba(255,100,100,0.4)' : 'rgba(255,100,100,0.9)',
                  background: 'none',
                  border: '1.5px solid rgba(255,100,100,0.3)',
                  borderRadius: '12px',
                  padding: '14px',
                  minHeight: '52px',
                  cursor: deleting ? 'default' : 'pointer',
                  touchAction: 'manipulation',
                  transition: 'transform 100ms ease, color 150ms ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
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
                        width: '16px',
                        height: '16px',
                        border: '2px solid rgba(255,100,100,0.2)',
                        borderTopColor: 'rgba(255,100,100,0.6)',
                        borderRadius: '50%',
                        flexShrink: 0,
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
