import { ClerkProvider } from '@clerk/react'
import type { PropsWithChildren } from 'react'

import { clerkAppearance, clerkPublishableKey, isClerkConfigured } from './clerk'

export const AppAuthProvider = ({ children }: PropsWithChildren) => {
  if (!isClerkConfigured || !clerkPublishableKey) {
    return children
  }

  return (
    <ClerkProvider afterSignOutUrl="/" appearance={clerkAppearance} publishableKey={clerkPublishableKey}>
      {children}
    </ClerkProvider>
  )
}