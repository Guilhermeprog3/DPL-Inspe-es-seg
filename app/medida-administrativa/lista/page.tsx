'use client'

import * as XLSX from 'xlsx'
import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import {
  Plus, MoreVertical, Eye, Loader2, Trash2, Edit2, AlertCircle,
  SlidersHorizontal, Download, ChevronLeft, ChevronRight,
  LayoutDashboard, PlusCircle, List, MapPin, Check,
  ArrowUpDown, ArrowUp, ArrowDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'

// ─── Helpers de data ─────────────────────────────────────────────────────────
/**
 * Formata uma string de data ISO ("2026-04-24T...") ou "YYYY-MM-DD" para pt-BR
 * SEM converter timezone — evita o bug de "um dia a menos".
 */
function formatDateBR(raw: string | null | undefined): string {
  if (!raw) return '—'
  // Extrai apenas a parte "YYYY-MM-DD" e reconstrói manualmente
  const datePart = raw.split('T')[0] // "2026-04-24"
  const [y, m, d] = datePart.split('-')
  if (!y || !m || !d) return '—'
  return `${d}/${m}/${y}`
}

/**
 * Retorna um número comparável para ordenação por data
 * (evita o mesmo bug de timezone ao usar Date diretamente).
 */
function dateSort(raw: string | null | undefined): number {
  if (!raw) return 0
  const datePart = raw.split('T')[0]
  return parseInt(datePart.replace(/-/g, ''), 10) // ex: 20260424
}

// ─── Types ────────────────────────────────────────────────────────────────────
function isAdminUser(user: any): boolean {
  if (!user) return false
  const campo = (user.perfil ?? user.role ?? user.cargo ?? '').toString().toUpperCase().trim()
  return ['ADM', 'ADMIN', 'ADMINISTRADOR'].includes(campo)
}

function normalizeUfs(user: any): string[] {
  if (!user) return []
  if (Array.isArray(user.filiais) && user.filiais.length > 0) return user.filiais
  if (Array.isArray(user.uf) && user.uf.length > 0) return user.uf
  if (typeof user.uf === 'string' && user.uf.trim()) return [user.uf.trim()]
  return []
}

function normalizeRegionais(user: any): string[] {
  if (!user) return []
  if (Array.isArray(user.regionais) && user.regionais.length > 0) return user.regionais
  if (Array.isArray(user.regional) && user.regional.length > 0) return user.regional
  if (typeof user.regional === 'string' && user.regional.trim()) return [user.regional.trim()]
  return []
}

// ─── Config ───────────────────────────────────────────────────────────────────
const PAGE_SIZE_OPTIONS = [10, 20, 30] as const
type PageSize = typeof PAGE_SIZE_OPTIONS[number]

type SortField = 'data' | 'colaborador'
type SortDir   = 'asc' | 'desc'

const navItems = [
  { section: 'Medida Administrativa' },
  { label: 'Dashboard',   href: '/medida-administrativa',       icon: LayoutDashboard },
  { section: 'Operações' },
  { label: 'Nova Medida', href: '/medida-administrativa/nova',  icon: PlusCircle },
  { label: 'Histórico',   href: '/medida-administrativa/lista', icon: List },
]

const UF_LABELS: Record<string, string> = {
  PI: 'Piauí',
  MA: 'Maranhão',
}

const ALL_UFS       = ['PI', 'MA']
const ALL_REGIONAIS = ['METROPOLITANA', 'NORTE', 'SUL', 'NOROESTE', 'LESTE']

const GRAVIDADE_CONFIG: Record<string, { color: string; bg: string; border: string }> = {
  LEVE:       { color: '#10b981', bg: '#f0fdf4', border: '#bcf0da' },
  MÉDIA:      { color: '#f59e0b', bg: '#fffbeb', border: '#fde68a' },
  GRAVE:      { color: '#ef4444', bg: '#fef2f2', border: '#fecaca' },
  GRAVÍSSIMA: { color: '#a855f7', bg: '#faf5ff', border: '#e9d5ff' },
}

const MEDIDA_CONFIG: Record<string, { color: string; bg: string; border: string }> = {
  'ADVERTÊNCIA VERBAL':  { color: '#f59e0b', bg: '#fffbeb', border: '#fde68a' },
  'ADVERTÊNCIA ESCRITA': { color: '#ef4444', bg: '#fef2f2', border: '#fecaca' },
  'SUSPENSÃO':           { color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
  'CONVERSA PEDAGÓGICA': { color: '#0891b2', bg: '#ecfeff', border: '#a5f3fc' },
  'TREINAMENTO':         { color: '#10b981', bg: '#f0fdf4', border: '#bbf7d0' },
}

const ORIGEM_CONFIG: Record<string, { color: string; bg: string; border: string }> = {
  'ESS':               { color: '#0891b2', bg: '#ecfeff', border: '#a5f3fc' },
  'CLICK':             { color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
  'NMC':               { color: '#10b981', bg: '#f0fdf4', border: '#bbf7d0' },
  'MULTA DE TRÂNSITO': { color: '#ef4444', bg: '#fef2f2', border: '#fecaca' },
  'GESTÃO DE GENTE':   { color: '#f59e0b', bg: '#fffbeb', border: '#fde68a' },
}

const ORIGENS_LIST = ['ESS', 'CLICK', 'NMC', 'MULTA DE TRÂNSITO', 'GESTÃO DE GENTE']

function exportToExcel(data: any[]) {
  const rows = data.map(m => ({
    'ID':                m.id ?? '',
    'Filial':            m.uf ?? '',
    'Regional':          m.regional ?? '',
    'Colaborador':       m.colaborador ?? '',
    'Matrícula Colab.':  m.matricula ?? '',
    'Supervisor':        m.nomeSupervisor ?? '',
    'Matrícula Sup.':    m.supervisor ?? '',
    'Data':              formatDateBR(m.data),
    'Categoria':         m.tipo ?? '',
    'Tipo de Medida':    m.medida ?? '',
    'Dias Suspensão':    m.diasSuspensao ?? '',
    'Gravidade':         m.gravidade ?? '',
    'Classificação':     m.classificacao ?? '',
    'Descrição':         m.ocorrencia ?? '',
    'Origem':            m.origem ?? '',
    'Inspeções CLICK':   Array.isArray(m.numerosInspecao) ? m.numerosInspecao.join(', ') : (m.numeroInspecao ?? ''),
  }))
  const ws = XLSX.utils.json_to_sheet(rows)
  ws['!cols'] = [
    {wch:28},{wch:10},{wch:15},{wch:28},{wch:14},{wch:28},{wch:14},{wch:14},
    {wch:16},{wch:22},{wch:14},{wch:12},{wch:40},{wch:50},{wch:18},{wch:20},
  ]
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Medidas')
  XLSX.writeFile(wb, `medidas_${new Date().toLocaleDateString('pt-BR').replace(/\//g,'-')}.xlsx`)
}

// ─── ChipFilter ───────────────────────────────────────────────────────────────
function ChipFilter({
  label, options, value, onChange, renderLabel, dotColor,
}: {
  label: string
  options: string[]
  value: string[]
  onChange: (v: string[]) => void
  renderLabel?: (v: string) => string
  dotColor?: (v: string) => string
}) {
  const allSelected = value.length === 0
  function toggle(opt: string) {
    if (value.includes(opt)) onChange(value.filter(v => v !== opt))
    else onChange([...value, opt])
  }
  return (
    <div className="chip-filter-wrap">
      <span className="chip-filter-label">{label}</span>
      <div className="chip-group">
        <button type="button" onClick={() => onChange([])} className={cn('chip', allSelected && 'chip-active')}>Todas</button>
        {options.map(opt => {
          const isActive = value.includes(opt)
          return (
            <button key={opt} type="button" onClick={() => toggle(opt)} className={cn('chip', isActive && 'chip-active')}>
              {dotColor && <span className="chip-dot" style={{ background: isActive ? 'rgba(255,255,255,.8)' : dotColor(opt) }} />}
              {renderLabel ? renderLabel(opt) : opt}
              {isActive && <Check size={9} strokeWidth={3} style={{ marginLeft: 2, opacity: .9 }} />}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── ActionMenu ───────────────────────────────────────────────────────────────
function ActionMenu({ onVisualizar, onEditar, onExcluir }: {
  onVisualizar: () => void; onEditar: () => void; onExcluir: () => void
}) {
  const [open, setOpen]     = useState(false)
  const [coords, setCoords] = useState({ top: 0, right: 0 })
  const btnRef = useRef<HTMLButtonElement>(null)

  function handleOpen() {
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect()
      setCoords({ top: r.bottom + 6, right: window.innerWidth - r.right })
    }
    setOpen(v => !v)
  }

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      const t = e.target as Node
      if (btnRef.current?.contains(t)) return
      if (document.getElementById('action-menu-portal')?.contains(t)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  useEffect(() => {
    if (!open) return
    const h = () => setOpen(false)
    window.addEventListener('scroll', h, true)
    return () => window.removeEventListener('scroll', h, true)
  }, [open])

  return (
    <>
      <button ref={btnRef} type="button" onClick={handleOpen}
        className={cn('p-2 rounded-xl transition-all',
          open ? 'bg-[#f0f4f9] text-[#094780]' : 'text-[#b0bac8] hover:text-[#094780] hover:bg-[#f0f4f9]')}>
        <MoreVertical size={20} />
      </button>
      {open && (
        <div id="action-menu-portal" style={{
          position:'fixed', top:coords.top, right:coords.right,
          background:'#fff', border:'1px solid #e2e8f0', borderRadius:'12px',
          boxShadow:'0 8px 30px rgba(0,0,0,.15)', zIndex:9999,
          width:'155px', overflow:'hidden', animation:'menuIn .15s ease-out',
        }}>
          <button type="button" className="action-item" onClick={() => { setOpen(false); onVisualizar() }}><Eye size={14} /> Visualizar</button>
          <button type="button" className="action-item" onClick={() => { setOpen(false); onEditar() }}><Edit2 size={14} /> Editar</button>
          <div className="action-sep" />
          <button type="button" className="action-item delete" onClick={() => { setOpen(false); onExcluir() }}><Trash2 size={14} /> Excluir</button>
        </div>
      )}
    </>
  )
}

// ─── Badges ───────────────────────────────────────────────────────────────────
function MedidaBadge({ medida }: { medida: string }) {
  const cfg = MEDIDA_CONFIG[medida] ?? { color:'#4b5563', bg:'#f8fafc', border:'#e3e8ef' }
  return (
    <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold border"
      style={{ background:cfg.bg, color:cfg.color, borderColor:cfg.border }}>
      {medida}
    </span>
  )
}

function GravidadeBadge({ gravidade }: { gravidade: string }) {
  const cfg = GRAVIDADE_CONFIG[gravidade] ?? GRAVIDADE_CONFIG['LEVE']
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border"
      style={{ background:cfg.bg, color:cfg.color, borderColor:cfg.border }}>
      {gravidade}
    </span>
  )
}

function OrigemBadge({ origem }: { origem?: string }) {
  if (!origem) return <span className="text-[11px] text-slate-300 italic">—</span>
  const cfg = ORIGEM_CONFIG[origem] ?? { color:'#4b5563', bg:'#f8fafc', border:'#e3e8ef' }
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold border"
      style={{ background:cfg.bg, color:cfg.color, borderColor:cfg.border }}>
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background:cfg.color }} />
      {origem}
    </span>
  )
}

// ─── SortButton — cabeçalho de coluna clicável ────────────────────────────────
function SortButton({
  field, label, currentField, currentDir, onClick,
}: {
  field: SortField; label: string
  currentField: SortField; currentDir: SortDir
  onClick: (f: SortField) => void
}) {
  const isActive = currentField === field
  const Icon = isActive
    ? currentDir === 'desc' ? ArrowDown : ArrowUp
    : ArrowUpDown

  return (
    <button
      type="button"
      onClick={() => onClick(field)}
      className={cn(
        'inline-flex items-center gap-1.5 font-bold uppercase tracking-wide text-[10px] transition-colors',
        isActive ? 'text-[#094780]' : 'text-[#8896ab] hover:text-[#094780]'
      )}
    >
      {label}
      <Icon size={11} strokeWidth={2.5} className={isActive ? 'opacity-100' : 'opacity-40'} />
    </button>
  )
}

// ─── Pagination ───────────────────────────────────────────────────────────────
function Pagination({
  currentPage, totalPages, totalItems, pageSize, onPageChange, onPageSizeChange,
}: {
  currentPage: number; totalPages: number; totalItems: number
  pageSize: PageSize; onPageChange: (p: number) => void
  onPageSizeChange: (s: PageSize) => void
}) {
  const from = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const to   = Math.min(currentPage * pageSize, totalItems)

  const pages = useMemo(() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
    const r: (number | '...')[] = [1]
    if (currentPage > 3) r.push('...')
    for (let p = Math.max(2, currentPage - 1); p <= Math.min(totalPages - 1, currentPage + 1); p++) r.push(p)
    if (currentPage < totalPages - 2) r.push('...')
    r.push(totalPages)
    return r
  }, [currentPage, totalPages])

  return (
    <div className="pagination-wrap">
      <div className="flex items-center gap-3 flex-wrap">
        <span className="pagination-info">
          Exibindo <strong>{from}–{to}</strong> de <strong>{totalItems}</strong> registros
        </span>
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-[#8896ab]">por página:</span>
          <div className="flex gap-1">
            {PAGE_SIZE_OPTIONS.map(s => (
              <button key={s} onClick={() => onPageSizeChange(s)}
                className={cn('h-7 w-9 rounded-lg border text-[11px] font-bold transition-all',
                  pageSize === s
                    ? 'bg-[#094780] border-[#094780] text-white'
                    : 'bg-white border-[#e3e8ef] text-[#8896ab] hover:border-[#094780] hover:text-[#094780]')}>
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>
      {totalPages > 1 && (
        <div className="pagination-controls">
          <button className="pg-btn" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}>
            <ChevronLeft size={15} />
          </button>
          {pages.map((p, i) =>
            p === '...'
              ? <span key={`e${i}`} className="pg-ellipsis">…</span>
              : <button key={p} className={cn('pg-btn pg-num', p === currentPage && 'pg-active')} onClick={() => onPageChange(p as number)}>{p}</button>
          )}
          <button className="pg-btn" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}>
            <ChevronRight size={15} />
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ListagemMedidasPage() {
  const router = useRouter()
  const { data: session } = useSession()

  const isAdmin       = useMemo(() => isAdminUser(session?.user),                                  [session])
  const userFiliais   = useMemo(() => isAdmin ? ALL_UFS       : normalizeUfs(session?.user),       [session, isAdmin])
  const userRegionais = useMemo(() => isAdmin ? ALL_REGIONAIS : normalizeRegionais(session?.user), [session, isAdmin])

  const [medidas,         setMedidas        ] = useState<any[]>([])
  const [loading,         setLoading        ] = useState(true)
  const [isDeleting,      setIsDeleting     ] = useState(false)
  const [isExporting,     setIsExporting    ] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [idParaDeletar,   setIdParaDeletar  ] = useState<string | null>(null)

  // Filtros
  const [busca,           setBusca          ] = useState('')
  const [campoBusca,      setCampoBusca     ] = useState('todos')
  const [filtroCategoria, setFiltroCategoria] = useState('Todos')
  const [filtroMedida,    setFiltroMedida   ] = useState('Todos')
  const [filtroGravidade, setFiltroGravidade] = useState('Todos')
  const [filtroOrigem,    setFiltroOrigem   ] = useState('Todos')
  const [filtroUf,        setFiltroUf       ] = useState<string[]>([])
  const [filtroRegional,  setFiltroRegional ] = useState<string[]>([])
  const [filtroData,      setFiltroData     ] = useState('')

  // ── Ordenação: padrão = data mais recente (desc) ──────────────────────────
  const [sortField, setSortField] = useState<SortField>('data')
  const [sortDir,   setSortDir  ] = useState<SortDir>('desc')

  function handleSort(field: SortField) {
    if (field === sortField) {
      // Mesmo campo → inverte direção
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      // Novo campo → desc para data, asc para texto
      setSortField(field)
      setSortDir(field === 'data' ? 'desc' : 'asc')
    }
    setCurrentPage(1)
  }
  // ──────────────────────────────────────────────────────────────────────────

  // Paginação
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize,    setPageSize    ] = useState<PageSize>(10)

  useEffect(() => {
    async function fetchMedidas() {
      if (!session?.user) return
      const user = session.user as any
      try {
        setLoading(true)
        const params = new URLSearchParams({
          userId:   user.id       ?? '',
          role:     user.role     ?? '',
          uf:       user.uf       ?? '',
          regional: user.regional ?? '',
        })
        if (filtroUf.length > 0)       params.set('ufs',       filtroUf.join(','))
        if (filtroRegional.length > 0) params.set('regionais', filtroRegional.join(','))
        const r = await api.get(`/medidas?${params.toString()}`)
        setMedidas(r.data)
      } catch (err) { console.error(err) }
      finally { setLoading(false) }
    }
    fetchMedidas()
  }, [session, filtroUf, filtroRegional])

  const handleOpenDeleteModal = (id: string) => { setIdParaDeletar(id); setShowDeleteModal(true) }

  const confirmDelete = async () => {
    if (!idParaDeletar) return
    setIsDeleting(true)
    try {
      await api.delete(`/medidas/${idParaDeletar}`)
      setMedidas(p => p.filter(m => m.id !== idParaDeletar))
      setShowDeleteModal(false)
    } catch { alert('Não foi possível excluir.') }
    finally { setIsDeleting(false); setIdParaDeletar(null) }
  }

  // ── Filtro ────────────────────────────────────────────────────────────────
  const filteredData = useMemo(() => {
    const filtered = medidas.filter(m => {
      const t = busca.toLowerCase()
      const matchBusca = !busca || (() => {
        switch (campoBusca) {
          case 'colaborador':   return m.colaborador?.toLowerCase().includes(t)
          case 'matricula':     return m.matricula?.toLowerCase().includes(t)
          case 'supervisor':    return m.nomeSupervisor?.toLowerCase().includes(t)
          case 'matSupervisor': return m.supervisor?.toLowerCase().includes(t)
          default: return (
  m.colaborador?.toLowerCase().includes(t)    ||
  m.matricula?.toLowerCase().includes(t)      ||
  m.nomeSupervisor?.toLowerCase().includes(t) ||
  m.supervisor?.toLowerCase().includes(t)     ||
  String(m.id || '').toLowerCase().includes(t)
)
        }
      })()
      return (
        matchBusca &&
        (filtroUf.length       === 0 || filtroUf.includes(m.uf)           ) &&
        (filtroRegional.length === 0 || filtroRegional.includes(m.regional)) &&
        (filtroCategoria === 'Todos' || m.tipo      === filtroCategoria    ) &&
        (filtroMedida    === 'Todos' || m.medida    === filtroMedida       ) &&
        (filtroGravidade === 'Todos' || m.gravidade === filtroGravidade    ) &&
        (filtroOrigem    === 'Todos' || m.origem    === filtroOrigem       ) &&
        // ── Correção bug de data: compara apenas a parte "YYYY-MM-DD" ──────
        (!filtroData || m.data?.split('T')[0] === filtroData)
      )
    })

    // ── Ordenação ────────────────────────────────────────────────────────────
    filtered.sort((a, b) => {
      if (sortField === 'data') {
        const diff = dateSort(a.data) - dateSort(b.data)
        return sortDir === 'desc' ? -diff : diff
      }
      // Ordenação alfabética por nome do colaborador
      const nameA = (a.colaborador ?? '').toLowerCase()
      const nameB = (b.colaborador ?? '').toLowerCase()
      const diff  = nameA.localeCompare(nameB, 'pt-BR')
      return sortDir === 'asc' ? diff : -diff
    })

    return filtered
  }, [medidas, busca, campoBusca, filtroCategoria, filtroMedida, filtroGravidade, filtroOrigem, filtroUf, filtroRegional, filtroData, sortField, sortDir])

  // Reset página ao mudar filtro, ordenação ou tamanho
  useEffect(() => { setCurrentPage(1) }, [
    busca, campoBusca, filtroCategoria, filtroMedida, filtroGravidade,
    filtroOrigem, filtroUf, filtroRegional, filtroData, pageSize, sortField, sortDir,
  ])

  const totalPages    = Math.max(1, Math.ceil(filteredData.length / pageSize))
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredData.slice(start, start + pageSize)
  }, [filteredData, currentPage, pageSize])

  const limparFiltros = () => {
    setBusca(''); setCampoBusca('todos')
    setFiltroCategoria('Todos'); setFiltroMedida('Todos')
    setFiltroGravidade('Todos'); setFiltroOrigem('Todos'); setFiltroData('')
    setFiltroUf([]); setFiltroRegional([])
  }

  const filtrosAtivos = [
    busca,
    filtroCategoria !== 'Todos',
    filtroMedida    !== 'Todos',
    filtroGravidade !== 'Todos',
    filtroOrigem    !== 'Todos',
    filtroUf.length        > 0,
    filtroRegional.length  > 0,
    filtroData,
  ].filter(Boolean).length

  const handleExport = useCallback(() => {
    if (isExporting || filteredData.length === 0) return
    setIsExporting(true)
    try { exportToExcel(filteredData) }
    catch { alert('Erro ao exportar.') }
    finally { setIsExporting(false) }
  }, [filteredData, isExporting])

  const ufDotColor = (uf: string) => {
    const colors: Record<string, string> = { PI: '#094780', MA: '#7c3aed' }
    return colors[uf] ?? '#8896ab'
  }

  return (
    <DashboardLayout title="Gestão de Medidas" breadcrumb="SIGS / Medida Administrativa / Listagem" navItems={navItems}>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Syne:wght@700;800&display=swap');
        .list-root { font-family:'DM Sans',sans-serif; padding:16px; min-height:calc(100vh - 60px); }

        /* ── Filtros ── */
        .filter-wrap { background:#fff; border:1px solid #e3e8ef; border-radius:14px; margin-bottom:16px; overflow:hidden; }
        .filter-header { display:flex; align-items:center; justify-content:space-between; padding:12px 14px; border-bottom:1px solid #f1f5f9; }
        .filter-badge { background:#3d6cf0; color:#fff; font-size:10px; font-weight:700; padding:2px 7px; border-radius:99px; }

        .filter-body {
          padding:14px;
          display:grid;
          grid-template-columns:1fr;
          gap:12px;
        }
        @media(min-width:768px) {
          .filter-body { grid-template-columns:1fr 1fr; }
        }
        @media(min-width:1280px) {
          .filter-body { grid-template-columns:1.8fr 1fr 1fr 1fr 1fr 1fr; }
        }

        .filter-chips-row {
          padding:0 14px 14px;
          display:grid;
          grid-template-columns:1fr;
          gap:12px;
          border-top:1px solid #f1f5f9;
          padding-top:12px;
        }
        @media(min-width:768px) {
          .filter-chips-row { grid-template-columns:1fr 1fr; }
        }

        .filter-label-text { font-size:10px; font-weight:700; color:#94a3b8; text-transform:uppercase; letter-spacing:.06em; margin-bottom:5px; display:block; }
        .filter-input { height:36px; background:#f8fafc; border:1px solid #e3e8ef; border-radius:8px; padding:0 10px; font-size:13px; width:100%; outline:none; transition:border .15s; }
        .filter-input:focus { border-color:#094780; }

        /* ── Chip Filter ── */
        .chip-filter-wrap { display:flex; flex-direction:column; gap:6px; }
        .chip-filter-label { font-size:10px; font-weight:700; color:#94a3b8; text-transform:uppercase; letter-spacing:.06em; }
        .chip-group { display:flex; flex-wrap:wrap; gap:5px; }
        .chip {
          display:inline-flex; align-items:center; gap:4px;
          padding:4px 11px; border-radius:99px; cursor:pointer;
          font-size:11px; font-weight:700; border:1.5px solid #e3e8ef;
          background:#fff; color:#64748b;
          transition:all .15s ease; user-select:none; line-height:1; white-space:nowrap;
        }
        .chip:hover { border-color:#094780; color:#094780; background:#eef4fb; }
        .chip-active { background:#094780 !important; color:#fff !important; border-color:#094780 !important; }
        .chip-dot { width:6px; height:6px; border-radius:50%; flex-shrink:0; transition:background .15s; }

        /* ── Tabela ── */
        .ins-main-card { background:#fff; border:1px solid #e2e8f0; border-radius:18px; overflow:hidden; }
        .ins-table { width:100%; border-collapse:collapse; min-width:1150px; }
        .ins-table th { background:#f8fafc; padding:12px 14px; text-align:left; font-size:10px; font-weight:800; color:#8896ab; text-transform:uppercase; letter-spacing:.05em; border-bottom:1px solid #e2e8f0; }
        .ins-table th.sortable { cursor:pointer; }
        .ins-row td { padding:12px 14px; border-bottom:1px solid #f1f5f9; vertical-align:middle; }
        .ins-row:last-child td { border-bottom:none; }
        .ins-row:hover td { background:#fafbfc; }

        /* ── Botões topo ── */
        .btn-new { background:#E67A0E; color:#fff; padding:9px 14px; border-radius:12px; font-weight:800; font-size:12px; border:none; cursor:pointer; display:flex; align-items:center; gap:6px; transition:opacity .15s; }
        .btn-new:hover { opacity:.9; }
        .btn-export { background:#fff; color:#374151; padding:8px 12px; border-radius:12px; font-weight:700; font-size:12px; border:1.5px solid #e3e8ef; cursor:pointer; display:flex; align-items:center; gap:6px; transition:border-color .15s; }
        .btn-export:hover { border-color:#094780; color:#094780; }
        .btn-export:disabled { opacity:.4; cursor:not-allowed; }

        /* ── Paginação ── */
        .pagination-wrap { display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:10px; padding:14px 20px; border-top:1px solid #f1f5f9; }
        .pagination-info { font-size:12px; color:#8896ab; }
        .pagination-controls { display:flex; align-items:center; gap:4px; }
        .pg-btn { min-width:34px; height:34px; border-radius:9px; border:1.5px solid #e3e8ef; background:#fff; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:13px; font-weight:600; color:#374151; transition:all .15s; }
        .pg-btn:disabled { opacity:.4; cursor:not-allowed; }
        .pg-num:hover:not(:disabled) { border-color:#094780; color:#094780; }
        .pg-active { background:#094780 !important; color:#fff !important; border-color:#094780 !important; }
        .pg-ellipsis { padding:0 4px; color:#8896ab; font-size:13px; line-height:34px; }

        /* ── Action menu ── */
        .action-item { width:100%; padding:10px 14px; display:flex; align-items:center; gap:10px; font-size:12px; font-weight:600; border:none; background:none; cursor:pointer; color:#374151; transition:background .1s; }
        .action-item:hover { background:#f8fafc; }
        .action-item.delete { color:#ef4444; }
        .action-sep { height:1px; background:#f1f5f9; margin:2px 0; }
        @keyframes menuIn { from{opacity:0;transform:translateY(-4px)} to{opacity:1;transform:none} }
        .table-scroll { overflow-x:auto; }
      `}} />

      <div className="list-root">

        {/* ── Header ── */}
        <div className="flex justify-between items-start mb-4 gap-3 flex-wrap">
          <div>
            <h2 style={{ fontFamily:'Syne', fontWeight:800, fontSize:'clamp(18px,4vw,26px)', color:'#0d1e33' }}>
              Medidas Administrativas
            </h2>
            <p className="text-[11px] text-[#8896ab] font-bold uppercase mt-1">
              {loading ? 'Sincronizando...' : `${filteredData.length} registros encontrados`}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button className="btn-export" onClick={handleExport} disabled={isExporting || filteredData.length === 0 || loading}>
              {isExporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
              <span className="hidden sm:inline">Exportar Excel</span>
            </button>
            <button className="btn-new" onClick={() => router.push('/medida-administrativa/nova')}>
              <Plus size={15} strokeWidth={3} /> <span className="hidden sm:inline">Nova Medida</span>
            </button>
          </div>
        </div>

        {/* ── Filtros ── */}
        <div className="filter-wrap">
          <div className="filter-header">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
              <SlidersHorizontal size={14} /> Filtros
              {filtrosAtivos > 0 && <span className="filter-badge">{filtrosAtivos}</span>}
            </div>
            {filtrosAtivos > 0 && (
              <button className="text-xs font-bold text-slate-400 hover:text-red-500 transition-colors" onClick={limparFiltros}>
                Limpar tudo
              </button>
            )}
          </div>

          <div className="filter-body">
            {/* Busca */}
            <div className="flex flex-col">
              <span className="filter-label-text">Busca</span>
              <div className="flex border border-[#e3e8ef] rounded-lg overflow-hidden h-9 bg-slate-50 focus-within:border-[#094780] transition-colors">
                <select value={campoBusca} onChange={e => setCampoBusca(e.target.value)}
                  className="border-none bg-transparent text-[11px] font-bold text-[#094780] pl-2 pr-1 outline-none shrink-0" style={{ maxWidth: 130 }}>
                  <option value="todos">Todos</option>
                  <option value="colaborador">Nome Colab.</option>
                  <option value="matricula">Mat. Colab.</option>
                  <option value="supervisor">Nome Sup.</option>
                  <option value="matSupervisor">Mat. Sup.</option>
                </select>
                <input value={busca} onChange={e => setBusca(e.target.value)}
                  className="flex-1 bg-transparent border-none px-2 text-xs outline-none min-w-0"
                  placeholder="Pesquisar..." />
                {busca && (
                  <button onClick={() => setBusca('')} className="px-2 text-slate-400 hover:text-slate-600 transition-colors">✕</button>
                )}
              </div>
            </div>

            {/* Categoria */}
            <div className="flex flex-col">
              <span className="filter-label-text">Categoria</span>
              <select className="filter-input" value={filtroCategoria} onChange={e => setFiltroCategoria(e.target.value)}>
                <option value="Todos">Todas</option>
                <option value="SEGURANÇA">Segurança</option>
                <option value="ADMINISTRATIVA">Administrativa</option>
              </select>
            </div>

            {/* Medida */}
            <div className="flex flex-col">
              <span className="filter-label-text">Medida</span>
              <select className="filter-input" value={filtroMedida} onChange={e => setFiltroMedida(e.target.value)}>
                <option value="Todos">Todas</option>
                <option value="ADVERTÊNCIA VERBAL">Adv. Verbal</option>
                <option value="ADVERTÊNCIA ESCRITA">Adv. Escrita</option>
                <option value="SUSPENSÃO">Suspensão</option>
                <option value="CONVERSA PEDAGÓGICA">Conv. Pedagógica</option>
                <option value="TREINAMENTO">Treinamento</option>
              </select>
            </div>

            {/* Gravidade */}
            <div className="flex flex-col">
              <span className="filter-label-text">Gravidade</span>
              <select className="filter-input" value={filtroGravidade} onChange={e => setFiltroGravidade(e.target.value)}>
                <option value="Todos">Todas</option>
                {Object.keys(GRAVIDADE_CONFIG).map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>

            {/* Origem */}
            <div className="flex flex-col">
              <span className="filter-label-text">Origem</span>
              <select className="filter-input" value={filtroOrigem} onChange={e => setFiltroOrigem(e.target.value)}>
                <option value="Todos">Todas</option>
                {ORIGENS_LIST.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>

            {/* Data */}
            <div className="flex flex-col">
              <span className="filter-label-text">Data</span>
              <input className="filter-input" type="date" value={filtroData} onChange={e => setFiltroData(e.target.value)} />
            </div>
          </div>

          {/* Chips filial + regional */}
          <div className="filter-chips-row">
            <ChipFilter
              label="Filial" options={userFiliais} value={filtroUf} onChange={setFiltroUf}
              renderLabel={uf => UF_LABELS[uf] ?? uf} dotColor={ufDotColor}
            />
            <ChipFilter
              label="Regional" options={userRegionais} value={filtroRegional} onChange={setFiltroRegional}
              renderLabel={reg => reg.charAt(0) + reg.slice(1).toLowerCase()}
            />
          </div>
        </div>

        {/* ── Tabela ── */}
        <div className="ins-main-card">
          {loading ? (
            <div className="py-24 text-center">
              <Loader2 size={40} className="mx-auto mb-4 text-[#094780] animate-spin" />
              <p className="text-[13px] text-slate-400">Carregando registros...</p>
            </div>
          ) : paginatedData.length === 0 ? (
            <div className="py-20 text-center">
              <AlertCircle size={32} className="mx-auto mb-3 text-slate-300" />
              <p className="text-[14px] font-semibold text-slate-400">Nenhum registro encontrado</p>
              <p className="text-[12px] text-slate-300 mt-1">Tente ajustar os filtros aplicados</p>
              {filtrosAtivos > 0 && (
                <button onClick={limparFiltros} className="mt-4 px-4 py-2 text-xs font-bold text-[#094780] border border-[#094780]/30 rounded-lg hover:bg-blue-50 transition-colors">
                  Limpar filtros
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="table-scroll">
                <table className="ins-table">
                  <thead>
                    <tr>
                      {/* Cabeçalho clicável para ordenação por data */}
                      <th className="sortable">
                        <SortButton
                          field="data" label="ID / Data"
                          currentField={sortField} currentDir={sortDir}
                          onClick={handleSort}
                        />
                      </th>
                      <th>Local</th>
                      {/* Cabeçalho clicável para ordenação por nome */}
                      <th className="sortable">
                        <SortButton
                          field="colaborador" label="Colaborador"
                          currentField={sortField} currentDir={sortDir}
                          onClick={handleSort}
                        />
                      </th>
                      <th>Supervisor</th>
                      <th>Medida</th>
                      <th>Gravidade</th>
                      <th>Origem</th>
                      <th style={{ textAlign:'right' }}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedData.map(item => (
                      <tr key={item.id} className="ins-row">

                        {/* ID / Data — usando formatDateBR para evitar bug de timezone */}
                        <td>
                          <div
                            className="font-bold text-[#094780] text-[12px] cursor-pointer hover:underline"
                            onClick={() => router.push(`/medida-administrativa/detalhes/${item.id}`)}
                          >
                            #{String(item.id).slice(-6).toUpperCase()}
                          </div>
                          <div className="text-[10px] text-[#8896ab]">
                            {formatDateBR(item.data)}
                          </div>
                        </td>

                        {/* Local */}
                        <td>
                          <div className="flex items-center gap-1 font-bold text-slate-700 text-[11px] uppercase">
                            <MapPin size={10} className="text-[#E67A0E]" /> {item.uf || '—'}
                          </div>
                          <div className="text-[9px] text-[#8896ab] font-bold">{item.regional || '—'}</div>
                        </td>

                        {/* Colaborador */}
                        <td>
                          <div className="font-bold text-[#1a2535] text-[13px]">{item.colaborador}</div>
                          <div className="text-[10px] text-[#8896ab]">Mat: {item.matricula}</div>
                        </td>

                        {/* Supervisor */}
                        <td>
                          <div className="font-bold text-[#1a2535] text-[13px]">{item.nomeSupervisor || '—'}</div>
                          {item.supervisor && <div className="text-[10px] text-[#8896ab]">Mat: {item.supervisor}</div>}
                        </td>

                        {/* Medida */}
                        <td><MedidaBadge medida={item.medida} /></td>

                        {/* Gravidade */}
                        <td><GravidadeBadge gravidade={item.gravidade} /></td>

                        {/* Origem */}
                        <td><OrigemBadge origem={item.origem} /></td>

                        {/* Ações */}
                        <td style={{ textAlign:'right' }}>
                          <ActionMenu
                            onVisualizar={() => router.push(`/medida-administrativa/detalhes/${item.id}`)}
                            onEditar={()     => router.push(`/medida-administrativa/editar/${item.id}`)}
                            onExcluir={()    => handleOpenDeleteModal(item.id)}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filteredData.length}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={(s) => { setPageSize(s); setCurrentPage(1) }}
              />
            </>
          )}
        </div>
      </div>

      {/* ── Modal exclusão ── */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-5">
                <AlertCircle size={32} className="text-red-500" />
              </div>
              <h3 className="text-xl font-bold mb-2">Excluir?</h3>
              <p className="text-sm text-slate-400">Esta ação é permanente e não pode ser desfeita.</p>
            </div>
            <div className="flex gap-3 p-6 bg-slate-50 border-t">
              <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-3 border border-slate-200 rounded-xl font-bold text-slate-500 hover:bg-white transition-all">
                Cancelar
              </button>
              <button onClick={confirmDelete} disabled={isDeleting} className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-all flex items-center justify-center gap-2">
                {isDeleting ? <><Loader2 size={14} className="animate-spin" /> Excluindo...</> : 'Sim, excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}