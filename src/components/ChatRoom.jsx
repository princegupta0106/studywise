import React, { useEffect, useState, useRef } from 'react'
import { useCachedAuth } from '../contexts/CachedAuthContext'
import { subscribeToGcMessages, sendGcMessage } from '../firebase/chat'

function initialsFromEmail(email) {
  if (!email) return 'U'
  const name = (email.split('@')[0] || '')
  return name.split(/[._\-\s]+/).map(s => s[0] || '').slice(0,2).join('').toUpperCase() || 'U'
}

function colorFromString(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (h << 5) - h + str.charCodeAt(i)
  const hue = Math.abs(h) % 360
  return `hsl(${hue} 60% 45%)`
}

export default function ChatRoom({ gcId }) {
  const { user } = useCachedAuth() || {}
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const listRef = useRef(null)
  const endRef = useRef(null)

  useEffect(() => {
    if (!gcId) return
    const unsub = subscribeToGcMessages(gcId, (msgs) => {
      setMessages(msgs || [])
    })

    return () => { if (typeof unsub === 'function') unsub() }
  }, [gcId])

  useEffect(() => {
    // scroll smoothly to bottom when messages change
    if (endRef.current) endRef.current.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    const text = (input || '').trim()
    if (!text) return
    setInput('')
    try {
      await sendGcMessage(gcId, { uid: user?.uid, email: user?.email, text })
    } catch (err) {
      console.error('send message failed', err)
    }
  }

  const parseTime = (m) => {
    // m.createdAt may be Firestore Timestamp, a string, or Date
    try {
      if (!m) return ''
      const t = m.createdAt
      if (!t) return ''
      if (t && typeof t === 'object' && typeof t.toDate === 'function') return t.toDate()
      if (typeof t === 'string') return new Date(t)
      if (typeof t === 'number') return new Date(t)
      return new Date(t)
    } catch (e) { return new Date() }
  }

  return (
    // root is a column so messages area can grow and input stays at bottom
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-3 hover-scrollbar bg-transparent">
        {messages.length === 0 ? (
          <div className="text-center text-gray-400 mt-8">No messages yet</div>
        ) : (
          messages.map((m, i) => {
            const isUser = user && (m.uid === user.uid || m.email === user.email)
            const time = parseTime(m)
            return (
              <div key={m.id || i} className={`flex items-end ${isUser ? 'justify-end' : 'justify-start'}`}>
                {!isUser && (
                  <div className="mr-3" aria-hidden>
                    <div style={{ width: 36, height: 36, borderRadius: 8, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: colorFromString(m.email || m.uid), color: 'white', fontWeight: 700 }}>
                      {initialsFromEmail(m.email || m.uid)}
                    </div>
                  </div>
                )}

                <div>
                  <div className={`px-3 py-2 rounded-lg text-sm ${isUser ? 'bg-blue-600 text-white' : 'bg-gray-700 text-white'}`} style={{ maxWidth: '70vw' }}>
                    <div>{m.text}</div>
                    <div className="text-xs mt-1 opacity-70 text-right">{time ? time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</div>
                  </div>
                </div>

                {isUser && (
                  <div className="ml-3" aria-hidden>
                    <div style={{ width: 28 }} />
                  </div>
                )}
              </div>
            )
          })
        )}
        <div ref={endRef} />
      </div>

      <div className="px-3 py-2 border-t border-white/5 bg-transparent">
        <form onSubmit={(e) => { e.preventDefault(); handleSend() }} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 p-2 rounded border input-dark text-sm"
          />
          <button type="submit" className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">Send</button>
        </form>
      </div>
    </div>
  )
}
