import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getCourseList, getUserById } from '../firebase/api'
import { useCachedAuth } from '../contexts/CachedAuthContext'
import { doc, setDoc, arrayUnion, updateDoc, arrayRemove } from 'firebase/firestore'
import { db } from '../firebase/config'
import ConfirmationModal from '../components/ConfirmationModal'

export default function Buy() {
  const { user } = useCachedAuth() || {}
  const [courses, setCourses] = useState([])
  const [enrolled, setEnrolled] = useState([])
  const [loading, setLoading] = useState(true)
  const [enrolling, setEnrolling] = useState('')
  const [search, setSearch] = useState('')
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    courseId: null,
    courseName: '',
    action: '', // 'enroll' or 'unenroll'
  })

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
      
      // Update Firebase
      if (action === 'unenroll') {
        await updateDoc(userRef, { courses: arrayRemove(courseId) })
      } else {
        await setDoc(userRef, { courses: arrayUnion(courseId) }, { merge: true })
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
      alert('Failed to update enrollment: ' + e.message)
      // Revert UI change on error
      if (action === 'unenroll') {
        setEnrolled(prev => [...prev, courseId])
      } else {
        setEnrolled(prev => prev.filter(id => id !== courseId))
      }
    } finally {
      setEnrolling('')
      setConfirmModal({ isOpen: false, courseId: null, courseName: '', action: '' })
    }
  }

  const handleCancelConfirmation = () => {
    setConfirmModal({ isOpen: false, courseId: null, courseName: '', action: '' })
  }

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
            placeholder="Search courses by title or description..."
            className="w-full p-3 rounded input-dark text-lg"
          />
        </div>

        <div className="card-grid">
        {courses
          .filter(c => {
            if (!search) return true
            const q = search.toLowerCase()
            return (c.name || c.title || '').toLowerCase().includes(q) || (c.description || '').toLowerCase().includes(q)
          })
          .slice() // copy to avoid mutating original
          .sort((a, b) => {
            const aEn = enrolled.includes(a.id)
            const bEn = enrolled.includes(b.id)
            if (aEn === bEn) return 0
            return aEn ? -1 : 1
          })
          .map(course => (
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
