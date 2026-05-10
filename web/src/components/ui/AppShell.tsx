import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { UserButton, useAuth } from '@clerk/react'

import { isClerkConfigured } from '../../auth/clerk'

type AppShellProps = {
  action?: ReactNode
  children: ReactNode
  contentClassName?: string
}

export const AppShell = ({ action, children, contentClassName }: AppShellProps) => {
  const { isSignedIn } = useAuth()

  return (
    <div className="app-shell">
      <header className="app-nav">
        <Link className="app-nav-brand" to="/dashboard">
          <span className="app-nav-brand-mark" aria-hidden />
          ChatResumes
        </Link>
        <div className="app-nav-actions">
          {action}
          {isClerkConfigured && isSignedIn ? <UserButton /> : null}
          {isClerkConfigured && !isSignedIn ? (
            <Link className="ui-btn ui-btn-secondary ui-btn-sm" to="/login">
              Sign in
            </Link>
          ) : null}
        </div>
      </header>
      <main className={['app-main', contentClassName ?? ''].filter(Boolean).join(' ')}>
        {children}
      </main>
    </div>
  )
}
