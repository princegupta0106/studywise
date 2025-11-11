// Simple localStorage-based caching utility
// Keys used: 'user-{email}', 'course-list', 'course-{courseId}'

const CACHE_EXPIRY_HOURS = 24 // Cache expires after 24 hours
const USER_PREFIX = 'user-'
const COURSE_PREFIX = 'course-'
const COURSE_LIST_KEY = 'course-list'

// Helper to check if cache item is expired
function isCacheExpired(timestamp) {
  if (!timestamp) return true
  const now = Date.now()
  const expiryTime = CACHE_EXPIRY_HOURS * 60 * 60 * 1000 // 24 hours in ms
  return (now - timestamp) > expiryTime
}

// Generic cache functions
export function getCacheItem(key) {
  try {
    const cached = localStorage.getItem(key)
    if (!cached) {
      console.log(`📂 Cache miss: ${key}`)
      return null
    }
    
    const data = JSON.parse(cached)
    
    // Check if expired
    if (isCacheExpired(data.timestamp)) {
      localStorage.removeItem(key)
      console.log(`⏰ Cache expired: ${key}`)
      return null
    }
    
    console.log(`✅ Cache hit: ${key}`)
    return data.value
  } catch (error) {
    console.warn(`❌ Cache read error for ${key}:`, error)
    localStorage.removeItem(key) // Clean up corrupted data
    return null
  }
}

export function setCacheItem(key, value) {
  try {
    const data = {
      value,
      timestamp: Date.now()
    }
    localStorage.setItem(key, JSON.stringify(data))
    console.log(`💾 Cached: ${key}`)
  } catch (error) {
    console.warn(`❌ Cache write error for ${key}:`, error)
  }
}

export function removeCacheItem(key) {
  localStorage.removeItem(key)
  console.log(`🗑️ Cache cleared: ${key}`)
}

// User-specific cache functions
export function getCachedUser(userEmail) {
  return getCacheItem(USER_PREFIX + userEmail)
}

export function setCachedUser(userEmail, userData) {
  setCacheItem(USER_PREFIX + userEmail, userData)
}

export function removeCachedUser(userEmail) {
  removeCacheItem(USER_PREFIX + userEmail)
}

// Course list cache functions
export function getCachedCourseList() {
  return getCacheItem(COURSE_LIST_KEY)
}

export function setCachedCourseList(courseList) {
  setCacheItem(COURSE_LIST_KEY, courseList)
}

export function removeCachedCourseList() {
  removeCacheItem(COURSE_LIST_KEY)
}

// Individual course cache functions
export function getCachedCourse(courseId) {
  return getCacheItem(COURSE_PREFIX + courseId)
}

export function setCachedCourse(courseId, courseData) {
  setCacheItem(COURSE_PREFIX + courseId, courseData)
}

export function removeCachedCourse(courseId) {
  removeCacheItem(COURSE_PREFIX + courseId)
}

// Clear all cache
export function clearAllCache() {
  const keys = Object.keys(localStorage)
  keys.forEach(key => {
    if (key.startsWith(USER_PREFIX) || 
        key.startsWith(COURSE_PREFIX) || 
        key === COURSE_LIST_KEY) {
      localStorage.removeItem(key)
    }
  })
  console.log('🧹 All cache cleared')
}

// Get cache stats
export function getCacheStats() {
  const keys = Object.keys(localStorage)
  const stats = {
    users: 0,
    courses: 0,
    courseList: 0,
    total: 0
  }
  
  keys.forEach(key => {
    if (key.startsWith(USER_PREFIX)) stats.users++
    else if (key.startsWith(COURSE_PREFIX)) stats.courses++
    else if (key === COURSE_LIST_KEY) stats.courseList++
  })
  
  stats.total = stats.users + stats.courses + stats.courseList
  return stats
}

// Invalidate user enrollment cache - called when user enrolls/unenrolls
export function invalidateUserEnrollmentCache(userEmail) {
  console.log(`🔄 Invalidating enrollment cache for user: ${userEmail}`)
  removeCachedUser(userEmail)
  // Could also clear related course caches if needed
}