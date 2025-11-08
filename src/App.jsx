import { useState } from 'react'
import { Routes, Route, Link } from 'react-router-dom'


import Home from './pages/Home'
import Buy from './pages/Buy'
import CourseList from './pages/CourseList'
import Content from './pages/Content'
import SeedPage from './pages/SeedPage'
import AdminPage from './pages/AdminPage'
import CategoryList from './pages/CategoryList'
import FilesDocuments from './pages/FilesDocuments'
import Chat from './pages/Chat'
import GroupChatNew from './pages/GroupChatNew'
import GroupChatList from './pages/GroupChatList'
import GroupChatView from './pages/GroupChatView'
import Links from './pages/Links'
import Navbar from './components/Navbar'
import CacheDebugger from './components/CacheDebugger'

function App() {
  return (
    <div>
      <Navbar/>
      <main style={{ padding: '1rem' }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/buy" element={<Buy />} />
          <Route path="/course/:courseId" element={<CourseList />} />
          <Route path="/course/:courseId/item/:itemId" element={<Content />} />
          <Route path="/course/:courseId/category/:category" element={<CategoryList />} />
          <Route path="/course/:courseId/files" element={<FilesDocuments />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/group-chat" element={<GroupChatNew />} />
          <Route path="/group-chats" element={<GroupChatList />} />
          <Route path="/group-chat/:gcId" element={<GroupChatView />} />
          <Route path="/links" element={<Links />} />
          <Route path="/seed" element={<SeedPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </main>
      <CacheDebugger />
    </div>
  )
}

export default App
