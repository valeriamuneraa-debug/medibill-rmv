import { openDB } from 'idb'

const DB_NAME = 'medibill-rmv'
const DB_VERSION = 2

export async function getDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      if (oldVersion < 1) {
        const sessions = db.createObjectStore('sessions', { keyPath: 'id', autoIncrement: true })
        sessions.createIndex('date', 'date', { unique: false })
        const patients = db.createObjectStore('patients', { keyPath: 'id', autoIncrement: true })
        patients.createIndex('sessionId', 'sessionId', { unique: false })
      }
      if (oldVersion < 2) {
        db.createObjectStore('workbooks', {})
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

export async function getWorkbook() {
  const db = await getDB()
  return db.get('workbooks', 'template')
}

export async function setWorkbook(base64Data) {
  const db = await getDB()
  return db.put('workbooks', base64Data, 'template')
}

export async function hasWorkbook() {
  const val = await getWorkbook()
  return val != null
}
