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
    'videos': { 
      displayName: 'Videos', 
      description: 'Video lectures and tutorials',
      color: 'bg-red-600'
    },
    'guide': { 
      displayName: 'Guides & Articles', 
      description: 'Study guides and articles',
      color: 'bg-yellow-600'
    }
  }

  // Always show all standard categories regardless of content
  const allStandardCategories = ['bits library pyqs', 'guide', 'videos']
  const hasFolderItems = course?.folder_items && course.folder_items.length > 0
  
  // Create display categories: folders first, then standard categories
  const displayCategories = []
  if (hasFolderItems) {
    displayCategories.push('others')
  }
  displayCategories.push(...allStandardCategories)

  return (
    <div>
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
          
          // Special handling for "Files & Documents" category
          const linkTo = category === 'others' 
            ? `/course/${courseId}/files`
            : `/course/${courseId}/category/${encodeURIComponent(category)}`
          
          return (
            <Link 
              key={category} 
              to={linkTo} 
              className="block bg-white/5 hover:bg-white/10 rounded p-4 transition-all duration-200 border border-transparent w-[360px] shadow-lg shadow-black/20"
            >
              <h3 className="font-medium text-lg mb-2 truncate" style={{color: 'var(--text-bright)'}}>{info.displayName}</h3>
              <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                {category === 'others' 
                  ? `${course?.folder_items?.length || 0} folders` 
                  : `${itemCount} items`}
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
