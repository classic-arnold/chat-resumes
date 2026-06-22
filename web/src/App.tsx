import { useAuth } from '@clerk/react'
import { useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'

import { isClerkConfigured } from './auth/clerk'
import { ProtectedRoute } from './auth/ProtectedRoute'
import { SocialProofPopup } from './components/SocialProofPopup'
import { trackMetaPageView } from './lib/metaPixel'
import {
  identifyPostHogUser,
  resetPostHogUser,
  trackPostHogPageView,
} from './lib/posthog'
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

const PostHogTracker = () => {
  const { hash, pathname, search } = useLocation()

  useEffect(() => {
    trackPostHogPageView(`${pathname}${search}${hash}`)
  }, [hash, pathname, search])

  return null
}

const MARKETING_ROUTES = new Set(['/', '/pricing'])

const SocialProofGate = () => {
  const { pathname } = useLocation()

  return MARKETING_ROUTES.has(pathname) ? <SocialProofPopup /> : null
}

const PostHogIdentityTracker = () => {
  const { isLoaded, isSignedIn, userId } = useAuth()

  useEffect(() => {
    if (!isLoaded) {
      return
    }

    if (isSignedIn && userId) {
      identifyPostHogUser(userId)
      return
    }

    resetPostHogUser()
  }, [isLoaded, isSignedIn, userId])

  return null
}

const App = () => (
  <>
    <MetaPixelTracker />
    <PostHogTracker />
    {isClerkConfigured ? <PostHogIdentityTracker /> : null}
    <ScrollToTop />
    <SocialProofGate />
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
