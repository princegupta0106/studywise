/**
 * IndexedDB Cache Layer for Ultra-Persistent Storage
 * Used for storing large content that should persist across browser sessions
 */

const DB_NAME = 'GoalwiseCache'
const DB_VERSION = 1
const STORE_NAME = 'cache'

class IndexedDBCache {
  constructor() {
    this.db = null
    this.isSupported = 'indexedDB' in window
    this.initPromise = this.init()
  }

  async init() {
    if (!this.isSupported) {
      console.warn('IndexedDB not supported, falling back to localStorage only')
      return false
    }

    try {
      return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION)

        request.onerror = () => {
          console.error('IndexedDB failed to open:', request.error)
          reject(request.error)
        }

        request.onsuccess = () => {
          this.db = request.result
          console.log('IndexedDB initialized successfully')
          resolve(true)
        }

        request.onupgradeneeded = (event) => {
          const db = event.target.result
          
          // Create object store if it doesn't exist
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            const store = db.createObjectStore(STORE_NAME, { keyPath: 'key' })
            store.createIndex('type', 'type', { unique: false })
            store.createIndex('timestamp', 'timestamp', { unique: false })
          }
        }
      })
    } catch (error) {
      console.error('IndexedDB initialization failed:', error)
      return false
    }
  }

  async ensureReady() {
    await this.initPromise
    return this.db !== null
  }

  async get(key) {
    if (!await this.ensureReady()) return null

    try {
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([STORE_NAME], 'readonly')
        const store = transaction.objectStore(STORE_NAME)
        const request = store.get(key)

        request.onsuccess = () => {
          const result = request.result
          if (result) {
            console.log(`[IndexedDB HIT] ${key}`)
            resolve(result)
          } else {
            resolve(null)
          }
        }

        request.onerror = () => {
          console.error(`IndexedDB get error for ${key}:`, request.error)
          resolve(null)
        }
      })
    } catch (error) {
      console.error(`IndexedDB get failed for ${key}:`, error)
      return null
    }
  }

  async set(key, data, type = 'unknown') {
    if (!await this.ensureReady()) return false

    try {
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([STORE_NAME], 'readwrite')
        const store = transaction.objectStore(STORE_NAME)
        
        const entry = {
          key,
          data,
          type,
          timestamp: Date.now(),
          size: JSON.stringify(data).length
        }

        const request = store.put(entry)

        request.onsuccess = () => {
          console.log(`[IndexedDB SET] ${key} (${entry.size} bytes)`)
          resolve(true)
        }

        request.onerror = () => {
          console.error(`IndexedDB set error for ${key}:`, request.error)
          resolve(false)
        }
      })
    } catch (error) {
      console.error(`IndexedDB set failed for ${key}:`, error)
      return false
    }
  }

  async delete(key) {
    if (!await this.ensureReady()) return false

    try {
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([STORE_NAME], 'readwrite')
        const store = transaction.objectStore(STORE_NAME)
        const request = store.delete(key)

        request.onsuccess = () => {
          console.log(`[IndexedDB DELETE] ${key}`)
          resolve(true)
        }

        request.onerror = () => {
          console.error(`IndexedDB delete error for ${key}:`, request.error)
          resolve(false)
        }
      })
    } catch (error) {
      console.error(`IndexedDB delete failed for ${key}:`, error)
      return false
    }
  }

  async clear() {
    if (!await this.ensureReady()) return false

    try {
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([STORE_NAME], 'readwrite')
        const store = transaction.objectStore(STORE_NAME)
        const request = store.clear()

        request.onsuccess = () => {
          console.log('[IndexedDB CLEAR] All entries cleared')
          resolve(true)
        }

        request.onerror = () => {
          console.error('IndexedDB clear error:', request.error)
          resolve(false)
        }
      })
    } catch (error) {
      console.error('IndexedDB clear failed:', error)
      return false
    }
  }

  async getStats() {
    if (!await this.ensureReady()) return { entries: 0, totalSize: 0 }

    try {
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([STORE_NAME], 'readonly')
        const store = transaction.objectStore(STORE_NAME)
        const request = store.getAll()

        request.onsuccess = () => {
          const entries = request.result
          const totalSize = entries.reduce((sum, entry) => sum + (entry.size || 0), 0)
          resolve({
            entries: entries.length,
            totalSize,
            totalSizeMB: (totalSize / 1024 / 1024).toFixed(2)
          })
        }

        request.onerror = () => {
          console.error('IndexedDB stats error:', request.error)
          resolve({ entries: 0, totalSize: 0 })
        }
      })
    } catch (error) {
      console.error('IndexedDB stats failed:', error)
      return { entries: 0, totalSize: 0 }
    }
  }
}

// Create singleton instance
const indexedDBCache = new IndexedDBCache()

export default indexedDBCache