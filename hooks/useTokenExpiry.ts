'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState, useRef, useCallback } from 'react'

const WARNING_BEFORE_MS = 10 * 60 * 1000

export type TokenStatus = 'ok' | 'warning' | 'expired'

export function useTokenExpiry() {
  const { data: session, status } = useSession()
  const [tokenStatus, setTokenStatus] = useState<TokenStatus>('ok')
  const [msRemaining, setMsRemaining] = useState<number | null>(null)
  const warningShownRef = useRef(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  useEffect(() => {
    if (status !== 'authenticated' || !session) {
      clearTimer()
      return
    }

    const expiresAt = (session as any).expiresAt as number | undefined
    const sessionError = (session as any).error as string | undefined

    if (sessionError === 'TokenExpired' || !expiresAt) {
      setTokenStatus('expired')
      clearTimer()
      return
    }

    function check() {
      const now = Date.now()
      const remaining = (expiresAt as number) - now

      setMsRemaining(remaining)

      if (remaining <= 0) {
        setTokenStatus('expired')
        clearTimer()
        return
      }

      if (remaining <= WARNING_BEFORE_MS && !warningShownRef.current) {
        warningShownRef.current = true
        setTokenStatus('warning')
        return
      }

      if (remaining > WARNING_BEFORE_MS && warningShownRef.current) {
        warningShownRef.current = false
        setTokenStatus('ok')
      }
    }

    check()
    intervalRef.current = setInterval(check, 30_000)

    return clearTimer
  }, [session, status, clearTimer])

  function formatRemaining(): string {
    if (msRemaining === null) return ''
    const minutes = Math.ceil(msRemaining / 60_000)
    if (minutes <= 1) return 'menos de 1 minuto'
    return `${minutes} minutos`
  }

  return { tokenStatus, msRemaining, formatRemaining }
}