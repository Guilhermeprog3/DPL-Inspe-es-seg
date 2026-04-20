'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useState } from 'react'
import { cadastroSchema, type CadastroInput } from '@/lib/validations'
import { REGIONAIS_POR_UF, type UF } from '@/types'
import api from '@/lib/api'
import {
  User, Mail, ChevronDown, Briefcase, ArrowLeft,
  AlertCircle, Eye, EyeOff, CheckCircle2, Clock, Info, WifiOff, UserX
} from 'lucide-react'

// Mapeia o erro da API para uma mensagem amigável e um ícone
function parseApiError(err: any): { message: string; type: 'conflict' | 'validation' | 'network' | 'server' } {
  const status = err?.response?.status
  const message = err?.response?.data?.message

  // Sem resposta do servidor = erro de rede/conexão
  if (!err?.response) {
    return {
      type: 'network',
      message: 'Sem conexão com o servidor. Verifique sua internet e tente novamente.',
    }
  }

  if (status === 409) {
    return {
      type: 'conflict',
      message: message || 'Este e-mail já está cadastrado. Tente outro ou faça login.',
    }
  }

  if (status === 400) {
    // Pode ser array de mensagens (class-validator) ou string única
    const detail = Array.isArray(message) ? message.join(' ') : message
    return {
      type: 'validation',
      message: detail || 'Dados inválidos. Verifique os campos e tente novamente.',
    }
  }

  if (status >= 500) {
    return {
      type: 'server',
      message: message || 'Erro interno no servidor. Tente novamente em instantes.',
    }
  }

  return {
    type: 'server',
    message: message || 'Erro inesperado. Tente novamente.',
  }
}

const ERROR_STYLES = {
  conflict:   { bg: '#fef2f2', border: '#fecaca', left: '#ef4444', text: '#b91c1c', Icon: UserX },
  validation: { bg: '#fef2f2', border: '#fecaca', left: '#ef4444', text: '#b91c1c', Icon: AlertCircle },
  network:    { bg: '#fff7ed', border: '#fed7aa', left: '#f97316', text: '#9a3412', Icon: WifiOff },
  server:     { bg: '#fef2f2', border: '#fecaca', left: '#ef4444', text: '#b91c1c', Icon: AlertCircle },
}

export default function CadastroPage() {
  const router = useRouter()
  const [ufSel,         setUfSel       ] = useState<UF | ''>('')
  const [showSenha,     setShowSenha   ] = useState(false)
  const [showConfirmar, setShowConfirmar] = useState(false)
  const [globalError,   setGlobalError ] = useState<{ message: string; type: 'conflict' | 'validation' | 'network' | 'server' } | null>(null)
  const [success,       setSuccess     ] = useState(false)

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
    setGlobalError(null)
    try {
      await api.post('/users', {
        nome:      data.nome,
        sobrenome: data.sobrenome,
        email:     data.email,
        password:  data.senha,
        uf:        data.uf,
        regional:  data.regional,
        role:      data.role,
      })
      setSuccess(true)
    } catch (err: any) {
      setGlobalError(parseApiError(err))
    }
  }

  const errStyle = globalError ? ERROR_STYLES[globalError.type] : null
  const ErrIcon  = errStyle?.Icon ?? AlertCircle

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=Syne:wght@700;800&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .page {
          min-height: 100vh;
          background: #eef1f6;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 32px 20px;
          font-family: 'DM Sans', sans-serif;
          position: relative;
          overflow: hidden;
        }

        .page::before {
          content: '';
          position: fixed;
          top: -220px; right: -220px;
          width: 560px; height: 560px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(9,71,128,0.07) 0%, transparent 70%);
          pointer-events: none;
        }
        .page::after {
          content: '';
          position: fixed;
          bottom: -220px; left: -120px;
          width: 520px; height: 520px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(230,122,14,0.06) 0%, transparent 70%);
          pointer-events: none;
        }

        .card {
          background: #fff;
          border-radius: 22px;
          border: 1px solid rgba(9,71,128,0.09);
          box-shadow: 0 6px 40px rgba(9,71,128,0.10);
          width: 100%;
          max-width: 480px;
          padding: 40px 36px 32px;
          position: relative;
          z-index: 1;
          animation: fadeUp 0.45s cubic-bezier(.22,.68,0,1.2) forwards;
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .brand { text-align: center; margin-bottom: 26px; }
        .logo {
          font-family: 'Syne', sans-serif;
          font-size: 26px; font-weight: 800;
          color: #094780; letter-spacing: 4px;
          display: inline-flex; align-items: center; gap: 2px;
        }
        .logo-dot {
          width: 7px; height: 7px; border-radius: 50%;
          background: #E67A0E; margin-bottom: 3px; margin-left: 1px;
        }
        .brand-sub {
          font-size: 12.5px; color: #8896ab;
          margin-top: 7px; font-weight: 500;
        }

        .sep { height: 1px; background: #f0f3f7; margin-bottom: 22px; }

        .error-banner {
          display: flex; align-items: flex-start; gap: 10px;
          border-left-width: 3px; border-left-style: solid;
          border-radius: 10px; padding: 11px 13px; margin-bottom: 18px;
          animation: shake 0.35s ease;
        }
        @keyframes shake {
          0%,100%{ transform:translateX(0); }
          20%    { transform:translateX(-5px); }
          40%    { transform:translateX(5px); }
          60%    { transform:translateX(-3px); }
          80%    { transform:translateX(3px); }
        }
        .error-text { font-size:12px; line-height:1.5; }

        .fields { display: flex; flex-direction: column; gap: 13px; }
        .row    { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

        .field { display: flex; flex-direction: column; gap: 5px; }
        .field-label {
          font-size: 10.5px; font-weight: 700;
          color: #6b7a8d; letter-spacing: 0.6px;
          text-transform: uppercase;
        }
        .field-wrap { position: relative; }

        .field-input, .field-select {
          width: 100%; height: 44px;
          padding: 0 38px 0 13px;
          border-radius: 11px;
          border: 1.5px solid #e2e8f0;
          background: #f8fafc;
          font-size: 13px;
          font-family: 'DM Sans', sans-serif;
          color: #1a2535;
          outline: none;
          appearance: none;
          transition: border-color .18s, box-shadow .18s, background .18s;
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
        .field-select:disabled { background: #f1f5f9; color: #b8c2cc; cursor: not-allowed; }

        .field-icon {
          position: absolute; right: 11px; top: 50%;
          transform: translateY(-50%);
          color: #b8c2cc; pointer-events: none;
          display: flex; align-items: center;
        }
        .field-icon.clickable {
          pointer-events: all; cursor: pointer; transition: color .15s;
        }
        .field-icon.clickable:hover { color: #094780; }

        .field-error {
          display: flex; align-items: center; gap: 4px;
          font-size: 11px; color: #ef4444;
          animation: errIn .2s ease;
        }
        @keyframes errIn {
          from { opacity:0; transform:translateY(-4px); }
          to   { opacity:1; transform:translateY(0); }
        }

        .btn {
          width: 100%; height: 46px; margin-top: 20px;
          border-radius: 12px; border: none;
          background: #094780; color: #fff;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px; font-weight: 700;
          cursor: pointer; letter-spacing: .2px;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          transition: background .18s, transform .12s, box-shadow .18s;
          box-shadow: 0 3px 16px rgba(9,71,128,0.24);
        }
        .btn:hover:not(:disabled) {
          background: #1a6ab5;
          transform: translateY(-1px);
          box-shadow: 0 7px 22px rgba(9,71,128,0.28);
        }
        .btn:active:not(:disabled) { transform: translateY(0); }
        .btn:disabled { opacity: .55; cursor: not-allowed; box-shadow: none; }

        .spinner {
          width: 15px; height: 15px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff; border-radius: 50%;
          animation: spin .7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .footer {
          margin-top: 20px; padding-top: 18px;
          border-top: 1px solid #f0f3f7; text-align: center;
        }
        .footer a {
          font-size: 12px; font-weight: 600; color: #094780;
          text-decoration: none;
          display: inline-flex; align-items: center; gap: 6px;
          transition: color .15s;
        }
        .footer a:hover { color: #E67A0E; }

        .success-card {
          border-radius: 16px;
          border: 1.5px solid #bbf7d0;
          background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
          padding: 24px 22px;
          margin-bottom: 22px;
          animation: fadeUp .4s ease forwards;
          position: relative;
          overflow: hidden;
        }
        .success-card::before {
          content: '';
          position: absolute;
          top: -30px; right: -30px;
          width: 100px; height: 100px;
          border-radius: 50%;
          background: rgba(34,197,94,0.08);
          pointer-events: none;
        }
        .success-card-header {
          display: flex; align-items: center; gap: 10px; margin-bottom: 14px;
        }
        .success-icon-wrap {
          width: 36px; height: 36px; border-radius: 10px;
          background: #22c55e; display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; box-shadow: 0 3px 10px rgba(34,197,94,0.3);
        }
        .success-card-title {
          font-size: 14px; font-weight: 700; color: #15803d; line-height: 1.2;
        }
        .success-card-sub {
          font-size: 11.5px; color: #4ade80; font-weight: 500; margin-top: 1px;
        }
        .success-card-body {
          font-size: 12.5px; color: #166534; line-height: 1.65;
          margin-bottom: 16px;
        }

        .steps { display: flex; flex-direction: column; gap: 8px; }
        .step {
          display: flex; align-items: flex-start; gap: 10px;
          background: rgba(255,255,255,0.7); border: 1px solid #bbf7d0;
          border-radius: 10px; padding: 10px 12px;
        }
        .step-num {
          width: 20px; height: 20px; border-radius: 6px;
          background: #16a34a; color: #fff;
          font-size: 10px; font-weight: 800;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; margin-top: 0.5px;
        }
        .step-text { font-size: 12px; color: #15803d; line-height: 1.5; }
        .step-text strong { font-weight: 700; }

        .pending-note {
          display: flex; align-items: center; gap: 8px;
          margin-top: 14px;
          background: rgba(251,191,36,0.12); border: 1px solid #fde68a;
          border-radius: 9px; padding: 9px 12px;
        }
        .pending-note-text { font-size: 11.5px; color: #92400e; line-height: 1.45; font-weight: 500; }

        .btn-login {
          width: 100%; height: 44px; margin-top: 18px;
          border-radius: 12px; border: 2px solid #094780;
          background: transparent; color: #094780;
          font-family: 'DM Sans', sans-serif;
          font-size: 13.5px; font-weight: 700;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          transition: background .18s, color .18s, transform .12s;
        }
        .btn-login:hover {
          background: #094780; color: #fff; transform: translateY(-1px);
        }
      `}</style>

      <div className="page">
        <div className="card">

          <div className="brand">
            <div className="logo">SIGS<span className="logo-dot" /></div>
            <p className="brand-sub">Solicite seu acesso ao sistema</p>
          </div>

          <div className="sep" />

          {globalError && errStyle && (
            <div
              className="error-banner"
              style={{
                backgroundColor: errStyle.bg,
                borderColor: errStyle.border,
                borderLeftColor: errStyle.left,
              }}
            >
              <ErrIcon size={15} style={{ color: errStyle.left, flexShrink: 0, marginTop: 1 }} />
              <p className="error-text" style={{ color: errStyle.text }}>{globalError.message}</p>
            </div>
          )}

          {success ? (
            <>
              <div className="success-card">
                <div className="success-card-header">
                  <div className="success-icon-wrap">
                    <CheckCircle2 size={19} color="#fff" strokeWidth={2.5} />
                  </div>
                  <div>
                    <div className="success-card-title">Solicitação enviada!</div>
                    <div className="success-card-sub">Cadastro registrado com sucesso</div>
                  </div>
                </div>

                <p className="success-card-body">
                  Seus dados foram recebidos. Seu acesso está <strong>pendente de aprovação</strong> por um administrador do sistema.
                </p>
              </div>

              <button className="btn-login" onClick={() => router.push('/login')}>
                <ArrowLeft size={15} /> Ir para o Login
              </button>
            </>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="fields">

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
                    {errors.nome && <p className="field-error"><AlertCircle size={11} />{errors.nome.message}</p>}
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
                    {errors.sobrenome && <p className="field-error"><AlertCircle size={11} />{errors.sobrenome.message}</p>}
                  </div>
                </div>

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
                  {errors.email && <p className="field-error"><AlertCircle size={11} />{errors.email.message}</p>}
                </div>

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
                    {errors.uf && <p className="field-error"><AlertCircle size={11} />{errors.uf.message}</p>}
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
                    {errors.regional && <p className="field-error"><AlertCircle size={11} />{errors.regional.message}</p>}
                  </div>
                </div>

                <div className="field">
                  <label className="field-label">Perfil de Acesso</label>
                  <div className="field-wrap">
                    <select
                      {...register('role')}
                      className={`field-select${errors.role ? ' has-error' : ''}`}
                    >
                      <option value="">Selecione o Perfil</option>
                      <option value="inspetor">Inspetor</option>
                      <option value="agente_cobli">Agente Cobli</option>
                      <option value="admin">Administrador</option>
                    </select>
                    <span className="field-icon"><Briefcase size={14} /></span>
                  </div>
                  {errors.role && <p className="field-error"><AlertCircle size={11} />{errors.role.message}</p>}
                </div>

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
                      <span className="field-icon clickable" onClick={() => setShowSenha(p => !p)}>
                        {showSenha ? <EyeOff size={14} /> : <Eye size={14} />}
                      </span>
                    </div>
                    {errors.senha && <p className="field-error"><AlertCircle size={11} />{errors.senha.message}</p>}
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
                      <span className="field-icon clickable" onClick={() => setShowConfirmar(p => !p)}>
                        {showConfirmar ? <EyeOff size={14} /> : <Eye size={14} />}
                      </span>
                    </div>
                    {errors.confirmarSenha && <p className="field-error"><AlertCircle size={11} />{errors.confirmarSenha.message}</p>}
                  </div>
                </div>

              </div>

              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: 9,
                background: 'rgba(9,71,128,0.05)', border: '1px solid rgba(9,71,128,0.12)',
                borderRadius: 10, padding: '10px 13px', marginTop: 18,
              }}>
                <Info size={14} color="#094780" style={{ flexShrink: 0, marginTop: 1 }} />
                <p style={{ fontSize: 11.5, color: '#094780', lineHeight: 1.55, fontWeight: 500 }}>
                  Ao solicitar acesso, seu cadastro ficará <strong>pendente de aprovação</strong>. Um administrador deverá ativar sua conta antes do primeiro login.
                </p>
              </div>

              <button type="submit" disabled={isSubmitting} className="btn">
                {isSubmitting
                  ? <><span className="spinner" /> Enviando solicitação...</>
                  : 'Solicitar Acesso'
                }
              </button>
            </form>
          )}

          {!success && (
            <div className="footer">
              <Link href="/login">
                <ArrowLeft size={13} /> Já tenho conta
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  )
}