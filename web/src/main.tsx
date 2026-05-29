import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

import App from './App'
import { AppAuthProvider } from './auth/AppAuthProvider'
import './styles/globals.css'
import './styles/app.css'
import './styles/landing.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppAuthProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </AppAuthProvider>
  </StrictMode>,
)
