'use client'

import * as XLSX from 'xlsx'

import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import {
  Search, Plus, MoreVertical, Eye,
  Loader2, Trash2, Edit2, AlertCircle, X, SlidersHorizontal,
  Download, CheckCircle2, AlertTriangle, XCircle, Clock,
  Flame, Droplets, Waves, Radio, Package,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'

// ─── Tipos ────────────────────────────────────────────────────────────────────
type StatusEquip = 'ativo' | 'vencido' | 'manutencao' | 'inativo'

const STATUS_CONFIG: Record<StatusEquip, {
  label: string; icon: React.ElementType
  color: string; bg: string; border: string
}> = {
  ativo:       { label: 'Ativo',        icon: CheckCircle2,  color: '#059669', bg: '#ecfdf5', border: '#a7f3d0' },
  vencido:     { label: 'Vencido',      icon: AlertTriangle, color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  manutencao:  { label: 'Manutenção',   icon: XCircle,       color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
  inativo:     { label: 'Inativo',      icon: Clock,         color: '#6b7280', bg: '#f9fafb', border: '#e5e7eb' },
}

const TIPO_CONFIG: Record<string, { color: string; bg: string; border: string; icon: React.ElementType }> = {
  'Extintor':  { color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe', icon: Flame    },
  'Hidrante':  { color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0', icon: Droplets },
  'Sprinkler': { color: '#7e22ce', bg: '#faf5ff', border: '#e9d5ff', icon: Waves    },
  'Detector':  { color: '#c2410c', bg: '#fff7ed', border: '#fed7aa', icon: Radio    },
}

// ─── Mock ─────────────────────────────────────────────────────────────────────
const MOCK: any[] = [
  { id: 'EQ-9921', nome: 'Extintor CO₂ – Bloco A',       tipo: 'Extintor',  local: 'Bloco A – Térreo',    regional: 'Metropolitana', fabricante: 'Amerex',      capacidade: '6 kg',  ultimaInspecao: '2026-03-19', proximaInspecao: '2026-09-19', status: 'ativo'      },
  { id: 'EQ-4412', nome: 'Mangueira HID-12 – Pav 3',     tipo: 'Hidrante',  local: 'Pavimento 3 – Ala B', regional: 'Metropolitana', fabricante: 'Danfer',      capacidade: '40 m',  ultimaInspecao: '2026-03-19', proximaInspecao: '2026-04-19', status: 'vencido'    },
  { id: 'EQ-1022', nome: 'Extintor Pó – Oficina',         tipo: 'Extintor',  local: 'Oficina Central',     regional: 'Norte',         fabricante: 'Chubb',       capacidade: '4 kg',  ultimaInspecao: '2026-03-18', proximaInspecao: '2026-09-18', status: 'manutencao' },
  { id: 'EQ-8855', nome: 'Sprinkler – Almoxarifado',      tipo: 'Sprinkler', local: 'Almoxarifado B2',     regional: 'Metropolitana', fabricante: 'Viking',      capacidade: '—',     ultimaInspecao: '2026-03-18', proximaInspecao: '2026-06-18', status: 'ativo'      },
  { id: 'EQ-3310', nome: 'Extintor ABC – Recepção',       tipo: 'Extintor',  local: 'Recepção Principal',  regional: 'Sul',           fabricante: 'Amerex',      capacidade: '6 kg',  ultimaInspecao: '2026-03-17', proximaInspecao: '2026-09-17', status: 'ativo'      },
  { id: 'EQ-5561', nome: 'Detector de Fumaça – TI',       tipo: 'Detector',  local: 'Sala de Servidores',  regional: 'Metropolitana', fabricante: 'Siemens',     capacidade: '—',     ultimaInspecao: '2026-03-17', proximaInspecao: '2026-06-17', status: 'inativo'    },
  { id: 'EQ-7701', nome: 'Mangueira HID-07 – Pav 1',     tipo: 'Hidrante',  local: 'Pavimento 1 – Ala A', regional: 'Norte',         fabricante: 'Danfer',      capacidade: '30 m',  ultimaInspecao: '2026-03-16', proximaInspecao: '2026-04-16', status: 'vencido'    },
  { id: 'EQ-2230', nome: 'Extintor CO₂ – Datacenter',     tipo: 'Extintor',  local: 'Datacenter – Nível 2',regional: 'Metropolitana', fabricante: 'Chubb',       capacidade: '10 kg', ultimaInspecao: '2026-03-15', proximaInspecao: '2026-09-15', status: 'ativo'      },
  { id: 'EQ-6640', nome: 'Sprinkler – Refeitório',        tipo: 'Sprinkler', local: 'Refeitório – Bloco C',regional: 'Sul',           fabricante: 'Viking',      capacidade: '—',     ultimaInspecao: '2026-02-10', proximaInspecao: '2026-05-10', status: 'ativo'      },
  { id: 'EQ-1190', nome: 'Detector Temperatura – Coz.',   tipo: 'Detector',  local: 'Cozinha Industrial',  regional: 'Norte',         fabricante: 'Bosch',       capacidade: '—',     ultimaInspecao: '2026-01-22', proximaInspecao: '2026-04-22', status: 'manutencao' },
]

// ─── Export Excel ─────────────────────────────────────────────────────────────
function exportToExcel(data: any[]) {
  const rows = data.map(e => ({
    'ID':               e.id ?? '',
    'Nome':             e.nome ?? '',
    'Tipo':             e.tipo ?? '',
    'Local':            e.local ?? '',
    'Regional':         e.regional ?? '',
    'Fabricante':       e.fabricante ?? '',
    'Capacidade':       e.capacidade ?? '',
    'Última Inspeção':  e.ultimaInspecao ?? '',
    'Próxima Inspeção': e.proximaInspecao ?? '',
    'Status':           STATUS_CONFIG[e.status as StatusEquip]?.label ?? e.status ?? '',
  }))
  const ws = XLSX.utils.json_to_sheet(rows)
  ws['!cols'] = [
    { wch: 10 }, { wch: 34 }, { wch: 12 }, { wch: 28 },
    { wch: 16 }, { wch: 18 }, { wch: 10 }, { wch: 14 }, { wch: 14 }, { wch: 12 },
  ]
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Equipamentos')
  const date = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')
  XLSX.writeFile(wb, `equipamentos_${date}.xlsx`)
}

// ─── Action Menu ──────────────────────────────────────────────────────────────
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
          open ? 'bg-[#f0f4f9] text-[#3d6cf0]' : 'text-[#b0bac8] hover:text-[#3d6cf0] hover:bg-[#f0f4f9]'
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

// ─── Badges ───────────────────────────────────────────────────────────────────
function TipoBadge({ tipo }: { tipo: string }) {
  const cfg  = TIPO_CONFIG[tipo] ?? { color: '#4b5563', bg: '#f8fafc', border: '#e3e8ef', icon: Package }
  const Icon = cfg.icon
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-black uppercase border"
      style={{ background: cfg.bg, color: cfg.color, borderColor: cfg.border }}
    >
      <Icon size={9} />
      {tipo}
    </span>
  )
}

function StatusBadge({ status }: { status: string }) {
  const cfg  = STATUS_CONFIG[status as StatusEquip] ?? STATUS_CONFIG.inativo
  const Icon = cfg.icon
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border"
      style={{ background: cfg.bg, color: cfg.color, borderColor: cfg.border }}
    >
      <Icon size={10} strokeWidth={2.5} />
      {cfg.label}
    </span>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ListaEquipamentosPage() {
  const router = useRouter()
  const { data: session } = useSession()

  const [equipamentos, setEquipamentos] = useState<any[]>([])
  const [loading, setLoading]           = useState(true)
  const [isDeleting, setIsDeleting]     = useState(false)
  const [isExporting, setIsExporting]   = useState(false)

  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [itemParaDeletar, setItemParaDeletar] = useState<any | null>(null)

  const [busca, setCampoBusca_busca]            = useState('')
  const [campoBusca, setCampoBusca]             = useState('todos')
  const [filtroTipo, setFiltroTipo]             = useState('Todos')
  const [filtroStatus, setFiltroStatus]         = useState('Todos')
  const [filtroRegional, setFiltroRegional]     = useState('Todos')
  const [filtroFabricante, setFiltroFabricante] = useState('Todos')

  const setBusca = setCampoBusca_busca

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        // const token = (session as any)?.access_token || (session as any)?.accessToken
        // const res = await fetch('http://localhost:3001/equipamentos', { headers: { Authorization: `Bearer ${token}` } })
        // setEquipamentos(await res.json())
        await new Promise(r => setTimeout(r, 600))
        setEquipamentos(MOCK)
      } catch { console.error('Falha ao carregar') }
      finally { setLoading(false) }
    }
    load()
  }, [session])

  const listaRegionais   = useMemo(() => Array.from(new Set(equipamentos.map(e => e.regional).filter(Boolean))).sort() as string[], [equipamentos])
  const listaFabricantes = useMemo(() => Array.from(new Set(equipamentos.map(e => e.fabricante).filter(Boolean))).sort() as string[], [equipamentos])

  const handleOpenDeleteModal = (item: any) => { setItemParaDeletar(item); setShowDeleteModal(true) }

  const confirmDelete = async () => {
    if (!itemParaDeletar) return
    setIsDeleting(true)
    try {
      // await fetch(`http://localhost:3001/equipamentos/${itemParaDeletar.id}`, { method: 'DELETE', ... })
      setEquipamentos(p => p.filter(e => e.id !== itemParaDeletar.id))
      setShowDeleteModal(false)
    } catch { alert('Não foi possível excluir.') }
    finally { setIsDeleting(false); setItemParaDeletar(null) }
  }

  const filteredData = useMemo(() => {
    return equipamentos.filter(e => {
      const t = busca.toLowerCase()
      const matchBusca = !busca || (() => {
        switch (campoBusca) {
          case 'id':    return e.id?.toLowerCase().includes(t)
          case 'nome':  return e.nome?.toLowerCase().includes(t)
          case 'local': return e.local?.toLowerCase().includes(t)
          default: return (
            e.id?.toLowerCase().includes(t) ||
            e.nome?.toLowerCase().includes(t) ||
            e.local?.toLowerCase().includes(t) ||
            e.fabricante?.toLowerCase().includes(t)
          )
        }
      })()
      return (
        matchBusca &&
        (filtroTipo === 'Todos' || e.tipo === filtroTipo) &&
        (filtroStatus === 'Todos' || e.status === filtroStatus) &&
        (filtroRegional === 'Todos' || e.regional === filtroRegional) &&
        (filtroFabricante === 'Todos' || e.fabricante === filtroFabricante)
      )
    })
  }, [equipamentos, busca, campoBusca, filtroTipo, filtroStatus, filtroRegional, filtroFabricante])

  const limparFiltros = () => {
    setBusca(''); setCampoBusca('todos'); setFiltroTipo('Todos')
    setFiltroStatus('Todos'); setFiltroRegional('Todos'); setFiltroFabricante('Todos')
  }

  const filtrosAtivos = [
    busca,
    filtroTipo !== 'Todos',
    filtroStatus !== 'Todos',
    filtroRegional !== 'Todos',
    filtroFabricante !== 'Todos',
  ].filter(Boolean).length

  const handleExport = useCallback(() => {
    if (isExporting || filteredData.length === 0) return
    setIsExporting(true)
    try { exportToExcel(filteredData) }
    catch (e) { console.error(e); alert('Erro ao exportar.') }
    finally { setIsExporting(false) }
  }, [filteredData, isExporting])

  return (
    <DashboardLayout title="Equipamentos" breadcrumb="SIGS / Equipamentos / Listagem">
      <style dangerouslySetInnerHTML={{ __html: `
        .list-root { font-family:'DM Sans',sans-serif; padding:16px; background:#f8fafc; min-height:calc(100vh - 60px); }
        @media(min-width:640px){ .list-root { padding:20px 24px 60px; } }
        @media(min-width:1024px){ .list-root { padding:24px 32px 60px; } }

        .filter-wrap { background:#fff; border:1px solid #e3e8ef; border-radius:14px; margin-bottom:16px; overflow:hidden; }
        .filter-header { display:flex; align-items:center; justify-content:space-between; padding:12px 14px; border-bottom:1px solid #f1f5f9; }
        @media(min-width:640px){ .filter-header { padding:14px 20px; } }
        .filter-header-left { display:flex; align-items:center; gap:8px; font-size:12px; font-weight:700; color:#374151; text-transform:uppercase; letter-spacing:.06em; }
        .filter-badge { background:#3d6cf0; color:#fff; font-size:10px; font-weight:700; padding:2px 7px; border-radius:99px; line-height:1.6; }
        .filter-clear { display:flex; align-items:center; gap:5px; font-size:12px; font-weight:600; color:#9ca3af; background:none; border:none; cursor:pointer; padding:4px 8px; border-radius:6px; transition:all .15s; }
        .filter-clear:hover { color:#ef4444; background:#fef2f2; }
        .filter-body { padding:12px 14px; display:grid; grid-template-columns:1fr; gap:10px; }
        @media(min-width:640px){ .filter-body { padding:14px 20px; grid-template-columns:repeat(2,1fr); } }
        @media(min-width:1024px){ .filter-body { grid-template-columns:2fr 1fr 1fr 1fr 1fr; } }
        .filter-field { display:flex; flex-direction:column; gap:5px; }
        .filter-label { font-size:10.5px; font-weight:700; color:#9ca3af; text-transform:uppercase; letter-spacing:.07em; }
        .filter-input { height:36px; background:#f8fafc; border:1px solid #e3e8ef; border-radius:8px; padding:0 10px; font-size:13px; font-family:inherit; color:#111827; outline:none; width:100%; transition:border-color .15s,box-shadow .15s; appearance:none; }
        .filter-input:focus { border-color:#3d6cf0; background:#fff; box-shadow:0 0 0 3px rgba(61,108,240,.08); }
        .filter-input::placeholder { color:#c4cbd6; }
        select.filter-input { cursor:pointer; padding-right:28px; }
        .filter-select-wrap { position:relative; }
        .filter-select-wrap::after { content:''; position:absolute; right:10px; top:50%; transform:translateY(-50%); width:0; height:0; border-left:4px solid transparent; border-right:4px solid transparent; border-top:5px solid #c4cbd6; pointer-events:none; }
        .filter-chips { display:flex; flex-wrap:wrap; gap:6px; padding:0 14px 12px; }
        @media(min-width:640px){ .filter-chips { padding:0 20px 14px; } }
        .filter-chip { display:inline-flex; align-items:center; gap:5px; padding:3px 10px; background:#eef2ff; border:1px solid #c7d5fb; border-radius:99px; font-size:11.5px; font-weight:600; color:#3d6cf0; }
        .filter-chip button { background:none; border:none; cursor:pointer; color:#3d6cf0; display:flex; align-items:center; padding:0; opacity:.6; }
        .filter-chip button:hover { opacity:1; }

        .table-scroll { overflow-x:auto; overflow-y:visible; -webkit-overflow-scrolling:touch; }
        .ins-main-card { background:#fff; border:1px solid #e2e8f0; border-radius:18px; overflow:visible; }
        .ins-main-card .table-scroll { border-radius:18px; }
        .ins-main-card .ins-table thead tr:first-child th:first-child { border-top-left-radius:18px; }
        .ins-main-card .ins-table thead tr:first-child th:last-child { border-top-right-radius:18px; }

        .ins-table { width:100%; border-collapse:collapse; min-width:960px; }
        .ins-table th { background:#f8fafc; padding:12px 14px; text-align:left; font-size:10px; font-weight:800; color:#8896ab; text-transform:uppercase; border-bottom:1px solid #e2e8f0; white-space:nowrap; }
        @media(min-width:1024px){ .ins-table th { padding:14px 20px; } }
        .ins-row td { padding:12px 14px; vertical-align:top; border-bottom:1px solid #f1f5f9; transition:background .1s; }
        @media(min-width:1024px){ .ins-row td { padding:14px 20px; } }
        .ins-row:last-child td { border-bottom:none; }
        .ins-row:hover td { background:#fafbfd; }
        .col-sep { border-left:1px solid #f1f5f9; }

        .btn-new { background:#E67A0E; color:#fff; padding:9px 14px; border-radius:12px; font-weight:800; font-size:12px; text-transform:uppercase; border:none; cursor:pointer; display:flex; align-items:center; gap:6px; transition:opacity .2s; white-space:nowrap; }
        .btn-new:hover { opacity:.9; }
        .btn-export { background:#fff; color:#374151; padding:8px 12px; border-radius:12px; font-weight:700; font-size:12px; border:1.5px solid #e3e8ef; cursor:pointer; display:flex; align-items:center; gap:6px; transition:all .2s; white-space:nowrap; }
        .btn-export:hover:not(:disabled) { border-color:#10b981; color:#10b981; background:#f0fdf4; }
        .btn-export:disabled { opacity:.5; cursor:not-allowed; }

        @keyframes menuIn { from{opacity:0;transform:translateY(-4px);} to{opacity:1;transform:translateY(0);} }
        .action-item { width:100%; padding:10px 14px; display:flex; align-items:center; gap:10px; font-size:12px; font-weight:600; color:#4a5568; transition:all .15s; border:none; background:none; cursor:pointer; text-align:left; }
        .action-item:hover { background:#f8fafc; color:#3d6cf0; }
        .action-item.delete { color:#ef4444; }
        .action-item.delete:hover { background:#fef2f2; }
        .action-sep { height:1px; background:#f1f5f9; margin:2px 0; }

        @keyframes fadeIn { from{opacity:0;} to{opacity:1;} }
        @keyframes scaleIn { from{opacity:0;transform:scale(.95);} to{opacity:1;transform:scale(1);} }
      `}} />

      <div className="list-root">

        {/* ── Header ── */}
        <div className="flex justify-between items-start mb-4 gap-3 flex-wrap">
          <div>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 'clamp(18px,4vw,26px)', color: '#0d1e33' }}>
              Equipamentos
            </h2>
            <p className="text-[11px] text-[#8896ab] font-bold uppercase mt-1">
              {loading ? 'Sincronizando...' : `${filteredData.length} registros encontrados`}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              className="btn-export"
              onClick={handleExport}
              disabled={isExporting || filteredData.length === 0 || loading}
            >
              {isExporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
              <span className="hidden sm:inline">{isExporting ? 'Exportando...' : 'Exportar Excel'}</span>
              {!isExporting && filteredData.length > 0 && (
                <span style={{ background: '#f0fdf4', color: '#10b981', fontSize: '10px', fontWeight: 800, padding: '1px 6px', borderRadius: '99px', border: '1px solid #bbf7d0' }}>
                  {filteredData.length}
                </span>
              )}
            </button>
            <button className="btn-new" onClick={() => router.push('/equipamentos/novo')}>
              <Plus size={15} strokeWidth={3} />
              <span className="hidden sm:inline">Novo Equipamento</span>
              <span className="sm:hidden">Novo</span>
            </button>
          </div>
        </div>

        {/* ── Filtros ── */}
        <div className="filter-wrap">
          <div className="filter-header">
            <div className="filter-header-left">
              <SlidersHorizontal size={14} />
              Filtros
              {filtrosAtivos > 0 && <span className="filter-badge">{filtrosAtivos}</span>}
            </div>
            {filtrosAtivos > 0 && (
              <button className="filter-clear" onClick={limparFiltros}><X size={12} /> Limpar</button>
            )}
          </div>

          <div className="filter-body">
            {/* Busca com campo selecionável */}
            <div className="filter-field">
              <span className="filter-label">Busca</span>
              <div
                style={{ display:'flex', height:'36px', border:'1px solid #e3e8ef', borderRadius:'8px', overflow:'hidden', background:'#f8fafc', transition:'border-color .15s,box-shadow .15s' }}
                onFocusCapture={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor='#3d6cf0'; el.style.boxShadow='0 0 0 3px rgba(61,108,240,.08)'; el.style.background='#fff' }}
                onBlurCapture={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor='#e3e8ef'; el.style.boxShadow='none'; el.style.background='#f8fafc' }}
              >
                <div style={{ position:'relative', borderRight:'1px solid #e3e8ef', flexShrink:0 }}>
                  <select
                    value={campoBusca}
                    onChange={e => { setCampoBusca(e.target.value); setBusca('') }}
                    style={{ height:'100%', background:'transparent', border:'none', outline:'none', fontSize:'12px', fontWeight:700, color:'#3d6cf0', fontFamily:'inherit', paddingLeft:'10px', paddingRight:'22px', appearance:'none', cursor:'pointer' }}
                  >
                    <option value="todos">Todos os campos</option>
                    <option value="id">ID</option>
                    <option value="nome">Nome</option>
                    <option value="local">Local</option>
                  </select>
                  <svg style={{ position:'absolute', right:'6px', top:'50%', transform:'translateY(-50%)', pointerEvents:'none', color:'#3d6cf0' }} width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="6 9 12 15 18 9" /></svg>
                </div>
                <div style={{ position:'relative', flex:1, display:'flex', alignItems:'center' }}>
                  <Search style={{ position:'absolute', left:'9px', color:'#c4cbd6' }} size={13} />
                  <input
                    style={{ width:'100%', height:'100%', background:'transparent', border:'none', outline:'none', paddingLeft:'28px', paddingRight:'8px', fontSize:'13px', fontFamily:'inherit', color:'#111827' }}
                    placeholder={campoBusca === 'id' ? 'Ex: EQ-9921...' : campoBusca === 'nome' ? 'Nome do equipamento...' : campoBusca === 'local' ? 'Local de instalação...' : 'Pesquisar...'}
                    value={busca}
                    onChange={e => setBusca(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="filter-field">
              <span className="filter-label">Tipo</span>
              <div className="filter-select-wrap">
                <select className="filter-input" value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}>
                  <option value="Todos">Todos</option>
                  {Object.keys(TIPO_CONFIG).map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            <div className="filter-field">
              <span className="filter-label">Status</span>
              <div className="filter-select-wrap">
                <select className="filter-input" value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}>
                  <option value="Todos">Todos</option>
                  {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
            </div>

            <div className="filter-field">
              <span className="filter-label">Regional</span>
              <div className="filter-select-wrap">
                <select className="filter-input" value={filtroRegional} onChange={e => setFiltroRegional(e.target.value)}>
                  <option value="Todos">Todas</option>
                  {listaRegionais.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>

            <div className="filter-field">
              <span className="filter-label">Fabricante</span>
              <div className="filter-select-wrap">
                <select className="filter-input" value={filtroFabricante} onChange={e => setFiltroFabricante(e.target.value)}>
                  <option value="Todos">Todos</option>
                  {listaFabricantes.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
            </div>
          </div>

          {filtrosAtivos > 0 && (
            <div className="filter-chips">
              {busca && <span className="filter-chip">"{busca}" <button onClick={() => setBusca('')}><X size={10} /></button></span>}
              {filtroTipo !== 'Todos' && <span className="filter-chip">{filtroTipo} <button onClick={() => setFiltroTipo('Todos')}><X size={10} /></button></span>}
              {filtroStatus !== 'Todos' && <span className="filter-chip">{STATUS_CONFIG[filtroStatus as StatusEquip]?.label ?? filtroStatus} <button onClick={() => setFiltroStatus('Todos')}><X size={10} /></button></span>}
              {filtroRegional !== 'Todos' && <span className="filter-chip">{filtroRegional} <button onClick={() => setFiltroRegional('Todos')}><X size={10} /></button></span>}
              {filtroFabricante !== 'Todos' && <span className="filter-chip">{filtroFabricante} <button onClick={() => setFiltroFabricante('Todos')}><X size={10} /></button></span>}
            </div>
          )}
        </div>

        {/* ── Tabela ── */}
        <div className="ins-main-card">
          {loading ? (
            <div className="py-24 text-center">
              <Loader2 size={40} className="mx-auto mb-4 text-[#3d6cf0] animate-spin" />
            </div>
          ) : filteredData.length === 0 ? (
            <div className="py-20 text-center">
              <div className="w-14 h-14 rounded-full bg-[#f4f6f9] flex items-center justify-center mx-auto mb-3">
                <Search size={22} className="text-[#c4cbd6]" />
              </div>
              <p className="text-[14px] font-semibold text-[#9ca3af]">Nenhum registro encontrado</p>
              <p className="text-[12px] text-[#c4cbd6] mt-1">Tente ajustar os filtros acima</p>
            </div>
          ) : (
            <div className="table-scroll">
              <table className="ins-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nome / Local</th>
                    <th className="col-sep">Tipo</th>
                    <th>Fabricante</th>
                    <th>Capacidade</th>
                    <th>Próx. Inspeção</th>
                    <th>Status</th>
                    <th style={{ textAlign:'right' }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map(item => {
                    const proxDt    = new Date(item.proximaInspecao + 'T00:00:00')
                    const hoje      = new Date()
                    const diasFalta = Math.ceil((proxDt.getTime() - hoje.getTime()) / 86400000)
                    const vencendo  = diasFalta <= 30 && diasFalta > 0
                    const vencido   = diasFalta <= 0

                    return (
                      <tr key={item.id} className="ins-row">

                        {/* ID */}
                        <td style={{ minWidth:'100px' }}>
                          <div
                            className="font-bold text-[#3d6cf0] text-[13px] cursor-pointer hover:underline w-fit"
                            onClick={() => router.push(`/equipamentos/${item.id}`)}
                          >
                            {item.id}
                          </div>
                          <div className="text-[10px] text-[#9ca3af] font-medium mt-0.5">{item.regional}</div>
                        </td>

                        {/* Nome / Local */}
                        <td style={{ minWidth:'220px' }}>
                          <div className="font-bold text-[#1a2535] text-[13.5px] leading-tight">{item.nome}</div>
                          <div className="text-[11px] text-[#9ca3af] mt-0.5">{item.local}</div>
                        </td>

                        {/* Tipo */}
                        <td className="col-sep" style={{ minWidth:'110px' }}>
                          <TipoBadge tipo={item.tipo} />
                        </td>

                        {/* Fabricante */}
                        <td style={{ minWidth:'120px' }}>
                          <span className="text-[13px] font-semibold text-[#374151]">{item.fabricante}</span>
                        </td>

                        {/* Capacidade */}
                        <td style={{ minWidth:'100px' }}>
                          <span className="text-[13px] font-semibold text-[#374151]">{item.capacidade}</span>
                        </td>

                        {/* Próxima Inspeção */}
                        <td style={{ minWidth:'130px' }}>
                          <div className={cn('text-[13px] font-bold', vencido ? 'text-red-500' : vencendo ? 'text-amber-500' : 'text-[#374151]')}>
                            {proxDt.toLocaleDateString('pt-BR')}
                          </div>
                          {vencido && (
                            <div className="text-[10px] text-red-400 font-bold mt-0.5">Vencida há {Math.abs(diasFalta)}d</div>
                          )}
                          {vencendo && (
                            <div className="text-[10px] text-amber-400 font-bold mt-0.5">Vence em {diasFalta}d</div>
                          )}
                        </td>

                        {/* Status */}
                        <td style={{ minWidth:'120px' }}>
                          <StatusBadge status={item.status} />
                        </td>

                        {/* Ações */}
                        <td style={{ textAlign:'right', minWidth:'60px' }}>
                          <div className="flex justify-end">
                            <ActionMenu
                              onVisualizar={() => router.push(`/equipamentos/${item.id}`)}
                              onEditar={() => router.push(`/equipamentos/editar/${item.id}`)}
                              onExcluir={() => handleOpenDeleteModal(item)}
                            />
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── Modal Excluir ── */}
      {showDeleteModal && itemParaDeletar && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
          style={{ animation: 'fadeIn .2s ease' }}
        >
          <div
            className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl"
            style={{ animation: 'scaleIn .25s cubic-bezier(0.16,1,0.3,1)' }}
          >
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-5">
                <AlertCircle size={32} className="text-red-500" />
              </div>
              <h3 style={{ fontFamily:'Syne, sans-serif', fontWeight:800 }} className="text-xl text-[#0d1e33] mb-1">
                Excluir Equipamento?
              </h3>
              <p className="text-[13px] font-bold text-[#3d6cf0] mb-2">{itemParaDeletar.id}</p>
              <p className="text-sm text-[#8896ab] leading-relaxed">
                Esta ação é permanente e removerá todos os dados e histórico de inspeções vinculados.
              </p>
            </div>
            <div className="flex gap-3 p-6 bg-slate-50 border-t border-slate-100">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="flex-1 py-3 px-4 rounded-xl text-sm font-bold text-[#4a5568] bg-white border border-[#e2e8f0] hover:bg-slate-100 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="flex-1 py-3 px-4 rounded-xl text-sm font-bold text-white bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/20 flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {isDeleting ? <><Loader2 size={16} className="animate-spin" />Excluindo...</> : 'Sim, excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}