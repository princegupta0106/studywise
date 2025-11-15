import React, { useEffect, useState } from 'react'
import { useCachedAuth } from '../contexts/CachedAuthContext'
import { doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore'
import { db } from '../firebase/config'
import { getCourseList, getCourse, getUserById } from '../firebase/api'
import { Link, useLocation } from 'react-router-dom'
import { fuzzySearchCourses } from '../utils/fuzzySearch'
import branchCoursesData from '../data/branchCourses.json'
import { useTypewriter } from '../hooks/useTypewriter'

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

export default function Home() {
  const { user } = useCachedAuth() || {}
  const location = useLocation()
  const [courses, setCourses] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [allCourses, setAllCourses] = useState([])
  const [enrolled, setEnrolled] = useState([])
  const [enrolling, setEnrolling] = useState('')

  // Branch and year selection state
  const [selectedProgram, setSelectedProgram] = useState('') // 'BE' or 'MSC'
  const [selectedBranch, setSelectedBranch] = useState('')
  const [selectedYear, setSelectedYear] = useState('')
  const [selectedMscBranch, setSelectedMscBranch] = useState('') // For MSC branch selection
  const [selectedBeBranch, setSelectedBeBranch] = useState('') // For BE branch selection when in MSC year 3/4
  const [isImporting, setIsImporting] = useState(false)

  // Typewriter effect for search placeholder
  const searchTexts = [
    'General Biology',
    'Object Oriented Programming', 
    'Data Structures',
    'Machine Learning',
    'Quantum Mechanics',
    'Digital Signal Processing',
    'Thermodynamics',
    'Computer Networks',
    'Organic Chemistry',
    'Discrete Mathematics'
  ]
  const typewriterText = useTypewriter(searchTexts, 100, 50, 1500)

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
    let refreshInterval
    
    const load = async () => {
      await loadHomeData(true) // Always force refresh when component loads/user changes
    }
    
    // Load data when user changes or component mounts
    if (user) {
      load()
      
      // Set up periodic refresh every 30 seconds to keep data fresh
      refreshInterval = setInterval(() => {
        if (mounted && user && !document.hidden) {
          loadHomeData(true)
        }
      }, 30000) // Refresh every 30 seconds when page is visible
      
      // Refresh data when user returns to the tab/window
      const handleVisibilityChange = () => {
        if (!document.hidden && mounted && user) {
          loadHomeData(true) // Force refresh when tab becomes active
        }
      }
      
      document.addEventListener('visibilitychange', handleVisibilityChange)
      
      return () => {
        mounted = false
        if (refreshInterval) {
          clearInterval(refreshInterval)
        }
        document.removeEventListener('visibilitychange', handleVisibilityChange)
      }
    } else {
      setCourses([])
      setEnrolled([])
    }
    
    return () => {
      mounted = false
      if (refreshInterval) {
        clearInterval(refreshInterval)
      }
    }
  }, [user])
  
  // Reload data when navigating back to Home page
  useEffect(() => {
    if (user) {
      loadHomeData(true) // Force refresh when location changes (coming back from other pages)
    }
  }, [location.pathname, user])

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

  const handleEnrollClick = async (courseId, courseName) => {
    if (!user) return
    
    const isEnrolled = enrolled.includes(courseId)
    const action = isEnrolled ? 'unenroll' : 'enroll'
    
    setEnrolling(courseId)
    
    try {
      const userRef = doc(db, 'users', user.uid)
      if (action === 'unenroll') {
        // Unenroll
        await updateDoc(userRef, { courses: arrayRemove(courseId) })
        setEnrolled(prev => prev.filter(id => id !== courseId))
        setCourses(prev => prev.filter(c => c.id !== courseId))
        showNotification(`Successfully removed from <strong>${courseName}</strong>`)
      } else {
        // Enroll
        await setDoc(userRef, { courses: arrayUnion(courseId) }, { merge: true })
        setEnrolled(prev => [...prev, courseId])
        // Add to enrolled courses list
        const newCourse = await getCourse(courseId)
        if (newCourse) {
          setCourses(prev => [...prev, { id: courseId, ...newCourse }])
        }
        showNotification(`Successfully enrolled in <strong>${courseName}</strong>`)
      }
      
      // Clear user cache for future requests
      const { invalidateUserEnrollmentCache } = await import('../utils/localCache')
      invalidateUserEnrollmentCache(user.uid)
      
      // Clear search results and search bar
      setSearchResults([])
      setSearchQuery('')
      
    } catch (e) {
      showNotification(`Failed to ${action}: ` + e.message, 'error')
    } finally {
      setEnrolling('')
    }
  }

  const handleBulkEnrollment = async () => {
    if (!user || !selectedYear) {
      showNotification('Please select year', 'error')
      return
    }

    setIsImporting(true)

    try {
      let courseIds = []
      
      if (selectedYear === '1') {
        // For year 1, get common courses (same for BE and MSC)
        courseIds = branchCoursesData.BE?.year1?.['all branches'] || []
      } else {
        // For year 2+, check program type
        if (!selectedProgram) {
          showNotification('Please select program type (BE/MSC)', 'error')
          setIsImporting(false)
          return
        }

        if (selectedProgram === 'BE') {
          // BE program logic (same as before)
          if (!selectedBranch) {
            showNotification('Please select BE branch', 'error')
            setIsImporting(false)
            return
          }
          
          const yearKey = `year${selectedYear}`
          const yearData = branchCoursesData.BE?.[yearKey]
          if (yearData) {
            // Map short codes to full names
            const branchCodeMap = {
              'BIO': 'BE Biotechnology',
              'CHEM': 'BE Chemical', 
              'CIVIL': 'BE Civil',
              'CSE': 'BE Computer Science',
              'EEE': 'BE Electrical and Electronics',
              'ECE': 'BE Electronics and Communications',
              'ENI': 'BE Electronics and Instrumentation',
              'ENC': 'BE Electronics and Computer Engineering',
              'MECH': 'BE Mechanical',
              'MANU': 'BE Manufacturing'
            }
            
            const fullBranchName = branchCodeMap[selectedBranch]
            if (fullBranchName && yearData[fullBranchName]) {
              courseIds = yearData[fullBranchName] || []
            }
          }
        } else if (selectedProgram === 'MSC') {
          // MSC program logic
          if (!selectedMscBranch) {
            showNotification('Please select MSC branch', 'error')
            setIsImporting(false)
            return
          }

          if (selectedYear === '2') {
            // MSC Year 2: Only MSC courses
            const yearData = branchCoursesData.MSC?.year2
            if (yearData && yearData[selectedMscBranch]) {
              courseIds = yearData[selectedMscBranch] || []
            }
          } else if (selectedYear === '3') {
            // MSC Year 3: MSC courses + BE courses (need BE branch selection)
            if (!selectedBeBranch) {
              showNotification('Please select BE branch for additional courses', 'error')
              setIsImporting(false)
              return
            }
            
            // Get MSC year 3 courses
            const mscData = branchCoursesData.MSC?.year3
            const mscCourses = mscData?.[selectedMscBranch] || []
            
            // Get BE year 2 courses
            const beData = branchCoursesData.BE?.year2
            let beCourses = []
            if (beData) {
              // Map short codes to full names
              const branchCodeMap = {
                'BIO': 'BE Biotechnology',
                'CHEM': 'BE Chemical', 
                'CIVIL': 'BE Civil',
                'CSE': 'BE Computer Science',
                'EEE': 'BE Electrical and Electronics',
                'ECE': 'BE Electronics and Communications',
                'ENI': 'BE Electronics and Instrumentation',
                'ENC': 'BE Electronics and Computer Engineering',
                'MECH': 'BE Mechanical',
                'MANU': 'BE Manufacturing'
              }
              
              const fullBranchName = branchCodeMap[selectedBeBranch]
              if (fullBranchName && beData[fullBranchName]) {
                beCourses = beData[fullBranchName] || []
              }
            }
            
            courseIds = [...mscCourses, ...beCourses]
          } else if (selectedYear === '4') {
            // MSC Year 4: Only BE year 3 courses
            if (!selectedBeBranch) {
              showNotification('Please select BE branch', 'error')
              setIsImporting(false)
              return
            }
            
            const beData = branchCoursesData.BE?.year3
            if (beData) {
              // Debug: let's see what we're comparing
              console.log('Available BE year3 branches:', Object.keys(beData))
              console.log('Selected BE branch code:', selectedBeBranch)
              
              // Map short codes back to full names
              const branchCodeMap = {
                'BIOTECH': 'BE Biotechnology',
                'CHEM': 'BE Chemical', 
                'CIVIL': 'BE Civil',
                'CSE': 'BE Computer Science',
                'EEE': 'BE Electrical and Electronics',
                'ECE': 'BE Electronics and Communications',
                'ENI': 'BE Electronics and Instrumentation',
                'ENC': 'BE Electronics and Computer Engineering',
                'MECH': 'BE Mechanical',
                'MANU': 'BE Manufacturing'
              }
              
              const fullBranchName = branchCodeMap[selectedBeBranch]
              console.log('Mapped to full name:', fullBranchName)
              
              if (fullBranchName && beData[fullBranchName]) {
                courseIds = beData[fullBranchName] || []
                console.log('Found courses for MSC Year 4:', courseIds)
              } else {
                console.log('No courses found for branch:', selectedBeBranch)
              }
            }
          }
        }
      }

      if (courseIds.length === 0) {
        showNotification('No courses found for selected combination', 'error')
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
        showNotification('No matching courses found in the database for your selection', 'error')
        setIsImporting(false)
        return
      }

      // Bulk enroll in all existing courses
      const userRef = doc(db, 'users', user.uid)
      await setDoc(userRef, { 
        courses: arrayUnion(...existingCourseIds),
        branch: selectedBranch || 'ALL',
        year: selectedYear
      }, { merge: true })

      // Clear user cache
      const { invalidateUserEnrollmentCache } = await import('../utils/localCache')
      invalidateUserEnrollmentCache(user.uid)

      // Refresh the page to show enrolled courses
      setTimeout(() => {
        window.location.reload()
      }, 1000)

      showNotification(`Successfully enrolled in ${existingCourseIds.length} courses!`)

    } catch (error) {
      console.error('Error during bulk enrollment:', error)
      showNotification('Failed to enroll in courses. Please try again.', 'error')
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
            placeholder={searchQuery ? '' : `${typewriterText}${typewriterText ? '' : ''} `}
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
              <h2 className="text-2xl font-bold mb-2" style={{color: '#c7c7c7'}}>Welcome to Padho BC!</h2>
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
                        setSelectedProgram('')
                        setSelectedBranch('')
                        setSelectedMscBranch('')
                        setSelectedBeBranch('')
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

              {/* Program Type Selection */}
              {selectedYear && selectedYear !== '1' && (
                <div>
                  <label className="block text-lg font-semibold mb-4" style={{color: '#c7c7c7'}}>Select Program Type</label>
                  <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                    {['BE', 'MSC'].map(program => (
                      <button
                        key={program}
                        onClick={() => {
                          setSelectedProgram(program)
                          setSelectedBranch('')
                          setSelectedMscBranch('')
                          setSelectedBeBranch('')
                        }}
                        className={`p-4 rounded-xl border-2 font-semibold transition-all duration-200 transform hover:scale-105 ${
                          selectedProgram === program
                            ? 'border-blue-500 bg-blue-500/20 text-blue-300 shadow-lg shadow-blue-500/20'
                            : 'border-gray-600 bg-gray-700/30 text-gray-300 hover:border-gray-500 hover:bg-gray-600/30'
                        }`}
                      >
                        <div className="text-xl">{program}</div>
                        <div className="text-xs opacity-70 mt-1">
                          {program === 'BE' ? 'Bachelor of Engineering' : 'Master of Science'}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Year 1 - Common for all */}
              {selectedYear === '1' && (
                <div className="flex justify-center">
                  <div className="px-6 py-2 bg-blue-500/20 border-2 border-blue-500 text-blue-300 rounded-lg font-medium">
                    Common Courses for All Programs
                  </div>
                </div>
              )}

              {/* BE Branch Selection */}
              {selectedProgram === 'BE' && selectedYear !== '1' && (
                <div>
                  <label className="block text-sm font-medium mb-3" style={{color: '#c7c7c7'}}>Select BE Branch</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                    {(() => {
                      const yearKey = `year${selectedYear}`
                      const yearData = branchCoursesData.BE?.[yearKey] || {}
                      const branches = Object.keys(yearData).map(fullName => {
                        const branchCodes = {
                          'BE Biotechnology': 'BIO',
                          'BE Chemical': 'CHEM', 
                          'BE Civil': 'CIVIL',
                          'BE Computer Science': 'CSE',
                          'BE Electrical and Electronics': 'EEE',
                          'BE Electronics and Communications': 'ECE',
                          'BE Electronics and Instrumentation': 'ENI',
                          'BE Electronics and Computer Engineering': 'ENC',
                          'BE Mechanical': 'MECH',
                          'BE Manufacturing': 'MANU'
                        }
                        return {
                          code: branchCodes[fullName] || fullName,
                          fullName: fullName
                        }
                      })
                      
                      return branches.map(({ code, fullName }) => (
                        <button
                          key={code}
                          onClick={() => setSelectedBranch(code)}
                          className={`p-2 rounded-lg border text-xs font-medium transition-all duration-200 hover:scale-105 ${
                            selectedBranch === code
                              ? 'border-blue-500 bg-blue-500/20 text-blue-300'
                              : 'border-gray-600 bg-gray-700/30 text-gray-300 hover:border-gray-500 hover:bg-gray-600/30'
                          }`}
                          title={fullName}
                        >
                          <div className="font-bold text-sm">{code}</div>
                          <div className="text-[10px] opacity-75 leading-tight">
                            {fullName.replace('BE ', '').split(' ').slice(0, 2).join(' ')}
                          </div>
                        </button>
                      ))
                    })()}
                  </div>
                </div>
              )}

              {/* MSC Branch Selection */}
              {selectedProgram === 'MSC' && (
                <div>
                  <label className="block text-sm font-medium mb-3" style={{color: '#c7c7c7'}}>Select MSC Branch</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                    {Object.keys(branchCoursesData.MSC?.year2 || {}).map(mscBranch => {
                      const shortName = mscBranch.replace('MSc ', '')
                      return (
                        <button
                          key={mscBranch}
                          onClick={() => setSelectedMscBranch(mscBranch)}
                          className={`p-2 rounded-lg border text-xs font-medium transition-all duration-200 hover:scale-105 ${
                            selectedMscBranch === mscBranch
                              ? 'border-purple-500 bg-purple-500/20 text-purple-300'
                              : 'border-gray-600 bg-gray-700/30 text-gray-300 hover:border-gray-500 hover:bg-gray-600/30'
                          }`}
                          title={mscBranch}
                        >
                          <div className="font-bold text-sm">{shortName}</div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* BE Branch Selection for MSC Year 3/4 */}
              {selectedProgram === 'MSC' && selectedMscBranch && (selectedYear === '3' || selectedYear === '4') && (
                <div>
                  <label className="block text-sm font-medium mb-3" style={{color: '#c7c7c7'}}>
                    Select BE Branch {selectedYear === '3' ? '(for additional courses)' : '(for Year 4 courses)'}
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                    {(() => {
                      const yearKey = selectedYear === '3' ? 'year2' : 'year3'
                      const yearData = branchCoursesData.BE?.[yearKey] || {}
                      const branches = Object.keys(yearData).map(fullName => {
                        const branchCodes = {
                          'BE Biotechnology': 'BIO',
                          'BE Chemical': 'CHEM', 
                          'BE Civil': 'CIVIL',
                          'BE Computer Science': 'CSE',
                          'BE Electrical and Electronics': 'EEE',
                          'BE Electronics and Communications': 'ECE',
                          'BE Electronics and Instrumentation': 'ENI',
                          'BE Electronics and Computer Engineering': 'ENC',
                          'BE Mechanical': 'MECH',
                          'BE Manufacturing': 'MANU'
                        }
                        return {
                          code: branchCodes[fullName] || fullName,
                          fullName: fullName
                        }
                      })
                      
                      return branches.map(({ code, fullName }) => (
                        <button
                          key={code}
                          onClick={() => setSelectedBeBranch(code)}
                          className={`p-2 rounded-lg border text-xs font-medium transition-all duration-200 hover:scale-105 ${
                            selectedBeBranch === code
                              ? 'border-green-500 bg-green-500/20 text-green-300'
                              : 'border-gray-600 bg-gray-700/30 text-gray-300 hover:border-gray-500 hover:bg-gray-600/30'
                          }`}
                          title={fullName}
                        >
                          <div className="font-bold text-sm">{code}</div>
                          <div className="text-[10px] opacity-75 leading-tight">
                            {fullName.replace('BE ', '').split(' ').slice(0, 2).join(' ')}
                          </div>
                        </button>
                      ))
                    })()}
                  </div>
                </div>
              )}

              {/* Course Preview */}
              {(() => {
                let shouldShow = false
                let courseData = []
                let branchName = ''
                
                if (selectedYear === '1') {
                  shouldShow = true
                  courseData = branchCoursesData.BE?.year1?.['all branches'] || []
                  branchName = 'Common for All Programs'
                } else if (selectedProgram === 'BE' && selectedBranch) {
                  shouldShow = true
                  const yearKey = `year${selectedYear}`
                  const yearData = branchCoursesData.BE?.[yearKey]
                  if (yearData) {
                    // Map short codes to full names
                    const branchCodeMap = {
                      'BIO': 'BE Biotechnology',
                      'CHEM': 'BE Chemical', 
                      'CIVIL': 'BE Civil',
                      'CSE': 'BE Computer Science',
                      'EEE': 'BE Electrical and Electronics',
                      'ECE': 'BE Electronics and Communications',
                      'ENI': 'BE Electronics and Instrumentation',
                      'ENC': 'BE Electronics and Computer Engineering',
                      'MECH': 'BE Mechanical',
                      'MANU': 'BE Manufacturing'
                    }
                    
                    const fullBranchName = branchCodeMap[selectedBranch]
                    if (fullBranchName && yearData[fullBranchName]) {
                      courseData = yearData[fullBranchName] || []
                      branchName = `${fullBranchName}`
                    }
                  }
                } else if (selectedProgram === 'MSC' && selectedMscBranch) {
                  if (selectedYear === '2') {
                    shouldShow = true
                    courseData = branchCoursesData.MSC?.year2?.[selectedMscBranch] || []
                    branchName = `${selectedMscBranch} - Year 2`
                  } else if (selectedYear === '3' && selectedBeBranch) {
                    shouldShow = true
                    const mscData = branchCoursesData.MSC?.year3?.[selectedMscBranch] || []
                    const beData = branchCoursesData.BE?.year2
                    let beCourses = []
                    if (beData) {
                      // Map short codes to full names
                      const branchCodeMap = {
                        'BIO': 'BE Biotechnology',
                        'CHEM': 'BE Chemical', 
                        'CIVIL': 'BE Civil',
                        'CSE': 'BE Computer Science',
                        'EEE': 'BE Electrical and Electronics',
                        'ECE': 'BE Electronics and Communications',
                        'ENI': 'BE Electronics and Instrumentation',
                        'ENC': 'BE Electronics and Computer Engineering',
                        'MECH': 'BE Mechanical',
                        'MANU': 'BE Manufacturing'
                      }
                      
                      const fullBranchName = branchCodeMap[selectedBeBranch]
                      if (fullBranchName && beData[fullBranchName]) {
                        beCourses = beData[fullBranchName] || []
                      }
                    }
                    courseData = [...mscData, ...beCourses]
                    branchName = `${selectedMscBranch} Year 3 + BE ${selectedBeBranch} Year 2`
                  } else if (selectedYear === '4' && selectedBeBranch) {
                    shouldShow = true
                    const beData = branchCoursesData.BE?.year3
                    if (beData) {
                      // Map short codes back to full names
                      const branchCodeMap = {
                        'BIO': 'BE Biotechnology',
                        'CHEM': 'BE Chemical', 
                        'CIVIL': 'BE Civil',
                        'CSE': 'BE Computer Science',
                        'EEE': 'BE Electrical and Electronics',
                        'ECE': 'BE Electronics and Communications',
                        'ENI': 'BE Electronics and Instrumentation',
                        'ENC': 'BE Electronics and Computer Engineering',
                        'MECH': 'BE Mechanical',
                        'MANU': 'BE Manufacturing'
                      }
                      
                      const fullBranchName = branchCodeMap[selectedBeBranch]
                      if (fullBranchName && beData[fullBranchName]) {
                        courseData = beData[fullBranchName] || []
                        branchName = `BE ${fullBranchName.replace('BE ', '')} Year 3 (MSC Year 4)`
                      }
                    }
                  }
                }
                
                return shouldShow ? (
                  <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700">
                    <h4 className="font-medium mb-3" style={{color: '#c7c7c7'}}>
                      Courses to be enrolled - {branchName}:
                    </h4>
                    <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                      {courseData.map((courseId, index) => {
                        // Find the course name from allCourses
                        const courseName = allCourses.find(course => course.id === courseId)?.name || courseId
                        return (
                          <span key={`${courseId}-${index}`} className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-xs font-medium" title={courseId}>
                            {courseName}
                          </span>
                        )
                      })}
                    </div>
                    <p className="text-xs text-gray-400 mt-3">
                      {courseData.length} courses will be added to your enrollment
                    </p>
                  </div>
                ) : null
              })()}

              {/* Import Button */}
              {(() => {
                if (selectedYear === '1') return true
                if (selectedProgram === 'BE' && selectedBranch) return true
                if (selectedProgram === 'MSC' && selectedMscBranch) {
                  if (selectedYear === '2') return true
                  if ((selectedYear === '3' || selectedYear === '4') && selectedBeBranch) return true
                }
                return false
              })() && (
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
              <div key={c.id} className="course-card relative group cursor-pointer" onClick={() => window.location.href = `/course/${c.id}`}>
                {/* Remove button - positioned at top right */}
                <button
                  onClick={(e) => {
                    e.stopPropagation() // Prevent card click
                    handleEnrollClick(c.id, c.name || c.title)
                  }}
                  disabled={enrolling === c.id}
                  className="absolute top-2 right-2 w-8 h-8 text-xl bg-transparent hover:bg-gray-700/30 text-gray-500 hover:text-gray-300 transition-all duration-200 opacity-60 hover:opacity-100 z-10 flex items-center justify-center"
                  title="Remove course"
                >
                  {enrolling === c.id ? '⋯' : '✕'}
                </button>
                
                <div className="grow">
                  <h4 className="font-medium text-base mb-4 pr-8" style={{color: '#c7c7c7'}}>{c.name || c.title || 'Untitled course'}</h4>
                </div>
                <div className="mt-auto">
                  <Link 
                    to={`/course/${c.id}`}
                    className="text-xs font-medium" 
                    style={{color: 'var(--yellow)'}}
                    onClick={(e) => e.stopPropagation()}
                  >
                    View course →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
