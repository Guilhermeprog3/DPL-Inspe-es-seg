'use client'

import './login.css'
import { signIn } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useState } from 'react'
import { loginSchema, type LoginInput } from '@/lib/validations'
import { REGIONAIS_POR_UF, type UF } from '@/types'
import { Mail, Lock, ChevronDown, LogIn, AlertCircle, Eye, EyeOff, Loader2, ShieldAlert } from 'lucide-react'
import api from '@/lib/api'

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
    shouldUnregister: false,
    defaultValues: {
      email: '',
      senha: '',
      uf: '' as UF,
      regional: '',
    },
  })

  const ufAtual = watch('uf')
  const regionalAtual = watch('regional')
  const autoFilled = emailLookup === 'found'

  async function handleEmailBlur() {
    const email = watch('email')
    if (!email || !email.includes('@')) return

    setEmailLookup('loading')
    try {
      const res = await api.get(`/users/by-email?email=${encodeURIComponent(email)}`)
      const data = res.data

      if (data.uf && data.regional) {
        setValue('uf', data.uf, { shouldValidate: true, shouldDirty: true })
        setValue('regional', data.regional, { shouldValidate: true, shouldDirty: true })
        clearErrors(['uf', 'regional'])
        setEmailLookup('found')
      } else {
        setEmailLookup('not-found')
      }
    } catch (err) {
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
        redirect: false, // Necessário para capturar o erro manualmente
      })

      if (res?.error) {
        // Se a mensagem contiver palavras chaves de inatividade vindas do seu AuthService
        if (res.error.toLowerCase().includes('inativa') || res.error.toLowerCase().includes('aprovação')) {
          setError(res.error)
        } else {
          setError('E-mail ou senha inválidos. Verifique suas credenciais.')
        }
        return
      }

      if (res?.ok) window.location.href = '/modulos'
    } catch {
      setError('Não foi possível conectar ao servidor.')
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

        {/* Renderização condicional do banner de erro ou alerta de conta inativa */}
        {error && (
          <div className={error.includes('inativa') || error.includes('aprovação') ? "pending-banner" : "error-banner"}>
            {error.includes('inativa') ? <ShieldAlert size={16} /> : <AlertCircle size={15} className="error-banner-icon" />}
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
                    <Loader2 size={10} className="animate-spin" /> Buscando...
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
              {errors.email && <p className="field-error"><AlertCircle size={11} />{errors.email.message}</p>}
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
                <span className="field-icon clickable" onClick={() => setShowPassword(p => !p)}>
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </span>
              </div>
              {errors.senha && <p className="field-error"><AlertCircle size={11} />{errors.senha.message}</p>}
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
                  <button type="button" className="auto-fill-change" onClick={handleAlterar}>Alterar</button>
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
                  {errors.uf && <p className="field-error"><AlertCircle size={11} />{errors.uf.message}</p>}
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
                  {errors.regional && <p className="field-error"><AlertCircle size={11} />{errors.regional.message}</p>}
                </div>
              </>
            )}
          </div>

          <button type="submit" disabled={isSubmitting} className="btn">
            {isSubmitting ? <><span className="spinner" /> Entrando...</> : <><LogIn size={15} /> Entrar</>}
          </button>
        </form>

        <div className="footer">
          <Link href="/cadastro">Solicitar Acesso</Link>
          <span className="footer-dot" />
          <Link href="/recuperar-senha">Esqueceu a senha?</Link>
        </div>
      </div>

      {/* Adicione este CSS no seu login.css ou aqui para o banner de aviso */}
      <style dangerouslySetInnerHTML={{ __html: `
        .pending-banner {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #fffbeb;
          border: 1px solid #fde68a;
          border-left: 4px solid #f59e0b;
          border-radius: 10px;
          padding: 12px;
          margin-bottom: 20px;
          color: #92400e;
          font-size: 13px;
          font-weight: 500;
        }
      `}} />
    </div>
  )
}