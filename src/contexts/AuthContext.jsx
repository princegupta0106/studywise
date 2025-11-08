import React, { createContext, useContext, useEffect, useState } from 'react'
import { auth, googleProvider } from '../firebase/config'
import { signInWithPopup, onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const signInWithGoogle = async () => {
    try {
      console.log('Signing in with Google popup...')
      setLoading(true)
      const result = await signInWithPopup(auth, googleProvider)
      console.log('Sign in successful:', result.user.email)
    } catch (error) {
      console.error('Sign in error:', error)
      setLoading(false)
    }
  }

  useEffect(() => {
    console.log('Setting up auth listener...')
    
    // Set up Firebase auth listener
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      console.log('Auth state changed:', u ? u.email : 'No user')
      setUser(u)
      setLoading(false)
      
      // no-op when there's no user; signing in is handled by the app routes/sign-in page
    })
    
    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [])

  // NOTE: removed auto sign-in behavior. The app now redirects unauthenticated users to /signin.

  const signOut = async () => {
    setLoading(true)
    try {
      await firebaseSignOut(auth)
    } finally {
      setLoading(false)
    }
  }

  const value = { user, loading, signInWithGoogle, signOut }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
