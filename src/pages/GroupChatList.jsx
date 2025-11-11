import React, { useEffect, useState } from 'react'
import { useCachedAuth } from '../contexts/CachedAuthContext'
import { getUserById, getCourse } from '../firebase/api'
import { Link } from 'react-router-dom'

function initialsFrom(name) {
  if (!name) return 'U'
  return name.split(' ').map(s => s[0] || '').slice(0,2).join('').toUpperCase()
}

export default function GroupChatList() {
  const { user } = useCachedAuth() || {}
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      try {
        if (!user) {
          setCourses([])
          return
        }
        const userData = await getUserById(user.email)
        const enrolledCourses = userData?.courses || []
        const courseObjs = await Promise.all(enrolled.map(async id => {
          try { const c = await getCourse(id); return c ? { id, ...c } : null } catch(e){ return null }
        }))
        if (!mounted) return
        setCourses(courseObjs.filter(Boolean))
      } catch (err) {
        console.error('Failed to load courses', err)
        if (mounted) setCourses([])
      } finally { if (mounted) setLoading(false) }
    }
    load()
    return () => { mounted = false }
  }, [user])

  return (
    <div className="max-w-3xl mx-auto mt-6 p-4">
      <h2 className="text-2xl font-semibold mb-4">Groups</h2>
      {loading ? (
        <div className="text-sm text-gray-400">Loading…</div>
      ) : courses.length === 0 ? (
        <div className="text-sm text-gray-400">No groups found.</div>
      ) : (
        <div className="divide-y divide-white/5 bg-transparent rounded">
          {courses.map(c => {
            const gcId = c.gc || c.id
            return (
              <Link key={c.id} to={`/group-chat/${encodeURIComponent(gcId)}`} state={{ courseId: c.id, courseName: c.name }} className="flex items-center gap-3 p-3 hover:bg-white/5 transition">
                <div style={{ width: 44, height: 44, borderRadius: 8, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: '#222', color: 'white', fontWeight: 700 }} aria-hidden>
                  {initialsFrom(c.name)}
                </div>
                <div className="flex-1">
                  <div className="font-medium">{c.name || 'Untitled Course'}</div>
                  {/* optional subtitle could go here (last message preview) */}
                </div>
                <div className="text-xs text-gray-400">›</div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
