'use client'

import { SessionProvider } from 'next-auth/react'
import { AuthSyncProvider } from './AuthSyncProvider'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthSyncProvider>
        {children}
      </AuthSyncProvider>
    </SessionProvider>
  )
} 