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
  })

  function handleDateSelected(date) {
    setSession((s) => ({ ...s, date }))
    setScreen(SCREENS.CAMERA)
  }

  function handleCapture(patientData) {
    setSession((s) => ({ ...s, patients: [...s.patients, patientData] }))
  }

  function handleReview() {
    setScreen(SCREENS.REVIEW)
  }

  function handleExport() {
    setScreen(SCREENS.EXPORT)
  }

  function handleNewSession() {
    setSession({ date: null, patients: [] })
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
          onCapture={handleCapture}
          onReview={handleReview}
        />
      )

    case SCREENS.REVIEW:
      return (
        <Review
          date={session.date}
          patients={session.patients}
          onBack={() => setScreen(SCREENS.CAMERA)}
          onExport={handleExport}
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
