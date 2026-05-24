import { useState, useRef, useEffect } from 'react'

function formatDate(isoDate) {
  if (!isoDate) return ''
  const [year, month, day] = isoDate.split('-').map(Number)
  const months = [
    'enero','febrero','marzo','abril','mayo','junio',
    'julio','agosto','septiembre','octubre','noviembre','diciembre',
  ]
  return `${day} de ${months[month - 1]} de ${year}`
}

// ── Image compression — max 1200px longest side, JPEG 0.7 ──────────────────

const compress = (file) => new Promise(resolve => {
  const img = new Image()
  const url = URL.createObjectURL(file)
  img.onload = () => {
    URL.revokeObjectURL(url)
    const canvas = document.createElement('canvas')
    const ratio = Math.min(1200 / img.width, 1200 / img.height, 1)
    canvas.width  = img.width  * ratio
    canvas.height = img.height * ratio
    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
    canvas.toBlob(blob => {
      const reader = new FileReader()
      reader.onload = e => resolve(e.target.result.split(',')[1])
      reader.readAsDataURL(blob)
    }, 'image/jpeg', 0.7)
  }
  img.src = url
})

// ── Loading progress messages ────────────────────────────────────────────────

const LOADING_MSGS = [
  'Leyendo nombre...',
  'Leyendo documento...',
  'Leyendo contacto...',
]

// ── Icons — consistent 1.8px stroke throughout ──────────────────────────────

function CameraIcon({ color }) {
  return (
    <svg width="28" height="24" viewBox="0 0 28 24" fill="none" aria-hidden="true">
      <rect x="1" y="5" width="26" height="17" rx="3.5" stroke={color} strokeWidth="1.8" />
      <circle cx="14" cy="13.5" r="5" stroke={color} strokeWidth="1.8" />
      <path d="M9 5L11 1H17L19 5" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="23" cy="9" r="1.5" fill={color} />
    </svg>
  )
}

function GalleryIcon({ color }) {
  return (
    <svg width="28" height="24" viewBox="0 0 28 24" fill="none" aria-hidden="true">
      <rect x="1" y="1" width="26" height="22" rx="3.5" stroke={color} strokeWidth="1.8" />
      <circle cx="8.5" cy="8.5" r="2.5" stroke={color} strokeWidth="1.8" />
      <path d="M1 17L9 10L14 15L19 11L27 17" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function PdfIcon({ color }) {
  return (
    <svg width="36" height="44" viewBox="0 0 36 44" fill="none" aria-hidden="true">
      <path
        d="M3 3C3 1.89543 3.89543 1 5 1H23L35 13V41C35 42.1046 34.1046 43 33 43H5C3.89543 43 3 42.1046 3 41V3Z"
        stroke={color} strokeWidth="1.8"
      />
      <path d="M23 1V13H35" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M9 21H27M9 27H27M9 33H18" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

// ── Component ────────────────────────────────────────────────────────────────

export default function Camera({ date, onBack, onReview }) {
  const [image, setImage] = useState(null)          // base64 dataURL
  const [mediaType, setMediaType] = useState(null)  // MIME type of selected file
  const [stream, setStream] = useState(null)
  const [loading, setLoading] = useState(false)
  const [loadingStep, setLoadingStep] = useState(0)
  const [error, setError] = useState(null)

  const cameraInputRef = useRef(null)
  const galleryInputRef = useRef(null)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)

  const isPdf = mediaType === 'application/pdf'

  // Attach getUserMedia stream to video element after render
  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream
    }
  }, [stream])

  // Stop stream tracks on unmount or when stream changes
  useEffect(() => {
    return () => { stream?.getTracks().forEach(t => t.stop()) }
  }, [stream])

  // Cycle loading messages every 1.5s while extraction is running
  useEffect(() => {
    if (!loading) { setLoadingStep(0); return }
    const id = setInterval(() => setLoadingStep(s => (s + 1) % LOADING_MSGS.length), 1500)
    return () => clearInterval(id)
  }, [loading])

  async function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setError(null)
    if (file.type === 'application/pdf') {
      setMediaType('application/pdf')
      const reader = new FileReader()
      reader.onload = (ev) => setImage(ev.target.result)
      reader.readAsDataURL(file)
    } else {
      // Compress to max 1200px / JPEG 0.7 before storing for preview and API
      setMediaType('image/jpeg')
      const b64 = await compress(file)
      setImage('data:image/jpeg;base64,' + b64)
    }
  }

  async function handleCameraClick() {
    const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)
    if (isMobile || !navigator.mediaDevices?.getUserMedia) {
      cameraInputRef.current?.click()
      return
    }
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false })
      setStream(s)
    } catch {
      // Permission denied or no camera — fall back to file picker
      cameraInputRef.current?.click()
    }
  }

  function captureFromWebcam() {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return
    const ratio = Math.min(1200 / video.videoWidth, 1200 / video.videoHeight, 1)
    canvas.width  = video.videoWidth  * ratio
    canvas.height = video.videoHeight * ratio
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height)
    setImage(canvas.toDataURL('image/jpeg', 0.7))
    setMediaType('image/jpeg')
    stopStream()
  }

  function stopStream() {
    stream?.getTracks().forEach(t => t.stop())
    setStream(null)
  }

  // Clears all file state and any prior error
  function clearFile() {
    setImage(null)
    setMediaType(null)
    setError(null)
  }

  async function handleExtract() {
    if (!image || loading) return
    setLoading(true)
    setError(null)
    try {
      const resp = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image, mediaType }),
      })
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
      const patient = await resp.json()
      onReview(patient, image)
    } catch {
      setError('No se pudo extraer la información. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  // Shared scale-press handlers (§7 scale-feedback, §2 press-feedback)
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
      {/* ── Header ── */}
      <header style={{ display: 'flex', alignItems: 'center', padding: '16px 20px 12px' }}>
        {/* Back button — 44px wide, 64px tall touch target */}
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

        {/* Monogram + date — flex-grow centers it across the full header */}
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

        {/* Spacer mirrors back button width so monogram stays optically centered */}
        <div style={{ width: '44px', flexShrink: 0 }} aria-hidden="true" />
      </header>

      {/* ── Main content ── */}
      <main style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 24px 48px',
        gap: '16px',
      }}>
        <div style={{ width: '100%', maxWidth: '420px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* ── Upload / preview / webcam zone ── */}
          <div style={{
            width: '100%',
            borderRadius: '16px',
            border: image
              ? '2px solid rgba(255,255,255,0.65)'
              : '2px dashed rgba(255,255,255,0.22)',
            background: image ? 'none' : 'rgba(255,255,255,0.04)',
            overflow: 'hidden',
            transition: 'border-color 200ms ease',
          }}>

            {image ? (
              isPdf ? (
                /* ── PDF placeholder — 4:3 to prevent CLS (§3 content-jumping) ── */
                <div
                  role="img"
                  aria-label="Documento PDF seleccionado — listo para extraer datos"
                  style={{
                    aspectRatio: '4 / 3',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px',
                    background: 'rgba(255,255,255,0.06)',
                  }}
                >
                  <PdfIcon color="rgba(255,255,255,0.72)" />
                  <span style={{
                    fontSize: '15px',
                    fontWeight: 500,
                    color: 'rgba(255,255,255,0.85)',
                    letterSpacing: '0.01em',
                  }}>
                    Documento PDF
                  </span>
                  <span style={{
                    fontSize: '12px',
                    color: 'rgba(255,255,255,0.4)',
                    letterSpacing: '0.01em',
                  }}>
                    Listo para extraer datos
                  </span>
                </div>
              ) : (
                /* ── Image preview ── */
                <img
                  src={image}
                  alt="Historia clínica seleccionada"
                  style={{ width: '100%', aspectRatio: '4 / 3', objectFit: 'cover', display: 'block' }}
                />
              )
            ) : stream ? (
              /* ── Webcam state ── */
              <div style={{ position: 'relative' }}>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{ width: '100%', aspectRatio: '4 / 3', objectFit: 'cover', display: 'block' }}
                />
                {/* Capture / cancel bar — flat navy overlay, no gradient */}
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  padding: '12px 16px',
                  background: 'rgba(23,33,55,0.88)',
                  display: 'flex',
                  gap: '12px',
                }}>
                  <button
                    onClick={stopStream}
                    style={{
                      flex: 1,
                      fontFamily: 'Outfit, sans-serif',
                      fontSize: '15px',
                      fontWeight: 500,
                      color: 'rgba(255,255,255,0.72)',
                      background: 'transparent',
                      border: '1.5px solid rgba(255,255,255,0.28)',
                      borderRadius: '10px',
                      padding: '12px',
                      minHeight: '48px',
                      cursor: 'pointer',
                      touchAction: 'manipulation',
                      transition: 'transform 100ms ease',
                    }}
                    {...press}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={captureFromWebcam}
                    style={{
                      flex: 2,
                      fontFamily: 'Outfit, sans-serif',
                      fontSize: '15px',
                      fontWeight: 600,
                      color: '#172137',
                      background: '#ffffff',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '12px',
                      minHeight: '48px',
                      cursor: 'pointer',
                      touchAction: 'manipulation',
                      transition: 'transform 100ms ease',
                    }}
                    {...press}
                  >
                    Capturar foto
                  </button>
                </div>
              </div>
            ) : (
              /* ── Empty state: two option buttons + divider ── */
              <div style={{ padding: '28px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

                {/* PRIMARY — solid white, navy text, camera icon */}
                <button
                  onClick={handleCameraClick}
                  aria-label="Fotografiar historia clínica del paciente"
                  style={{
                    fontFamily: 'Outfit, sans-serif',
                    fontSize: '17px',
                    fontWeight: 600,
                    color: '#172137',
                    background: '#ffffff',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '18px 20px',
                    minHeight: '72px',
                    width: '100%',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                    touchAction: 'manipulation',
                    transition: 'transform 150ms ease',
                    letterSpacing: '0.01em',
                  }}
                  {...press}
                >
                  <CameraIcon color="#172137" />
                  Fotografiar historia clínica
                </button>

                {/* Divider */}
                <div style={{ display: 'flex', alignItems: 'center' }} aria-hidden="true">
                  <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.18)' }} />
                  <span style={{
                    padding: '0 14px',
                    fontSize: '13px',
                    fontWeight: 400,
                    color: 'rgba(255,255,255,0.38)',
                    letterSpacing: '0.06em',
                    lineHeight: 1,
                  }}>
                    o
                  </span>
                  <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.18)' }} />
                </div>

                {/* SECONDARY — ghost, white border, gallery icon; accepts images + PDFs */}
                <button
                  onClick={() => galleryInputRef.current?.click()}
                  aria-label="Elegir imagen o documento PDF de galería o archivos"
                  style={{
                    fontFamily: 'Outfit, sans-serif',
                    fontSize: '15px',
                    fontWeight: 500,
                    color: '#ffffff',
                    background: 'transparent',
                    border: '1.5px solid rgba(255,255,255,0.32)',
                    borderRadius: '12px',
                    padding: '14px 20px',
                    minHeight: '64px',
                    width: '100%',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '7px',
                    touchAction: 'manipulation',
                    transition: 'transform 150ms ease, background 150ms ease, border-color 150ms ease',
                    letterSpacing: '0.01em',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.07)'
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.55)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.32)'
                    e.currentTarget.style.transform = 'scale(1)'
                  }}
                  onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.98)' }}
                  onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
                  onTouchStart={(e) => { e.currentTarget.style.transform = 'scale(0.98)' }}
                  onTouchEnd={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
                >
                  <GalleryIcon color="#ffffff" />
                  Elegir de fotos o archivos
                </button>

              </div>
            )}
          </div>

          {/* Hidden inputs — both accept images AND PDFs */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*,application/pdf"
            capture="environment"
            onChange={handleFileChange}
            style={{ display: 'none' }}
            aria-hidden="true"
            tabIndex={-1}
          />
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*,application/pdf"
            onChange={handleFileChange}
            style={{ display: 'none' }}
            aria-hidden="true"
            tabIndex={-1}
          />

          {/* Offscreen canvas for webcam snapshot */}
          <canvas ref={canvasRef} style={{ display: 'none' }} aria-hidden="true" />

          {/* Change file link — label adapts to file type */}
          {image && (
            <button
              onClick={clearFile}
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
                touchAction: 'manipulation',
                transition: 'color 150ms ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.75)' }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.45)' }}
            >
              {isPdf ? 'Cambiar archivo' : 'Cambiar imagen'}
            </button>
          )}

          {/* ── Extraer datos ── */}
          <button
            onClick={handleExtract}
            disabled={!image || loading}
            aria-disabled={!image || loading}
            aria-busy={loading}
            style={{
              fontFamily: 'Outfit, sans-serif',
              fontSize: '18px',
              fontWeight: 600,
              color: (image && !loading) ? '#172137' : 'rgba(23,33,55,0.45)',
              background: (image && !loading) ? '#ffffff' : 'rgba(255,255,255,0.22)',
              border: 'none',
              borderRadius: '12px',
              padding: '20px',
              width: '100%',
              minHeight: '64px',
              cursor: (image && !loading) ? 'pointer' : 'default',
              touchAction: 'manipulation',
              transition: 'background 200ms ease, color 200ms ease, transform 100ms ease',
              letterSpacing: '0.02em',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
            }}
            onMouseDown={(e) => { if (image && !loading) e.currentTarget.style.transform = 'scale(0.98)' }}
            onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
            onTouchStart={(e) => { if (image && !loading) e.currentTarget.style.transform = 'scale(0.98)' }}
            onTouchEnd={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
          >
            {loading ? (
              <>
                <div
                  className="animate-spin"
                  style={{
                    width: '18px',
                    height: '18px',
                    border: '2.5px solid rgba(23,33,55,0.18)',
                    borderTopColor: 'rgba(23,33,55,0.6)',
                    borderRadius: '50%',
                    flexShrink: 0,
                  }}
                />
                {LOADING_MSGS[loadingStep]}
              </>
            ) : 'Extraer datos'}
          </button>

          {/* Inline error — never navigates away, user can retry */}
          {error && (
            <p
              role="alert"
              style={{
                fontSize: '13px',
                fontWeight: 400,
                color: 'rgba(255,120,120,0.9)',
                textAlign: 'center',
                margin: '-4px 0 0',
                lineHeight: 1.5,
                letterSpacing: '0.01em',
              }}
            >
              {error}
            </p>
          )}

          {/* Privacy note */}
          <p style={{
            fontSize: '12px',
            fontWeight: 400,
            color: 'rgba(255,255,255,0.28)',
            textAlign: 'center',
            margin: 0,
            letterSpacing: '0.02em',
            lineHeight: 1.5,
          }}>
            Los datos se procesan de forma segura y no se almacenan
          </p>

        </div>
      </main>
    </div>
  )
}
