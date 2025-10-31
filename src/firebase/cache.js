/**
 * Firebase Cache Manager
 * Implements multi-layer caching: Memory → LocalStorage → IndexedDB
 * Ultra-persistent storage with massive TTL values to minimize Firebase reads
 */

import indexedDBCache from './indexedDBCache.js'

const CACHE_PREFIX = 'goalwise_cache_'
const DEFAULT_TTL = 24 * 60 * 60 * 1000 // 24 hours in milliseconds (much longer default)

// Items that should be cached permanently (only cleared manually)
const PERMANENT_CACHE_TYPES = ['auth', 'courses', 'course', 'courseItems', 'courseItemsByCategory']

// Cache configuration for different data types - MAXIMUM PERSISTENCE
const CACHE_CONFIG = {
  // Course data - cache for very long periods (courses rarely change)
  courses: { ttl: 7 * 24 * 60 * 60 * 1000 }, // 7 days
  course: { ttl: 7 * 24 * 60 * 60 * 1000 }, // 7 days
  courseItems: { ttl: 7 * 24 * 60 * 60 * 1000 }, // 7 days
  courseItemsByCategory: { ttl: 7 * 24 * 60 * 60 * 1000 }, // 7 days
  courseItemsByType: { ttl: 7 * 24 * 60 * 60 * 1000 }, // 7 days (backward compatibility)
  
  // User data - cache for long periods (user info rarely changes)
  users: { ttl: 24 * 60 * 60 * 1000 }, // 24 hours
  
  // Auth data - keep user logged in permanently
  auth: { ttl: 365 * 24 * 60 * 60 * 1000 }, // 1 year
  
  // Chat data - still needs some freshness but longer than before
  chats: { ttl: 30 * 60 * 1000 }, // 30 minutes
}

class CacheManager {
  constructor() {
    this.memoryCache = new Map()
    this.init()
  }

  init() {
    // Clean up expired cache entries on initialization
    this.cleanup()
    
    // Set up periodic cleanup (every 5 minutes)
    setInterval(() => this.cleanup(), 5 * 60 * 1000)
  }

  /**
   * Generate cache key
   */
  getCacheKey(type, id = null) {
    return `${CACHE_PREFIX}${type}${id ? `_${id}` : ''}`
  }

  /**
   * Get TTL for a data type
   */
  getTTL(type) {
    return CACHE_CONFIG[type]?.ttl || DEFAULT_TTL
  }

  /**
   * Check if cache entry is expired
   */
  isExpired(timestamp, ttl, type = null) {
    // Permanent cache types never expire
    if (type && PERMANENT_CACHE_TYPES.includes(type)) {
      return false
    }
    return Date.now() - timestamp > ttl
  }

  /**
   * Get data from cache (memory + localStorage + IndexedDB)
   */
  async get(type, id = null) {
    const key = this.getCacheKey(type, id)
    const ttl = this.getTTL(type)

    // Check memory cache first (fastest)
    if (this.memoryCache.has(key)) {
      const memoryEntry = this.memoryCache.get(key)
      if (!this.isExpired(memoryEntry.timestamp, ttl, type)) {
        console.log(`[Cache HIT - Memory] ${key}`)
        return memoryEntry.data
      } else if (!PERMANENT_CACHE_TYPES.includes(type)) {
        this.memoryCache.delete(key)
      }
    }

    // Check localStorage
    try {
      const stored = localStorage.getItem(key)
      if (stored) {
        const entry = JSON.parse(stored)
        if (!this.isExpired(entry.timestamp, ttl, entry.type || type)) {
          // Update memory cache
          this.memoryCache.set(key, entry)
          console.log(`[Cache HIT - LocalStorage] ${key}`)
          return entry.data
        } else if (!PERMANENT_CACHE_TYPES.includes(entry.type || type)) {
          localStorage.removeItem(key)
        }
      }
    } catch (error) {
      console.warn(`[Cache] Error reading from localStorage for ${key}:`, error)
    }

    // Check IndexedDB for permanent cache types or large content
    if (PERMANENT_CACHE_TYPES.includes(type)) {
      try {
        const indexedEntry = await indexedDBCache.get(key)
        if (indexedEntry && indexedEntry.data) {
          // Update memory and localStorage caches
          const entry = {
            data: indexedEntry.data,
            timestamp: indexedEntry.timestamp,
            type: indexedEntry.type
          }
          this.memoryCache.set(key, entry)
          try {
            localStorage.setItem(key, JSON.stringify(entry))
          } catch (lsError) {
            // localStorage might be full, but we have IndexedDB
            console.warn(`[Cache] localStorage full, but IndexedDB hit for ${key}`)
          }
          console.log(`[Cache HIT - IndexedDB] ${key}`)
          return indexedEntry.data
        }
      } catch (error) {
        console.warn(`[Cache] Error reading from IndexedDB for ${key}:`, error)
      }
    }

    console.log(`[Cache MISS] ${key}`)
    return null
  }

  /**
   * Store data in cache (memory + localStorage + IndexedDB)
   */
  async set(type, data, id = null) {
    const key = this.getCacheKey(type, id)
    const entry = {
      data,
      timestamp: Date.now(),
      type,
      id
    }

    // Store in memory cache
    this.memoryCache.set(key, entry)

    // Store in localStorage
    try {
      localStorage.setItem(key, JSON.stringify(entry))
      console.log(`[Cache SET] ${key}`)
    } catch (error) {
      console.warn(`[Cache] Error writing to localStorage for ${key}:`, error)
      // If localStorage is full, try to clean up old items
      this.cleanup()
      try {
        localStorage.setItem(key, JSON.stringify(entry))
      } catch (retryError) {
        console.error(`[Cache] Failed to store ${key} even after cleanup:`, retryError)
      }
    }

    // Store in IndexedDB for permanent cache types
    if (PERMANENT_CACHE_TYPES.includes(type)) {
      try {
        await indexedDBCache.set(key, data, type)
      } catch (error) {
        console.warn(`[Cache] Error writing to IndexedDB for ${key}:`, error)
      }
    }
  }

  /**
   * Invalidate specific cache entry
   */
  invalidate(type, id = null) {
    const key = this.getCacheKey(type, id)
    this.memoryCache.delete(key)
    localStorage.removeItem(key)
    console.log(`[Cache INVALIDATE] ${key}`)
  }

  /**
   * Invalidate all cache entries of a specific type
   */
  invalidateType(type) {
    const pattern = this.getCacheKey(type)
    
    // Clear from memory cache
    for (const key of this.memoryCache.keys()) {
      if (key.startsWith(pattern)) {
        this.memoryCache.delete(key)
      }
    }

    // Clear from localStorage
    const keysToRemove = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(pattern)) {
        keysToRemove.push(key)
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key))
    
    console.log(`[Cache INVALIDATE TYPE] ${type} (${keysToRemove.length} entries)`)
  }

  /**
   * Clear all cache
   */
  clear() {
    this.memoryCache.clear()
    
    const keysToRemove = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(CACHE_PREFIX)) {
        keysToRemove.push(key)
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key))
    
    console.log(`[Cache CLEAR] Removed ${keysToRemove.length} entries`)
  }

  /**
   * Clean up expired entries
   */
  cleanup() {
    let cleanedCount = 0

    // Clean memory cache (skip permanent types)
    for (const [key, entry] of this.memoryCache.entries()) {
      const type = entry.type
      const ttl = this.getTTL(type)
      if (!PERMANENT_CACHE_TYPES.includes(type) && this.isExpired(entry.timestamp, ttl, type)) {
        this.memoryCache.delete(key)
        cleanedCount++
      }
    }

    // Clean localStorage
    const keysToRemove = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(CACHE_PREFIX)) {
        try {
          const stored = localStorage.getItem(key)
          if (stored) {
            const entry = JSON.parse(stored)
            const type = entry.type
            const ttl = this.getTTL(type)
            if (!PERMANENT_CACHE_TYPES.includes(type) && this.isExpired(entry.timestamp, ttl, type)) {
              keysToRemove.push(key)
            }
          }
        } catch (error) {
          // Invalid JSON, remove it
          keysToRemove.push(key)
        }
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key))
    cleanedCount += keysToRemove.length

    if (cleanedCount > 0) {
      console.log(`[Cache CLEANUP] Removed ${cleanedCount} expired entries`)
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const memorySize = this.memoryCache.size
    let localStorageSize = 0
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(CACHE_PREFIX)) {
        localStorageSize++
      }
    }

    return {
      memoryEntries: memorySize,
      localStorageEntries: localStorageSize,
      totalEntries: memorySize + localStorageSize
    }
  }

  /**
   * Pre-warm cache with data
   */
  preWarm(type, dataList) {
    console.log(`[Cache PREWARM] ${type} with ${dataList.length} items`)
    dataList.forEach(item => {
      if (item.id) {
        this.set(type, item, item.id)
      }
    })
  }
}

// Create singleton instance
const cacheManager = new CacheManager()

// Helper functions for easier usage
export const cache = {
  get: async (type, id) => await cacheManager.get(type, id),
  set: async (type, data, id) => await cacheManager.set(type, data, id),
  invalidate: (type, id) => cacheManager.invalidate(type, id),
  invalidateType: (type) => cacheManager.invalidateType(type),
  clear: () => cacheManager.clear(),
  cleanup: () => cacheManager.cleanup(),
  getStats: () => cacheManager.getStats(),
  preWarm: (type, dataList) => cacheManager.preWarm(type, dataList),
  
  // Persistent auth helpers
  setUserAuth: async (userData) => {
    try {
      return await cacheManager.set('auth', userData, 'user')
    } catch (error) {
      console.error('Error setting user auth cache:', error)
      return false
    }
  },
  getUserAuth: async () => {
    try {
      return await cacheManager.get('auth', 'user')
    } catch (error) {
      console.error('Error getting user auth cache:', error)  
      return null
    }
  },
  clearUserAuth: () => {
    try {
      return cacheManager.invalidate('auth', 'user')
    } catch (error) {
      console.error('Error clearing user auth cache:', error)
      return false
    }
  },
  
  // Force clear permanent cache (admin only)
  clearPermanentCache: async () => {
    await indexedDBCache.clear()
    PERMANENT_CACHE_TYPES.forEach(type => {
      cacheManager.invalidateType(type)
    })
    console.log('Permanent cache cleared')
  },
  
  // Clear just course-related cache
  clearCourseCache: () => {
    cacheManager.invalidateType('courses')
    cacheManager.invalidateType('course')
    cacheManager.invalidateType('courseItems')
    cacheManager.invalidateType('courseItemsByCategory')
    console.log('Course cache cleared - will fetch fresh data')
  }
}

export default cacheManager