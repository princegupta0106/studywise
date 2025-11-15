import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getCourseItemsByCategory, getCourse, getCourseCategories } from '../firebase/api'

export default function CourseList() {
  const { courseId } = useParams()
  const [groups, setGroups] = useState(null)
  const [course, setCourse] = useState(null)
  const [categories, setCategories] = useState([])

  useEffect(() => {
    let m = true
    async function load() {
      const c = await getCourse(courseId)
      const g = await getCourseItemsByCategory(courseId)
      const cats = await getCourseCategories(courseId)
      if (!m) return
      setCourse(c)
      setGroups(g)
      setCategories(cats)
    }
    load()
    return () => { m = false }
  }, [courseId])



  if (!groups) return <div>Loading course overview...</div>

  // Define category display names and descriptions
  const categoryInfo = {
    'bits library pyqs': { 
      displayName: 'BITS Library PYQs', 
      description: 'Library resources, PYQs and solutions',
      color: 'bg-blue-600'
    },
    'bits library': { 
      displayName: 'BITS Library PYQs', 
      description: 'Library resources, PYQs and solutions',
      color: 'bg-blue-600'
    },
    'PYQs and Solutions': { 
      displayName: 'BITS Library PYQs', 
      description: 'Library resources, PYQs and solutions',
      color: 'bg-blue-600'
    },
    'others': { 
      displayName: 'Files & Documents', 
      description: 'Additional files and documents',
      color: 'bg-purple-600'
    },
    'group-chat': { 
      displayName: 'Group Chat', 
      description: 'Course discussion and chat',
      color: 'bg-green-600'
    },
    'guide': { 
      displayName: 'Guides & Articles', 
      description: 'Study guides and articles',
      color: 'bg-yellow-600'
    }
  }

  // Always show all standard categories regardless of content
  const allStandardCategories = ['bits library pyqs', 'guide', 'group-chat']
  const hasFolderItems = course?.folder_items && course.folder_items.length > 0
  
  // Create display categories: folders first, then standard categories
  const displayCategories = []
  if (hasFolderItems) {
    displayCategories.push('others')
  }
  displayCategories.push(...allStandardCategories)

  return (
    <div>
      {/* Back to Home Button */}
      <div className="mb-4">
        <Link 
          to="/" 
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors duration-200"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Home
        </Link>
      </div>
      
      <h2 className="text-2xl font-semibold mb-4">{course?.name || course?.title || 'Course'}</h2>
      {course?.description && (
        <p className="text-gray-600 mb-6">{course.description}</p>
      )}
      
      <div className="categories-grid">
        {displayCategories.map(category => {
          const info = categoryInfo[category] || { 
            displayName: category, 
            description: `${category} resources`,
            color: 'bg-gray-600'
          }
          // Combine counts for BITS Library PYQs category
          let itemCount = 0
          if (category === 'bits library pyqs') {
            itemCount = (groups['bits library'] || []).length + (groups['PYQs and Solutions'] || []).length
          } else {
            itemCount = (groups[category] || []).length
          }
          
          // Special handling for different category types
          let linkTo, itemDescription
          if (category === 'others') {
            linkTo = `/course/${courseId}/files`
            itemDescription = `${course?.folder_items?.length || 0} folders`
          } else if (category === 'group-chat') {
            const gcId = course?.gc || courseId  // Use course gc field or fall back to courseId
            linkTo = `/group-chat/${encodeURIComponent(gcId)}`
            itemDescription = 'Course discussion'
          } else {
            linkTo = `/course/${courseId}/category/${encodeURIComponent(category)}`
            itemDescription = `${itemCount} items`
          }
          
          return (
            <Link 
              key={category} 
              to={linkTo} 
              className="block bg-white/5 hover:bg-white/10 rounded p-4 border border-transparent w-[360px]"
            >
              <h3 className="font-medium text-lg mb-2 truncate" style={{color: 'var(--text-bright)'}}>{info.displayName}</h3>
              <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                {itemDescription}
              </p>
              <div className="text-yellow-500 text-sm font-medium">View →</div>
            </Link>
          )
        })}
      </div>
      
      {displayCategories.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>No content available in this course yet.</p>
        </div>
      )}
    </div>
  )
}
