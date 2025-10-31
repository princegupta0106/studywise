import React, { useEffect } from 'react'
import { preWarmCache, getCacheStats, backgroundCacheRefresh } from '../firebase/api'

/**
 * Cache initializer component
 * Place this in your main App component to initialize caching
 */
export function CacheInitializer() {
  useEffect(() => {
    // Initialize cache when app starts
    const initCache = async () => {
      try {
        // Small delay to let the app load first
        setTimeout(async () => {
          await preWarmCache()
          
          // Start background refresh cycle
          backgroundCacheRefresh()
          
          // Log cache stats for debugging
          if (process.env.NODE_ENV === 'development') {
            const stats = getCacheStats()
            console.log('Aggressive cache initialized. Stats:', stats)
          }
        }, 2000) // Slightly longer delay for aggressive caching
      } catch (error) {
        console.error('Failed to initialize cache:', error)
      }
    }

    initCache()
  }, [])

  // This component doesn't render anything
  return null
}

/**
 * Cache debug component for development
 * Shows cache statistics and provides controls
 */
export function CacheDebugPanel() {
  const [stats, setStats] = React.useState(null)
  const [showPanel, setShowPanel] = React.useState(false)

  const updateStats = () => {
    const newStats = getCacheStats()
    setStats(newStats)
  }

  useEffect(() => {
    if (showPanel) {
      updateStats()
      const interval = setInterval(updateStats, 2000)
      return () => clearInterval(interval)
    }
  }, [showPanel])

  // Only show in development mode
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <div style={{ position: 'fixed', top: 10, right: 10, zIndex: 9999 }}>
      <button
        onClick={() => setShowPanel(!showPanel)}
        style={{
          padding: '5px 10px',
          backgroundColor: '#333',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          fontSize: '12px',
          cursor: 'pointer'
        }}
      >
        Cache {showPanel ? '▼' : '▶'}
      </button>
      
      {showPanel && (
        <div style={{
          marginTop: '5px',
          padding: '10px',
          backgroundColor: '#333',
          color: 'white',
          borderRadius: '4px',
          fontSize: '12px',
          minWidth: '200px'
        }}>
          <div><strong>Cache Statistics</strong></div>
          {stats && (
            <>
              <div>Memory: {stats.memoryEntries} entries</div>
              <div>LocalStorage: {stats.localStorageEntries} entries</div>
              <div>Total: {stats.totalEntries} entries</div>
            </>
          )}
          <div style={{ marginTop: '10px' }}>
            <button
              onClick={() => {
                import('../firebase/api').then(api => {
                  api.invalidateAllCaches()
                  updateStats()
                })
              }}
              style={{
                padding: '3px 6px',
                backgroundColor: '#666',
                color: 'white',
                border: 'none',
                borderRadius: '2px',
                fontSize: '10px',
                cursor: 'pointer',
                marginRight: '5px'
              }}
            >
              Clear Cache
            </button>
            <button
              onClick={() => {
                import('../firebase/api').then(api => {
                  api.preWarmCache()
                  setTimeout(updateStats, 1000)
                })
              }}
              style={{
                padding: '3px 6px',
                backgroundColor: '#666',
                color: 'white',
                border: 'none',
                borderRadius: '2px',
                fontSize: '10px',
                cursor: 'pointer'
              }}
            >
              Pre-warm
            </button>
          </div>
        </div>
      )}
    </div>
  )
}