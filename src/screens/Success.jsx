import { useEffect, useState } from 'react'

// ── Replace with your extension's ID after sideloading (see extension/INSTALL.md) ──
const EXTENSION_ID = 'ojjbjnbminciinjlfmgmggccjebafjap'

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

function EmisionIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M3 9h12M11 5l4 4-4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

async function sendToEmision(patientData) {
  // Try the extension's externally_connectable channel first.
  if (
    EXTENSION_ID !== 'YOUR_EXTENSION_ID_HERE' &&
    typeof chrome !== 'undefined' &&
    chrome.runtime?.sendMessage
  ) {
    return new Promise((resolve) => {
      try {
        chrome.runtime.sendMessage(
          EXTENSION_ID,
          { type: 'ADD_TO_QUEUE', patient: patientData },
          (response) => {
            if (chrome.runtime.lastError || !response?.ok) {
              // Extension present but message failed — fall through to clipboard
              navigator.clipboard.writeText(JSON.stringify(patientData, null, 2))
                .then(() => resolve('copied'))
                .catch(() => resolve('error'))
            } else {
              resolve('sent')
            }
          }
        )
      } catch {
        navigator.clipboard.writeText(JSON.stringify(patientData, null, 2))
          .then(() => resolve('copied'))
          .catch(() => resolve('error'))
      }
    })
  }

  // Fallback: clipboard
  try {
    await navigator.clipboard.writeText(JSON.stringify(patientData, null, 2))
    return 'copied'
  } catch {
    return 'error'
  }
}

const TOAST_MESSAGES = {
  sent:   'Agregado a la cola de e-Misión',
  copied: 'Datos copiados — pégalos en la extensión',
  error:  'No se pudo enviar — verifica la extensión',
}

export default function Success({ patient, date, onAddAnother, onExport, onNewSession, exporting }) {
  const nombre = (patient?.nombre ?? '').trim() || 'Paciente'

  const [sending, setSending] = useState(false)
  const [toast, setToast]     = useState(null) // 'sent' | 'copied' | 'error' | null

  // Auto-dismiss toast after 4 seconds
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(t)
  }, [toast])

  async function handleSendToEmision() {
    if (sending) return
    setSending(true)
    const patientData = {
      nombre:    patient?.nombre    ?? '',
      id:        patient?.id    != null ? String(patient.id)    : '',
      edad:      patient?.edad  != null ? String(patient.edad)  : '',
      telefono:  patient?.telefono  ?? '',
      direccion: patient?.direccion ?? '',
      email:     patient?.email     ?? '',
      tipoDoc:   'Cédula de ciudadanía',
      genero:    'Femenino',
      fecha:     date ?? '',
    }
    const result = await sendToEmision(patientData)
    setSending(false)
    setToast(result)
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
        {/* Checkmark + patient name */}
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

          {/* Secondary — send to emisión */}
          <button
            onClick={handleSendToEmision}
            disabled={sending}
            aria-disabled={sending}
            aria-busy={sending}
            style={{
              fontFamily: 'Outfit, sans-serif',
              fontSize: '17px',
              fontWeight: 500,
              color: sending ? 'rgba(255,255,255,0.4)' : '#ffffff',
              background: 'none',
              border: '1.5px solid rgba(255,255,255,0.35)',
              borderRadius: '12px',
              padding: '18px 20px',
              width: '100%',
              minHeight: '64px',
              cursor: sending ? 'default' : 'pointer',
              touchAction: 'manipulation',
              transition: 'border-color 150ms ease, color 150ms ease, transform 100ms ease',
              letterSpacing: '0.02em',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
            }}
            onMouseEnter={(e) => { if (!sending) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.65)' }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.35)'; e.currentTarget.style.transform = 'scale(1)' }}
            onMouseDown={(e) => { if (!sending) e.currentTarget.style.transform = 'scale(0.98)' }}
            onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
            onTouchStart={(e) => { if (!sending) e.currentTarget.style.transform = 'scale(0.98)' }}
            onTouchEnd={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
          >
            {sending ? (
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
                Enviando...
              </>
            ) : (
              <>
                <EmisionIcon />
                Enviar a emisión
              </>
            )}
          </button>

          {/* Tertiary — export */}
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
              border: '1.5px solid rgba(255,255,255,0.22)',
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
            onMouseEnter={(e) => { if (!exporting) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.45)' }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.22)'; e.currentTarget.style.transform = 'scale(1)' }}
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

          {/* Quaternary — new session */}
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

      {/* Toast — aria-live for screen readers, auto-dismisses */}
      {toast && (
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
            zIndex: 100,
            letterSpacing: '0.01em',
            pointerEvents: 'none',
          }}
        >
          {TOAST_MESSAGES[toast]}
        </div>
      )}
    </div>
  )
}
