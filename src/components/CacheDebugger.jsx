import React, { useState } from 'react'
import { getCacheStats, clearAllCache } from '../utils/localCache'

export default function CacheDebugger() {
  const [stats, setStats] = useState(null)
  const [showDebug, setShowDebug] = useState(false)

  const refreshStats = () => {
    setStats(getCacheStats())
  }

  const handleClearCache = () => {
    clearAllCache()
    refreshStats()
    window.location.reload() // Refresh to see the effect
  }

  if (!showDebug) {
    return (
      <button 
        onClick={() => {
          setShowDebug(true)
          refreshStats()
        }}
        className="fixed bottom-4 right-4 px-3 py-1 bg-gray-700 text-white rounded text-xs z-50"
      >
        📊 Cache
      </button>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 bg-gray-800 text-white p-4 rounded-lg shadow-lg text-xs z-50 min-w-64">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">LocalStorage Cache</h3>
        <button 
          onClick={() => setShowDebug(false)}
          className="text-gray-400 hover:text-white"
        >
          ✕
        </button>
      </div>
      
      {stats && (
        <div className="space-y-2">
          <div>👤 Users: {stats.users}</div>
          <div>📚 Courses: {stats.courses}</div>
          <div>📋 Course List: {stats.courseList}</div>
          <div className="border-t border-gray-600 pt-2">
            📊 Total: {stats.total} items
          </div>
          
          <div className="flex gap-2 mt-3">
            <button 
              onClick={refreshStats}
              className="px-2 py-1 bg-blue-600 rounded hover:bg-blue-700"
            >
              🔄 Refresh
            </button>
            <button 
              onClick={handleClearCache}
              className="px-2 py-1 bg-red-600 rounded hover:bg-red-700"
            >
              🗑️ Clear
            </button>
          </div>
        </div>
      )}
    </div>
  )
}