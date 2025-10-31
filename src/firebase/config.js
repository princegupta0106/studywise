// Firebase configuration initializer
// Uses Vite env variables: VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, VITE_FIREBASE_PROJECT_ID, VITE_FIREBASE_APP_ID
import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, setPersistence, browserLocalPersistence } from 'firebase/auth'
import { getFirestore, enableNetwork, disableNetwork, connectFirestoreEmulator, enableIndexedDbPersistence } from 'firebase/firestore'

// Read config from Vite env variables. These must be prefixed with VITE_ to be exposed to the client.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
}

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const googleProvider = new GoogleAuthProvider()
const db = getFirestore(app)

// Aggressive offline persistence setup
let persistenceEnabled = false

export async function initializeAggressiveCache() {
  if (persistenceEnabled) return
  
  try {
    // Enable IndexedDB persistence for instant offline access
    await enableIndexedDbPersistence(db, {
      synchronizeTabs: true,
      experimentalAutoDetectLongPolling: true
    })
    
    console.log('🚀 Firebase aggressive caching enabled - instant offline access!')
    persistenceEnabled = true
    
  } catch (err) {
    if (err.code === 'failed-precondition') {
      console.warn('⚠️ Multiple tabs open, limited caching enabled')
    } else if (err.code === 'unimplemented') {
      console.warn('⚠️ Browser doesn\'t support persistence')
    }
  }
}

// Initialize aggressive caching immediately - non-blocking
initializeAggressiveCache()

// Set persistence to local storage to retain login state
setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error('Error setting auth persistence:', error)
})

// Firebase cache utilities
export const enableFirebaseCache = () => enableNetwork(db)
export const disableFirebaseCache = () => disableNetwork(db)

export { app, auth, googleProvider, firebaseConfig, db }
