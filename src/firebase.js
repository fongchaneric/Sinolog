import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getDatabase } from 'firebase/database'

const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || (projectId ? `${projectId}.firebaseapp.com` : undefined),
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId,
  storageBucket: projectId ? `${projectId}.appspot.com` : undefined
}

export const firebaseApp = initializeApp(firebaseConfig)
export const auth = getAuth(firebaseApp)
export const db = getDatabase(firebaseApp)
export const googleProvider = new GoogleAuthProvider()

export const ADMIN_EMAIL = (import.meta.env.VITE_ADMIN_EMAIL || 'fongchaneric1@gmail.com').toLowerCase()
