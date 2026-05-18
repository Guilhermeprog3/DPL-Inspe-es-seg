'use client'
import { useState, useMemo, useEffect, useRef } from 'react'
import {
  Search, SlidersHorizontal, Download, LayoutDashboard,
  UserCheck, AlertCircle,
  ChevronLeft, RefreshCw, Calendar,
  ChevronDown, MoreVertical, Edit2,
  CheckCircle, ChevronRight, X, Pencil, Save, Ban, Mail, Briefcase,
  Link2, Unlink2, Tag, Loader2,
  ShieldCheck, Plus,
  BarChart2,
  CheckSquare,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useSession } from 'next-auth/react'
import api from '@/lib/api'

// ─── Nav ──────────────────────────────────────────────────────────────────────
// CORRIGIDO: Rotas atualizadas para o módulo gestao-funcionarios
const navItems = [
  { section: 'Gestão de Funcionários' },
  { label: 'Dashboard', href: '/gestao-funcionarios', icon: LayoutDashboard },
  { section: 'Módulos' },
  { label: 'Taxa de Contato', href: '/gestao-funcionarios/taxa-contato', icon: BarChart2 },
  { label: 'Meta Checklist', href: '/gestao-funcionarios/meta-checklist', icon: CheckSquare },
]

const STATUS_CFG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  'ATIVO':                          { label: 'Ativo',                         color: '#10b981', bg: '#f0fdf4', border: '#bbf7d0' },
  'FÉRIAS':                         { label: 'Férias',                        color: '#f59e0b', bg: '#fffbeb', border: '#fde68a' },
  'FERIAS':                         { label: 'Ferias',                        color: '#f59e0b', bg: '#fffbeb', border: '#fde68a' },
  'AFASTADO':                       { label: 'Afastado',                      color: '#ef4444', bg: '#fef2f2', border: '#fecaca' },
  'DESLIGADO':                      { label: 'Desligado',                     color: '#64748b', bg: '#f8fafc', border: '#e2e8f0' },
  'PENDENTE':                       { label: 'Pendente',                      color: '#ef4444', bg: '#fef2f2', border: '#fecaca' },
  'ADM':                            { label: 'ADM',                           color: '#094780', bg: '#eff6ff', border: '#dbeafe' },
  'ADMISSÃO PROX.MÊS':              { label: 'Admissão Próx. Mês',            color: '#094780', bg: '#eff6ff', border: '#dbeafe' },
  'AF.AC.TRABALHO':                 { label: 'Af. Ac. Trabalho',              color: '#ef4444', bg: '#fef2f2', border: '#fecaca' },
  'AF.PREVIDÊNCIA':                 { label: 'Af. Previdência',               color: '#ef4444', bg: '#fef2f2', border: '#fecaca' },
  'AFASTAMENTO MEDICO':             { label: 'Afastamento Médico',            color: '#ef4444', bg: '#fef2f2', border: '#fecaca' },
  'APOS. POR INCAPACIDADE PERMANENTE': { label: 'Apos. Incapacidade Perm.',    color: '#64748b', bg: '#f8fafc', border: '#e2e8f0' },
  'ATESTADO':                       { label: 'Atestado',                      color: '#f59e0b', bg: '#fffbeb', border: '#fde68a' },
  'AVISO PRÉVIO':                   { label: 'Aviso Prévio',                  color: '#64748b', bg: '#f8fafc', border: '#e2e8f0' },
  'BASE':                           { label: 'Base',                          color: '#094780', bg: '#eff6ff', border: '#dbeafe' },
  'CONTRATO DE TRABALHO SUSPENSO':  { label: 'Contrato Suspenso',             color: '#64748b', bg: '#f8fafc', border: '#e2e8f0' },
  'DEMITIDO':                       { label: 'Demitido',                      color: '#64748b', bg: '#f8fafc', border: '#e2e8f0' },
  'FISCAL':                         { label: 'Fiscal',                        color: '#094780', bg: '#eff6ff', border: '#dbeafe' },
  'INSS':                           { label: 'INSS',                          color: '#ef4444', bg: '#fef2f2', border: '#fecaca' },
  'LICENÇA S/VENC':                 { label: 'Licença s/ Venc.',              color: '#64748b', bg: '#f8fafc', border: '#e2e8f0' },
  'PRISÃO / CÁRCERE':               { label: 'Prisão / Cárcere',              color: '#1e293b', bg: '#f1f5f9', border: '#cbd5e1' },
  'PROMOVIDO':                      { label: 'Promovido',                     color: '#10b981', bg: '#f0fdf4', border: '#bbf7d0' },
  'SUPERVISOR':                     { label: 'Supervisor',                    color: '#094780', bg: '#eff6ff', border: '#dbeafe' },
  'TRANSFERIDO':                    { label: 'Transferido',                   color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
}

const STATUS_OPTIONS = [
  'ATIVO', 'FÉRIAS', 'FERIAS', 'AFASTADO', 'DESLIGADO', 'PENDENTE',
  'ADM', 'ADMISSÃO PROX.MÊS', 'AF.AC.TRABALHO', 'AF.PREVIDÊNCIA', 
  'AFASTAMENTO MEDICO', 'APOS. POR INCAPACIDADE PERMANENTE', 'ATESTADO', 
  'AVISO PRÉVIO', 'BASE', 'CONTRATO DE TRABALHO SUSPENSO', 'DEMITIDO', 
  'FISCAL', 'INSS', 'LICENÇA S/VENC', 'PRISÃO / CÁRCERE', 'PROMOVIDO', 
  'SUPERVISOR', 'TRANSFERIDO'
]

const UF_LABELS: Record<string, string> = { PI: 'Piauí', MA: 'Maranhão' }

type SortField = 'supervisor' | 'nome' | 'data'
type SortDir   = 'asc' | 'desc'

interface FuncaoItem {
  nomeFuncao: string
  taxaDeContato: boolean
}

function StatusBadge({ status }: { status: string }) {
  const key = (status || 'PENDENTE').toUpperCase()
  const cfg = STATUS_CFG[key] ?? { label: status, color: '#64748b', bg: '#f8fafc', border: '#e2e8f0' }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border"
      style={{ background: cfg.bg, color: cfg.color, borderColor: cfg.border }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.color }} />
      {cfg.label}
    </span>
  )
}

function StatusSelector({ row, onStatusChange, canEdit }: {
  row: any
  onStatusChange: (id: string, newStatus: string) => void
  canEdit: boolean
}) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 })
  const btnRef = useRef<HTMLButtonElement>(null)
  const dropRef = useRef<HTMLDivElement>(null)
  const currentKey = (row.codsituacao || 'PENDENTE').toUpperCase()
  const cfg = STATUS_CFG[currentKey] ?? { label: row.codsituacao, color: '#64748b', bg: '#f8fafc', border: '#e2e8f0' }

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (
        btnRef.current && !btnRef.current.contains(e.target as Node) &&
        dropRef.current && !dropRef.current.contains(e.target as Node)
      ) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  function handleOpen() {
    if (!btnRef.current) return
    const rect = btnRef.current.getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom
    const top = spaceBelow > 180 ? rect.bottom + 4 : rect.top - 210
    setDropdownPos({ top, left: rect.left })
    setOpen(o => !o)
  }

  async function handleSelect(status: string) {
    setOpen(false)
    if (status === currentKey) return
    setSaving(true)
    try {
      await api.patch(`/taxa-contato/${row.id}`, { codsituacao: status })
      onStatusChange(row.id, status)
    } catch (e: any) {
      alert(e.response?.data?.message || 'Erro ao atualizar situação.')
    } finally {
      setSaving(false)
    }
  }

  if (!canEdit) return <StatusBadge status={row.codsituacao} />

  return (
    <>
      <button
        ref={btnRef}
        onClick={handleOpen}
        disabled={saving}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all hover:shadow-sm hover:brightness-95 active:scale-95 cursor-pointer"
        style={{ background: cfg.bg, color: cfg.color, borderColor: cfg.border }}
      >
        {saving
          ? <Loader2 size={10} className="animate-spin" />
          : <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.color }} />
        }
        {cfg.label}
        <ChevronDown size={9} className="ml-0.5 opacity-60" />
      </button>

      {open && (
        <div
          ref={dropRef}
          className="bg-white border border-slate-200 rounded-xl shadow-xl w-48 py-1 animate-fadeIn max-h-[200px] overflow-y-auto"
          style={{ position: 'fixed', top: dropdownPos.top, left: dropdownPos.left, zIndex: 9999 }}
        >
          {STATUS_OPTIONS.map(s => {
            const c = STATUS_CFG[s]
            const isActive = s === currentKey
            return (
              <button
                key={s}
                onClick={() => handleSelect(s)}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 text-[11px] font-bold transition-colors border-b border-slate-50 last:border-0',
                  isActive ? 'bg-slate-50' : 'hover:bg-slate-50'
                )}
              >
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: c.color }} />
                <span style={{ color: c.color }} className="truncate">{c.label}</span>
                {isActive && <CheckCircle size={10} className="ml-auto text-slate-400" />}
              </button>
            )
          })}
        </div>
      )}
    </>
  )
}

function FilterSelect({ label, value, onChange, options, placeholder = 'Todos' }: any) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
      <div className="relative">
        <select value={value} onChange={e => onChange(e.target.value)} className={cn('gp-select', value && 'has-value')}>
          <option value="">{placeholder}</option>
          {options.map((o: string) => <option key={o} value={o}>{o}</option>)}
        </select>
        <ChevronDown size={13} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
      </div>
    </div>
  )
}

function ChipFilter({ label, options, value, onChange, renderLabel }: any) {
  if (options.length === 0) return null
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {options.length > 1 && (
          <button onClick={() => onChange([])} className={cn('chip', value.length === 0 && 'chip-active')}>Todos</button>
        )}
        {options.map((opt: any) => (
          <button key={opt}
            onClick={() => value.includes(opt) ? onChange(value.filter((v: any) => v !== opt)) : onChange([...value, opt])}
            className={cn('chip', (value.includes(opt) || options.length === 1) && 'chip-active')}>
            {renderLabel ? renderLabel(opt) : opt}
          </button>
        ))}
      </div>
    </div>
  )
}

// CORRIGIDO: Removida opção de excluir, apenas editar
function ActionMenu({ row, onEdit }: { row: any; onEdit: (row: any) => void }) {
  const [open, setOpen] = useState(false)
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 })
  const btnRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (
        btnRef.current && !btnRef.current.contains(e.target as Node) &&
        menuRef.current && !menuRef.current.contains(e.target as Node)
      ) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // CORRIGIDO: Calcula posição fixa para garantir que o menu fique sempre acima da tabela
  function handleOpen() {
    if (!btnRef.current) return
    const rect = btnRef.current.getBoundingClientRect()
    const menuHeight = 52 // altura aproximada com só 1 item
    const spaceBelow = window.innerHeight - rect.bottom
    const top = spaceBelow > menuHeight + 8 ? rect.bottom + 4 : rect.top - menuHeight - 4
    const left = rect.right - 160 // 160 = largura do menu
    setMenuPos({ top, left })
    setOpen(o => !o)
  }

  return (
    <>
      <button
        ref={btnRef}
        onClick={handleOpen}
        className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-all"
      >
        <MoreVertical size={15} />
      </button>

      {/* CORRIGIDO: menu em position:fixed com z-index altíssimo, fora do fluxo da tabela */}
      {open && (
        <div
          ref={menuRef}
          className="bg-white border border-slate-200 rounded-xl shadow-xl w-40 py-1 animate-fadeIn"
          style={{ position: 'fixed', top: menuPos.top, left: menuPos.left, zIndex: 99999 }}
        >
          <button
            onClick={() => { setOpen(false); onEdit(row) }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[12.5px] font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Edit2 size={14} className="text-[#094780]" /> Editar
          </button>
        </div>
      )}
    </>
  )
}

interface DynamicOptions {
  areas: string[]
  situacoes: string[]
  bases: string[]
  funcoes: string[]
  ufs: string[]
  regionais: string[]
  locais: string[]
  ufToRegionais: Record<string, Set<string>>
}

// CORRIGIDO: Adicionado campo email do colaborador no modal de edição
function EditModal({
  row,
  onClose,
  onSaved,
  dynamicOptions,
}: {
  row: any
  onClose: () => void
  onSaved: (updated: any) => void
  dynamicOptions: DynamicOptions
}) {
  const [editMode, setEditMode] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [success,  setSuccess ] = useState(false)

  const INITIAL_FORM = {
    nome:            row?.nome            ?? '',
    chapa:           row?.chapa           ?? '',
    funcao:          row?.funcao          ?? '',
    area:            row?.area            ?? '',
    base:            row?.base            ?? '',
    local:           row?.local           ?? '',
    filial:          row?.filial          ?? '',
    regional:        row?.regional        ?? '',
    codsituacao:     row?.codsituacao     ?? '',
    supervisor:      row?.supervisor      ?? '',
    chapaSupervisor: row?.chapaSupervisor ?? '',
    email:           row?.email           ?? '',
    emailColaborador: row?.emailColaborador ?? '', // NOVO: email do colaborador
  }
  const [form, setForm] = useState(INITIAL_FORM)

  function handleChange(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  const [colaboradoresRepo, setColaboradoresRepo] = useState<any[]>([])
  useEffect(() => {
    api.get('/base-gente/recentes').then(r => setColaboradoresRepo(r.data)).catch(console.error)
  }, [])

  const [colabSelecionado,  setColabSelecionado ] = useState<any>({ nome: row?.nome, chapa: row?.chapa })
  const [nomeColabPesquisa, setNomeColabPesquisa] = useState(row?.nome  ?? '')
  const [matColabPesquisa,  setMatColabPesquisa ] = useState(row?.chapa ?? '')
  const [showColabNome, setShowColabNome] = useState(false)
  const [showColabMat,  setShowColabMat ] = useState(false)

  const colabsFiltradosNome = useMemo(() => {
    const t = nomeColabPesquisa.trim().toLowerCase()
    if (t.length < 2) return []
    return colaboradoresRepo.filter(c => String(c.nome || '').toLowerCase().includes(t)).slice(0, 8)
  }, [nomeColabPesquisa, colaboradoresRepo])

  const colabsFiltradosMat = useMemo(() => {
    const t = matColabPesquisa.trim()
    if (!t) return []
    return colaboradoresRepo.filter(c => String(c.chapa || '').includes(t)).slice(0, 8)
  }, [matColabPesquisa, colaboradoresRepo])

  function selecionarColab(item: any) {
    setColabSelecionado(item)
    setNomeColabPesquisa(item.nome)
    setMatColabPesquisa(item.chapa)
    setForm(f => ({ ...f, nome: item.nome, chapa: item.chapa, emailColaborador: item.email ?? '' }))
    setShowColabNome(false)
    setShowColabMat(false)
  }

  const [supSelecionado,  setSupSelecionado ] = useState<any>(
    row?.supervisor ? { nome: row.supervisor, chapa: row.chapaSupervisor } : null
  )
  const [nomeSupPesquisa, setNomeSupPesquisa] = useState(row?.supervisor      ?? '')
  const [matSupPesquisa,  setMatSupPesquisa ] = useState(row?.chapaSupervisor ?? '')
  const [showSupNome, setShowSupNome] = useState(false)
  const [showSupMat,  setShowSupMat ] = useState(false)

  const supsFiltradosNome = useMemo(() => {
    const t = nomeSupPesquisa.trim().toLowerCase()
    if (t.length < 2) return []
    return colaboradoresRepo.filter(c => String(c.nome || '').toLowerCase().includes(t)).slice(0, 8)
  }, [nomeSupPesquisa, colaboradoresRepo])

  const supsFiltradosMat = useMemo(() => {
    const t = matSupPesquisa.trim()
    if (!t) return []
    return colaboradoresRepo.filter(c => String(c.chapa || '').includes(t)).slice(0, 8)
  }, [matSupPesquisa, colaboradoresRepo])

  function selecionarSupervisor(item: any) {
    setSupSelecionado(item)
    setNomeSupPesquisa(item.nome)
    setMatSupPesquisa(item.chapa)
    setForm(f => ({ ...f, supervisor: item.nome, chapaSupervisor: item.chapa, email: item.email ?? '' }))
    setShowSupNome(false)
    setShowSupMat(false)
  }

  async function handleSave() {
    setIsSaving(true)
    try {
      const res = await api.patch(`/taxa-contato/${row.id}`, form)
      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        onSaved(res.data ?? { ...row, ...form })
      }, 1000)
    } catch (e: any) {
      alert(e.response?.data?.message || 'Erro ao salvar.')
    } finally {
      setIsSaving(false)
    }
  }

  const selectCls   = 'w-full bg-[#f8fafc] border border-[#e3e8ef] rounded-lg h-10 px-3 text-[13px] outline-none focus:border-[#094780] focus:bg-white transition-all appearance-none cursor-pointer pr-8'
  const inputSelCls = 'w-full bg-[#f8fafc] border rounded-lg h-10 px-3 text-[13px] outline-none transition-all'
  const inputCls    = 'w-full bg-[#f8fafc] border border-[#e3e8ef] rounded-lg h-10 px-3 text-[13px] outline-none focus:border-[#094780] focus:bg-white transition-all'
  const labelCls   = 'text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block'
  const viewCls    = 'text-[13px] font-semibold text-[#1a2535] min-h-[22px] py-1'

  function ViewValue({ value }: { value: string }) {
    return value
      ? <p className={viewCls}>{value}</p>
      : <p className="text-slate-300 font-normal italic text-[12px] py-1">—</p>
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#111827]/60 backdrop-blur-md p-0 sm:p-6">
      <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl border border-[#e3e8ef] animate-slideUp flex flex-col max-h-[92vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 gap-3">
          <div className="min-w-0">
            <p className="text-[15px] font-bold text-[#1a2535] truncate">{form.nome || 'Registro'}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Chapa: {form.chapa}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {!editMode
              ? (
                <button
                  onClick={() => setEditMode(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-[12px] font-bold hover:bg-amber-100 transition-all whitespace-nowrap"
                >
                  <Pencil size={13} /> Modo de edição
                </button>
              ) : (
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-400 text-white text-[12px] font-bold whitespace-nowrap">
                  <Pencil size={13} /> Editando
                </span>
              )}
            <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-all shrink-0">
              <X size={16} />
            </button>
          </div>
        </div>
        <div className="overflow-y-auto px-6 py-5 flex-1 space-y-5">
          {/* Seção Colaborador */}
          <div>
            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mb-3">
              Colaborador {editMode && <span className="text-red-400">*</span>}
            </p>
            {editMode ? (
              <div className="grid grid-cols-2 gap-3">
                <div style={{ position: 'relative' }}>
                  <label className={labelCls}>Nome</label>
                  <input
                    type="text"
                    value={nomeColabPesquisa}
                    placeholder="Buscar nome..."
                    className={cn(inputSelCls, colabSelecionado
                      ? 'border-emerald-500 bg-emerald-50/30'
                      : 'border-[#e3e8ef] focus:border-[#094780] focus:bg-white'
                    )}
                    onChange={e => {
                      setNomeColabPesquisa(e.target.value.replace(/[0-9]/g, ''))
                      setColabSelecionado(null)
                      setForm(f => ({ ...f, nome: '', chapa: '', emailColaborador: '' }))
                      setShowColabNome(true)
                    }}
                    onFocus={() => setShowColabNome(true)}
                    onBlur={() => setTimeout(() => setShowColabNome(false), 200)}
                  />
                  {colabSelecionado && (
                    <CheckCircle size={13} className="absolute right-3 top-[38px] text-emerald-500 pointer-events-none" />
                  )}
                  {showColabNome && colabsFiltradosNome.length > 0 && (
                    <div className="absolute left-0 right-0 top-[calc(100%+2px)] z-[200] bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                      {colabsFiltradosNome.map((c, i) => (
                        <div key={i} className="p-3 hover:bg-blue-50 cursor-pointer text-xs border-b last:border-0" onMouseDown={() => selecionarColab(c)}>
                          <p className="font-bold text-slate-700 uppercase">{c.nome}</p>
                          <p className="text-slate-400">Chapa: {c.chapa}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ position: 'relative' }}>
                  <label className={labelCls}>Matrícula</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={matColabPesquisa}
                    placeholder="Buscar chapa..."
                    className={cn(inputSelCls, colabSelecionado
                      ? 'border-emerald-500 bg-emerald-50/30'
                      : 'border-[#e3e8ef] focus:border-[#094780] focus:bg-white'
                    )}
                    onChange={e => {
                      setMatColabPesquisa(e.target.value.replace(/[^0-9]/g, ''))
                      setColabSelecionado(null)
                      setForm(f => ({ ...f, nome: '', chapa: '', emailColaborador: '' }))
                      setShowColabMat(true)
                    }}
                    onFocus={() => setShowColabMat(true)}
                    onBlur={() => setTimeout(() => setShowColabMat(false), 200)}
                  />
                  {showColabMat && colabsFiltradosMat.length > 0 && (
                    <div className="absolute left-0 right-0 top-[calc(100%+2px)] z-[200] bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                      {colabsFiltradosMat.map((c, i) => (
                        <div key={i} className="p-3 hover:bg-blue-50 cursor-pointer text-xs border-b last:border-0" onMouseDown={() => selecionarColab(c)}>
                          <p className="font-bold text-slate-700">{c.chapa}</p>
                          <p className="text-slate-400 uppercase">{c.nome}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {/* NOVO: E-mail do colaborador editável */}
                <div className="col-span-2">
                  <label className={labelCls}>E-mail do colaborador</label>
                  <input
                    type="email"
                    value={form.emailColaborador}
                    placeholder="email@empresa.com"
                    className={inputCls}
                    onChange={e => handleChange('emailColaborador', e.target.value)}
                  />
                </div>
                {!colabSelecionado && (nomeColabPesquisa || matColabPesquisa) && (
                  <p className="col-span-2 mt-0.5 text-[11px] text-amber-600 font-medium flex items-center gap-1">
                    <AlertCircle size={11} /> Selecione um colaborador da lista
                  </p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Nome</label>
                  <ViewValue value={form.nome} />
                </div>
                <div>
                  <label className={labelCls}>Matrícula</label>
                  <ViewValue value={form.chapa} />
                </div>
                {/* NOVO: E-mail do colaborador visível */}
                <div className="col-span-2">
                  <label className={labelCls}>E-mail do colaborador</label>
                  <ViewValue value={form.emailColaborador} />
                </div>
              </div>
            )}
          </div>
          <div className="border-t border-slate-50" />

          {/* Seção Supervisor */}
          <div>
            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mb-3">Supervisor (opcional)</p>
            {editMode ? (
              <div className="grid grid-cols-2 gap-3">
                <div style={{ position: 'relative' }}>
                  <label className={labelCls}>Nome</label>
                  <input
                    type="text"
                    value={nomeSupPesquisa}
                    placeholder="Buscar supervisor..."
                    className={cn(inputSelCls, supSelecionado
                      ? 'border-emerald-500 bg-emerald-50/30'
                      : 'border-[#e3e8ef] focus:border-[#094780] focus:bg-white'
                    )}
                    onChange={e => {
                      setNomeSupPesquisa(e.target.value.replace(/[0-9]/g, ''))
                      setSupSelecionado(null)
                      setForm(f => ({ ...f, supervisor: e.target.value, chapaSupervisor: '', email: '' }))
                      setShowSupNome(true)
                    }}
                    onFocus={() => setShowSupNome(true)}
                    onBlur={() => setTimeout(() => setShowSupNome(false), 200)}
                  />
                  {supSelecionado && (
                    <CheckCircle size={13} className="absolute right-3 top-[38px] text-emerald-500 pointer-events-none" />
                  )}
                  {showSupNome && supsFiltradosNome.length > 0 && (
                    <div className="absolute left-0 right-0 top-[calc(100%+2px)] z-[200] bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                      {supsFiltradosNome.map((c, i) => (
                        <div key={i} className="p-3 hover:bg-blue-50 cursor-pointer text-xs border-b last:border-0" onMouseDown={() => selecionarSupervisor(c)}>
                          <p className="font-bold text-slate-700 uppercase">{c.nome}</p>
                          <p className="text-slate-400">Chapa: {c.chapa}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ position: 'relative' }}>
                  <label className={labelCls}>Matrícula</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={matSupPesquisa}
                    placeholder="Buscar chapa..."
                    className={cn(inputSelCls, supSelecionado
                      ? 'border-emerald-500 bg-emerald-50/30'
                      : 'border-[#e3e8ef] focus:border-[#094780] focus:bg-white'
                    )}
                    onChange={e => {
                      setMatSupPesquisa(e.target.value.replace(/[^0-9]/g, ''))
                      setSupSelecionado(null)
                      setForm(f => ({ ...f, supervisor: '', chapaSupervisor: '', email: '' }))
                      setShowSupMat(true)
                    }}
                    onFocus={() => setShowSupMat(true)}
                    onBlur={() => setTimeout(() => setShowSupMat(false), 200)}
                  />
                  {showSupMat && supsFiltradosMat.length > 0 && (
                    <div className="absolute left-0 right-0 top-[calc(100%+2px)] z-[200] bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                      {supsFiltradosMat.map((c, i) => (
                        <div key={i} className="p-3 hover:bg-blue-50 cursor-pointer text-xs border-b last:border-0" onMouseDown={() => selecionarSupervisor(c)}>
                          <p className="font-bold text-slate-700">{c.chapa}</p>
                          <p className="text-slate-400 uppercase">{c.nome}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {/* E-mail supervisor editável */}
                <div className="col-span-2">
                  <label className={labelCls}>E-mail do supervisor</label>
                  <input
                    type="email"
                    value={form.email}
                    placeholder="email@empresa.com"
                    className={inputCls}
                    onChange={e => handleChange('email', e.target.value)}
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Nome do supervisor</label>
                  <ViewValue value={form.supervisor} />
                </div>
                <div>
                  <label className={labelCls}>Matrícula do supervisor</label>
                  <ViewValue value={form.chapaSupervisor} />
                </div>
                <div className="col-span-2">
                  <label className={labelCls}>E-mail do supervisor</label>
                  <ViewValue value={form.email} />
                </div>
              </div>
            )}
          </div>
          <div className="border-t border-slate-50" />

          {/* Seção Lotação */}
          <div>
            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mb-3">Lotação</p>
            {editMode ? (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Situação</label>
                  <div className="relative">
                    <select value={form.codsituacao} onChange={e => handleChange('codsituacao', e.target.value)} className={selectCls}>
                      <option value="">Selecione...</option>
                      {dynamicOptions.situacoes.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <ChevronDown size={12} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Função</label>
                  <div className="relative">
                    <select value={form.funcao} onChange={e => handleChange('funcao', e.target.value)} className={selectCls}>
                      <option value="">Selecione...</option>
                      {dynamicOptions.funcoes.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                    <ChevronDown size={12} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Área</label>
                  <div className="relative">
                    <select value={form.area} onChange={e => handleChange('area', e.target.value)} className={selectCls}>
                      <option value="">Selecione...</option>
                      {dynamicOptions.areas.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                    <ChevronDown size={12} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Base</label>
                  <div className="relative">
                    <select value={form.base} onChange={e => handleChange('base', e.target.value)} className={selectCls}>
                      <option value="">Selecione...</option>
                      {dynamicOptions.bases.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                    <ChevronDown size={12} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Local</label>
                  <div className="relative">
                    <select value={form.local} onChange={e => handleChange('local', e.target.value)} className={selectCls}>
                      <option value="">Selecione...</option>
                      {dynamicOptions.locais.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                    <ChevronDown size={12} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Filial (UF)</label>
                  <div className="relative">
                    <select value={form.filial} onChange={e => handleChange('filial', e.target.value)} className={selectCls}>
                      <option value="">Selecione...</option>
                      {dynamicOptions.ufs.map(u => <option key={u} value={u}>{UF_LABELS[u] ?? u}</option>)}
                    </select>
                    <ChevronDown size={12} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>
                <div className="col-span-2">
                  <label className={labelCls}>Regional</label>
                  <div className="relative">
                    <select value={form.regional} onChange={e => handleChange('regional', e.target.value)} className={selectCls}>
                      <option value="">Selecione...</option>
                      {dynamicOptions.regionais.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                    <ChevronDown size={12} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Situação</label>
                  <div className="mt-1"><StatusBadge status={form.codsituacao} /></div>
                </div>
                <div>
                  <label className={labelCls}>Função</label>
                  <ViewValue value={form.funcao} />
                </div>
                <div>
                  <label className={labelCls}>Área</label>
                  <ViewValue value={form.area} />
                </div>
                <div>
                  <label className={labelCls}>Base</label>
                  <ViewValue value={form.base} />
                </div>
                <div>
                  <label className={labelCls}>Local</label>
                  <ViewValue value={form.local} />
                </div>
                <div>
                  <label className={labelCls}>Filial (UF)</label>
                  <ViewValue value={UF_LABELS[form.filial] ?? form.filial} />
                </div>
                <div className="col-span-2">
                  <label className={labelCls}>Regional</label>
                  <ViewValue value={form.regional} />
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-100 flex gap-2">
          {editMode ? (
            <>
              <button
                onClick={() => {
                  setForm(INITIAL_FORM)
                  setNomeColabPesquisa(row?.nome ?? '')
                  setMatColabPesquisa(row?.chapa ?? '')
                  setColabSelecionado({ nome: row?.nome, chapa: row?.chapa })
                  setNomeSupPesquisa(row?.supervisor ?? '')
                  setMatSupPesquisa(row?.chapaSupervisor ?? '')
                  setSupSelecionado(row?.supervisor ? { nome: row.supervisor, chapa: row.chapaSupervisor } : null)
                  setEditMode(false)
                }}
                disabled={isSaving}
                className="flex-1 py-2.5 border border-[#e3e8ef] text-[#4b5563] rounded-xl text-[13px] font-medium hover:bg-slate-50 transition-all flex items-center justify-center gap-1.5"
              >
                <Ban size={14} /> Cancelar edição
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving || success}
                className="flex-1 py-2.5 bg-[#094780] text-white rounded-xl text-[13px] font-semibold hover:bg-[#0a5494] transition-all flex items-center justify-center gap-2"
              >
                {success
                  ? <><CheckCircle size={14} /> Salvo!</>
                  : isSaving
                    ? <Loader2 size={14} className="animate-spin" />
                    : <><Save size={14} /> Salvar alterações</>}
              </button>
            </>
          ) : (
            <button onClick={onClose} className="flex-1 py-2.5 bg-[#094780] text-white rounded-xl text-[13px] font-semibold hover:bg-[#0a5494] transition-all">
              Fechar
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── GerenciarFuncoesModal ─────────────────────────────────────────────────────
function GerenciarFuncoesModal({ onClose }: { onClose: () => void }) {
  const [funcoes, setFuncoes] = useState<FuncaoItem[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [filtroAtiva, setFiltroAtiva] = useState<'todos' | 'ativas' | 'inativas'>('todos')

  const [nomeFuncao, setNomeFuncao] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const [toggling, setToggling] = useState<Set<string>>(new Set())

  async function loadFuncoes() {
    setLoading(true)
    try {
      const res = await api.get('/taxa-contato/funcoes')
      setFuncoes(res.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFuncoes()
    setTimeout(() => inputRef.current?.focus(), 150)
  }, [])

  async function handleCriar() {
    const nome = nomeFuncao.trim().toUpperCase()
    if (!nome || nome.length < 3 || isSaving) return
    setIsSaving(true)
    try {
      const res = await api.post('/taxa-contato/funcoes', { nome })
      setFuncoes(prev => [...prev, res.data].sort((a, b) => a.nomeFuncao.localeCompare(b.nomeFuncao)))
      setNomeFuncao('')
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 1500)
    } catch (e: any) {
      alert(e.response?.data?.message || 'Erro ao cadastrar função.')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleToggle(nomeFuncao: string, atual: boolean) {
    if (toggling.has(nomeFuncao)) return
    setToggling(prev => new Set(prev).add(nomeFuncao))
    try {
      const res = await api.patch(
        `/taxa-contato/funcoes/${encodeURIComponent(nomeFuncao)}/toggle`,
        { taxaDeContato: !atual },
      )
      setFuncoes(prev =>
        prev.map(f => f.nomeFuncao === nomeFuncao ? { ...f, taxaDeContato: res.data.taxaDeContato } : f)
      )
    } catch (e: any) {
      alert(e.response?.data?.message || 'Erro ao alterar função.')
    } finally {
      setToggling(prev => { const s = new Set(prev); s.delete(nomeFuncao); return s })
    }
  }

  const funcoesFiltradas = useMemo(() => {
    const t = busca.toLowerCase().trim()
    return funcoes.filter(f => {
      if (t && !f.nomeFuncao.toLowerCase().includes(t)) return false
      if (filtroAtiva === 'ativas'   && !f.taxaDeContato) return false
      if (filtroAtiva === 'inativas' &&  f.taxaDeContato) return false
      return true
    })
  }, [funcoes, busca, filtroAtiva])

  const totalAtivas   = funcoes.filter(f =>  f.taxaDeContato).length
  const totalInativas = funcoes.filter(f => !f.taxaDeContato).length

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#111827]/60 backdrop-blur-md p-0 sm:p-6">
      <div className="bg-white w-full sm:max-w-2xl rounded-t-3xl sm:rounded-2xl shadow-2xl border border-[#e3e8ef] animate-slideUp flex flex-col max-h-[92vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-50 border border-violet-200 flex items-center justify-center">
              <ShieldCheck size={18} className="text-violet-600" />
            </div>
            <div>
              <p className="text-[15px] font-bold text-[#1a2535]">Gerenciar Funções</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {funcoes.length} funções · <span className="text-emerald-600 font-bold">{totalAtivas} na taxa</span> · <span className="text-slate-400">{totalInativas} fora</span>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-all">
            <X size={16} />
          </button>
        </div>

        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Cadastrar nova função</p>
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={nomeFuncao}
              onChange={e => setNomeFuncao(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && handleCriar()}
              placeholder="Ex: ANALISTA DE CAMPO..."
              className="flex-1 bg-white border border-[#e3e8ef] rounded-lg h-10 px-3 text-[13px] font-semibold outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all tracking-wide"
            />
            <button
              onClick={handleCriar}
              disabled={nomeFuncao.trim().length < 3 || isSaving || saveSuccess}
              className={cn(
                'h-10 px-4 rounded-lg text-[13px] font-semibold transition-all flex items-center gap-2 whitespace-nowrap',
                nomeFuncao.trim().length >= 3 && !saveSuccess
                  ? 'bg-violet-600 text-white hover:bg-violet-700'
                  : saveSuccess
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              )}
            >
              {saveSuccess
                ? <><CheckCircle size={14} /> Cadastrada!</>
                : isSaving
                  ? <Loader2 size={14} className="animate-spin" />
                  : <><Plus size={14} /> Cadastrar</>
              }
            </button>
          </div>
          {nomeFuncao.trim().length > 0 && nomeFuncao.trim().length < 3 && (
            <p className="mt-1.5 text-[11px] text-amber-600 font-medium flex items-center gap-1">
              <AlertCircle size={11} /> Digite pelo menos 3 caracteres
            </p>
          )}
        </div>

        <div className="px-6 py-3 border-b border-slate-100 flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[160px]">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Filtrar funções..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
              className="w-full h-8 pl-8 pr-3 text-[12px] bg-[#f8fafc] border border-[#e3e8ef] rounded-lg outline-none focus:border-[#094780] transition-all"
            />
          </div>
          <div className="flex gap-1">
            {(['todos', 'ativas', 'inativas'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFiltroAtiva(f)}
                className={cn(
                  'px-3 h-8 rounded-lg text-[11.5px] font-bold transition-all border',
                  filtroAtiva === f
                    ? f === 'ativas'
                      ? 'bg-emerald-500 text-white border-emerald-500'
                      : f === 'inativas'
                        ? 'bg-slate-500 text-white border-slate-500'
                        : 'bg-[#094780] text-white border-[#094780]'
                    : 'bg-white text-slate-500 border-[#e3e8ef] hover:bg-slate-50'
                )}
              >
                {f === 'todos' ? 'Todas' : f === 'ativas' ? `Na taxa (${totalAtivas})` : `Fora (${totalInativas})`}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-y-auto flex-1">
          {loading ? (
            <div className="py-16 text-center text-slate-400 flex items-center justify-center gap-2">
              <Loader2 size={16} className="animate-spin" /> Carregando funções...
            </div>
          ) : funcoesFiltradas.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <Tag size={28} className="mx-auto mb-2 text-slate-200" />
              <p className="text-[13px] font-medium">Nenhuma função encontrada</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {funcoesFiltradas.map((f) => {
                const isToggling = toggling.has(f.nomeFuncao)
                return (
                  <div
                    key={f.nomeFuncao}
                    className={cn(
                      'flex items-center justify-between px-6 py-3.5 transition-colors group',
                      f.taxaDeContato ? 'hover:bg-emerald-50/40' : 'hover:bg-slate-50'
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={cn('w-2 h-2 rounded-full shrink-0 transition-colors', f.taxaDeContato ? 'bg-emerald-400' : 'bg-slate-300')} />
                      <span className="text-[13px] font-semibold text-[#1a2535] truncate">{f.nomeFuncao}</span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 ml-4">
                      <span className={cn(
                        'text-[10px] font-bold px-2 py-0.5 rounded-full border hidden sm:inline-flex items-center gap-1',
                        f.taxaDeContato ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-slate-50 text-slate-400 border-slate-200'
                      )}>
                        {f.taxaDeContato ? <><CheckCircle size={9} /> Na taxa</> : 'Fora da taxa'}
                      </span>
                      <button
                        onClick={() => handleToggle(f.nomeFuncao, f.taxaDeContato)}
                        disabled={isToggling}
                        title={f.taxaDeContato ? 'Remover da taxa de contato' : 'Incluir na taxa de contato'}
                        className={cn(
                          'relative inline-flex items-center h-6 w-11 rounded-full transition-colors focus:outline-none',
                          f.taxaDeContato ? 'bg-emerald-500' : 'bg-slate-200',
                          isToggling && 'opacity-50 cursor-wait'
                        )}
                      >
                        <span className={cn('inline-block w-4 h-4 bg-white rounded-full shadow transition-transform', f.taxaDeContato ? 'translate-x-6' : 'translate-x-1')} />
                        {isToggling && <Loader2 size={10} className="absolute right-1 top-1 text-white animate-spin" />}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-100">
          <button onClick={onClose} className="w-full py-2.5 bg-[#094780] text-white rounded-xl text-[13px] font-semibold hover:bg-[#0a5494] transition-all">
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}

function AssociarModal({ userRole, userName, userChapa, userEmail, userRegional, userUf, onClose, onSaved }: {
  userRole: string
  userName: string
  userChapa: string
  userEmail: string
  userRegional: string
  userUf: string
  onClose: () => void
  onSaved: (updated: any) => void
}) {
  const isSupervisor = userRole === 'supervisor'

  const [allData, setAllData] = useState<any[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [busca, setBusca] = useState('')
  const [selected, setSelected] = useState<any>(null)

  const [novoSupervisor, setNovoSupervisor] = useState('')
  const [novaChapaSupervisor, setNovaChapaSupervisor] = useState('')
  const [novaArea, setNovaArea] = useState('')
  const [novaBase, setNovaBase] = useState('')

  const [isSaving, setIsSaving] = useState(false)
  const [success, setSuccess] = useState(false)

  const inputCls = 'w-full bg-[#f8fafc] border border-[#e3e8ef] rounded-lg h-9 px-3 text-[13px] outline-none focus:border-[#094780] transition-all'
  const labelCls = 'text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block'

  useEffect(() => {
    api.get('/taxa-contato/todos')
      .then(res => setAllData(res.data))
      .catch(() => setAllData([]))
      .finally(() => setLoadingData(false))
  }, [])

  const filteredColabs = useMemo(() => {
    const t = busca.toLowerCase().trim()
    if (!t) return allData.slice(0, 25)
    return allData.filter(d =>
      d.nome?.toLowerCase().includes(t) || d.chapa?.includes(t) || d.funcao?.toLowerCase().includes(t)
    ).slice(0, 25)
  }, [allData, busca])

  function handleSelectColab(colab: any) {
    setSelected(colab)
    setNovaArea(colab.area ?? '')
    setNovaBase(colab.base ?? '')
  }

  async function handleSave() {
    if (!selected || isSaving) return
    setIsSaving(true)
    try {
      const payload: any = isSupervisor
        ? {
            supervisorName: userName.toUpperCase(),
            chapaSupervisor: userChapa,
            supervisorEmail: userEmail,
            regional: userRegional,
            filial: userUf,
          }
        : {
            supervisorName: novoSupervisor.toUpperCase(),
            chapaSupervisor: novaChapaSupervisor,
            supervisorEmail: '',
          }

      payload.area = novaArea.toUpperCase()
      payload.base = novaBase.toUpperCase()

      const res = await api.patch(`/taxa-contato/${selected.id}/assumir`, payload)
      setSuccess(true)
      setTimeout(() => onSaved(res.data), 1000)
    } catch (e: any) {
      alert(e.response?.data?.message || 'Erro ao associar.')
    } finally {
      setIsSaving(false)
    }
  }

  const canSave = selected && (isSupervisor || novoSupervisor.trim().length > 0)

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#111827]/60 backdrop-blur-md p-0 sm:p-6">
      <div className="bg-white w-full sm:max-w-xl rounded-t-3xl sm:rounded-2xl shadow-2xl border border-[#e3e8ef] animate-slideUp flex flex-col max-h-[92vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <Link2 size={15} />
            </div>
            <div>
              <p className="text-[15px] font-bold text-[#1a2535]">Associar Colaborador</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Vincule o colaborador à sua gestão</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-all">
            <X size={16} />
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-5 flex-1 space-y-5">
          {!selected ? (
            <div>
              <label className={labelCls}>Buscar colaborador</label>
              <div className="relative mb-2">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input className={inputCls + " pl-9"} placeholder="Nome ou matrícula..." value={busca} onChange={e => setBusca(e.target.value)} />
              </div>
              <div className="border border-slate-100 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                {filteredColabs.map(c => {
                  const jaEhDaEquipe = c.chapaSupervisor === userChapa
                  return (
                    <button
                      key={c.id}
                      onClick={() => !jaEhDaEquipe && handleSelectColab(c)}
                      disabled={jaEhDaEquipe}
                      className={cn(
                        "w-full px-4 py-3 text-left border-b last:border-0 flex items-center justify-between transition-all",
                        jaEhDaEquipe ? "bg-slate-50 cursor-not-allowed opacity-70" : "hover:bg-slate-50 cursor-pointer"
                      )}
                    >
                      <div className="flex flex-col">
                        <span className="text-[13px] font-bold uppercase">{c.nome}</span>
                        <span className="text-[10px] text-slate-400">Mat. {c.chapa} • {c.funcao}</span>
                      </div>
                      {jaEhDaEquipe ? (
                        <span className="text-[9px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                          <UserCheck size={10} /> Sua Equipe
                        </span>
                      ) : c.supervisor ? (
                        <span className="text-[9px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold">Outro Supervisor</span>
                      ) : (
                        <span className="text-[9px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold">Disponível</span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
                <p className="text-[10px] font-bold text-emerald-600 uppercase">Colaborador Selecionado</p>
                <p className="text-[13px] font-bold text-emerald-900 uppercase">{selected.nome}</p>
                <button onClick={() => setSelected(null)} className="text-[10px] text-emerald-600 underline mt-1">Trocar colaborador</button>
              </div>
              <div className="space-y-3">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Conferência de Supervisor</p>
                {isSupervisor ? (
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Supervisor</span>
                      <span className="text-[9px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">Automático</span>
                    </div>
                    <p className="text-[12px] font-bold text-slate-700">{userName}</p>
                    <div className="grid grid-cols-2 gap-4 mt-2 pt-2 border-t border-slate-200">
                      <div>
                        <span className="text-[9px] text-slate-400 block">Matrícula</span>
                        <span className="text-[11px] font-semibold text-slate-600">{userChapa}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 block">E-mail</span>
                        <span className="text-[11px] font-semibold text-slate-600 truncate block">{userEmail}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <div>
                        <span className="text-[9px] text-slate-400 block">Regional</span>
                        <span className="text-[11px] font-semibold text-slate-600">{userRegional}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 block">UF</span>
                        <span className="text-[11px] font-semibold text-slate-600">{userUf}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className={labelCls}>Nome do Supervisor</label>
                      <input className={inputCls} value={novoSupervisor} onChange={e => setNovoSupervisor(e.target.value)} />
                    </div>
                    <div>
                      <label className={labelCls}>Chapa Supervisor</label>
                      <input className={inputCls} value={novaChapaSupervisor} onChange={e => setNovaChapaSupervisor(e.target.value)} />
                    </div>
                  </div>
                )}
              </div>
              <div className="pt-2 space-y-3">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ajuste de Lotação</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Área</label>
                    <input className={inputCls} value={novaArea} onChange={e => setNovaArea(e.target.value)} />
                  </div>
                  <div>
                    <label className={labelCls}>Base</label>
                    <input className={inputCls} value={novaBase} onChange={e => setNovaBase(e.target.value)} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-100 flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-[13px] font-medium">Cancelar</button>
          <button onClick={handleSave} disabled={!canSave || isSaving}
            className={cn('flex-1 py-2.5 rounded-xl text-[13px] font-semibold text-white transition-all', canSave ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-slate-200 text-slate-400')}>
            {isSaving ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'Confirmar Associação'}
          </button>
        </div>
      </div>
    </div>
  )
}

function DesassociarModal({ userRole, userName, userChapa, onClose, onSaved }: {
  userRole: string
  userName: string
  userChapa: string
  onClose: () => void
  onSaved: (updated: any) => void
}) {
  const isGerenteOuCoordenador = userRole === 'gerente' || userRole === 'coordenador'
  const isSupervisor = userRole === 'supervisor'

  const [allData,      setAllData    ] = useState<any[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [busca,        setBusca      ] = useState('')
  const [selected,      setSelected   ] = useState<any>(null)

  const [novoSupervisor,      setNovoSupervisor     ] = useState('')
  const [novaChapaSupervisor, setNovaChapaSupervisor] = useState('')
  const [novaArea,            setNovaArea           ] = useState('')
  const [novaBase,            setNovaBase           ] = useState('')
  const [novaRegional,        setNovaRegional       ] = useState('')

  const [colaboradoresRepo,  setColaboradoresRepo ] = useState<any[]>([])
  const [novoSupSelecionado, setNovoSupSelecionado] = useState<any>(null)
  const [nomeSupPesquisa,    setNomeSupPesquisa   ] = useState('')
  const [matSupPesquisa,     setMatSupPesquisa    ] = useState('')
  const [showSupNome,        setShowSupNome       ] = useState(false)
  const [showSupMat,         setShowSupMat        ] = useState(false)

  const [isSaving, setIsSaving] = useState(false)
  const [success,  setSuccess ] = useState(false)

  const inputCls    = 'w-full bg-[#f8fafc] border border-[#e3e8ef] rounded-lg h-9 px-3 text-[13px] outline-none focus:border-[#094780] focus:bg-white transition-all'
  const inputSelCls = 'w-full bg-[#f8fafc] border rounded-lg h-9 px-3 text-[13px] outline-none transition-all'
  const labelCls    = 'text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block'

  useEffect(() => {
    api.get('/taxa-contato/todos').then(res => setAllData(res.data)).catch(() => setAllData([])).finally(() => setLoadingData(false))
    api.get('/base-gente/recentes').then(r => setColaboradoresRepo(r.data)).catch(console.error)
  }, [])

  const dataFiltrada = useMemo(() => {
    if (isSupervisor) return allData.filter(d => d.chapaSupervisor === userChapa || d.supervisor?.toUpperCase() === userName.toUpperCase())
    return allData.filter(d => !!d.supervisor)
  }, [allData, isSupervisor, userName, userChapa])

  const filteredColabs = useMemo(() => {
    const t = busca.toLowerCase().trim()
    if (!t) return dataFiltrada.slice(0, 25)
    return dataFiltrada.filter(d =>
      d.nome?.toLowerCase().includes(t) || d.chapa?.includes(t) || d.supervisor?.toLowerCase().includes(t)
    ).slice(0, 25)
  }, [dataFiltrada, busca])

  const supsFiltradosNome = useMemo(() => {
    const t = nomeSupPesquisa.trim().toLowerCase()
    if (t.length < 2) return []
    return colaboradoresRepo.filter(c => String(c.nome || '').toLowerCase().includes(t)).slice(0, 8)
  }, [nomeSupPesquisa, colaboradoresRepo])

  const supsFiltradosMat = useMemo(() => {
    const t = matSupPesquisa.trim()
    if (!t) return []
    return colaboradoresRepo.filter(c => String(c.chapa || '').includes(t)).slice(0, 8)
  }, [matSupPesquisa, colaboradoresRepo])

  function selecionarNovoSupervisor(item: any) {
    setNovoSupSelecionado(item)
    setNomeSupPesquisa(item.nome)
    setMatSupPesquisa(item.chapa)
    setNovoSupervisor(item.nome)
    setNovaChapaSupervisor(item.chapa)
    setShowSupNome(false)
    setShowSupMat(false)
  }

  function handleSelectColab(colab: any) {
    setSelected(colab)
    setNovaArea(colab.area ?? '')
    setNovaBase(colab.base ?? '')
    setNovaRegional(colab.regional ?? '')
    setNovoSupervisor('')
    setNovaChapaSupervisor('')
    setNovoSupSelecionado(null)
    setNomeSupPesquisa('')
    setMatSupPesquisa('')
  }

  async function handleSave() {
    if (!selected || isSaving) return
    setIsSaving(true)
    try {
      const payload: any = {
        supervisorName:  novoSupervisor.toUpperCase(),
        chapaSupervisor: novaChapaSupervisor,
        supervisorEmail: novoSupSelecionado?.email ?? '',
      }
      if (isGerenteOuCoordenador) {
        if (novaArea)     payload.area     = novaArea
        if (novaBase)     payload.base     = novaBase
        if (novaRegional) payload.regional = novaRegional
      }
      const res = await api.patch(`/taxa-contato/${selected.id}/assumir`, payload)
      setSuccess(true)
      setTimeout(() => onSaved(res.data ?? { ...selected, supervisor: novoSupervisor, chapaSupervisor: novaChapaSupervisor, regional: novaRegional || selected.regional }), 1000)
    } catch (e: any) {
      alert(e.response?.data?.message || 'Erro ao processar.')
    } finally {
      setIsSaving(false)
    }
  }

  const canSave = selected !== null && novoSupSelecionado !== null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#111827]/60 backdrop-blur-md p-0 sm:p-6">
      <div className="bg-white w-full sm:max-w-xl rounded-t-3xl sm:rounded-2xl shadow-2xl border border-[#e3e8ef] animate-slideUp flex flex-col max-h-[92vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center">
              <Unlink2 size={15} className="text-orange-600" />
            </div>
            <div>
              <p className="text-[15px] font-bold text-[#1a2535]">Transferir Colaborador</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {isSupervisor ? 'Transfira colaboradores da sua equipe para outro supervisor' : 'Transfira colaboradores para um novo supervisor'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-all">
            <X size={16} />
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-5 flex-1 space-y-5">
          <div>
            <label className={labelCls}>
              {isSupervisor ? 'Colaboradores da sua equipe' : 'Buscar colaborador associado — toda a base'}
            </label>
            <div className="relative mb-2">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                className="w-full bg-[#f8fafc] border border-[#e3e8ef] rounded-lg h-10 pl-9 pr-3 text-[13px] outline-none focus:border-[#094780] focus:bg-white transition-all"
                placeholder="Nome, matrícula ou supervisor atual..."
                value={busca}
                onChange={e => setBusca(e.target.value)}
                autoFocus
              />
            </div>
            <div className="border border-[#e3e8ef] rounded-xl overflow-hidden max-h-44 overflow-y-auto">
              {loadingData ? (
                <div className="py-8 text-center text-[12px] text-slate-400 flex items-center justify-center gap-2">
                  <Loader2 size={14} className="animate-spin" /> Carregando...
                </div>
              ) : filteredColabs.length === 0 ? (
                <div className="py-8 text-center text-[12px] text-slate-400 font-medium">
                  {isSupervisor ? 'Você não possui colaboradores associados' : 'Nenhum colaborador com supervisor encontrado'}
                </div>
              ) : filteredColabs.map(c => (
                <button key={c.id} onClick={() => handleSelectColab(c)}
                  className={cn('w-full flex items-center gap-3 px-4 py-3 text-left transition-all border-b border-slate-50 last:border-0', selected?.id === c.id ? 'bg-orange-50 border-l-2 border-l-orange-400' : 'hover:bg-slate-50')}>
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 text-[11px] font-bold text-slate-500">
                    {c.nome?.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12.5px] font-bold text-[#1a2535] truncate uppercase">{c.nome}</p>
                    <p className="text-[10px] text-slate-400 font-medium">
                      Mat. {c.chapa} · Sup: <span className="text-slate-600 font-semibold">{c.supervisor}</span>
                      {c.chapaSupervisor && <> · <span className="text-[#094780]">Chapa: {c.chapaSupervisor}</span></>}
                      {c.regional && <> · <span className="text-slate-500">{c.regional}</span></>}
                    </p>
                  </div>
                  {selected?.id === c.id && <CheckCircle size={14} className="text-orange-500 shrink-0" />}
                </button>
              ))}
            </div>
          </div>

          {selected && (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 flex items-center gap-3">
                <Unlink2 size={15} className="text-orange-600 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[12px] font-bold text-orange-800 truncate uppercase">{selected.nome}</p>
                  <p className="text-[10px] text-orange-600">
                    Supervisor atual: <strong>{selected.supervisor}</strong>
                    {selected.chapaSupervisor && <> · Chapa: <strong>{selected.chapaSupervisor}</strong></>}
                    {' '}· Regional: <strong>{selected.regional || '—'}</strong>
                  </p>
                </div>
              </div>

              <div>
                <label className={labelCls}>Novo supervisor <span className="text-red-400">*</span></label>
                <div className="grid grid-cols-2 gap-3">
                  <div style={{ position: 'relative' }}>
                    <label className={labelCls}>Nome</label>
                    <input type="text" value={nomeSupPesquisa} placeholder="Buscar supervisor..."
                      className={cn(inputSelCls, novoSupSelecionado ? 'border-emerald-500 bg-emerald-50/30' : 'border-[#e3e8ef] focus:border-[#094780] focus:bg-white')}
                      onChange={e => { setNomeSupPesquisa(e.target.value.replace(/[0-9]/g, '')); setNovoSupSelecionado(null); setNovoSupervisor(e.target.value); setNovaChapaSupervisor(''); setMatSupPesquisa(''); setShowSupNome(true) }}
                      onFocus={() => setShowSupNome(true)}
                      onBlur={() => setTimeout(() => setShowSupNome(false), 200)}
                    />
                    {novoSupSelecionado && <CheckCircle size={13} className="absolute right-3 top-[38px] text-emerald-500 pointer-events-none" />}
                    {showSupNome && supsFiltradosNome.length > 0 && (
                      <div className="absolute left-0 right-0 top-[calc(100%+2px)] z-[200] bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                        {supsFiltradosNome.map((c, i) => (
                          <div key={i} className="p-3 hover:bg-blue-50 cursor-pointer text-xs border-b last:border-0" onMouseDown={() => selecionarNovoSupervisor(c)}>
                            <p className="font-bold text-slate-700 uppercase">{c.nome}</p>
                            <p className="text-slate-400">Chapa: {c.chapa}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div style={{ position: 'relative' }}>
                    <label className={labelCls}>Matrícula</label>
                    <input type="text" inputMode="numeric" value={matSupPesquisa} placeholder="Buscar chapa..."
                      className={cn(inputSelCls, novoSupSelecionado ? 'border-emerald-500 bg-emerald-50/30' : 'border-[#e3e8ef] focus:border-[#094780] focus:bg-white')}
                      onChange={e => { setMatSupPesquisa(e.target.value.replace(/[^0-9]/g, '')); setNovoSupSelecionado(null); setNovoSupervisor(''); setNovaChapaSupervisor(e.target.value); setNomeSupPesquisa(''); setShowSupMat(true) }}
                      onFocus={() => setShowSupMat(true)}
                      onBlur={() => setTimeout(() => setShowSupMat(false), 200)}
                    />
                    {showSupMat && supsFiltradosMat.length > 0 && (
                      <div className="absolute left-0 right-0 top-[calc(100%+2px)] z-[200] bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                        {supsFiltradosMat.map((c, i) => (
                          <div key={i} className="p-3 hover:bg-blue-50 cursor-pointer text-xs border-b last:border-0" onMouseDown={() => selecionarNovoSupervisor(c)}>
                            <p className="font-bold text-slate-700">{c.chapa}</p>
                            <p className="text-slate-400 uppercase">{c.nome}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {!novoSupSelecionado && (nomeSupPesquisa || matSupPesquisa) && (
                    <p className="col-span-2 mt-0.5 text-[11px] text-amber-600 font-medium flex items-center gap-1">
                      <AlertCircle size={11} /> Selecione um supervisor da lista
                    </p>
                  )}
                </div>
              </div>

              {isGerenteOuCoordenador && (
                <div className="space-y-3">
                  <div>
                    <label className={labelCls}>Regional de destino</label>
                    <input className={inputCls} placeholder="Ex: METRO, NORTE, SUL..." value={novaRegional} onChange={e => setNovaRegional(e.target.value.toUpperCase())} />
                    <p className="text-[10px] text-slate-400 mt-1">Regional atual: <strong>{selected.regional || '—'}</strong></p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Nova área</label>
                      <input className={inputCls} placeholder="Ex: Comercial..." value={novaArea} onChange={e => setNovaArea(e.target.value)} />
                    </div>
                    <div>
                      <label className={labelCls}>Nova base</label>
                      <input className={inputCls} placeholder="Ex: Teresina..." value={novaBase} onChange={e => setNovaBase(e.target.value)} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-100 flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 border border-[#e3e8ef] text-[#4b5563] rounded-xl text-[13px] font-medium hover:bg-slate-50 transition-all">Cancelar</button>
          <button onClick={handleSave} disabled={!canSave || isSaving || success}
            className={cn('flex-1 py-2.5 rounded-xl text-[13px] font-semibold transition-all flex items-center justify-center gap-2',
              canSave && !success ? 'bg-[#094780] text-white hover:bg-[#0a5494]' : 'bg-slate-200 text-slate-400 cursor-not-allowed')}>
            {success ? <><CheckCircle size={14} /> Concluído!</> : isSaving ? <Loader2 size={14} className="animate-spin" /> : <><UserCheck size={14} /> Confirmar transferência</>}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function TaxaContatoPage() {
  const { data: session } = useSession()
  const userData = session?.user as any
  const isAdmin = userData?.role === 'admin'
  const isSupervisor = userData?.role === 'supervisor'
  const isGerenteOuCoordenador = userData?.role === 'gerente' || userData?.role === 'coordenador'
  const canManageAssociation = isSupervisor || isGerenteOuCoordenador
  const canEditStatus = isAdmin || isGerenteOuCoordenador || isSupervisor

  const [data,      setData   ] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [busca,            setBusca          ] = useState('')
  const [campoBusca,       setCampoBusca     ] = useState('todos')
  const [filtroArea,       setFiltroArea     ] = useState('')
  const [filtroStatus,     setFiltroStatus   ] = useState('')
  const [filtroBase,       setFiltroBase     ] = useState('')
  const [filtroFuncao,     setFiltroFuncao   ] = useState('')
  const [filtroUf,         setFiltroUf       ] = useState<string[]>([])
  const [filtroRegional,   setFiltroRegional ] = useState<string[]>([])
  const [filtroMes,        setFiltroMes      ] = useState('')
  const [mesesOptions,     setMesesOptions   ] = useState<{value: string, label: string}[]>([])

  const [sortField,   setSortField  ] = useState<SortField>('nome')
  const [sortDir,     setSortDir    ] = useState<SortDir>('asc')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize,    setPageSize   ] = useState(10)

  const [editTarget,            setEditTarget           ] = useState<any>(null)
  const [showGerenciarFuncoes,  setShowGerenciarFuncoes ] = useState(false) 
  const [showAssociar,          setShowAssociar         ] = useState(false)
  const [showDesassociar,       setShowDesassociar      ] = useState(false)

  useEffect(() => {
    async function loadCompetencias() {
      try {
        const res = await api.get('/taxa-contato/competencias')
        const opts = res.data || []
        setMesesOptions(opts)
        if (opts.length > 0) setFiltroMes(opts[0].value)
      } catch (err) {
        console.error("Erro ao carregar meses do banco:", err)
      }
    }
    loadCompetencias()
  }, [])

  useEffect(() => {
    if (filtroMes) fetchData(filtroMes)
  }, [filtroMes])

  const dynamicOptions = useMemo((): DynamicOptions => {
    const areas = new Set<string>(); const situacoes = new Set<string>()
    const bases = new Set<string>(); const funcoes = new Set<string>()
    const ufs = new Set<string>(); const regionais = new Set<string>()
    const locais = new Set<string>()
    const ufToRegionais: Record<string, Set<string>> = {}

    data.forEach(item => {
      if (item.local)       locais.add(item.local)
      if (item.area)        areas.add(item.area)
      if (item.codsituacao) situacoes.add(item.codsituacao.toUpperCase())
      if (item.base)        bases.add(item.base)
      if (item.funcao)      funcoes.add(item.funcao)
      if (item.filial)      ufs.add(item.filial)
      if (item.regional)    regionais.add(item.regional)
      if (item.filial && item.regional) {
        if (!ufToRegionais[item.filial]) ufToRegionais[item.filial] = new Set()
        ufToRegionais[item.filial].add(item.regional)
      }
    })
    return {
      locais:        Array.from(locais).sort(),
      areas:          Array.from(areas).sort(),
      situacoes:      Array.from(situacoes).sort(),
      bases:          Array.from(bases).sort(),
      funcoes:        Array.from(funcoes).sort(),
      ufs:            Array.from(ufs).sort(),
      regionais:      Array.from(regionais).sort(),
      ufToRegionais,
    }
  }, [data])

  const regionaisDisponiveis = useMemo(() => {
    let baseRegionais: string[]
    if (isAdmin) baseRegionais = dynamicOptions.regionais
    else if (['gerente', 'coordenador'].includes(userData?.role)) {
      const r = userData.regional === 'METROPOLITANA' ? 'METRO' : userData.regional
      baseRegionais = dynamicOptions.regionais.filter((x: string) => x === r)
    } else {
      baseRegionais = []
    }
    if (filtroUf.length === 0) return baseRegionais
    const regionaisDasUfsSelecionadas = new Set<string>()
    filtroUf.forEach(uf => {
      dynamicOptions.ufToRegionais[uf]?.forEach((r: string) => regionaisDasUfsSelecionadas.add(r))
    })
    return baseRegionais.filter((r: string) => regionaisDasUfsSelecionadas.has(r))
  }, [dynamicOptions, filtroUf, isAdmin, userData])

  const ufsVisiveis = useMemo(() => {
    if (isAdmin) return dynamicOptions.ufs
    return dynamicOptions.ufs.filter((uf: string) => uf === userData?.uf)
  }, [dynamicOptions.ufs, userData, isAdmin])

  useEffect(() => {
    if (filtroUf.length === 0) return
    const regionaisDasUfsSelecionadas = new Set<string>()
    filtroUf.forEach(uf => {
      dynamicOptions.ufToRegionais[uf]?.forEach((r: string) => regionaisDasUfsSelecionadas.add(r))
    })
    const novasRegionais = filtroRegional.filter(r => regionaisDasUfsSelecionadas.has(r))
    if (novasRegionais.length !== filtroRegional.length) setFiltroRegional(novasRegionais)
  }, [filtroUf])

  const filtrosAtivos = [busca, filtroArea, filtroStatus, filtroBase, filtroFuncao, filtroUf.length > 0, filtroRegional.length > 0].filter(Boolean).length

  async function fetchData(competencia?: string) {
    setLoading(true)
    try {
      const res = await api.get('/taxa-contato', { params: { competencia: competencia ?? filtroMes } })
      setData(res.data)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  async function handleExport() {
    try {
      const XLSX = await import('xlsx')
      const exportData = filtered.map((s: any) => ({
        'Nome':              s.nome               ?? '',
        'Matrícula':         s.chapa              ?? '',
        'Função':            s.funcao             ?? '',
        'Área':              s.area               ?? '',
        'Base':              s.base               ?? '',
        'Local':             s.local              ?? '',
        'Filial (UF)':       s.filial             ?? '',
        'Regional':          s.regional           ?? '',
        'Supervisor':        s.supervisor         ?? '',
        'Chapa Supervisor':  s.chapaSupervisor    ?? '',
        'E-mail Supervisor': s.email              ?? '',
        'Situação':          s.codsituacao        ?? '',
        'Data': s.data
          ? (() => {
              const raw = String(s.data).trim()
              const ano = raw.substring(0, 4)
              const dia = raw.substring(5, 7)
              const mes = raw.substring(8, 10)
              return (ano && dia && mes) ? `${dia}/${mes}/${ano}` : ''
            })()
          : '',
      }))
      const ws = XLSX.utils.json_to_sheet(exportData)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Taxa de Contato')
      XLSX.writeFile(wb, `taxa-contato-${filtroMes.replace('/', '-')}.xlsx`)
    } catch (err) {
      console.error('Erro ao exportar:', err)
    }
  }

  function handleSort(f: SortField) {
    if (f === sortField) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(f); setSortDir('asc') }
    setCurrentPage(1)
  }

  function limparTudo() {
    setBusca(''); setCampoBusca('todos'); setFiltroArea(''); setFiltroStatus('')
    setFiltroBase(''); setFiltroFuncao('')
    setFiltroUf([]); setFiltroRegional([]); setCurrentPage(1)
  }

  function handleStatusChange(id: string, newStatus: string) {
    setData(prev => prev.map(r => r.id === id ? { ...r, codsituacao: newStatus } : r))
  }

  function handleAssociacaoSaved(updated: any) {
    setData(prev => prev.map(r => r.id === updated.id ? { ...r, ...updated } : r))
    setShowAssociar(false)
    setShowDesassociar(false)
  }

  function formatarData(raw: string | null | undefined): string | null {
    if (!raw) return null
    const s = String(raw).trim()
    const ano = s.substring(0, 4)
    const dia = s.substring(5, 7)
    const mes = s.substring(8, 10)
    if (!ano || !mes || !dia) return null
    return `${dia}/${mes}/${ano}`
  }

  const filtered = useMemo(() => {
    const t = busca.toLowerCase().trim()
    return data.filter(s => {
      if (t) {
        switch (campoBusca) {
          case 'nome_colab': if (!s.nome?.toLowerCase().includes(t)) return false; break
          case 'mat_colab':  if (!s.chapa?.includes(t)) return false; break
          case 'nome_sup':   if (!s.supervisor?.toLowerCase().includes(t)) return false; break
          case 'mat_sup':    if (!s.chapaSupervisor?.includes(t)) return false; break
          default: if (
            !s.nome?.toLowerCase().includes(t) &&
            !s.chapa?.includes(t) &&
            !s.supervisor?.toLowerCase().includes(t) &&
            !s.chapaSupervisor?.includes(t)
          ) return false
        }
      }
      if (filtroArea    && s.area !== filtroArea) return false
      if (filtroStatus  && (s.codsituacao || '').toUpperCase() !== filtroStatus) return false
      if (filtroBase    && s.base !== filtroBase) return false
      if (filtroFuncao  && s.funcao !== filtroFuncao) return false
      if (filtroUf.length > 0       && !filtroUf.includes(s.filial))          return false
      if (filtroRegional.length > 0 && !filtroRegional.includes(s.regional)) return false
      return true
    }).sort((a, b) => {
      let diff: number
      if (sortField === 'data') {
        diff = (a.data ?? '').localeCompare(b.data ?? '')
      } else {
        diff = (a[sortField] || '').localeCompare(b[sortField] || '', 'pt-BR')
      }
      return sortDir === 'asc' ? diff : -diff
    })
  }, [data, busca, campoBusca, filtroArea, filtroStatus, filtroBase, filtroFuncao, filtroUf, filtroRegional, sortField, sortDir])

  const paginated   = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const totalPages  = Math.max(1, Math.ceil(filtered.length / pageSize))
  const mesLabel    = mesesOptions.find(m => m.value === filtroMes)?.label ?? filtroMes
  const userFullName = userData?.nomeCompleto || userData?.name || ''
  const userChapa    = userData?.chapa ?? ''
  const userRegional = userData?.regional ?? ''

  return (
    <DashboardLayout title="Taxa de Contato" breadcrumb="SIGS / Gestão de Funcionários / Taxa de Contato" navItems={navItems}>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Syne:wght@700;800&display=swap');
        .gp-root { font-family:'DM Sans',sans-serif; padding:16px; }
        .filter-wrap { background:#fff; border:1px solid #e3e8ef; border-radius:14px; margin-bottom:14px; overflow:hidden; }
        .filter-header { display:flex; align-items:center; justify-content:space-between; padding:10px 14px; border-bottom:1px solid #f1f5f9; }
        .filter-body { padding:14px 16px; display:flex; flex-direction:column; gap:12px; }
        .filter-row-main { display:flex; align-items:flex-end; gap:8px; flex-wrap:wrap; }
        .gp-select { width:100%; max-width:100%; height:36px; appearance:none; background:#fff; border:1.5px solid #e3e8ef; border-radius:10px; padding:0 28px 0 10px; font-size:12px; cursor:pointer; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .gp-select.has-value { border-color:#094780; color:#094780; font-weight:600; background:#f0f6ff; }
        .gp-select-date { width:100%; height:40px; appearance:none; background:#f0f6ff; border:1.5px solid #094780; border-radius:10px; padding:0 36px 0 38px; font-size:13px; font-weight:700; color:#094780; cursor:pointer; }
        .search-container { display:flex; border:1.5px solid #094780; border-radius:10px; overflow:hidden; height:36px; background:#fff; }
        .search-select { border:none; background:#f8fafc; border-right:1px solid #e3e8ef; padding:0 8px; font-size:11.5px; font-weight:700; color:#094780; outline:none; cursor:pointer; min-width:110px; }
        .search-input-field { border:none; flex:1; padding:0 10px; font-size:13px; outline:none; min-width:80px; }
        .chip { display:inline-flex; align-items:center; gap:4px; padding:4px 11px; border-radius:99px; cursor:pointer; font-size:11px; font-weight:700; border:1.5px solid #e3e8ef; background:#fff; color:#64748b; transition:all .15s; }
        .chip-active { background:#094780 !important; color:#fff !important; border-color:#094780 !important; }
        .main-card { background:#fff; border:1px solid #e2e8f0; border-radius:18px; overflow:hidden; }
        .table-scroll { overflow-x:auto; }
        .gp-table { width:100%; border-collapse:collapse; min-width:1380px; }
        .gp-table th { background:#f8fafc; padding:11px 14px; text-align:left; font-size:10px; font-weight:800; color:#8896ab; text-transform:uppercase; border-bottom:1px solid #e2e8f0; white-space:nowrap; }
        .gp-table th.sortable { cursor:pointer; user-select:none; }
        .gp-table th.sortable:hover { color:#094780; }
        .gp-row td { padding:12px 14px; border-bottom:1px solid #f1f5f9; vertical-align:middle; font-size:13px; }
        .gp-row:hover td { background:#fafbfc; }
        .pag-wrap { display:flex; align-items:center; justify-content:space-between; padding:12px 18px; border-top:1px solid #f1f5f9; }
        .pg-btn { min-width:32px; height:32px; border-radius:8px; border:1.5px solid #e3e8ef; background:#fff; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:600; }
        .pg-btn:disabled { opacity:.4; cursor:not-allowed; }
        .btn-outline { background:#fff; color:#374151; padding:8px 13px; border-radius:12px; font-weight:700; font-size:12px; border:1.5px solid #e3e8ef; cursor:pointer; display:flex; align-items:center; gap:6px; transition:all .15s; }
        .btn-outline:hover { border-color:#094780; color:#094780; }
        .btn-primary { background:#094780; color:#fff; padding:8px 14px; border-radius:12px; font-weight:700; font-size:12px; border:none; cursor:pointer; display:flex; align-items:center; gap:6px; transition:all .15s; }
        .btn-primary:hover { background:#0a5494; }
        .btn-violet { background:#7c3aed; color:#fff; padding:8px 14px; border-radius:12px; font-weight:700; font-size:12px; border:none; cursor:pointer; display:flex; align-items:center; gap:6px; transition:all .15s; }
        .btn-violet:hover { background:#6d28d9; }
        .btn-emerald { background:#059669; color:#fff; padding:8px 14px; border-radius:12px; font-weight:700; font-size:12px; border:none; cursor:pointer; display:flex; align-items:center; gap:6px; transition:all .15s; }
        .btn-emerald:hover { background:#047857; }
        .btn-orange { background:#fff; color:#ea580c; padding:8px 13px; border-radius:12px; font-weight:700; font-size:12px; border:1.5px solid #fed7aa; cursor:pointer; display:flex; align-items:center; gap:6px; transition:all .15s; }
        .btn-orange:hover { background:#fff7ed; border-color:#ea580c; }
        @keyframes fadeIn  { from{opacity:0;transform:scale(.97)} to{opacity:1;transform:scale(1)} }
        @keyframes scaleIn { from{opacity:0;transform:scale(.95)} to{opacity:1;transform:scale(1)} }
        @keyframes slideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:none} }
        .animate-fadeIn  { animation: fadeIn  .15s ease forwards }
        .animate-scaleIn { animation: scaleIn .2s cubic-bezier(.22,.68,0,1.2) forwards }
        .animate-slideUp { animation: slideUp .25s ease forwards }
      `}} />

      <div className="gp-root">
        <div className="flex justify-between items-start mb-4 flex-wrap gap-3">
          <div>
            <h2 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: '26px', color: '#0d1e33' }}>Taxa de Contato</h2>
            <p className="text-[11px] text-[#8896ab] font-bold uppercase mt-1">
              {mesLabel || 'Carregando...'} · {filtered.length} registro(s) encontrado(s)
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative flex items-center">
              <Calendar size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#094780] z-10" />
              <select
                value={filtroMes}
                onChange={e => { setFiltroMes(e.target.value); setCurrentPage(1) }}
                className="gp-select-date"
                style={{ minWidth: 180 }}
              >
                {mesesOptions.length === 0 && <option value="">Nenhuma competência...</option>}
                {mesesOptions.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
              <ChevronDown size={13} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#094780]" />
            </div>
            <button onClick={() => fetchData(filtroMes)} className="btn-outline">
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Atualizar
            </button>
            <button onClick={handleExport} className="btn-outline">
              <Download size={13} /> Exportar
            </button>
            {canManageAssociation && (
              <>
                <button onClick={() => setShowDesassociar(true)} className="btn-orange">
                  <Unlink2 size={13} /> Transferir
                </button>
                <button onClick={() => setShowAssociar(true)} className="btn-emerald">
                  <Link2 size={13} /> Associar
                </button>
              </>
            )}
            {isAdmin && (
              <button onClick={() => setShowGerenciarFuncoes(true)} className="btn-violet">
                <Tag size={14} /> Funções
              </button>
            )}
          </div>
        </div>

        <div className="filter-wrap">
          <div className="filter-header">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
              <SlidersHorizontal size={13} /> Filtros
              {filtrosAtivos > 0 && <span className="bg-[#094780] text-white px-1.5 py-0.5 rounded-full text-[10px]">{filtrosAtivos}</span>}
            </div>
            {filtrosAtivos > 0 && <button onClick={limparTudo} className="text-xs font-bold text-slate-400 hover:text-red-500">Limpar tudo</button>}
          </div>

          <div className="filter-body">
            <div className="filter-row-main" style={{ alignItems: 'flex-end', gap: 8 }}>
              <div className="flex flex-col gap-1.5" style={{ flex: '0 0 auto', width: 340 }}>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Busca</span>
                <div className="search-container">
                  <select className="search-select" value={campoBusca} onChange={e => setCampoBusca(e.target.value)}>
                    <option value="todos">Todos</option>
                    <option value="nome_colab">Nome Colab.</option>
                    <option value="mat_colab">Mat. Colab.</option>
                    <option value="nome_sup">Nome Sup.</option>
                    <option value="mat_sup">Mat. Sup.</option>
                  </select>
                  <input
                    className="search-input-field"
                    type="text"
                    placeholder="Pesquisar..."
                    value={busca}
                    onChange={e => { setBusca(e.target.value); setCurrentPage(1) }}
                  />
                  <div className="flex items-center pr-3">
                    <Search size={14} className="text-slate-400" />
                  </div>
                </div>
              </div>
              <div className="flex gap-2 flex-1" style={{ minWidth: 0 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <FilterSelect label="Situação" value={filtroStatus} onChange={(v: string) => { setFiltroStatus(v); setCurrentPage(1) }} options={dynamicOptions.situacoes} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <FilterSelect label="Área" value={filtroArea} onChange={(v: string) => { setFiltroArea(v); setCurrentPage(1) }} options={dynamicOptions.areas} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <FilterSelect label="Base" value={filtroBase} onChange={(v: string) => { setFiltroBase(v); setCurrentPage(1) }} options={dynamicOptions.bases} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <FilterSelect label="Função" value={filtroFuncao} onChange={(v: string) => { setFiltroFuncao(v); setCurrentPage(1) }} options={dynamicOptions.funcoes} />
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-x-10 gap-y-3">
              <ChipFilter
                label="Filial (UF)"
                options={ufsVisiveis}
                value={filtroUf}
                onChange={(v: any) => { setFiltroUf(v); setCurrentPage(1) }}
                renderLabel={(uf: any) => UF_LABELS[uf] ?? uf}
              />
              {regionaisDisponiveis.length > 0 && (
                <ChipFilter
                  label={filtroUf.length > 0 ? `Regional (${filtroUf.map((u: string) => UF_LABELS[u] ?? u).join(', ')})` : 'Regional'}
                  options={regionaisDisponiveis}
                  value={filtroRegional}
                  onChange={(v: any) => { setFiltroRegional(v); setCurrentPage(1) }}
                />
              )}
            </div>
          </div>
        </div>

        <div className="main-card">
          {loading ? (
            <div className="py-20 text-center animate-pulse text-slate-400 font-bold">Carregando dados de {mesLabel}...</div>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center">
              <AlertCircle size={32} className="mx-auto mb-3 text-slate-300" />
              <p className="text-[14px] font-semibold text-slate-400">Nenhum registro encontrado em {mesLabel}</p>
            </div>
          ) : (
            <>
              <div className="table-scroll">
                <table className="gp-table">
                  <thead>
                    <tr>
                      <th className="sortable" onClick={() => handleSort('nome')}>
                        Colaborador {sortField === 'nome' && (sortDir === 'asc' ? '↑' : '↓')}
                      </th>
                      <th>Função / Área</th>
                      <th>Base / Local</th>
                      <th className="sortable" onClick={() => handleSort('supervisor')}>
                        Supervisor {sortField === 'supervisor' && (sortDir === 'asc' ? '↑' : '↓')}
                      </th>
                      <th>E-mail Supervisor</th>
                      <th>Filial / Regional</th>
                      <th className="sortable" onClick={() => handleSort('data')}>
                        Data {sortField === 'data' && (sortDir === 'asc' ? '↑' : '↓')}
                      </th>
                      <th>Situação</th>
                      {/* CORRIGIDO: Coluna de ações visível somente para admin */}
                      {isAdmin && <th style={{ width: 52 }} />}
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map((s: any) => (
                      <tr key={s.id} className="gp-row">
                        <td>
                          <div className="font-bold text-[#1a2535] uppercase">{s.nome}</div>
                          <div className="text-[10px] text-slate-400 font-bold">MATRÍCULA: {s.chapa}</div>
                        </td>
                        <td>
                          <div className="flex items-center gap-1.5 text-slate-700 font-bold">
                            <Briefcase size={12} className="text-slate-400" /> {s.funcao || 'N/I'}
                          </div>
                          <div className="text-[10px] text-[#8896ab] font-bold mt-0.5 uppercase">{s.area}</div>
                        </td>
                        <td>
                          <div className="font-semibold text-slate-700">
                            {s.base || <span className="text-slate-300 italic font-normal text-xs">—</span>}
                          </div>
                          <div className="text-[10px] text-slate-400 font-medium mt-0.5">{s.local || ''}</div>
                        </td>
                        <td>
                          <div className="font-bold text-[#1a2535]">
                            {s.supervisor || <span className="text-slate-400 font-semibold italic text-[11px]">NÃO ASSUMIDO</span>}
                          </div>
                          {s.chapaSupervisor
                            ? <div className="text-[10px] text-slate-400 font-bold">MATRÍCULA: {s.chapaSupervisor}</div>
                            : null
                          }
                        </td>
                        <td>
                          {s.email
                            ? (
                              <div className="flex items-center gap-1.5 text-[12px] text-slate-600 font-medium">
                                <Mail size={11} className="text-slate-300 shrink-0" />
                                {s.email}
                              </div>
                            )
                            : <span className="text-slate-300 italic text-xs">—</span>
                          }
                        </td>
                        <td>
                          <div className="font-bold text-slate-700">{s.filial}</div>
                          <div className="text-[10px] text-slate-400 font-bold">{s.regional}</div>
                        </td>
                        <td>
                          {formatarData(s.data)
                            ? <div className="text-[12px] font-semibold text-slate-600">{formatarData(s.data)}</div>
                            : <span className="text-slate-300 italic text-xs">—</span>
                          }
                        </td>
                        <td>
                          <StatusSelector
                            row={s}
                            onStatusChange={handleStatusChange}
                            canEdit={canEditStatus}
                          />
                        </td>
                        {/* CORRIGIDO: ActionMenu sem excluir, com menu em position:fixed */}
                        {isAdmin && (
                          <td>
                            <ActionMenu row={s} onEdit={setEditTarget} />
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="pag-wrap">
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-[#8896ab]">
                    Página {currentPage} de {totalPages} · Exibindo {Math.min(currentPage * pageSize, filtered.length)} de {filtered.length}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Itens:</span>
                    {[10, 20, 30].map(n => (
                      <button
                        key={n}
                        onClick={() => { setPageSize(n); setCurrentPage(1) }}
                        className={cn(
                          'min-w-[32px] h-7 rounded-lg border text-[11px] font-bold transition-all px-2',
                          pageSize === n
                            ? 'bg-[#094780] text-white border-[#094780]'
                            : 'bg-white text-slate-500 border-[#e3e8ef] hover:border-[#094780] hover:text-[#094780]'
                        )}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button className="pg-btn" onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}><ChevronLeft size={14} /></button>
                  <button className="pg-btn" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages}><ChevronRight size={14} /></button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {isAdmin && editTarget && (
        <EditModal
          row={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={updated => { setData(prev => prev.map(r => r.id === updated.id ? updated : r)); setEditTarget(null) }}
          dynamicOptions={dynamicOptions}
        />
      )}
      {isAdmin && showGerenciarFuncoes && (
        <GerenciarFuncoesModal onClose={() => setShowGerenciarFuncoes(false)} />
      )}
      {canManageAssociation && showAssociar && (
        <AssociarModal
          userUf={userData?.uf ?? ''}
          userRole={userData?.role}
          userName={userFullName}
          userChapa={userChapa}
          userEmail={userData?.email ?? ''}
          userRegional={userRegional}
          onClose={() => setShowAssociar(false)}
          onSaved={handleAssociacaoSaved}
        />
      )}
      {canManageAssociation && showDesassociar && (
        <DesassociarModal
          userRole={userData?.role}
          userName={userFullName}
          userChapa={userChapa}
          onClose={() => setShowDesassociar(false)}
          onSaved={handleAssociacaoSaved}
        />
      )}
    </DashboardLayout>
  )
}