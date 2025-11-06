import React, { useState } from 'react'
import { useCachedAuth } from '../contexts/CachedAuthContext'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import logoSvg from '../assets/logo.svg'

const Logo = () => (
  <img 
    src={logoSvg} 
    alt="StudyByte Logo" 
    height="50px" 
    width="50px" 
    className="logo-icon"
    style={{ backgroundColor: 'transparent' }}
  />
)

function initialsFrom(user) {
  if (!user) return 'U'
  const name = user.displayName || user.email || ''
  return name.split(' ').map(s => s[0] || '').slice(0, 2).join('').toUpperCase() || 'U'
}

function colorFromString(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (h << 5) - h + str.charCodeAt(i)
  const hue = Math.abs(h) % 360
  return `hsl(${hue} 70% 45%)`
}

function AvatarBox({ user, size = 36 }) {
  const initials = initialsFrom(user)
  const bg = colorFromString(user?.uid || user?.email || initials)
  const style = { width: size, height: size, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, background: bg, color: 'var(--bg)', fontWeight: 700 }
  return <div style={style} aria-hidden="true">{initials}</div>
}

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false)
  const toggleMenu = () => setIsOpen(v => !v)
  const navigate = useNavigate()
  const location = useLocation()
  const { user, isOffline } = useCachedAuth() || {}

  const isActiveLink = (path) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  const isInCourse = location.pathname.startsWith('/course/')

  return (
    <nav className="w-full sticky top-0 z-50">
      <div className="max-w-full mx-auto  sm:px-4 lg:px-6">
        <div className="flex items-center h-16">
          <div className="flex-shrink-0">
            <Link to="/" className="flex items-center space-x-3 logo-container transform transition-transform duration-300 ease-linear hover:scale-105">
              <Logo />
              <span className="font-bold text-lg brand-name hidden md:block">StudyWise</span>
            </Link>
          </div>
        {/* Desktop Navigation */}
        <div className="hidden md:flex md:flex-1 md:justify-center">
            <div className="flex space-x-2 lg:space-x-8 max-w-2xl">
              <Link to="/" className={`font-medium px-2 lg:px-4 py-2 rounded navbar-link whitespace-nowrap ${isActiveLink('/') ? 'bg-white/10 text-white' : ''}`}>Home</Link>
              <Link to="/links" className={`font-medium px-2 lg:px-4 py-2 rounded navbar-link whitespace-nowrap ${isActiveLink('/links') ? 'bg-white/10 text-white' : ''}`}>Links</Link>
              <Link to="/chat" className={`font-medium px-2 lg:px-4 py-2 rounded navbar-link whitespace-nowrap ${isActiveLink('/chat') ? 'bg-white/10 text-white' : ''}`}>Chat</Link>
              {isInCourse && (
                <span className="font-medium px-2 lg:px-4 py-2 rounded navbar-link whitespace-nowrap bg-white/10 text-white">Course</span>
              )}
              <Link to="/buy" className={`font-medium px-2 lg:px-4 py-2 rounded navbar-link whitespace-nowrap ${isActiveLink('/buy') ? 'bg-white/10 text-white' : ''}`}>Courses</Link>
            </div>
          </div>

        {/* Mobile Navigation Icons - Only visible on mobile */}
        <div className="mobile-nav-icons flex-1 justify-center">
          <div className="flex space-x-4">
            <Link to="/" className={`p-2 rounded ${isActiveLink('/') ? 'bg-white/10' : ''}`}>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
              </svg>
            </Link>
            <Link to="/links" className={`p-2 rounded ${isActiveLink('/links') ? 'bg-white/10' : ''}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </Link>
            <Link to="/chat" className={`p-2 rounded ${isActiveLink('/chat') ? 'bg-white/10' : ''}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </Link>
            {isInCourse && (
              <span className="p-2 rounded bg-white/10">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                </svg>
              </span>
            )}
            {/* <Link to="/buy" className={`p-2 rounded ${isActiveLink('/buy') ? 'bg-white/10' : ''}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </Link> */}
          </div>
        </div>

          <div className="hidden md:flex md:items-center">
            <AuthArea />
          </div>

          <div className="md:hidden ml-auto flex items-center">
            <button type="button" onClick={toggleMenu} className="text-white focus:outline-none" aria-label="Toggle menu" aria-expanded={isOpen}>
              <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                {isOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="md:hidden" style={{ display: isOpen ? 'block' : 'none' }}>
        <div className="w-full" style={{borderTop: '1px solid var(--border)', background: 'var(--surface)'}}>
          <div className="px-4 pt-2 pb-3 space-y-1">
            <button onClick={() => { setIsOpen(false); navigate(-1) }} className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-white mobile-nav-link">← Back</button>
            <Link onClick={() => setIsOpen(false)} to="/" className={`block px-3 py-2 rounded-md text-base font-medium text-white mobile-nav-link ${isActiveLink('/') ? 'bg-white/10' : ''}`}>Home</Link>
            <Link onClick={() => setIsOpen(false)} to="/links" className={`block px-3 py-2 rounded-md text-base font-medium text-white mobile-nav-link ${isActiveLink('/links') ? 'bg-white/10' : ''}`}>Links</Link>
            <Link onClick={() => setIsOpen(false)} to="/chat" className={`block px-3 py-2 rounded-md text-base font-medium text-white mobile-nav-link ${isActiveLink('/chat') ? 'bg-white/10' : ''}`}>Chat</Link>
            <Link onClick={() => setIsOpen(false)} to="/buy" className={`block px-3 py-2 rounded-md text-base font-medium text-white mobile-nav-link ${isActiveLink('/buy') ? 'bg-white/10' : ''}`}>All Courses</Link>
            <div className="pt-3 px-3" style={{borderTop: '1px solid var(--border)'}}>
              <MobileAuthArea onAction={() => setIsOpen(false)} />
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}

function AuthArea() {
  const { user, signInWithGoogle, signOut, loading, isOffline } = useCachedAuth() || {}
  if (loading) return <div className="px-2 lg:px-4 py-2">Loading...</div>
  if (!user) return <button onClick={signInWithGoogle} className="px-2 lg:px-4 py-2 btn btn-primary rounded-md hover:bg-white/10 transition-all duration-200 whitespace-nowrap text-sm lg:text-base">Sign in</button>
  return (
    <div className="flex items-center gap-1 lg:gap-3">
      {isOffline && <div className="text-xs text-warning mr-2"><span className="status-dot status-offline"></span>Offline</div>}
      <div className="profile-avatar">
        <AvatarBox user={user} size={36} />
      </div>
      <div className="hidden lg:block text-white font-medium truncate max-w-32">{user.displayName || user.email}</div>
      <button onClick={signOut} className="px-2 lg:px-3 py-1 btn-secondary rounded-md whitespace-nowrap text-sm lg:text-base">Sign out</button>
    </div>
  )
}

function MobileAuthArea({ onAction }) {
  const { user, signInWithGoogle, signOut, loading, isOffline } = useCachedAuth() || {}
  if (loading) return <div className="py-2">Loading...</div>
  if (!user) return (
    <button onClick={() => { signInWithGoogle(); onAction && onAction() }} className="block w-full text-center px-4 py-2 btn btn-primary rounded-md">Sign in with Google</button>
  )
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <AvatarBox user={user} size={36} />
        <div>
          <div className="text-sm font-medium text-white">{user.displayName}</div>
          <div className="text-xs text-gray-400">{user.email}</div>
          {isOffline && <div className="text-xs text-orange-400">📱 Offline Mode</div>}
        </div>
      </div>
      <button onClick={() => { signOut(); onAction && onAction() }} className="px-3 py-1 btn-secondary rounded-md">Sign out</button>
    </div>
  )
}

export default Navbar