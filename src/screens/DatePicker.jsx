import { useRef, useState } from 'react'
import { migrateWorkbook } from '../lib/xlsx.js'
import { clearWorkbook } from '../lib/indexedDB.js'

const DEV_STEPS = [
  { device: 'Celular',     text: 'Toma las fotos y registra los pacientes en MediBill' },
  { device: 'Celular',     text: 'En el registro, toca "→ Emisión" para añadir el paciente a la cola' },
  { device: 'Computador',  text: 'Abre Chrome con la extensión RMV instalada y activa' },
  { device: 'Computador',  text: 'En e-Misión, toca "Cargar paciente ▶" para autocompletar el formulario' },
]

export default function DatePicker({ onContinue, onRegistry, onReset }) {
  const [date, setDate]               = useState('')
  const [resetPhase, setResetPhase]   = useState(null) // null | 'options' | 'loading' | 'success'
  const [migratedCount, setMigratedCount] = useState(0)
  const [devInfoOpen, setDevInfoOpen] = useState(false)
  const resetInputRef = useRef(null)

  function handleSubmit(e) {
    e.preventDefault()
    if (date) onContinue(date)
  }

  async function handleMigrateFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setResetPhase('loading')
    try {
      const count = await migrateWorkbook(file, true)
      setMigratedCount(count)
      setResetPhase('success')
      setTimeout(() => setResetPhase(null), 3500)
    } catch (err) {
      alert(err.message || 'Error al procesar el archivo')
      setResetPhase('options')
    }
    e.target.value = ''
  }

  async function handleClearAll() {
    setResetPhase('loading')
    try {
      await clearWorkbook()
      onReset()
    } catch (err) {
      alert(err.message || 'Error al limpiar')
      setResetPhase('options')
    }
  }

  return (
    <div
      className="min-h-dvh flex flex-col items-center justify-between"
      style={{ background: '#172137', padding: '0 24px' }}
    >
      {/* Hidden file input */}
      <input
        ref={resetInputRef}
        type="file"
        accept=".xlsx,.xls"
        style={{ display: 'none' }}
        onChange={handleMigrateFile}
      />

      {/* Reset bottom sheet */}
      {resetPhase && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'flex-end',
          }}
          onClick={() => { if (resetPhase === 'options') setResetPhase(null) }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '480px',
              margin: '0 auto',
              background: '#172137',
              borderRadius: '20px 20px 0 0',
              padding: '28px 24px 44px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              border: '1px solid rgba(255,255,255,0.12)',
              borderBottom: 'none',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {resetPhase === 'loading' && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '24px 0' }}>
                <div
                  className="animate-spin"
                  style={{
                    width: '36px',
                    height: '36px',
                    border: '3px solid rgba(255,255,255,0.15)',
                    borderTopColor: '#ffffff',
                    borderRadius: '50%',
                  }}
                />
                <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '15px', color: 'rgba(255,255,255,0.55)' }}>
                  Procesando...
                </span>
              </div>
            )}

            {resetPhase === 'success' && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '16px 0' }}>
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
                  <circle cx="20" cy="20" r="18.5" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5"/>
                  <path d="M13 20l5 5 9-9" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '17px', fontWeight: 600, color: '#ffffff', margin: 0, textAlign: 'center' }}>
                  Plantilla actualizada
                </p>
                <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '14px', color: 'rgba(255,255,255,0.45)', margin: 0, textAlign: 'center', lineHeight: 1.5 }}>
                  Se conservaron {migratedCount} paciente{migratedCount !== 1 ? 's' : ''}.
                </p>
              </div>
            )}

            {resetPhase === 'options' && (
              <>
                <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '18px', fontWeight: 600, color: '#ffffff', margin: '0 0 2px' }}>
                  Reestablecer plantilla
                </p>
                <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '14px', color: 'rgba(255,255,255,0.42)', margin: '0 0 8px', lineHeight: 1.55 }}>
                  Elige cómo proceder con los datos existentes.
                </p>

                <button
                  onClick={() => resetInputRef.current?.click()}
                  style={{
                    fontFamily: 'Outfit, sans-serif',
                    fontSize: '15px',
                    fontWeight: 600,
                    color: '#172137',
                    background: '#ffffff',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '16px 20px',
                    width: '100%',
                    minHeight: '60px',
                    cursor: 'pointer',
                    touchAction: 'manipulation',
                    transition: 'transform 100ms ease',
                    textAlign: 'left',
                    letterSpacing: '0.01em',
                    lineHeight: 1.35,
                  }}
                  onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.98)' }}
                  onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
                  onTouchStart={(e) => { e.currentTarget.style.transform = 'scale(0.98)' }}
                  onTouchEnd={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
                >
                  Mantener pacientes existentes
                  <span style={{ display: 'block', fontSize: '12px', fontWeight: 400, color: 'rgba(23,33,55,0.55)', marginTop: '3px' }}>
                    Sube una nueva plantilla — los pacientes se migran
                  </span>
                </button>

                <button
                  onClick={handleClearAll}
                  style={{
                    fontFamily: 'Outfit, sans-serif',
                    fontSize: '15px',
                    fontWeight: 500,
                    color: 'rgba(255,100,100,0.85)',
                    background: 'none',
                    border: '1.5px solid rgba(255,100,100,0.28)',
                    borderRadius: '12px',
                    padding: '16px 20px',
                    width: '100%',
                    minHeight: '56px',
                    cursor: 'pointer',
                    touchAction: 'manipulation',
                    transition: 'transform 100ms ease, border-color 150ms ease',
                    letterSpacing: '0.01em',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(255,100,100,0.55)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,100,100,0.28)' }}
                  onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.98)' }}
                  onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
                  onTouchStart={(e) => { e.currentTarget.style.transform = 'scale(0.98)' }}
                  onTouchEnd={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
                >
                  Borrar todo y empezar desde cero
                </button>

                <button
                  onClick={() => setResetPhase(null)}
                  style={{
                    fontFamily: 'Outfit, sans-serif',
                    fontSize: '14px',
                    fontWeight: 400,
                    color: 'rgba(255,255,255,0.32)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'center',
                    padding: '8px 0',
                    touchAction: 'manipulation',
                    transition: 'color 150ms ease',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.62)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.32)' }}
                >
                  Cancelar
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Top spacer */}
      <div style={{ flex: '1 1 0' }} />

      {/* Main column */}
      <div className="flex flex-col items-center" style={{ gap: '48px', width: '100%', maxWidth: '420px' }}>

        {/* Monogram */}
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

          {/* Secondary links */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
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

            {onReset && (
              <button
                type="button"
                onClick={() => setResetPhase('options')}
                style={{
                  fontFamily: 'Outfit, sans-serif',
                  fontSize: '13px',
                  fontWeight: 400,
                  color: 'rgba(255,255,255,0.28)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'center',
                  padding: '8px 0',
                  touchAction: 'manipulation',
                  transition: 'color 150ms ease',
                  letterSpacing: '0.01em',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.58)' }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.28)' }}
              >
                Reestablecer plantilla
              </button>
            )}
          </div>
        </form>

        {/* Cross-device guidance */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
          <button
            type="button"
            onClick={() => setDevInfoOpen(o => !o)}
            style={{
              fontFamily: 'Outfit, sans-serif',
              fontSize: '13px',
              fontWeight: 400,
              color: 'rgba(255,255,255,0.28)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'center',
              padding: '8px 0',
              touchAction: 'manipulation',
              transition: 'color 150ms ease',
              letterSpacing: '0.01em',
              width: '100%',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.58)' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.28)' }}
            aria-expanded={devInfoOpen}
          >
            ¿Usas más de un dispositivo? {devInfoOpen ? '▴' : '▾'}
          </button>

          {devInfoOpen && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              marginTop: '4px',
              borderTop: '1px solid rgba(255,255,255,0.08)',
              paddingTop: '4px',
            }}>
              {DEV_STEPS.map(({ device, text }, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: '10px 4px',
                    borderBottom: i < DEV_STEPS.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                  }}
                >
                  <span style={{
                    fontFamily: 'Outfit, sans-serif',
                    fontSize: '10px',
                    fontWeight: 600,
                    color: 'rgba(255,255,255,0.22)',
                    letterSpacing: '0.07em',
                    textTransform: 'uppercase',
                    minWidth: '76px',
                    paddingTop: '2px',
                    flexShrink: 0,
                  }}>
                    {device}
                  </span>
                  <span style={{
                    fontFamily: 'Outfit, sans-serif',
                    fontSize: '13px',
                    color: 'rgba(255,255,255,0.48)',
                    lineHeight: 1.55,
                    flex: 1,
                  }}>
                    {text}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Bottom spacer */}
      <div style={{ flex: '1.4 1 0' }} />
    </div>
  )
}
