'use client'

import './login.css'
import { signIn } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useState } from 'react'
import { loginSchema, type LoginInput } from '@/lib/validations'
import { REGIONAIS_POR_UF, type UF } from '@/types'
import { Mail, Lock, ChevronDown, LogIn, AlertCircle, Eye, EyeOff, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [emailLookup, setEmailLookup] = useState<'idle' | 'loading' | 'found' | 'not-found'>('idle')

const {
  register,
  handleSubmit,
  setValue,
  watch,
  clearErrors,
  formState: { errors, isSubmitting },
} = useForm<LoginInput>({
  resolver: zodResolver(loginSchema),
  mode: 'onBlur',
  shouldUnregister: false, // <--- ADICIONE ESTA LINHA
  defaultValues: {
    email: '',
    senha: '',
    uf: '' as UF,
    regional: '',
  },
})

  // Observa os valores em tempo real — sem useState separado
  const ufAtual = watch('uf')
  const regionalAtual = watch('regional')
  const autoFilled = emailLookup === 'found'

  async function handleEmailBlur() {
  const email = watch('email')
  if (!email || !email.includes('@')) return

  setEmailLookup('loading')
  try {
    const res = await fetch(`http://localhost:3001/users/by-email?email=${encodeURIComponent(email)}`)
    if (!res.ok) { 
      setEmailLookup('not-found')
      return 
    }

    const data = await res.json()
    if (data.uf && data.regional) {
      // 1. Definimos os valores
      setValue('uf', data.uf, { shouldValidate: true, shouldDirty: true })
      setValue('regional', data.regional, { shouldValidate: true, shouldDirty: true })
      
      // 2. Limpamos erros manualmente para garantir
      clearErrors(['uf', 'regional'])
      
      setEmailLookup('found')
    } else {
      setEmailLookup('not-found')
    }
  } catch (error) {
    setEmailLookup('not-found')
  }
}

  function handleUfChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setValue('uf', e.target.value as UF, { shouldValidate: true })
    setValue('regional', '', { shouldValidate: false })
    clearErrors('regional')
  }

  function handleRegionalChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setValue('regional', e.target.value, { shouldValidate: true })
  }

  function handleAlterar() {
    setEmailLookup('idle')
    setValue('uf', '' as UF, { shouldValidate: false })
    setValue('regional', '', { shouldValidate: false })
    clearErrors(['uf', 'regional'])
  }

  async function onSubmit(data: LoginInput) {
    setError('')
    try {
      const res = await signIn('credentials', {
        email: data.email,
        password: data.senha,
        uf: data.uf,
        regional: data.regional,
        redirect: false,
      })

      if (res?.error) {
        setError(
          res.error === 'Configuration'
            ? 'Erro de configuração: verifique o arquivo .env.local e reinicie o servidor.'
            : 'E-mail ou senha inválidos. Verifique suas credenciais e tente novamente.'
        )
        return
      }

      if (res?.ok) window.location.href = '/modulos'
    } catch {
      setError('Não foi possível conectar ao servidor. Tente novamente em instantes.')
    }
  }

  return (
    <div className="page">
      <div className="card">
        <div className="brand">
          <div className="logo">SIGS<span className="logo-dot" /></div>
          <p className="brand-sub">Faça login para iniciar sua sessão</p>
        </div>

        <div className="sep" />

        {error && (
          <div className="error-banner">
            <AlertCircle size={15} className="error-banner-icon" />
            <p className="error-banner-text">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="fields">

            {/* E-mail */}
            <div className="field">
              <div className="field-label-row">
                <label className="field-label">E-mail</label>
                {emailLookup === 'loading' && (
                  <span className="field-hint-loading">
                    <Loader2 size={10} style={{ animation: 'spin 0.7s linear infinite' }} />
                    Buscando...
                  </span>
                )}
                {emailLookup === 'found' && (
                  <span className="field-hint">✓ Dados preenchidos</span>
                )}
              </div>
              <div className="field-wrap">
                <input
                  type="email"
                  placeholder="seu@email.com"
                  className={`field-input${errors.email ? ' has-error' : ''}`}
                  {...register('email', { onBlur: handleEmailBlur })}
                />
                <span className="field-icon"><Mail size={15} /></span>
              </div>
              {errors.email && (
                <p className="field-error"><AlertCircle size={11} />{errors.email.message}</p>
              )}
            </div>

            {/* Senha */}
            <div className="field">
              <label className="field-label">Senha</label>
              <div className="field-wrap">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className={`field-input${errors.senha ? ' has-error' : ''}`}
                  {...register('senha')}
                />
                <span
                  className="field-icon clickable"
                  onClick={() => setShowPassword(p => !p)}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </span>
              </div>
              {errors.senha && (
                <p className="field-error"><AlertCircle size={11} />{errors.senha.message}</p>
              )}
            </div>

            {/* UF + Regional */}
            {autoFilled ? (
              <div className="field">
                <div className="field-label-row">
                  <span className="field-label">Estado · Regional</span>
                </div>
                <div className="auto-fill-block">
                  <div className="auto-fill-info">
                    <span className="auto-fill-label">Preenchido automaticamente</span>
                    <span className="auto-fill-value">{ufAtual} · {regionalAtual}</span>
                  </div>
                  <button type="button" className="auto-fill-change" onClick={handleAlterar}>
                    Alterar
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="field">
                  <label className="field-label">Estado</label>
                  <div className="field-wrap">
                    <select
                      className={`field-select${errors.uf ? ' has-error' : ''}`}
                      value={ufAtual}
                      onChange={handleUfChange}
                    >
                      <option value="">Selecione o Estado</option>
                      <option value="PI">PI — Piauí</option>
                      <option value="MA">MA — Maranhão</option>
                    </select>
                    <span className="field-icon"><ChevronDown size={15} /></span>
                  </div>
                  {errors.uf && (
                    <p className="field-error"><AlertCircle size={11} />{errors.uf.message}</p>
                  )}
                </div>

                <div className="field">
                  <label className="field-label">Regional</label>
                  <div className="field-wrap">
                    <select
                      className={`field-select${errors.regional ? ' has-error' : ''}`}
                      disabled={!ufAtual}
                      value={regionalAtual}
                      onChange={handleRegionalChange}
                    >
                      <option value="">Selecione a Regional</option>
                      {ufAtual && REGIONAIS_POR_UF[ufAtual as UF].map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                    <span className="field-icon"><ChevronDown size={15} /></span>
                  </div>
                  {errors.regional && (
                    <p className="field-error"><AlertCircle size={11} />{errors.regional.message}</p>
                  )}
                </div>
              </>
            )}

          </div>

          <button type="submit" disabled={isSubmitting} className="btn">
            {isSubmitting
              ? <><span className="spinner" /> Entrando...</>
              : <><LogIn size={15} /> Entrar</>
            }
          </button>
        </form>

        <div className="footer">
          <Link href="/cadastro">Solicitar Acesso</Link>
          <span className="footer-dot" />
          <Link href="/recuperar-senha">Esqueceu a senha?</Link>
        </div>
      </div>
    </div>
  )
}