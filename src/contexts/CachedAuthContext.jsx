import React, { createContext, useContext, useEffect, useState } from 'react'
import { useAuth } from './AuthContext'

const CachedAuthContext = createContext()

// Local storage cache for instant user access
const USER_CACHE_KEY = 'goalwise_cached_user'
const COURSE_CACHE_KEY = 'goalwise_cached_courses'

export function useCachedAuth() {
  return useContext(CachedAuthContext)
}

export function CachedAuthProvider({ children }) {
  const { user, signInWithGoogle, signOut, loading } = useAuth() || {}
  const [cachedUser, setCachedUser] = useState(null)
  const [isOffline, setIsOffline] = useState(!navigator.onLine)
  const [cachedCourses, setCachedCourses] = useState({})

  // Load cached user immediately on app start
  useEffect(() => {
    const loadCachedUser = () => {
      try {
        const cached = localStorage.getItem(USER_CACHE_KEY)
        if (cached) {
          const userData = JSON.parse(cached)
          setCachedUser(userData)
          console.log('✅ User loaded from local cache:', userData.email)
        }
      } catch (error) {
        console.warn('Failed to load cached user:', error)
      }
    }

    const loadCachedCourses = () => {
      try {
        const cached = localStorage.getItem(COURSE_CACHE_KEY)
        if (cached) {
          const courseData = JSON.parse(cached)
          setCachedCourses(courseData)
          console.log('✅ Courses loaded from local cache')
        }
      } catch (error) {
        console.warn('Failed to load cached courses:', error)
      }
    }

    // Load immediately without waiting for Firebase
    loadCachedUser()
    loadCachedCourses()
  }, [])

  // Update cache when real user data arrives - PREVENT DUPLICATE CALLS
  useEffect(() => {
    if (user && !loading && (!cachedUser || cachedUser.uid !== user.uid)) {
      const userToCache = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL
      }
      
      localStorage.setItem(USER_CACHE_KEY, JSON.stringify(userToCache))
      setCachedUser(userToCache)
      console.log('💾 User cached locally:', user.email)
    }
  }, [user, loading, cachedUser])

  // Listen for online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Cache courses data
  const updateCourseCache = (courseData) => {
    try {
      localStorage.setItem(COURSE_CACHE_KEY, JSON.stringify(courseData))
      setCachedCourses(courseData)
      console.log('💾 Courses cached locally')
    } catch (error) {
      console.warn('Failed to cache courses:', error)
    }
  }

  // Get cached courses
  const getCachedCourses = () => {
    return cachedCourses
  }

  // Instant sign out (clears cache)
  const instantSignOut = () => {
    localStorage.removeItem(USER_CACHE_KEY)
    localStorage.removeItem(COURSE_CACHE_KEY)
    setCachedUser(null)
    setCachedCourses({})
    
    // Also trigger real sign out if online
    if (!isOffline && signOut) {
      signOut()
    }
  }

  // Use cached user if available, fallback to real user
  const currentUser = cachedUser || user

  const value = {
    user: currentUser,
    signInWithGoogle,
    signOut: instantSignOut,
    loading: !cachedUser && loading, // Don't show loading if we have cached user
    isOffline,
    updateCourseCache,
    getCachedCourses,
    hasCachedUser: !!cachedUser
  }

  return (
    <CachedAuthContext.Provider value={value}>
      {children}
    </CachedAuthContext.Provider>
  )
}