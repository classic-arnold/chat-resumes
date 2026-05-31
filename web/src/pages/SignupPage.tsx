import { SignUp, useAuth } from '@clerk/react'
import { Link, Navigate } from 'react-router-dom'

import { clerkAppearance, isClerkConfigured } from '../auth/clerk'

const Frame = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen flex flex-col bg-off-white text-navy-text">
    <header className="py-[1.25rem] px-[1.5rem] flex justify-start">
      <Link className="inline-flex items-center gap-[0.45rem] no-underline text-navy-text font-inter font-extrabold text-[1rem] tracking-[-0.02em]" to="/">
        <span className="w-[22px] h-[22px] rounded-[6px] bg-gradient-to-br from-blue-deep to-blue-bright" aria-hidden />
        ChatResumes
      </Link>
    </header>
    <div className="flex-1 flex items-center justify-center py-[2rem] px-[1rem]">
      <div className="w-full max-w-[400px]">
        {children}
        <div className="mt-[1.25rem] text-center text-[0.78rem] text-muted">
          Already have an account? <Link className="text-blue-bright hover:underline" to="/login">Sign in</Link>
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
    return <div className="text-center text-[0.74rem] text-muted py-[2rem] px-[1rem]">Loading secure signup…</div>
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
        <div className="bg-white border border-border rounded-[14px] shadow-[0_18px_48px_rgba(10,36,99,0.08)] p-[1.75rem] text-center">
          <div className="font-inter font-bold tracking-[-0.02em] text-[1.1rem] text-navy-text m-0">Sign-up is temporarily unavailable</div>
          <p className="text-center text-[0.74rem] text-muted py-[0.5rem] px-[1rem] mt-[0.5rem]">
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
