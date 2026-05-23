import { useState, useRef } from 'react'

function formatDate(isoDate) {
  if (!isoDate) return ''
  const [year, month, day] = isoDate.split('-').map(Number)
  const months = [
    'enero','febrero','marzo','abril','mayo','junio',
    'julio','agosto','septiembre','octubre','noviembre','diciembre',
  ]
  return `${day} de ${months[month - 1]} de ${year}`
}

export default function Camera({ date, onBack, onCapture, onReview }) {
  const [image, setImage] = useState(null)
  const inputRef = useRef(null)

  function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setImage(ev.target.result)
    reader.readAsDataURL(file)
  }

  function openPicker() {
    inputRef.current?.click()
  }

  function handleExtract() {
    // API call wired in next session
  }

  return (
    <div
      className="min-h-dvh flex flex-col"
      style={{ background: 'var(--navy)', fontFamily: 'Outfit, sans-serif', color: '#ffffff' }}
    >
      {/* ── Header ── */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '16px 20px 12px',
        }}
      >
        {/* Back — same visual width as the right spacer so monogram stays centered */}
        <button
          onClick={onBack}
          aria-label="Volver a selección de fecha"
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
            transition: 'opacity 150ms ease, transform 100ms ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = '1' }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.8' }}
          onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.9)' }}
          onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
          onTouchStart={(e) => { e.currentTarget.style.transform = 'scale(0.9)' }}
          onTouchEnd={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
        >
          ←
        </button>

        {/* Monogram + date — flex-grow so it centers across the full row */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '5px',
          }}
        >
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
          <span
            style={{
              fontSize: '12px',
              fontWeight: 400,
              letterSpacing: '0.04em',
              color: 'rgba(255,255,255,0.45)',
              textAlign: 'center',
            }}
          >
            Pacientes del {formatDate(date)}
          </span>
        </div>

        {/* Spacer — mirrors back button width so monogram stays optically centered */}
        <div style={{ width: '44px', flexShrink: 0 }} aria-hidden="true" />
      </header>

      {/* ── Main content ── */}
      <main
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px 24px 48px',
          gap: '16px',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '420px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          {/* ── Upload / preview zone ── */}
          <div
            role="button"
            tabIndex={0}
            aria-label="Fotografiar o seleccionar historia clínica"
            onClick={openPicker}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') openPicker() }}
            style={{
              width: '100%',
              aspectRatio: '4 / 3',
              borderRadius: '16px',
              border: image
                ? '2px solid rgba(255,255,255,0.65)'
                : '2px dashed rgba(255,255,255,0.25)',
              background: image ? 'none' : 'rgba(255,255,255,0.04)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '14px',
              overflow: 'hidden',
              transition: 'border-color 200ms ease, background 200ms ease',
              outline: 'none',
            }}
            onFocus={(e) => {
              if (!image) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.5)'
            }}
            onBlur={(e) => {
              if (!image) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'
            }}
            onMouseEnter={(e) => {
              if (!image) e.currentTarget.style.background = 'rgba(255,255,255,0.07)'
            }}
            onMouseLeave={(e) => {
              if (!image) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
            }}
          >
            {image ? (
              <img
                src={image}
                alt="Historia clínica seleccionada"
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            ) : (
              <>
                {/* Camera icon — inline SVG, no library */}
                <svg
                  width="44"
                  height="36"
                  viewBox="0 0 44 36"
                  fill="none"
                  aria-hidden="true"
                  style={{ opacity: 0.45 }}
                >
                  <rect x="1" y="8" width="42" height="26" rx="5" stroke="white" strokeWidth="1.8" />
                  <circle cx="22" cy="21" r="8" stroke="white" strokeWidth="1.8" />
                  <path d="M15 8L17.5 2H26.5L29 8" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="36" cy="14" r="2" fill="white" />
                </svg>

                <span
                  style={{
                    fontSize: '17px',
                    fontWeight: 500,
                    color: '#ffffff',
                    textAlign: 'center',
                    lineHeight: 1.3,
                    letterSpacing: '0.01em',
                    padding: '0 16px',
                  }}
                >
                  Fotografiar historia clínica
                </span>

                <span
                  style={{
                    fontSize: '13px',
                    fontWeight: 400,
                    color: 'rgba(255,255,255,0.4)',
                    textAlign: 'center',
                    letterSpacing: '0.01em',
                  }}
                >
                  o toca para seleccionar una imagen
                </span>
              </>
            )}
          </div>

          {/* Hidden file input */}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            style={{ display: 'none' }}
            aria-hidden="true"
            tabIndex={-1}
          />

          {/* Change image — only when preview is showing */}
          {image && (
            <button
              onClick={openPicker}
              style={{
                fontFamily: 'Outfit, sans-serif',
                fontSize: '13px',
                fontWeight: 400,
                color: 'rgba(255,255,255,0.45)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'center',
                textDecoration: 'underline',
                textDecorationColor: 'rgba(255,255,255,0.25)',
                textUnderlineOffset: '3px',
                padding: '2px 0',
                transition: 'color 150ms ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.75)' }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.45)' }}
            >
              Cambiar imagen
            </button>
          )}

          {/* ── Extraer datos ── */}
          <button
            onClick={handleExtract}
            disabled={!image}
            aria-disabled={!image}
            style={{
              fontFamily: 'Outfit, sans-serif',
              fontSize: '18px',
              fontWeight: 600,
              color: image ? '#172137' : 'rgba(23,33,55,0.45)',
              background: image ? '#ffffff' : 'rgba(255,255,255,0.22)',
              border: 'none',
              borderRadius: '12px',
              padding: '20px',
              width: '100%',
              minHeight: '64px',
              cursor: image ? 'pointer' : 'default',
              transition: 'background 200ms ease, color 200ms ease, transform 100ms ease',
              letterSpacing: '0.02em',
              marginTop: image ? '0' : '8px',
            }}
            onMouseDown={(e) => { if (image) e.currentTarget.style.transform = 'scale(0.98)' }}
            onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
            onTouchStart={(e) => { if (image) e.currentTarget.style.transform = 'scale(0.98)' }}
            onTouchEnd={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
          >
            Extraer datos
          </button>

          {/* Privacy note */}
          <p
            style={{
              fontSize: '12px',
              fontWeight: 400,
              color: 'rgba(255,255,255,0.28)',
              textAlign: 'center',
              margin: 0,
              letterSpacing: '0.02em',
              lineHeight: 1.5,
            }}
          >
            Los datos se procesan de forma segura y no se almacenan
          </p>
        </div>
      </main>
    </div>
  )
}
