import { useRef, useState } from 'react'
import { storeUploadedWorkbook, migrateWorkbook } from '../lib/xlsx.js'

function SpreadsheetIcon() {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none" aria-hidden="true">
      <rect x="5" y="3" width="34" height="38" rx="3" stroke="rgba(255,255,255,0.5)" strokeWidth="1.8" />
      <path d="M13 13H31M13 21H31M13 29H24" stroke="rgba(255,255,255,0.5)" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M5 13H39" stroke="rgba(255,255,255,0.25)" strokeWidth="1.2" />
      <path d="M17 3V41" stroke="rgba(255,255,255,0.2)" strokeWidth="1.2" />
    </svg>
  )
}

function UploadIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M9 12V4M9 4L6 7M9 4L12 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 12v2a1 1 0 001 1h10a1 1 0 001-1v-2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

export default function Setup({ onReady }) {
  const inputRef       = useRef(null)
  const changeInputRef = useRef(null)

  const [selectedFile, setSelectedFile] = useState(null)
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState(null)

  // Migration dialog state
  const [pendingFile, setPendingFile]       = useState(null)
  const [dialogPhase, setDialogPhase]       = useState(null) // null | 'options' | 'loading' | 'success'
  const [migrationCount, setMigrationCount] = useState(0)
  const [migrateError, setMigrateError]     = useState(null)

  function handleFileChange(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!file.name.endsWith('.xlsx')) {
      setError('Solo se aceptan archivos .xlsx')
      setSelectedFile(null)
      return
    }
    setError(null)
    setSelectedFile(file)
  }

  function handleChangeFileSelected(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!file.name.endsWith('.xlsx')) {
      setError('Solo se aceptan archivos .xlsx')
      return
    }
    setError(null)
    setPendingFile(file)
    setMigrateError(null)
    setDialogPhase('options')
  }

  async function handleUpload() {
    if (!selectedFile || loading) return
    setLoading(true)
    setError(null)
    try {
      await storeUploadedWorkbook(selectedFile)
      onReady()
    } catch (err) {
      setError(err.message ?? 'Error al procesar el archivo')
      setLoading(false)
    }
  }

  async function handleMigrate(keepPatients) {
    if (!pendingFile) return
    setDialogPhase('loading')
    setMigrateError(null)
    try {
      const count = await migrateWorkbook(pendingFile, keepPatients)
      setMigrationCount(count)
      setDialogPhase('success')
    } catch (err) {
      setMigrateError(err.message ?? 'Error al procesar el archivo')
      setDialogPhase('options')
    }
  }

  function handleMigrationSuccess() {
    setDialogPhase(null)
    setPendingFile(null)
    setMigrationCount(0)
    onReady()
  }

  function closeMigrationDialog() {
    if (dialogPhase === 'loading') return
    setDialogPhase(null)
    setPendingFile(null)
    setMigrateError(null)
  }

  return (
    <div
      className="min-h-dvh flex flex-col items-center justify-between"
      style={{ background: '#172137', fontFamily: 'Outfit, sans-serif', color: '#ffffff', padding: '0 24px' }}
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
          <span style={{
            fontSize: '13px',
            fontWeight: 400,
            letterSpacing: '0.18em',
            color: 'rgba(255,255,255,0.45)',
            textTransform: 'uppercase',
          }}>
            MediBill
          </span>
        </div>

        {/* Label */}
        <p style={{
          fontSize: 'clamp(18px, 5vw, 22px)',
          fontWeight: 400,
          color: '#ffffff',
          lineHeight: 1.4,
          textAlign: 'center',
          margin: 0,
        }}>
          Carga tu archivo Pacientes_2026.xlsx para comenzar
        </p>

        {/* File picker zone */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={loading}
            aria-label="Seleccionar archivo Excel"
            style={{
              width: '100%',
              minHeight: '120px',
              background: selectedFile ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.06)',
              border: `2px dashed ${selectedFile ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.25)'}`,
              borderRadius: '14px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              cursor: loading ? 'default' : 'pointer',
              transition: 'background 150ms ease, border-color 150ms ease, transform 100ms ease',
              padding: '20px',
              touchAction: 'manipulation',
            }}
            onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = 'rgba(255,255,255,0.11)' }}
            onMouseLeave={(e) => { if (!loading) e.currentTarget.style.background = selectedFile ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.06)' }}
            onMouseDown={(e) => { if (!loading) e.currentTarget.style.transform = 'scale(0.99)' }}
            onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
            onTouchStart={(e) => { if (!loading) e.currentTarget.style.transform = 'scale(0.99)' }}
            onTouchEnd={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
          >
            <SpreadsheetIcon />
            {selectedFile ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontSize: '15px', fontWeight: 600, color: '#ffffff', letterSpacing: '0.01em' }}>
                  {selectedFile.name}
                </span>
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', fontWeight: 400 }}>
                  Toca para cambiar archivo
                </span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontSize: '15px', fontWeight: 500, color: 'rgba(255,255,255,0.8)' }}>
                  Seleccionar archivo .xlsx
                </span>
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.38)', fontWeight: 400 }}>
                  Solo archivos Excel (.xlsx)
                </span>
              </div>
            )}
          </button>

          {/* Error */}
          {error && (
            <p
              role="alert"
              style={{
                fontSize: '13px',
                color: 'rgba(255,120,120,0.9)',
                textAlign: 'center',
                margin: 0,
                lineHeight: 1.5,
              }}
            >
              {error}
            </p>
          )}

          {/* Cargar plantilla button */}
          <button
            type="button"
            onClick={handleUpload}
            disabled={!selectedFile || loading}
            aria-disabled={!selectedFile || loading}
            aria-busy={loading}
            style={{
              fontFamily: 'Outfit, sans-serif',
              fontSize: '18px',
              fontWeight: 600,
              color: (selectedFile && !loading) ? '#172137' : 'rgba(23,33,55,0.45)',
              background: (selectedFile && !loading) ? '#ffffff' : 'rgba(255,255,255,0.22)',
              border: 'none',
              borderRadius: '12px',
              padding: '20px',
              width: '100%',
              minHeight: '64px',
              cursor: (selectedFile && !loading) ? 'pointer' : 'default',
              touchAction: 'manipulation',
              transition: 'background 200ms ease, color 200ms ease, transform 100ms ease',
              letterSpacing: '0.02em',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
            }}
            onMouseDown={(e) => { if (selectedFile && !loading) e.currentTarget.style.transform = 'scale(0.98)' }}
            onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
            onTouchStart={(e) => { if (selectedFile && !loading) e.currentTarget.style.transform = 'scale(0.98)' }}
            onTouchEnd={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
          >
            {loading ? (
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
                Procesando...
              </>
            ) : (
              <>
                <UploadIcon />
                Cargar plantilla
              </>
            )}
          </button>
        </div>

        {/* Explanatory note */}
        <p style={{
          fontSize: '13px',
          color: 'rgba(255,255,255,0.28)',
          textAlign: 'center',
          margin: 0,
          lineHeight: 1.7,
        }}>
          Tu plantilla se guarda en este dispositivo. Cada paciente que apruebes se agrega automáticamente.
          Exporta cuando quieras — siempre descarga el registro completo.
        </p>

        {/* Cambiar plantilla — replaces old Reiniciar */}
        <button
          type="button"
          onClick={() => changeInputRef.current?.click()}
          style={{
            fontFamily: 'Outfit, sans-serif',
            fontSize: '12px',
            fontWeight: 400,
            color: 'rgba(255,255,255,0.22)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            textDecoration: 'underline',
            textDecorationColor: 'rgba(255,255,255,0.15)',
            textUnderlineOffset: '3px',
            padding: '2px 0',
            marginTop: '-8px',
            touchAction: 'manipulation',
            transition: 'color 150ms ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.5)' }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.22)' }}
        >
          Cambiar plantilla
        </button>

      </div>

      <div style={{ flex: '1.4 1 0' }} />

      {/* Migration dialog */}
      {dialogPhase && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Cambiar plantilla"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            zIndex: 50,
          }}
          onClick={(e) => { if (e.target === e.currentTarget) closeMigrationDialog() }}
        >
          <div style={{
            background: '#172137',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '16px',
            padding: '28px 24px',
            width: '100%',
            maxWidth: '340px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}>

            {dialogPhase === 'options' && (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <p style={{
                    fontSize: '16px',
                    fontWeight: 600,
                    lineHeight: 1.5,
                    color: '#ffffff',
                    textAlign: 'center',
                    margin: 0,
                    fontFamily: 'Outfit, sans-serif',
                  }}>
                    ¿Qué hacer con los pacientes actuales?
                  </p>
                  <p style={{
                    fontSize: '13px',
                    color: 'rgba(255,255,255,0.45)',
                    textAlign: 'center',
                    margin: 0,
                    fontFamily: 'Outfit, sans-serif',
                    lineHeight: 1.5,
                  }}>
                    {pendingFile?.name}
                  </p>
                </div>

                {migrateError && (
                  <p role="alert" style={{
                    fontSize: '13px',
                    color: 'rgba(255,120,120,0.9)',
                    textAlign: 'center',
                    margin: '-8px 0 0',
                    lineHeight: 1.5,
                    fontFamily: 'Outfit, sans-serif',
                  }}>
                    {migrateError}
                  </p>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {/* Option A — primary (keep patients, safe) */}
                  <button
                    onClick={() => handleMigrate(true)}
                    style={{
                      fontFamily: 'Outfit, sans-serif',
                      fontSize: '16px',
                      fontWeight: 600,
                      color: '#172137',
                      background: '#ffffff',
                      border: 'none',
                      borderRadius: '12px',
                      padding: '16px',
                      minHeight: '56px',
                      cursor: 'pointer',
                      touchAction: 'manipulation',
                      transition: 'transform 100ms ease',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '3px',
                    }}
                    onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.98)' }}
                    onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
                    onTouchStart={(e) => { e.currentTarget.style.transform = 'scale(0.98)' }}
                    onTouchEnd={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
                  >
                    Mantener mis pacientes
                    <span style={{ fontSize: '12px', fontWeight: 400, color: 'rgba(23,33,55,0.55)' }}>
                      Se copian a la nueva plantilla
                    </span>
                  </button>

                  {/* Option B — ghost (destructive: start fresh) */}
                  <button
                    onClick={() => handleMigrate(false)}
                    style={{
                      fontFamily: 'Outfit, sans-serif',
                      fontSize: '15px',
                      fontWeight: 500,
                      color: 'rgba(255,255,255,0.65)',
                      background: 'none',
                      border: '1.5px solid rgba(255,255,255,0.25)',
                      borderRadius: '12px',
                      padding: '14px',
                      minHeight: '52px',
                      cursor: 'pointer',
                      touchAction: 'manipulation',
                      transition: 'transform 100ms ease, color 150ms ease',
                    }}
                    onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.98)' }}
                    onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
                    onTouchStart={(e) => { e.currentTarget.style.transform = 'scale(0.98)' }}
                    onTouchEnd={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
                  >
                    Empezar desde cero
                  </button>

                  <button
                    onClick={closeMigrationDialog}
                    style={{
                      fontFamily: 'Outfit, sans-serif',
                      fontSize: '14px',
                      fontWeight: 400,
                      color: 'rgba(255,255,255,0.38)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '8px 0',
                      touchAction: 'manipulation',
                      transition: 'color 150ms ease',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.65)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.38)' }}
                  >
                    Cancelar
                  </button>
                </div>
              </>
            )}

            {dialogPhase === 'loading' && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '12px 0' }}>
                <div
                  className="animate-spin"
                  style={{
                    width: '32px',
                    height: '32px',
                    border: '2.5px solid rgba(255,255,255,0.2)',
                    borderTopColor: '#ffffff',
                    borderRadius: '50%',
                  }}
                  aria-hidden="true"
                />
                <p style={{
                  fontSize: '16px',
                  fontWeight: 500,
                  color: '#ffffff',
                  textAlign: 'center',
                  margin: 0,
                  fontFamily: 'Outfit, sans-serif',
                }}>
                  Procesando plantilla...
                </p>
              </div>
            )}

            {dialogPhase === 'success' && (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <p style={{
                    fontSize: '16px',
                    fontWeight: 600,
                    lineHeight: 1.5,
                    color: '#ffffff',
                    textAlign: 'center',
                    margin: 0,
                    fontFamily: 'Outfit, sans-serif',
                  }}>
                    {migrationCount > 0
                      ? `¡Listo! ${migrationCount} paciente${migrationCount !== 1 ? 's' : ''} migrado${migrationCount !== 1 ? 's' : ''}`
                      : '¡Plantilla cargada!'}
                  </p>
                  {migrationCount > 0 && (
                    <p style={{
                      fontSize: '13px',
                      color: 'rgba(255,255,255,0.45)',
                      textAlign: 'center',
                      margin: 0,
                      fontFamily: 'Outfit, sans-serif',
                      lineHeight: 1.5,
                    }}>
                      Todos los registros se copiaron a la nueva plantilla.
                    </p>
                  )}
                </div>
                <button
                  onClick={handleMigrationSuccess}
                  style={{
                    fontFamily: 'Outfit, sans-serif',
                    fontSize: '16px',
                    fontWeight: 600,
                    color: '#172137',
                    background: '#ffffff',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '16px',
                    minHeight: '56px',
                    cursor: 'pointer',
                    touchAction: 'manipulation',
                    transition: 'transform 100ms ease',
                  }}
                  onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.98)' }}
                  onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
                  onTouchStart={(e) => { e.currentTarget.style.transform = 'scale(0.98)' }}
                  onTouchEnd={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
                >
                  Continuar
                </button>
              </>
            )}

          </div>
        </div>
      )}

      {/* Primary upload input */}
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx"
        onChange={handleFileChange}
        style={{ display: 'none' }}
        aria-hidden="true"
        tabIndex={-1}
      />
      {/* Change template input */}
      <input
        ref={changeInputRef}
        type="file"
        accept=".xlsx"
        onChange={handleChangeFileSelected}
        style={{ display: 'none' }}
        aria-hidden="true"
        tabIndex={-1}
      />
    </div>
  )
}
