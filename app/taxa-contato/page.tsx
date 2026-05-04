'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import {
  Search, SlidersHorizontal, Download, LayoutDashboard,
  PhoneCall, UserCheck, AlertCircle,
  ChevronLeft, RefreshCw, Calendar,
  ChevronDown, MoreVertical, Edit2, Trash2, Plus, Loader2,
  CheckCircle, ChevronRight, X, Pencil, Save, Ban, Mail, Briefcase,
  Link2, Unlink2, Tag,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useSession } from 'next-auth/react'
import api from '@/lib/api'

// ─── Nav ──────────────────────────────────────────────────────────────────────
const navItems = [
  { section: 'Taxa de Contato' },
  { label: 'Dashboard', href: '/taxa-contato', icon: LayoutDashboard },
]

function gerarMeses() {
  const meses = []
  const nomeMes = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
  const hoje = new Date(2026, 3, 1)
  for (let i = 0; i < 24; i++) {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1)
    const value = `${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
    const label = `${nomeMes[d.getMonth()]}/${d.getFullYear()}`
    meses.push({ value, label })
  }
  return meses
}
const MESES_OPTIONS = gerarMeses()

function getMesPadrao(): string {
  const hoje = new Date()
  const mes = String(hoje.getMonth() + 1).padStart(2, '0')
  const ano = String(hoje.getFullYear())
  const mesAtual = `${mes}/${ano}`
  return MESES_OPTIONS.find(m => m.value === mesAtual)?.value ?? MESES_OPTIONS[0].value
}

const STATUS_CFG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  'ATIVO':     { label: 'Ativo',     color: '#10b981', bg: '#f0fdf4', border: '#bbf7d0' },
  'FÉRIAS':    { label: 'Férias',    color: '#f59e0b', bg: '#fffbeb', border: '#fde68a' },
  'AFASTADO':  { label: 'Afastado',  color: '#ef4444', bg: '#fef2f2', border: '#fecaca' },
  'DESLIGADO': { label: 'Desligado', color: '#64748b', bg: '#f8fafc', border: '#e2e8f0' },
  'PENDENTE':  { label: 'Pendente',  color: '#ef4444', bg: '#fef2f2', border: '#fecaca' },
}

const STATUS_OPTIONS = ['ATIVO', 'FÉRIAS', 'AFASTADO', 'DESLIGADO', 'PENDENTE']

const UF_LABELS: Record<string, string> = { PI: 'Piauí', MA: 'Maranhão' }

// ── Adicionado 'data' como campo ordenável ──
type SortField = 'supervisor' | 'nome' | 'data'
type SortDir   = 'asc' | 'desc'

// ─── Helpers ──────────────────────────────────────────────────────────────────
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

// ─── Inline Status Selector ───────────────────────────────────────────────────
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
    const top = spaceBelow > 180 ? rect.bottom + 4 : rect.top - 180
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
          className="bg-white border border-slate-200 rounded-xl shadow-xl w-36 py-1 animate-fadeIn"
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
                  'w-full flex items-center gap-2 px-3 py-2 text-[11.5px] font-bold transition-colors',
                  isActive ? 'bg-slate-50' : 'hover:bg-slate-50'
                )}
              >
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: c.color }} />
                <span style={{ color: c.color }}>{c.label}</span>
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

// ─── Action Menu ──────────────────────────────────────────────────────────────
function ActionMenu({ row, onEdit, onDelete }: { row: any; onEdit: (row: any) => void; onDelete: (row: any) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])
  return (
    <div ref={ref} className="relative flex justify-end">
      <button onClick={() => setOpen(o => !o)}
        className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-all">
        <MoreVertical size={15} />
      </button>
      {open && (
        <div className="absolute right-0 top-9 z-50 bg-white border border-slate-200 rounded-xl shadow-xl w-40 py-1 animate-fadeIn">
          <button onClick={() => { setOpen(false); onEdit(row) }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[12.5px] font-medium text-slate-700 hover:bg-slate-50 transition-colors">
            <Edit2 size={14} className="text-[#094780]" /> Editar
          </button>
          <div className="mx-3 my-1 border-t border-slate-100" />
          <button onClick={() => { setOpen(false); onDelete(row) }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[12.5px] font-medium text-red-500 hover:bg-red-50 transition-colors">
            <Trash2 size={14} /> Excluir
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Delete Modal ─────────────────────────────────────────────────────────────
function DeleteModal({ row, onConfirm, onCancel, isDeleting }: { row: any; onConfirm: () => void; onCancel: () => void; isDeleting: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#111827]/60 backdrop-blur-md p-6">
      <div className="bg-white rounded-2xl w-full max-w-xs p-8 text-center shadow-2xl border border-[#e3e8ef] animate-scaleIn">
        <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4"><Trash2 size={24} className="text-red-500" /></div>
        <h3 className="text-[16px] font-bold text-[#111827] mb-1">Excluir registro?</h3>
        <p className="text-[13px] font-medium text-[#4b5563] mb-1">{row?.nome}</p>
        <p className="text-[12px] text-[#9ca3af] mb-6">Esta ação não pode ser desfeita.</p>
        <div className="flex gap-2">
          <button onClick={onCancel} disabled={isDeleting}
            className="flex-1 py-2.5 border border-[#e3e8ef] text-[#4b5563] rounded-lg text-[13px] font-medium hover:bg-slate-50 transition-all">
            Cancelar
          </button>
          <button onClick={onConfirm} disabled={isDeleting}
            className="flex-1 py-2.5 bg-red-500 text-white rounded-lg text-[13px] font-semibold hover:bg-red-600 transition-all flex items-center justify-center gap-2">
            {isDeleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
            {isDeleting ? 'Excluindo...' : 'Excluir'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Edit Modal ───────────────────────────────────────────────────────────────
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
  }
  const [form, setForm] = useState(INITIAL_FORM)

  function handleChange(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  const [colaboradoresRepo, setColaboradoresRepo] = useState<any[]>([])
  useEffect(() => {
    api.get('/base-gente/recentes').then(r => setColaboradoresRepo(r.data)).catch(console.error)
  }, [])

  // ── Colaborador ───────────────────────────────────────────────────────────
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
    setForm(f => ({ ...f, nome: item.nome, chapa: item.chapa }))
    setShowColabNome(false)
    setShowColabMat(false)
  }

  // ── Supervisor ────────────────────────────────────────────────────────────
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

  const selectCls  = 'w-full bg-[#f8fafc] border border-[#e3e8ef] rounded-lg h-10 px-3 text-[13px] outline-none focus:border-[#094780] focus:bg-white transition-all appearance-none cursor-pointer pr-8'
  const inputSelCls = 'w-full bg-[#f8fafc] border rounded-lg h-10 px-3 text-[13px] outline-none transition-all'
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

        {/* ── Header ── */}
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

        {/* ── Body ── */}
        <div className="overflow-y-auto px-6 py-5 flex-1 space-y-5">

          {/* ── Identificação do colaborador ── */}
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
                      setForm(f => ({ ...f, nome: '', chapa: '' }))
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
                      setForm(f => ({ ...f, nome: '', chapa: '' }))
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
              </div>
            )}
          </div>

          <div className="border-t border-slate-50" />

          {/* ── Supervisor ── */}
          <div>
            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mb-3">Supervisor (opcional)</p>

            {editMode ? (
              <div className="grid grid-cols-2 gap-3">
                {/* Nome supervisor */}
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

                {/* Matrícula supervisor */}
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

          {/* ── Lotação ── */}
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

        {/* ── Footer ── */}
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

// ─── Nova Função Modal ────────────────────────────────────────────────────────
function NovaFuncaoModal({ onClose, onSaved }: {
  onClose: () => void
  onSaved: () => void
}) {
  const [nomeFuncao, setNomeFuncao] = useState('')
  const [isSaving,   setIsSaving  ] = useState(false)
  const [success,    setSuccess   ] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100)
  }, [])

  async function handleSave() {
    const nome = nomeFuncao.trim().toUpperCase()
    if (!nome || isSaving) return
    setIsSaving(true)
    try {
      await api.post('/taxa-contato/funcoes', { nome })
      setSuccess(true)
      setTimeout(() => { setSuccess(false); onSaved() }, 1200)
    } catch (e: any) {
      alert(e.response?.data?.message || 'Erro ao cadastrar função.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#111827]/60 backdrop-blur-md p-6">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl border border-[#e3e8ef] animate-scaleIn">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-50 border border-violet-200 flex items-center justify-center">
              <Tag size={15} className="text-violet-600" />
            </div>
            <div>
              <p className="text-[15px] font-bold text-[#1a2535]">Nova Função</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Cadastrar nova função na base</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-all">
            <X size={16} />
          </button>
        </div>
        <div className="px-6 py-5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">
            Nome da função
          </label>
          <input
            ref={inputRef}
            type="text"
            value={nomeFuncao}
            onChange={e => setNomeFuncao(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
            placeholder="Ex: ANALISTA DE CAMPO..."
            className="w-full bg-[#f8fafc] border border-[#e3e8ef] rounded-lg h-11 px-3 text-[13px] font-semibold outline-none focus:border-[#094780] focus:bg-white transition-all tracking-wide"
          />
          {nomeFuncao.trim().length > 0 && nomeFuncao.trim().length < 3 && (
            <p className="mt-1.5 text-[11px] text-amber-600 font-medium flex items-center gap-1">
              <AlertCircle size={11} /> Digite pelo menos 3 caracteres
            </p>
          )}
        </div>
        <div className="px-6 pb-5 flex gap-2">
          <button onClick={onClose} disabled={isSaving}
            className="flex-1 py-2.5 border border-[#e3e8ef] text-[#4b5563] rounded-xl text-[13px] font-medium hover:bg-slate-50 transition-all">
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={nomeFuncao.trim().length < 3 || isSaving || success}
            className={cn(
              'flex-1 py-2.5 rounded-xl text-[13px] font-semibold transition-all flex items-center justify-center gap-2',
              nomeFuncao.trim().length >= 3 && !success
                ? 'bg-violet-600 text-white hover:bg-violet-700'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            )}
          >
            {success
              ? <><CheckCircle size={14} /> Cadastrada!</>
              : isSaving
                ? <Loader2 size={14} className="animate-spin" />
                : <><Plus size={14} /> Cadastrar função</>
            }
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Modal Associar ───────────────────────────────────────────────────────────
function AssociarModal({ userRole, userName, userChapa, userEmail, userRegional, onClose, onSaved }: {
  userRole: string
  userName: string
  userChapa: string
  userEmail: string
  userRegional: string
  onClose: () => void
  onSaved: (updated: any) => void
}) {
  const isGerenteOuCoordenador = userRole === 'gerente' || userRole === 'coordenador'
  const isSupervisor = userRole === 'supervisor'

  const [allData,     setAllData    ] = useState<any[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [busca,       setBusca      ] = useState('')
  const [selected,    setSelected   ] = useState<any>(null)

  const [novoSupervisor,      setNovoSupervisor     ] = useState('')
  const [novaChapaSupervisor, setNovaChapaSupervisor] = useState('')
  const [novaArea,            setNovaArea           ] = useState('')
  const [novaBase,            setNovaBase           ] = useState('')

  const [isSaving, setIsSaving] = useState(false)
  const [success,  setSuccess ] = useState(false)

  const inputCls = 'w-full bg-[#f8fafc] border border-[#e3e8ef] rounded-lg h-9 px-3 text-[13px] outline-none focus:border-[#094780] focus:bg-white transition-all'
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
            supervisorName:  userName.toUpperCase(),
            chapaSupervisor: userChapa,
            supervisorEmail: userEmail,
          }
        : {
            supervisorName:  novoSupervisor.toUpperCase(),
            chapaSupervisor: novaChapaSupervisor,
            supervisorEmail: '',
          }

      if (isGerenteOuCoordenador) {
        if (novaArea) payload.area = novaArea
        if (novaBase) payload.base = novaBase
      }

      const res = await api.patch(`/taxa-contato/${selected.id}/assumir`, payload)
      setSuccess(true)
      setTimeout(() => onSaved(res.data ?? {
        ...selected,
        supervisor:      payload.supervisorName,
        chapaSupervisor: payload.chapaSupervisor,
        email:           payload.supervisorEmail,
      }), 1000)
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
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center">
              <Link2 size={15} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-[15px] font-bold text-[#1a2535]">Associar Colaborador</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {isSupervisor
                  ? 'Vincule colaboradores à sua supervisão'
                  : 'Vincule colaboradores e defina supervisor, área e base'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-all">
            <X size={16} />
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-5 flex-1 space-y-5">
          <div>
            <label className={labelCls}>Buscar colaborador — toda a base</label>
            <div className="relative mb-2">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input className="w-full bg-[#f8fafc] border border-[#e3e8ef] rounded-lg h-10 pl-9 pr-3 text-[13px] outline-none focus:border-[#094780] focus:bg-white transition-all"
                placeholder="Nome, matrícula ou função..." value={busca} onChange={e => setBusca(e.target.value)} autoFocus />
            </div>
            <div className="border border-[#e3e8ef] rounded-xl overflow-hidden max-h-52 overflow-y-auto">
              {loadingData ? (
                <div className="py-8 text-center text-[12px] text-slate-400 flex items-center justify-center gap-2">
                  <Loader2 size={14} className="animate-spin" /> Carregando base de dados...
                </div>
              ) : filteredColabs.length === 0 ? (
                <div className="py-8 text-center text-[12px] text-slate-400 font-medium">Nenhum colaborador encontrado</div>
              ) : filteredColabs.map(c => (
                <button key={c.id} onClick={() => handleSelectColab(c)}
                  className={cn('w-full flex items-center gap-3 px-4 py-3 text-left transition-all border-b border-slate-50 last:border-0',
                    selected?.id === c.id ? 'bg-emerald-50 border-l-2 border-l-emerald-500' : 'hover:bg-slate-50')}>
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 text-[11px] font-bold text-slate-500">
                    {c.nome?.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12.5px] font-bold text-[#1a2535] truncate uppercase">{c.nome}</p>
                    <p className="text-[10px] text-slate-400 font-medium">
                      Mat. {c.chapa} · {c.funcao || 'Sem função'} · <span className="text-slate-500">{c.regional || '—'}</span>
                    </p>
                  </div>
                  {c.supervisor && (
                    <span className="text-[10px] text-slate-400 italic shrink-0 hidden sm:block">
                      {c.supervisor.split(' ')[0]}
                    </span>
                  )}
                  {selected?.id === c.id && <CheckCircle size={14} className="text-emerald-500 shrink-0" />}
                </button>
              ))}
            </div>
          </div>

          {selected && (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex items-center gap-3">
                <CheckCircle size={15} className="text-emerald-600 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[12px] font-bold text-emerald-800 truncate uppercase">{selected.nome}</p>
                  <p className="text-[10px] text-emerald-600">Chapa {selected.chapa} · Regional atual: {selected.regional || '—'}</p>
                </div>
              </div>

              <div>
                <label className={labelCls}>Supervisor que será atribuído</label>
                {isSupervisor ? (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 flex items-center gap-3">
                    <UserCheck size={14} className="text-emerald-600 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-bold text-[#1a2535]">{userName.toUpperCase()}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Chapa: <strong>{userChapa}</strong>
                        {userRegional && <> · Regional: <strong>{userRegional}</strong></>}
                      </p>
                    </div>
                    <span className="text-[10px] text-slate-400 italic shrink-0">Automático</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Nome do supervisor <span className="text-red-400">*</span></label>
                      <input
                        className={inputCls}
                        placeholder="Nome completo..."
                        value={novoSupervisor}
                        onChange={e => setNovoSupervisor(e.target.value.toUpperCase())}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Chapa do supervisor</label>
                      <input
                        className={inputCls}
                        placeholder="Matrícula..."
                        inputMode="numeric"
                        value={novaChapaSupervisor}
                        onChange={e => setNovaChapaSupervisor(e.target.value.replace(/[^0-9]/g, ''))}
                      />
                    </div>
                  </div>
                )}
              </div>

              {isGerenteOuCoordenador && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Área</label>
                    <input className={inputCls} placeholder="Ex: Comercial..." value={novaArea} onChange={e => setNovaArea(e.target.value)} />
                  </div>
                  <div>
                    <label className={labelCls}>Base</label>
                    <input className={inputCls} placeholder="Ex: Teresina..." value={novaBase} onChange={e => setNovaBase(e.target.value)} />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-100 flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 border border-[#e3e8ef] text-[#4b5563] rounded-xl text-[13px] font-medium hover:bg-slate-50 transition-all">
            Cancelar
          </button>
          <button onClick={handleSave} disabled={!canSave || isSaving || success}
            className={cn('flex-1 py-2.5 rounded-xl text-[13px] font-semibold transition-all flex items-center justify-center gap-2',
              canSave && !success ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-slate-200 text-slate-400 cursor-not-allowed')}>
            {success
              ? <><CheckCircle size={14} /> Associado!</>
              : isSaving
                ? <Loader2 size={14} className="animate-spin" />
                : <><Link2 size={14} /> Associar colaborador</>}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Modal Desassociar ────────────────────────────────────────────────────────
function DesassociarModal({ userRole, userName, userChapa, onClose, onSaved }: {
  userRole: string
  userName: string
  userChapa: string
  onClose: () => void
  onSaved: (updated: any) => void
}) {
  const isGerenteOuCoordenador = userRole === 'gerente' || userRole === 'coordenador'
  const isSupervisor = userRole === 'supervisor'

  const [allData,     setAllData    ] = useState<any[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [busca,       setBusca      ] = useState('')
  const [selected,    setSelected   ] = useState<any>(null)
  const [modoAcao,    setModoAcao   ] = useState<'transferir' | 'soltar'>('transferir')

  const [novoSupervisor,      setNovoSupervisor     ] = useState('')
  const [novaChapaSupervisor, setNovaChapaSupervisor] = useState('')
  const [novaArea,            setNovaArea           ] = useState('')
  const [novaBase,            setNovaBase           ] = useState('')
  const [novaRegional,        setNovaRegional       ] = useState('')

  const [isSaving, setIsSaving] = useState(false)
  const [success,  setSuccess ] = useState(false)

  const inputCls = 'w-full bg-[#f8fafc] border border-[#e3e8ef] rounded-lg h-9 px-3 text-[13px] outline-none focus:border-[#094780] focus:bg-white transition-all'
  const labelCls = 'text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block'

  useEffect(() => {
    api.get('/taxa-contato/todos')
      .then(res => setAllData(res.data))
      .catch(() => setAllData([]))
      .finally(() => setLoadingData(false))
  }, [])

  const dataFiltrada = useMemo(() => {
    if (isSupervisor) {
      return allData.filter(d =>
        d.chapaSupervisor === userChapa ||
        d.supervisor?.toUpperCase() === userName.toUpperCase()
      )
    }
    return allData.filter(d => !!d.supervisor)
  }, [allData, isSupervisor, userName, userChapa])

  const filteredColabs = useMemo(() => {
    const t = busca.toLowerCase().trim()
    if (!t) return dataFiltrada.slice(0, 25)
    return dataFiltrada.filter(d =>
      d.nome?.toLowerCase().includes(t) || d.chapa?.includes(t) || d.supervisor?.toLowerCase().includes(t)
    ).slice(0, 25)
  }, [dataFiltrada, busca])

  function handleSelectColab(colab: any) {
    setSelected(colab)
    setNovaArea(colab.area ?? '')
    setNovaBase(colab.base ?? '')
    setNovaRegional(colab.regional ?? '')
    setNovoSupervisor('')
    setNovaChapaSupervisor('')
  }

  async function handleSave() {
    if (!selected || isSaving) return
    setIsSaving(true)
    try {
      let res: any
      if (modoAcao === 'soltar') {
        res = await api.patch(`/taxa-contato/${selected.id}/soltar`)
      } else {
        const payload: any = {
          supervisorName:  novoSupervisor.toUpperCase(),
          chapaSupervisor: novaChapaSupervisor,
          supervisorEmail: '',
        }
        if (isGerenteOuCoordenador) {
          if (novaArea)     payload.area     = novaArea
          if (novaBase)     payload.base     = novaBase
          if (novaRegional) payload.regional = novaRegional
        }
        res = await api.patch(`/taxa-contato/${selected.id}/assumir`, payload)
      }
      setSuccess(true)
      setTimeout(() => onSaved(res.data ?? {
        ...selected,
        supervisor:      modoAcao === 'soltar' ? null : novoSupervisor,
        chapaSupervisor: modoAcao === 'soltar' ? null : novaChapaSupervisor,
        regional:        novaRegional || selected.regional,
      }), 1000)
    } catch (e: any) {
      alert(e.response?.data?.message || 'Erro ao processar.')
    } finally {
      setIsSaving(false)
    }
  }

  const canSave = selected && (modoAcao === 'soltar' || novoSupervisor.trim().length > 0)

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#111827]/60 backdrop-blur-md p-0 sm:p-6">
      <div className="bg-white w-full sm:max-w-xl rounded-t-3xl sm:rounded-2xl shadow-2xl border border-[#e3e8ef] animate-slideUp flex flex-col max-h-[92vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center">
              <Unlink2 size={15} className="text-orange-600" />
            </div>
            <div>
              <p className="text-[15px] font-bold text-[#1a2535]">Desassociar / Transferir</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {isSupervisor
                  ? 'Transfira ou libere colaboradores da sua equipe'
                  : 'Transfira entre regionais ou libere o vínculo de supervisão'}
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
              <input className="w-full bg-[#f8fafc] border border-[#e3e8ef] rounded-lg h-10 pl-9 pr-3 text-[13px] outline-none focus:border-[#094780] focus:bg-white transition-all"
                placeholder="Nome, matrícula ou supervisor atual..." value={busca} onChange={e => setBusca(e.target.value)} autoFocus />
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
                  className={cn('w-full flex items-center gap-3 px-4 py-3 text-left transition-all border-b border-slate-50 last:border-0',
                    selected?.id === c.id ? 'bg-orange-50 border-l-2 border-l-orange-400' : 'hover:bg-slate-50')}>
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
                <label className={labelCls}>O que deseja fazer?</label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <button onClick={() => setModoAcao('transferir')}
                    className={cn('flex items-center gap-2 px-3 py-2.5 rounded-xl border text-[12px] font-bold transition-all',
                      modoAcao === 'transferir' ? 'bg-[#094780] text-white border-[#094780]' : 'bg-white text-slate-600 border-[#e3e8ef] hover:border-[#094780]')}>
                    <UserCheck size={13} /> Transferir supervisão
                  </button>
                  <button onClick={() => setModoAcao('soltar')}
                    className={cn('flex items-center gap-2 px-3 py-2.5 rounded-xl border text-[12px] font-bold transition-all',
                      modoAcao === 'soltar' ? 'bg-red-500 text-white border-red-500' : 'bg-white text-slate-600 border-[#e3e8ef] hover:border-red-400')}>
                    <Unlink2 size={13} /> Liberar sem supervisor
                  </button>
                </div>
              </div>

              {modoAcao === 'transferir' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Novo supervisor <span className="text-red-400">*</span></label>
                      <input className={inputCls} placeholder="Nome do novo supervisor..."
                        value={novoSupervisor} onChange={e => setNovoSupervisor(e.target.value.toUpperCase())} />
                    </div>
                    <div>
                      <label className={labelCls}>Chapa do novo supervisor</label>
                      <input className={inputCls} placeholder="Matrícula..."
                        inputMode="numeric"
                        value={novaChapaSupervisor}
                        onChange={e => setNovaChapaSupervisor(e.target.value.replace(/[^0-9]/g, ''))} />
                    </div>
                  </div>
                  {isGerenteOuCoordenador && (
                    <>
                      <div>
                        <label className={labelCls}>Regional de destino</label>
                        <input className={inputCls} placeholder="Ex: METRO, NORTE, SUL..."
                          value={novaRegional} onChange={e => setNovaRegional(e.target.value.toUpperCase())} />
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
                    </>
                  )}
                </div>
              )}

              {modoAcao === 'soltar' && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                  <AlertCircle size={14} className="text-red-500 shrink-0" />
                  <p className="text-[12px] text-red-700 font-medium">
                    O supervisor e a chapa do supervisor serão <strong>apagados</strong>. O colaborador ficará sem supervisão atribuída.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-100 flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 border border-[#e3e8ef] text-[#4b5563] rounded-xl text-[13px] font-medium hover:bg-slate-50 transition-all">
            Cancelar
          </button>
          <button onClick={handleSave} disabled={!canSave || isSaving || success}
            className={cn('flex-1 py-2.5 rounded-xl text-[13px] font-semibold transition-all flex items-center justify-center gap-2',
              canSave && !success
                ? modoAcao === 'soltar' ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-[#094780] text-white hover:bg-[#0a5494]'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed')}>
            {success
              ? <><CheckCircle size={14} /> Concluído!</>
              : isSaving
                ? <Loader2 size={14} className="animate-spin" />
                : modoAcao === 'soltar'
                  ? <><Unlink2 size={14} /> Liberar colaborador</>
                  : <><UserCheck size={14} /> Confirmar transferência</>}
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

  const [data,    setData   ] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [busca,          setBusca         ] = useState('')
  const [campoBusca,     setCampoBusca    ] = useState('todos')
  const [filtroArea,     setFiltroArea    ] = useState('')
  const [filtroStatus,   setFiltroStatus  ] = useState('')
  const [filtroBase,     setFiltroBase    ] = useState('')
  const [filtroFuncao,   setFiltroFuncao  ] = useState('')
  const [filtroUf,       setFiltroUf      ] = useState<string[]>([])
  const [filtroRegional, setFiltroRegional] = useState<string[]>([])
  const [filtroMes,      setFiltroMes     ] = useState(getMesPadrao)

  const [sortField,   setSortField  ] = useState<SortField>('nome')
  const [sortDir,     setSortDir    ] = useState<SortDir>('asc')
  const [currentPage, setCurrentPage] = useState(1)
  const PAGE_SIZE = 12

  const [deleteTarget,    setDeleteTarget   ] = useState<any>(null)
  const [isDeleting,      setIsDeleting     ] = useState(false)
  const [editTarget,      setEditTarget     ] = useState<any>(null)
  const [showNovaFuncao,  setShowNovaFuncao ] = useState(false)
  const [showAssociar,    setShowAssociar   ] = useState(false)
  const [showDesassociar, setShowDesassociar] = useState(false)

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
      locais:       Array.from(locais).sort(),
      areas:        Array.from(areas).sort(),
      situacoes:    Array.from(situacoes).sort(),
      bases:        Array.from(bases).sort(),
      funcoes:      Array.from(funcoes).sort(),
      ufs:          Array.from(ufs).sort(),
      regionais:    Array.from(regionais).sort(),
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
  }, [filtroUf]) // eslint-disable-line react-hooks/exhaustive-deps

  const filtrosAtivos = [busca, filtroArea, filtroStatus, filtroBase, filtroFuncao, filtroUf.length > 0, filtroRegional.length > 0].filter(Boolean).length

  useEffect(() => { fetchData(filtroMes) }, [filtroMes]) // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchData(competencia?: string) {
    setLoading(true)
    try {
      const res = await api.get('/taxa-contato', { params: { competencia: competencia ?? filtroMes } })
      setData(res.data)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  // ── Exportação ────────────────────────────────────────────────────────────
  async function handleExport() {
    try {
      const XLSX = await import('xlsx')

      const exportData = filtered.map((s: any) => ({
        'Nome':              s.nome              ?? '',
        'Matrícula':         s.chapa             ?? '',
        'Função':            s.funcao            ?? '',
        'Área':              s.area              ?? '',
        'Base':              s.base              ?? '',
        'Local':             s.local             ?? '',
        'Filial (UF)':       s.filial            ?? '',
        'Regional':          s.regional          ?? '',
        'Supervisor':        s.supervisor        ?? '',
        'Chapa Supervisor':  s.chapaSupervisor   ?? '',
        'E-mail Supervisor': s.email             ?? '',
        'Situação':          s.codsituacao       ?? '',
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
      ws['!cols'] = [
        { wch: 36 }, { wch: 12 }, { wch: 26 }, { wch: 22 },
        { wch: 18 }, { wch: 18 }, { wch: 10 }, { wch: 18 },
        { wch: 32 }, { wch: 14 }, { wch: 32 }, { wch: 12 }, { wch: 12 },
      ]

      const headerRange = XLSX.utils.decode_range(ws['!ref'] ?? 'A1')
      for (let C = headerRange.s.c; C <= headerRange.e.c; C++) {
        const cellAddr = XLSX.utils.encode_cell({ r: 0, c: C })
        if (!ws[cellAddr]) continue
        ws[cellAddr].s = {
          font:      { bold: true, color: { rgb: 'FFFFFF' } },
          fill:      { fgColor: { rgb: '094780' } },
          alignment: { horizontal: 'center' },
        }
      }

      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Taxa de Contato')
      XLSX.writeFile(wb, `taxa-contato-${filtroMes.replace('/', '-')}.xlsx`)
    } catch (err) {
      console.error('Erro ao exportar:', err)
      alert('Erro ao gerar o arquivo Excel.')
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

  async function handleDelete() {
    if (!deleteTarget || isDeleting) return
    setIsDeleting(true)
    try {
      await api.delete(`/taxa-contato/${deleteTarget.id}`)
      setData(prev => prev.filter(r => r.id !== deleteTarget.id))
      setDeleteTarget(null)
    } catch (e: any) { alert(e.response?.data?.message || 'Erro ao excluir.') }
    finally { setIsDeleting(false) }
  }

  function handleStatusChange(id: string, newStatus: string) {
    setData(prev => prev.map(r => r.id === id ? { ...r, codsituacao: newStatus } : r))
  }

  function handleAssociacaoSaved(updated: any) {
    setData(prev => prev.map(r => r.id === updated.id ? { ...r, ...updated } : r))
    setShowAssociar(false)
    setShowDesassociar(false)
  }

  // ── Helper para formatar data da coluna ──────────────────────────────────
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
      if (filtroUf.length > 0       && !filtroUf.includes(s.filial))         return false
      if (filtroRegional.length > 0 && !filtroRegional.includes(s.regional)) return false
      return true
    }).sort((a, b) => {
      let diff: number
      if (sortField === 'data') {
        // Compara lexicograficamente — formato "YYYY-01-MM 00:00:00.000" ordena corretamente
        diff = (a.data ?? '').localeCompare(b.data ?? '')
      } else {
        diff = (a[sortField] || '').localeCompare(b[sortField] || '', 'pt-BR')
      }
      return sortDir === 'asc' ? diff : -diff
    })
  }, [data, busca, campoBusca, filtroArea, filtroStatus, filtroBase, filtroFuncao, filtroUf, filtroRegional, sortField, sortDir])

  const paginated  = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const mesLabel   = MESES_OPTIONS.find(m => m.value === filtroMes)?.label ?? filtroMes
  const userFullName = `${userData?.nome ?? ''} ${userData?.sobrenome ?? ''}`.trim()
  const userChapa    = userData?.chapa ?? ''
  const userRegional = userData?.regional ?? ''

  return (
    <DashboardLayout title="Taxa de Contato" breadcrumb="SIGS / Gestão de Pessoas / Taxa de Contato" navItems={navItems}>
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
        .pg-btn { min-width:32px; height:32px; border-radius:8px; border:1.5px solid #e3e8ef; background:#fff; cursor:pointer; display:flex; align-items:center; justify-center; font-size:12px; font-weight:600; }
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
              {mesLabel} · {filtered.length} registro(s) encontrado(s)
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
                {MESES_OPTIONS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
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
                  <Unlink2 size={13} /> Desassociar
                </button>
                <button onClick={() => setShowAssociar(true)} className="btn-emerald">
                  <Link2 size={13} /> Associar
                </button>
              </>
            )}
            {isAdmin && (
              <button onClick={() => setShowNovaFuncao(true)} className="btn-violet">
                <Tag size={14} /> Nova Função
              </button>
            )}
          </div>
        </div>

        {/* ── Filtros ── */}
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

        {/* ── Tabela ── */}
        <div className="main-card">
          {loading ? (
            <div className="py-20 text-center animate-pulse text-slate-400 font-bold">Carregando base de dados...</div>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center">
              <AlertCircle size={32} className="mx-auto mb-3 text-slate-300" />
              <p className="text-[14px] font-semibold text-slate-400">Nenhum registro encontrado</p>
            </div>
          ) : (
            <>
              <div className="table-scroll">
                <table className="gp-table">
                  <thead>
                    <tr>
                      {/* ── Colaborador ── */}
                      <th className="sortable" onClick={() => handleSort('nome')}>
                        Colaborador {sortField === 'nome' && (sortDir === 'asc' ? '↑' : '↓')}
                      </th>
                      <th>Função / Área</th>
                      <th>Base / Local</th>

                      {/* ── Supervisor — nome + matrícula juntos ── */}
                      <th className="sortable" onClick={() => handleSort('supervisor')}>
                        Supervisor {sortField === 'supervisor' && (sortDir === 'asc' ? '↑' : '↓')}
                      </th>

                      {/* ── E-mail do supervisor ── */}
                      <th>E-mail Supervisor</th>

                      <th>Filial / Regional</th>

                      {/* ── Data — ordenável ── */}
                      <th className="sortable" onClick={() => handleSort('data')}>
                        Data {sortField === 'data' && (sortDir === 'asc' ? '↑' : '↓')}
                      </th>

                      <th>Situação</th>
                      {isAdmin && <th style={{ width: 52 }} />}
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map((s: any) => (
                      <tr key={s.id} className="gp-row">
                        {/* ── Colaborador ── */}
                        <td>
                          <div className="font-bold text-[#1a2535] uppercase">{s.nome}</div>
                          <div className="text-[10px] text-slate-400 font-bold">MATRÍCULA: {s.chapa}</div>
                        </td>

                        {/* ── Função / Área ── */}
                        <td>
                          <div className="flex items-center gap-1.5 text-slate-700 font-bold">
                            <Briefcase size={12} className="text-slate-400" /> {s.funcao || 'N/I'}
                          </div>
                          <div className="text-[10px] text-[#8896ab] font-bold mt-0.5 uppercase">{s.area}</div>
                        </td>

                        {/* ── Base / Local ── */}
                        <td>
                          <div className="font-semibold text-slate-700">
                            {s.base || <span className="text-slate-300 italic font-normal text-xs">—</span>}
                          </div>
                          <div className="text-[10px] text-slate-400 font-medium mt-0.5">{s.local || ''}</div>
                        </td>

                        {/* ── Supervisor — nome + matrícula (mesmo padrão do colaborador) ── */}
                        <td>
                          <div className="font-bold text-[#1a2535]">
                            {s.supervisor || <span className="text-slate-400 font-semibold italic text-[11px]">NÃO ASSUMIDO</span>}
                          </div>
                          {s.chapaSupervisor
                            ? <div className="text-[10px] text-slate-400 font-bold">MATRÍCULA: {s.chapaSupervisor}</div>
                            : null
                          }
                        </td>

                        {/* ── E-mail do supervisor ── */}
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

                        {/* ── Filial / Regional ── */}
                        <td>
                          <div className="font-bold text-slate-700">{s.filial}</div>
                          <div className="text-[10px] text-slate-400 font-bold">{s.regional}</div>
                        </td>

                        {/* ── Data ── */}
                        <td>
                          {formatarData(s.data)
                            ? <div className="text-[12px] font-semibold text-slate-600">{formatarData(s.data)}</div>
                            : <span className="text-slate-300 italic text-xs">—</span>
                          }
                        </td>

                        {/* ── Situação ── */}
                        <td>
                          <StatusSelector
                            row={s}
                            onStatusChange={handleStatusChange}
                            canEdit={canEditStatus}
                          />
                        </td>

                        {isAdmin && <td><ActionMenu row={s} onEdit={setEditTarget} onDelete={setDeleteTarget} /></td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="pag-wrap">
                <span className="text-[11px] text-[#8896ab]">
                  Página {currentPage} de {totalPages} · Exibindo {Math.min(currentPage * PAGE_SIZE, filtered.length)} de {filtered.length}
                </span>
                <div className="flex gap-1">
                  <button className="pg-btn" onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}><ChevronLeft size={14} /></button>
                  <button className="pg-btn" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages}><ChevronRight size={14} /></button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Modais ── */}
      {isAdmin && deleteTarget && (
        <DeleteModal row={deleteTarget} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} isDeleting={isDeleting} />
      )}

      {isAdmin && editTarget && (
        <EditModal
          row={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={updated => { setData(prev => prev.map(r => r.id === updated.id ? updated : r)); setEditTarget(null) }}
          dynamicOptions={dynamicOptions}
        />
      )}

      {isAdmin && showNovaFuncao && (
        <NovaFuncaoModal
          onClose={() => setShowNovaFuncao(false)}
          onSaved={() => { setShowNovaFuncao(false); fetchData(filtroMes) }}
        />
      )}

      {canManageAssociation && showAssociar && (
        <AssociarModal
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