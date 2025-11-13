import React, { useEffect, useState } from 'react'
import { useCachedAuth } from '../contexts/CachedAuthContext'
import { doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore'
import { db } from '../firebase/config'
import { getCourseList, getCourse, getUserById } from '../firebase/api'
import { Link } from 'react-router-dom'
import ConfirmationModal from '../components/ConfirmationModal'
import { fuzzySearchCourses } from '../utils/fuzzySearch'
import branchCoursesData from '../data/branchCourses.json'

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

  // Branch and year selection state
  const [selectedBranch, setSelectedBranch] = useState('')
  const [selectedYear, setSelectedYear] = useState('')
  const [isImporting, setIsImporting] = useState(false)

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

  // Fuzzy search functionality with typo tolerance
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }
    
    const results = fuzzySearchCourses(allCourses, searchQuery, {
      threshold: 0.3,         // More lenient threshold for typos
      maxResults: 6,          // Show max 6 results
      searchFields: ['name', 'title', 'description']
    })
    
    setSearchResults(results)
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
      
      // Clear user cache for future requests
      const { invalidateUserEnrollmentCache } = await import('../utils/localCache')
      invalidateUserEnrollmentCache(user.uid)
      
      // Clear search results and search bar
      setSearchQuery('')
      setSearchResults([])
      
    } catch (e) {
      alert('Failed to update enrollment: ' + e.message)
    } finally {
      setEnrolling('')
      setConfirmModal({ isOpen: false, courseId: null, courseName: '', action: '' })
    }
  }

  const handleBulkEnrollment = async () => {
    if (!user || !selectedYear) {
      alert('Please select year')
      return
    }

    // For year 1, use ALL branch, for others check branch selection
    const branchToUse = selectedYear === '1' ? 'ALL' : selectedBranch
    if (!branchToUse) {
      alert('Please select branch')
      return
    }

    setIsImporting(true)

    try {
      // Get course IDs for selected branch/year (semester1 only)
      const branchData = branchCoursesData.branches[branchToUse]
      if (!branchData || !branchData.years || !branchData.years[selectedYear]) {
        alert('No data found for selected combination')
        setIsImporting(false)
        return
      }
      
      const courseIds = branchData.years[selectedYear].semester1 || []

      if (courseIds.length === 0) {
        alert('No courses found for selected combination')
        setIsImporting(false)
        return
      }

      // Filter only existing courses from the database
      const existingCourseIds = []
      for (const courseId of courseIds) {
        try {
          const courseData = await getCourse(courseId)
          if (courseData) {
            existingCourseIds.push(courseId)
          }
        } catch (error) {
          console.log(`Course ${courseId} not found in database, skipping...`)
        }
      }

      if (existingCourseIds.length === 0) {
        alert('No matching courses found in the database for your selection')
        setIsImporting(false)
        return
      }

      // Bulk enroll in all existing courses
      const userRef = doc(db, 'users', user.uid)
      await setDoc(userRef, { 
        courses: arrayUnion(...existingCourseIds),
        branch: branchToUse,
        year: selectedYear
      }, { merge: true })

      // Clear user cache
      const { invalidateUserEnrollmentCache } = await import('../utils/localCache')
      invalidateUserEnrollmentCache(user.uid)

      // Refresh the page to show enrolled courses
      setTimeout(() => {
        window.location.reload()
      }, 1000)

      alert(`Successfully enrolled in ${existingCourseIds.length} courses!`)

    } catch (error) {
      console.error('Error during bulk enrollment:', error)
      alert('Failed to enroll in courses. Please try again.')
    } finally {
      setIsImporting(false)
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
        <div className="relative mx-auto" style={{maxWidth: '1200px'}}>
          <input
            type="text"
            placeholder="Search courses ( general biology .. )"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full p-3 rounded-lg input-dark text-base"
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
                  <div className="grow">
                    <h4 className="font-medium text-base mb-4" style={{color: '#c7c7c7'}}>
                      {course.name || course.title || 'Untitled Course'}
                    </h4>
                  </div>
                  <div className="mt-auto flex flex-col gap-2 items-center">
                    {enrolled.includes(course.id) ? (
                      <>
                        <Link to={`/course/${course.id}`} className="max-w-[250px] w-full px-4 py-2 text-sm text-center rounded font-medium transition-colors" style={{background: 'var(--accent)', color: 'white'}}>View Course</Link>
                        <button
                          onClick={() => handleEnrollClick(course.id, course.name || course.title)}
                          disabled={enrolling === course.id}
                          className="max-w-[250px] w-full px-4 py-2 text-sm rounded font-medium transition-colors"
                          style={{background: 'var(--danger)', color: 'white'}}
                        >
                          {enrolling === course.id ? 'Removing...' : 'Remove'}
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleEnrollClick(course.id, course.name || course.title)}
                        disabled={enrolling === course.id}
                        className="max-w-[250px] w-full px-4 py-2 text-sm rounded font-medium transition-colors"
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
        
        {courses.length === 0 ? (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2" style={{color: '#c7c7c7'}}>Welcome to StudyWise!</h2>
              <p className="text-gray-400 mb-6">Select your branch and year to get started with your courses</p>
            </div>

            {/* Year and Branch Selection */}
            <div className="space-y-6">
              {/* Year Selection - Top Priority */}
              <div>
                <label className="block text-lg font-semibold mb-4" style={{color: '#c7c7c7'}}>Select Your Year</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-w-2xl mx-auto">
                  {['1', '2', '3', '4'].map(year => (
                    <button
                      key={year}
                      onClick={() => {
                        setSelectedYear(year)
                        setSelectedBranch('')
                      }}
                      className={`p-4 rounded-xl border-2 font-semibold transition-all duration-200 transform hover:scale-105 ${
                        selectedYear === year
                          ? 'border-green-500 bg-green-500/20 text-green-300 shadow-lg shadow-green-500/20'
                          : 'border-gray-600 bg-gray-700/30 text-gray-300 hover:border-gray-500 hover:bg-gray-600/30'
                      }`}
                    >
                      <div className="text-xl">Year {year}</div>
                      <div className="text-xs opacity-70 mt-1">
                        {year === '1' ? 'First Year' : year === '2' ? 'Second Year' : year === '3' ? 'Third Year' : 'Final Year'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Branch Selection - Compact Design */}
              {selectedYear && (
                <div>
                  <label className="block text-sm font-medium mb-3" style={{color: '#c7c7c7'}}>
                    Select Your Branch {selectedYear === '1' ? '(Common for all)' : ''}
                  </label>
                  {selectedYear === '1' ? (
                    <div className="flex justify-center">
                      <button
                        onClick={() => setSelectedBranch('ALL')}
                        className="px-6 py-2 bg-blue-500/20 border-2 border-blue-500 text-blue-300 rounded-lg font-medium"
                      >
                        Common Courses for All Branches
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                      {Object.entries(branchCoursesData.branches)
                        .filter(([code]) => code !== 'ALL')
                        .map(([branchCode, branchInfo]) => (
                        <button
                          key={branchCode}
                          onClick={() => setSelectedBranch(branchCode)}
                          className={`p-2 rounded-lg border text-xs font-medium transition-all duration-200 hover:scale-105 ${
                            selectedBranch === branchCode
                              ? 'border-blue-500 bg-blue-500/20 text-blue-300'
                              : 'border-gray-600 bg-gray-700/30 text-gray-300 hover:border-gray-500 hover:bg-gray-600/30'
                          }`}
                          title={branchInfo.name}
                        >
                          <div className="font-bold text-sm">{branchCode}</div>
                          <div className="text-[10px] opacity-75 leading-tight">
                            {branchInfo.name.split(' ').slice(0, 2).join(' ')}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Course Preview */}
              {selectedYear && (selectedYear === '1' || selectedBranch) && (() => {
                const branchToUse = selectedYear === '1' ? 'ALL' : selectedBranch
                const courseData = branchCoursesData.branches[branchToUse]?.years?.[selectedYear]?.semester1 || []
                
                return (
                  <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700">
                    <h4 className="font-medium mb-3" style={{color: '#c7c7c7'}}>
                      Courses to be enrolled (Semester 1) - {selectedYear === '1' ? 'Common for All' : branchCoursesData.branches[branchToUse]?.name}:
                    </h4>
                    <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                      {courseData.map(courseId => (
                        <span key={courseId} className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-xs font-medium">
                          {courseId}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-gray-400 mt-3">
                      {courseData.length} courses will be added to your enrollment
                    </p>
                  </div>
                )
              })()}

              {/* Import Button */}
              {selectedYear && (selectedYear === '1' || selectedBranch) && (
                <div className="text-center">
                  <button
                    onClick={handleBulkEnrollment}
                    disabled={isImporting}
                    className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-medium rounded-lg transition-all duration-200 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
                  >
                    {isImporting ? (
                      <div className="flex items-center space-x-2">
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Importing Courses...</span>
                      </div>
                    ) : (
                      'Import Courses'
                    )}
                  </button>
                </div>
              )}

              {/* Alternative Options */}
              <div className="text-center pt-4 border-t border-gray-700">
                <p className="text-sm text-gray-400 mb-2">Or explore courses manually:</p>
                <Link 
                  to="/buy" 
                  className="inline-flex items-center px-4 py-2 border border-gray-600 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:border-gray-500 transition-colors"
                >
                  Browse All Courses →
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="card-grid ">
            {courses.map((c) => (
              <div key={c.id} className="course-card">
                <div className="grow">
                  <h4 className="font-medium text-base mb-4" style={{color: '#c7c7c7'}}>{c.name || c.title || 'Untitled course'}</h4>
                </div>
                <div className="mt-auto">
                  <Link 
                    to={`/course/${c.id}`}
                    className="text-xs font-medium" 
                    style={{color: 'var(--yellow)'}}
                  >
                    View course →
                  </Link>
                </div>
              </div>
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
