import React, { useState, useEffect } from 'react'
import { seed } from '../firebase/seedFirestore'
import { seedFromActualCSV } from '../firebase/csvSeedFirestore'
import { updateCourseList, getCourseList, addBitsLibraryItems } from '../firebase/api'
import { analyzeCSVData } from '../utils/csvAnalyzer'
import { useCachedAuth } from '../contexts/CachedAuthContext'

// Authorized user email - change this to your email
const AUTHORIZED_USER_EMAIL = 'f20230158@pilani.bits-pilani.ac.in'

export default function SeedPage() {
  const { user, loading: authLoading } = useCachedAuth()
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [courseListResult, setCourseListResult] = useState(null)
  const [csvResult, setCsvResult] = useState(null)
  const [csvFile, setCsvFile] = useState(null)
  const [csvAnalysis, setCsvAnalysis] = useState(null)
  
  // BITS Library states
  const [courseList, setCourseList] = useState([])
  const [selectedCourse, setSelectedCourse] = useState('')
  const [bitsLibraryData, setBitsLibraryData] = useState('')
  const [bitsLibraryResult, setBitsLibraryResult] = useState(null)

  // Load course list on component mount
  useEffect(() => {
    const loadCourses = async () => {
      try {
        const coursesMap = await getCourseList()
        // Convert map to array for dropdown
        const coursesArray = Object.entries(coursesMap).map(([id, data]) => ({
          id,
          name: data.name,
          description: data.description
        }))
        setCourseList(coursesArray)
      } catch (error) {
        console.error('Error loading courses:', error)
        setCourseList([]) // Set empty array on error
      }
    }
    loadCourses()
  }, [])

  const handleSeed = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await seed()
      setResult(res)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateCourseList = async () => {
    setLoading(true)
    setError(null)
    try {
      await updateCourseList()
      setCourseListResult('Course list collection updated successfully!')
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCSVUpload = (event) => {
    const file = event.target.files[0]
    setCsvFile(file)
    setCsvResult(null)
    setCsvAnalysis(null)
    setError(null)
  }

  const handleAnalyzeCSV = async () => {
    if (!csvFile) {
      setError('Please select a CSV file first')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const csvContent = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = (e) => resolve(e.target.result)
        reader.onerror = (e) => reject(e)
        reader.readAsText(csvFile)
      })

      const analysis = analyzeCSVData(csvContent)
      setCsvAnalysis(analysis)
      console.log('CSV Analysis:', analysis)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSeedFromCSV = async () => {
    if (!csvFile) {
      setError('Please select a CSV file first')
      return
    }

    setLoading(true)
    setError(null)
    setCsvResult(null)

    try {
      const csvContent = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = (e) => resolve(e.target.result)
        reader.onerror = (e) => reject(e)
        reader.readAsText(csvFile)
      })

      console.log('CSV file loaded, processing...')
      const createdCourses = await seedFromActualCSV(csvContent)
      setCsvResult({
        message: `Successfully created ${createdCourses.length} courses from CSV!`,
        courses: createdCourses
      })
    } catch (e) {
      console.error('CSV seeding error:', e)
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAddBitsLibrary = async () => {
    if (!selectedCourse) {
      setError('Please select a course')
      return
    }

    if (!bitsLibraryData.trim()) {
      setError('Please paste BITS Library data')
      return
    }

    setLoading(true)
    setError(null)
    setBitsLibraryResult(null)

    try {
      // Parse the JSON data
      const parsedData = JSON.parse(bitsLibraryData)
      
      if (!Array.isArray(parsedData)) {
        throw new Error('Data must be an array of objects')
      }

      // Validate data structure
      for (const item of parsedData) {
        if (!item.name || !item.url) {
          throw new Error('Each item must have "name" and "url" properties')
        }
      }

      // Add to course
      const result = await addBitsLibraryItems(selectedCourse, parsedData)
      
      setBitsLibraryResult({
        success: true,
        message: `Successfully added ${result.addedItems} BITS Library items to the course!`,
        addedItems: result.addedItems,
        totalItems: result.totalItems
      })
      
      // Clear the form
      setBitsLibraryData('')
      
    } catch (error) {
      console.error('BITS Library seeding error:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  // Loading state
  if (authLoading) {
    return (
      <div className="max-w-2xl mx-auto mt-10 p-6 border rounded">
        <div className="text-center py-8">
          <div className="text-lg">Loading...</div>
        </div>
      </div>
    )
  }

  // Not signed in
  if (!user) {
    return (
      <div className="max-w-2xl mx-auto mt-10 p-6 border rounded">
        <div className="text-center py-8">
          <div className="text-xl font-bold text-red-600 mb-4">Access Denied</div>
          <div className="text-gray-600">Please sign in to access this page.</div>
        </div>
      </div>
    )
  }

  // Not authorized user
  if (user.email !== AUTHORIZED_USER_EMAIL) {
    return (
      <div className="max-w-2xl mx-auto mt-10 p-6 border rounded">
        <div className="text-center py-8">
          <div className="text-xl font-bold text-red-600 mb-4">Access Denied</div>
          <div className="text-gray-600 mb-2">You are not authorized to access this page.</div>
          <div className="text-sm text-gray-500">
            Signed in as: <span className="font-mono">{user.email}</span>
          </div>
          <div className="text-sm text-gray-500">
            Contact admin for access.
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 border rounded">
      <h2 className="text-xl font-bold mb-4">Seed Firestore (Dev Only)</h2>
      <div className="mb-4 p-2 bg-green-50 border border-green-200 rounded text-green-700 text-sm">
        ✅ Authorized as: <span className="font-mono">{user.email}</span>
      </div>
      
      <div className="space-y-6">
        {/* Sample Data Seeding */}
        <div className="border-b pb-4">
          <h3 className="text-lg font-semibold mb-2">Sample Data</h3>
          <div className="space-y-2">
            <button onClick={handleSeed} disabled={loading} className="px-4 py-2 bg-blue-500 text-white rounded mr-2">
              {loading ? 'Seeding...' : 'Seed Sample Data'}
            </button>
            
            <button onClick={handleUpdateCourseList} disabled={loading} className="px-4 py-2 bg-green-500 text-white rounded">
              {loading ? 'Updating...' : 'Update Course List Collection'}
            </button>
          </div>
        </div>

        {/* CSV Data Seeding */}
        <div className="border-b pb-4">
          <h3 className="text-lg font-semibold mb-2">CSV Data Import</h3>
          <div className="space-y-2">
            <div>
              <label className="block text-sm font-medium mb-1">Select CSV File:</label>
              <input
                type="file"
                accept=".csv"
                onChange={handleCSVUpload}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>
            <div className="flex space-x-2">
              <button 
                onClick={handleAnalyzeCSV} 
                disabled={loading || !csvFile} 
                className="px-4 py-2 bg-orange-500 text-white rounded disabled:bg-gray-400"
              >
                {loading ? 'Analyzing...' : 'Analyze CSV'}
              </button>
              <button 
                onClick={handleSeedFromCSV} 
                disabled={loading || !csvFile} 
                className="px-4 py-2 bg-purple-500 text-white rounded disabled:bg-gray-400"
              >
                {loading ? 'Processing CSV...' : 'Seed from CSV'}
              </button>
            </div>
          </div>
          <p className="text-xs text-gray-600 mt-1">
            Expected format: "Name","URL","Path" with course files organized by folders
          </p>
        </div>

        {/* BITS Library Data Import */}
        <div className="border-b pb-4">
          <h3 className="text-lg font-semibold mb-2">Add BITS Library Items</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Select Course:</label>
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">-- Select a Course --</option>
                {courseList.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">BITS Library Data (JSON):</label>
              <textarea
                value={bitsLibraryData}
                onChange={(e) => setBitsLibraryData(e.target.value)}
                placeholder='[
  {
    "name": "Comprehensive - 2017 First Semester",
    "url": "https://library.bits-pilani.ac.in/backend-media/papers/..."
  },
  {
    "name": "Mid Semester - 2017 First Semester", 
    "url": "https://library.bits-pilani.ac.in/backend-media/papers/..."
  }
]'
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                rows="8"
              />
            </div>
            <button 
              onClick={handleAddBitsLibrary} 
              disabled={loading || !selectedCourse || !bitsLibraryData.trim()} 
              className="px-4 py-2 bg-yellow-500 text-white rounded disabled:bg-gray-400"
            >
              {loading ? 'Adding BITS Library Items...' : 'Add to BITS Library'}
            </button>
          </div>
          <p className="text-xs text-gray-600 mt-1">
            Paste JSON array with "name" and "url" properties. This will update the BITS Library section for the selected course.
          </p>
        </div>
      </div>
      
      {/* Results Display */}
      {result && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded text-green-700">
          <div>Sample data seeded! Course ID: <code className="bg-green-100 px-1 rounded">{result.courseId}</code></div>
        </div>
      )}
      
      {courseListResult && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded text-green-700">
          <div>{courseListResult}</div>
        </div>
      )}

      {csvAnalysis && (
        <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded text-orange-700">
          <div className="font-medium">CSV Analysis Complete</div>
          <div className="mt-2 text-sm">
            <p><strong>Found {csvAnalysis.length} courses</strong></p>
            <details className="cursor-pointer mt-2">
              <summary className="font-medium">View Course Details</summary>
              <div className="mt-2 space-y-2 max-h-60 overflow-y-auto">
                {csvAnalysis.map((course, index) => (
                  <div key={index} className="border-l-2 border-orange-200 pl-2">
                    <div className="font-medium">{course.name}</div>
                    <div className="text-xs text-gray-600">
                      {course.folders} folders, {course.totalFiles} total files
                    </div>
                    <div className="text-xs mt-1">
                      {Object.entries(course.folderDetails).map(([folder, count]) => (
                        <span key={folder} className="inline-block mr-2 mb-1 bg-orange-100 px-1 rounded">
                          {folder}: {count}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </details>
          </div>
        </div>
      )}

      {csvResult && (
        <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded text-purple-700">
          <div className="font-medium">{csvResult.message}</div>
          {csvResult.courses && csvResult.courses.length > 0 && (
            <div className="mt-2">
              <details className="cursor-pointer">
                <summary className="font-medium">View Created Courses ({csvResult.courses.length})</summary>
                <ul className="mt-2 space-y-1 text-sm">
                  {csvResult.courses.map((course, index) => (
                    <li key={index} className="flex justify-between">
                      <span>{course.name}</span>
                      <span className="text-purple-500 text-xs">
                        {course.folders} folders, {course.files} files
                      </span>
                    </li>
                  ))}
                </ul>
              </details>
            </div>
          )}
        </div>
      )}

      {bitsLibraryResult && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-yellow-700">
          <div className="font-medium">{bitsLibraryResult.message}</div>
          {bitsLibraryResult.success && (
            <div className="mt-2 text-sm">
              <p><strong>Added Items:</strong> {bitsLibraryResult.addedItems}</p>
              <p><strong>Total Course Items:</strong> {bitsLibraryResult.totalItems}</p>
            </div>
          )}
        </div>
      )}
      
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-600">
          <strong>Error:</strong> {error}
        </div>
      )}
    </div>
  )
}