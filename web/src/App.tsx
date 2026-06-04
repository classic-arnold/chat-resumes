import { useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'

import { ProtectedRoute } from './auth/ProtectedRoute'
import { trackMetaPageView } from './lib/metaPixel'
import { BillingCancelPage } from './pages/BillingCancelPage'
import { BillingSuccessPage } from './pages/BillingSuccessPage'
import { ChatPage } from './pages/ChatPage'
import { DashboardPage } from './pages/DashboardPage'
import { LandingPage } from './pages/LandingPage'
import { LoginPage } from './pages/LoginPage'
import { PricingPage } from './pages/PricingPage'
import { PublicRecruiterChatPage } from './pages/PublicRecruiterChatPage'
import { SignupPage } from './pages/SignupPage'

const ScrollToTop = () => {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }, [pathname])

  return null
}

const MetaPixelTracker = () => {
  const { hash, pathname, search } = useLocation()

  useEffect(() => {
    trackMetaPageView(`${pathname}${search}${hash}`)
  }, [hash, pathname, search])

  return null
}

const App = () => (
  <>
    <MetaPixelTracker />
    <ScrollToTop />
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/p/:slug" element={<PublicRecruiterChatPage />} />
      <Route path="/pricing" element={<PricingPage />} />
      <Route
        path="/billing/success"
        element={
          <ProtectedRoute>
            <BillingSuccessPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/billing/cancel"
        element={
          <ProtectedRoute>
            <BillingCancelPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/chat"
        element={
          <ProtectedRoute>
            <ChatPage />
          </ProtectedRoute>
        }
      />
      <Route path="/signup/*" element={<SignupPage />} />
      <Route path="/login/*" element={<LoginPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  </>
)

export default App
