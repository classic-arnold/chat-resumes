import { SignUp, useAuth } from '@clerk/react'
import { Link, Navigate } from 'react-router-dom'

import { clerkAppearance, isClerkConfigured } from '../auth/clerk'

const Frame = ({ children }: { children: React.ReactNode }) => (
  <div className="auth-page-simple">
    <header className="auth-page-simple-header">
      <Link className="app-nav-brand" to="/">
        <span className="app-nav-brand-mark" aria-hidden />
        ChatResumes
      </Link>
    </header>
    <div className="auth-page-simple-main">
      <div className="auth-page-simple-card">
        {children}
        <div className="auth-page-simple-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  </div>
)

const SignupBody = () => {
  const { isLoaded, isSignedIn } = useAuth()

  if (isLoaded && isSignedIn) {
    return <Navigate replace to="/dashboard" />
  }

  if (!isLoaded) {
    return <div className="ui-status-text">Loading secure signup…</div>
  }

  return (
    <SignUp
      appearance={clerkAppearance}
      fallbackRedirectUrl="/dashboard"
      path="/signup"
      routing="path"
      signInUrl="/login"
    />
  )
}

export const SignupPage = () => {
  if (!isClerkConfigured) {
    return (
      <Frame>
        <div className="ui-card ui-card-pad-lg" style={{ textAlign: 'center' }}>
          <div className="ui-section-title">Sign-up is temporarily unavailable</div>
          <p className="ui-status-text" style={{ marginTop: '0.5rem' }}>
            Please try again in a moment.
          </p>
        </div>
      </Frame>
    )
  }

  return (
    <Frame>
      <SignupBody />
    </Frame>
  )
}
