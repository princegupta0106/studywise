import React, { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

export default function Content() {
  const { courseId, itemId } = useParams()
  const navigate = useNavigate()

  useEffect(() => {
    // With the new structure, individual content pages are not needed
    // All items are external links that open directly
    // Redirect back to the course page
    navigate(`/course/${courseId}`, { replace: true })
  }, [courseId, itemId, navigate])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-4">Redirecting...</h2>
        <p className="text-gray-600">Taking you back to the course page.</p>
      </div>
    </div>
  )
}
