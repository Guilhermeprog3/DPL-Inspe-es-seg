'use client'

import { useEffect, useState } from 'react'
import { signIn, signOut, useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { AlertTriangle, Clock, Eye, EyeOff, LogOut, RefreshCw } from 'lucide-react'
import { useTokenExpiry } from '@/hooks/useTokenExpiry'

export function TokenExpiryGuard() {
  const { tokenStatus, formatRemaining } = useTokenExpiry()
  const { data: session } = useSession()
  const pathname = usePathname()

  const [toastVisible, setToastVisible] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [isRenewing, setIsRenewing] = useState(false)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [passwordError, setPasswordError] = useState('')

  const isPublicRoute = pathname?.startsWith('/login') || pathname?.startsWith('/register')

  useEffect(() => {
    if (isPublicRoute) return

    if (tokenStatus === 'warning') {
      setToastVisible(true)
    }
    if (tokenStatus === 'expired') {
      setToastVisible(false)
      setModalOpen(false)
      signOut({ callbackUrl: '/login?reason=expired' })
    }
  }, [tokenStatus, isPublicRoute])

  if (isPublicRoute) return null

  function handleToastAction() {
    setToastVisible(false)
    setPassword('')
    setPasswordError('')
    setModalOpen(true)
  }

  async function handleRenew() {
    if (!password.trim()) {
      setPasswordError('Digite sua senha para continuar.')
      return
    }

    setIsRenewing(true)
    setPasswordError('')

    try {
      const result = await signIn('credentials', {
        redirect: false,
        email: session?.user?.email ?? '',
        password,
      })

      if (result?.error) {
        setPasswordError('Senha incorreta. Tente novamente.')
        setIsRenewing(false)
        return
      }

      setModalOpen(false)
      setToastVisible(false)
      setPassword('')
    } catch {
      setPasswordError('Erro ao renovar. Tente novamente.')
    } finally {
      setIsRenewing(false)
    }
  }

  async function handleSignOut() {
    setModalOpen(false)
    await signOut({ callbackUrl: '/login' })
  }

  if (tokenStatus === 'ok') return null

  return (
    <>
      {toastVisible && (
        <div
          role="alert"
          aria-live="polite"
          style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            background: '#ffffff',
            border: '1px solid #fde68a',
            borderLeft: '4px solid #f59e0b',
            borderRadius: '12px',
            padding: '14px 16px',
            boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
            maxWidth: '360px',
            width: '100%',
            animation: 'slideIn 0.3s ease',
          }}
        >
          <AlertTriangle size={18} style={{ color: '#f59e0b', flexShrink: 0, marginTop: '1px' }} />
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontWeight: 600, fontSize: '13px', color: '#1a1a2e', lineHeight: 1.4 }}>
              Sessão expira em {formatRemaining()}
            </p>
            <p style={{ margin: '2px 0 10px', fontSize: '12px', color: '#6b7280' }}>
              Deseja renovar para continuar?
            </p>
            <button
              onClick={handleToastAction}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                fontWeight: 500,
                color: '#92400e',
                background: '#fef3c7',
                border: '1px solid #fde68a',
                borderRadius: '6px',
                padding: '5px 10px',
                cursor: 'pointer',
              }}
            >
              <RefreshCw size={12} />
              Renovar sessão
            </button>
          </div>
        </div>
      )}

      {modalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="expiry-modal-title"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.45)',
            padding: '16px',
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              padding: '28px',
              maxWidth: '400px',
              width: '100%',
              boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
            }}
          >
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: '#fef3c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
            }}>
              <Clock size={22} style={{ color: '#f59e0b' }} />
            </div>

            <h2
              id="expiry-modal-title"
              style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: 600, color: '#1a1a2e' }}
            >
              Confirme sua senha para renovar
            </h2>
            <p style={{ margin: '0 0 20px', fontSize: '13px', color: '#6b7280', lineHeight: 1.6 }}>
              Faltam {formatRemaining()} para sua sessão encerrar.
              Digite sua senha para continuar sem interrupções.
            </p>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#9ca3af', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                E-mail
              </label>
              <div style={{
                padding: '10px 12px',
                background: '#f9fafb',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '13px',
                color: '#6b7280',
              }}>
                {session?.user?.email}
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label
                htmlFor="renew-password"
                style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#374151', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}
              >
                Senha
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="renew-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (passwordError) setPasswordError('')
                  }}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleRenew() }}
                  placeholder="Digite sua senha"
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '10px 40px 10px 12px',
                    fontSize: '13px',
                    color: '#1a1a2e',
                    background: '#ffffff',
                    border: `1px solid ${passwordError ? '#ef4444' : '#e5e7eb'}`,
                    borderRadius: '8px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.15s',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#9ca3af',
                    padding: '2px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {passwordError && (
                <p style={{ margin: '5px 0 0', fontSize: '12px', color: '#ef4444' }}>
                  {passwordError}
                </p>
              )}
            </div>

            {/* Botões */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handleSignOut}
                disabled={isRenewing}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '10px',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: '#6b7280',
                  background: '#f3f4f6',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  cursor: isRenewing ? 'not-allowed' : 'pointer',
                  opacity: isRenewing ? 0.6 : 1,
                }}
              >
                <LogOut size={14} />
                Sair agora
              </button>

              <button
                onClick={handleRenew}
                disabled={isRenewing}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '10px',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: '#92400e',
                  background: '#fef3c7',
                  border: '1px solid #fde68a',
                  borderRadius: '8px',
                  cursor: isRenewing ? 'not-allowed' : 'pointer',
                  opacity: isRenewing ? 0.7 : 1,
                }}
              >
                <RefreshCw
                  size={14}
                  style={{ animation: isRenewing ? 'spin 1s linear infinite' : 'none' }}
                />
                {isRenewing ? 'Verificando...' : 'Renovar sessão'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-12px); } /* 👈 Mudado para -12px para dar o efeito de descer */
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  )
}