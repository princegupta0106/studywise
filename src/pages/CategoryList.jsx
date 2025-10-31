import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getCourseItemsBySpecificCategory, getCourse } from '../firebase/api'

function displayName(item) {
  // With new structure, we have the name directly
  return item.name || 'Untitled Item'
}

function getEmbedUrl(url) {
  // Convert YouTube URLs to embed format
  if (url.includes('youtube.com/watch?v=')) {
    const videoId = url.split('v=')[1]?.split('&')[0]
    return `https://www.youtube.com/embed/${videoId}`
  }
  if (url.includes('youtu.be/')) {
    const videoId = url.split('youtu.be/')[1]?.split('?')[0]
    return `https://www.youtube.com/embed/${videoId}`
  }
  // For other video URLs, try to use them directly
  return url
}

export default function CategoryList() {
  const { courseId, category } = useParams()
  const [items, setItems] = useState(null)
  const [course, setCourse] = useState(null)
  const [selectedVideo, setSelectedVideo] = useState(null)

  useEffect(() => {
    let m = true
    async function load() {
      const decodedCategory = decodeURIComponent(category)
      const courseData = await getCourse(courseId)
      
      // Handle combined BITS Library PYQs category
      let categoryItems = []
      if (decodedCategory === 'bits library pyqs') {
        const bitsLibraryItems = await getCourseItemsBySpecificCategory(courseId, 'bits library')
        const pyqsItems = await getCourseItemsBySpecificCategory(courseId, 'PYQs and Solutions')
        categoryItems = [...bitsLibraryItems, ...pyqsItems]
      } else {
        categoryItems = await getCourseItemsBySpecificCategory(courseId, decodedCategory)
      }
      
      if (!m) return
      setCourse(courseData)
      setItems(categoryItems)
    }
    load()
    return () => { m = false }
  }, [courseId, category])

  if (!items) return <div>Loading {decodeURIComponent(category)}...</div>

  const decodedCategory = decodeURIComponent(category)
  
  // Category display info
  const categoryInfo = {
    'bits library pyqs': { displayName: 'BITS Library PYQs', color: 'bg-blue-600' },
    'bits library': { displayName: 'BITS Library PYQs', color: 'bg-blue-600' },
    'PYQs and Solutions': { displayName: 'BITS Library PYQs', color: 'bg-blue-600' },
    'others': { displayName: 'Files & Documents', color: 'bg-purple-600' },
    'videos': { displayName: 'Videos', color: 'bg-red-600' },
    'guide': { displayName: 'Guides & Articles', color: 'bg-yellow-600' }
  }

  const categoryDisplay = categoryInfo[decodedCategory] || { 
    displayName: decodedCategory, 
    color: 'bg-gray-600' 
  }

  return (
    <div>
      <div className="mb-4">
        <Link to={`/course/${courseId}`} className="text-yellow-500 hover:underline text-sm">
          ← Back to {course?.name || 'Course'}
        </Link>
      </div>
      
      <div className="flex items-center mb-8">
        <div className="mr-4">
          <h2 className="text-3xl font-bold text-white">{categoryDisplay.displayName}</h2>
          <p className="text-gray-400 text-lg">{items.length} items</p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No items in this category yet.</p>
        </div>
      ) : decodedCategory.toLowerCase() === 'videos' && selectedVideo ? (
        // Individual Video View
        <div>
          <div className="mb-4">
            <button 
              onClick={() => setSelectedVideo(null)}
              className="text-yellow-500 hover:text-warning text-sm transition-colors"
            >
              ← Back to Videos List
            </button>
          </div>
          <div className="bg-white/5 hover:bg-white/10 rounded p-4 transition-all duration-200 border border-transparent shadow-lg shadow-black/20">
            <h3 className="font-medium text-lg mb-4" style={{color: '#c7c7c7'}}>{displayName(selectedVideo)}</h3>
            <div className="aspect-video w-full">
              <iframe
                src={getEmbedUrl(selectedVideo.url)}
                title={displayName(selectedVideo)}
                className="w-full h-full rounded"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
            <div className="mt-4 flex justify-between items-center">
              <a 
                href={selectedVideo.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-yellow-500 text-sm font-medium hover:text-yellow-400 transition-colors"
              >
                Open Original Link →
              </a>
            </div>
          </div>
        </div>
      ) : decodedCategory.toLowerCase() === 'videos' ? (
        // Videos List View
        <div className="flex flex-wrap justify-start gap-4">
          {items.map((item, index) => {
            const title = displayName(item)
            
            return (
              <button
                key={index}
                onClick={() => setSelectedVideo(item)}
                className="block bg-white/5 hover:bg-white/10 rounded p-4 transition-all duration-200 border border-transparent w-[360px] shadow-lg shadow-black/20 text-left"
              >
                <h3 className="font-medium text-lg mb-3 truncate" style={{color: '#c7c7c7'}}>{title}</h3>
                <div className="text-yellow-500 text-sm font-medium">Play Video →</div>
              </button>
            )
          })}
        </div>
      ) : (
        // Other Categories
        <div className="flex flex-wrap justify-start gap-4">
          {items.map((item, index) => {
            const title = displayName(item)
            
            return (
              <a 
                key={index} 
                href={item.url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="block bg-white/5 hover:bg-white/10 rounded p-4 transition-all duration-200 border border-transparent w-[360px] shadow-lg shadow-black/20"
              >
                <h3 className="font-medium text-lg mb-3 truncate" style={{color: '#c7c7c7'}}>{title}</h3>
                <div className="text-yellow-500 text-sm font-medium">Open Link</div>
              </a>
            )
          })}
        </div>
      )}
    </div>
  )
}
