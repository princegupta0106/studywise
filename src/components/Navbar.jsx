import React, { useState } from 'react'
import { useCachedAuth } from '../contexts/CachedAuthContext'
import { Link, useNavigate } from 'react-router-dom'
import logoSvg from '../assets/logo.svg'

const Logo = () => (
  <img 
    src={logoSvg} 
    alt="StudyByte Logo" 
    height="48" 
    width="48" 
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
  const { user, isOffline } = useCachedAuth() || {}

  return (
    <nav className="w-full sticky top-0 z-50">
      <div className="max-w-full mx-auto px-2 sm:px-4 lg:px-6">
        <div className="flex items-center h-16">
          <div className="flex-shrink-0">
            <Link to="/" className="flex items-center space-x-3 logo-container">
              <Logo />
              <span className="font-bold text-lg brand-name">StudyWise</span>
            </Link>
          </div>
git config --global user.email princeguptapg0106@gmail
          <div className="hidden md:flex md:flex-1 md:justify-center">
            <div className="flex space-x-2 lg:space-x-8 max-w-2xl">
              <Link to="/" className="font-medium px-2 lg:px-4 py-2 rounded navbar-link whitespace-nowrap">Home</Link>
              <Link to="/links" className="font-medium px-2 lg:px-4 py-2 rounded navbar-link whitespace-nowrap">Links</Link>
              <Link to="/chat" className="font-medium px-2 lg:px-4 py-2 rounded navbar-link whitespace-nowrap">Chat</Link>
              <Link to="/buy" className="font-medium px-2 lg:px-4 py-2 rounded navbar-link whitespace-nowrap">Courses</Link>
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
            <Link onClick={() => setIsOpen(false)} to="/" className="block px-3 py-2 rounded-md text-base font-medium text-white mobile-nav-link">Home</Link>
            <Link onClick={() => setIsOpen(false)} to="/links" className="block px-3 py-2 rounded-md text-base font-medium text-white mobile-nav-link">Links</Link>
            <Link onClick={() => setIsOpen(false)} to="/chat" className="block px-3 py-2 rounded-md text-base font-medium text-white mobile-nav-link">Chat</Link>
            <Link onClick={() => setIsOpen(false)} to="/buy" className="block px-3 py-2 rounded-md text-base font-medium text-white mobile-nav-link">All Courses</Link>
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