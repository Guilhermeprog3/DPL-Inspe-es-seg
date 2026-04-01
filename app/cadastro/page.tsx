'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useState } from 'react'
import { cadastroSchema, type CadastroInput } from '@/lib/validations'
import { REGIONAIS_POR_UF, type UF } from '@/types'
import { User, Mail, Lock, ChevronDown, Briefcase, ArrowLeft, AlertCircle, Eye, EyeOff, CheckCircle2 } from 'lucide-react'

export default function CadastroPage() {
  const router = useRouter()
  const [ufSel, setUfSel] = useState<UF | ''>('')
  const [showSenha, setShowSenha] = useState(false)
  const [showConfirmar, setShowConfirmar] = useState(false)
  const [globalError, setGlobalError] = useState('')
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<CadastroInput>({
    resolver: zodResolver(cadastroSchema),
    mode: 'onBlur',
  })

  function handleUfChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value as UF
    setUfSel(val)
    setValue('uf', val, { shouldValidate: true })
    setValue('regional', '', { shouldValidate: false })
    clearErrors('regional')
  }

  async function onSubmit(data: CadastroInput) {
    setGlobalError('')
    try {
      const response = await fetch('http://localhost:3001/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: data.nome,
          sobrenome: data.sobrenome,
          email: data.email,
          password: data.senha,
          uf: data.uf,
          regional: data.regional,
          role: data.role,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        if (response.status === 409) {
          setGlobalError('Este e-mail já está cadastrado. Tente outro ou faça login.')
        } else {
          setGlobalError(errorData.message || 'Erro ao realizar o cadastro. Tente novamente.')
        }
        return
      }

      setSuccess(true)
      setTimeout(() => router.push('/login'), 2500)
    } catch {
      setGlobalError('Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.')
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Syne:wght@700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .page {
          min-height: 100vh;
          background: #eef1f6;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 32px 24px;
          font-family: 'DM Sans', sans-serif;
          position: relative;
          overflow: hidden;
        }
        .page::before {
          content: '';
          position: fixed;
          top: -200px; right: -200px;
          width: 520px; height: 520px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(9,71,128,0.07) 0%, transparent 70%);
          pointer-events: none;
        }
        .page::after {
          content: '';
          position: fixed;
          bottom: -200px; left: -100px;
          width: 480px; height: 480px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(230,122,14,0.06) 0%, transparent 70%);
          pointer-events: none;
        }

        .card {
          background: #fff;
          border-radius: 20px;
          border: 1px solid rgba(9,71,128,0.08);
          box-shadow: 0 4px 32px rgba(9,71,128,0.09);
          width: 100%;
          max-width: 460px;
          padding: 40px 36px 32px;
          position: relative;
          z-index: 1;
          animation: fadeUp 0.45s ease forwards;
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .brand { text-align: center; margin-bottom: 28px; }
        .logo {
          font-family: 'Syne', sans-serif;
          font-size: 26px; font-weight: 800;
          color: #094780; letter-spacing: 4px;
          display: inline-flex; align-items: center; gap: 6px;
        }
        .logo-dot {
          width: 7px; height: 7px; border-radius: 50%;
          background: #E67A0E; margin-bottom: 2px;
        }
        .brand-sub { font-size: 12px; color: #96a3b5; margin-top: 6px; }

        .sep { height: 1px; background: #f0f3f7; margin-bottom: 22px; }

        /* Erro global */
        .error-banner {
          display: flex; align-items: flex-start; gap: 10px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-left: 3px solid #ef4444;
          border-radius: 10px;
          padding: 11px 13px;
          margin-bottom: 18px;
          animation: shake 0.35s ease;
        }
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          20%      { transform: translateX(-5px); }
          40%      { transform: translateX(5px); }
          60%      { transform: translateX(-3px); }
          80%      { transform: translateX(3px); }
        }
        .error-banner-icon { color: #ef4444; flex-shrink: 0; margin-top: 1px; }
        .error-banner-text { font-size: 12px; color: #b91c1c; line-height: 1.5; }

        /* Sucesso */
        .success-banner {
          display: flex; align-items: flex-start; gap: 10px;
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          border-left: 3px solid #22c55e;
          border-radius: 10px;
          padding: 11px 13px;
          margin-bottom: 18px;
          animation: fadeUp 0.3s ease;
        }
        .success-banner-icon { color: #22c55e; flex-shrink: 0; margin-top: 1px; }
        .success-banner-text { font-size: 12px; color: #15803d; line-height: 1.5; }

        /* Campos */
        .fields { display: flex; flex-direction: column; gap: 14px; }
        .row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

        .field { display: flex; flex-direction: column; gap: 5px; }
        .field-label {
          font-size: 11px; font-weight: 600;
          color: #6b7a8d; letter-spacing: 0.5px;
          text-transform: uppercase;
        }
        .field-wrap { position: relative; }

        .field-input, .field-select {
          width: 100%; height: 44px;
          padding: 0 38px 0 13px;
          border-radius: 10px;
          border: 1.5px solid #e2e8f0;
          background: #f8fafc;
          font-size: 13px;
          font-family: 'DM Sans', sans-serif;
          color: #1a2535;
          outline: none;
          appearance: none;
          transition: border-color 0.18s, box-shadow 0.18s, background 0.18s;
        }
        .field-input::placeholder { color: #b8c2cc; }
        .field-input:focus, .field-select:focus {
          border-color: #094780;
          background: #fff;
          box-shadow: 0 0 0 3px rgba(9,71,128,0.09);
        }
        .field-input.has-error, .field-select.has-error {
          border-color: #ef4444;
          background: #fff9f9;
          box-shadow: 0 0 0 3px rgba(239,68,68,0.07);
        }
        .field-select:disabled {
          background: #f1f5f9; color: #b8c2cc; cursor: not-allowed;
        }

        .field-icon {
          position: absolute; right: 11px; top: 50%;
          transform: translateY(-50%);
          color: #b8c2cc; pointer-events: none;
          display: flex; align-items: center;
        }
        .field-icon.clickable {
          pointer-events: all; cursor: pointer;
          transition: color 0.15s;
        }
        .field-icon.clickable:hover { color: #094780; }

        .field-error {
          display: flex; align-items: center; gap: 4px;
          font-size: 11px; color: #ef4444;
          animation: errIn 0.2s ease;
        }
        @keyframes errIn {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .btn {
          width: 100%; height: 46px;
          margin-top: 22px;
          border-radius: 12px;
          border: none;
          background: #094780;
          color: #fff;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px; font-weight: 600;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          transition: background 0.18s, transform 0.12s, box-shadow 0.18s;
          box-shadow: 0 3px 14px rgba(9,71,128,0.22);
        }
        .btn:hover:not(:disabled) {
          background: #1a6ab5;
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(9,71,128,0.28);
        }
        .btn:active:not(:disabled) { transform: translateY(0); }
        .btn:disabled { opacity: 0.55; cursor: not-allowed; box-shadow: none; }

        .spinner {
          width: 15px; height: 15px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .footer {
          margin-top: 20px; padding-top: 18px;
          border-top: 1px solid #f0f3f7;
          text-align: center;
        }
        .footer a {
          font-size: 12px; font-weight: 600;
          color: #094780; text-decoration: none;
          display: inline-flex; align-items: center; gap: 6px;
          transition: color 0.15s;
        }
        .footer a:hover { color: #E67A0E; }
      `}</style>

      <div className="page">
        <div className="card">
          <div className="brand">
            <div className="logo">SIGS<span className="logo-dot" /></div>
            <p className="brand-sub">Solicite seu acesso ao sistema</p>
          </div>

          <div className="sep" />

          {globalError && (
            <div className="error-banner">
              <AlertCircle size={15} className="error-banner-icon" />
              <p className="error-banner-text">{globalError}</p>
            </div>
          )}

          {success && (
            <div className="success-banner">
              <CheckCircle2 size={15} className="success-banner-icon" />
              <p className="success-banner-text">
                Cadastro realizado com sucesso! Redirecionando para o login...
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="fields">

              {/* Nome e Sobrenome */}
              <div className="row">
                <div className="field">
                  <label className="field-label">Nome</label>
                  <div className="field-wrap">
                    <input
                      {...register('nome')}
                      placeholder="João"
                      className={`field-input${errors.nome ? ' has-error' : ''}`}
                    />
                    <span className="field-icon"><User size={14} /></span>
                  </div>
                  {errors.nome && (
                    <p className="field-error"><AlertCircle size={11} />{errors.nome.message}</p>
                  )}
                </div>
                <div className="field">
                  <label className="field-label">Sobrenome</label>
                  <div className="field-wrap">
                    <input
                      {...register('sobrenome')}
                      placeholder="Silva"
                      className={`field-input${errors.sobrenome ? ' has-error' : ''}`}
                    />
                  </div>
                  {errors.sobrenome && (
                    <p className="field-error"><AlertCircle size={11} />{errors.sobrenome.message}</p>
                  )}
                </div>
              </div>

              {/* E-mail */}
              <div className="field">
                <label className="field-label">E-mail Corporativo</label>
                <div className="field-wrap">
                  <input
                    type="email"
                    {...register('email')}
                    placeholder="joao@empresa.com"
                    className={`field-input${errors.email ? ' has-error' : ''}`}
                  />
                  <span className="field-icon"><Mail size={14} /></span>
                </div>
                {errors.email && (
                  <p className="field-error"><AlertCircle size={11} />{errors.email.message}</p>
                )}
              </div>

              {/* UF e Regional */}
              <div className="row">
                <div className="field">
                  <label className="field-label">Estado</label>
                  <div className="field-wrap">
                    <select
                      value={ufSel}
                      onChange={handleUfChange}
                      className={`field-select${errors.uf ? ' has-error' : ''}`}
                    >
                      <option value="">UF</option>
                      <option value="PI">PI — Piauí</option>
                      <option value="MA">MA — Maranhão</option>
                    </select>
                    <span className="field-icon"><ChevronDown size={14} /></span>
                  </div>
                  {errors.uf && (
                    <p className="field-error"><AlertCircle size={11} />{errors.uf.message}</p>
                  )}
                </div>
                <div className="field">
                  <label className="field-label">Regional</label>
                  <div className="field-wrap">
                    <select
                      disabled={!ufSel}
                      {...register('regional')}
                      className={`field-select${errors.regional ? ' has-error' : ''}`}
                    >
                      <option value="">Regional</option>
                      {ufSel && REGIONAIS_POR_UF[ufSel].map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                    <span className="field-icon"><ChevronDown size={14} /></span>
                  </div>
                  {errors.regional && (
                    <p className="field-error"><AlertCircle size={11} />{errors.regional.message}</p>
                  )}
                </div>
              </div>

              {/* Perfil */}
              <div className="field">
                <label className="field-label">Perfil de Acesso</label>
                <div className="field-wrap">
                  <select
                    {...register('role')}
                    className={`field-select${errors.role ? ' has-error' : ''}`}
                  >
                    <option value="">Selecione o Perfil</option>
                    <option value="inspetor">Inspetor</option>
                    <option value="sesmt">SESMT</option>
                    <option value="agente_cobli">Agente Cobli</option>
                    <option value="admin">Administrador</option>
                  </select>
                  <span className="field-icon"><Briefcase size={14} /></span>
                </div>
                {errors.role && (
                  <p className="field-error"><AlertCircle size={11} />{errors.role.message}</p>
                )}
              </div>

              {/* Senha e Confirmar */}
              <div className="row">
                <div className="field">
                  <label className="field-label">Senha</label>
                  <div className="field-wrap">
                    <input
                      type={showSenha ? 'text' : 'password'}
                      {...register('senha')}
                      placeholder="••••••••"
                      className={`field-input${errors.senha ? ' has-error' : ''}`}
                    />
                    <span
                      className="field-icon clickable"
                      onClick={() => setShowSenha((p) => !p)}
                    >
                      {showSenha ? <EyeOff size={14} /> : <Eye size={14} />}
                    </span>
                  </div>
                  {errors.senha && (
                    <p className="field-error"><AlertCircle size={11} />{errors.senha.message}</p>
                  )}
                </div>
                <div className="field">
                  <label className="field-label">Confirmar</label>
                  <div className="field-wrap">
                    <input
                      type={showConfirmar ? 'text' : 'password'}
                      {...register('confirmarSenha')}
                      placeholder="••••••••"
                      className={`field-input${errors.confirmarSenha ? ' has-error' : ''}`}
                    />
                    <span
                      className="field-icon clickable"
                      onClick={() => setShowConfirmar((p) => !p)}
                    >
                      {showConfirmar ? <EyeOff size={14} /> : <Eye size={14} />}
                    </span>
                  </div>
                  {errors.confirmarSenha && (
                    <p className="field-error"><AlertCircle size={11} />{errors.confirmarSenha.message}</p>
                  )}
                </div>
              </div>

            </div>

            <button type="submit" disabled={isSubmitting || success} className="btn">
              {isSubmitting ? (
                <><span className="spinner" /> Cadastrando...</>
              ) : (
                'Solicitar Acesso'
              )}
            </button>
          </form>

          <div className="footer">
            <Link href="/login">
              <ArrowLeft size={13} /> Já tenho conta
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}