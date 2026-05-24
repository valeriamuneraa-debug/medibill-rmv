import { useState } from 'react'

export default function DatePicker({ onContinue, onRegistry }) {
  const [date, setDate] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    if (date) onContinue(date)
  }

  return (
    <div
      className="min-h-dvh flex flex-col items-center justify-between"
      style={{ background: 'var(--navy)', padding: '0 24px' }}
    >
      {/* Top spacer */}
      <div style={{ flex: '1 1 0' }} />

      {/* Monogram */}
      <div className="flex flex-col items-center" style={{ gap: '48px', width: '100%', maxWidth: '420px' }}>
        <div className="flex flex-col items-center" style={{ gap: '8px' }}>
          <span
            style={{
              fontFamily: 'Outfit, sans-serif',
              fontSize: 'clamp(52px, 16vw, 80px)',
              fontWeight: 700,
              letterSpacing: '0.22em',
              color: '#ffffff',
              lineHeight: 1,
              userSelect: 'none',
            }}
            aria-label="Iniciales: R M V"
          >
            RMV
          </span>
          <span
            style={{
              fontFamily: 'Outfit, sans-serif',
              fontSize: '13px',
              fontWeight: 400,
              letterSpacing: '0.18em',
              color: 'rgba(255,255,255,0.45)',
              textTransform: 'uppercase',
            }}
          >
            MediBill
          </span>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '32px' }}
          noValidate
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <label
              htmlFor="session-date"
              style={{
                fontFamily: 'Outfit, sans-serif',
                fontSize: 'clamp(18px, 5vw, 22px)',
                fontWeight: 400,
                color: '#ffffff',
                lineHeight: 1.35,
                textAlign: 'center',
              }}
            >
              ¿Para qué fecha son estos pacientes?
            </label>

            <input
              id="session-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              aria-required="true"
              style={{
                fontFamily: 'Outfit, sans-serif',
                fontSize: '20px',
                fontWeight: 500,
                color: date ? '#ffffff' : 'rgba(255,255,255,0.4)',
                background: 'rgba(255,255,255,0.08)',
                border: '1.5px solid rgba(255,255,255,0.18)',
                borderRadius: '12px',
                padding: '18px 20px',
                width: '100%',
                minHeight: '64px',
                outline: 'none',
                cursor: 'pointer',
                transition: 'border-color 200ms ease, background 200ms ease',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'rgba(255,255,255,0.55)'
                e.target.style.background = 'rgba(255,255,255,0.12)'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255,255,255,0.18)'
                e.target.style.background = 'rgba(255,255,255,0.08)'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={!date}
            aria-disabled={!date}
            style={{
              fontFamily: 'Outfit, sans-serif',
              fontSize: '18px',
              fontWeight: 600,
              color: date ? '#172137' : 'rgba(23,33,55,0.45)',
              background: date ? '#ffffff' : 'rgba(255,255,255,0.25)',
              border: 'none',
              borderRadius: '12px',
              padding: '20px',
              width: '100%',
              minHeight: '64px',
              cursor: date ? 'pointer' : 'default',
              transition: 'background 200ms ease, color 200ms ease, transform 100ms ease',
              letterSpacing: '0.02em',
            }}
            onMouseDown={(e) => { if (date) e.currentTarget.style.transform = 'scale(0.98)' }}
            onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
            onTouchStart={(e) => { if (date) e.currentTarget.style.transform = 'scale(0.98)' }}
            onTouchEnd={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
          >
            Continuar
          </button>

          {/* Secondary — view existing registry */}
          {onRegistry && (
            <button
              type="button"
              onClick={onRegistry}
              style={{
                fontFamily: 'Outfit, sans-serif',
                fontSize: '15px',
                fontWeight: 500,
                color: 'rgba(255,255,255,0.55)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'center',
                padding: '10px 0',
                touchAction: 'manipulation',
                transition: 'color 150ms ease',
                letterSpacing: '0.01em',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.85)' }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.55)' }}
            >
              Ver registro actual →
            </button>
          )}
        </form>
      </div>

      {/* Bottom spacer */}
      <div style={{ flex: '1.4 1 0' }} />
    </div>
  )
}
