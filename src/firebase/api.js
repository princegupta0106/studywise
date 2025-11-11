import { db } from './config'
import { doc, getDoc, collection, getDocs, query, where, orderBy, addDoc, setDoc } from 'firebase/firestore'
import { 
  getCachedUser, setCachedUser,
  getCachedCourseList, setCachedCourseList,
  getCachedCourse, setCachedCourse,
  removeCachedCourse
} from '../utils/localCache'

// ========================================
// REQUEST DEDUPLICATION & AGGRESSIVE CACHING
// ========================================

// Global request cache to prevent duplicate API calls
const pendingRequests = new Map()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes
const requestCache = new Map()

function deduplicateRequest(key, apiCall) {
  // Check if we have a cached result that's still fresh
  const cached = requestCache.get(key)
  if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
    console.log(`🚀 Returning cached result for: ${key}`)
    return Promise.resolve(cached.data)
  }

  // Check if request is already pending
  if (pendingRequests.has(key)) {
    console.log(`⏳ Deduplicating request for: ${key}`)
    return pendingRequests.get(key)
  }
  
  // Execute the API call
  const promise = apiCall().then(result => {
    // Cache the result
    requestCache.set(key, {
      data: result,
      timestamp: Date.now()
    })
    console.log(`💾 Cached API result for: ${key}`)
    return result
  }).finally(() => {
    pendingRequests.delete(key)
  })
  
  pendingRequests.set(key, promise)
  return promise
}

// Clear request cache when needed
function clearRequestCache() {
  requestCache.clear()
  pendingRequests.clear()
  console.log('🧹 Request cache cleared')
}

// Users: collection 'users' -> each doc id = email, fields: name, courses: [courseId,...]
// Note: Email is used as document ID for easier access and management
// NEW STRUCTURE:
// Courses: collection 'courses' -> auto-generated ID with:
//   {
//     name, 
//     description, 
//     items: [{ name, url, category }]
//     categories: ["bits library", "PYQs and Solutions", "others", "videos", "guide"]
//   }

// Helper function to invalidate user cache
export async function invalidateUserCache(uid) {
  const { removeCachedUser } = await import('../utils/localCache')
  removeCachedUser(uid)
  console.log(`🗑️ User cache invalidated for: ${uid}`)
}

// Get user by email (document ID) with aggressive caching
export function getUserById(userEmail, forceRefresh = false) {
  const cacheKey = `user:${userEmail}`
  
  return deduplicateRequest(cacheKey, async () => {
    try {
      if (!forceRefresh) {
        // 1. Check localStorage first
        const cachedUser = getCachedUser(userEmail)
        if (cachedUser) {
          console.log(`✅ User ${userEmail} loaded from localStorage`)
          return cachedUser
        }
      }
      
      // 2. Cache miss or force refresh - call API (THIS IS THE ONLY FIREBASE READ)
      console.log(`🌐 Fetching user ${userEmail} from Firebase`)
      const ref = doc(db, 'users', userEmail)
      const snap = await getDoc(ref)
      const userData = snap.exists() ? { id: snap.id, ...snap.data() } : null
      
      // 3. Put in localStorage
      if (userData) {
        setCachedUser(userEmail, userData)
      }
      
      return userData
    } catch (error) {
      console.error('Error getting user by email:', error)
      return null
    }
  })
}

export async function listCourses() {
  const cacheKey = 'courses:list'
  
  return deduplicateRequest(cacheKey, async () => {
    try {
      // 1. Check localStorage first
      const cachedCourseList = getCachedCourseList()
      if (cachedCourseList) {
        console.log('✅ Course list loaded from localStorage')
        return cachedCourseList
      }
      
      // 2. Cache miss - call API (THIS IS THE ONLY FIREBASE READ)
      console.log('🌐 Fetching course list from Firebase')
      const snap = await getDocs(collection(db, 'courses'))
      const courses = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      
      // 3. Put in localStorage
      setCachedCourseList(courses)
      
      return courses
    } catch (error) {
      console.error('Error listing courses:', error)
      return []
    }
  })
}

export async function getCourse(courseId) {
  const cacheKey = `course:${courseId}`
  
  return deduplicateRequest(cacheKey, async () => {
    try {
      // 1. Check localStorage first
      const cachedCourse = getCachedCourse(courseId)
      if (cachedCourse) {
        console.log(`✅ Course ${courseId.slice(0,8)} loaded from localStorage`)
        return cachedCourse
      }
      
      // 2. Cache miss - call API (THIS IS THE ONLY FIREBASE READ)
      console.log(`🌐 Fetching course ${courseId.slice(0,8)} from Firebase`)
      const ref = doc(db, 'courses', courseId)
      const snap = await getDoc(ref)
      const courseData = snap.exists() ? { id: snap.id, ...snap.data() } : null
      
      // 3. Put in localStorage
      if (courseData) {
        setCachedCourse(courseId, courseData)
      }
      
      return courseData
    } catch (error) {
      console.error('Error getting course:', error)
      return null
    }
  })
}

export async function getCourseItems(courseId) {
  const course = await getCourse(courseId)
  if (!course) return []
  
  // NEW STRUCTURE: course.items is already array of { name, url, category }
  const items = course.items || []
  
  return items
}


// OLD FUNCTIONS REMOVED - New structure stores items directly in course
// No need for separate collections for articles, videos, slides, files

export async function getCourseItemsByCategory(courseId) {
  const items = await getCourseItems(courseId)
  const grouped = items.reduce((acc, item) => {
    const category = item.category || 'others'
    acc[category] = acc[category] || []
    acc[category].push(item)
    return acc
  }, {})
  
  return grouped
}

// For backward compatibility - alias the old function name
export async function getCourseItemsByType(courseId) {
  return await getCourseItemsByCategory(courseId)
}

// Get available categories for a course
export async function getCourseCategories(courseId) {
  const course = await getCourse(courseId)
  if (!course) return []
  
  // Get unique categories from items
  const items = course.items || []
  const categories = [...new Set(items.map(item => item.category || 'others'))]
  
  return categories.sort()
}

// Filter course items by specific category
export async function getCourseItemsBySpecificCategory(courseId, category) {
  const items = await getCourseItems(courseId)
  return items.filter(item => (item.category || 'others') === category)
}

// Create a new course with the new structure
export async function createCourse(name, description = '') {
  const courseData = {
    name,
    description,
    items: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
  
  const docRef = await addDoc(collection(db, 'courses'), courseData)
  
  // Update the course list document
  try {
    await updateCourseList()
  } catch (error) {
    console.warn('Failed to update course list:', error)
  }
  
  return { id: docRef.id, ...courseData }
}

// Add item to course
export async function addItemToCourse(courseId, item) {
  const { name, url, category = 'others' } = item
  
  if (!name || !url) {
    throw new Error('Item name and URL are required')
  }
  
  const courseRef = doc(db, 'courses', courseId)
  const courseSnap = await getDoc(courseRef)
  
  if (!courseSnap.exists()) {
    throw new Error('Course not found')
  }
  
  const courseData = courseSnap.data()
  const currentItems = courseData.items || []
  
  const newItem = { name, url, category }
  const updatedItems = [...currentItems, newItem]
  
  await setDoc(courseRef, {
    items: updatedItems,
    updatedAt: new Date().toISOString()
  }, { merge: true })
  
  return newItem
}

// Remove item from course
export async function removeItemFromCourse(courseId, itemIndex) {
  const courseRef = doc(db, 'courses', courseId)
  const courseSnap = await getDoc(courseRef)
  
  if (!courseSnap.exists()) {
    throw new Error('Course not found')
  }
  
  const courseData = courseSnap.data()
  const currentItems = courseData.items || []
  
  if (itemIndex < 0 || itemIndex >= currentItems.length) {
    throw new Error('Invalid item index')
  }
  
  const updatedItems = currentItems.filter((_, index) => index !== itemIndex)
  
  await setDoc(courseRef, {
    items: updatedItems,
    updatedAt: new Date().toISOString()
  }, { merge: true })
  
  // Invalidate course cache
  removeCachedCourse(courseId)
  
  return updatedItems
}

// getVideoById removed - items are now stored directly in course structure

// Chat management functions with new structure
export async function createOrGetUserChat(userId, userEmail, userName) {
  // First check if user already has a chat
  const userRef = doc(db, 'users', userId)
  const userSnap = await getDoc(userRef)
  
  if (userSnap.exists() && userSnap.data().chatId) {
    // User already has a chat, return the existing chat ID
    const chatRef = doc(db, 'chats', userSnap.data().chatId)
    const chatSnap = await getDoc(chatRef)
    if (chatSnap.exists()) {
      return userSnap.data().chatId
    }
  }
  
  // Create new chat document with auto-generated ID
  const chatRef = await addDoc(collection(db, 'chats'), {
    userId: userId,
    messages: []
  })
  
  // Update user document with chatId
  await setDoc(userRef, {
    name: userName,
    email: userEmail,
    chatId: chatRef.id
  }, { merge: true })
  
  return chatRef.id
}

export async function addMessageToChat(chatId, message) {
  const chatRef = doc(db, 'chats', chatId)
  const chatSnap = await getDoc(chatRef)
  
  if (!chatSnap.exists()) {
    throw new Error('Chat not found')
  }
  
  const currentMessages = chatSnap.data().messages || []
  const newMessage = {
    from: message.from, // admin email or user email
    name: message.name,
    time: new Date().toISOString(),
    text: message.text
  }
  
  const updatedMessages = [...currentMessages, newMessage]
  
  await setDoc(chatRef, {
    messages: updatedMessages
  }, { merge: true })
  
  return newMessage
}

export async function getChatMessages(chatId) {
  const chatRef = doc(db, 'chats', chatId)
  const chatSnap = await getDoc(chatRef)
  
  if (!chatSnap.exists()) {
    return []
  }
  
  return chatSnap.data().messages || []
}

export async function getAllChats() {
  const chatsCollection = collection(db, 'chats')
  // Try cache first, fallback to server for chats
  let snapshot
  try {
    snapshot = await getDocsFromCache(chatsCollection)
    console.log('✅ Chats loaded from cache')
  } catch (cacheError) {
    snapshot = await getDocs(chatsCollection)
    console.log('🌐 Chats loaded from server')
  }
  
  const chats = []
  for (const chatDoc of snapshot.docs) {
    const chatData = chatDoc.data()
    
    // Get user info with cache
    const userRef = doc(db, 'users', chatData.userId)
    let userSnap
    try {
      userSnap = await getDocFromCache(userRef)
    } catch (cacheError) {
      userSnap = await getDoc(userRef)
    }
    const userData = userSnap.exists() ? userSnap.data() : null
    
    chats.push({
      id: chatDoc.id,
      userId: chatData.userId,
      userName: userData?.name || 'Unknown User',
      userEmail: userData?.email || '',
      messages: chatData.messages || [],
      lastMessage: chatData.messages?.length > 0 ? chatData.messages[chatData.messages.length - 1] : null
    })
  }
  
  return chats.sort((a, b) => {
    if (!a.lastMessage) return 1
    if (!b.lastMessage) return -1
    return new Date(b.lastMessage.time) - new Date(a.lastMessage.time)
  })
}

// Cache functions removed - no longer using caching

// Course List Management - Single document with course ID/name map
export async function updateCourseList() {
  try {
    const coursesSnapshot = await getDocs(collection(db, 'courses'))
    const courseMap = {}
    
    coursesSnapshot.docs.forEach(doc => {
      const data = doc.data()
      courseMap[doc.id] = {
        name: data.name || data.title || 'Untitled Course',
        description: data.description || ''
      }
    })
    
    // Update the single course-list document
    const courseListRef = doc(db, 'course-list', 'all-courses')
    await setDoc(courseListRef, { courses: courseMap })
    
    console.log('Course list updated successfully')
    return courseMap
  } catch (error) {
    console.error('Error updating course list:', error)
    throw error
  }
}

export async function getCourseList() {
  const cacheKey = 'courselist:all'
  
  return deduplicateRequest(cacheKey, async () => {
    try {
      // 1. Check localStorage first
      const cachedCourseList = getCachedCourseList()
      if (cachedCourseList) {
        // Return as map format expected by existing code
        const courseMap = {}
        cachedCourseList.forEach(course => {
          courseMap[course.id] = { name: course.name, description: course.description }
        })
        console.log('✅ Course list map loaded from localStorage')
        return courseMap
      }
      
      // 2. Cache miss - call API (SINGLE FIREBASE READ)
      console.log('🌐 Fetching course list document from Firebase')
      const courseListRef = doc(db, 'course-list', 'all-courses')
      const courseListSnap = await getDoc(courseListRef)
      
      if (courseListSnap.exists()) {
        const courseMap = courseListSnap.data().courses || {}
        
        // 3. Convert to array format and put in localStorage
        const coursesArray = Object.entries(courseMap).map(([id, data]) => ({
          id,
          name: data.name,
          description: data.description
        }))
        setCachedCourseList(coursesArray)
        
        // 4. Return the map format
        return courseMap
      } else {
        // If document doesn't exist, create it (ONE-TIME ONLY)
        console.log('Course list document not found, creating it...')
        return await updateCourseList()
      }
    } catch (error) {
      console.error('Error getting course list:', error)
      // Fallback - but this should rarely happen
      const courses = await listCourses()
      const courseMap = {}
      courses.forEach(course => {
        courseMap[course.id] = {
          name: course.name || course.title || 'Untitled Course',
          description: course.description || ''
        }
      })
      return courseMap
    }
  })
}

// Pre-warming function for frequently accessed content - AGGRESSIVE CACHING
export async function preWarmCache() {
  try {
    console.log('Starting aggressive cache pre-warming...')
    
    // Pre-warm courses
    const courses = await listCourses() // This will cache the course list and individual courses
    console.log(`Pre-warmed ${courses.length} courses`)
    
    // Pre-warm ALL courses and their items (not just top 3)
    for (const course of courses) {
      try {
        const courseItems = await getCourseItems(course.id) // This will cache course items
        await getCourseItemsByType(course.id) // This will cache grouped items
        
        // Pre-warm all individual content items
        for (const item of courseItems) {
          if (item.data && item.data.id) {
            // Content is already cached by getCourseItems, but this ensures it
            console.log(`Pre-warmed ${item.type}: ${item.data.id}`)
          }
        }
        
        console.log(`Pre-warmed course ${course.id} with ${courseItems.length} items`)
      } catch (error) {
        console.warn(`Failed to pre-warm course ${course.id}:`, error)
      }
    }
    
    console.log('Aggressive cache pre-warming completed - all content cached!')
  } catch (error) {
    console.error('Cache pre-warming failed:', error)
  }
}

// Background cache refresh function
export async function backgroundCacheRefresh() {
  try {
    console.log('Starting background cache refresh...')
    
    // No background refresh needed - direct Firebase calls always get fresh data
    
  } catch (error) {
    console.error('Background cache refresh setup failed:', error)
  }
}

// Force refresh from server when admin makes changes
export async function forceRefreshFromServer(collectionName, docId = null) {
  try {
    console.log('🔄 Force refreshing from server:', collectionName, docId)
    
    if (docId) {
      // Refresh specific document
      const ref = doc(db, collectionName, docId)
      const snap = await getDocFromServer(ref)
      console.log('✅ Document force refreshed from server:', docId.substring(0,8) + '...')
      return snap.exists() ? { id: snap.id, ...snap.data() } : null
    } else {
      // Refresh entire collection
      const snap = await getDocsFromServer(collection(db, collectionName))
      console.log('✅ Collection force refreshed from server:', collectionName, '(' + snap.docs.length + ' docs)')
      return snap.docs.map(d => ({ id: d.id, ...d.data() }))
    }
  } catch (error) {
    console.error('Error force refreshing from server:', error)
    return null
  }
}

// Clear cache and force refresh everything
export async function clearCacheAndRefresh() {
  try {
    console.log('🧹 Clearing cache and forcing fresh data...')
    
    // Force refresh key collections
    await forceRefreshFromServer('courses')
    await forceRefreshFromServer('course-list', 'all-courses')
    
    console.log('✅ Cache cleared and fresh data loaded')
  } catch (error) {
    console.error('Failed to clear cache and refresh:', error)
  }
}

// Updated createCourse to force refresh after creation
export async function createCourseWithRefresh(name, description = '') {
  const courseData = {
    name,
    description,
    items: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
  
  const docRef = await addDoc(collection(db, 'courses'), courseData)
  
  // Update course list and force refresh cache
  try {
    await updateCourseList()
    // Force refresh the courses from server to update cache
    await forceRefreshFromServer('courses')
    console.log('✅ Course created and cache refreshed')
  } catch (error) {
    console.warn('Failed to refresh cache after course creation:', error)
  }
  
  return { id: docRef.id, ...courseData }
}

// Add BITS Library items to a course
export async function addBitsLibraryItems(courseId, bitsLibraryData) {
  try {
    if (!Array.isArray(bitsLibraryData)) {
      throw new Error('BITS Library data must be an array')
    }

    const courseRef = doc(db, 'courses', courseId)
    const courseSnap = await getDoc(courseRef)
    
    if (!courseSnap.exists()) {
      throw new Error('Course not found')
    }

    const courseData = courseSnap.data()
    const currentItems = courseData.items || []
    
    // Convert BITS library data to items format
    const newBitsItems = bitsLibraryData.map(item => ({
      name: item.name,
      url: item.url,
      category: 'bits library'
    }))
    
    // Remove existing BITS library items to avoid duplicates
    const filteredItems = currentItems.filter(item => item.category !== 'bits library')
    
    // Add new BITS library items
    const updatedItems = [...filteredItems, ...newBitsItems]
    
    await setDoc(courseRef, {
      items: updatedItems,
      updatedAt: new Date().toISOString()
    }, { merge: true })
    
    // Invalidate course cache
    removeCachedCourse(courseId)
    
    console.log(`✅ Added ${newBitsItems.length} BITS Library items to course ${courseId}`)
    
    return {
      success: true,
      addedItems: newBitsItems.length,
      totalItems: updatedItems.length
    }
  } catch (error) {
    console.error('Error adding BITS Library items:', error)
    throw error
  }
}
