import { useState } from 'react'

function formatDate(isoDate) {
  if (!isoDate) return ''
  const [year, month, day] = isoDate.split('-').map(Number)
  const months = [
    'enero','febrero','marzo','abril','mayo','junio',
    'julio','agosto','septiembre','octubre','noviembre','diciembre',
  ]
  return `${day} de ${months[month - 1]} de ${year}`
}

const FIELDS = [
  { key: 'nombre',    label: 'Nombre completo',         type: 'text',  inputMode: 'text' },
  { key: 'id',        label: 'Número de documento',      type: 'text',  inputMode: 'numeric' },
  { key: 'edad',      label: 'Edad',                     type: 'text',  inputMode: 'numeric' },
  { key: 'telefono',  label: 'Teléfono',                 type: 'tel',   inputMode: 'tel' },
  { key: 'direccion', label: 'Dirección',                type: 'text',  inputMode: 'text' },
  { key: 'email',     label: 'Correo electrónico',       type: 'email', inputMode: 'email' },
]

function isValidId(v) { return /^\d+$/.test(v.trim()) }
function isValidAge(v) { return /^\d{1,3}$/.test(v.trim()) }
function isValidEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) }

export default function Review({ date, patient, image, onBack, onConfirm }) {
  const [formData, setFormData] = useState(() => ({
    nombre:    patient?.nombre    ?? '',
    id:        patient?.id        ?? '',
    edad:      patient?.edad      ?? '',
    telefono:  patient?.telefono  ?? '',
    direccion: patient?.direccion ?? '',
    email:     patient?.email     ?? '',
  }))
  const [focusedField, setFocusedField] = useState(null)

  const confidence = patient?.confidence ?? {}

  function update(key, value) {
    setFormData(prev => ({ ...prev, [key]: value }))
  }

  // Returns inset box-shadow accent color, or null for no accent
  function accentColor(key) {
    const val = formData[key]
    if (!val || !val.trim()) return '#EF4444'
    const conf = confidence[key] ?? 1
    if (conf < 0.8) return '#F59E0B'
    return null
  }

  // Inline warning message below the input
  function warningText(key) {
    const val = formData[key]
    if (!val || !val.trim()) return { text: 'No detectado — completar', color: '#EF4444' }
    const conf = confidence[key] ?? 1
    if (conf < 0.8) return { text: 'Verificar — baja confianza', color: '#F59E0B' }
    return null
  }

  // Format validation error (only shown when non-empty but malformed)
  function formatError(key) {
    const val = formData[key]?.trim()
    if (!val) return null
    if (key === 'id' && !isValidId(val)) return 'Solo se permiten números'
    if (key === 'edad' && !isValidAge(val)) return 'Ingresa solo el número de años'
    if (key === 'email' && !isValidEmail(val)) return 'Formato de correo no válido'
    return null
  }

  function inputStyle(key) {
    const accent = accentColor(key)
    const isFocused = focusedField === key
    return {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '16px',
      fontWeight: 400,
      color: '#ffffff',
      background: 'rgba(255,255,255,0.07)',
      border: `1.5px solid ${isFocused ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.18)'}`,
      borderRadius: '12px',
      padding: '14px 16px',
      minHeight: '52px',
      width: '100%',
      boxSizing: 'border-box',
      outline: 'none',
      transition: 'border-color 150ms ease',
      touchAction: 'manipulation',
      ...(accent ? { boxShadow: `inset 4px 0 0 0 ${accent}` } : {}),
    }
  }

  const canConfirm =
    formData.nombre.trim() !== '' &&
    formData.id.trim() !== '' &&
    !formatError('id') &&
    !formatError('edad') &&
    !formatError('email')

  function handleConfirm() {
    if (!canConfirm) return
    // Strip confidence from saved record
    const { confidence: _c, ...rest } = patient ?? {}
    onConfirm({ ...rest, ...formData })
  }

  return (
    <div
      className="min-h-dvh flex flex-col"
      style={{ background: '#172137', fontFamily: 'Outfit, sans-serif', color: '#ffffff' }}
    >
      {/* ── Header ── */}
      <header style={{ display: 'flex', alignItems: 'center', padding: '16px 20px 12px', flexShrink: 0 }}>
        <button
          onClick={onBack}
          aria-label="Volver a la cámara"
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
          }}>
            Pacientes del {formatDate(date)}
          </span>
        </div>

        <div style={{ width: '44px', flexShrink: 0 }} aria-hidden="true" />
      </header>

      {/* ── Scrollable main ── */}
      <main style={{ flex: 1, overflowY: 'auto', padding: '8px 24px 48px', WebkitOverflowScrolling: 'touch' }}>
        <div style={{ maxWidth: '420px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* Section label + thumbnail side-by-side */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
            <h2 style={{
              fontSize: '20px',
              fontWeight: 600,
              margin: 0,
              flex: 1,
              lineHeight: 1.35,
              letterSpacing: '0.01em',
            }}>
              Verifica los datos extraídos
            </h2>
            {image && (
              <img
                src={image}
                alt="Historia clínica fotografiada"
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '10px',
                  border: '2px solid rgba(255,255,255,0.55)',
                  objectFit: 'cover',
                  flexShrink: 0,
                }}
              />
            )}
          </div>

          {/* ── Fields ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {FIELDS.map(({ key, label, type, inputMode }) => {
              const warning = warningText(key)
              const fmtErr = formatError(key)
              return (
                <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <label
                    htmlFor={`field-${key}`}
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
                    id={`field-${key}`}
                    type={type}
                    inputMode={inputMode}
                    value={formData[key]}
                    onChange={(e) => update(key, e.target.value)}
                    onFocus={() => setFocusedField(key)}
                    onBlur={() => setFocusedField(null)}
                    autoComplete="off"
                    style={inputStyle(key)}
                  />
                  {/* Format error takes priority over confidence warning */}
                  {fmtErr ? (
                    <span
                      role="alert"
                      style={{ fontSize: '12px', color: '#EF4444', fontWeight: 400, lineHeight: 1.4 }}
                    >
                      {fmtErr}
                    </span>
                  ) : warning ? (
                    <span style={{ fontSize: '12px', color: warning.color, fontWeight: 400, lineHeight: 1.4 }}>
                      {warning.text}
                    </span>
                  ) : null}
                </div>
              )
            })}
          </div>

          {/* ── Agregar al registro ── */}
          <button
            onClick={handleConfirm}
            disabled={!canConfirm}
            aria-disabled={!canConfirm}
            style={{
              fontFamily: 'Outfit, sans-serif',
              fontSize: '18px',
              fontWeight: 600,
              color: canConfirm ? '#172137' : 'rgba(23,33,55,0.45)',
              background: canConfirm ? '#ffffff' : 'rgba(255,255,255,0.22)',
              border: 'none',
              borderRadius: '12px',
              padding: '20px',
              width: '100%',
              minHeight: '64px',
              cursor: canConfirm ? 'pointer' : 'default',
              touchAction: 'manipulation',
              transition: 'background 200ms ease, color 200ms ease, transform 100ms ease',
              letterSpacing: '0.02em',
            }}
            onMouseDown={(e) => { if (canConfirm) e.currentTarget.style.transform = 'scale(0.98)' }}
            onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
            onTouchStart={(e) => { if (canConfirm) e.currentTarget.style.transform = 'scale(0.98)' }}
            onTouchEnd={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
          >
            Agregar al registro
          </button>

          {/* Cancel link */}
          <button
            onClick={onBack}
            style={{
              fontFamily: 'Outfit, sans-serif',
              fontSize: '14px',
              fontWeight: 400,
              color: 'rgba(255,255,255,0.38)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'center',
              textDecoration: 'underline',
              textDecorationColor: 'rgba(255,255,255,0.2)',
              textUnderlineOffset: '3px',
              padding: '4px 0',
              touchAction: 'manipulation',
              transition: 'color 150ms ease',
              marginTop: '-8px',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.65)' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.38)' }}
          >
            Cancelar y retomar foto
          </button>

        </div>
      </main>
    </div>
  )
}
