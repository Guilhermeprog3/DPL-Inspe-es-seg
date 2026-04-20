'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import {
  User, Mail, ChevronDown, Briefcase, ArrowLeft,
  AlertCircle, Eye, EyeOff, CheckCircle, Loader2
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

  const [nome, setNome] = useState('')
  const [sobrenome, setSobrenome] = useState('')
  const [email, setEmail] = useState('')
  const [uf, setUf] = useState<UF | ''>('')
  const [regional, setRegional] = useState('')
  const [role, setRole] = useState('')
  const [ativo, setAtivo] = useState(false) 
  const [senha, setSenha] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!isEdit || !userId || !session) return
    async function load() {
      try {
        const r = await api.get(`/users/${userId}`)
        const d = r.data
        setNome(d.nome ?? '')
        setSobrenome(d.sobrenome ?? '')
        setEmail(d.email ?? '')
        setUf(d.uf ?? '')
        setRegional(d.regional ?? '')
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

  function validate() {
    const e: Record<string, string> = {}
    if (!nome.trim()) e.nome = 'Nome é obrigatório'
    if (!sobrenome.trim()) e.sobrenome = 'Sobrenome é obrigatório'
    if (!email.trim()) e.email = 'E-mail é obrigatório'
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'E-mail inválido'
    if (!uf) e.uf = 'Estado é obrigatório'
    if (!regional) e.regional = 'Regional é obrigatória'
    if (!role) e.role = 'Perfil é obrigatório'
    if (!isEdit && !senha) e.senha = 'Senha é obrigatória'
    if (!isEdit && senha && senha.length < 6) e.senha = 'Mínimo 6 caracteres'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setIsSaving(true); setGlobalError('')

    const payload: any = { nome, sobrenome, email, uf, regional, role, ativo }
    if (!isEdit && senha) payload.password = senha
    
    try {
      if (isEdit) await api.patch(`/users/${userId}`, payload)
      else await api.post('/users', payload)
      setSuccess(true)
      setTimeout(() => router.push('/admin/usuarios'), 1500)
    } catch (err: any) {
      setGlobalError(err.response?.data?.message || 'Erro ao salvar usuário.')
    } finally { setIsSaving(false) }
  }

  const inputCls = (field: string) => cn(
    'w-full h-11 px-3 rounded-xl border text-[13.5px] outline-none transition-all bg-[#f8fafc]',
    errors[field] ? 'border-red-300 bg-red-50/30 focus:border-red-400' : 'border-[#e3e8ef] focus:border-[#094780] focus:bg-white'
  )
  const labelCls = 'text-[11px] font-bold text-[#6b7a8d] uppercase tracking-wide mb-1.5 block'
  const secTitle = 'text-[11px] font-bold uppercase tracking-widest text-[#9ca3af] px-6 py-3 bg-[#f8fafc] border-b border-[#e3e8ef]'
  const fieldErr = (field: string) => errors[field] ? <p className="text-[11px] text-red-500 mt-1.5 flex items-center gap-1"><AlertCircle size={10} />{errors[field]}</p> : null

  if (loadingData) return (
    <div className="flex items-center justify-center h-[50vh] gap-3 text-[#9ca3af]">
      <Loader2 size={20} className="animate-spin" /><span>Carregando...</span>
    </div>
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pb-24">
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
        <div className={secTitle}>Dados Pessoais</div>
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className={labelCls}>Nome *</label>
            <input value={nome} onChange={e => setNome(e.target.value)} className={inputCls('nome')} />
            {fieldErr('nome')}
          </div>
          <div>
            <label className={labelCls}>Sobrenome *</label>
            <input value={sobrenome} onChange={e => setSobrenome(e.target.value)} className={inputCls('sobrenome')} />
            {fieldErr('sobrenome')}
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>E-mail *</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className={inputCls('email')} />
            {fieldErr('email')}
          </div>
        </div>
      </div>

      <div className="bg-white border border-[#e3e8ef] rounded-xl overflow-hidden shadow-sm">
        <div className={secTitle}>Localização</div>
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className={labelCls}>Estado *</label>
            <select value={uf} onChange={e => { setUf(e.target.value as UF); setRegional('') }} className={inputCls('uf')}>
              <option value="">Selecione</option>
              <option value="PI">Piauí</option>
              <option value="MA">Maranhão</option>
            </select>
            {fieldErr('uf')}
          </div>
          <div>
            <label className={labelCls}>Regional *</label>
            <select value={regional} onChange={e => setRegional(e.target.value)} disabled={!uf} className={inputCls('regional')}>
              <option value="">Selecione</option>
              {uf && REGIONAIS_POR_UF[uf]?.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            {fieldErr('regional')}
          </div>
        </div>
      </div>

      <div className="bg-white border border-[#e3e8ef] rounded-xl overflow-hidden shadow-sm">
        <div className={secTitle}>Acesso</div>
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className={labelCls}>Perfil *</label>
            <select value={role} onChange={e => setRole(e.target.value)} className={inputCls('role')}>
              <option value="">Selecione</option>
              <option value="inspetor">Inspetor</option>
              <option value="admin">Administrador</option>
            </select>
            {fieldErr('role')}
          </div>
          <div>
            <label className={labelCls}>Status</label>
            <div className="flex gap-2">
              <button type="button" onClick={() => setAtivo(true)} className={cn('flex-1 h-11 rounded-xl border-2 font-bold text-[12px]', ativo ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-slate-100 text-slate-400')}>Ativo</button>
              <button type="button" onClick={() => setAtivo(false)} className={cn('flex-1 h-11 rounded-xl border-2 font-bold text-[12px]', !ativo ? 'bg-amber-500 border-amber-500 text-white' : 'bg-white border-slate-100 text-slate-400')}>Pendente</button>
            </div>
          </div>
          {!isEdit && (
            <div className="sm:col-span-2">
              <label className={labelCls}>Senha *</label>
              <div className="relative">
                <input type={showSenha ? 'text' : 'password'} value={senha} onChange={e => setSenha(e.target.value)} className={inputCls('senha')} />
                <button type="button" onClick={() => setShowSenha(!showSenha)} className="absolute right-3 top-3 text-slate-300">
                  {showSenha ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {fieldErr('senha')}
            </div>
          )}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 flex justify-between items-center z-50">
        <button type="button" onClick={() => router.push('/admin/usuarios')} className="text-slate-500 font-bold flex items-center gap-2">
          <ArrowLeft size={16} /> Voltar
        </button>
        <button type="submit" disabled={isSaving} className="bg-[#094780] text-white px-8 py-2.5 rounded-xl font-bold">
          {isSaving ? 'Salvando...' : 'Salvar Usuário'}
        </button>
      </div>
    </form>
  )
}