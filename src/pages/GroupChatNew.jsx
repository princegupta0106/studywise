import React, { useState, useEffect } from 'react'
import { useCachedAuth } from '../contexts/CachedAuthContext'
import ChatRoom from '../components/ChatRoom'
import { getUserById, getCourse } from '../firebase/api'

export default function GroupChatNew() {
  const { user, loading: authLoading } = useCachedAuth() || {}
  const [connectedGc, setConnectedGc] = useState(null)
  const [courses, setCourses] = useState([])
  const [loadingCourses, setLoadingCourses] = useState(true)
  const [selectedCourseName, setSelectedCourseName] = useState('')
  // Load enrolled courses (uses cache-first API inside getUserById/getCourse)
  useEffect(() => {
    let mounted = true
    async function loadEnrolled() {
      setLoadingCourses(true)
      try {
        if (!user) {
          setCourses([])
          return
        }
        const userData = await getUserById(user.uid)
        const enrolledIds = userData?.courses || []
        const courseObjs = await Promise.all(enrolledIds.map(async (id) => {
          try {
            const c = await getCourse(id)
            return c ? { id, ...c } : null
          } catch (e) {
            return null
          }
        }))
        if (!mounted) return
        setCourses(courseObjs.filter(Boolean))
      } catch (err) {
        console.error('Failed to load enrolled courses', err)
        if (mounted) setCourses([])
      } finally {
        if (mounted) setLoadingCourses(false)
      }
    }
    loadEnrolled()
    return () => { mounted = false }
  }, [user])

  if (authLoading) return <div className="max-w-2xl mx-auto mt-8 p-4">Loading...</div>

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto mt-8 p-6 border rounded text-center">
        <div className="text-xl font-bold text-red-600 mb-4">Sign in required</div>
        <div className="text-gray-600">Please sign in to use the new Group Chat.</div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto mt-8 p-4">
      <h2 className="text-2xl font-semibold mb-4">Group Chat (new system)</h2>

      <div className="mb-4 text-sm text-gray-300">
        This chat system is intentionally separate from the existing one.
        No backend calls are implemented yet. When you're ready I will add a dedicated API
        (separate Firestore collection) — I will ask you before creating it so we can keep
        reads limited per user.
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-1">
          <h3 className="text-lg font-medium mb-2">Your Course Groups</h3>
          {loadingCourses ? (
            <div className="text-sm text-gray-400">Loading your courses…</div>
          ) : courses.length === 0 ? (
            <div className="text-sm text-gray-400">You are not enrolled in any courses.</div>
          ) : (
            <div className="space-y-2">
              {courses.map(c => (
                <button key={c.id} onClick={() => {
                  // If course has explicit gc field use it, otherwise assume gc id === course id
                  const gcToOpen = c.gc || c.id
                  setConnectedGc(gcToOpen)
                  setSelectedCourseName(c.name || 'Course')
                }} className="w-full text-left px-3 py-2 rounded bg-white/5 hover:bg-white/10 transition">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{c.name || 'Untitled Course'}</div>
                      <div className="text-xs text-gray-400">{c.id}</div>
                    </div>
                    <div className="text-sm text-gray-300">{c.gc ? 'Group' : 'Group (uses course id)'}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="md:col-span-3">
          <h3 className="text-lg font-medium mb-2">{selectedCourseName ? `${selectedCourseName} — Group` : 'Select a course to open its group'}</h3>
          {connectedGc ? (
            <ChatRoom gcId={connectedGc} />
          ) : selectedCourseName ? (
            <div className="text-sm text-gray-400">No group configured for this course.</div>
          ) : (
            <div className="text-sm text-gray-400">Choose a course from the left to view its group chat.</div>
          )}
        </div>
      </div>
    </div>
  )
}
