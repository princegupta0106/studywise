import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './contexts/AuthContext'
import { CachedAuthProvider } from './contexts/CachedAuthContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <CachedAuthProvider>
          <App />
        </CachedAuthProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
