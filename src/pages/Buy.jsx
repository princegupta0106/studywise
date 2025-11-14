import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getCourseList, getUserById } from '../firebase/api'
import { useCachedAuth } from '../contexts/CachedAuthContext'
import { doc, setDoc, arrayUnion, updateDoc, arrayRemove } from 'firebase/firestore'
import { db } from '../firebase/config'
import { fuzzySearchCourses } from '../utils/fuzzySearch'

// Notification function
const showNotification = (message, type = 'success', duration = 1000) => {
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
  
  const icon = type === 'error' ? '❌' : '✅'
  notification.innerHTML = `
    <div style="display: flex; align-items: flex-start; gap: 12px;">
      <div style="margin-top: 1px; flex-shrink: 0; font-size: 16px;">${icon}</div>
      <div style="flex: 1;">${message}</div>
      <button onclick="this.parentElement.parentElement.remove()" style="
        background: none; border: none; color: currentColor; cursor: pointer;
        padding: 0; margin-top: 1px; opacity: 0.7; font-size: 16px;
      ">×</button>
    </div>
  `
  
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
  
  setTimeout(() => {
    if (notification.parentNode) {
      notification.remove()
    }
  }, duration)
}

export default function Buy() {
  const { user } = useCachedAuth() || {}
  const [courses, setCourses] = useState([])
  const [enrolled, setEnrolled] = useState([])
  const [loading, setLoading] = useState(true)
  const [enrolling, setEnrolling] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      
      try {
        // Step 1: Get course list (uses localStorage cache internally)
        const courseMap = await getCourseList()
        const allCourses = Object.entries(courseMap).map(([id, data]) => ({
          id,
          name: data.name,
          title: data.name,
          description: data.description
        }))
        
        // Step 2: Get user enrollment data (uses localStorage cache internally)
        let enrolledCourses = []
        if (user) {
          const userDoc = await getUserById(user.uid)
          enrolledCourses = userDoc?.courses || []
        }
        
        if (mounted) {
          setCourses(allCourses)
          setEnrolled(enrolledCourses)
          setLoading(false)
        }
      } catch (error) {
        console.error('Error loading buy page data:', error)
        if (mounted) setLoading(false)
      }
    }
    
    load()
    return () => { mounted = false }
  }, [user])

  const handleEnrollClick = async (courseId, courseName) => {
    if (!user) return
    
    const isEnrolled = enrolled.includes(courseId)
    const action = isEnrolled ? 'unenroll' : 'enroll'
    
    setEnrolling(courseId)
    
    try {
      const userRef = doc(db, 'users', user.uid)
      
      // Update Firebase
      if (action === 'unenroll') {
        await updateDoc(userRef, { courses: arrayRemove(courseId) })
        showNotification(`Successfully removed from <strong>${courseName}</strong>`)
      } else {
        await setDoc(userRef, { courses: arrayUnion(courseId) }, { merge: true })
        showNotification(`Successfully enrolled in <strong>${courseName}</strong>`)
      }
      
      // IMMEDIATE UI UPDATE - don't wait for cache refresh
      if (action === 'unenroll') {
        setEnrolled(prev => prev.filter(id => id !== courseId))
      } else {
        setEnrolled(prev => [...prev, courseId])
      }
      
      // Clear user cache in background for future calls
      const { invalidateUserEnrollmentCache } = await import('../utils/localCache')
      invalidateUserEnrollmentCache(user.uid)
      
    } catch (e) {
      showNotification(`Failed to ${action}: ` + e.message, 'error')
      // Revert UI change on error
      if (action === 'unenroll') {
        setEnrolled(prev => [...prev, courseId])
      } else {
        setEnrolled(prev => prev.filter(id => id !== courseId))
      }
    } finally {
      setEnrolling('')
    }
  }

  // Apply fuzzy search filtering with typo tolerance
  const filteredCourses = React.useMemo(() => {
    let filtered = courses
    
    // Apply fuzzy search if there's a search query
    if (search.trim()) {
      filtered = fuzzySearchCourses(courses, search, {
        threshold: 0.4,         // Good balance for typo tolerance
        maxResults: courses.length, // Don't limit results here
        searchFields: ['name', 'title', 'description']
      })
    }
    
    // Sort to show enrolled courses first
    return filtered.slice().sort((a, b) => {
      const aEn = enrolled.includes(a.id)
      const bEn = enrolled.includes(b.id)
      if (aEn === bEn) return 0
      return aEn ? -1 : 1
    })
  }, [courses, search, enrolled])

  if (loading) return <div>Loading courses…</div>

  return (
    <div>
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-2xl font-semibold mb-4 text-white">
          Browse Courses
        </h2>

        <div className="mb-4" style={{ maxWidth: '100%' }}>
          <label htmlFor="course-search" className="sr-only">Search courses</label>
          <input
            id="course-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search courses (typos OK)..."
            className="w-full p-3 rounded input-dark text-lg"
          />
        </div>

        <div className="card-grid">
        {filteredCourses.map((course, index) => (
          <div key={course.id} className="course-card">
            <div className="grow">
              <h3 className="font-medium text-base mb-4" style={{color: '#c7c7c7'}}>
                {course.name || course.title}
              </h3>
            </div>
            <div className="mt-auto space-y-2 flex flex-col items-center">
              {/* View Course Button */}
              <Link 
                to={`/course/${course.id}`}
                className="max-w-[250px] w-full px-3 py-2 rounded border-2 border-blue-600 text-blue-300 hover:bg-blue-600 hover:text-white transition-all duration-200 text-center text-sm font-medium block"
              >
                View Course
              </Link>
              
              {/* Enroll/Remove Button */}
              <button
                className={`max-w-[250px] w-full px-3 py-2 rounded border-2 text-sm font-medium transition-all duration-200 ${
                  enrolled.includes(course.id) 
                    ? 'border-red-600 text-red-300 hover:bg-red-600 hover:text-white' 
                    : 'border-green-600 text-green-300 hover:bg-green-600 hover:text-white'
                }`}
                disabled={!user || enrolling === course.id}
                onClick={() => handleEnrollClick(course.id, course.name || course.title)}
              >
                {enrolling === course.id ? 'Updating...' : (enrolled.includes(course.id) ? 'Remove' : 'Enroll')}
              </button>
            </div>
          </div>
        ))}
      </div>
  </div>

  {!user && <div className="mt-4 text-red-600">Sign in to enroll in a course.</div>}
    </div>
  )
}
