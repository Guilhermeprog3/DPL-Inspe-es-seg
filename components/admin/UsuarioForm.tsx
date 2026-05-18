'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import {
  User, Mail, ChevronDown, Briefcase, ArrowLeft,
  AlertCircle, Eye, EyeOff, CheckCircle, Loader2, Hash, Check
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { REGIONAIS_POR_UF, type UF } from '@/types'
import api from '@/lib/api'

export function UsuarioForm({ isEdit = false }: { isEdit?: boolean }) {
  const router = useRouter()
  const params = useParams()
  const { data: session } = useSession()
  const userId = params?.id as string | undefined

  const [loadingData, setLoadingData] = useState(isEdit)
  const [isSaving, setIsSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [globalError, setGlobalError] = useState('')
  const [showSenha, setShowSenha] = useState(false)

  const [nomeCompleto, setNomeCompleto] = useState('')
  const [email,        setEmail       ] = useState('')
  const [chapa,        setChapa       ] = useState('')   
  const [uf,           setUf          ] = useState<UF | ''>('')
  const [regionais,    setRegionais   ] = useState<string[]>([])
  const [role,         setRole        ] = useState('')
  const [ativo,        setAtivo       ] = useState(false)
  const [senha,        setSenha       ] = useState('')
  const [errors,       setErrors ] = useState<Record<string, string>>({})

  const isFormValid = 
    nomeCompleto.trim() !== '' &&
    email.trim() !== '' &&
    uf !== '' &&
    regionais.length > 0 &&
    role !== '' &&
    (isEdit || senha.trim() !== '')

  useEffect(() => {
    if (!isEdit || !userId || !session) return
    async function load() {
      try {
        const r = await api.get(`/users/${userId}`)
        const d = r.data
        setNomeCompleto(d.nomeCompleto ?? '')
        setEmail(d.email ?? '')
        setChapa(d.chapa ?? '')
        setUf(d.uf ?? '')
        const regData = d.regional ? (Array.isArray(d.regional) ? d.regional : d.regional.split(',')) : []
        setRegionais(regData)
        setRole(d.role ?? '')
        setAtivo(d.ativo ?? false)
      } catch (err) {
        setGlobalError('Erro ao carregar dados do usuário.')
      } finally {
        setLoadingData(false)
      }
    }
    load()
  }, [isEdit, userId, session])

  function toggleRegional(reg: string) {
    setRegionais(prev => prev.includes(reg) ? prev.filter(r => r !== reg) : [...prev, reg])
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!nomeCompleto.trim()) e.nomeCompleto = 'Nome completo é obrigatório'
    if (!email.trim()) e.email = 'E-mail é obrigatório'
    if (!uf) e.uf = 'Estado é obrigatório'
    if (regionais.length === 0) e.regional = 'Selecione ao menos uma regional'
    if (!role) e.role = 'Perfil é obrigatório'
    if (!isEdit && !senha) e.senha = 'Senha é obrigatória'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate() || !isFormValid) return
    setIsSaving(true)
    setGlobalError('')
    

    setErrors({})

    const payload: any = { 
      nomeCompleto: nomeCompleto.trim(),
      email: email.toLowerCase().trim(),
      chapa: chapa || null, 
      uf, 
      regional: regionais, 
      role,
      ativo
    }
    
    if (!isEdit && senha) payload.password = senha

    try {
      if (isEdit) {
        await api.patch(`/users/${userId}/admin`, payload)
      } else {
        await api.post('/users', payload)
      }
      setSuccess(true)
      setTimeout(() => router.push('/admin/usuarios/lista'), 1500)
    } catch (err: any) {
      const responseData = err.response?.data
      const msg = responseData?.message


      if (Array.isArray(msg)) {
        const fieldErrors: Record<string, string> = {}
        const genericMessages: string[] = []

        msg.forEach((item: any) => {
          if (item && typeof item === 'object' && item.property && item.constraints) {
            const mensagensValidacao = Object.values(item.constraints).join(' | ')
            fieldErrors[item.property] = mensagensValidacao
          } else {
            genericMessages.push(String(item))
          }
        });

        if (Object.keys(fieldErrors).length > 0) {
          setErrors(fieldErrors)
        }
        
        if (genericMessages.length > 0) {
          setGlobalError(genericMessages.join(' | '))
        } else {
          setGlobalError('Verifique os campos destacados abaixo.')
        }

      } else if (typeof msg === 'string') {
        setGlobalError(msg)
      } else {
        setGlobalError('Erro ao salvar usuário. Tente novamente.')
      }
    } finally {
      setIsSaving(false)
    }
  }

  const inputCls = (field: string) => cn(
    'w-full h-11 px-3 rounded-xl border text-[13.5px] outline-none transition-all bg-[#f8fafc]',
    errors[field] ? 'border-red-300 bg-red-50/30 focus:border-red-400' : 'border-[#e3e8ef] focus:border-[#094780] focus:bg-white'
  )

  if (loadingData) return <div className="flex items-center justify-center h-[50vh] gap-3 text-[#9ca3af]"><Loader2 size={20} className="animate-spin" /><span>Carregando...</span></div>

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pb-24 text-slate-800">
      {globalError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex gap-3">
          <AlertCircle size={15} className="text-red-500 mt-0.5" />
          <p className="text-[13px] text-red-600">{globalError}</p>
        </div>
      )}
      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex gap-3">
          <CheckCircle size={15} className="text-emerald-500 mt-0.5" />
          <p className="text-[13px] text-emerald-600">Sucesso! Redirecionando...</p>
        </div>
      )}

      <div className="bg-white border border-[#e3e8ef] rounded-xl overflow-hidden shadow-sm">
        <div className="text-[11px] font-bold uppercase tracking-widest text-[#9ca3af] px-6 py-3 bg-[#f8fafc] border-b border-[#e3e8ef]">Dados Pessoais</div>
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="text-[11px] font-bold text-[#6b7a8d] uppercase mb-1.5 block">Nome Completo *</label>
            <input value={nomeCompleto} onChange={e => setNomeCompleto(e.target.value)} className={inputCls('nomeCompleto')} />
            {errors.nomeCompleto && <p className="text-[10px] text-red-500 mt-1">{errors.nomeCompleto}</p>}
          </div>
          <div>
            <label className="text-[11px] font-bold text-[#6b7a8d] uppercase mb-1.5 block">Matrícula</label>
            <input value={chapa} onChange={e => setChapa(e.target.value.replace(/\D/g, ""))} className={inputCls('chapa')} />
          </div>
          <div className="sm:col-span-2">
            <label className="text-[11px] font-bold text-[#6b7a8d] uppercase mb-1.5 block">E-mail *</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className={inputCls('email')} />
            {errors.email && <p className="text-[10px] text-red-500 mt-1">{errors.email}</p>}
          </div>

          {!isEdit && (
            <div className="sm:col-span-2">
              <label className="text-[11px] font-bold text-[#6b7a8d] uppercase mb-1.5 block">Senha de Acesso *</label>
              <div className="relative">
                <input 
                  type={showSenha ? 'text' : 'password'} 
                  value={senha} 
                  onChange={e => setSenha(e.target.value)} 
                  className={inputCls('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowSenha(!showSenha)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showSenha ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-[10px] text-red-500 mt-1 leading-relaxed">{errors.password}</p>}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white border border-[#e3e8ef] rounded-xl overflow-hidden shadow-sm">
        <div className="text-[11px] font-bold uppercase tracking-widest text-[#9ca3af] px-6 py-3 bg-[#f8fafc] border-b border-[#e3e8ef]">Localização</div>
        <div className="p-6 space-y-6">
          <div className="max-w-xs">
            <label className="text-[11px] font-bold text-[#6b7a8d] uppercase mb-1.5 block">Estado *</label>
            <select value={uf} onChange={e => { setUf(e.target.value as UF); setRegionais([]) }} className={inputCls('uf')}>
              <option value="">Selecione</option>
              <option value="PI">Piauí</option>
              <option value="MA">Maranhão</option>
            </select>
            {errors.uf && <p className="text-[10px] text-red-500 mt-1">{errors.uf}</p>}
          </div>
          <div>
            <label className="text-[11px] font-bold text-[#6b7a8d] uppercase mb-1.5 block">Regionais *</label>
            {!uf ? (
              <p className="text-xs text-slate-400 italic">Selecione um estado primeiro.</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {REGIONAIS_POR_UF[uf]?.map(r => (
                  <button key={r} type="button" onClick={() => toggleRegional(r)}
                    className={cn("flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all", 
                    regionais.includes(r) ? "border-[#094780] bg-[#094780]/5 text-[#094780]" : "border-slate-100 text-slate-500")}>
                    <span className="text-xs font-bold">{r}</span>
                    {regionais.includes(r) && <Check size={14} />}
                  </button>
                ))}
              </div>
            )}
            {errors.regional && <p className="text-[10px] text-red-500 mt-2">{errors.regional}</p>}
          </div>
        </div>
      </div>

      <div className="bg-white border border-[#e3e8ef] rounded-xl overflow-hidden shadow-sm">
        <div className="text-[11px] font-bold uppercase tracking-widest text-[#9ca3af] px-6 py-3 bg-[#f8fafc] border-b border-[#e3e8ef]">Acesso</div>
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="text-[11px] font-bold text-[#6b7a8d] uppercase mb-1.5 block">Perfil *</label>
            <select value={role} onChange={e => setRole(e.target.value)} className={inputCls('role')}>
              <option value="">Selecione</option>
              <option value="inspetor">Inspetor</option>
              <option value="supervisor">Supervisor</option>
              <option value="coordenador">Coordenador</option>
              <option value="gerente">Gerente</option>
              <option value="agente_cobli">Agente Cobli</option>
              <option value="sesmt">SESMT</option>
              <option value="admin">Administrador</option>
            </select>
            {errors.role && <p className="text-[10px] text-red-500 mt-1">{errors.role}</p>}
          </div>
          <div>
            <label className="text-[11px] font-bold text-[#6b7a8d] uppercase mb-1.5 block">Status</label>
            <div className="flex gap-2">
              <button type="button" onClick={() => setAtivo(true)} className={cn('flex-1 h-11 rounded-xl border-2 font-bold text-[12px]', ativo ? 'bg-emerald-500 text-white' : 'bg-white text-slate-400')}>Ativo</button>
              <button type="button" onClick={() => setAtivo(false)} className={cn('flex-1 h-11 rounded-xl border-2 font-bold text-[12px]', !ativo ? 'bg-amber-500 text-white' : 'bg-white text-slate-400')}>Pendente</button>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#e3e8ef] p-4 flex justify-between z-50">
        <button type="button" onClick={() => router.push('/admin/usuarios/lista')} className="text-slate-500 font-bold flex items-center gap-2 text-xs">
          <ArrowLeft size={16} /> Voltar
        </button>
        
        <button 
          type="submit" 
          disabled={!isFormValid || isSaving} 
          className={cn(
            "text-white px-8 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all",
            isFormValid && !isSaving
              ? "bg-[#094780] hover:bg-[#073661] cursor-pointer opacity-100" 
              : "bg-[#094780] opacity-40 cursor-not-allowed"
          )}
        >
          {isSaving ? <Loader2 size={14} className="animate-spin" /> : isEdit ? 'Salvar Alterações' : 'Criar Usuário'}
        </button>
      </div>
    </form>
  )
}