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
  { key: 'procedimiento', label: 'Procedimiento',  inputMode: 'text' },
  { key: 'presupuesto',   label: 'Presupuesto',     inputMode: 'numeric', hint: 'Pesos colombianos' },
  { key: 'clinica',       label: 'Clínica',         inputMode: 'text' },
  { key: 'implantes',     label: 'Implantes',       inputMode: 'text',    hint: 'Códigos del proveedor' },
  { key: 'instrum',       label: 'Instrum',         inputMode: 'numeric' },
  { key: 'tiempo',        label: 'Tiempo (min)',    inputMode: 'numeric' },
  { key: 'facturaDian',   label: 'Factura Dian',    inputMode: 'numeric', hint: 'Pesos colombianos' },
]

export default function ClinicalData({ patient, date, onSave, onSkip }) {
  const [fields, setFields] = useState({
    procedimiento: '',
    presupuesto:   '',
    clinica:       '',
    implantes:     '',
    instrum:       '',
    tiempo:        '',
    facturaDian:   '',
  })
  const [focusedField, setFocusedField] = useState(null)
  const [saving, setSaving] = useState(false)

  function update(key, value) {
    setFields(prev => ({ ...prev, [key]: value }))
  }

  async function handleSave() {
    if (saving) return
    setSaving(true)
    try {
      await onSave({ ...patient, ...fields })
    } finally {
      setSaving(false)
    }
  }

  function inputStyle(key) {
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
    }
  }

  return (
    <div
      className="min-h-dvh flex flex-col"
      style={{ background: '#172137', fontFamily: 'Outfit, sans-serif', color: '#ffffff' }}
    >
      {/* Header */}
      <header style={{ display: 'flex', alignItems: 'center', padding: '16px 20px 12px', flexShrink: 0 }}>
        <div style={{ width: '44px', flexShrink: 0 }} aria-hidden="true" />
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

      {/* Main */}
      <main style={{ flex: 1, overflowY: 'auto', padding: '8px 24px 48px', WebkitOverflowScrolling: 'touch' }}>
        <div style={{ maxWidth: '420px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* Title block */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <h2 style={{
              fontSize: '20px',
              fontWeight: 600,
              margin: 0,
              lineHeight: 1.35,
              letterSpacing: '0.01em',
            }}>
              Datos clínicos{' '}
              <span style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 400 }}>(opcional)</span>
            </h2>
            <p style={{
              fontSize: '14px',
              color: 'rgba(255,255,255,0.45)',
              margin: 0,
              lineHeight: 1.5,
            }}>
              Completa ahora o edita después desde el registro
            </p>
          </div>

          {/* Fields */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {FIELDS.map(({ key, label, inputMode, hint }) => (
              <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label
                  htmlFor={`cd-${key}`}
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
                  id={`cd-${key}`}
                  type="text"
                  inputMode={inputMode}
                  value={fields[key]}
                  onChange={(e) => update(key, e.target.value)}
                  onFocus={() => setFocusedField(key)}
                  onBlur={() => setFocusedField(null)}
                  autoComplete="off"
                  style={inputStyle(key)}
                />
                {hint && (
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', lineHeight: 1.4 }}>
                    {hint}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Primary — save */}
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
              'Guardar y continuar'
            )}
          </button>

          {/* Secondary — skip */}
          <button
            onClick={() => onSkip(patient)}
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
            Continuar sin completar
          </button>

        </div>
      </main>
    </div>
  )
}
