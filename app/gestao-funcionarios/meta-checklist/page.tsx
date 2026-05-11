'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import {
  Search, SlidersHorizontal, Download, LayoutDashboard,
  AlertCircle, ChevronLeft, RefreshCw, Calendar,
  ChevronDown, MoreVertical, Edit2, Trash2, Loader2,
  CheckCircle, ChevronRight, X, Pencil, Save, Ban,
  Briefcase,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useSession } from 'next-auth/react'
import api from '@/lib/api'

// ─── Nav ──────────────────────────────────────────────────────────────────────
const navItems = [
  { section: 'Meta Checklist' },
  { label: 'Dashboard', href: '/meta-checklist', icon: LayoutDashboard },
]

const STATUS_CFG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  'ATIVO':     { label: 'Ativo',     color: '#10b981', bg: '#f0fdf4', border: '#bbf7d0' },
  'INATIVO':   { label: 'Inativo',   color: '#64748b', bg: '#f8fafc', border: '#e2e8f0' },
  'FÉRIAS':    { label: 'Férias',    color: '#f59e0b', bg: '#fffbeb', border: '#fde68a' },
  'AFASTADO':  { label: 'Afastado',  color: '#ef4444', bg: '#fef2f2', border: '#fecaca' },
  'DESLIGADO': { label: 'Desligado', color: '#64748b', bg: '#f8fafc', border: '#e2e8f0' },
}

const UF_LABELS: Record<string, string> = { PI: 'Piauí', MA: 'Maranhão' }

type ChecklistField = { key: string; label: string; short: string; icon: string }

const FIELDS_MA: ChecklistField[] = [
  { key: 'metaDds',             label: 'Diálogo de Segurança',  short: 'DDS',      icon: '📋' },
  { key: 'acaoComunidade',      label: 'Ação Comunidade',       short: 'Comuni.',  icon: '🤝' },
  { key: 'inspecEpcFerramenta', label: 'Insp. EPC/Ferramenta',  short: 'EPC/Fer.', icon: '🔧' },
  { key: 'inspecEpi',           label: 'Insp. EPI',             short: 'EPI',      icon: '🦺' },
  { key: 'inspecEdificacao',    label: 'Insp. Edificação',      short: 'Edific.',  icon: '🏗️' },
  { key: 'inspecEquipamento',   label: 'Insp. Equipamento',     short: 'Equip.',   icon: '⚙️' },
  { key: 'inspecVeiculo',       label: 'Insp. Veículo',         short: 'Veículo',  icon: '🚗' },
]

const FIELDS_PI: ChecklistField[] = [
  { key: 'metaDds',        label: 'Meta Diálogo de Segurança', short: 'DDS',    icon: '📋' },
  { key: 'acaoComunidade', label: 'Meta Palestra Comunidade',  short: 'Palest.', icon: '🤝' },
  { key: 'metaDinamica',   label: 'Meta Dinâmica',             short: 'Dinâm.', icon: '🎯' },
  { key: 'metaEstatica',   label: 'Meta Estática',             short: 'Estát.', icon: '📌' },
]

const ALL_CHECKLIST_FIELDS: ChecklistField[] = [
  { key: 'metaDds',             label: 'Meta DDS',              short: 'DDS',      icon: '📋' },
  { key: 'acaoComunidade',      label: 'Ação Comunidade',       short: 'Comuni.',  icon: '🤝' },
  { key: 'blitzCampo',          label: 'Blitz Campo',           short: 'Blitz',    icon: '🔦' },
  { key: 'inspecEpcFerramenta', label: 'Insp. EPC/Ferramenta',  short: 'EPC/Fer.', icon: '🔧' },
  { key: 'inspecEpi',           label: 'Insp. EPI',             short: 'EPI',      icon: '🦺' },
  { key: 'inspecEdificacao',    label: 'Insp. Edificação',      short: 'Edific.',  icon: '🏗️' },
  { key: 'inspecEquipamento',   label: 'Insp. Equipamento',     short: 'Equip.',   icon: '⚙️' },
  { key: 'inspecVeiculo',       label: 'Insp. Veículo',         short: 'Veículo',  icon: '🚗' },
  { key: 'metaDinamica',        label: 'Meta Dinâmica',         short: 'Dinâm.',   icon: '🎯' },
  { key: 'metaEstatica',        label: 'Meta Estática',         short: 'Estát.',   icon: '📌' },
]

function getFieldsForUf(uf: string | null | undefined): ChecklistField[] {
  if (!uf) return ALL_CHECKLIST_FIELDS
  const u = uf.toUpperCase()
  if (u === 'MA') return FIELDS_MA
  if (u === 'PI') return FIELDS_PI
  return ALL_CHECKLIST_FIELDS
}

function getFieldsForUfs(ufs: string[]): ChecklistField[] {
  if (ufs.length === 0) return ALL_CHECKLIST_FIELDS
  if (ufs.length === 1) return getFieldsForUf(ufs[0])
  const activeKeys = new Set<string>()
  ufs.forEach(uf => getFieldsForUf(uf).forEach(f => activeKeys.add(f.key)))
  return ALL_CHECKLIST_FIELDS.filter(f => activeKeys.has(f.key))
}

function fieldBelongsToUf(fieldKey: string, uf: string | null | undefined): boolean {
  const fields = getFieldsForUf(uf)
  return fields.some(f => f.key === fieldKey)
}

function formatarDataBR(dataStr: string | null | undefined): string {
  if (!dataStr) return '—'
  try {
    const [ano, dia, mes] = dataStr.split(' ')[0].split('-')
    if (ano && dia && mes) return `${dia}/${mes}/${ano}`
    return dataStr
  } catch {
    return dataStr
  }
}

type SortField = 'nome' | 'funcao' | 'area' | 'regional'
type SortDir   = 'asc' | 'desc'

// ─── Components ───────────────────────────────────────────────────────────────

function StatusSelect({ rowId, initialStatus, onUpdate }: { rowId: any, initialStatus: string, onUpdate: (newStatus: string) => void }) {
  const [status, setStatus] = useState(initialStatus || 'ATIVO')
  const [loading, setLoading] = useState(false)
  const cfg = STATUS_CFG[status.toUpperCase()] || STATUS_CFG['ATIVO']

  async function handleStatusChange(newStatus: string) {
    setLoading(true)
    const oldStatus = status
    setStatus(newStatus)
    try {
      await api.patch(`/meta-checklist/${rowId}`, { status: newStatus })
      onUpdate(newStatus)
    } catch (err) {
      console.error(err)
      setStatus(oldStatus)
      alert('Erro ao atualizar status.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative group min-w-[85px] mx-auto">
      <select
        value={status.toUpperCase()}
        disabled={loading}
        onChange={(e) => handleStatusChange(e.target.value)}
        className={cn(
          "appearance-none w-full px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all cursor-pointer outline-none",
          loading && "opacity-50 cursor-wait"
        )}
        style={{ 
          background: cfg.bg, 
          color: cfg.color, 
          borderColor: cfg.border,
          paddingRight: '18px' 
        }}
      >
        {Object.keys(STATUS_CFG).map(s => (
          <option key={s} value={s} style={{ background: '#fff', color: '#334155' }}>
            {STATUS_CFG[s].label}
          </option>
        ))}
      </select>
      {loading ? (
        <Loader2 size={10} className="absolute right-1.5 top-1/2 -translate-y-1/2 animate-spin text-slate-400" />
      ) : (
        <ChevronDown size={10} className="absolute right-1.5 top-1/2 -translate-y-1/2 opacity-60 pointer-events-none" />
      )}
    </div>
  )
}

function MetaCell({ value }: { value: number | null | undefined }) {
  const isNull = value === null || value === undefined
  if (isNull) return <span className="inline-flex items-center justify-center w-8 h-6 rounded text-[11px] font-bold text-slate-300">—</span>
  
  const num = Number(value)
  const color = num === 0 ? '#ef4444' : num >= 10 ? '#10b981' : num >= 5 ? '#f59e0b' : '#3b82f6'
  const bg    = num === 0 ? '#fef2f2' : num >= 10 ? '#f0fdf4' : num >= 5 ? '#fffbeb' : '#eff6ff'
  return (
    <span className="inline-flex items-center justify-center min-w-[28px] h-6 px-1.5 rounded text-[11px] font-black" style={{ color, background: bg }}>
      {num}
    </span>
  )
}

function MetaCellForUf({ value, fieldKey, uf }: { value: number | null | undefined, fieldKey: string, uf: string | null | undefined }) {
  if (!fieldBelongsToUf(fieldKey, uf)) return <span className="inline-flex items-center justify-center w-8 h-6 rounded text-[11px] text-slate-200">·</span>
  return <MetaCell value={value} />
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

// ─── EditModal ────────────────────────────────────────────────────────────────
function EditModal({ row, onClose, onSaved, dynamicOptions }: {
  row: any
  onClose: () => void
  onSaved: (updated: any) => void
  dynamicOptions: any
}) {
  const [editMode, setEditMode] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [success,   setSuccess ] = useState(false)

  const INITIAL = {
    nome:      row?.nome       ?? '',
    matricula: row?.matricula  ?? '',
    status:    row?.status     ?? 'ATIVO',
    funcao:    row?.funcao     ?? '',
    area:      row?.area       ?? '',
    regional:  row?.regional   ?? '',
    filial:    row?.filial     ?? '',
    metaDds:             row?.metaDds             ?? null,
    acaoComunidade:      row?.acaoComunidade      ?? null,
    blitzCampo:          row?.blitzCampo          ?? null,
    inspecEpcFerramenta: row?.inspecEpcFerramenta ?? null,
    inspecEpi:           row?.inspecEpi           ?? null,
    inspecEdificacao:    row?.inspecEdificacao    ?? null,
    inspecEquipamento:   row?.inspecEquipamento   ?? null,
    inspecVeiculo:       row?.inspecVeiculo       ?? null,
    metaDinamica:        row?.metaDinamica        ?? null,
    metaEstatica:        row?.metaEstatica        ?? null,
  }
  const [form, setForm] = useState(INITIAL)

  const modalFields = useMemo(() => getFieldsForUf(form.filial), [form.filial])

  function handleChange(field: string, value: any) {
    setForm(f => ({ ...f, [field]: value }))
  }

  function handleNumericChange(field: string, raw: string) {
    if (raw === '') {
      setForm(f => ({ ...f, [field]: null }))
    } else {
      const num = parseInt(raw, 10)
      if (!isNaN(num) && num >= 0) {
        setForm(f => ({ ...f, [field]: num }))
      }
    }
  }

  async function handleSave() {
    setIsSaving(true)
    try {
      const res = await api.patch(`/meta-checklist/${row.id}`, form)
      const updated = res.data ?? { ...row, ...form }
      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        onSaved(updated)
      }, 1000)
    } catch (e: any) {
      alert(e.response?.data?.message || 'Erro ao salvar.')
    } finally {
      setIsSaving(false)
    }
  }

  const selectCls = 'w-full bg-[#f8fafc] border border-[#e3e8ef] rounded-lg h-10 px-3 text-[13px] outline-none focus:border-[#094780] focus:bg-white transition-all appearance-none cursor-pointer pr-8'
  const inputCls  = 'w-full bg-[#f8fafc] border border-[#e3e8ef] rounded-lg h-10 px-3 text-[13px] outline-none focus:border-[#094780] focus:bg-white transition-all'
  const labelCls  = 'text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block'
  const viewCls   = 'text-[13px] font-semibold text-[#1a2535] min-h-[22px] py-1'

  function ViewValue({ value }: { value: string }) {
    return value
      ? <p className={viewCls}>{value}</p>
      : <p className="text-slate-300 font-normal italic text-[12px] py-1">—</p>
  }

  const ufLabel = form.filial ? (UF_LABELS[form.filial.toUpperCase()] ?? form.filial) : null
  const ufColor = form.filial?.toUpperCase() === 'MA' ? '#2563eb' : form.filial?.toUpperCase() === 'PI' ? '#0f766e' : '#64748b'
  const ufBg    = form.filial?.toUpperCase() === 'MA' ? '#eff6ff' : form.filial?.toUpperCase() === 'PI' ? '#f0fdfa' : '#f8fafc'

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#111827]/60 backdrop-blur-md p-0 sm:p-6">
      <div className="bg-white w-full sm:max-w-xl rounded-t-3xl sm:rounded-2xl shadow-2xl border border-[#e3e8ef] animate-slideUp flex flex-col max-h-[92vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-[15px] font-bold text-[#1a2535] truncate">{form.nome || 'Registro'}</p>
              {ufLabel && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border"
                  style={{ color: ufColor, background: ufBg, borderColor: ufColor + '44' }}>
                  {ufLabel}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Matrícula: {form.matricula || '—'}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {!editMode ? (
              <button onClick={() => setEditMode(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-[12px] font-bold hover:bg-amber-100 transition-all">
                <Pencil size={13} /> Editar
              </button>
            ) : (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-400 text-white text-[12px] font-bold">
                <Pencil size={13} /> Editando
              </span>
            )}
            <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-all">
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto px-6 py-5 flex-1 space-y-5">
          <div>
            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mb-3">Colaborador</p>
            {editMode ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className={labelCls}>Nome</label>
                  <input value={form.nome} onChange={e => handleChange('nome', e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Matrícula</label>
                  <input value={form.matricula} onChange={e => handleChange('matricula', e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Status</label>
                  <div className="relative">
                    <select value={form.status} onChange={e => handleChange('status', e.target.value)} className={selectCls}>
                      {Object.keys(STATUS_CFG).map(s => <option key={s} value={s}>{STATUS_CFG[s].label}</option>)}
                    </select>
                    <ChevronDown size={12} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className={labelCls}>Nome</label>
                  <ViewValue value={form.nome} />
                </div>
                <div>
                  <label className={labelCls}>Matrícula</label>
                  <ViewValue value={form.matricula} />
                </div>
                <div>
                  <label className={labelCls}>Status</label>
                  <div className="mt-1">
                    <StatusSelect 
                        rowId={row.id} 
                        initialStatus={form.status} 
                        onUpdate={(s) => handleChange('status', s)} 
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-slate-50" />

          <div>
            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mb-3">Lotação</p>
            {editMode ? (
              <div className="grid grid-cols-2 gap-3">
                {[
                  { field: 'funcao', label: 'Função', opts: dynamicOptions.funcoes },
                  { field: 'area', label: 'Área', opts: dynamicOptions.areas },
                  { field: 'regional', label: 'Regional', opts: dynamicOptions.regionais },
                  { field: 'filial', label: 'Filial (UF)', opts: dynamicOptions.ufs },
                ].map(({ field, label, opts }) => (
                  <div key={field}>
                    <label className={labelCls}>{label}</label>
                    <div className="relative">
                      <select value={(form as any)[field]} onChange={e => handleChange(field, e.target.value)} className={selectCls}>
                        <option value="">Selecione...</option>
                        {opts.map((o: string) => <option key={o} value={o}>{field === 'filial' ? (UF_LABELS[o] ?? o) : o}</option>)}
                      </select>
                      <ChevronDown size={12} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {[
                  { field: 'funcao', label: 'Função' },
                  { field: 'area', label: 'Área' },
                  { field: 'regional', label: 'Regional' },
                  { field: 'filial', label: 'Filial (UF)' },
                ].map(({ field, label }) => (
                  <div key={field}>
                    <label className={labelCls}>{label}</label>
                    <ViewValue value={field === 'filial' ? (UF_LABELS[(form as any)[field]] ?? (form as any)[field]) : (form as any)[field]} />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-slate-50" />

          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Metas por Modalidade</p>
              {ufLabel && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                  style={{ color: ufColor, background: ufBg }}>
                  Campos de {ufLabel}
                </span>
              )}
            </div>
            <div className="bg-slate-50 rounded-xl overflow-hidden border border-slate-100">
              {modalFields.map((f, i) => {
                const val = (form as any)[f.key]
                const displayVal = val === null || val === undefined ? null : Number(val)
                return (
                  <div key={f.key} className={cn(
                    'flex items-center justify-between px-4 py-3 transition-colors',
                    i > 0 && 'border-t border-slate-100/70',
                  )}>
                    <div className="flex items-center gap-2.5">
                      <span className="text-base">{f.icon}</span>
                      <span className="text-[13px] font-semibold text-[#1a2535]">{f.label}</span>
                    </div>
                    {editMode ? (
                      <input
                        type="number"
                        min="0"
                        value={displayVal === null ? '' : displayVal}
                        onChange={e => handleNumericChange(f.key, e.target.value)}
                        placeholder="—"
                        className="w-20 text-right bg-white border border-[#e3e8ef] rounded-lg h-8 px-2 text-[13px] font-bold outline-none focus:border-[#094780] transition-all"
                      />
                    ) : (
                      <MetaCell value={displayVal} />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 flex gap-2">
          {editMode ? (
            <>
              <button onClick={() => { setForm(INITIAL); setEditMode(false) }} disabled={isSaving}
                className="flex-1 py-2.5 border border-[#e3e8ef] text-[#4b5563] rounded-xl text-[13px] font-medium hover:bg-slate-50 transition-all flex items-center justify-center gap-1.5">
                <Ban size={14} /> Cancelar
              </button>
              <button onClick={handleSave} disabled={isSaving || success}
                className="flex-1 py-2.5 bg-[#094780] text-white rounded-xl text-[13px] font-semibold hover:bg-[#0a5494] transition-all flex items-center justify-center gap-2">
                {success ? <><CheckCircle size={14} /> Salvo!</> : isSaving ? <Loader2 size={14} className="animate-spin" /> : <><Save size={14} /> Salvar</>}
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

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function MetaChecklistPage() {
  const { data: session } = useSession()
  const userData = session?.user as any
  const isAdmin  = userData?.role === 'admin'

  const [data,     setData  ] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [busca,           setBusca         ] = useState('')
  const [campoBusca,      setCampoBusca    ] = useState('todos')
  const [filtroStatus,    setFiltroStatus  ] = useState('')
  const [filtroFuncao,    setFiltroFuncao  ] = useState('')
  const [filtroArea,      setFiltroArea    ] = useState('')
  const [filtroUf,        setFiltroUf      ] = useState<string[]>([])
  const [filtroRegional, setFiltroRegional] = useState<string[]>([])
  const [filtroMes,       setFiltroMes     ] = useState('')
  const [mesesOptions,    setMesesOptions  ] = useState<{ value: string; label: string }[]>([])

  const [sortField,    setSortField   ] = useState<SortField>('nome')
  const [sortDir,      setSortDir     ] = useState<SortDir>('asc')
  const [currentPage,  setCurrentPage ] = useState(1)
  const PAGE_SIZE = 12

  const [deleteTarget, setDeleteTarget] = useState<any>(null)
  const [isDeleting,   setIsDeleting  ] = useState(false)
  const [editTarget,   setEditTarget  ] = useState<any>(null)

  const dynamicOptions = useMemo(() => {
    const areas = new Set<string>(); const funcoes = new Set<string>()
    const ufs = new Set<string>(); const regionais = new Set<string>()
    const statusSet = new Set<string>()
    const ufToRegionais: Record<string, Set<string>> = {}

    data.forEach(item => {
      if (item.area)     areas.add(item.area)
      if (item.funcao)   funcoes.add(item.funcao)
      if (item.filial)   ufs.add(item.filial)
      if (item.regional) regionais.add(item.regional)
      statusSet.add((item.status || 'ATIVO').toUpperCase())
      if (item.filial && item.regional) {
        if (!ufToRegionais[item.filial]) ufToRegionais[item.filial] = new Set()
        ufToRegionais[item.filial].add(item.regional)
      }
    })
    return {
      areas:     Array.from(areas).sort(),
      funcoes:   Array.from(funcoes).sort(),
      ufs:       Array.from(ufs).sort(),
      regionais: Array.from(regionais).sort(),
      status:    Array.from(statusSet).sort(),
      ufToRegionais,
    }
  }, [data])

  const ufsVisiveis = useMemo(() => {
    if (isAdmin) return dynamicOptions.ufs
    return dynamicOptions.ufs.filter((uf: string) => uf === userData?.uf)
  }, [dynamicOptions.ufs, userData, isAdmin])

  const regionaisDisponiveis = useMemo(() => {
    if (filtroUf.length === 0) return dynamicOptions.regionais
    const s = new Set<string>()
    filtroUf.forEach(uf => dynamicOptions.ufToRegionais[uf]?.forEach((r: string) => s.add(r)))
    return dynamicOptions.regionais.filter((r: string) => s.has(r))
  }, [dynamicOptions, filtroUf])

  useEffect(() => {
    api.get('/meta-checklist/competencias')
      .then(res => {
        const opts = res.data || []
        setMesesOptions(opts)
        if (opts.length > 0) setFiltroMes(opts[0].value)
      })
      .catch(console.error)
  }, [])

  useEffect(() => {
    if (filtroMes) {
      setCurrentPage(1) 
      fetchData(filtroMes)
    }
  }, [filtroMes])

  async function fetchData(competencia?: string) {
    setLoading(true)
    try {
      const res = await api.get('/meta-checklist', { params: { competencia: competencia ?? filtroMes } })
      setData(res.data as any[])
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  async function handleExport() {
    try {
      const XLSX = await import('xlsx')
      const exportData = filtered.map((s: any) => {
        const ufFields = getFieldsForUf(s.filial)
        const row: Record<string, any> = {
          'Nome':        s.nome    ?? '',
          'Matrícula':    s.matricula ?? '',
          'Status':       s.status  || 'Ativo',
          'Função':       s.funcao  ?? '',
          'Área':         s.area    ?? '',
          'Regional':     s.regional ?? '',
          'Filial (UF)': s.filial ?? '',
          'Data':         formatarDataBR(s.data),
        }
        ufFields.forEach(f => {
          row[f.label] = s[f.key] ?? ''
        })
        return row
      })
      const ws = XLSX.utils.json_to_sheet(exportData)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Meta Checklist')
      XLSX.writeFile(wb, `meta-checklist-${filtroMes.replace('/', '-')}.xlsx`)
    } catch (err) { console.error('Erro ao exportar:', err) }
  }

  function handleSort(f: SortField) {
    if (f === sortField) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(f); setSortDir('asc') }
    setCurrentPage(1)
  }

  function limparTudo() {
    setBusca(''); setCampoBusca('todos'); setFiltroStatus('')
    setFiltroFuncao(''); setFiltroArea('')
    setFiltroUf([]); setFiltroRegional([]); setCurrentPage(1)
  }

  async function handleDelete() {
    if (!deleteTarget || isDeleting) return
    setIsDeleting(true)
    try {
      await api.delete(`/meta-checklist/${deleteTarget.id}`)
      setData(prev => prev.filter(r => r.id !== deleteTarget.id))
      setDeleteTarget(null)
    } catch (e: any) { alert(e.response?.data?.message || 'Erro ao excluir.') }
    finally { setIsDeleting(false) }
  }

  const filtered = useMemo(() => {
    const t = busca.toLowerCase().trim()
    return data.filter(s => {
      if (t) {
        switch (campoBusca) {
          case 'nome':      if (!s.nome?.toLowerCase().includes(t)) return false; break
          case 'matricula': if (!s.matricula?.includes(t)) return false; break
          case 'funcao':    if (!s.funcao?.toLowerCase().includes(t)) return false; break
          default: if (!s.nome?.toLowerCase().includes(t) && !s.matricula?.includes(t) && !s.funcao?.toLowerCase().includes(t)) return false
        }
      }
      if (filtroStatus   && (s.status || 'ATIVO').toUpperCase() !== filtroStatus) return false
      if (filtroFuncao   && s.funcao !== filtroFuncao) return false
      if (filtroArea     && s.area !== filtroArea) return false
      if (filtroUf.length > 0       && !filtroUf.includes(s.filial))         return false
      if (filtroRegional.length > 0 && !filtroRegional.includes(s.regional)) return false
      return true
    }).sort((a, b) => {
      const diff = (a[sortField] || '').localeCompare(b[sortField] || '', 'pt-BR')
      return sortDir === 'asc' ? diff : -diff
    })
  }, [data, busca, campoBusca, filtroStatus, filtroFuncao, filtroArea, filtroUf, filtroRegional, sortField, sortDir])

  const tableFieldsFinal = useMemo(() => {
    const ufsNosFiltrados = Array.from(
      new Set(filtered.map((r: any) => (r.filial ?? '').toUpperCase()).filter(Boolean))
    ) as string[]
    const ufsReferencia = filtroUf.length > 0
      ? filtroUf.map(u => u.toUpperCase())
      : ufsNosFiltrados
    return getFieldsForUfs(ufsReferencia)
  }, [filtered, filtroUf])

  const paginated  = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const mesLabel   = mesesOptions.find(m => m.value === filtroMes)?.label ?? filtroMes
  const filtrosAtivos = [busca, filtroStatus, filtroFuncao, filtroArea, filtroUf.length > 0, filtroRegional.length > 0].filter(Boolean).length

  return (
    <DashboardLayout title="Meta Checklist" breadcrumb="SIGS / Gestão de Pessoas / Meta Checklist" navItems={navItems}>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Syne:wght@700;800&display=swap');
        .gp-root { font-family:'DM Sans',sans-serif; padding:16px; }
        .filter-wrap { background:#fff; border:1px solid #e3e8ef; border-radius:14px; margin-bottom:14px; overflow:hidden; }
        .filter-header { display:flex; align-items:center; justify-content:space-between; padding:10px 14px; border-bottom:1px solid #f1f5f9; }
        .filter-body { padding:14px 16px; display:flex; flex-direction:column; gap:12px; }
        .filter-row-main { display:flex; align-items:flex-end; gap:8px; flex-wrap:wrap; }
        .gp-select { width:100%; height:36px; appearance:none; background:#fff; border:1.5px solid #e3e8ef; border-radius:10px; padding:0 28px 0 10px; font-size:12px; cursor:pointer; }
        .gp-select.has-value { border-color:#094780; color:#094780; font-weight:600; background:#f0f6ff; }
        .gp-select-date { width:100%; height:40px; appearance:none; background:#f0f6ff; border:1.5px solid #094780; border-radius:10px; padding:0 36px 0 38px; font-size:13px; font-weight:700; color:#094780; cursor:pointer; }
        .search-container { display:flex; border:1.5px solid #094780; border-radius:10px; overflow:hidden; height:36px; background:#fff; }
        .search-select { border:none; background:#f8fafc; border-right:1px solid #e3e8ef; padding:0 8px; font-size:11.5px; font-weight:700; color:#094780; outline:none; cursor:pointer; min-width:90px; }
        .search-input-field { border:none; flex:1; padding:0 10px; font-size:13px; outline:none; min-width:80px; }
        .chip { display:inline-flex; align-items:center; gap:4px; padding:4px 11px; border-radius:99px; cursor:pointer; font-size:11px; font-weight:700; border:1.5px solid #e3e8ef; background:#fff; color:#64748b; transition:all .15s; }
        .chip-active { background:#094780 !important; color:#fff !important; border-color:#094780 !important; }
        .main-card { background:#fff; border:1px solid #e2e8f0; border-radius:18px; overflow:hidden; }
        .table-scroll { overflow-x:auto; }
        .gp-table { width:100%; border-collapse:collapse; min-width:900px; }
        .gp-table th { background:#f8fafc; padding:10px 12px; text-align:left; font-size:10px; font-weight:800; color:#8896ab; text-transform:uppercase; border-bottom:1px solid #e2e8f0; white-space:nowrap; }
        .gp-table th.sortable { cursor:pointer; user-select:none; }
        .gp-table th.sortable:hover { color:#094780; }
        .gp-table th.center { text-align:center; }
        .gp-table th.uf-ma { background:#eff6ff; color:#2563eb; }
        .gp-table th.uf-pi { background:#f0fdfa; color:#0f766e; }
        .gp-row td { padding:10px 12px; border-bottom:1px solid #f1f5f9; vertical-align:middle; font-size:13px; }
        .gp-row td.center { text-align:center; }
        .gp-row:hover td { background:#fafbfc; }
        .pag-wrap { display:flex; align-items:center; justify-content:space-between; padding:12px 18px; border-top:1px solid #f1f5f9; }
        .pg-btn { min-width:32px; height:32px; border-radius:8px; border:1.5px solid #e3e8ef; background:#fff; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:600; }
        .pg-btn:disabled { opacity:.4; cursor:not-allowed; }
        .btn-outline { background:#fff; color:#374151; padding:8px 13px; border-radius:12px; font-weight:700; font-size:12px; border:1.5px solid #e3e8ef; cursor:pointer; display:flex; align-items:center; gap:6px; transition:all .15s; }
        .btn-outline:hover { border-color:#094780; color:#094780; }
        @keyframes fadeIn  { from{opacity:0;transform:scale(.97)} to{opacity:1;transform:scale(1)} }
        @keyframes scaleIn { from{opacity:0;transform:scale(.95)} to{opacity:1;transform:scale(1)} }
        @keyframes slideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:none} }
        .animate-fadeIn  { animation: fadeIn  .15s ease forwards }
        .animate-scaleIn { animation: scaleIn .2s cubic-bezier(.22,.68,0,1.2) forwards }
        .animate-slideUp { animation: slideUp .25s ease forwards }
      `}} />

      <div className="gp-root">
        {/* Header */}
        <div className="flex justify-between items-start mb-4 flex-wrap gap-3">
          <div>
            <h2 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: '26px', color: '#0d1e33' }}>Meta Checklist</h2>
            <p className="text-[11px] text-[#8896ab] font-bold uppercase mt-1">
              {mesLabel || 'Carregando...'} · {filtered.length} registro(s)
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative flex items-center">
              <Calendar size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#094780] z-10" />
              <select value={filtroMes} onChange={e => { setFiltroMes(e.target.value); setCurrentPage(1) }} className="gp-select-date" style={{ minWidth: 180 }}>
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
          </div>
        </div>

        {/* Filtros */}
        <div className="filter-wrap">
          <div className="filter-header">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
              <SlidersHorizontal size={13} /> Filtros
              {filtrosAtivos > 0 && <span className="bg-[#094780] text-white px-1.5 py-0.5 rounded-full text-[10px]">{filtrosAtivos}</span>}
            </div>
            {filtrosAtivos > 0 && <button onClick={limparTudo} className="text-xs font-bold text-slate-400 hover:text-red-500">Limpar tudo</button>}
          </div>
          <div className="filter-body">
            <div className="filter-row-main">
              <div className="flex flex-col gap-1.5" style={{ flex: '0 0 auto', width: 320 }}>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Busca</span>
                <div className="search-container">
                  <select className="search-select" value={campoBusca} onChange={e => setCampoBusca(e.target.value)}>
                    <option value="todos">Todos</option>
                    <option value="nome">Nome</option>
                    <option value="matricula">Matrícula</option>
                    <option value="funcao">Função</option>
                  </select>
                  <input className="search-input-field" type="text" placeholder="Pesquisar..." value={busca}
                    onChange={e => { setBusca(e.target.value); setCurrentPage(1) }} />
                  <div className="flex items-center pr-3">
                    <Search size={14} className="text-slate-400" />
                  </div>
                </div>
              </div>
              <div className="flex gap-2 flex-1" style={{ minWidth: 0 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <FilterSelect label="Status" value={filtroStatus} onChange={(v: string) => { setFiltroStatus(v); setCurrentPage(1) }} options={dynamicOptions.status} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <FilterSelect label="Função" value={filtroFuncao} onChange={(v: string) => { setFiltroFuncao(v); setCurrentPage(1) }} options={dynamicOptions.funcoes} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <FilterSelect label="Área" value={filtroArea} onChange={(v: string) => { setFiltroArea(v); setCurrentPage(1) }} options={dynamicOptions.areas} />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-x-10 gap-y-3">
              <ChipFilter label="Filial (UF)" options={ufsVisiveis} value={filtroUf}
                onChange={(v: any) => { setFiltroUf(v); setCurrentPage(1) }}
                renderLabel={(uf: any) => UF_LABELS[uf] ?? uf} />
              {regionaisDisponiveis.length > 0 && (
                <ChipFilter label="Regional" options={regionaisDisponiveis} value={filtroRegional}
                  onChange={(v: any) => { setFiltroRegional(v); setCurrentPage(1) }} />
              )}
            </div>
          </div>
        </div>

        {/* Tabela */}
        <div className="main-card">
          {loading ? (
            <div className="py-20 text-center animate-pulse text-slate-400 font-bold">Carregando dados de {mesLabel}...</div>
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
                      <th className="sortable" onClick={() => handleSort('funcao')}>
                        Função / Área {sortField === 'funcao' && (sortDir === 'asc' ? '↑' : '↓')}
                      </th>
                      <th className="sortable" onClick={() => handleSort('regional')}>
                        Filial / Regional {sortField === 'regional' && (sortDir === 'asc' ? '↑' : '↓')}
                      </th>
                      <th className="center">Status</th>
                      {tableFieldsFinal.map(f => {
                        const usadoPorMA = FIELDS_MA.some(fm => fm.key === f.key)
                        const usadoPorPI = FIELDS_PI.some(fp => fp.key === f.key)
                        const thClass = usadoPorMA && usadoPorPI
                          ? 'center'
                          : usadoPorMA ? 'center uf-ma'
                          : 'center uf-pi'
                        return (
                          <th key={f.key} className={thClass} title={f.label}>
                            {f.short}
                          </th>
                        )
                      })}
                      <th className="center">Data</th>
                      {isAdmin && <th style={{ width: 52 }} />}
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map((s: any) => (
                      <tr key={s.id} className="gp-row">
                        <td>
                          <div className="font-bold text-[#1a2535] uppercase truncate max-w-[200px]" title={s.nome}>
                            {s.nome}
                          </div>
                          <div className="text-[10px] text-slate-400 font-bold">Matrícula: {s.matricula || '—'}</div>
                        </td>
                        <td>
                          <div className="flex items-center gap-1.5 text-slate-700 font-bold">
                            <Briefcase size={12} className="text-slate-400" /> {s.funcao || 'N/I'}
                          </div>
                          <div className="text-[10px] text-[#8896ab] font-bold mt-0.5 uppercase">{s.area}</div>
                        </td>
                        <td>
                          <div className="font-bold text-slate-700">{s.filial}</div>
                          <div className="text-[10px] text-slate-400 font-bold">{s.regional}</div>
                        </td>
                        <td className="center w-[90px]">
                            <StatusSelect 
                                rowId={s.id} 
                                initialStatus={s.status} 
                                onUpdate={(newStatus) => {
                                    setData(prev => prev.map(item => item.id === s.id ? { ...item, status: newStatus } : item))
                                }}
                            />
                        </td>
                        {tableFieldsFinal.map(f => (
                          <td key={f.key} className="center">
                            <MetaCellForUf
                              value={s[f.key]}
                              fieldKey={f.key}
                              uf={s.filial}
                            />
                          </td>
                        ))}
                        <td className="center">
                          <div className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-md inline-block">
                            {formatarDataBR(s.data)}
                          </div>
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

      {/* Modais */}
      {isAdmin && deleteTarget && (
        <DeleteModal row={deleteTarget} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} isDeleting={isDeleting} />
      )}
      {editTarget && (
        <EditModal
          row={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={updated => {
            setData(prev => prev.map(r => r.id === updated.id ? updated : r))
            setEditTarget(null)
          }}
          dynamicOptions={dynamicOptions}
        />
      )}
    </DashboardLayout>
  )
}