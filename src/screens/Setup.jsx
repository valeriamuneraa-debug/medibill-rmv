import { useRef, useState } from 'react'
import { storeUploadedWorkbook } from '../lib/xlsx.js'

function SpreadsheetIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <rect x="6" y="4" width="36" height="40" rx="3" stroke="rgba(255,255,255,0.55)" strokeWidth="1.8" />
      <path d="M14 14H34M14 22H34M14 30H26" stroke="rgba(255,255,255,0.55)" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M6 14H42" stroke="rgba(255,255,255,0.35)" strokeWidth="1.2" />
      <path d="M18 4V44" stroke="rgba(255,255,255,0.25)" strokeWidth="1.2" />
    </svg>
  )
}

function UploadIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 16V8M12 8L9 11M12 8L15 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

export default function Setup({ onReady }) {
  const inputRef = useRef(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [dragging, setDragging] = useState(false)

  async function processFile(file) {
    if (!file) return
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      setError('Solo se aceptan archivos Excel (.xlsx)')
      return
    }
    setLoading(true)
    setError(null)
    try {
      await storeUploadedWorkbook(file)
      onReady()
    } catch (err) {
      setError(err.message ?? 'Error al procesar el archivo')
      setLoading(false)
    }
  }

  function handleFileChange(e) {
    processFile(e.target.files?.[0])
    e.target.value = ''
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragging(false)
    processFile(e.dataTransfer.files?.[0])
  }

  return (
    <div
      className="min-h-dvh flex flex-col items-center justify-between"
      style={{ background: '#172137', fontFamily: 'Outfit, sans-serif', padding: '0 24px' }}
    >
      <div style={{ flex: '1 1 0' }} />

      <div style={{ width: '100%', maxWidth: '420px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '40px' }}>

        {/* Monogram */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
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
              fontSize: '13px',
              fontWeight: 400,
              letterSpacing: '0.18em',
              color: 'rgba(255,255,255,0.45)',
              textTransform: 'uppercase',
            }}
          >
            Configuración inicial
          </span>
        </div>

        {/* Instructions */}
        <p
          style={{
            fontSize: 'clamp(18px, 5vw, 22px)',
            fontWeight: 400,
            color: '#ffffff',
            lineHeight: 1.4,
            textAlign: 'center',
            margin: 0,
          }}
        >
          Sube la plantilla Excel de Dr. Múnera
        </p>

        {/* Upload zone */}
        <button
          type="button"
          onClick={() => !loading && inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          disabled={loading}
          aria-label="Seleccionar archivo Excel"
          style={{
            width: '100%',
            minHeight: '180px',
            background: dragging ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.07)',
            border: `2px dashed ${dragging ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.3)'}`,
            borderRadius: '16px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            cursor: loading ? 'default' : 'pointer',
            transition: 'background 150ms ease, border-color 150ms ease',
            padding: '24px',
            touchAction: 'manipulation',
          }}
          onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = 'rgba(255,255,255,0.10)' }}
          onMouseLeave={(e) => { if (!loading && !dragging) e.currentTarget.style.background = 'rgba(255,255,255,0.07)' }}
          onMouseDown={(e) => { if (!loading) e.currentTarget.style.transform = 'scale(0.99)' }}
          onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
          onTouchStart={(e) => { if (!loading) e.currentTarget.style.transform = 'scale(0.99)' }}
          onTouchEnd={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
        >
          {loading ? (
            <>
              <div
                className="animate-spin"
                style={{
                  width: '36px',
                  height: '36px',
                  border: '3px solid rgba(255,255,255,0.25)',
                  borderTopColor: '#ffffff',
                  borderRadius: '50%',
                }}
                aria-hidden="true"
              />
              <span style={{ fontSize: '16px', color: 'rgba(255,255,255,0.7)', fontWeight: 400 }}>
                Procesando...
              </span>
            </>
          ) : (
            <>
              <SpreadsheetIcon />
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px', fontWeight: 600, color: '#ffffff' }}>
                  <UploadIcon />
                  Seleccionar archivo .xlsx
                </span>
                <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', fontWeight: 400 }}>
                  o arrastra y suelta aquí
                </span>
              </div>
            </>
          )}
        </button>

        {/* Error */}
        {error && (
          <p
            role="alert"
            style={{
              fontSize: '14px',
              color: 'rgba(255,120,120,0.9)',
              textAlign: 'center',
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            {error}
          </p>
        )}

        {/* Once note */}
        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)', textAlign: 'center', margin: 0, lineHeight: 1.5 }}>
          Solo se necesita hacer esto una vez. La plantilla queda guardada en el dispositivo.
        </p>

      </div>

      <div style={{ flex: '1.4 1 0' }} />

      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls"
        onChange={handleFileChange}
        style={{ display: 'none' }}
        aria-hidden="true"
        tabIndex={-1}
      />
    </div>
  )
}
