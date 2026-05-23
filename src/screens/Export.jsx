export default function Export({ date, patients, onBack, onNewSession }) {
  return (
    <div
      style={{
        minHeight: '100dvh',
        background: 'var(--navy)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Outfit, sans-serif',
        color: '#ffffff',
        padding: '24px',
        gap: '24px',
      }}
    >
      <h1 style={{ fontSize: '28px', fontWeight: 600, margin: 0 }}>Exportar</h1>
      <p style={{ opacity: 0.6, textAlign: 'center' }}>Pantalla en construcción</p>
      <button
        onClick={onBack}
        style={{
          fontFamily: 'Outfit, sans-serif',
          fontSize: '16px',
          fontWeight: 600,
          color: '#172137',
          background: '#ffffff',
          border: 'none',
          borderRadius: '10px',
          padding: '16px 32px',
          cursor: 'pointer',
        }}
      >
        Volver
      </button>
    </div>
  )
}
