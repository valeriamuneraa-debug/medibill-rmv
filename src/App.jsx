import { useEffect, useState } from 'react'
import DatePicker from './screens/DatePicker'
import Camera from './screens/Camera'
import Review from './screens/Review'
import Export from './screens/Export'
import Setup from './screens/Setup'
import Success from './screens/Success'
import { hasWorkbook } from './lib/indexedDB.js'
import { appendPatient as dbAppendPatient, downloadWorkbook } from './lib/xlsx.js'

const SCREENS = {
  LOADING:     'LOADING',
  SETUP:       'SETUP',
  DATE_PICKER: 'DATE_PICKER',
  CAMERA:      'CAMERA',
  REVIEW:      'REVIEW',
  SUCCESS:     'SUCCESS',
  EXPORT:      'EXPORT',
}

export default function App() {
  const [screen, setScreen] = useState(SCREENS.LOADING)
  const [session, setSession] = useState({
    date: null,
    patients: [],
    currentPatient: null,
    currentImage: null,
    lastAdded: null,
  })
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    hasWorkbook().then((exists) => {
      setScreen(exists ? SCREENS.DATE_PICKER : SCREENS.SETUP)
    }).catch(() => {
      setScreen(SCREENS.SETUP)
    })
  }, [])

  function handleSetupReady() {
    setScreen(SCREENS.DATE_PICKER)
  }

  function handleDateSelected(date) {
    setSession((s) => ({ ...s, date }))
    setScreen(SCREENS.CAMERA)
  }

  function handleReview(patient, image) {
    setSession((s) => ({ ...s, currentPatient: patient, currentImage: image }))
    setScreen(SCREENS.REVIEW)
  }

  async function handleConfirm(editedPatient) {
    await dbAppendPatient(editedPatient, session.date)
    setSession((s) => ({
      ...s,
      patients: [...s.patients, editedPatient],
      currentPatient: null,
      currentImage: null,
      lastAdded: editedPatient,
    }))
    setScreen(SCREENS.SUCCESS)
  }

  function handleAddAnother() {
    setScreen(SCREENS.CAMERA)
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

  function handleExport() {
    setScreen(SCREENS.EXPORT)
  }

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
      return <DatePicker onContinue={handleDateSelected} />

    case SCREENS.CAMERA:
      return (
        <Camera
          date={session.date}
          onBack={() => setScreen(SCREENS.DATE_PICKER)}
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
      return <DatePicker onContinue={handleDateSelected} />
  }
}
