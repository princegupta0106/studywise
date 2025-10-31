import React, { useEffect, useState } from 'react'
import { useCachedAuth } from '../contexts/CachedAuthContext'
import { doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore'
import { db } from '../firebase/config'
import { getCourseList, getCourse, getUserById } from '../firebase/api'
import { Link } from 'react-router-dom'
import ConfirmationModal from '../components/ConfirmationModal'

export default function Home() {
  const { user } = useCachedAuth() || {}
  const [courses, setCourses] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [allCourses, setAllCourses] = useState([])
  const [enrolled, setEnrolled] = useState([])
  const [enrolling, setEnrolling] = useState('')
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    courseId: null,
    courseName: '',
    action: '', // 'enroll' or 'unenroll'
  })

  // Function to load/reload all home data
  const loadHomeData = async (forceRefresh = false) => {
    if (!user) {
      setCourses([])
      setEnrolled([])
      return
    }
    
    try {
      // Step 1: Get user data (force refresh if needed)
      const userData = await getUserById(user.uid, forceRefresh)
      const courseIds = userData?.courses || []
      setEnrolled(courseIds)
      
      // Step 2: Get course list for search (uses localStorage cache internally)
      const courseMap = await getCourseList()
      const allCoursesData = Object.entries(courseMap).map(([id, data]) => ({
        id,
        name: data.name,
        title: data.name,
        description: data.description
      }))
      setAllCourses(allCoursesData)
      
      // Step 3: Get enrolled course details (each uses localStorage cache internally)
      const courseObjs = await Promise.all(
        courseIds.map(async (cid) => {
          const c = await getCourse(cid)
          return c ? { id: cid, ...c } : null
        })
      )
      setCourses(courseObjs.filter(Boolean))
      
    } catch (error) {
      console.error('Error loading home data:', error)
    }
  }

  useEffect(() => {
    let mounted = true
    
    const load = async () => {
      await loadHomeData()
    }
    
    load()
    return () => {
      mounted = false
    }
  }, [user])

  // Search functionality
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }
    
    const query = searchQuery.toLowerCase()
    const filtered = allCourses.filter(course => 
      (course.name || course.title || '').toLowerCase().includes(query) ||
      (course.description || '').toLowerCase().includes(query)
    )
    setSearchResults(filtered.slice(0, 5)) // Show max 5 results
  }, [searchQuery, allCourses])

  const handleEnrollClick = (courseId, courseName) => {
    if (!user) return
    
    const isEnrolled = enrolled.includes(courseId)
    setConfirmModal({
      isOpen: true,
      courseId,
      courseName,
      action: isEnrolled ? 'unenroll' : 'enroll',
    })
  }

  const handleConfirmEnrollment = async () => {
    const { courseId, action } = confirmModal
    if (!user || !courseId) return
    
    setEnrolling(courseId)
    
    try {
      const userRef = doc(db, 'users', user.uid)
      if (action === 'unenroll') {
        // Unenroll
        await updateDoc(userRef, { courses: arrayRemove(courseId) })
        setEnrolled(prev => prev.filter(id => id !== courseId))
        setCourses(prev => prev.filter(c => c.id !== courseId))
      } else {
        // Enroll
        await setDoc(userRef, { courses: arrayUnion(courseId) }, { merge: true })
        setEnrolled(prev => [...prev, courseId])
        // Add to enrolled courses list
        const newCourse = await getCourse(courseId)
        if (newCourse) {
          setCourses(prev => [...prev, { id: courseId, ...newCourse }])
        }
      }
      
      // CRITICAL: Clear user cache and reload data
      const { invalidateUserEnrollmentCache } = await import('../utils/localCache')
      invalidateUserEnrollmentCache(user.uid)
      
      // Reload all data with fresh user information
      await loadHomeData(true)
      
    } catch (e) {
      alert('Failed to update enrollment: ' + e.message)
    } finally {
      setEnrolling('')
      setConfirmModal({ isOpen: false, courseId: null, courseName: '', action: '' })
    }
  }

  const handleCancelConfirmation = () => {
    setConfirmModal({ isOpen: false, courseId: null, courseName: '', action: '' })
  }



  if (courses === null) {
    return <div>Loading courses…</div>
  }

  return (
    <div>
      {/* Search Section */}
      <div className="mb-8">
        <div className="relative">
          <input
            type="text"
            placeholder="Search courses to enroll..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full p-2 rounded input-dark text-lg"
          />
          <svg className="absolute right-3 top-3 h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        
        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="mt-4">
            <div className="mb-4 text-sm">
              Search Results
            </div>
            <div className="card-grid">
              {searchResults.map((course) => (
                <div key={course.id} className="course-card">
                  <h4 className="font-medium text-lg mb-3" style={{color: '#c7c7c7'}}>
                    {course.name || course.title || 'Untitled Course'}
                  </h4>
                  <p className="text-gray-600 text-sm mb-4 flex-grow">{course.description || 'No description'}</p>
                  <div className="flex flex-col gap-2">
                    {enrolled.includes(course.id) ? (
                      <>
                        <Link to={`/course/${course.id}`} className="w-full px-4 py-2 text-sm text-center rounded font-medium transition-colors" style={{background: 'var(--accent)', color: 'white'}}>View Course</Link>
                        <button
                          onClick={() => handleEnrollClick(course.id, course.name || course.title)}
                          disabled={enrolling === course.id}
                          className="w-full px-4 py-2 text-sm rounded font-medium transition-colors"
                          style={{background: 'var(--danger)', color: 'white'}}
                        >
                          {enrolling === course.id ? 'Removing...' : 'Unenroll'}
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleEnrollClick(course.id, course.name || course.title)}
                        disabled={enrolling === course.id}
                        className="w-full px-4 py-2 text-sm rounded font-medium transition-colors"
                        style={{background: 'var(--warning)', color: 'var(--bg)'}}
                      >
                        {enrolling === course.id ? 'Enrolling...' : 'Enroll'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Your Enrolled Courses */}
      <div>
        <h3 className="text-xl font-semibold mb-4 text-white">
          Your Courses
        </h3>
        {courses.length === 0 ? (
          <div>
            <p>You are not enrolled in any courses yet.</p>
            <p className="text-sm text-gray-600 mt-2">Use the search above to find and enroll in courses, or <Link to="/buy" className="text-accent">browse all courses</Link>.</p>
          </div>
        ) : (
          <div className="card-grid">
            {courses.map((c) => (
              <Link
                key={c.id}
                to={`/course/${c.id}`}
                className="course-card no-underline"
              >
                <h4 className="font-medium text-lg mb-3" style={{color: '#c7c7c7'}}>{c.name || c.title || 'Untitled course'}</h4>
                <p className="text-gray-600 text-sm mb-4 flex-grow">{c.description || 'No description available'}</p>
                <span className="text-sm font-medium" style={{color: 'var(--yellow)'}}>View course →</span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={handleCancelConfirmation}
        onConfirm={handleConfirmEnrollment}
        title={confirmModal.action === 'enroll' ? 'Confirm Enrollment' : 'Confirm Unenrollment'}
        message={
          confirmModal.action === 'enroll' 
            ? `Are you sure you want to enroll in "${confirmModal.courseName}"?`
            : `Are you sure you want to unenroll from "${confirmModal.courseName}"? You will lose access to the course content.`
        }
        confirmText={confirmModal.action === 'enroll' ? 'Enroll' : 'Unenroll'}
        confirmButtonClass={
          confirmModal.action === 'enroll' 
            ? 'bg-yellow-500 hover:bg-yellow-600 text-black'
            : 'bg-red-600 hover:bg-red-700 text-white'
        }
        isLoading={enrolling === confirmModal.courseId}
      />
    </div>
  )
}
