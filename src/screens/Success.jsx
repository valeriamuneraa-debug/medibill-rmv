function formatDate(isoDate) {
  if (!isoDate) return ''
  const [year, month, day] = isoDate.split('-').map(Number)
  const months = [
    'enero','febrero','marzo','abril','mayo','junio',
    'julio','agosto','septiembre','octubre','noviembre','diciembre',
  ]
  return `${day} de ${months[month - 1]} de ${year}`
}

function CheckIcon() {
  return (
    <svg width="72" height="72" viewBox="0 0 72 72" fill="none" aria-hidden="true">
      <circle cx="36" cy="36" r="33" stroke="rgba(255,255,255,0.9)" strokeWidth="1.8" />
      <path d="M22 36L31 45L50 27" stroke="rgba(255,255,255,0.9)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ExportIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M3 12v2a1 1 0 001 1h10a1 1 0 001-1v-2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M9 3v8M6 8l3 3 3-3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function Success({ patient, date, onAddAnother, onExport, onNewSession, exporting }) {
  const nombre = (patient?.nombre ?? '').trim() || 'Paciente'

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
      <main
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '32px 24px 64px',
          gap: '44px',
        }}
      >
        {/* Checkmark + patient name + date */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '22px' }}>
          <CheckIcon />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                fontSize: 'clamp(26px, 8vw, 36px)',
                fontWeight: 700,
                letterSpacing: '0.01em',
                lineHeight: 1.15,
                textAlign: 'center',
              }}
            >
              {nombre} agregado
            </span>
            <span style={{
              fontSize: '14px',
              color: 'rgba(255,255,255,0.42)',
              fontWeight: 400,
              textAlign: 'center',
              letterSpacing: '0.02em',
            }}>
              {formatDate(date)}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div style={{ width: '100%', maxWidth: '420px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

          {/* Primary — add another */}
          <button
            onClick={onAddAnother}
            style={{
              fontFamily: 'Outfit, sans-serif',
              fontSize: '18px',
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
              letterSpacing: '0.02em',
            }}
            onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.98)' }}
            onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
            onTouchStart={(e) => { e.currentTarget.style.transform = 'scale(0.98)' }}
            onTouchEnd={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
          >
            Agregar otro paciente
          </button>

          {/* Secondary — export */}
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

          {/* Tertiary — new session */}
          <button
            onClick={onNewSession}
            style={{
              fontFamily: 'Outfit, sans-serif',
              fontSize: '14px',
              fontWeight: 400,
              color: 'rgba(255,255,255,0.35)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'center',
              textDecoration: 'underline',
              textDecorationColor: 'rgba(255,255,255,0.18)',
              textUnderlineOffset: '3px',
              padding: '4px 0',
              touchAction: 'manipulation',
              transition: 'color 150ms ease',
              marginTop: '-4px',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.65)' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.35)' }}
          >
            Nueva sesión
          </button>

        </div>
      </main>
    </div>
  )
}
