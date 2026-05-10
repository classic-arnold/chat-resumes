import { SignIn, useAuth } from '@clerk/react'
import { Navigate, Link } from 'react-router-dom'

import { isClerkConfigured } from '../auth/clerk'
import { AuthShell } from '../components/AuthShell'

const LoginShell = ({ rightContent }: { rightContent: React.ReactNode }) => (
  <AuthShell
    footnote={
      <>
        Sign in to manage your candidate dashboard, billing, and AI profile.
      </>
    }
    heroBody="While you were gone, your ChatResumes link was out there — answering questions, making impressions, and keeping you in the running for roles you do not even know about yet."
    heroHeadline="Welcome back. Your AI never stopped working."
    heroUrl={
      <>
        🔗 <strong>chatresumes.io/[yourhandle]</strong> — always on
      </>
    }
    subtitle={
      <>
        No account yet? <Link to="/signup">Create your account →</Link>
      </>
    }
    rightContent={rightContent}
    testimonials={[
      {
        name: '— Alexis R., Product Manager',
        text: '"A recruiter reached out on a Sunday night because they had chatted with my AI at 11pm. No static resume does that."',
      },
    ]}
    title="Welcome back"
  >
    <></>
  </AuthShell>
)

const LoginPageWithClerk = () => {
  const { isLoaded, isSignedIn } = useAuth()

  if (!isLoaded) {
    return (
      <LoginShell
        rightContent={
          <div className="auth-live-panel">
            <div className="auth-live-card">Loading secure login…</div>
          </div>
        }
      />
    )
  }

  if (isSignedIn) {
    return <Navigate replace to="/dashboard" />
  }

  return (
    <LoginShell
      rightContent={
        <div className="auth-live-panel">
          <SignIn
            fallbackRedirectUrl="/dashboard"
            path="/login"
            routing="path"
            signUpUrl="/signup"
          />
        </div>
      }
    />
  )
}

export const LoginPage = () => {
  if (!isClerkConfigured) {
    return (
      <LoginShell
        rightContent={
          <div className="auth-live-panel">
            <div className="auth-config-card">
              <div className="auth-config-title">Sign-in is temporarily unavailable</div>
              <div className="auth-config-body">Please try again in a moment.</div>
            </div>
          </div>
        }
      />
    )
  }

  return <LoginPageWithClerk />
}