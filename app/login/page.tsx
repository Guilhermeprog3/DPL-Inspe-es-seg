'use client'

import './login.css'
import { signIn } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useState } from 'react'
import { loginSchema, type LoginInput } from '@/lib/validations'
import { REGIONAIS_POR_UF, type UF } from '@/types'
import { Mail, LogIn, AlertCircle, Eye, EyeOff, Loader2, ShieldAlert } from 'lucide-react'


export default function LoginPage() {
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    // CORREÇÃO: mode alterado para 'onSubmit' — validação só ao enviar,
    // evitando requisições prematuras enquanto o usuário digita.
    mode: 'onSubmit',
    defaultValues: {
      email: '',
      senha: '',
    },
  })

  async function onSubmit(data: LoginInput) {
    setError('')
    try {
      // CORREÇÃO: uf e regional removidos do signIn.
      // O AuthService no backend deve ler esses valores do banco de dados
      // usando o e-mail como chave, nunca confiar no que o cliente envia.
      const res = await signIn('credentials', {
        email: data.email,
        password: data.senha,
        redirect: false,
      })

      if (res?.error) {
        if (
          res.error.toLowerCase().includes('inativa') ||
          res.error.toLowerCase().includes('aprovação')
        ) {
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

  const isPendente =
    error.includes('inativa') || error.includes('aprovação')

  return (
    <div className="page">
      <div className="card">
        <div className="brand">
          <div className="logo">
            SIGS<span className="logo-dot" />
          </div>
          <p className="brand-sub">Faça login para iniciar sua sessão</p>
        </div>

        <div className="sep" />

        {error && (
          <div className={isPendente ? 'pending-banner' : 'error-banner'}>
            {isPendente ? (
              <ShieldAlert size={16} />
            ) : (
              <AlertCircle size={15} className="error-banner-icon" />
            )}
            <p className="error-banner-text">{error}</p>
          </div>
        )}

        {/* CORREÇÃO: autoComplete="on" no form garante que o browser
            propague autocomplete corretamente para os campos filhos. */}
        <form onSubmit={handleSubmit(onSubmit)} autoComplete="on">
          <div className="fields">

            {/* E-mail */}
            <div className="field">
              <label className="field-label" htmlFor="email">
                E-mail
              </label>
              <div className="field-wrap">
                <input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  // CORREÇÃO: autocomplete adicionado — exigido pelos padrões
                  // de acessibilidade e elimina o aviso do DevTools.
                  autoComplete="email"
                  className={`field-input${errors.email ? ' has-error' : ''}`}
                  {...register('email')}
                />
                <span className="field-icon">
                  <Mail size={15} />
                </span>
              </div>
              {errors.email && (
                <p className="field-error">
                  <AlertCircle size={11} />
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Senha */}
            <div className="field">
              <label className="field-label" htmlFor="senha">
                Senha
              </label>
              <div className="field-wrap">
                <input
                  id="senha"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  // CORREÇÃO: autocomplete="current-password" corrige o aviso
                  // "[DOM] Input elements should have autocomplete attributes".
                  autoComplete="current-password"
                  className={`field-input${errors.senha ? ' has-error' : ''}`}
                  {...register('senha')}
                />
                <span
                  className="field-icon clickable"
                  onClick={() => setShowPassword((p) => !p)}
                  // CORREÇÃO: acessibilidade — botão de toggle de senha
                  // precisa ser acionável via teclado.
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) =>
                    e.key === 'Enter' && setShowPassword((p) => !p)
                  }
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </span>
              </div>
              {errors.senha && (
                <p className="field-error">
                  <AlertCircle size={11} />
                  {errors.senha.message}
                </p>
              )}
            </div>

          </div>

          <button type="submit" disabled={isSubmitting} className="btn">
            {isSubmitting ? (
              <>
                <Loader2 size={15} className="animate-spin" /> Entrando...
              </>
            ) : (
              <>
                <LogIn size={15} /> Entrar
              </>
            )}
          </button>
        </form>

        <div className="footer">
          <Link href="/cadastro">Solicitar Acesso</Link>
          <span className="footer-dot" />
          <Link href="/recuperar-senha">Esqueceu a senha?</Link>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
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
        `,
      }} />
    </div>
  )
}