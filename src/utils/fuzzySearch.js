// Fuzzy search utility using fuse.js for advanced fuzzy searching
// Handles typos, partial matches, and flexible search patterns

import Fuse from 'fuse.js'

/**
 * Create a Fuse.js instance with optimized settings for course search
 * @param {Array} courses - Array of course objects
 * @param {Object} options - Custom options to override defaults
 * @returns {Fuse} - Configured Fuse.js instance
 */
function createFuseInstance(courses, options = {}) {
  const defaultOptions = {
    // Fields to search with different weights
    keys: [
      { name: 'name', weight: 0.6 },       // Course name is most important
      { name: 'title', weight: 0.6 },      // Title is equally important
      { name: 'description', weight: 0.4 } // Description is less important
    ],
    
    // Fuzzy search configuration
    includeScore: true,           // Include relevance score
    includeMatches: true,         // Include match information
    threshold: 0.4,               // 0.0 = exact match, 1.0 = match anything
    distance: 100,                // Maximum distance for a match
    minMatchCharLength: 1,        // Minimum characters in a match
    ignoreLocation: true,         // Ignore location of match in string
    ignoreFieldNorm: false,       // Consider field length in scoring
    
    // Advanced fuzzy matching
    useExtendedSearch: true,      // Enable advanced search patterns
    getFn: Fuse.config.getFn      // Custom getter function
  }
  
  const fuseOptions = { ...defaultOptions, ...options }
  return new Fuse(courses, fuseOptions)
}

/**
 * Perform fuzzy search on courses using fuse.js
 * @param {Array} courses - Array of course objects
 * @param {string} query - Search query (can include typos)
 * @param {Object} options - Search options
 * @returns {Array} - Sorted array of matching courses
 */
export function fuzzySearchCourses(courses, query, options = {}) {
  const {
    maxResults = 10,         // Maximum number of results to return
    threshold = 0.4,         // Search sensitivity (0.0 = exact, 1.0 = match anything)
    includeScores = false,   // Whether to include scores in results
    searchFields = ['name', 'title', 'description'] // Fields to search
  } = options

  // Return all courses if no query
  if (!query || !query.trim()) {
    return courses.slice(0, maxResults)
  }

  // Create custom keys based on searchFields
  const keys = searchFields.map(field => {
    const weight = field === 'name' || field === 'title' ? 0.6 : 0.4
    return { name: field, weight }
  })

  // Create fuse instance with custom configuration
  const fuse = createFuseInstance(courses, {
    keys,
    threshold,
    // More lenient settings for better typo handling
    distance: 200,
    minMatchCharLength: 1
  })

  // Perform the search
  const results = fuse.search(query, { limit: maxResults })

  if (includeScores) {
    return results.map(result => ({
      course: result.item,
      score: Math.round((1 - result.score) * 100), // Convert to 0-100 scale
      matches: result.matches
    }))
  }

  // Return just the course objects
  return results.map(result => result.item)
}

/**
 * Advanced search with pattern support
 * Supports patterns like:
 * - 'word1 word2' (all words must be present)
 * - '"exact phrase"' (exact phrase match)
 * - '^prefix' (starts with prefix)
 * - 'suffix$' (ends with suffix)
 * @param {Array} courses - Array of course objects
 * @param {string} query - Search query with optional patterns
 * @param {Object} options - Search options
 * @returns {Array} - Matching courses
 */
export function advancedFuzzySearch(courses, query, options = {}) {
  // Handle special search patterns
  let processedQuery = query.trim()
  let customThreshold = options.threshold || 0.4
  
  // Exact phrase search (stricter matching)
  if (processedQuery.startsWith('"') && processedQuery.endsWith('"')) {
    processedQuery = processedQuery.slice(1, -1)
    customThreshold = 0.1 // Very strict for exact phrases
  }
  
  return fuzzySearchCourses(courses, processedQuery, {
    ...options,
    threshold: customThreshold
  })
}

/**
 * Highlight matching parts of text based on fuse.js results
 * @param {string} text - Original text
 * @param {Array} matches - Fuse.js match results
 * @returns {string} - Text with highlighted matches (HTML)
 */
export function highlightFuseMatches(text, matches = []) {
  if (!matches || matches.length === 0) return text

  let highlightedText = text
  const highlights = []
  
  // Collect all match indices
  matches.forEach(match => {
    if (match.indices) {
      match.indices.forEach(([start, end]) => {
        highlights.push({ start, end })
      })
    }
  })
  
  // Sort highlights by start position (descending to avoid index shifting)
  highlights.sort((a, b) => b.start - a.start)
  
  // Apply highlights
  highlights.forEach(({ start, end }) => {
    const before = highlightedText.substring(0, start)
    const match = highlightedText.substring(start, end + 1)
    const after = highlightedText.substring(end + 1)
    highlightedText = `${before}<mark class="bg-yellow-200 text-black px-1 rounded">${match}</mark>${after}`
  })
  
  return highlightedText
}

/**
 * Simple fuzzy search for backwards compatibility
 * @param {Array} items - Array of items to search
 * @param {string} query - Search query  
 * @param {Function} getSearchText - Function to extract search text from item
 * @returns {Array} - Filtered items
 */
export function simpleFuzzyFilter(items, query, getSearchText) {
  const searchItems = items.map(item => ({
    ...item,
    searchText: getSearchText(item)
  }))
  
  const results = fuzzySearchCourses(searchItems, query, {
    searchFields: ['searchText'],
    threshold: 0.5, // More lenient for simple filter
    maxResults: items.length
  })
  
  // Remove the searchText field we added
  return results.map(result => {
    const { searchText, ...originalItem } = result
    return originalItem
  })
}

/**
 * Get search suggestions based on partial input
 * @param {Array} courses - Array of course objects
 * @param {string} partialQuery - Partial search input
 * @returns {Array} - Array of suggested search terms
 */
export function getSearchSuggestions(courses, partialQuery) {
  if (!partialQuery || partialQuery.length < 2) return []
  
  const suggestions = new Set()
  
  courses.forEach(course => {
    const searchableText = `${course.name || ''} ${course.title || ''} ${course.description || ''}`
    const words = searchableText.toLowerCase().split(/\s+/)
    
    words.forEach(word => {
      if (word.toLowerCase().startsWith(partialQuery.toLowerCase()) && word.length > 2) {
        suggestions.add(word)
      }
    })
  })
  
  return Array.from(suggestions).slice(0, 5) // Return top 5 suggestions
}