import React, { useState, useEffect, useRef } from 'react'
import { useCachedAuth } from '../contexts/CachedAuthContext'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase/config'
import { createOrGetUserChat, addMessageToChat } from '../firebase/api'

export default function Chat() {
  const { user } = useCachedAuth() || {}
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [chatId, setChatId] = useState(null)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    // Initialize chat and set up real-time listener
    const initializeChat = async () => {
      try {
        // Get or create chat for this user
        const userChatId = await createOrGetUserChat(
          user.uid, 
          user.email, 
          user.displayName || user.email
        )
        setChatId(userChatId)

        // Set up real-time listener for chat document
        const chatRef = doc(db, 'chats', userChatId)
        const unsubscribe = onSnapshot(chatRef, (snapshot) => {
          if (snapshot.exists()) {
            const chatData = snapshot.data()
            const messageList = (chatData.messages || []).map((msg, index) => ({
              id: index,
              text: msg.text,
              sender: msg.from === user.email ? 'user' : 'admin',
              senderName: msg.name,
              timestamp: new Date(msg.time)
            }))
            setMessages(messageList)
          } else {
            setMessages([])
          }
          setLoading(false)
        }, (error) => {
          console.error('Error listening to chat:', error)
          setLoading(false)
        })

        return unsubscribe
      } catch (error) {
        console.error('Error initializing chat:', error)
        setLoading(false)
      }
    }

    let unsubscribe
    initializeChat().then(unsub => {
      unsubscribe = unsub
    })

    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [user])

  const sendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !user || sending || !chatId) return

    setSending(true)
    try {
      // Add message to chat using the new structure
      await addMessageToChat(chatId, {
        from: user.email,
        name: user.displayName || user.email,
        text: newMessage.trim()
      })
      setNewMessage('')
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <h2 className="text-2xl font-semibold mb-4">Chat with Admin</h2>
        <p>Please sign in to start a chat with the admin.</p>
      </div>
    )
  }

  return (
    <div className="mx-auto" style={{ maxWidth: '500px' }}>
      <h2 className="text-xl font-semibold mb-3 px-4">Chat with Admin</h2>
      
      {/* Messages Container */}
      <div style={{ height: '80vh', display: 'flex', flexDirection: 'column' }}>
        {/* Messages List */}
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2 hover-scrollbar">
          {loading ? (
            <div className="text-center text-gray-400">Loading messages...</div>
          ) : messages.length === 0 ? (
            <div className="text-center text-gray-400">
              <p>No messages yet.</p>
              <p className="text-sm mt-2">Send a message below to start the conversation!</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`px-3 py-2 rounded-lg ${
                    message.sender === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-white'
                  }`}
                  style={{ maxWidth: '500px' }}
                >
                  <p className="text-sm">{message.text}</p>
                  <p className="text-xs mt-1 opacity-70">
                    {message.sender === 'admin' && 'Admin • '}
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="px-4 py-3">
          <form onSubmit={sendMessage} className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 p-2 rounded border input-dark text-sm"
              disabled={sending}
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || sending}
              className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {sending ? 'Sending...' : 'Send'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}