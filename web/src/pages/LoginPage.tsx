import { SignIn, useAuth } from '@clerk/react'
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
          Need an account? <Link to="/signup">Sign up</Link>
        </div>
      </div>
    </div>
  </div>
)

const LoginBody = () => {
  const { isLoaded, isSignedIn } = useAuth()

  if (isLoaded && isSignedIn) {
    return <Navigate replace to="/dashboard" />
  }

  if (!isLoaded) {
    return <div className="ui-status-text">Loading secure sign-in…</div>
  }

  return (
    <SignIn
      appearance={clerkAppearance}
      fallbackRedirectUrl="/dashboard"
      path="/login"
      routing="path"
      signUpUrl="/signup"
    />
  )
}

export const LoginPage = () => {
  if (!isClerkConfigured) {
    return (
      <Frame>
        <div className="ui-card ui-card-pad-lg" style={{ textAlign: 'center' }}>
          <div className="ui-section-title">Sign-in is temporarily unavailable</div>
          <p className="ui-status-text" style={{ marginTop: '0.5rem' }}>
            Please try again in a moment.
          </p>
        </div>
      </Frame>
    )
  }

  return (
    <Frame>
      <LoginBody />
    </Frame>
  )
}
