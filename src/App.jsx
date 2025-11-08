import { useState } from 'react'
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom'


import Home from './pages/Home'
import Buy from './pages/Buy'
import CourseList from './pages/CourseList'
import Content from './pages/Content'
import SeedPage from './pages/SeedPage'
import AdminPage from './pages/AdminPage'
import CategoryList from './pages/CategoryList'
import FilesDocuments from './pages/FilesDocuments'
import Chat from './pages/Chat'
import GroupChatList from './pages/GroupChatList'
import GroupChatView from './pages/GroupChatView'
import Links from './pages/Links'
import Navbar from './components/Navbar'
import CacheDebugger from './components/CacheDebugger'
import SignIn from './pages/SignIn'
import { useCachedAuth } from './contexts/CachedAuthContext'

function App() {
  const location = useLocation()
  const { user, loading } = useCachedAuth() || {}

  // Simple guard component to protect routes
  const RequireAuth = ({ children }) => {
    if (loading) return <div style={{ padding: 16 }}>Loading…</div>
    if (!user) return <Navigate to="/signin" state={{ from: location }} replace />
    return children
  }

  const hideNavbar = location.pathname === '/signin'

  return (
    <div>
      {!hideNavbar && <Navbar />}
      <main style={{ padding: '1rem' }}>
        <Routes>
          <Route path="/signin" element={<SignIn />} />

          <Route path="/" element={<RequireAuth><Home /></RequireAuth>} />
          <Route path="/buy" element={<RequireAuth><Buy /></RequireAuth>} />
          <Route path="/course/:courseId" element={<RequireAuth><CourseList /></RequireAuth>} />
          <Route path="/course/:courseId/item/:itemId" element={<RequireAuth><Content /></RequireAuth>} />
          <Route path="/course/:courseId/category/:category" element={<RequireAuth><CategoryList /></RequireAuth>} />
          <Route path="/course/:courseId/files" element={<RequireAuth><FilesDocuments /></RequireAuth>} />
          <Route path="/chat" element={<RequireAuth><Chat /></RequireAuth>} />
         
          <Route path="/group-chats" element={<RequireAuth><GroupChatList /></RequireAuth>} />
          <Route path="/group-chat/:gcId" element={<RequireAuth><GroupChatView /></RequireAuth>} />
          <Route path="/links" element={<RequireAuth><Links /></RequireAuth>} />
          <Route path="/seed" element={<RequireAuth><SeedPage /></RequireAuth>} />
          <Route path="/admin" element={<RequireAuth><AdminPage /></RequireAuth>} />
        </Routes>
      </main>
      <CacheDebugger />
    </div>
  )
}

export default App
