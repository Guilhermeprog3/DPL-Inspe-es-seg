'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import {
  Search, SlidersHorizontal, Download, LayoutDashboard,
  AlertCircle, ChevronLeft, RefreshCw, Calendar,
  ChevronDown, MoreVertical, Edit2, Loader2,
  CheckCircle, ChevronRight, X, Pencil, Save, Ban,
  Briefcase, Plus, Trash2,
  BarChart2,
  CheckSquare,
  Users,
  FlaskConical,
  Wrench,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useSession } from 'next-auth/react'
import api from '@/lib/api'

const navItems = [
  { section: 'Gestão de Funcionários' },
  { label: 'Dashboard', href: '/gestao-funcionarios', icon: LayoutDashboard },
  { section: 'Módulos' },
  { label: 'Taxa de Contato', href: '/gestao-funcionarios/taxa-contato', icon: BarChart2 },
  { label: 'Meta Checklist', href: '/gestao-funcionarios/meta-checklist', icon: CheckSquare },
]

const STATUS_CFG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  'ATIVO':                             { label: 'Ativo',                        color: '#10b981', bg: '#f0fdf4', border: '#bbf7d0' },
  'INATIVO':                           { label: 'Inativo',                      color: '#64748b', bg: '#f8fafc', border: '#e2e8f0' },
  'FÉRIAS':                            { label: 'Férias',                       color: '#f59e0b', bg: '#fffbeb', border: '#fde68a' },
  'FERIAS':                            { label: 'Férias',                       color: '#f59e0b', bg: '#fffbeb', border: '#fde68a' },
  'AFASTADO':                          { label: 'Afastado',                     color: '#ef4444', bg: '#fef2f2', border: '#fecaca' },
  'DESLIGADO':                         { label: 'Desligado',                    color: '#64748b', bg: '#f8fafc', border: '#e2e8f0' },
  'PENDENTE':                          { label: 'Pendente',                     color: '#ef4444', bg: '#fef2f2', border: '#fecaca' },
  'ADM':                               { label: 'ADM',                          color: '#094780', bg: '#eff6ff', border: '#dbeafe' },
  'ADMISSÃO PROX.MÊS':                 { label: 'Admissão Próx. Mês',           color: '#094780', bg: '#eff6ff', border: '#dbeafe' },
  'AF.AC.TRABALHO':                    { label: 'Af. Ac. Trabalho',             color: '#ef4444', bg: '#fef2f2', border: '#fecaca' },
  'AF.PREVIDÊNCIA':                    { label: 'Af. Previdência',              color: '#ef4444', bg: '#fef2f2', border: '#fecaca' },
  'AFASTAMENTO MEDICO':                { label: 'Afastamento Médico',           color: '#ef4444', bg: '#fef2f2', border: '#fecaca' },
  'APOS. POR INCAPACIDADE PERMANENTE': { label: 'Apos. Incapacidade Perm.',     color: '#64748b', bg: '#f8fafc', border: '#e2e8f0' },
  'ATESTADO':                          { label: 'Atestado',                     color: '#f59e0b', bg: '#fffbeb', border: '#fde68a' },
  'AVISO PRÉVIO':                      { label: 'Aviso Prévio',                 color: '#64748b', bg: '#f8fafc', border: '#e2e8f0' },
  'BASE':                              { label: 'Base',                         color: '#094780', bg: '#eff6ff', border: '#dbeafe' },
  'CONTRATO DE TRABALHO SUSPENSO':     { label: 'Contrato Suspenso',            color: '#64748b', bg: '#f8fafc', border: '#e2e8f0' },
  'DEMITIDO':                          { label: 'Demitido',                     color: '#64748b', bg: '#f8fafc', border: '#e2e8f0' },
  'FISCAL':                            { label: 'Fiscal',                       color: '#094780', bg: '#eff6ff', border: '#dbeafe' },
  'INSS':                              { label: 'INSS',                         color: '#ef4444', bg: '#fef2f2', border: '#fecaca' },
  'LICENÇA S/VENC':                    { label: 'Licença s/ Venc.',             color: '#64748b', bg: '#f8fafc', border: '#e2e8f0' },
  'PRISÃO / CÁRCERE':                  { label: 'Prisão / Cárcere',             color: '#1e293b', bg: '#f1f5f9', border: '#cbd5e1' },
  'PROMOVIDO':                         { label: 'Promovido',                    color: '#10b981', bg: '#f0fdf4', border: '#bbf7d0' },
  'SUPERVISOR':                        { label: 'Supervisor',                   color: '#094780', bg: '#eff6ff', border: '#dbeafe' },
  'TRANSFERIDO':                       { label: 'Transferido',                  color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
}

const STATUS_OPTIONS = [
  'ATIVO', 'INATIVO', 'FÉRIAS', 'FERIAS', 'AFASTADO', 'DESLIGADO', 'PENDENTE',
  'ADM', 'ADMISSÃO PROX.MÊS', 'AF.AC.TRABALHO', 'AF.PREVIDÊNCIA',
  'AFASTAMENTO MEDICO', 'APOS. POR INCAPACIDADE PERMANENTE', 'ATESTADO',
  'AVISO PRÉVIO', 'BASE', 'CONTRATO DE TRABALHO SUSPENSO', 'DEMITIDO',
  'FISCAL', 'INSS', 'LICENÇA S/VENC', 'PRISÃO / CÁRCERE', 'PROMOVIDO',
  'SUPERVISOR', 'TRANSFERIDO',
]

const UF_LABELS: Record<string, string> = { PI: 'Piauí', MA: 'Maranhão' }

type ChecklistField = { key: string; label: string; short: string; icon: string }

const FIELDS_MA: ChecklistField[] = [
  { key: 'metaDds',             label: 'Diálogo de Segurança',  short: 'DDS',      icon: '📋' },
  { key: 'acaoComunidade',      label: 'Ação Comunidade',        short: 'Comuni.',  icon: '🤝' },
  { key: 'blitzCampo',          label: 'Blitz Campo',           short: 'Blitz',    icon: '🔦' },
  { key: 'inspecEpcFerramenta', label: 'Insp. EPC/Ferramenta',  short: 'EPC/Fer.', icon: '🔧' },
  { key: 'inspecEpi',           label: 'Insp. EPI',             short: 'EPI',      icon: '🦺' },
  { key: 'inspecEdificacao',    label: 'Insp. Edificação',      short: 'Edific.',  icon: '🏗️' },
  { key: 'inspecEquipamento',   label: 'Insp. Equipamento',     short: 'Equip.',   icon: '⚙️' },
  { key: 'inspecVeiculo',       label: 'Insp. Veículo',         short: 'Veículo',  icon: '🚗' },
]

const FIELDS_PI: ChecklistField[] = [
  { key: 'metaDds',        label: 'Meta Diálogo de Segurança', short: 'DDS',     icon: '📋' },
  { key: 'acaoComunidade', label: 'Meta Palestra Comunidade',  short: 'Palest.', icon: '🤝' },
  { key: 'metaDinamica',   label: 'Meta Dinâmica',             short: 'Dinâm.',  icon: '🎯' },
  { key: 'metaEstatica',   label: 'Meta Estática',             short: 'Estát.',   icon: '📌' },
]

const ALL_CHECKLIST_FIELDS: ChecklistField[] = [
  { key: 'metaDds',             label: 'Meta DDS',              short: 'DDS',      icon: '📋' },
  { key: 'acaoComunidade',      label: 'Ação Comunidade',        short: 'Comuni.',  icon: '🤝' },
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
  return getFieldsForUf(uf).some(f => f.key === fieldKey)
}

function formatarDataBR(dataStr: string | null | undefined): string {
  if (!dataStr) return '—'
  try {
    const dataApenas = dataStr.split(' ')[0]
    const [ano, mes, dia] = dataApenas.split('-')
    if (ano && mes && dia) return `${dia}/${mes}/${ano}`
    return dataStr
  } catch {
    return dataStr
  }
}

type SortField = 'nome' | 'funcao' | 'area' | 'regional'
type SortDir   = 'asc' | 'desc'

// ── TAB TYPE ──
type ActiveTab = 'colaborador' | 'funcao'

function StatusSelector({ row, onStatusChange, canEdit }: {
  row: any
  onStatusChange: (id: any, newStatus: string) => void
  canEdit: boolean
}) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 })
  const btnRef = useRef<HTMLButtonElement>(null)
  const dropRef = useRef<HTMLDivElement>(null)

  const currentKey = (row.status || 'ATIVO').toUpperCase()
  const cfg = STATUS_CFG[currentKey] ?? STATUS_CFG['ATIVO']

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
    if (!canEdit || !btnRef.current) return
    const rect = btnRef.current.getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom
    const top = spaceBelow > 220 ? rect.bottom + 4 : rect.top - 220
    setDropdownPos({ top, left: rect.left })
    setOpen(o => !o)
  }

  async function handleSelect(status: string) {
    setOpen(false)
    if (status === currentKey) return
    setSaving(true)
    try {
      await api.patch(`/meta-checklist/${row.id}`, { status })
      onStatusChange(row.id, status)
    } catch (e: any) {
      alert(e.response?.data?.message || 'Erro ao atualizar status.')
    } finally {
      setSaving(false)
    }
  }

  if (!canEdit) {
    return (
      <span
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border"
        style={{ background: cfg.bg, color: cfg.color, borderColor: cfg.border }}
      >
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.color }} />
        {cfg.label}
      </span>
    )
  }

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
          className="bg-white border border-slate-200 rounded-xl shadow-xl w-52 py-1 animate-fadeIn max-h-[220px] overflow-y-auto"
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

function MetaCellForUf({ value, fieldKey, uf }: { value: number | null | undefined; fieldKey: string; uf: string | null | undefined }) {
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
          <button
            key={opt}
            onClick={() => value.includes(opt) ? onChange(value.filter((v: any) => v !== opt)) : onChange([...value, opt])}
            className={cn('chip', (value.includes(opt) || options.length === 1) && 'chip-active')}
          >
            {renderLabel ? renderLabel(opt) : opt}
          </button>
        ))}
      </div>
    </div>
  )
}

function ActionMenu({ row, onEdit, onDeleteRequest }: { row: any; onEdit: (row: any) => void; onDeleteRequest: (row: any) => void }) {
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

  function handleOpen() {
    if (!btnRef.current) return
    const rect = btnRef.current.getBoundingClientRect()
    const menuHeight = 85
    const spaceBelow = window.innerHeight - rect.bottom
    const top = spaceBelow > menuHeight + 8 ? rect.bottom + 4 : rect.top - menuHeight - 4
    const left = rect.right - 160
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

      {open && (
        <div
          ref={menuRef}
          className="bg-white border border-slate-200 rounded-xl shadow-xl w-40 py-1 animate-fadeIn"
          style={{ position: 'fixed', top: menuPos.top, left: menuPos.left, zIndex: 99999 }}
        >
          <button
            onClick={() => { setOpen(false); onEdit(row) }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[12.5px] font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Edit2 size={14} className="text-[#094780]" /> Editar
          </button>
          
          <div className="border-t border-slate-100 my-1" />
          
          <button
            onClick={() => { setOpen(false); onDeleteRequest(row) }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[12.5px] font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <Trash2 size={14} className="text-red-500" /> Excluir
          </button>
        </div>
      )}
    </>
  )
}

function ConfirmDeleteModal({ row, onClose, onConfirm }: { row: any; onClose: () => void; onConfirm: () => Promise<void> }) {
  const [isDeleting, setIsDeleting] = useState(false)

  async function handleConfirm() {
    setIsDeleting(true)
    try {
      await onConfirm()
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-[#111827]/60 backdrop-blur-md p-4 animate-fadeIn">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-150 p-6 animate-scaleIn flex flex-col items-center text-center">
        <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-500 mb-4 border border-red-100">
          <Trash2 size={22} />
        </div>
        
        <h3 className="text-[16px] font-bold text-[#1a2535]">Excluir Registro de Metas</h3>
        <p className="text-[13px] text-slate-500 mt-2 max-w-sm">
          Você tem certeza que deseja remover as metas de <strong className="text-slate-800 uppercase">{row?.nome || 'este colaborador'}</strong>? Essa ação é permanente e não poderá ser desfeita.
        </p>

        <div className="flex gap-2 w-full mt-6">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 h-10 border border-[#e3e8ef] text-[#4b5563] rounded-xl text-[13px] font-medium hover:bg-slate-50 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={isDeleting}
            className="flex-1 h-10 bg-red-650 hover:bg-red-700 text-white rounded-xl text-[13px] font-semibold transition-all flex items-center justify-center gap-2"
            style={{ backgroundColor: '#dc2626' }}
          >
            {isDeleting ? <Loader2 size={14} className="animate-spin" /> : 'Confirmar Exclusão'}
          </button>
        </div>
      </div>
    </div>
  )
}

function EditModal({ row, onClose, onSaved, dynamicOptions }: {
  row: any
  onClose: () => void
  onSaved: (updated: any) => void
  dynamicOptions: any
}) {
  const isCreateMode = !row
  const [editMode, setEditMode] = useState(isCreateMode)
  const [isSaving, setIsSaving] = useState(false)
  const [success,  setSuccess ] = useState(false)

  const INITIAL = {
    nome:                row?.nome                ?? '',
    matricula:           row?.matricula           ?? '',
    status:              row?.status              ?? 'ATIVO',
    funcao:              row?.funcao              ?? '',
    area:                row?.area                ?? '',
    regional:            row?.regional            ?? '',
    filial:              row?.filial              ?? '',
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

  const [colaboradoresRepo,  setColaboradoresRepo ] = useState<any[]>([])
  const [colabSelecionado,   setColabSelecionado  ] = useState<any>(isCreateMode ? null : { nome: row?.nome, chapa: row?.matricula })
  const [nomeColabPesquisa,  setNomeColabPesquisa ] = useState(row?.nome      ?? '')
  const [matColabPesquisa,   setMatColabPesquisa  ] = useState(row?.matricula ?? '')
  const [showColabNome,      setShowColabNome     ] = useState(false)
  const [showColabMat,       setShowColabMat      ] = useState(false)

  useEffect(() => {
    api.get('/base-gente/recentes')
      .then(r => setColaboradoresRepo(r.data))
      .catch(console.error)
  }, [])

  const colabsFiltradosNome = useMemo(() => {
    const t = nomeColabPesquisa.trim().toLowerCase()
    if (t.length < 2) return []
    return colaboradoresRepo
      .filter(c => String(c.nome || '').toLowerCase().includes(t))
      .slice(0, 8)
  }, [nomeColabPesquisa, colaboradoresRepo])

  const colabsFiltradosMat = useMemo(() => {
    const t = matColabPesquisa.trim()
    if (!t) return []
    return colaboradoresRepo
      .filter(c => String(c.chapa || '').includes(t))
      .slice(0, 8)
  }, [matColabPesquisa, colaboradoresRepo])

  function selecionarColab(item: any) {
    setColabSelecionado(item)
    setNomeColabPesquisa(item.nome)
    setMatColabPesquisa(item.chapa)
    setForm(f => ({ 
      ...f, 
      nome: item.nome, 
      matricula: item.chapa,
      funcao: item.funcao || f.funcao,
      area: item.area || f.area,
      regional: item.regional || f.regional,
      filial: item.uf || item.filial || f.filial
    }))
    setShowColabNome(false)
    setShowColabMat(false)
  }

  const modalFields = useMemo(() => getFieldsForUf(form.filial), [form.filial])

  const regionaisFiltradasNoModal = useMemo(() => {
    if (!form.filial) return dynamicOptions.regionais
    const s = dynamicOptions.ufToRegionais[form.filial.toUpperCase()]
    if (!s) return []
    return dynamicOptions.regionais.filter((r: string) => s.has(r))
  }, [dynamicOptions, form.filial])

  function handleChange(field: string, value: any) {
    setForm(f => {
      const updated = { ...f, [field]: value }
      if (field === 'filial') {
        const permitidas = dynamicOptions.ufToRegionais[value.toUpperCase()]
        if (!permitidas || !permitidas.has(f.regional)) {
          updated.regional = ''
        }
      }
      return updated
    })
  }

  function handleNumericChange(field: string, raw: string) {
    if (raw === '') {
      setForm(f => ({ ...f, [field]: null }))
    } else {
      const num = parseInt(raw, 10)
      if (!isNaN(num) && num >= 0) setForm(f => ({ ...f, [field]: num }))
    }
  }

  function handleCancel() {
    if (isCreateMode) {
      onClose()
    } else {
      setForm(INITIAL)
      setNomeColabPesquisa(row?.nome      ?? '')
      setMatColabPesquisa(row?.matricula  ?? '')
      setColabSelecionado({ nome: row?.nome, chapa: row?.matricula })
      setEditMode(false)
    }
  }

  async function handleSave() {
    if (isCreateMode && (!form.nome || !form.matricula)) {
      alert('Por favor, selecione um colaborador válido da lista de sugestões.')
      return
    }
    setIsSaving(true)
    try {
      let res
      if (isCreateMode) {
        res = await api.post('/meta-checklist', form)
      } else {
        res = await api.patch(`/meta-checklist/${row.id}`, form)
      }
      
      const backendRow = res.data ?? {}
      const idFinal = backendRow.id ?? backendRow.ID ?? row?.id
      const updated = { ...row, ...form, ...backendRow, id: idFinal }
      
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

  const selectCls    = 'w-full bg-[#f8fafc] border border-[#e3e8ef] rounded-lg h-10 px-3 text-[13px] outline-none focus:border-[#094780] focus:bg-white transition-all appearance-none cursor-pointer pr-8'
  const inputSelCls  = 'w-full bg-[#f8fafc] border rounded-lg h-10 px-3 text-[13px] outline-none transition-all'
  const labelCls     = 'text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block'
  const viewCls      = 'text-[13px] font-semibold text-[#1a2535] min-h-[22px] py-1 font-weight: 500'

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
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-[15px] font-bold text-[#1a2535] truncate">
                {isCreateMode ? 'Novo Cadastro de Meta' : (form.nome || 'Registro')}
              </p>
              {ufLabel && (
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full border"
                  style={{ color: ufColor, background: ufBg, borderColor: ufColor + '44' }}
                >
                  {ufLabel}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {isCreateMode ? 'Vincule um funcionário ativo e distribua suas metas mensais' : `Matrícula: ${form.matricula || '—'}`}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {!isCreateMode && (
              !editMode ? (
                <button
                  onClick={() => setEditMode(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-[12px] font-bold hover:bg-amber-100 transition-all"
                >
                  <Pencil size={13} /> Editar
                </button>
              ) : (
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-400 text-white text-[12px] font-bold">
                  <Pencil size={13} /> Editando
                </span>
              )
            )}
            <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-all">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Body */}
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
                    className={cn(
                      inputSelCls,
                      colabSelecionado ? 'border-emerald-500 bg-emerald-50/30' : 'border-[#e3e8ef] focus:border-[#094780] focus:bg-white'
                    )}
                    onChange={e => {
                      setNomeColabPesquisa(e.target.value.replace(/[0-9]/g, ''))
                      setColabSelecionado(null)
                      setForm(f => ({ ...f, nome: '', matricula: '' }))
                      setShowColabNome(true)
                    }}
                    onFocus={() => setShowColabNome(true)}
                    onBlur={() => setTimeout(() => setShowColabNome(false), 200)}
                  />
                  {colabSelecionado && <CheckCircle size={13} className="absolute right-3 top-[38px] text-emerald-500 pointer-events-none" />}
                  {showColabNome && colabsFiltradosNome.length > 0 && (
                    <div className="absolute left-0 right-0 top-[calc(100%+2px)] z-[200] bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                      {colabsFiltradosNome.map((c, i) => (
                        <div key={i} className="p-3 hover:bg-blue-50 cursor-pointer text-xs border-b last:border-0" onMouseDown={() => selecionarColab(c)}>
                          <p className="font-bold text-slate-700 uppercase">{c.nome}</p>
                          <p className="text-slate-400">Matrícula: {c.chapa}</p>
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
                    placeholder="Buscar matrícula..."
                    className={cn(
                      inputSelCls,
                      colabSelecionado ? 'border-emerald-500 bg-emerald-50/30' : 'border-[#e3e8ef] focus:border-[#094780] focus:bg-white'
                    )}
                    onChange={e => {
                      setMatColabPesquisa(e.target.value.replace(/[^0-9]/g, ''))
                      setColabSelecionado(null)
                      setForm(f => ({ ...f, nome: '', matricula: '' }))
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

                <div className="col-span-2">
                  <label className={labelCls}>Status</label>
                  <div className="relative">
                    <select value={form.status.toUpperCase()} onChange={e => handleChange('status', e.target.value)} className={selectCls}>
                      {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_CFG[s]?.label ?? s}</option>)}
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
                    {(() => {
                      const key = (form.status || 'ATIVO').toUpperCase()
                      const c = STATUS_CFG[key] ?? STATUS_CFG['ATIVO']
                      return (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border" style={{ background: c.bg, color: c.color, borderColor: c.border }}>
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: c.color }} />
                          {c.label}
                        </span>
                      )
                    })()}
                  </div>
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
                {[
                  { field: 'funcao',   label: 'Função',     opts: dynamicOptions.funcoes },
                  { field: 'area',     label: 'Área',        opts: dynamicOptions.areas },
                  { field: 'filial',   label: 'Filial (UF)', opts: dynamicOptions.ufs },
                  { field: 'regional', label: 'Regional',    opts: regionaisFiltradasNoModal },
                ].map(({ field, label, opts }) => (
                  <div key={field}>
                    <label className={labelCls}>{label}</label>
                    <div className="relative">
                      <select 
                        value={(form as any)[field]} 
                        onChange={e => handleChange(field, e.target.value)} 
                        className={selectCls}
                        disabled={field === 'regional' && !form.filial}
                      >
                        <option value="">{field === 'regional' && !form.filial ? "Selecione a Filial primeiro..." : "Selecione..."}</option>
                        {opts.map((o: string) => (
                          <option key={o} value={o}>{field === 'filial' ? (UF_LABELS[o] ?? o) : o}</option>
                        ))}
                      </select>
                      <ChevronDown size={12} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {[
                  { field: 'funcao',   label: 'Função' },
                  { field: 'area',     label: 'Área' },
                  { field: 'regional', label: 'Regional' },
                  { field: 'filial',   label: 'Filial (UF)' },
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

          {/* Seção Metas */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Metas por Modalidade</p>
              {ufLabel && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ color: ufColor, background: ufBg }}>
                  Campos de {ufLabel}
                </span>
              )}
            </div>
            <div className="bg-slate-50 rounded-xl overflow-hidden border border-slate-100">
              {modalFields.map((f, i) => {
                const val = (form as any)[f.key]
                const displayVal = val === null || val === undefined ? null : Number(val)
                return (
                  <div key={f.key} className={cn('flex items-center justify-between px-4 py-3 transition-colors', i > 0 && 'border-t border-slate-100/70')}>
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

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex gap-2">
          {editMode ? (
            <>
              <button onClick={handleCancel} disabled={isSaving} className="flex-1 py-2.5 border border-[#e3e8ef] text-[#4b5563] rounded-xl text-[13px] font-medium hover:bg-slate-50 transition-all flex items-center justify-center gap-1.5">
                <Ban size={14} /> Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving || success || (isCreateMode && !colabSelecionado)}
                className={cn(
                  "flex-1 py-2.5 rounded-xl text-[13px] font-semibold transition-all flex items-center justify-center gap-2 text-white",
                  (!isCreateMode || colabSelecionado) ? "bg-[#094780] hover:bg-[#0a5494] cursor-pointer" : "bg-slate-300 cursor-not-allowed"
                )}
              >
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

// ── ABA: METAS POR FUNÇÃO (Em Produção) ──
function MetasPorFuncaoTab() {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-6 select-none">
      <div className="relative mb-8">
        {/* Ícones decorativos ao redor */}
        <div className="absolute -top-4 -left-8 w-10 h-10 rounded-xl bg-[#eff6ff] border border-[#dbeafe] flex items-center justify-center opacity-60 rotate-[-12deg]">
          <Wrench size={16} className="text-[#2563eb]" />
        </div>
        <div className="absolute -top-2 -right-8 w-10 h-10 rounded-xl bg-[#f0fdfa] border border-[#ccfbf1] flex items-center justify-center opacity-60 rotate-[10deg]">
          <BarChart2 size={16} className="text-[#0f766e]" />
        </div>
        <div className="absolute -bottom-4 -left-4 w-8 h-8 rounded-lg bg-[#fffbeb] border border-[#fde68a] flex items-center justify-center opacity-50 rotate-[6deg]">
          <FlaskConical size={13} className="text-[#d97706]" />
        </div>

        {/* Ícone principal */}
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#094780] to-[#1d6fb5] flex items-center justify-center shadow-lg shadow-[#094780]/20">
          <Users size={36} className="text-white" />
        </div>
      </div>

      {/* Badge de status */}
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 mb-5">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
        </span>
        <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Em desenvolvimento</span>
      </div>

      <h3 className="text-[22px] font-black text-[#0d1e33] mb-2" style={{ fontFamily: 'Syne, sans-serif' }}>
        Metas por Função
      </h3>
      <p className="text-[13px] text-slate-500 text-center max-w-sm leading-relaxed">
        Esta funcionalidade está sendo desenvolvida e em breve estará disponível. 
        Aqui você poderá visualizar e gerenciar metas agrupadas por função dos colaboradores.
      </p>

      {/* Linha decorativa de features futuras */}
      <div className="mt-10 grid grid-cols-3 gap-3 w-full max-w-sm">
        {[
          { icon: '📊', label: 'Agrupamento por função' },
          { icon: '📈', label: 'Análise comparativa' },
          { icon: '🎯', label: 'Metas consolidadas' },
        ].map((item, i) => (
          <div
            key={i}
            className="flex flex-col items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-100 opacity-50"
          >
            <span className="text-xl">{item.icon}</span>
            <span className="text-[10px] font-bold text-slate-500 text-center leading-tight">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── COMPONENTE PRINCIPAL ──
export default function MetaChecklistPage() {
  const { data: session } = useSession()
  const userData = session?.user as any
  const isAdmin  = userData?.role === 'admin'

  // ── Estado da aba ativa ──
  const [activeTab, setActiveTab] = useState<ActiveTab>('colaborador')

  const [data,    setData  ] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [busca,           setBusca         ] = useState('')
  const [campoBusca,      setCampoBusca    ] = useState('todos')
  const [filtroStatus,    setFiltroStatus  ] = useState('')
  const [filtroFuncao,    setFiltroFuncao  ] = useState('')
  const [filtroArea,      setFiltroArea    ] = useState('')
  const [filtroUf,        setFiltroUf      ] = useState<string[]>([])
  const [filtroRegional,  setFiltroRegional] = useState<string[]>([])
  const [filtroMes,       setFiltroMes     ] = useState('')
  const [mesesOptions,    setMesesOptions  ] = useState<{ value: string; label: string }[]>([])

  const [sortField,    setSortField   ] = useState<SortField>('nome')
  const [sortDir,      setSortDir     ] = useState<SortDir>('asc')
  const [currentPage,  setCurrentPage ] = useState(1)
  const [pageSize,     setPageSize    ] = useState(10)

  const [editTarget,    setEditTarget   ] = useState<any>(null)
  const [deleteTarget,  setDeleteTarget ] = useState<any>(null)
  const [isCreateOpen,  setIsCreateOpen ] = useState(false)

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
        const uKey = item.filial.toUpperCase()
        if (!ufToRegionais[uKey]) ufToRegionais[uKey] = new Set()
        ufToRegionais[uKey].add(item.regional)
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
    filtroUf.forEach(uf => dynamicOptions.ufToRegionais[uf.toUpperCase()]?.forEach((r: string) => s.add(r)))
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

  async function handleDeleteConfirm() {
    if (!deleteTarget) return
    try {
      await api.delete(`/meta-checklist/${deleteTarget.id}`)
      setData(prev => prev.filter(item => item.id !== deleteTarget.id))
      setDeleteTarget(null)
    } catch (e: any) {
      alert(e.response?.data?.message || 'Erro ao excluir o registro.')
    }
  }

  async function handleExport() {
    try {
      const XLSX = await import('xlsx')
      const exportData = filtered.map((s: any) => {
        const ufFields = getFieldsForUf(s.filial)
        const row: Record<string, any> = {
          'Nome':        s.nome        ?? '',
          'Matrícula':   s.matricula   ?? '',
          'Status':      s.status      || 'Ativo',
          'Função':      s.funcao      ?? '',
          'Área':        s.area        ?? '',
          'Regional':    s.regional    ?? '',
          'Filial (UF)': s.filial      ?? '',
          'Data':        formatarDataBR(s.data),
        }
        ufFields.forEach(f => { row[f.label] = s[f.key] ?? '' })
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
    const ufsReferencia = filtroUf.length > 0 ? filtroUf.map(u => u.toUpperCase()) : ufsNosFiltrados
    return getFieldsForUfs(ufsReferencia)
  }, [filtered, filtroUf])

  const paginated  = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
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
        /* Tabs */
        .tab-bar { display:flex; background:#f8fafc; border:1px solid #e2e8f0; border-radius:14px; padding:4px; gap:2px; width:fit-content; }
        .tab-btn { display:flex; align-items:center; gap:6px; padding:7px 16px; border-radius:10px; font-size:12px; font-weight:700; cursor:pointer; border:none; background:transparent; color:#64748b; transition:all .18s; white-space:nowrap; }
        .tab-btn:hover { color:#094780; background:#fff; }
        .tab-btn.tab-active { background:#fff; color:#094780; box-shadow:0 1px 4px rgba(9,71,128,.10); border:1px solid #e2e8f0; }
        .tab-btn.tab-active svg { color:#094780; }
        @keyframes fadeIn  { from{opacity:0;transform:scale(.97)} to{opacity:1;transform:scale(1)} }
        @keyframes scaleIn { from{opacity:0;transform:scale(.95)} to{opacity:1;transform:scale(1)} }
        @keyframes slideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:none} }
        @keyframes ping { 75%,100%{transform:scale(2);opacity:0} }
        .animate-ping { animation:ping 1s cubic-bezier(0,0,.2,1) infinite }
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
            {isAdmin && activeTab === 'colaborador' && (
              <button
                onClick={() => setIsCreateOpen(true)}
                className="bg-[#094780] text-white px-4 h-10 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm hover:bg-[#073661] transition-all cursor-pointer"
              >
                <Plus size={14} /> Novo Colaborador
              </button>
            )}

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
            {activeTab === 'colaborador' && (
              <button onClick={handleExport} className="btn-outline">
                <Download size={13} /> Exportar
              </button>
            )}
          </div>
        </div>

        {/* ── ABAS ── */}
        <div className="mb-4">
          <div className="tab-bar">
            <button
              onClick={() => setActiveTab('colaborador')}
              className={cn('tab-btn', activeTab === 'colaborador' && 'tab-active')}
            >
              <Users size={14} />
              Metas por Colaborador
            </button>
            <button
              onClick={() => setActiveTab('funcao')}
              className={cn('tab-btn', activeTab === 'funcao' && 'tab-active')}
            >
              <Briefcase size={14} />
              Metas por Função
            </button>
          </div>
        </div>

        {/* ── CONTEÚDO DAS ABAS ── */}
        {activeTab === 'colaborador' ? (
          <>
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
                      <input className="search-input-field" type="text" placeholder="Pesquisar..." value={busca} onChange={e => { setBusca(e.target.value); setCurrentPage(1) }} />
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
                  <ChipFilter label="Filial (UF)" options={ufsVisiveis} value={filtroUf} onChange={(v: any) => { setFiltroUf(v); setCurrentPage(1) }} renderLabel={(uf: any) => UF_LABELS[uf] ?? uf} />
                  {regionaisDisponiveis.length > 0 && (
                    <ChipFilter label="Regional" options={regionaisDisponiveis} value={filtroRegional} onChange={(v: any) => { setFiltroRegional(v); setCurrentPage(1) }} />
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
                            const thClass = usadoPorMA && usadoPorPI ? 'center' : usadoPorMA ? 'center uf-ma' : 'center uf-pi'
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
                          <tr key={s.id || Math.random()} className="gp-row">
                            <td>
                              <div className="font-bold text-[#1a2535] uppercase truncate max-w-[200px]" title={s.nome}>
                                {s.nome || 'N/I'}
                              </div>
                              <div className="text-[10px] text-slate-400 font-bold">Matrícula: {s.matricula || '—'}</div>
                            </td>
                            <td>
                              <div className="flex items-center gap-1.5 text-slate-700 font-bold">
                                <Briefcase size={12} className="text-slate-400" /> {s.funcao || 'N/I'}
                              </div>
                              <div className="text-[10px] text-[#8896ab] font-bold mt-0.5 uppercase">{s.area || 'N/I'}</div>
                            </td>
                            <td>
                              <div className="font-bold text-slate-700">{s.filial || '—'}</div>
                              <div className="text-[10px] text-slate-400 font-bold">{s.regional || '—'}</div>
                            </td>
                            <td className="center w-[120px]">
                              <StatusSelector
                                row={s}
                                onStatusChange={(id, newStatus) => {
                                  setData(prev => prev.map(item => item.id === id ? { ...item, status: newStatus } : item))
                                }}
                                canEdit={isAdmin}
                              />
                            </td>
                            {tableFieldsFinal.map(f => (
                              <td key={f.key} className="center">
                                <MetaCellForUf value={s[f.key]} fieldKey={f.key} uf={s.filial} />
                              </td>
                            ))}
                            <td className="center">
                              <div className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-md inline-block">
                                {formatarDataBR(s.data)}
                              </div>
                            </td>
                            {isAdmin && (
                              <td>
                                <ActionMenu row={s} onEdit={setEditTarget} onDeleteRequest={setDeleteTarget} />
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
                              'min-w-[32px] h-7 rounded-lg border text-[11px] font-bold transition-all px-2 cursor-pointer',
                              pageSize === n ? 'bg-[#094780] text-white border-[#094780]' : 'bg-white text-slate-500 border-[#e3e8ef] hover:border-[#094780] hover:text-[#094780]'
                            )}
                          >
                            {n}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button className="pg-btn" onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}>
                        <ChevronLeft size={14} />
                      </button>
                      <button className="pg-btn" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages}>
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </>
        ) : (
          /* ── ABA: METAS POR FUNÇÃO ── */
          <div className="main-card">
            <MetasPorFuncaoTab />
          </div>
        )}
      </div>

      {/* Modais */}
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

      {isCreateOpen && (
        <EditModal
          row={null}
          onClose={() => setIsCreateOpen(false)}
          onSaved={newRow => {
            setData(prev => [newRow, ...prev])
            setIsCreateOpen(false)
          }}
          dynamicOptions={dynamicOptions}
        />
      )}

      {deleteTarget && (
        <ConfirmDeleteModal
          row={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDeleteConfirm}
        />
      )}
    </DashboardLayout>
  )
}