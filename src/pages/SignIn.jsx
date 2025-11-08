import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useCachedAuth } from '../contexts/CachedAuthContext'

export default function SignIn() {
  const { signInWithGoogle, loading } = useCachedAuth() || {}
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/'

  const handleSignIn = async () => {
    try {
      await signInWithGoogle()
      // after sign in, navigate back to origin or home
      navigate(from, { replace: true })
    } catch (err) {
      console.error('Sign in failed', err)
      alert('Sign in failed')
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 360, padding: 24, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8 }}>
        <h2 style={{ margin: 0, marginBottom: 12, color: 'var(--text-bright)' }}>Sign in</h2>
        <p style={{ marginTop: 0, marginBottom: 18, color: 'var(--muted)' }}>Sign in to continue to StudyWise</p>

        <button onClick={handleSignIn} disabled={loading} className="w-full px-4 py-2 rounded btn btn-primary">
          {loading ? 'Signing in…' : 'Sign in with Google'}
        </button>

      </div>
    </div>
  )
}
