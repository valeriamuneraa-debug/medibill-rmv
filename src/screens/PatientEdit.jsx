import { useState } from 'react'

// Convert a stored Excel date serial into an ISO yyyy-mm-dd string for <input type="date">.
// Uses UTC throughout to avoid any off-by-one-day timezone drift.
function serialToISO(serial) {
  if (serial == null || serial === '') return ''
  const n = Number(serial)
  if (isNaN(n)) return ''
  const dt = new Date((n - 25569) * 86400000)
  if (isNaN(dt.getTime())) return ''
  const y = dt.getUTCFullYear()
  const m = String(dt.getUTCMonth() + 1).padStart(2, '0')
  const d = String(dt.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// Identity fields — who the patient is. Rendered above the procedure data.
const IDENTITY_FIELDS = [
  { key: 'nombre',    label: 'Nombre',            inputMode: 'text',    type: 'text',  hint: null },
  { key: 'fecha',     label: 'Fecha de cirugía',  inputMode: 'text',    type: 'date',  hint: null },
  { key: 'id',        label: 'ID (cédula)',        inputMode: 'numeric', type: 'text',  hint: null },
  { key: 'edad',      label: 'Edad',               inputMode: 'numeric', type: 'text',  hint: null },
  { key: 'telefono',  label: 'Teléfono',           inputMode: 'tel',     type: 'text',  hint: null },
  { key: 'direccion', label: 'Dirección',          inputMode: 'text',    type: 'text',  hint: null },
  { key: 'email',     label: 'E-mail',             inputMode: 'email',   type: 'text',  hint: null },
]

const FIELDS = [
  { key: 'procedimiento', label: 'Procedimiento',    inputMode: 'text',    type: 'text', hint: null },
  { key: 'presupuesto',   label: 'Presupuesto',       inputMode: 'decimal', type: 'text', hint: 'Valor en pesos' },
  { key: 'clinica',       label: 'Clínica',            inputMode: 'text',    type: 'text', hint: null },
  { key: 'implantes',     label: 'Implantes',          inputMode: 'text',    type: 'text', hint: 'Ej: 325 300' },
  { key: 'instrum',       label: 'Instrumentación',    inputMode: 'decimal', type: 'text', hint: 'Valor en pesos' },
  { key: 'tiempo',        label: 'Tiempo (minutos)',   inputMode: 'numeric', type: 'text', hint: null },
  { key: 'facturaDian',   label: 'Factura Dian',       inputMode: 'decimal', type: 'text', hint: 'Valor en pesos' },
]

export default function PatientEdit({ patient, onBack, onSave, onDelete }) {
  const [form, setForm] = useState({
    nombre:        String(patient?.nombre ?? ''),
    fecha:         serialToISO(patient?.fecha),
    id:            patient?.id != null ? String(patient.id) : '',
    edad:          patient?.edad != null ? String(patient.edad) : '',
    telefono:      String(patient?.telefono ?? ''),
    direccion:     String(patient?.direccion ?? ''),
    email:         String(patient?.email ?? ''),
    procedimiento: String(patient?.procedimiento ?? ''),
    presupuesto:   patient?.presupuesto  != null ? String(patient.presupuesto)  : '',
    clinica:       String(patient?.clinica       ?? ''),
    implantes:     String(patient?.implantes     ?? ''),
    instrum:       patient?.instrum      != null ? String(patient.instrum)      : '',
    tiempo:        patient?.tiempo       != null ? String(patient.tiempo)       : '',
    facturaDian:   patient?.facturaDian  != null ? String(patient.facturaDian)  : '',
  })
  const [focusedField, setFocusedField]       = useState(null)
  const [saving, setSaving]                   = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting]               = useState(false)

  function update(key, value) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function handleSave() {
    if (saving) return
    setSaving(true)
    try {
      await onSave(patient._row, { ...form })
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (deleting) return
    setDeleting(true)
    try {
      await onDelete(patient.id)
    } finally {
      setDeleting(false)
    }
  }

  const inputStyle = (key) => ({
    fontFamily: 'Outfit, sans-serif',
    fontSize: '16px',
    fontWeight: 400,
    color: '#ffffff',
    background: 'rgba(255,255,255,0.07)',
    border: `1.5px solid ${focusedField === key ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.18)'}`,
    borderRadius: '12px',
    padding: '14px 16px',
    minHeight: '52px',
    width: '100%',
    boxSizing: 'border-box',
    outline: 'none',
    transition: 'border-color 150ms ease',
    touchAction: 'manipulation',
  })

  return (
    <div
      className="min-h-dvh flex flex-col"
      style={{ background: '#172137', fontFamily: 'Outfit, sans-serif', color: '#ffffff' }}
    >
      {/* Header */}
      <header style={{ display: 'flex', alignItems: 'center', padding: '16px 20px 12px', flexShrink: 0 }}>
        <button
          onClick={onBack}
          aria-label="Volver al registro"
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
          <span style={{
            fontSize: '12px',
            fontWeight: 400,
            letterSpacing: '0.04em',
            color: 'rgba(255,255,255,0.45)',
            textAlign: 'center',
            maxWidth: '200px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {patient?.nombre || 'Paciente'}
          </span>
        </div>

        <div style={{ width: '44px', flexShrink: 0 }} aria-hidden="true" />
      </header>

      {/* Scrollable form */}
      <main style={{ flex: 1, overflowY: 'auto', padding: '8px 24px 48px', WebkitOverflowScrolling: 'touch' }}>
        <div style={{ maxWidth: '420px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>

          <h2 style={{
            fontSize: '18px',
            fontWeight: 600,
            margin: 0,
            letterSpacing: '0.01em',
            color: 'rgba(255,255,255,0.8)',
          }}>
            Datos del paciente
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {IDENTITY_FIELDS.map(({ key, label, inputMode, type, hint }) => (
              <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label
                  htmlFor={`edit-${key}`}
                  style={{
                    fontSize: '13px',
                    fontWeight: 500,
                    color: 'rgba(255,255,255,0.52)',
                    letterSpacing: '0.03em',
                  }}
                >
                  {label}
                </label>
                <input
                  id={`edit-${key}`}
                  type={type}
                  inputMode={type === 'date' ? undefined : inputMode}
                  value={form[key]}
                  onChange={(e) => update(key, e.target.value)}
                  onFocus={() => setFocusedField(key)}
                  onBlur={() => setFocusedField(null)}
                  autoComplete="off"
                  placeholder=""
                  style={{ ...inputStyle(key), colorScheme: 'dark' }}
                />
                {hint && (
                  <span style={{
                    fontSize: '12px',
                    color: 'rgba(255,255,255,0.3)',
                    fontWeight: 400,
                    lineHeight: 1.4,
                  }}>
                    {hint}
                  </span>
                )}
              </div>
            ))}
          </div>

          <h2 style={{
            fontSize: '18px',
            fontWeight: 600,
            margin: 0,
            marginTop: '8px',
            letterSpacing: '0.01em',
            color: 'rgba(255,255,255,0.8)',
          }}>
            Datos del procedimiento
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {FIELDS.map(({ key, label, inputMode, hint }) => (
              <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label
                  htmlFor={`edit-${key}`}
                  style={{
                    fontSize: '13px',
                    fontWeight: 500,
                    color: 'rgba(255,255,255,0.52)',
                    letterSpacing: '0.03em',
                  }}
                >
                  {label}
                </label>
                <input
                  id={`edit-${key}`}
                  type="text"
                  inputMode={inputMode}
                  value={form[key]}
                  onChange={(e) => update(key, e.target.value)}
                  onFocus={() => setFocusedField(key)}
                  onBlur={() => setFocusedField(null)}
                  autoComplete="off"
                  placeholder=""
                  style={inputStyle(key)}
                />
                {hint && (
                  <span style={{
                    fontSize: '12px',
                    color: 'rgba(255,255,255,0.3)',
                    fontWeight: 400,
                    lineHeight: 1.4,
                  }}>
                    {hint}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={saving}
            aria-disabled={saving}
            aria-busy={saving}
            style={{
              fontFamily: 'Outfit, sans-serif',
              fontSize: '18px',
              fontWeight: 600,
              color: saving ? 'rgba(23,33,55,0.45)' : '#172137',
              background: saving ? 'rgba(255,255,255,0.22)' : '#ffffff',
              border: 'none',
              borderRadius: '12px',
              padding: '20px',
              width: '100%',
              minHeight: '64px',
              cursor: saving ? 'default' : 'pointer',
              touchAction: 'manipulation',
              transition: 'background 200ms ease, color 200ms ease, transform 100ms ease',
              letterSpacing: '0.02em',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              marginTop: '8px',
            }}
            onMouseDown={(e) => { if (!saving) e.currentTarget.style.transform = 'scale(0.98)' }}
            onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
            onTouchStart={(e) => { if (!saving) e.currentTarget.style.transform = 'scale(0.98)' }}
            onTouchEnd={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
          >
            {saving ? (
              <>
                <div
                  className="animate-spin"
                  style={{
                    width: '18px',
                    height: '18px',
                    border: '2px solid rgba(23,33,55,0.2)',
                    borderTopColor: 'rgba(23,33,55,0.6)',
                    borderRadius: '50%',
                    flexShrink: 0,
                  }}
                  aria-hidden="true"
                />
                Guardando...
              </>
            ) : (
              'Guardar cambios'
            )}
          </button>

          {/* Delete — destructive, red text, visually separated */}
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            style={{
              fontFamily: 'Outfit, sans-serif',
              fontSize: '15px',
              fontWeight: 500,
              color: 'rgba(255,100,100,0.8)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'center',
              padding: '12px 0',
              width: '100%',
              minHeight: '48px',
              touchAction: 'manipulation',
              transition: 'color 150ms ease',
              letterSpacing: '0.01em',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(255,100,100,1)' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,100,100,0.8)' }}
          >
            Eliminar paciente
          </button>

        </div>
      </main>

      {/* Delete confirmation dialog */}
      {showDeleteConfirm && (
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
          onClick={(e) => { if (e.target === e.currentTarget && !deleting) setShowDeleteConfirm(false) }}
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
                ¿Eliminar a {patient?.nombre || 'este paciente'} del registro?
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
              {/* Cancel = primary (safe action) */}
              <button
                onClick={() => setShowDeleteConfirm(false)}
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
              {/* Eliminar = destructive ghost */}
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
