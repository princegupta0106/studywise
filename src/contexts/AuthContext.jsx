import React, { createContext, useContext, useEffect, useState } from 'react'
import { auth, googleProvider } from '../firebase/config'
import { signInWithPopup, onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth'

const AuthContext = createContext(null)

// Simple notification function
const showNotification = (message, type = 'error', duration = 6000) => {
  const notification = document.createElement('div')
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 9999;
    padding: 16px 24px;
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(10px);
    border: 1px solid;
    max-width: 400px;
    min-width: 300px;
    font-weight: 500;
    font-size: 14px;
    line-height: 1.5;
    animation: slideInFromRight 0.3s ease-out forwards;
    font-family: system-ui, -apple-system, sans-serif;
    ${type === 'error' ? 
      'background: rgba(239, 68, 68, 0.1); border-color: rgba(239, 68, 68, 0.3); color: #f87171;' :
      'background: rgba(34, 197, 94, 0.1); border-color: rgba(34, 197, 94, 0.3); color: #4ade80;'
    }
  `
  
  const icon = type === 'error' ? '🚫' : '✅'
  notification.innerHTML = `
    <div style="display: flex; align-items: flex-start; gap: 12px;">
      <div style="margin-top: 1px; flex-shrink: 0; font-size: 18px;">${icon}</div>
      <div style="flex: 1;">${message}</div>
      <button onclick="this.parentElement.parentElement.remove()" style="
        background: none; border: none; color: currentColor; cursor: pointer;
        padding: 0; margin-top: 1px; opacity: 0.7; font-size: 16px;
      ">×</button>
    </div>
  `
  
  // Add animation styles
  if (!document.querySelector('#notification-styles')) {
    const style = document.createElement('style')
    style.id = 'notification-styles'
    style.textContent = `
      @keyframes slideInFromRight {
        0% { transform: translateX(100%); opacity: 0; }
        100% { transform: translateX(0); opacity: 1; }
      }
    `
    document.head.appendChild(style)
  }
  
  document.body.appendChild(notification)
  
  // Auto remove after duration
  setTimeout(() => {
    if (notification.parentNode) {
      notification.remove()
    }
  }, duration)
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const signInWithGoogle = async () => {
    try {
      console.log('Signing in with Google popup...')
      setLoading(true)
      const result = await signInWithPopup(auth, googleProvider)
      
      // Check if the email belongs to BITS Pilani domain
      const userEmail = result.user.email
      console.log('User email:', userEmail)
      
      if (!userEmail || !userEmail.toLowerCase().includes('bits-pilani')) {
        console.error('Access denied: Only BITS Pilani email addresses are allowed')
        
        // Sign out the user immediately
        await firebaseSignOut(auth)
        
        // Show error notification
        showNotification(`
          <strong>🔒 Access Denied</strong><br/>
          Only BITS Pilani email addresses are allowed to access this platform.<br/><br/>
          <strong>Accepted domains:</strong><br/>
          • @pilani.bits-pilani.ac.in<br/>
          • @hyderabad.bits-pilani.ac.in<br/>
          • @goa.bits-pilani.ac.in<br/>
          • @dubai.bits-pilani.ac.in
        `, 'error', 8000)
        
        setLoading(false)
        return false // Indicate sign in was blocked
      }
      
      console.log('Sign in successful:', userEmail)
      showNotification(`
        <strong>Welcome to Padho BC!</strong><br/>
        Successfully signed in as <strong>${userEmail}</strong>
      `, 'success', 4000)
      
      // Wait for auth state to propagate before resolving
      return new Promise((resolve) => {
        setTimeout(() => {
          setLoading(false)
          resolve(result.user) // Return the user object
        }, 100)
      })
    } catch (error) {
      console.error('Sign in error:', error)
      showNotification('Sign in failed. Please try again.', 'error', 4000)
      setLoading(false)
      throw error // Re-throw the error so SignIn component can handle it
    }
  }

  useEffect(() => {
    console.log('Setting up auth listener...')
    
    // Set up Firebase auth listener
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      console.log('Auth state changed:', u ? u.email : 'No user')
      
      // If user exists, check if they have a BITS Pilani email
      if (u && u.email) {
        if (!u.email.toLowerCase().includes('bits-pilani')) {
          console.error('Unauthorized user detected, signing out:', u.email)
          
          // Sign out unauthorized user
          await firebaseSignOut(auth)
          
          showNotification(`
            <strong>⚠️ Unauthorized Access</strong><br/>
            Your session has been terminated.<br/>
            Only BITS Pilani email addresses are allowed.
          `, 'error', 6000)
          
          setUser(null)
          setLoading(false)
          return
        }
      }
      
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
