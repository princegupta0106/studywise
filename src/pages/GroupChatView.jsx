import React, { useEffect, useState } from 'react'
import { useParams, useLocation, Link } from 'react-router-dom'
import ChatRoom from '../components/ChatRoom'
import { getCourse } from '../firebase/api'
import logoSvg from '../assets/logo.svg'

function initialsFrom(name) {
  if (!name) return 'G'
  return name.split(' ').map(s => s[0] || '').slice(0,2).join('').toUpperCase()
}

export default function GroupChatView() {
  const { gcId } = useParams()
  const location = useLocation()
  const state = location.state || {}
  const [courseName, setCourseName] = useState(state.courseName || '')

  useEffect(() => {
    let mounted = true
    async function loadName() {
      if (courseName) return
      try {
        const maybe = await getCourse(gcId)
        if (!mounted) return
        if (maybe) {
          setCourseName(maybe.name || '')
        }
      } catch (err) {
        console.debug('No course found for gcId', gcId)
      }
    }
    loadName()
    return () => { mounted = false }
  }, [gcId, courseName])

  return (
    // Make the view fill most of the viewport so the chat can use available vertical space
    <div className="max-w-3xl mx-auto" style={{ minHeight: 'calc(100vh - 72px)', display: 'flex', flexDirection: 'column' }}>
      <div className="flex items-center gap-3 px-3 py-2 border-b border-white/5">
        <Link to="/group-chats" className="flex items-center gap-2 p-1 rounded hover:bg-white/5">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="text-lg font-semibold truncate" style={{ maxWidth: '100%' }}>{courseName || `Group`}</div>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div className="p-2" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <ChatRoom gcId={gcId} />
        </div>
      </div>
    </div>
  )
}
