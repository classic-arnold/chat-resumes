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
    <div className="min-h-screen flex flex-col bg-off-white text-navy-text font-mono">
      <header className="sticky top-0 z-20 flex items-center justify-between gap-[1rem] py-[0.85rem] px-[1.5rem] bg-[rgba(255,255,255,0.92)] backdrop-blur-[10px] border-b border-border">
        <Link className="inline-flex items-center gap-[0.45rem] no-underline text-navy-text font-inter font-extrabold text-[1rem] tracking-[-0.02em]" to="/dashboard">
          <span className="w-[22px] h-[22px] rounded-[6px] bg-gradient-to-br from-blue-deep to-blue-bright" aria-hidden />
          ChatResumes
        </Link>
        <div className="inline-flex items-center gap-[0.75rem]">
          {action}
          {isClerkConfigured && isSignedIn ? <UserButton /> : null}
          {isClerkConfigured && !isSignedIn ? (
            <Link className="inline-flex items-center justify-center gap-[0.45rem] border border-blue-deep rounded-[8px] py-[0.4rem] px-[0.7rem] font-mono font-medium text-[0.72rem] tracking-[0.01em] cursor-pointer transition-all duration-120 bg-transparent text-blue-deep hover:bg-blue-pale no-underline whitespace-nowrap" to="/login">
              Sign in
            </Link>
          ) : null}
        </div>
      </header>
      <main className={['flex-1 w-full max-w-[72rem] mx-auto my-0 pt-[1.75rem] px-[1.5rem] pb-[3rem] flex flex-col gap-[1.25rem]', contentClassName ?? ''].filter(Boolean).join(' ')}>
        {children}
      </main>
    </div>
  )
}
