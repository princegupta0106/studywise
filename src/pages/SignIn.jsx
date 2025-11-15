import React, { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useCachedAuth } from '../contexts/CachedAuthContext'
import logoSvg from '../assets/logo.svg'

export default function SignIn() {
  const { user, signInWithGoogle, loading } = useCachedAuth() || {}
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/'

  // Listen for user authentication and redirect
  useEffect(() => {
    if (user && !loading) {
      console.log('User authenticated in SignIn component, redirecting to:', from)
      navigate(from, { replace: true })
    }
  }, [user, loading, navigate, from])

  const handleSignIn = async () => {
    try {
      const result = await signInWithGoogle()
      console.log('SignIn result:', result)
      // Navigation will be handled by the useEffect above when user state updates
    } catch (err) {
      console.error('Sign in failed', err)
      alert('Sign in failed')
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, var(--bg) 0%, #0a0f1a 50%, var(--bg) 100%)',
      padding: '20px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '420px',
        padding: '48px 32px',
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.4), 0 8px 16px rgba(0,0,0,0.2)',
        backdropFilter: 'blur(10px)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decorative gradient overlay */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: 'linear-gradient(90deg, var(--accent), var(--yellow), var(--accent))',
          opacity: 0.8
        }} />

        {/* Logo and brand */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '80px',
            height: '80px',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '20px',
            marginBottom: '8px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <img 
              src={logoSvg} 
              alt="Padho BC Logo" 
              style={{ width: '48px', height: '48px' }}
            />
          </div>
          <h1 style={{
            margin: 0,
            fontSize: '28px',
            fontWeight: '700',
            color: 'var(--text-bright)',
            marginBottom: '8px',
            letterSpacing: '-0.5px'
          }}>
            Padho BC
          </h1>
          <p style={{
            margin: 0,
            fontSize: '16px',
            color: 'var(--muted)',
            lineHeight: '1.5'
          }}>
            Your learning journey starts here
          </p>
        </div>

        {/* Sign in section */}
        <div style={{ marginBottom: '24px' }}>
          {/* <h2 style={{
            margin: 0,
            marginBottom: '8px',
            fontSize: '24px',
            fontWeight: '600',
            color: 'var(--text-bright)',
            textAlign: 'center'
          }}>
            Welcome back
          </h2>
          <p style={{
            margin: 0,
            marginBottom: '24px',
            fontSize: '15px',
            color: 'var(--muted)',
            textAlign: 'center',
            lineHeight: '1.4'
          }}>
            Sign in to access your courses and continue learning
          </p> */}

          {/* BITS Pilani restriction notice */}
          <div style={{
            padding: '12px 16px',
            background: 'rgba(59, 130, 246, 0.1)',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            borderRadius: '8px',
            marginBottom: '24px'
          }}>
            <p style={{
              margin: 0,
              fontSize: '13px',
              color: '#60a5fa',
              textAlign: 'center',
              lineHeight: '1.4'
            }}>
              <strong>📚 BITS Pilani Students Only</strong><br />
              Access is restricted to BITS Pilani email addresses only
            </p>
          </div>

          <button 
            onClick={handleSignIn} 
            disabled={loading}
            style={{
              width: '100%',
              padding: '16px 24px',
              fontSize: '16px',
              fontWeight: '600',
              border: 'none',
              borderRadius: '12px',
              background: loading ? 'var(--muted)' : 'linear-gradient(135deg, var(--accent), var(--accent-600))',
              color: 'white',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: loading ? 'none' : '0 8px 16px rgba(0, 122, 204, 0.3)',
              opacity: loading ? 0.7 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px'
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.target.style.transform = 'translateY(-2px)'
                e.target.style.boxShadow = '0 12px 24px rgba(0, 122, 204, 0.4)'
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.target.style.transform = 'translateY(0)'
                e.target.style.boxShadow = '0 8px 16px rgba(0, 122, 204, 0.3)'
              }
            }}
          >
            {loading ? (
              <>
                <div style={{
                  width: '20px',
                  height: '20px',
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTop: '2px solid white',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                Signing in...
              </>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </>
            )}
          </button>
        </div>

        {/* Footer text */}
        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <p style={{
            margin: 0,
            fontSize: '13px',
            color: 'var(--muted)',
            lineHeight: '1.4'
          }}>
            Developed with ❤️ by the Prince Gupta<br></br>
          </p>
        </div>
      </div>

      {/* Add CSS animation for loading spinner */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
