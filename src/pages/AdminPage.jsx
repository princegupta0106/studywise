import React, { useEffect, useState } from 'react'
import { useCachedAuth } from '../contexts/CachedAuthContext'
import { collection, getDocs, doc, getDoc, setDoc, deleteDoc, addDoc, onSnapshot, serverTimestamp, query, orderBy } from 'firebase/firestore'
import { db } from '../firebase/config'
import { getAllChats, addMessageToChat, updateCourseList } from '../firebase/api'
import AdminCacheControl from '../components/AdminCacheControl'

function isAdminUser(user) {
  if (!user) return false
  const env = (import.meta.env.VITE_ADMIN_UIDS || '').trim()
  const list = env ? env.split(',').map(s => s.trim()).filter(Boolean) : ['dev-user']
  return list.includes(user.uid)
}

export default function AdminPage() {
  const { user, loading } = useCachedAuth() || {}
  const [allowed, setAllowed] = useState(false)

  // Tab system
  const [activeTab, setActiveTab] = useState('courses')

  // Course management state
  const [courses, setCourses] = useState([])
  const [search, setSearch] = useState('')
  const [loadingCourses, setLoadingCourses] = useState(false)
  const [activeCourse, setActiveCourse] = useState(null)
  const [courseItems, setCourseItems] = useState([])
  const [status, setStatus] = useState('')
  const [newCourseTitle, setNewCourseTitle] = useState('')
  const [newCourseDesc, setNewCourseDesc] = useState('')
  const [newItem, setNewItem] = useState({ name: '', url: '', category: 'others' })

  // Chat management state
  const [chatUsers, setChatUsers] = useState([])
  const [activeChatUser, setActiveChatUser] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loadingChats, setLoadingChats] = useState(false)
  const [chatListUnsubscribe, setChatListUnsubscribe] = useState(null)

  useEffect(() => {
    if (!loading) setAllowed(isAdminUser(user))
  }, [user, loading])

  useEffect(() => {
    if (allowed) {
      loadCourses()
      loadChatUsers()
      
      // Set up real-time listener for chat updates when on chats tab
      if (activeTab === 'chats') {
        setupChatListeners()
      }
    }
    
    // Cleanup function
    return () => {
      if (chatListUnsubscribe) {
        chatListUnsubscribe()
      }
      if (activeChatUser?.unsubscribe) {
        activeChatUser.unsubscribe()
      }
    }
  }, [allowed, activeTab])

  // Set up real-time listeners for chat updates
  function setupChatListeners() {
    // Clean up existing listener
    if (chatListUnsubscribe) {
      chatListUnsubscribe()
    }
    
    // Listen to all chats collection for new chats/messages
    const chatsCollection = collection(db, 'chats')
    const unsubscribe = onSnapshot(chatsCollection, (snapshot) => {
      console.log('🔄 Real-time chat update detected')
      loadChatUsers() // Reload chat users when any chat changes
    }, (error) => {
      console.error('Error listening to chats:', error)
      setStatus('Error setting up real-time chat updates: ' + error.message)
    })

    setChatListUnsubscribe(() => unsubscribe)
  }

  async function loadCourses() {
    setLoadingCourses(true)
    try {
      const snap = await getDocs(collection(db, 'courses'))
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      setCourses(list)
    } catch (e) {
      setStatus('Error loading courses: ' + (e.message || e))
    } finally {
      setLoadingCourses(false)
    }
  }

  async function createCourse() {
    if (!newCourseTitle.trim()) return setStatus('Provide a course title')
    setStatus('creating...')
    try {
      const { createCourse: createCourseAPI } = await import('../firebase/api')
      const newCourse = await createCourseAPI(newCourseTitle, newCourseDesc || '')
      setStatus('Created course: ' + newCourse.id)
      setNewCourseTitle('')
      setNewCourseDesc('')
      
      await loadCourses()
      // Force a full window reload so all pages reflect the new course immediately
      try {
        window.location.reload()
      } catch (e) {
        console.error('Reload failed after createCourse:', e)
      }
    } catch (e) {
      setStatus('Create course error: ' + (e.message || e))
    }
  }

  async function deleteCourse(id) {
    setStatus('deleting...')
    try {
      await deleteDoc(doc(db, 'courses', id))
      await updateCourseList() // Update the course-list collection
      setStatus('Deleted ' + id)
      
      if (activeCourse?.id === id) {
        setActiveCourse(null)
        setCourseItems([])
      }
      await loadCourses()
      // Force a full reload so all open pages show the updated course list
      try {
        window.location.reload()
      } catch (e) {
        console.error('Reload failed after deleteCourse:', e)
      }
    } catch (e) {
      setStatus('Delete course error: ' + (e.message || e))
    }
  }

  async function openCourse(course) {
    setActiveCourse(course)
    setStatus('loading items...')
    try {
      const { getCourseItems } = await import('../firebase/api')
      const items = await getCourseItems(course.id)
      setCourseItems(items)
      setStatus(`Loaded ${items.length} items`)
    } catch (e) {
      setStatus('Open course error: ' + (e.message || e))
    }
  }

  async function createItemForActiveCourse() {
    if (!activeCourse) return setStatus('Open a course first')
    const { name, url, category } = newItem
    
    if (!name.trim() || !url.trim()) {
      return setStatus('Item name and URL are required')
    }
    
    setStatus('creating item...')
    try {
      const { addItemToCourse } = await import('../firebase/api')
      const newItemData = await addItemToCourse(activeCourse.id, { name: name.trim(), url: url.trim(), category })
      setStatus(`Created item: ${newItemData.name}`)
      
      await openCourse(activeCourse)
      setNewItem({ name: '', url: '', category: 'others' })
    } catch (e) {
      setStatus('Create item error: ' + (e.message || e))
    }
  }

  async function deleteItemFromCourse(itemIndex) {
    if (!activeCourse) return
    setStatus('deleting item...')
    try {
      const { removeItemFromCourse } = await import('../firebase/api')
      await removeItemFromCourse(activeCourse.id, itemIndex)
      setStatus('Deleted item')
      
      await openCourse(activeCourse)
    } catch (e) {
      setStatus('Delete item error: ' + (e.message || e))
    }
  }

  // Chat management functions
  async function loadChatUsers() {
    setLoadingChats(true)
    try {
      const chats = await getAllChats()
      
      // Filter chats that have messages
      const chatsWithMessages = chats.filter(chat => chat.messages.length > 0)
      
      const users = chatsWithMessages.map(chat => ({
        id: chat.userId,
        chatId: chat.id,
        name: chat.userName,
        email: chat.userEmail,
        latestMessage: chat.lastMessage?.text || 'No messages',
        latestTime: chat.lastMessage ? new Date(chat.lastMessage.time) : null,
        messageCount: chat.messages.length
      }))
      
      // Sort by latest message time
      users.sort((a, b) => {
        if (!a.latestTime) return 1
        if (!b.latestTime) return -1
        return b.latestTime - a.latestTime
      })
      
      setChatUsers(users)
      setStatus(users.length > 0 ? `Found ${users.length} chat conversations (${users.reduce((sum, u) => sum + u.messageCount, 0)} total messages)` : 'No chat conversations found')
      console.log('📱 Chat users loaded:', users.length, 'conversations')
    } catch (e) {
      setStatus('Error loading chat users: ' + (e.message || e))
      console.error('Error loading chat users:', e)
    } finally {
      setLoadingChats(false)
    }
  }

  function openChatWithUser(chatUser) {
    setActiveChatUser(chatUser)
    setMessages([]) // Clear existing messages
    
    // Set up real-time listener for chat document
    const chatRef = doc(db, 'chats', chatUser.chatId)
    
    const unsubscribe = onSnapshot(chatRef, (snapshot) => {
      if (snapshot.exists()) {
        const chatData = snapshot.data()
        const messageList = (chatData.messages || []).map((msg, index) => ({
          id: index,
          text: msg.text,
          sender: msg.from === chatUser.email ? 'user' : 'admin',
          senderName: msg.name,
          timestamp: new Date(msg.time)
        }))
        setMessages(messageList)
        console.log('🔄 Real-time chat messages updated:', messageList.length, 'messages')
      } else {
        setMessages([])
        console.log('❌ Chat document not found')
      }
    }, (error) => {
      console.error('Error listening to chat:', error)
      setStatus('Error listening to chat: ' + error.message)
    })

    // Store unsubscribe function to clean up later
    setActiveChatUser(prev => ({ ...chatUser, unsubscribe }))
  }

  async function sendMessageToUser() {
    if (!activeChatUser || !newMessage.trim()) return
    
    try {
      await addMessageToChat(activeChatUser.chatId, {
        from: 'admin', // Use 'admin' as identifier for admin messages
        name: 'Admin',
        text: newMessage.trim()
      })
      setNewMessage('')
    } catch (e) {
      setStatus('Error sending message: ' + (e.message || e))
    }
  }

  function closeChatWithUser() {
    if (activeChatUser?.unsubscribe) {
      activeChatUser.unsubscribe()
    }
    setActiveChatUser(null)
    setMessages([])
  }

  if (loading) return <div>Checking auth…</div>
  if (!allowed) return <div className="max-w-3xl mx-auto p-6">Access denied.</div>

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h2 className="text-2xl font-semibold mb-4">Admin Panel</h2>
      
      {/* Admin Cache Control */}
      <AdminCacheControl />
      
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-700 mb-6">
        <button 
          onClick={() => setActiveTab('courses')}
          className={`px-4 py-2 font-medium ${activeTab === 'courses' ? 'border-b-2 border-blue-500 text-blue-400' : 'text-gray-400'}`}
        >
          Courses
        </button>
        <button 
          onClick={() => setActiveTab('chats')}
          className={`px-4 py-2 font-medium ${activeTab === 'chats' ? 'border-b-2 border-blue-500 text-blue-400' : 'text-gray-400'}`}
        >
          User Chats
        </button>

      </div>

      {/* Course Management Tab */}
      {activeTab === 'courses' && (
        <>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
            <div className="flex items-center gap-3 w-full md:w-1/2">
              <input placeholder="Search courses..." value={search} onChange={e => setSearch(e.target.value)} className="w-full p-2 rounded border bg-gray-900 text-white" />
            </div>
            <div className="flex items-center gap-2">
              <input placeholder="New course title" value={newCourseTitle} onChange={e => setNewCourseTitle(e.target.value)} className="p-2 rounded border bg-gray-900 text-white" />
              <input placeholder="Description (optional)" value={newCourseDesc} onChange={e => setNewCourseDesc(e.target.value)} className="p-2 rounded border bg-gray-900 text-white" />
              <button onClick={createCourse} className="px-3 py-2 bg-blue-600 text-white rounded">Add course</button>
            </div>
          </div>

      {!activeCourse ? (
        <div>
          {loadingCourses ? <div>Loading courses...</div> : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {courses.filter(c => {
                if (!search) return true
                const q = search.toLowerCase()
                return (c.title || '').toLowerCase().includes(q) || (c.description || '').toLowerCase().includes(q)
              }).map(c => (
                <div key={c.id} className="p-4 border rounded bg-[rgba(255,255,255,0.02)]">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-medium text-lg">{c.name || c.title || c.id}</div>
                      {c.description && <div className="text-sm text-gray-400">{c.description}</div>}
                      <div className="text-xs text-gray-500 mt-2">{c.items?.length || 0} items</div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button onClick={() => openCourse(c)} className="px-2 py-1 bg-blue-600 text-white rounded text-sm">Open</button>
                      <button onClick={() => deleteCourse(c.id)} className="px-2 py-1 bg-red-600 text-white rounded text-sm">Delete</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div>
            <div className="mb-4 flex items-center justify-between">
            <div>
              <button onClick={() => { setActiveCourse(null); setCourseItems([]); setStatus('') }} className="px-3 py-2 bg-gray-700 text-white rounded mr-2">Back</button>
              <span className="text-xl font-semibold">{activeCourse.name || activeCourse.title}</span>
              <div className="text-sm text-gray-400">{activeCourse.description}</div>
            </div>
            <div className="text-sm text-gray-400">{status}</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {courseItems.map((item, index) => (
              <div key={index} className="p-4 border rounded bg-[rgba(255,255,255,0.02)]">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-medium">{item.name}</div>
                    <div className="text-xs text-gray-400 mb-2">Category: {item.category}</div>
                    <div className="mt-2">
                      <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 text-sm hover:underline">
                        Open URL →
                      </a>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button onClick={() => deleteItemFromCourse(index)} className="px-2 py-1 bg-red-600 text-white rounded text-sm">Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>          <div className="border rounded p-4">
            <h3 className="font-medium mb-2">Add new item to course</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
              <input 
                placeholder="Item Name *" 
                value={newItem.name} 
                onChange={e => setNewItem(prev => ({ ...prev, name: e.target.value }))} 
                className="p-2 rounded border bg-gray-900 text-white" 
              />
              <input 
                placeholder="URL *" 
                value={newItem.url} 
                onChange={e => setNewItem(prev => ({ ...prev, url: e.target.value }))} 
                className="p-2 rounded border bg-gray-900 text-white" 
              />
              <select 
                value={newItem.category} 
                onChange={e => setNewItem(prev => ({ ...prev, category: e.target.value }))} 
                className="p-2 rounded border bg-gray-900 text-white"
              >
                <option value="library-pyqs">BITS Library PYQs & Solutions</option>
                <option value="others">Files & Documents</option>
                <option value="videos">Videos</option>
                <option value="guide">Guides & Articles</option>
              </select>
            </div>
            <div>
              <button onClick={createItemForActiveCourse} className="px-3 py-2 bg-blue-600 text-white rounded">Add Item</button>
            </div>
          </div>
        </div>
      )}
        </>
      )}

      {/* Chat Management Tab */}
      {activeTab === 'chats' && (
        <div>
          {!activeChatUser ? (
            <div>
              <h3 className="text-xl font-semibold mb-4">User Chats</h3>
              {loadingChats ? (
                <div>Loading chats...</div>
              ) : (
                <>
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-sm text-gray-400">
                        {chatUsers.length} conversation{chatUsers.length !== 1 ? 's' : ''} found
                      </div>
                      {loadingChats && (
                        <div className="text-xs text-blue-400 flex items-center gap-1">
                          <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                          Loading...
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-xs text-green-400">🔄 Auto-refresh enabled</div>
                      <button 
                        onClick={loadChatUsers}
                        disabled={loadingChats}
                        className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 disabled:opacity-50 transition-colors"
                      >
                        {loadingChats ? 'Loading...' : 'Refresh'}
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {chatUsers.map(chatUser => (
                      <div key={chatUser.chatId} className="p-4 border rounded bg-[rgba(255,255,255,0.02)] hover:bg-[rgba(255,255,255,0.05)] transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="font-medium flex items-center gap-2">
                              {chatUser.name}
                              <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded-full">
                                {chatUser.messageCount} msg{chatUser.messageCount !== 1 ? 's' : ''}
                              </span>
                            </div>
                            <div className="text-sm text-gray-400">{chatUser.email}</div>
                            <div className="text-xs text-gray-500 mt-2 line-clamp-2">{chatUser.latestMessage}</div>
                            {chatUser.latestTime && (
                              <div className="text-xs text-gray-400 mt-1">
                                Last: {chatUser.latestTime.toLocaleString()}
                              </div>
                            )}
                            <div className="text-xs text-gray-400 mt-1">Chat ID: {chatUser.chatId.substring(0, 8)}...</div>
                          </div>
                          <button 
                            onClick={() => openChatWithUser(chatUser)}
                            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                          >
                            Open Chat
                          </button>
                        </div>
                      </div>
                    ))}
                    {chatUsers.length === 0 && !loadingChats && (
                      <div className="text-gray-400">
                        <p>No chat conversations yet.</p>
                        <p className="text-sm mt-2">Users need to send their first message at /chat to appear here.</p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div>
              <div className="mb-4 flex items-center justify-between max-w">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={closeChatWithUser}
                    className="px-3 py-2 bg-gray-700 text-white rounded"
                  >
                    Back
                  </button>
                  <div>
                    <div className="font-semibold">{activeChatUser.name}</div>
                    <div className="text-sm text-gray-400">{activeChatUser.email}</div>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="mb-3 h-80 overflow-y-auto hover-scrollbar px-2 py-2">
                {messages.map(message => (
                  <div key={message.id} className={`mb-2 ${message.sender === 'admin' ? 'text-right' : 'text-left'}`}>
                    <div className={`inline-block p-2 rounded text-sm ${
                      message.sender === 'admin' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-700 text-white'
                    }`}
                    style={{ maxWidth: '500px' }}>
                      {message.text}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {message.timestamp?.toDate?.()?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || 'Sending...'}
                    </div>
                  </div>
                ))}
                {messages.length === 0 && (
                  <div className="text-gray-400 text-center text-sm">No messages yet. Start the conversation!</div>
                )}
              </div>

              {/* Send message */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && sendMessageToUser()}
                  placeholder="Type your message..."
                  className="flex-1 p-2 rounded border bg-gray-900 text-white text-sm"
                />
                <button 
                  onClick={sendMessageToUser}
                  className="px-3 py-2 bg-blue-600 text-white rounded text-sm"
                >
                  Send
                </button>
              </div>
            </div>
          )}
        </div>
      )}



      {status && (
        <div className="mt-4 p-2 bg-gray-800 text-white rounded">
          {status}
        </div>
      )}
    </div>
  )
}


