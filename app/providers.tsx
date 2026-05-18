'use client'

import { SessionProvider } from 'next-auth/react'
import { TokenExpiryGuard } from '@/components/guard/TokenExpiryGuard'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <TokenExpiryGuard />
      {children}
    </SessionProvider>
  )
}