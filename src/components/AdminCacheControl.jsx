import { useState } from 'react'
import { clearCacheAndRefresh, forceRefreshFromServer } from '../firebase/api'

export default function AdminCacheControl() {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState(null)

  const handleClearCache = async () => {
    setIsRefreshing(true)
    try {
      await clearCacheAndRefresh()
      setLastRefresh(new Date().toLocaleTimeString())
      alert('Cache cleared and fresh data loaded!')
    } catch (error) {
      console.error('Failed to clear cache:', error)
      alert('Error clearing cache: ' + error.message)
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleRefreshCourses = async () => {
    setIsRefreshing(true)
    try {
      await forceRefreshFromServer('courses')
      setLastRefresh(new Date().toLocaleTimeString())
      alert('Courses refreshed from server!')
    } catch (error) {
      console.error('Failed to refresh courses:', error)
      alert('Error refreshing courses: ' + error.message)
    } finally {
      setIsRefreshing(false)
    }
  }

  return (
    <div className="p-4 bg-gray-100 rounded-lg mb-4">
      <h3 className="text-lg font-semibold mb-3">Admin Cache Control</h3>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleClearCache}
          disabled={isRefreshing}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
        >
          {isRefreshing ? 'Refreshing...' : 'Clear All Cache'}
        </button>
        <button
          onClick={handleRefreshCourses}
          disabled={isRefreshing}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {isRefreshing ? 'Refreshing...' : 'Refresh Courses'}
        </button>
      </div>
      {lastRefresh && (
        <p className="text-sm text-gray-600 mt-2">
          Last refresh: {lastRefresh}
        </p>
      )}
      <p className="text-xs text-gray-500 mt-2">
        Use these controls after making changes to force fresh data from server
      </p>
    </div>
  )
}