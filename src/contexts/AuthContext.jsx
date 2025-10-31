import React, { createContext, useContext, useEffect, useState } from 'react'
import { auth, googleProvider } from '../firebase/config'
import { signInWithPopup, onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [shouldAutoSignIn, setShouldAutoSignIn] = useState(false)

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
      
      if (!u) {
        setShouldAutoSignIn(true)
      }
    })
    
    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [])

  // Auto sign-in after first user interaction
  useEffect(() => {
    if (!shouldAutoSignIn || user || loading) return

    const handleInteraction = () => {
      console.log('User interaction detected, triggering sign-in...')
      setShouldAutoSignIn(false)
      signInWithGoogle()
    }

    document.addEventListener('click', handleInteraction, { once: true })
    document.addEventListener('keydown', handleInteraction, { once: true })

    return () => {
      document.removeEventListener('click', handleInteraction)
      document.removeEventListener('keydown', handleInteraction)
    }
  }, [shouldAutoSignIn, user, loading])

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
