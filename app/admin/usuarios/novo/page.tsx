'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import {
  User, Mail, Lock, ChevronDown, Briefcase, ArrowLeft,
  AlertCircle, Eye, EyeOff, CheckCircle, Loader2,
  Users, Plus, LayoutDashboard
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { REGIONAIS_POR_UF, type UF } from '@/types'
import api from '@/lib/api'

const navItems = [
  { section: 'Administração' },
  { label: 'Dashboard',         href: '/modulos',             icon: LayoutDashboard },
  { section: 'Usuários' },
  { label: 'Lista de Usuários', href: '/admin/usuarios',      icon: Users },
  { label: 'Novo Usuário',      href: '/admin/usuarios/novo', icon: Plus },
]

function UsuarioForm({ isEdit = false }: { isEdit?: boolean }) {
  const router   = useRouter()
  const params   = useParams()
  const { data: session } = useSession()
  const userId   = params?.id as string | undefined

  const [loadingData, setLoadingData] = useState(isEdit)
  const [isSaving,    setIsSaving   ] = useState(false)
  const [success,     setSuccess    ] = useState(false)
  const [globalError, setGlobalError] = useState('')
  const [showSenha,   setShowSenha  ] = useState(false)

  const [nome,      setNome     ] = useState('')
  const [sobrenome, setSobrenome] = useState('')
  const [email,     setEmail    ] = useState('')
  const [uf,        setUf       ] = useState<UF | ''>('')
  const [regional,  setRegional ] = useState('')
  const [role,      setRole     ] = useState('')
  
  // CORREÇÃO: O estado inicial agora é booleano para bater com o Prisma
  const [ativo,     setAtivo    ] = useState(false) 
  
  const [senha,     setSenha    ] = useState('')
  const [errors,    setErrors   ] = useState<Record<string, string>>({})

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
        
        // CORREÇÃO: Mapeia o campo 'ativo' do banco para o estado do formulário
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
    if (!nome.trim())      e.nome      = 'Nome é obrigatório'
    if (!sobrenome.trim()) e.sobrenome = 'Sobrenome é obrigatório'
    if (!email.trim())     e.email     = 'E-mail é obrigatório'
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'E-mail inválido'
    if (!uf)               e.uf        = 'Estado é obrigatório'
    if (!regional)         e.regional  = 'Regional é obrigatória'
    if (!role)             e.role      = 'Perfil é obrigatório'
    if (!isEdit && !senha) e.senha     = 'Senha é obrigatória'
    if (!isEdit && senha && senha.length < 6) e.senha = 'Mínimo 6 caracteres'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setIsSaving(true); setGlobalError('')

    // CORREÇÃO: Payload agora envia 'ativo' em vez de 'status'
    const payload: any = { 
      nome, 
      sobrenome, 
      email, 
      uf, 
      regional, 
      role, 
      ativo // Envia true/false para o NestJS/Prisma
    }
    
    if (!isEdit && senha) payload.password = senha
    
    try {
      if (isEdit) await api.patch(`/users/${userId}`, payload)
      else        await api.post('/users', payload)
      setSuccess(true)
      setTimeout(() => router.push('/admin/usuarios'), 1500)
    } catch (err: any) {
      setGlobalError(err.response?.data?.message || 'Erro ao salvar usuário.')
    } finally { setIsSaving(false) }
  }

  const inputCls = (field: string) => cn(
    'w-full h-11 px-3 rounded-xl border text-[13.5px] outline-none transition-all bg-[#f8fafc]',
    errors[field]
      ? 'border-red-300 bg-red-50/30 focus:border-red-400'
      : 'border-[#e3e8ef] focus:border-[#094780] focus:bg-white'
  )
  const labelCls  = 'text-[11px] font-bold text-[#6b7a8d] uppercase tracking-wide mb-1.5 block'
  const secTitle  = 'text-[11px] font-bold uppercase tracking-widest text-[#9ca3af] px-6 py-3 bg-[#f8fafc] border-b border-[#e3e8ef]'
  const fieldErr  = (field: string) => errors[field]
    ? <p className="text-[11px] text-red-500 mt-1.5 flex items-center gap-1"><AlertCircle size={10} />{errors[field]}</p>
    : null

  if (loadingData) return (
    <div className="flex items-center justify-center h-[50vh] gap-3 text-[#9ca3af]">
      <Loader2 size={20} className="animate-spin" /><span>Carregando...</span>
    </div>
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      {globalError && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
          <AlertCircle size={15} className="text-red-500 shrink-0 mt-0.5" />
          <p className="text-[13px] text-red-600">{globalError}</p>
        </div>
      )}
      {success && (
        <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
          <CheckCircle size={15} className="text-emerald-500 shrink-0 mt-0.5" />
          <p className="text-[13px] text-emerald-600">
            Usuário {isEdit ? 'atualizado' : 'criado'} com sucesso! Redirecionando...
          </p>
        </div>
      )}

      {/* Dados Pessoais */}
      <div className="bg-white border border-[#e3e8ef] rounded-xl overflow-hidden shadow-sm">
        <div className={secTitle}>Dados Pessoais</div>
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className={labelCls}>Nome *</label>
            <div className="relative">
              <input value={nome} onChange={e => setNome(e.target.value)}
                placeholder="João" className={cn(inputCls('nome'), 'pr-10')} />
              <User size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
            </div>
            {fieldErr('nome')}
          </div>
          <div>
            <label className={labelCls}>Sobrenome *</label>
            <input value={sobrenome} onChange={e => setSobrenome(e.target.value)}
              placeholder="Silva" className={inputCls('sobrenome')} />
            {fieldErr('sobrenome')}
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>E-mail Corporativo *</label>
            <div className="relative">
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="joao@empresa.com" className={cn(inputCls('email'), 'pr-10')} />
              <Mail size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
            </div>
            {fieldErr('email')}
          </div>
        </div>
      </div>

      {/* Localização */}
      <div className="bg-white border border-[#e3e8ef] rounded-xl overflow-hidden shadow-sm">
        <div className={secTitle}>Localização</div>
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className={labelCls}>Estado *</label>
            <div className="relative">
              <select value={uf} onChange={e => { setUf(e.target.value as UF); setRegional('') }}
                className={cn(inputCls('uf'), 'appearance-none pr-10')}>
                <option value="">Selecione</option>
                <option value="PI">PI — Piauí</option>
                <option value="MA">MA — Maranhão</option>
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
            </div>
            {fieldErr('uf')}
          </div>
          <div>
            <label className={labelCls}>Regional *</label>
            <div className="relative">
              <select value={regional} onChange={e => setRegional(e.target.value)} disabled={!uf}
                className={cn(inputCls('regional'), 'appearance-none pr-10 disabled:opacity-50 disabled:cursor-not-allowed')}>
                <option value="">Selecione</option>
                {uf && REGIONAIS_POR_UF[uf]?.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
            </div>
            {fieldErr('regional')}
          </div>
        </div>
      </div>

      {/* Acesso */}
      <div className="bg-white border border-[#e3e8ef] rounded-xl overflow-hidden shadow-sm">
        <div className={secTitle}>Acesso e Permissões</div>
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className={labelCls}>Perfil *</label>
            <div className="relative">
              <select value={role} onChange={e => setRole(e.target.value)}
                className={cn(inputCls('role'), 'appearance-none pr-10')}>
                <option value="">Selecione o perfil</option>
                <option value="inspetor">Inspetor</option>
                <option value="agente_cobli">Agente Cobli</option>
                <option value="admin">Administrador</option>
              </select>
              <Briefcase size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
            </div>
            {fieldErr('role')}
          </div>

          <div>
            <label className={labelCls}>Status de Acesso</label>
            <div className="flex gap-2">
              {[
                { val: true,  label: 'Ativo',    color: '#10b981' },
                { val: false, label: 'Pendente', color: '#f59e0b' },
              ].map(opt => (
                <button 
                  key={String(opt.val)} 
                  type="button" 
                  onClick={() => setAtivo(opt.val)}
                  className={cn('flex-1 h-11 rounded-xl border-2 text-[12px] font-bold transition-all',
                    ativo === opt.val 
                      ? 'text-white border-transparent' 
                      : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
                  )}
                  style={ativo === opt.val ? { background: opt.color, borderColor: opt.color } : {}}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {!isEdit && (
            <div className="sm:col-span-2">
              <label className={labelCls}>Senha *</label>
              <div className="relative">
                <input type={showSenha ? 'text' : 'password'} value={senha}
                  onChange={e => setSenha(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className={cn(inputCls('senha'), 'pr-10')} />
                <button type="button" onClick={() => setShowSenha(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors">
                  {showSenha ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {fieldErr('senha')}
            </div>
          )}
        </div>
      </div>

      {/* Barra fixa de ações */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-[#e3e8ef] px-8 py-4 flex items-center justify-between z-50">
        <button type="button" onClick={() => router.push('/admin/usuarios')}
          className="flex items-center gap-2 text-[13px] font-bold text-slate-500 hover:text-[#094780] transition-colors">
          <ArrowLeft size={15} /> Voltar para lista
        </button>
        <button type="submit" disabled={isSaving || success}
          className={cn('px-8 py-2.5 rounded-xl text-white font-bold text-[13px] transition-all flex items-center gap-2',
            isSaving || success
              ? 'bg-slate-200 cursor-not-allowed text-slate-400'
              : 'bg-[#094780] hover:bg-[#0a5494] shadow-sm')}>
          {isSaving
            ? <><Loader2 size={14} className="animate-spin" /> Salvando...</>
            : isEdit ? 'Salvar Alterações' : 'Criar Usuário'
          }
        </button>
      </div>

      <div className="h-20" />
    </form>
  )
}

export default function NovoUsuarioPage() {
  const router = useRouter()
  return (
    <DashboardLayout title="Novo Usuário" navItems={navItems} accentColor="#094780">
      <div className="-mx-4 md:-mx-7 -mt-4 md:-mt-7 mb-6 bg-white border-b border-[#e3e8ef] px-4 md:px-7 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[13px] text-[#9ca3af]">
          <button onClick={() => router.push('/admin/usuarios')}
            className="hover:text-[#094780] transition-colors font-medium flex items-center gap-1.5">
            <ArrowLeft size={13} /> Usuários
          </button>
          <span className="text-[11px]">›</span>
          <span className="text-[#094780] font-semibold">Novo Usuário</span>
        </div>
      </div>
      <UsuarioForm isEdit={false} />
    </DashboardLayout>
  )
}