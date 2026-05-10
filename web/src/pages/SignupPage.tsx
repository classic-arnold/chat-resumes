import { SignUp, useAuth } from '@clerk/react'
import { Navigate, Link } from 'react-router-dom'

import { isClerkConfigured } from '../auth/clerk'
import { AuthShell } from '../components/AuthShell'

const SignupShell = ({ rightContent }: { rightContent: React.ReactNode }) => (
  <AuthShell
    footnote={
      <>
        Create your account to launch your profile and start training your AI.
      </>
    }
    heroBody="Every candidate on ChatResumes gets a permanent, shareable AI link. Put it on your resume. Recruiters who click it spend an average of 4 minutes learning about you — vs. 7 seconds skimming a PDF."
    heroHeadline='"I got 3 interview requests the week I added my link."'
    heroUrl={
      <>
        🔗 Your link will be: <strong>chatresumes.io/[yourhandle]</strong>
      </>
    }
    subtitle={
      <>
        Already have an account? <Link to="/login">Log in here</Link>
        {' '}or <Link to="/pricing">review pricing</Link>
      </>
    }
    rightContent={rightContent}
    testimonials={[
      {
        name: '— Marcus T., Software Engineer at Stripe',
        text: '"I went from ghosted to getting callbacks in 48 hours. The recruiter said my link was what made her stop scrolling."',
      },
      {
        name: '— Priya S., Senior Recruiter at Google',
        text: '"Every serious candidate I am seeing now has one. If yours does not, I am already moving on."',
      },
    ]}
    title="Create your account"
  >
    <></>
  </AuthShell>
)

const SignupPageWithClerk = () => {
  const { isLoaded, isSignedIn } = useAuth()

  if (!isLoaded) {
    return (
      <SignupShell
        rightContent={
          <div className="auth-live-panel">
            <div className="auth-live-card">Loading secure signup…</div>
          </div>
        }
      />
    )
  }

  if (isSignedIn) {
    return <Navigate replace to="/dashboard" />
  }

  return (
    <SignupShell
      rightContent={
        <div className="auth-live-panel">
          <SignUp
            fallbackRedirectUrl="/dashboard"
            path="/signup"
            routing="path"
            signInUrl="/login"
          />
        </div>
      }
    />
  )
}

export const SignupPage = () => {
  if (!isClerkConfigured) {
    return (
      <SignupShell
        rightContent={
          <div className="auth-live-panel">
            <div className="auth-config-card">
              <div className="auth-config-title">Sign-up is temporarily unavailable</div>
              <div className="auth-config-body">Please try again in a moment.</div>
            </div>
          </div>
        }
      />
    )
  }

  return <SignupPageWithClerk />
}