'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import {
  Search, SlidersHorizontal, Download, LayoutDashboard,
  PhoneCall, UserCheck, AlertCircle,
  ChevronLeft, RefreshCw, Calendar,
  ChevronDown, MoreVertical, Edit2, Trash2, Plus, Loader2,
  CheckCircle, ChevronRight, X, Pencil, Save, Ban, Mail, Briefcase,
  Link2, Unlink2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useSession } from 'next-auth/react'
import api from '@/lib/api'

// ─── Nav ──────────────────────────────────────────────────────────────────────
const navItems = [
  { section: 'Taxa de Contato' },
  { label: 'Dashboard',       href: '/taxa-contato',               icon: LayoutDashboard },
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

// Mês padrão dinâmico — usa o mês atual se disponível, senão o mais recente
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

type SortField = 'supervisor' | 'nome'
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
    // Posiciona abaixo do botão, alinhado à esquerda
    // Se não couber abaixo, sobe (espaço disponível abaixo < 180px)
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
function EditModal({ row, onClose, onSaved }: { row: any; onClose: () => void; onSaved: (updated: any) => void }) {
  const [editMode, setEditMode] = useState(false)
  const INITIAL = {
    nome: row?.nome ?? '', chapa: row?.chapa ?? '', funcao: row?.funcao ?? '',
    area: row?.area ?? '', base: row?.base ?? '', local: row?.local ?? '',
    filial: row?.filial ?? '', regional: row?.regional ?? '',
    codsituacao: row?.codsituacao ?? '', supervisor: row?.supervisor ?? '', email: row?.email ?? '',
  }
  const [form, setForm] = useState(INITIAL)
  const [isSaving, setIsSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const labelCls = 'text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block'
  const inputCls = 'w-full bg-white border border-[#e3e8ef] rounded-lg h-9 px-3 text-[13px] outline-none focus:border-[#094780] transition-all'
  const viewCls  = 'text-[13px] font-semibold text-[#1a2535] min-h-[22px]'
  async function handleSave() {
    setIsSaving(true)
    try {
      const res = await api.patch(`/taxa-contato/${row.id}`, form)
      setSuccess(true)
      setTimeout(() => { setSuccess(false); onSaved(res.data ?? { ...row, ...form }) }, 1000)
    } catch (e: any) { alert(e.response?.data?.message || 'Erro ao salvar.') }
    finally { setIsSaving(false) }
  }
  function Field({ label, field, type = 'text' }: { label: string; field: keyof typeof form; type?: string }) {
    const val = form[field] as string
    return (
      <div>
        <label className={labelCls}>{label}</label>
        {editMode
          ? <input type={type} className={inputCls} value={val} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))} />
          : <p className={viewCls}>{val || <span className="text-slate-300 font-normal italic text-[12px]">—</span>}</p>}
      </div>
    )
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
              ? <button onClick={() => setEditMode(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-[12px] font-bold hover:bg-amber-100 transition-all whitespace-nowrap"><Pencil size={13} /> Modo de edição</button>
              : <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-400 text-white text-[12px] font-bold whitespace-nowrap"><Pencil size={13} /> Editando</span>}
            <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-all shrink-0"><X size={16} /></button>
          </div>
        </div>
        <div className="overflow-y-auto px-6 py-5 flex-1 space-y-5">
          <div>
            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mb-3">Identificação</p>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Nome" field="nome" /><Field label="Chapa" field="chapa" />
              <div className="col-span-2"><Field label="Função" field="funcao" /></div>
            </div>
          </div>
          <div className="border-t border-slate-50" />
          <div>
            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mb-3">Lotação</p>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Área" field="area" /><Field label="Situação" field="codsituacao" />
              <Field label="Base" field="base" /><Field label="Local" field="local" />
              <Field label="Filial (UF)" field="filial" /><Field label="Regional" field="regional" />
            </div>
          </div>
          <div className="border-t border-slate-50" />
          <div>
            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mb-3">Supervisão</p>
            <div className="grid grid-cols-1 gap-4">
              <Field label="Nome do supervisor" field="supervisor" />
              <Field label="E-mail do supervisor" field="email" type="email" />
            </div>
          </div>
          {!editMode && <div><label className={labelCls}>Status atual</label><div className="mt-1"><StatusBadge status={form.codsituacao} /></div></div>}
        </div>
        <div className="px-6 py-4 border-t border-slate-100 flex gap-2">
          {editMode ? (
            <>
              <button onClick={() => { setForm(INITIAL); setEditMode(false) }} disabled={isSaving}
                className="flex-1 py-2.5 border border-[#e3e8ef] text-[#4b5563] rounded-xl text-[13px] font-medium hover:bg-slate-50 transition-all flex items-center justify-center gap-1.5">
                <Ban size={14} /> Cancelar edição
              </button>
              <button onClick={handleSave} disabled={isSaving || success}
                className="flex-1 py-2.5 bg-[#094780] text-white rounded-xl text-[13px] font-semibold hover:bg-[#0a5494] transition-all flex items-center justify-center gap-2">
                {success ? <><CheckCircle size={14} /> Salvo!</> : isSaving ? <Loader2 size={14} className="animate-spin" /> : <><Save size={14} /> Salvar alterações</>}
              </button>
            </>
          ) : (
            <button onClick={onClose} className="flex-1 py-2.5 bg-[#094780] text-white rounded-xl text-[13px] font-semibold hover:bg-[#0a5494] transition-all">Fechar</button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── New Record Modal ─────────────────────────────────────────────────────────
// Campos do formulário extraídos para fora do modal para evitar perda de foco
const NEW_INPUT_CLS = 'w-full bg-[#f8fafc] border border-[#e3e8ef] rounded-lg h-10 px-3 text-[13px] outline-none focus:border-[#094780] focus:bg-white transition-all'
const NEW_LABEL_CLS = 'text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block'

interface NewFieldProps {
  label: string
  field: string
  value: string
  onChange: (field: string, value: string) => void
  type?: string
}
function NewField({ label, field, value, onChange, type = 'text' }: NewFieldProps) {
  return (
    <div>
      <label className={NEW_LABEL_CLS}>{label}</label>
      <input
        type={type}
        className={NEW_INPUT_CLS}
        value={value}
        onChange={e => onChange(field, e.target.value)}
      />
    </div>
  )
}

function NewRecordModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    nome: '', chapa: '', funcao: '', area: '', base: '', local: '',
    filial: '', regional: '', codsituacao: 'ATIVO', supervisor: '', email: '',
  })
  const [isSaving, setIsSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const isValid = form.nome.trim() && form.chapa.trim()

  function handleChange(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSave() {
    if (!isValid || isSaving) return
    setIsSaving(true)
    try {
      await api.post('/taxa-contato', form)
      setSuccess(true)
      setTimeout(() => { setSuccess(false); onSaved() }, 1200)
    } catch (e: any) { alert(e.response?.data?.message || 'Erro ao criar registro.') }
    finally { setIsSaving(false) }
  }
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#111827]/60 backdrop-blur-md p-0 sm:p-6">
      <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl border border-[#e3e8ef] animate-slideUp flex flex-col max-h-[92vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div><p className="text-[16px] font-bold text-[#1a2535]">Novo Registro</p><p className="text-[11px] text-slate-400 mt-0.5">Cadastrar na taxa de contato</p></div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-all"><X size={16} /></button>
        </div>
        <div className="overflow-y-auto px-6 py-4 flex-1 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <NewField label="Nome *" field="nome" value={form.nome} onChange={handleChange} /><NewField label="Chapa *" field="chapa" value={form.chapa} onChange={handleChange} />
            <div className="col-span-2"><NewField label="Função" field="funcao" value={form.funcao} onChange={handleChange} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3"><NewField label="Área" field="area" value={form.area} onChange={handleChange} /><NewField label="Situação" field="codsituacao" value={form.codsituacao} onChange={handleChange} /></div>
          <div className="grid grid-cols-2 gap-3"><NewField label="Base" field="base" value={form.base} onChange={handleChange} /><NewField label="Local" field="local" value={form.local} onChange={handleChange} /></div>
          <div className="grid grid-cols-2 gap-3"><NewField label="Filial (UF)" field="filial" value={form.filial} onChange={handleChange} /><NewField label="Regional" field="regional" value={form.regional} onChange={handleChange} /></div>
          <div className="border-t border-slate-100 pt-3">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Supervisão (opcional)</p>
            <div className="space-y-3"><NewField label="Nome do supervisor" field="supervisor" value={form.supervisor} onChange={handleChange} /><NewField label="E-mail do supervisor" field="email" value={form.email} onChange={handleChange} type="email" /></div>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-100 flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 border border-[#e3e8ef] text-[#4b5563] rounded-xl text-[13px] font-medium hover:bg-slate-50 transition-all">Cancelar</button>
          <button onClick={handleSave} disabled={!isValid || isSaving || success}
            className={cn('flex-1 py-2.5 rounded-xl text-[13px] font-semibold transition-all flex items-center justify-center gap-2',
              isValid ? 'bg-[#094780] text-white hover:bg-[#0a5494]' : 'bg-slate-200 text-slate-400 cursor-not-allowed')}>
            {success ? <><CheckCircle size={14} /> Criado!</> : isSaving ? <Loader2 size={14} className="animate-spin" /> : <><Plus size={14} /> Criar registro</>}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Modal Associar ───────────────────────────────────────────────────────────
function AssociarModal({ userRole, userName, userEmail, onClose, onSaved }: {
  userRole: string; userName: string; userEmail: string
  onClose: () => void; onSaved: (updated: any) => void
}) {
  const isGerenteOuCoordenador = userRole === 'gerente' || userRole === 'coordenador'
  const isSupervisor = userRole === 'supervisor'

  const [allData,     setAllData    ] = useState<any[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [busca,       setBusca      ] = useState('')
  const [selected,    setSelected   ] = useState<any>(null)

  const [novoSupervisor, setNovoSupervisor] = useState(isSupervisor ? userName.toUpperCase() : '')
  const [novaArea,       setNovaArea      ] = useState('')
  const [novaBase,       setNovaBase      ] = useState('')

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
    if (!isSupervisor) setNovoSupervisor(colab.supervisor ?? '')
  }

  async function handleSave() {
    if (!selected || isSaving) return
    setIsSaving(true)
    try {
      const payload: any = {
        supervisorName:  isSupervisor ? userName.toUpperCase() : novoSupervisor,
        supervisorEmail: isSupervisor ? userEmail : '',
      }
      if (isGerenteOuCoordenador) {
        if (novaArea) payload.area = novaArea
        if (novaBase) payload.base = novaBase
      }
      const res = await api.patch(`/taxa-contato/${selected.id}/assumir`, payload)
      setSuccess(true)
      setTimeout(() => onSaved(res.data ?? { ...selected, supervisor: payload.supervisorName, email: payload.supervisorEmail }), 1000)
    } catch (e: any) { alert(e.response?.data?.message || 'Erro ao associar.') }
    finally { setIsSaving(false) }
  }

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
                {isGerenteOuCoordenador ? 'Vincule qualquer colaborador e defina supervisor, área e base' : 'Vincule qualquer colaborador à sua supervisão'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-all"><X size={16} /></button>
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
                  {c.supervisor && <span className="text-[10px] text-slate-400 italic shrink-0 hidden sm:block">{c.supervisor.split(' ')[0]}</span>}
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
                <label className={labelCls}>Novo supervisor</label>
                {isSupervisor ? (
                  <div className="bg-slate-50 border border-slate-200 rounded-lg h-9 px-3 flex items-center">
                    <p className="text-[13px] font-bold text-[#1a2535]">{userName.toUpperCase()}</p>
                    <span className="ml-auto text-[10px] text-slate-400 italic">Automático</span>
                  </div>
                ) : (
                  <input className={inputCls} placeholder="Nome do supervisor..."
                    value={novoSupervisor} onChange={e => setNovoSupervisor(e.target.value.toUpperCase())} />
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
          <button onClick={onClose} className="flex-1 py-2.5 border border-[#e3e8ef] text-[#4b5563] rounded-xl text-[13px] font-medium hover:bg-slate-50 transition-all">Cancelar</button>
          <button onClick={handleSave} disabled={!selected || isSaving || success}
            className={cn('flex-1 py-2.5 rounded-xl text-[13px] font-semibold transition-all flex items-center justify-center gap-2',
              selected && !success ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-slate-200 text-slate-400 cursor-not-allowed')}>
            {success ? <><CheckCircle size={14} /> Associado!</> : isSaving ? <Loader2 size={14} className="animate-spin" /> : <><Link2 size={14} /> Associar colaborador</>}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Modal Desassociar ────────────────────────────────────────────────────────
function DesassociarModal({ userRole, userName, onClose, onSaved }: {
  userRole: string; userName: string
  onClose: () => void; onSaved: (updated: any) => void
}) {
  const isGerenteOuCoordenador = userRole === 'gerente' || userRole === 'coordenador'
  const isSupervisor = userRole === 'supervisor'

  const [allData,     setAllData    ] = useState<any[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [busca,       setBusca      ] = useState('')
  const [selected,    setSelected   ] = useState<any>(null)
  const [modoAcao,    setModoAcao   ] = useState<'transferir' | 'soltar'>('transferir')

  const [novoSupervisor, setNovoSupervisor] = useState('')
  const [novaArea,       setNovaArea      ] = useState('')
  const [novaBase,       setNovaBase      ] = useState('')
  const [novaRegional,   setNovaRegional  ] = useState('')

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
    if (isSupervisor) return allData.filter(d => d.supervisor?.toUpperCase() === userName.toUpperCase())
    return allData.filter(d => !!d.supervisor)
  }, [allData, isSupervisor, userName])

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
  }

  async function handleSave() {
    if (!selected || isSaving) return
    setIsSaving(true)
    try {
      let res: any
      if (modoAcao === 'soltar') {
        res = await api.patch(`/taxa-contato/${selected.id}/soltar`)
      } else {
        const payload: any = { supervisorName: novoSupervisor, supervisorEmail: '' }
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
        supervisor: modoAcao === 'soltar' ? null : novoSupervisor,
        regional:   novaRegional || selected.regional,
      }), 1000)
    } catch (e: any) { alert(e.response?.data?.message || 'Erro ao processar.') }
    finally { setIsSaving(false) }
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
                {isSupervisor ? 'Transfira ou libere colaboradores da sua equipe' : 'Transfira entre regionais ou libere o vínculo de supervisão'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-all"><X size={16} /></button>
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
                      {c.regional && <> · <span className="text-[#094780]">{c.regional}</span></>}
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
                    Supervisor atual: <strong>{selected.supervisor}</strong> · Regional: <strong>{selected.regional || '—'}</strong>
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
                  <div>
                    <label className={labelCls}>Novo supervisor</label>
                    <input className={inputCls} placeholder="Nome do novo supervisor..."
                      value={novoSupervisor} onChange={e => setNovoSupervisor(e.target.value.toUpperCase())} />
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
                    O campo de supervisor será <strong>apagado</strong>. O colaborador ficará sem supervisão atribuída.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-100 flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 border border-[#e3e8ef] text-[#4b5563] rounded-xl text-[13px] font-medium hover:bg-slate-50 transition-all">Cancelar</button>
          <button onClick={handleSave} disabled={!canSave || isSaving || success}
            className={cn('flex-1 py-2.5 rounded-xl text-[13px] font-semibold transition-all flex items-center justify-center gap-2',
              canSave && !success
                ? modoAcao === 'soltar' ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-[#094780] text-white hover:bg-[#0a5494]'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed')}>
            {success ? <><CheckCircle size={14} /> Concluído!</>
              : isSaving ? <Loader2 size={14} className="animate-spin" />
                : modoAcao === 'soltar' ? <><Unlink2 size={14} /> Liberar colaborador</>
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
  const canManageAssociation = isSupervisor || isGerenteOuCoordenador  // Admin não vê Associar/Desassociar
  const canEditStatus = isAdmin || isGerenteOuCoordenador

  const [data,    setData   ] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [busca,          setBusca        ] = useState('')
  const [campoBusca,     setCampoBusca   ] = useState('todos')
  const [filtroArea,     setFiltroArea   ] = useState('')
  const [filtroStatus,   setFiltroStatus ] = useState('')
  const [filtroBase,     setFiltroBase   ] = useState('')
  const [filtroFuncao,   setFiltroFuncao ] = useState('')
  const [filtroEmailSup, setFiltroEmailSup] = useState('')
  const [filtroUf,       setFiltroUf     ] = useState<string[]>([])
  const [filtroRegional, setFiltroRegional] = useState<string[]>([])
  const [filtroMes,      setFiltroMes    ] = useState(getMesPadrao)

  const [sortField,   setSortField  ] = useState<SortField>('nome')
  const [sortDir,     setSortDir    ] = useState<SortDir>('asc')
  const [currentPage, setCurrentPage] = useState(1)
  const PAGE_SIZE = 12

  const [deleteTarget,    setDeleteTarget   ] = useState<any>(null)
  const [isDeleting,      setIsDeleting     ] = useState(false)
  const [editTarget,      setEditTarget     ] = useState<any>(null)
  const [showNew,         setShowNew        ] = useState(false)
  const [showAssociar,    setShowAssociar   ] = useState(false)
  const [showDesassociar, setShowDesassociar] = useState(false)

  const dynamicOptions = useMemo(() => {
    const areas = new Set<string>(); const situacoes = new Set<string>()
    const bases = new Set<string>(); const funcoes = new Set<string>()
    const emailsSup = new Set<string>(); const ufs = new Set<string>()
    const regionais = new Set<string>()
    const ufToRegionais: Record<string, Set<string>> = {}
    data.forEach(item => {
      if (item.area) areas.add(item.area)
      if (item.codsituacao) situacoes.add(item.codsituacao.toUpperCase())
      if (item.base) bases.add(item.base)
      if (item.funcao) funcoes.add(item.funcao)
      if (item.email) emailsSup.add(item.email.toLowerCase())
      if (item.filial) ufs.add(item.filial)
      if (item.regional) regionais.add(item.regional)
      if (item.filial && item.regional) {
        if (!ufToRegionais[item.filial]) ufToRegionais[item.filial] = new Set()
        ufToRegionais[item.filial].add(item.regional)
      }
    })
    return {
      areas: Array.from(areas).sort(), situacoes: Array.from(situacoes).sort(),
      bases: Array.from(bases).sort(), funcoes: Array.from(funcoes).sort(),
      emailsSup: Array.from(emailsSup).sort(), ufs: Array.from(ufs).sort(),
      regionais: Array.from(regionais).sort(),
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
    if (novasRegionais.length !== filtroRegional.length) {
      setFiltroRegional(novasRegionais)
    }
  }, [filtroUf]) // eslint-disable-line react-hooks/exhaustive-deps

  const filtrosAtivos = [busca, filtroArea, filtroStatus, filtroBase, filtroFuncao, filtroEmailSup, filtroUf.length > 0, filtroRegional.length > 0].filter(Boolean).length

  // ── CORREÇÃO: fetchData recebe competencia como argumento para evitar closure stale ──
  useEffect(() => { fetchData(filtroMes) }, [filtroMes]) // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchData(competencia?: string) {
    setLoading(true)
    try {
      const res = await api.get('/taxa-contato', { params: { competencia: competencia ?? filtroMes } })
      setData(res.data)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  function handleSort(f: SortField) {
    if (f === sortField) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(f); setSortDir('asc') }
    setCurrentPage(1)
  }

  function limparTudo() {
    setBusca(''); setCampoBusca('todos'); setFiltroArea(''); setFiltroStatus('')
    setFiltroBase(''); setFiltroFuncao(''); setFiltroEmailSup('')
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

  const filtered = useMemo(() => {
    const t = busca.toLowerCase().trim()
    return data.filter(s => {
      if (t) {
        switch (campoBusca) {
          case 'nome_colab': if (!s.nome?.toLowerCase().includes(t)) return false; break
          case 'mat_colab':  if (!s.chapa?.includes(t)) return false; break
          case 'nome_sup':   if (!s.supervisor?.toLowerCase().includes(t)) return false; break
          default: if (!s.nome?.toLowerCase().includes(t) && !s.chapa?.includes(t) && !s.supervisor?.toLowerCase().includes(t)) return false
        }
      }
      if (filtroArea      && s.area !== filtroArea) return false
      if (filtroStatus    && (s.codsituacao || '').toUpperCase() !== filtroStatus) return false
      if (filtroBase      && s.base !== filtroBase) return false
      if (filtroFuncao    && s.funcao !== filtroFuncao) return false
      if (filtroEmailSup  && s.email?.toLowerCase() !== filtroEmailSup) return false
      if (filtroUf.length > 0       && !filtroUf.includes(s.filial))          return false
      if (filtroRegional.length > 0 && !filtroRegional.includes(s.regional))  return false
      return true
    }).sort((a, b) => {
      const diff = (a[sortField] || '').localeCompare(b[sortField] || '', 'pt-BR')
      return sortDir === 'asc' ? diff : -diff
    })
  }, [data, busca, campoBusca, filtroArea, filtroStatus, filtroBase, filtroFuncao, filtroEmailSup, filtroUf, filtroRegional, sortField, sortDir])

  const paginated  = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const mesLabel   = MESES_OPTIONS.find(m => m.value === filtroMes)?.label ?? filtroMes
  const userFullName = `${userData?.nome ?? ''} ${userData?.sobrenome ?? ''}`.trim()

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
        .search-select { border:none; background:#f8fafc; border-right:1px solid #e3e8ef; padding:0 8px; font-size:11.5px; font-weight:700; color:#094780; outline:none; cursor:pointer; min-width:100px; }
        .search-input-field { border:none; flex:1; padding:0 10px; font-size:13px; outline:none; min-width:80px; }
        .chip { display:inline-flex; align-items:center; gap:4px; padding:4px 11px; border-radius:99px; cursor:pointer; font-size:11px; font-weight:700; border:1.5px solid #e3e8ef; background:#fff; color:#64748b; transition:all .15s; }
        .chip-active { background:#094780 !important; color:#fff !important; border-color:#094780 !important; }
        .main-card { background:#fff; border:1px solid #e2e8f0; border-radius:18px; overflow:hidden; }
        .table-scroll { overflow-x:auto; }
        .gp-table { width:100%; border-collapse:collapse; min-width:1280px; }
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
            {/* CORREÇÃO: passa filtroMes explicitamente para evitar closure stale */}
            <button onClick={() => fetchData(filtroMes)} className="btn-outline">
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Atualizar
            </button>
            <button className="btn-outline"><Download size={13} /> Exportar</button>

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
              <button onClick={() => setShowNew(true)} className="btn-primary">
                <Plus size={14} /> Novo registro
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
            {/* ── Linha 1: busca + todos os selects na mesma linha ── */}
            <div className="filter-row-main" style={{ alignItems: 'flex-end', gap: 8 }}>

              {/* Busca — largura maior */}
              <div className="flex flex-col gap-1.5" style={{ flex: '0 0 auto', width: 320 }}>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Busca</span>
                <div className="search-container">
                  <select className="search-select" value={campoBusca} onChange={e => setCampoBusca(e.target.value)}>
                    <option value="todos">Todos</option>
                    <option value="nome_colab">Nome Colab.</option>
                    <option value="mat_colab">Mat. Colab.</option>
                    <option value="nome_sup">Nome Sup.</option>
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

              {/* Selects — crescem igualmente para preencher o espaço disponível */}
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
                <div style={{ flex: 1, minWidth: 0 }}>
                  <FilterSelect label="E-mail Supervisor" value={filtroEmailSup} onChange={(v: string) => { setFiltroEmailSup(v); setCurrentPage(1) }} options={dynamicOptions.emailsSup} />
                </div>
              </div>
            </div>

            {/* ── Linha 2: chips UF e regional ── */}
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
                      <th>Data</th>
                      <th>Situação</th>
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
                          <div className="font-semibold text-slate-700">{s.base || <span className="text-slate-300 italic font-normal text-xs">—</span>}</div>
                          <div className="text-[10px] text-slate-400 font-medium mt-0.5">{s.local || ''}</div>
                        </td>
                        <td>
                          <div className="font-bold text-[#1a2535]">{s.supervisor || 'NÃO ASSUMIDO'}</div>
                        </td>
                        <td>
                          {s.email
                            ? <div className="flex items-center gap-1.5 text-slate-600 font-medium lowercase"><Mail size={12} className="text-[#094780]" /> {s.email}</div>
                            : <span className="text-slate-300 italic text-xs">Não informado</span>}
                        </td>
                        <td>
                          <div className="font-bold text-slate-700">{s.filial}</div>
                          <div className="text-[10px] text-slate-400 font-bold">{s.regional}</div>
                        </td>
                        <td>
                          {s.data
                            ? (() => {
                                // Banco: "2026-01-02 00:00:00.000"
                                // Formato YYYY-DD-MM: ano=2026, dia=01, mes=02
                                const raw = String(s.data).trim()
                                const ano = raw.substring(0, 4)  // "2026"
                                const dia = raw.substring(5, 7)  // "01"
                                const mes = raw.substring(8, 10) // "02"
                                if (!ano || !mes || !dia) return <span className="text-slate-300 italic text-xs">—</span>
                                return (
                                  <div className="text-[12px] font-semibold text-slate-600">
                                    {dia}/{mes}/{ano}
                                  </div>
                                )
                              })()
                            : <span className="text-slate-300 italic text-xs">—</span>}
                        </td>
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

      {isAdmin && deleteTarget && <DeleteModal row={deleteTarget} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} isDeleting={isDeleting} />}
      {isAdmin && editTarget && (
        <EditModal row={editTarget} onClose={() => setEditTarget(null)}
          onSaved={updated => { setData(prev => prev.map(r => r.id === updated.id ? updated : r)); setEditTarget(null) }} />
      )}
      {isAdmin && showNew && <NewRecordModal onClose={() => setShowNew(false)} onSaved={() => { setShowNew(false); fetchData(filtroMes) }} />}

      {canManageAssociation && showAssociar && (
        <AssociarModal
          userRole={userData?.role}
          userName={userFullName}
          userEmail={userData?.email ?? ''}
          onClose={() => setShowAssociar(false)}
          onSaved={handleAssociacaoSaved}
        />
      )}

      {canManageAssociation && showDesassociar && (
        <DesassociarModal
          userRole={userData?.role}
          userName={userFullName}
          onClose={() => setShowDesassociar(false)}
          onSaved={handleAssociacaoSaved}
        />
      )}
    </DashboardLayout>
  )
}