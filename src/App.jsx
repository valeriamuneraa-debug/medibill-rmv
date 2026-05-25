import { Component, useEffect, useState } from 'react'
import DatePicker from './screens/DatePicker'
import Camera from './screens/Camera'
import Review from './screens/Review'
import Export from './screens/Export'
import Setup from './screens/Setup'
import Success from './screens/Success'
import NuevaFecha from './screens/NuevaFecha'
import Registry from './screens/Registry'
import PatientEdit from './screens/PatientEdit'
import ClinicalData from './screens/ClinicalData'
import { hasWorkbook } from './lib/indexedDB.js'
import { appendPatient as dbAppendPatient, downloadWorkbook, updatePatient, deletePatient } from './lib/xlsx.js'

export class AppErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }
  static getDerivedStateFromError(error) {
    return { error }
  }
  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            minHeight: '100dvh',
            background: '#172137',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'Outfit, sans-serif',
            color: '#ffffff',
            padding: '32px 24px',
            gap: '20px',
            textAlign: 'center',
          }}
        >
          <span style={{ fontSize: '32px', fontWeight: 700, letterSpacing: '0.22em' }}>RMV</span>
          <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.6)', maxWidth: '320px' }}>
            Algo salió mal. Recarga la página para continuar.
          </p>
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', maxWidth: '320px', wordBreak: 'break-all' }}>
            {this.state.error.message}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              fontFamily: 'Outfit, sans-serif',
              fontSize: '16px',
              fontWeight: 600,
              color: '#172137',
              background: '#ffffff',
              border: 'none',
              borderRadius: '12px',
              padding: '16px 32px',
              cursor: 'pointer',
            }}
          >
            Recargar
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

const SCREENS = {
  LOADING:      'LOADING',
  SETUP:        'SETUP',
  DATE_PICKER:  'DATE_PICKER',
  CAMERA:       'CAMERA',
  REVIEW:       'REVIEW',
  SUCCESS:      'SUCCESS',
  EXPORT:       'EXPORT',
  NUEVA_FECHA:   'NUEVA_FECHA',
  REGISTRY:      'REGISTRY',
  PATIENT_EDIT:  'PATIENT_EDIT',
  CLINICAL_DATA: 'CLINICAL_DATA',
}

export default function App() {
  const [screen, setScreen]         = useState(SCREENS.LOADING)
  const [cameraBack, setCameraBack] = useState(SCREENS.DATE_PICKER)
  const [editingPatient, setEditingPatient]     = useState(null)
  const [registryRefreshKey, setRegistryRefreshKey] = useState(0)
  const [exporting, setExporting]   = useState(false)
  const [session, setSession]       = useState({
    date: null,
    patients: [],
    currentPatient: null,
    currentImage: null,
    lastAdded: null,
  })

  useEffect(() => {
    hasWorkbook().then((exists) => {
      setScreen(exists ? SCREENS.DATE_PICKER : SCREENS.SETUP)
    }).catch(() => {
      setScreen(SCREENS.SETUP)
    })
  }, [])

  // ── Setup ──────────────────────────────────────────────────────────────────
  function handleSetupReady() {
    setScreen(SCREENS.DATE_PICKER)
  }

  // ── DatePicker ─────────────────────────────────────────────────────────────
  function handleDateSelected(date) {
    setSession((s) => ({ ...s, date }))
    setCameraBack(SCREENS.DATE_PICKER)
    setScreen(SCREENS.CAMERA)
  }

  function handleOpenRegistry() {
    setScreen(SCREENS.REGISTRY)
  }

  // ── Camera ─────────────────────────────────────────────────────────────────
  function handleReview(patient, image) {
    setSession((s) => ({ ...s, currentPatient: patient, currentImage: image }))
    setScreen(SCREENS.REVIEW)
  }

  // ── Review → ClinicalData → confirm ───────────────────────────────────────
  function handleConfirm(editedPatient) {
    setSession((s) => ({ ...s, currentPatient: editedPatient, currentImage: null }))
    setScreen(SCREENS.CLINICAL_DATA)
  }

  async function handleClinicalSave(patientWithClinical) {
    await dbAppendPatient(patientWithClinical, session.date)
    setSession((s) => ({
      ...s,
      patients: [...s.patients, patientWithClinical],
      currentPatient: null,
      lastAdded: patientWithClinical,
    }))
    setScreen(SCREENS.SUCCESS)
  }

  async function handleClinicalSkip(patient) {
    await dbAppendPatient(patient, session.date)
    setSession((s) => ({
      ...s,
      patients: [...s.patients, patient],
      currentPatient: null,
      lastAdded: patient,
    }))
    setScreen(SCREENS.SUCCESS)
  }

  // ── Success ────────────────────────────────────────────────────────────────
  function handleAddAnother() {
    setScreen(SCREENS.NUEVA_FECHA)
  }

  async function handleExportDownload() {
    setExporting(true)
    try {
      await downloadWorkbook(session.date)
    } finally {
      setExporting(false)
    }
  }

  function handleNewSession() {
    setSession({ date: null, patients: [], currentPatient: null, currentImage: null, lastAdded: null })
    setScreen(SCREENS.DATE_PICKER)
  }

  // ── NuevaFecha ─────────────────────────────────────────────────────────────
  function handleNuevaFechaSameDate() {
    setCameraBack(SCREENS.NUEVA_FECHA)
    setScreen(SCREENS.CAMERA)
  }

  function handleNuevaFechaChangeDate(newDate) {
    setSession((s) => ({ ...s, date: newDate }))
    setCameraBack(SCREENS.NUEVA_FECHA)
    setScreen(SCREENS.CAMERA)
  }

  // ── Export (legacy screen) ─────────────────────────────────────────────────
  function handleExport() {
    setScreen(SCREENS.EXPORT)
  }

  // ── Registry ───────────────────────────────────────────────────────────────
  function handleEditPatient(patient) {
    setEditingPatient(patient)
    setScreen(SCREENS.PATIENT_EDIT)
  }

  async function handleExportFromRegistry() {
    setExporting(true)
    try {
      const today = new Date().toISOString().split('T')[0]
      await downloadWorkbook(session.date || today)
    } finally {
      setExporting(false)
    }
  }

  // ── PatientEdit ────────────────────────────────────────────────────────────
  async function handleSavePatient(rowIndex, fields) {
    await updatePatient(rowIndex, fields)
    setRegistryRefreshKey((k) => k + 1)
    setScreen(SCREENS.REGISTRY)
  }

  async function handleDeletePatient(patientId) {
    await deletePatient(patientId)
    setRegistryRefreshKey((k) => k + 1)
    setScreen(SCREENS.REGISTRY)
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  switch (screen) {
    case SCREENS.LOADING:
      return (
        <div
          className="min-h-dvh flex items-center justify-center"
          style={{ background: '#172137' }}
          aria-busy="true"
          aria-label="Cargando"
        >
          <div
            className="animate-spin"
            style={{
              width: '36px',
              height: '36px',
              border: '3px solid rgba(255,255,255,0.2)',
              borderTopColor: '#ffffff',
              borderRadius: '50%',
            }}
          />
        </div>
      )

    case SCREENS.SETUP:
      return <Setup onReady={handleSetupReady} />

    case SCREENS.DATE_PICKER:
      return (
        <DatePicker
          onContinue={handleDateSelected}
          onRegistry={handleOpenRegistry}
        />
      )

    case SCREENS.CAMERA:
      return (
        <Camera
          date={session.date}
          onBack={() => setScreen(cameraBack)}
          onReview={handleReview}
        />
      )

    case SCREENS.REVIEW:
      return (
        <Review
          date={session.date}
          patient={session.currentPatient}
          image={session.currentImage}
          onBack={() => setScreen(SCREENS.CAMERA)}
          onConfirm={handleConfirm}
        />
      )

    case SCREENS.SUCCESS:
      return (
        <Success
          patient={session.lastAdded}
          date={session.date}
          onAddAnother={handleAddAnother}
          onExport={handleExportDownload}
          onNewSession={handleNewSession}
          exporting={exporting}
        />
      )

    case SCREENS.NUEVA_FECHA:
      return (
        <NuevaFecha
          date={session.date}
          onSameDate={handleNuevaFechaSameDate}
          onChangeDate={handleNuevaFechaChangeDate}
          onBack={() => setScreen(SCREENS.SUCCESS)}
        />
      )

    case SCREENS.REGISTRY:
      return (
        <Registry
          key={registryRefreshKey}
          onBack={() => setScreen(SCREENS.DATE_PICKER)}
          onEditPatient={handleEditPatient}
          onExport={handleExportFromRegistry}
          exporting={exporting}
          onDelete={handleDeletePatient}
        />
      )

    case SCREENS.CLINICAL_DATA:
      return (
        <ClinicalData
          patient={session.currentPatient}
          date={session.date}
          onSave={handleClinicalSave}
          onSkip={handleClinicalSkip}
        />
      )

    case SCREENS.PATIENT_EDIT:
      return (
        <PatientEdit
          patient={editingPatient}
          onBack={() => setScreen(SCREENS.REGISTRY)}
          onSave={handleSavePatient}
          onDelete={handleDeletePatient}
        />
      )

    case SCREENS.EXPORT:
      return (
        <Export
          date={session.date}
          patients={session.patients}
          onBack={() => setScreen(SCREENS.REVIEW)}
          onNewSession={handleNewSession}
        />
      )

    default:
      return <DatePicker onContinue={handleDateSelected} onRegistry={handleOpenRegistry} />
  }
}
