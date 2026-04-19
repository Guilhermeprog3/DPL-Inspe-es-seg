'use client'

import * as XLSX from 'xlsx'

import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import {
  Search, Plus, MoreVertical, Eye,
  Loader2, Trash2, Edit2, AlertCircle, X, SlidersHorizontal,
  Download, Link2, ChevronLeft, ChevronRight, LayoutDashboard, PlusCircle, List, Users
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'

const ITEMS_PER_PAGE = 10

// ─── Menu Lateral (Sidebar) ──────────────────────────────────────────────────
const navItems = [
  { section: 'Medida Administrativa' },
  { label: 'Dashboard', href: '/medida-administrativa', icon: LayoutDashboard },
  { section: 'Operações' },
  { label: 'Nova Medida', href: '/medida-administrativa/nova', icon: PlusCircle },
  { label: 'Histórico', href: '/medida-administrativa/lista', icon: List },
]

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

function exportToExcel(data: any[]) {
  const rows = data.map(m => ({
    'ID':                 m.id ?? '',
    'Colaborador':        m.colaborador ?? '',
    'Matrícula Colab.':   m.matricula ?? '',
    'Matrícula Sup.':     m.supervisor ?? '',
    'Nome Supervisor':    m.nomeSupervisor ?? '',
    'Data':               m.data ? new Date(m.data).toLocaleDateString('pt-BR') : '',
    'Categoria':          m.tipo ?? '',
    'Tipo de Medida':     m.medida ?? '',
    'Dias Suspensão':     m.diasSuspensao ?? '',
    'Gravidade':          m.gravidade ?? '',
    'Classificação':      m.classificacao ?? '',
    'Descrição':          m.ocorrencia ?? '',
    'ID Inspeção Click': m.numeroInspecao ?? '',
  }))
  const ws = XLSX.utils.json_to_sheet(rows)
  ws['!cols'] = [
    { wch: 28 }, { wch: 28 }, { wch: 14 }, { wch: 14 }, { wch: 28 }, { wch: 14 },
    { wch: 16 }, { wch: 22 }, { wch: 14 }, { wch: 12 }, { wch: 40 }, { wch: 50 }, { wch: 20 },
  ]
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Medidas')
  const date = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')
  XLSX.writeFile(wb, `medidas_${date}.xlsx`)
}

// ─── Action Menu ─────────────────────────────────────────────────────────────
function ActionMenu({
  onVisualizar, onEditar, onExcluir,
}: { onVisualizar: () => void; onEditar: () => void; onExcluir: () => void }) {
  const [open, setOpen] = useState(false)
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
    function handler(e: MouseEvent) {
      const target = e.target as Node
      if (btnRef.current?.contains(target)) return
      if (document.getElementById('action-menu-portal')?.contains(target)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  useEffect(() => {
    if (!open) return
    const handler = () => setOpen(false)
    window.addEventListener('scroll', handler, true)
    return () => window.removeEventListener('scroll', handler, true)
  }, [open])

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={handleOpen}
        className={cn(
          'p-2 rounded-xl transition-all',
          open ? 'bg-[#f0f4f9] text-[#094780]' : 'text-[#b0bac8] hover:text-[#094780] hover:bg-[#f0f4f9]'
        )}
      >
        <MoreVertical size={20} />
      </button>

      {open && (
        <div
          id="action-menu-portal"
          style={{
            position: 'fixed', top: coords.top, right: coords.right,
            background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px',
            boxShadow: '0 8px 30px rgba(0,0,0,.15)', zIndex: 9999,
            width: '155px', overflow: 'hidden', animation: 'menuIn .15s ease-out',
          }}
        >
          <button type="button" className="action-item" onClick={() => { setOpen(false); onVisualizar() }}>
            <Eye size={14} /> Visualizar
          </button>
          <button type="button" className="action-item" onClick={() => { setOpen(false); onEditar() }}>
            <Edit2 size={14} /> Editar
          </button>
          <div className="action-sep" />
          <button type="button" className="action-item delete" onClick={() => { setOpen(false); onExcluir() }}>
            <Trash2 size={14} /> Excluir
          </button>
        </div>
      )}
    </>
  )
}

// ─── Badge helpers ────────────────────────────────────────────────────────────
function CategoriaBadge({ tipo }: { tipo: string }) {
  const isSeguranca = tipo === 'SEGURANÇA'
  return (
    <span
      className="inline-flex px-2 py-0.5 rounded text-[9px] font-black uppercase"
      style={{
        background: isSeguranca ? '#fef2f2' : '#eef2ff',
        color: isSeguranca ? '#ef4444' : '#3d6cf0',
      }}
    >
      {tipo}
    </span>
  )
}

function MedidaBadge({ medida }: { medida: string }) {
  const cfg = MEDIDA_CONFIG[medida] ?? { color: '#4b5563', bg: '#f8fafc', border: '#e3e8ef' }
  return (
    <span
      className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold border"
      style={{ background: cfg.bg, color: cfg.color, borderColor: cfg.border }}
    >
      {medida}
    </span>
  )
}

function GravidadeBadge({ gravidade }: { gravidade: string }) {
  const cfg = GRAVIDADE_CONFIG[gravidade] ?? GRAVIDADE_CONFIG['LEVE']
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border"
      style={{ background: cfg.bg, color: cfg.color, borderColor: cfg.border }}
    >
      {gravidade}
    </span>
  )
}

// ─── Pagination ───────────────────────────────────────────────────────────────
function Pagination({
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
}: {
  currentPage: number
  totalPages: number
  totalItems: number
  onPageChange: (page: number) => void
}) {
  const from = totalItems === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1
  const to   = Math.min(currentPage * ITEMS_PER_PAGE, totalItems)

  const pages = useMemo(() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
    const result: (number | '...')[] = []
    result.push(1)
    if (currentPage > 3) result.push('...')
    for (let p = Math.max(2, currentPage - 1); p <= Math.min(totalPages - 1, currentPage + 1); p++) {
      result.push(p)
    }
    if (currentPage < totalPages - 2) result.push('...')
    result.push(totalPages)
    return result
  }, [currentPage, totalPages])

  if (totalPages <= 1) return null

  return (
    <div className="pagination-wrap">
      <span className="pagination-info">
        Exibindo <strong>{from}–{to}</strong> de <strong>{totalItems}</strong> registros
      </span>

      <div className="pagination-controls">
        <button
          className="pg-btn"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Página anterior"
        >
          <ChevronLeft size={15} />
        </button>

        {pages.map((p, i) =>
          p === '...'
            ? <span key={`ellipsis-${i}`} className="pg-ellipsis">…</span>
            : (
              <button
                key={p}
                className={cn('pg-btn pg-num', p === currentPage && 'pg-active')}
                onClick={() => onPageChange(p as number)}
              >
                {p}
              </button>
            )
        )}

        <button
          className="pg-btn"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="Próxima página"
        >
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ListagemMedidasPage() {
  const router = useRouter()
  const { data: session } = useSession()

  const [medidas, setMedidas]         = useState<any[]>([])
  const [loading, setLoading]         = useState(true)
  const [isDeleting, setIsDeleting]   = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [idParaDeletar, setIdParaDeletar]     = useState<string | null>(null)

  const [busca, setBusca]                             = useState('')
  const [campoBusca, setCampoBusca]                   = useState('todos')
  const [filtroCategoria, setFiltroCategoria]         = useState('Todos')
  const [filtroMedida, setFiltroMedida]               = useState('Todos')
  const [filtroGravidade, setFiltroGravidade]         = useState('Todos')
  const [filtroClassificacao, setFiltroClassificacao] = useState('Todos')
  const [filtroData, setFiltroData]                   = useState('')

  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    async function fetchMedidas() {
      const token = (session as any)?.access_token || (session as any)?.accessToken
      if (!token) return
      try {
        setLoading(true)
        const res = await fetch('http://localhost:3001/medidas', {
          headers: { 'Authorization': `Bearer ${token}` },
        })
        if (!res.ok) throw new Error()
        setMedidas(await res.json())
      } catch { console.error('Falha ao carregar') }
      finally { setLoading(false) }
    }
    if (session) fetchMedidas()
  }, [session])

  const listaClassificacoes = useMemo(() =>
    Array.from(new Set(medidas.map(m => m.classificacao).filter(Boolean))).sort() as string[]
  , [medidas])

  const handleOpenDeleteModal = (id: string) => { setIdParaDeletar(id); setShowDeleteModal(true) }

  const confirmDelete = async () => {
    if (!idParaDeletar) return
    const token = (session as any)?.access_token || (session as any)?.accessToken
    setIsDeleting(true)
    try {
      const res = await fetch(`http://localhost:3001/medidas/${idParaDeletar}`, {
        method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` },
      })
      if (res.ok) { setMedidas(p => p.filter(m => m.id !== idParaDeletar)); setShowDeleteModal(false) }
    } catch { alert('Não foi possível excluir.') }
    finally { setIsDeleting(false); setIdParaDeletar(null) }
  }

  const filteredData = useMemo(() => {
    return medidas.filter(m => {
      const t = busca.toLowerCase()
      const matchBusca = !busca || (() => {
        switch (campoBusca) {
          case 'colaborador':    return m.colaborador?.toLowerCase().includes(t)
          case 'matricula':      return m.matricula?.toLowerCase().includes(t)
          case 'supervisor':     return m.supervisor?.toLowerCase().includes(t)
          case 'nomeSupervisor': return m.nomeSupervisor?.toLowerCase().includes(t)
          case 'numeroInspecao': return m.numeroInspecao?.toLowerCase().includes(t)
          case 'id':             return m.id?.toLowerCase().includes(t)
          default: return (
            m.colaborador?.toLowerCase().includes(t) ||
            m.matricula?.toLowerCase().includes(t) ||
            m.supervisor?.toLowerCase().includes(t) ||
            m.nomeSupervisor?.toLowerCase().includes(t) ||
            m.numeroInspecao?.toLowerCase().includes(t) ||
            m.id?.toLowerCase().includes(t)
          )
        }
      })()
      return (
        matchBusca &&
        (filtroCategoria === 'Todos' || m.tipo === filtroCategoria) &&
        (filtroMedida === 'Todos' || m.medida === filtroMedida) &&
        (filtroGravidade === 'Todos' || m.gravidade === filtroGravidade) &&
        (filtroClassificacao === 'Todos' || m.classificacao === filtroClassificacao) &&
        (!filtroData || m.data?.split('T')[0] === filtroData)
      )
    })
  }, [medidas, busca, campoBusca, filtroCategoria, filtroMedida, filtroGravidade, filtroClassificacao, filtroData])

  useEffect(() => { setCurrentPage(1) }, [busca, campoBusca, filtroCategoria, filtroMedida, filtroGravidade, filtroClassificacao, filtroData])

  const totalPages  = Math.max(1, Math.ceil(filteredData.length / ITEMS_PER_PAGE))

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredData.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredData, currentPage])

  const limparFiltros = () => {
    setBusca(''); setCampoBusca('todos'); setFiltroCategoria('Todos')
    setFiltroMedida('Todos'); setFiltroGravidade('Todos')
    setFiltroClassificacao('Todos'); setFiltroData('')
  }

  const filtrosAtivos = [
    busca, filtroCategoria !== 'Todos', filtroMedida !== 'Todos',
    filtroGravidade !== 'Todos', filtroClassificacao !== 'Todos', filtroData,
  ].filter(Boolean).length

  const handleExport = useCallback(() => {
    if (isExporting || filteredData.length === 0) return
    setIsExporting(true)
    try { exportToExcel(filteredData) }
    catch (e) { console.error(e); alert('Erro ao exportar.') }
    finally { setIsExporting(false) }
  }, [filteredData, isExporting])

  return (
    <DashboardLayout title="Gestão de Medidas" breadcrumb="SIGS / Medida Administrativa / Listagem" navItems={navItems}>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Syne:wght@700;800&display=swap');
        .list-root { font-family:'DM Sans',sans-serif; padding:16px; background:#f8fafc; min-height:calc(100vh - 60px); }
        @media(min-width:640px){ .list-root { padding:20px 24px 60px; } }
        @media(min-width:1024px){ .list-root { padding:24px 32px 60px; } }

        .filter-wrap { background:#fff; border:1px solid #e3e8ef; border-radius:14px; margin-bottom:16px; overflow:hidden; }
        .filter-header { display:flex; align-items:center; justify-content:space-between; padding:12px 14px; border-bottom:1px solid #f1f5f9; }
        .filter-header-left { display:flex; align-items:center; gap:8px; font-size:12px; font-weight:700; color:#374151; text-transform:uppercase; letter-spacing:.06em; }
        .filter-badge { background:#3d6cf0; color:#fff; font-size:10px; font-weight:700; padding:2px 7px; border-radius:99px; }
        .filter-clear { display:flex; align-items:center; gap:5px; font-size:12px; font-weight:600; color:#9ca3af; background:none; border:none; cursor:pointer; }
        .filter-body { padding:12px 14px; display:grid; grid-template-columns:1fr; gap:10px; }
        @media(min-width:640px){ .filter-body { grid-template-columns:repeat(2,1fr); } }
        @media(min-width:1024px){ .filter-body { grid-template-columns:2fr 1fr 1fr 1fr 1fr 1fr; } }
        .filter-field { display:flex; flex-direction:column; gap:5px; }
        .filter-label { font-size:10.5px; font-weight:700; color:#9ca3af; text-transform:uppercase; }
        .filter-input { height:36px; background:#f8fafc; border:1px solid #e3e8ef; border-radius:8px; padding:0 10px; font-size:13px; outline:none; width:100%; transition:all .15s; }
        .filter-input:focus { border-color:#3d6cf0; background:#fff; }
        
        .table-scroll { overflow-x:auto; }
        .ins-main-card { background:#fff; border:1px solid #e2e8f0; border-radius:18px; }
        .ins-table { width:100%; border-collapse:collapse; min-width:900px; }
        .ins-table th { background:#f8fafc; padding:12px 14px; text-align:left; font-size:10px; font-weight:800; color:#8896ab; text-transform:uppercase; border-bottom:1px solid #e2e8f0; }
        .ins-row td { padding:12px 14px; border-bottom:1px solid #f1f5f9; }
        .ins-row:hover td { background:#fafbfd; }

        .btn-new { background:#E67A0E; color:#fff; padding:9px 14px; border-radius:12px; font-weight:800; font-size:12px; border:none; cursor:pointer; display:flex; align-items:center; gap:6px; }
        .btn-export { background:#fff; color:#374151; padding:8px 12px; border-radius:12px; font-weight:700; font-size:12px; border:1.5px solid #e3e8ef; cursor:pointer; display:flex; align-items:center; gap:6px; }

        .pagination-wrap { display:flex; align-items:center; justify-content:space-between; padding:14px 20px; border-top:1px solid #f1f5f9; }
        .pg-btn { min-width:34px; height:34px; border-radius:9px; border:1.5px solid #e3e8ef; background:#fff; cursor:pointer; display:flex; align-items:center; justify-content:center; }
        .pg-active { background:#3d6cf0 !important; color:#fff !important; }

        .action-item { width:100%; padding:10px 14px; display:flex; align-items:center; gap:10px; font-size:12px; font-weight:600; border:none; background:none; cursor:pointer; }
        .action-item:hover { background:#f8fafc; color:#094780; }
        .action-item.delete { color:#ef4444; }
      `}} />

      <div className="list-root">
        <div className="flex justify-between items-start mb-4 gap-3 flex-wrap">
          <div>
            <h2 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 'clamp(18px,4vw,26px)', color: '#0d1e33' }}>Medidas Administrativas</h2>
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
              <Plus size={15} strokeWidth={3} />
              <span className="hidden sm:inline">Nova Medida</span>
            </button>
          </div>
        </div>

        <div className="filter-wrap">
          <div className="filter-header">
            <div className="filter-header-left"><SlidersHorizontal size={14} /> Filtros {filtrosAtivos > 0 && <span className="filter-badge">{filtrosAtivos}</span>}</div>
            {filtrosAtivos > 0 && <button className="filter-clear" onClick={limparFiltros}><X size={12} /> Limpar</button>}
          </div>

          <div className="filter-body">
            <div className="filter-field">
              <span className="filter-label">Busca</span>
              <div style={{ display: 'flex', height: '36px', border: '1px solid #e3e8ef', borderRadius: '8px', overflow: 'hidden', background: '#f8fafc' }}>
                <select value={campoBusca} onChange={e => { setCampoBusca(e.target.value); setBusca('') }} style={{ border: 'none', outline: 'none', fontSize: '11px', fontWeight: 700, color: '#3d6cf0', padding: '0 8px', background: 'transparent' }}>
                  <option value="todos">Todos</option>
                  <option value="colaborador">Colaborador</option>
                  <option value="matricula">Matrícula</option>
                </select>
                <input style={{ flex: 1, border: 'none', outline: 'none', padding: '0 10px', fontSize: '12px', background: 'transparent' }} placeholder="Pesquisar..." value={busca} onChange={e => setBusca(e.target.value)} />
              </div>
            </div>

            <div className="filter-field">
              <span className="filter-label">Categoria</span>
              <select className="filter-input" value={filtroCategoria} onChange={e => setFiltroCategoria(e.target.value)}>
                <option value="Todos">Todas</option>
                <option value="SEGURANÇA">Segurança</option>
                <option value="ADMINISTRATIVA">Administrativa</option>
              </select>
            </div>

            <div className="filter-field">
              <span className="filter-label">Medida</span>
              <select className="filter-input" value={filtroMedida} onChange={e => setFiltroMedida(e.target.value)}>
                <option value="Todos">Todas</option>
                <option value="SUSPENSÃO">Suspensão</option>
                <option value="ADVERTÊNCIA ESCRITA">Adv. Escrita</option>
              </select>
            </div>

            <div className="filter-field">
              <span className="filter-label">Gravidade</span>
              <select className="filter-input" value={filtroGravidade} onChange={e => setFiltroGravidade(e.target.value)}>
                <option value="Todos">Todas</option>
                {Object.keys(GRAVIDADE_CONFIG).map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>

            <div className="filter-field">
              <span className="filter-label">Data</span>
              <input className="filter-input" type="date" value={filtroData} onChange={e => setFiltroData(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="ins-main-card">
          {loading ? (
            <div className="py-24 text-center"><Loader2 size={40} className="mx-auto mb-4 text-[#094780] animate-spin" /></div>
          ) : (
            <>
              <div className="table-scroll">
                <table className="ins-table">
                  <thead>
                    <tr>
                      <th>ID / Data</th>
                      <th>Colaborador</th>
                      <th>Supervisor</th>
                      <th>Medida</th>
                      <th>Gravidade</th>
                      <th style={{ textAlign: 'right' }}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedData.map(item => (
                      <tr key={item.id} className="ins-row">
                        <td>
                          <div className="font-bold text-[#094780] text-[12px] cursor-pointer hover:underline" onClick={() => router.push(`/medida-administrativa/detalhes/${item.id}`)}>#{item.id.slice(-6).toUpperCase()}</div>
                          <div className="text-[10px] text-[#8896ab]">{new Date(item.data).toLocaleDateString('pt-BR')}</div>
                        </td>
                        <td>
                          <div className="font-bold text-[#1a2535] text-[13px]">{item.colaborador}</div>
                          <div className="text-[10px] text-[#8896ab]">Mat: {item.matricula}</div>
                        </td>
                        <td>
                          <div className="font-bold text-[#1a2535] text-[13px]">{item.nomeSupervisor || '—'}</div>
                        </td>
                        <td>
                          <MedidaBadge medida={item.medida} />
                        </td>
                        <td>
                          <GravidadeBadge gravidade={item.gravidade} />
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <ActionMenu
                            onVisualizar={() => router.push(`/medida-administrativa/detalhes/${item.id}`)}
                            onEditar={() => router.push(`/medida-administrativa/editar/${item.id}`)}
                            onExcluir={() => handleOpenDeleteModal(item.id)}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination currentPage={currentPage} totalPages={totalPages} totalItems={filteredData.length} onPageChange={setCurrentPage} />
            </>
          )}
        </div>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-5"><AlertCircle size={32} className="text-red-500" /></div>
              <h3 className="text-xl font-bold mb-2">Excluir Medida?</h3>
              <p className="text-sm text-[#8896ab]">Esta ação não pode ser desfeita.</p>
            </div>
            <div className="flex gap-3 p-6 bg-slate-50 border-t">
              <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-3 px-4 rounded-xl text-sm font-bold bg-white border">Cancelar</button>
              <button onClick={confirmDelete} className="flex-1 py-3 px-4 rounded-xl text-sm font-bold text-white bg-red-500 hover:bg-red-600 flex items-center justify-center gap-2">
                {isDeleting ? <Loader2 size={16} className="animate-spin" /> : 'Sim, excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}