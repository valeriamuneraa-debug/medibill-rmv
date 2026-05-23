import { openDB } from 'idb'

const DB_NAME = 'medibill-rmv'
const DB_VERSION = 1

export async function getDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('sessions')) {
        const sessions = db.createObjectStore('sessions', { keyPath: 'id', autoIncrement: true })
        sessions.createIndex('date', 'date', { unique: false })
      }
      if (!db.objectStoreNames.contains('patients')) {
        const patients = db.createObjectStore('patients', { keyPath: 'id', autoIncrement: true })
        patients.createIndex('sessionId', 'sessionId', { unique: false })
      }
    },
  })
}

export async function saveSession(sessionData) {
  const db = await getDB()
  return db.add('sessions', sessionData)
}

export async function getSessionsByDate(date) {
  const db = await getDB()
  return db.getAllFromIndex('sessions', 'date', date)
}

export async function savePatient(patientData) {
  const db = await getDB()
  return db.add('patients', patientData)
}

export async function getPatientsBySession(sessionId) {
  const db = await getDB()
  return db.getAllFromIndex('patients', 'sessionId', sessionId)
}
