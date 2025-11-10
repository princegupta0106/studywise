import React, { useEffect, useState, useRef } from 'react'
import { useCachedAuth } from '../contexts/CachedAuthContext'
import { subscribeToGcMessages, sendGcMessage } from '../firebase/chat'

export default function ChatRoom({ gcId }) {
  const { user } = useCachedAuth() || {}
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const endRef = useRef(null)

  useEffect(() => {
    if (!gcId) return
    const unsub = subscribeToGcMessages(gcId, (msgs) => {
      setMessages(msgs || [])
    })

    return () => { if (typeof unsub === 'function') unsub() }
  }, [gcId])

  useEffect(() => {
    if (endRef.current) {
      endRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  const handleSend = async () => {
    const text = (input || '').trim()
    if (!text) return
    setInput('')
    try {
      // Extract user name from display name or email
      const userName = user?.displayName || 
                      (user?.email ? user.email.split('@')[0].replace(/[._-]/g, ' ') : 'Anonymous')
      
      await sendGcMessage(gcId, { 
        email: user?.email, 
        name: userName,
        text,
        createdAt: new Date().toISOString()
      })
    } catch (err) {
      console.error('send message failed', err)
    }
  }

  const parseTime = (m) => {
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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#0f172a' }}>
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4" style={{ minHeight: 0 }}>
        <div className="max-w-4xl mx-auto">
          {messages.length === 0 ? (
            <div className="text-center text-gray-400 mt-8">Start the conversation</div>
          ) : (
            messages.map((m, i) => {
              const time = parseTime(m)
              // Extract display name from message or fallback to email processing
              const displayName = m.name || 
                                 (m.email ? m.email.split('@')[0].replace(/[._-]/g, ' ') : 'Anonymous')
              
              return (
                <div key={m.id || i} className="mb-3 flex justify-end">
                  <div 
                    style={{
                      maxWidth: '70%',
                      minWidth: '120px',
                      borderRadius: '8px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                      overflow: 'hidden',
                      position: 'relative'
                    }}
                  >
                    {/* Header frame with name and time */}
                    <div style={{
                      backgroundColor: '#1e40af', // Darker blue for header
                      padding: '6px 12px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      borderBottom: '1px solid rgba(255,255,255,0.1)'
                    }}>
                      <div style={{ 
                        fontSize: '11px', 
                        fontWeight: '600',
                        color: '#e0e7ff',
                        textTransform: 'capitalize',
                        flex: 1
                      }}>
                        {displayName}
                      </div>
                      {time && (
                        <div style={{ 
                          fontSize: '10px', 
                          color: '#cbd5e1',
                          marginLeft: '8px'
                        }}>
                          {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      )}
                    </div>
                    
                    {/* Message content */}
                    <div style={{
                      backgroundColor: '#3b82f6', // Lighter blue for content
                      color: 'white',
                      padding: '10px 12px',
                      fontSize: '14px', 
                      lineHeight: '1.4',
                      wordWrap: 'break-word',
                      overflowWrap: 'break-word',
                      hyphens: 'auto'
                    }}>
                      {m.text}
                    </div>
                  </div>
                </div>
              )
            })
          )}
          <div ref={endRef} />
        </div>
      </div>

      {/* Input area */}
      <div 
        className="px-4 py-3"
        style={{ 
          backgroundColor: '#1e293b',
          borderTop: '1px solid rgba(255,255,255,0.05)'
        }}
      >
        <div className="max-w-4xl mx-auto">
          <form onSubmit={(e) => { e.preventDefault(); handleSend() }} className="flex items-center gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 px-4 py-3 rounded-full bg-gray-700 text-white placeholder-gray-400 border-none outline-none focus:ring-2 focus:ring-blue-500"
              style={{ fontSize: '15px' }}
            />
            <button 
              type="submit" 
              className="w-12 h-12 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center transition-colors"
              style={{ minWidth: '48px' }}
            >
              <svg width="20" height="20" fill="white" viewBox="0 0 24 24">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
              </svg>
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
