import { useAuth } from '@clerk/react'
import type { PropsWithChildren } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'

import { isClerkConfigured } from './clerk'

const ProtectedRouteWithClerk = ({ children }: PropsWithChildren) => {
  const { isLoaded, isSignedIn } = useAuth()
  const location = useLocation()

  if (!isLoaded) {
    return (
      <div className="auth-required-page">
        <div className="auth-required-card">Loading your account…</div>
      </div>
    )
  }

  if (!isSignedIn) {
    return <Navigate replace state={{ from: location.pathname }} to="/login" />
  }

  return children
}

export const ProtectedRoute = ({ children }: PropsWithChildren) => {
  if (!isClerkConfigured) {
    return (
      <div className="auth-required-page">
        <div className="auth-required-card">
          <div className="auth-required-title">Sign-in is temporarily unavailable</div>
          <div className="auth-config-body">
            Please return to the home page and try again shortly.
          </div>
          <div className="auth-required-actions">
            <Link className="btn-primary-blue" to="/">
              Back to Home
            </Link>
            <Link className="btn-outline-blue" to="/pricing">
              Review Pricing
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return <ProtectedRouteWithClerk>{children}</ProtectedRouteWithClerk>
}