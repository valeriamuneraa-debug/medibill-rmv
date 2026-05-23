import { useState } from 'react'
import DatePicker from './screens/DatePicker'
import Camera from './screens/Camera'
import Review from './screens/Review'
import Export from './screens/Export'

const SCREENS = {
  DATE_PICKER: 'DATE_PICKER',
  CAMERA: 'CAMERA',
  REVIEW: 'REVIEW',
  EXPORT: 'EXPORT',
}

export default function App() {
  const [screen, setScreen] = useState(SCREENS.DATE_PICKER)
  const [session, setSession] = useState({
    date: null,
    patients: [],
    currentPatient: null,
    currentImage: null,
  })

  function handleDateSelected(date) {
    setSession((s) => ({ ...s, date }))
    setScreen(SCREENS.CAMERA)
  }

  function handleReview(patient, image) {
    setSession((s) => ({ ...s, currentPatient: patient, currentImage: image }))
    setScreen(SCREENS.REVIEW)
  }

  function handleConfirm(editedPatient) {
    setSession((s) => ({
      ...s,
      patients: [...s.patients, editedPatient],
      currentPatient: null,
      currentImage: null,
    }))
    setScreen(SCREENS.CAMERA)
  }

  function handleExport() {
    setScreen(SCREENS.EXPORT)
  }

  function handleNewSession() {
    setSession({ date: null, patients: [], currentPatient: null, currentImage: null })
    setScreen(SCREENS.DATE_PICKER)
  }

  switch (screen) {
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
