import { useState } from 'react'

function formatShortDate(isoDate) {
  if (!isoDate) return ''
  const [, month, day] = isoDate.split('-').map(Number)
  const months = [
    'enero','febrero','marzo','abril','mayo','junio',
    'julio','agosto','septiembre','octubre','noviembre','diciembre',
  ]
  return `${day} de ${months[month - 1]}`
}

export default function NuevaFecha({ date, onSameDate, onChangeDate, onBack }) {
  const [showPicker, setShowPicker] = useState(false)
  const [newDate, setNewDate]       = useState('')

  const press = {
    onMouseDown:  (e) => { e.currentTarget.style.transform = 'scale(0.98)' },
    onMouseUp:    (e) => { e.currentTarget.style.transform = 'scale(1)' },
    onMouseLeave: (e) => { e.currentTarget.style.transform = 'scale(1)' },
    onTouchStart: (e) => { e.currentTarget.style.transform = 'scale(0.98)' },
    onTouchEnd:   (e) => { e.currentTarget.style.transform = 'scale(1)' },
  }

  return (
    <div
      className="min-h-dvh flex flex-col"
      style={{ background: '#172137', fontFamily: 'Outfit, sans-serif', color: '#ffffff' }}
    >
      {/* Header */}
      <header style={{ display: 'flex', alignItems: 'center', padding: '16px 20px 12px' }}>
        <button
          onClick={onBack}
          aria-label="Volver a la confirmación"
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
          }}>
            Agregar paciente
          </span>
        </div>

        <div style={{ width: '44px', flexShrink: 0 }} aria-hidden="true" />
      </header>

      {/* Main */}
      <main style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 24px 80px',
        gap: '36px',
      }}>
        <p style={{
          fontSize: 'clamp(20px, 6vw, 26px)',
          fontWeight: 600,
          textAlign: 'center',
          margin: 0,
          lineHeight: 1.3,
          letterSpacing: '0.01em',
        }}>
          ¿Misma fecha o diferente?
        </p>

        <div style={{ width: '100%', maxWidth: '420px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

          {!showPicker ? (
            <>
              {/* PRIMARY — same date */}
              <button
                onClick={onSameDate}
                style={{
                  fontFamily: 'Outfit, sans-serif',
                  fontSize: '17px',
                  fontWeight: 600,
                  color: '#172137',
                  background: '#ffffff',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '20px',
                  width: '100%',
                  minHeight: '64px',
                  cursor: 'pointer',
                  touchAction: 'manipulation',
                  transition: 'transform 100ms ease',
                  letterSpacing: '0.01em',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                }}
                {...press}
              >
                <span>Misma fecha</span>
                <span style={{ fontSize: '13px', fontWeight: 400, opacity: 0.65 }}>
                  {formatShortDate(date)}
                </span>
              </button>

              {/* SECONDARY — change date */}
              <button
                onClick={() => setShowPicker(true)}
                style={{
                  fontFamily: 'Outfit, sans-serif',
                  fontSize: '17px',
                  fontWeight: 500,
                  color: '#ffffff',
                  background: 'none',
                  border: '1.5px solid rgba(255,255,255,0.35)',
                  borderRadius: '12px',
                  padding: '20px',
                  width: '100%',
                  minHeight: '64px',
                  cursor: 'pointer',
                  touchAction: 'manipulation',
                  transition: 'border-color 150ms ease, transform 100ms ease',
                  letterSpacing: '0.01em',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.65)' }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.35)'; e.currentTarget.style.transform = 'scale(1)' }}
                onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.98)' }}
                onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
                onTouchStart={(e) => { e.currentTarget.style.transform = 'scale(0.98)' }}
                onTouchEnd={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
              >
                Cambiar fecha
              </button>
            </>
          ) : (
            <>
              {/* Date input */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label
                  htmlFor="nueva-fecha-input"
                  style={{
                    fontSize: '13px',
                    fontWeight: 500,
                    color: 'rgba(255,255,255,0.52)',
                    letterSpacing: '0.03em',
                  }}
                >
                  Nueva fecha
                </label>
                <input
                  id="nueva-fecha-input"
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  style={{
                    fontFamily: 'Outfit, sans-serif',
                    fontSize: '18px',
                    fontWeight: 500,
                    color: newDate ? '#ffffff' : 'rgba(255,255,255,0.4)',
                    background: 'rgba(255,255,255,0.08)',
                    border: '1.5px solid rgba(255,255,255,0.22)',
                    borderRadius: '12px',
                    padding: '18px 20px',
                    width: '100%',
                    minHeight: '64px',
                    outline: 'none',
                    cursor: 'pointer',
                    transition: 'border-color 200ms ease',
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.55)' }}
                  onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.22)' }}
                />
              </div>

              {/* Confirm new date */}
              <button
                onClick={() => newDate && onChangeDate(newDate)}
                disabled={!newDate}
                aria-disabled={!newDate}
                style={{
                  fontFamily: 'Outfit, sans-serif',
                  fontSize: '17px',
                  fontWeight: 600,
                  color: newDate ? '#172137' : 'rgba(23,33,55,0.45)',
                  background: newDate ? '#ffffff' : 'rgba(255,255,255,0.22)',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '20px',
                  width: '100%',
                  minHeight: '64px',
                  cursor: newDate ? 'pointer' : 'default',
                  touchAction: 'manipulation',
                  transition: 'background 200ms ease, color 200ms ease, transform 100ms ease',
                  letterSpacing: '0.01em',
                }}
                onMouseDown={(e) => { if (newDate) e.currentTarget.style.transform = 'scale(0.98)' }}
                onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
                onTouchStart={(e) => { if (newDate) e.currentTarget.style.transform = 'scale(0.98)' }}
                onTouchEnd={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
              >
                Continuar con esta fecha
              </button>

              {/* Back link */}
              <button
                onClick={() => { setShowPicker(false); setNewDate('') }}
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
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.65)' }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.38)' }}
              >
                Volver a opciones
              </button>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
