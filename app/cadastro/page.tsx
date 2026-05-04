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
  Mail, ChevronDown, Briefcase, ArrowLeft,
  AlertCircle, Eye, EyeOff, CheckCircle2, Info,
  WifiOff, UserX, Hash, User
} from 'lucide-react'

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Syne:wght@800&display=swap');
  .page { min-height: 100vh; background: #eef1f6; display: flex; align-items: center; justify-content: center; padding: 32px 20px; font-family: 'DM Sans', sans-serif; }
  .card { background: #fff; border-radius: 22px; width: 100%; max-width: 480px; padding: 40px 36px; box-shadow: 0 6px 40px rgba(0,0,0,0.08); }
  .logo { font-family: 'Syne', sans-serif; font-size: 26px; font-weight: 800; color: #094780; text-align: center; letter-spacing: 4px; margin-bottom: 20px; }
  .fields { display: flex; flex-direction: column; gap: 14px; }
  .row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .field-label { font-size: 10.5px; font-weight: 700; color: #6b7a8d; text-transform: uppercase; margin-bottom: 4px; display: block; }
  .field-wrap { position: relative; }
  .field-input, .field-select { width: 100%; height: 44px; padding: 0 38px 0 13px; border-radius: 11px; border: 1.5px solid #e2e8f0; background: #f8fafc; font-size: 13px; outline: none; transition: all .2s; }
  .field-input.with-left-icon { padding-left: 36px; }
  .field-input:focus, .field-select:focus { border-color: #094780; background: #fff; box-shadow: 0 0 0 3px rgba(9,71,128,0.08); }
  .field-input.has-error, .field-select.has-error { border-color: #ef4444; background: #fff9f9; }
  .field-icon { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); color: #b8c2cc; }
  .field-icon.left { right: auto; left: 12px; }
  .field-error { display: flex; align-items: center; gap: 4px; font-size: 11px; color: #ef4444; margin-top: 4px; font-weight: 500; }
  .btn { width: 100%; height: 48px; background: #094780; color: #fff; border: none; border-radius: 12px; font-weight: 700; cursor: pointer; margin-top: 10px; transition: opacity .2s; }
  .btn:disabled { opacity: 0.6; }
  .error-banner { display: flex; align-items: flex-start; gap: 10px; border-radius: 10px; padding: 11px 13px; margin-bottom: 18px; border: 1px solid #fecaca; background: #fef2f2; }
`

export default function CadastroPage() {
  const router = useRouter()
  const [showSenha, setShowSenha] = useState(false)
  const [showConfirmar, setShowConfirmar] = useState(false)
  const [globalError, setGlobalError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<CadastroInput>({
    resolver: zodResolver(cadastroSchema),
    mode: 'onBlur'
  })

  const ufWatched = watch('uf')

  async function onSubmit(data: CadastroInput) {
    setGlobalError(null)
    try {
      // CORREÇÃO DO ERRO 400:
      // 1. Removemos 'confirmarSenha' pois o backend não aceita campos extras (whitelist)
      // 2. Renomeamos 'senha' para 'password' para bater com o DTO do NestJS
      const { senha, confirmarSenha, ...rest } = data
      
      const payload = {
        ...rest,
        password: senha // O backend espera 'password'
      }

      await api.post('/users', payload)
      setSuccess(true)
    } catch (err: any) {
      const message = err?.response?.data?.message
      // Se a mensagem for um array (erros de validação do Nest), junta em uma string
      setGlobalError(Array.isArray(message) ? message.join(' | ') : message || 'Erro ao processar cadastro')
    }
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="page">
        <div className="card">
          <div className="logo">SIGS<span style={{color: '#E67A0E'}}>•</span></div>
          
          {globalError && (
            <div className="error-banner">
              <AlertCircle size={15} color="#ef4444" style={{ marginTop: 2 }} />
              <p style={{ fontSize: 12, color: '#b91c1c' }}>{globalError}</p>
            </div>
          )}

          {success ? (
            <div style={{textAlign: 'center'}}>
              <div style={{background: '#f0fdf4', padding: '20px', borderRadius: '12px', marginBottom: '20px'}}>
                <CheckCircle2 size={40} color="#22c55e" style={{margin: '0 auto 10px'}} />
                <h3 style={{color: '#15803d'}}>Solicitação Enviada!</h3>
                <p style={{fontSize: '13px', color: '#166534'}}>Aguarde a aprovação de um administrador.</p>
              </div>
              <button className="btn" onClick={() => router.push('/login')}>Ir para Login</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="fields">
              <div className="field">
                <label className="field-label">Matrícula</label>
                <div className="field-wrap">
                  <input {...register('chapa')} placeholder="Ex: 123456" className={`field-input with-left-icon ${errors.chapa ? 'has-error' : ''}`} />
                  <Hash className="field-icon left" size={14} />
                </div>
                {errors.chapa && <p className="field-error"><AlertCircle size={12}/>{errors.chapa.message}</p>}
              </div>

              <div className="field">
                <label className="field-label">Nome Completo</label>
                <div className="field-wrap">
                  <input {...register('nomeCompleto')} placeholder="Seu nome" className={`field-input with-left-icon ${errors.nomeCompleto ? 'has-error' : ''}`} />
                  <User className="field-icon left" size={14} />
                </div>
                {errors.nomeCompleto && <p className="field-error"><AlertCircle size={12}/>{errors.nomeCompleto.message}</p>}
              </div>

              <div className="field">
                <label className="field-label">E-mail Corporativo</label>
                <div className="field-wrap">
                  <input {...register('email')} placeholder="email@empresa.com" className={`field-input ${errors.email ? 'has-error' : ''}`} />
                  <Mail className="field-icon" size={14} />
                </div>
                {errors.email && <p className="field-error"><AlertCircle size={12}/>{errors.email.message}</p>}
              </div>

              <div className="row">
                <div className="field">
                  <label className="field-label">Estado</label>
                  <div className="field-wrap">
                    <select {...register('uf')} className={`field-select ${errors.uf ? 'has-error' : ''}`} onChange={(e) => { setValue('uf', e.target.value as UF); setValue('regional', '') }}>
                      <option value="">UF</option>
                      <option value="PI">PI</option>
                      <option value="MA">MA</option>
                    </select>
                  </div>
                  {errors.uf && <p className="field-error"><AlertCircle size={12}/>{errors.uf.message}</p>}
                </div>
                <div className="field">
                  <label className="field-label">Regional</label>
                  <div className="field-wrap">
                    <select {...register('regional')} disabled={!ufWatched} className={`field-select ${errors.regional ? 'has-error' : ''}`}>
                      <option value="">Selecione</option>
                      {ufWatched && REGIONAIS_POR_UF[ufWatched as UF]?.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                  {errors.regional && <p className="field-error"><AlertCircle size={12}/>{errors.regional.message}</p>}
                </div>
              </div>

              <div className="field">
                <label className="field-label">Perfil de Acesso</label>
                <div className="field-wrap">
                  <select {...register('role')} className={`field-select ${errors.role ? 'has-error' : ''}`}>
                    <option value="">Selecione o Perfil</option>
                    <option value="inspetor">Inspetor</option>
                    <option value="supervisor">Supervisor</option>
                    <option value="coordenador">Coordenador</option>
                    <option value="gerente">Gerente</option>
                    <option value="agente_cobli">Agente Cobli</option>
                    <option value="admin">Administrador</option>
                  </select>
                  <Briefcase className="field-icon" size={14} />
                </div>
                {errors.role && <p className="field-error"><AlertCircle size={12}/>{errors.role.message}</p>}
              </div>

              <div className="row">
                <div className="field">
                  <label className="field-label">Senha</label>
                  <div className="field-wrap">
                    <input type={showSenha ? 'text' : 'password'} {...register('senha')} className={`field-input ${errors.senha ? 'has-error' : ''}`} />
                    <span className="field-icon" style={{cursor: 'pointer'}} onClick={() => setShowSenha(!showSenha)}>
                      {showSenha ? <EyeOff size={14}/> : <Eye size={14}/>}
                    </span>
                  </div>
                  {errors.senha && <p className="field-error"><AlertCircle size={12}/>{errors.senha.message}</p>}
                </div>
                <div className="field">
                  <label className="field-label">Confirmar</label>
                  <div className="field-wrap">
                    <input type={showConfirmar ? 'text' : 'password'} {...register('confirmarSenha')} className={`field-input ${errors.confirmarSenha ? 'has-error' : ''}`} />
                    <span className="field-icon" style={{cursor: 'pointer'}} onClick={() => setShowConfirmar(!showConfirmar)}>
                      {showConfirmar ? <EyeOff size={14}/> : <Eye size={14}/>}
                    </span>
                  </div>
                  {errors.confirmarSenha && <p className="field-error"><AlertCircle size={12}/>{errors.confirmarSenha.message}</p>}
                </div>
              </div>

              <button type="submit" disabled={isSubmitting} className="btn">
                {isSubmitting ? 'Enviando...' : 'Solicitar Acesso'}
              </button>
            </form>
          )}
          
          <div style={{ textAlign: 'center', marginTop: 15 }}>
            <Link href="/login" style={{ fontSize: 12, color: '#094780', textDecoration: 'none', fontWeight: 600 }}>
              Já tenho uma conta
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}