'use client'

import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import {
  Plus, Loader2, Trash2, Eye, AlertCircle, MapPin,
  CheckCircle2, AlertTriangle, XCircle, Clock,
  Flame, Droplets, Zap, Bell, Wind, Package,
  Search, SlidersHorizontal, X, MoreVertical, Edit2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'

// ─── Config Visual ────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; icon: any; color: string; bg: string; border: string }> = {
  'ATIVO':      { label: 'Ativo',      icon: CheckCircle2,  color: '#059669', bg: '#ecfdf5', border: '#a7f3d0' },
  'VENCIDO':    { label: 'Vencido',    icon: AlertTriangle, color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  'MANUTENCAO': { label: 'Manutenção', icon: XCircle,       color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
  'INATIVO':    { label: 'Inativo',    icon: Clock,         color: '#6b7280', bg: '#f9fafb', border: '#e5e7eb' },
}

const TIPO_CONFIG: Record<string, { color: string; bg: string; border: string; icon: any }> = {
  'Extintor':                 { color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe', icon: Flame    },
  'Hidrante':                 { color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0', icon: Droplets },
  'Iluminação de Emergência': { color: '#b45309', bg: '#fffbeb', border: '#fde68a', icon: Zap      },
  'Botoeiras e Sirenes':      { color: '#7c3aed', bg: '#faf5ff', border: '#e9d5ff', icon: Bell     },
  'Detector de Fumaça':       { color: '#c2410c', bg: '#fff7ed', border: '#fed7aa', icon: Wind     },
}

// ─── Badges ───────────────────────────────────────────────────────────────────
function TipoBadge({ tipo, subtipo }: { tipo: string; subtipo?: string }) {
  const cfg = TIPO_CONFIG[tipo] ?? { color: '#4b5563', bg: '#f8fafc', border: '#e3e8ef', icon: Package }
  const Icon = cfg.icon
  return (
    <div className="space-y-1">
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-black uppercase border"
        style={{ background: cfg.bg, color: cfg.color, borderColor: cfg.border }}>
        <Icon size={9} />
        {tipo === 'Iluminação de Emergência' ? 'Ilumin. Emerg.' :
         tipo === 'Botoeiras e Sirenes'      ? 'Botoeiras/Siren.' :
         tipo === 'Detector de Fumaça'       ? 'Det. Fumaça' : tipo}
      </span>
      {subtipo && <div className="text-[10px] text-slate-400 font-mono leading-tight">{subtipo}</div>}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const s    = (status ?? '').toUpperCase()
  const cfg  = STATUS_CONFIG[s] ?? STATUS_CONFIG['INATIVO']
  const Icon = cfg.icon
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border"
      style={{ background: cfg.bg, color: cfg.color, borderColor: cfg.border }}>
      <Icon size={10} strokeWidth={2.5} /> {cfg.label}
    </span>
  )
}

// ─── Action Menu ──────────────────────────────────────────────────────────────
function ActionMenu({ onVer, onEditar, onExcluir }: { onVer: () => void; onEditar: () => void; onExcluir: () => void }) {
  const [open, setOpen]     = useState(false)
  const [coords, setCoords] = useState({ top: 0, right: 0 })
  const btnRef              = useRef<HTMLButtonElement>(null)

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
      if (btnRef.current?.contains(e.target as Node)) return
      if (document.getElementById('eq-action-menu')?.contains(e.target as Node)) return
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
      <button ref={btnRef} onClick={handleOpen}
        className={cn('p-2 rounded-xl transition-all', open ? 'bg-[#f0f4f9] text-[#094780]' : 'text-[#b0bac8] hover:text-[#094780] hover:bg-[#f0f4f9]')}>
        <MoreVertical size={20} />
      </button>
      {open && (
        <div id="eq-action-menu" style={{
          position: 'fixed', top: coords.top, right: coords.right,
          background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px',
          boxShadow: '0 8px 30px rgba(0,0,0,.15)', zIndex: 9999,
          width: '148px', overflow: 'hidden', animation: 'menuIn .15s ease-out',
        }}>
          <button className="action-item" onClick={() => { setOpen(false); onVer() }}>
            <Eye size={14} /> Ver Detalhes
          </button>
          <button className="action-item" onClick={() => { setOpen(false); onEditar() }}>
            <Edit2 size={14} /> Editar
          </button>
          <div className="action-sep" />
          <button className="action-item delete" onClick={() => { setOpen(false); onExcluir() }}>
            <Trash2 size={14} /> Excluir
          </button>
        </div>
      )}
    </>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ListaEquipamentosPage() {
  const router = useRouter()
  const { data: session } = useSession()

  const [equipamentos, setEquipamentos]   = useState<any[]>([])
  const [loading, setLoading]             = useState(true)
  const [isDeleting, setIsDeleting]       = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [itemParaDeletar, setItemParaDeletar] = useState<any | null>(null)

  // ── Filtros ──
  const [busca, setBusca]               = useState('')
  const [campoBusca, setCampoBusca]     = useState('todos')
  const [filtroTipo, setFiltroTipo]     = useState('Todos')
  const [filtroStatus, setFiltroStatus] = useState('Todos')
  const [filtroLocal, setFiltroLocal]   = useState('Todos')
  const [filtroClasse, setFiltroClasse] = useState('Todos')
  const [filtroAgente, setFiltroAgente] = useState('Todos')
  const [filtroCarga, setFiltroCarga]   = useState('Todos')
  const [filtroValidade, setFiltroValidade] = useState('')

  const loadData = useCallback(async () => {
    const token = (session as any)?.access_token || (session as any)?.accessToken
    if (!token) return
    setLoading(true)
    try {
      const res  = await fetch('http://localhost:3001/equipamentos', { headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) throw new Error()
      const data = await res.json()
      const lista = Array.isArray(data) ? data : (data.data ?? [])

      setEquipamentos(lista.map((eq: any) => ({
        id:              eq.codigo || eq.serieCilindro,
        dbId:            eq.id,
        nome:            eq.nome || '',
        tipo:            eq.tipo,
        subtipo:         eq.tipo === 'Extintor'
          ? [eq.extintorClasse, eq.extintorCarga ? `${eq.extintorCarga}kg` : null, eq.agente].filter(Boolean).join(' · ')
          : undefined,
        extintorClasse:  eq.extintorClasse || '',
        extintorCarga:   eq.extintorCarga  ? String(eq.extintorCarga) : '',
        agente:          eq.agente         || '',
        serieInmetro:    eq.serieInmetro   || '',
        serieCilindro:   eq.serieCilindro  || '',
        proximaRecarga:  eq.proximaRecarga ? eq.proximaRecarga.split('T')[0] : '',
        local:           eq.pontoInstalacao?.nome || 'Em Estoque',
        regional:        eq.pontoInstalacao?.regional || 'N/A',
        status:          eq.status || 'INATIVO',
      })))
    } catch (e) {
      console.error(e)
      setEquipamentos([])
    } finally {
      setLoading(false)
    }
  }, [session])

  useEffect(() => { loadData() }, [loadData])

  const confirmDelete = async () => {
    if (!itemParaDeletar?.dbId || !session) return
    setIsDeleting(true)
    try {
      const token = (session as any)?.access_token || (session as any)?.accessToken
      const res = await fetch(`http://localhost:3001/equipamentos/${itemParaDeletar.dbId}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        setEquipamentos(prev => prev.filter(e => e.dbId !== itemParaDeletar.dbId))
        setShowDeleteModal(false)
      }
    } catch { alert('Erro ao excluir equipamento.') }
    finally { setIsDeleting(false) }
  }

  // Listas dinâmicas para filtros de extintor
  const listaClasses  = useMemo(() => Array.from(new Set(equipamentos.map(e => e.extintorClasse).filter(Boolean))).sort(), [equipamentos])
  const listaAgentes  = useMemo(() => Array.from(new Set(equipamentos.map(e => e.agente).filter(Boolean))).sort(), [equipamentos])
  const listaCargas   = useMemo(() => Array.from(new Set(equipamentos.map(e => e.extintorCarga).filter(Boolean))).sort((a, b) => Number(a) - Number(b)), [equipamentos])
  // Locais únicos vindos do backend (exclui "Em Estoque" pois é tratado separadamente)
  const listaLocais   = useMemo(() => Array.from(new Set(equipamentos.map(e => e.local).filter(l => l && l !== 'Em Estoque'))).sort(), [equipamentos])

  const filteredData = useMemo(() => {
    return equipamentos.filter(e => {
      const t = busca.toLowerCase()
      const matchBusca = !busca || (() => {
        switch (campoBusca) {
          case 'nome':         return e.nome?.toLowerCase().includes(t)
          case 'codigo':       return e.id?.toLowerCase().includes(t)
          case 'inmetro':      return e.serieInmetro?.toLowerCase().includes(t)
          case 'cilindro':     return e.serieCilindro?.toLowerCase().includes(t)
          case 'local':        return e.local?.toLowerCase().includes(t)
          default: return (
            e.nome?.toLowerCase().includes(t) ||
            e.id?.toLowerCase().includes(t) ||
            e.serieInmetro?.toLowerCase().includes(t) ||
            e.serieCilindro?.toLowerCase().includes(t) ||
            e.local?.toLowerCase().includes(t)
          )
        }
      })()

      const matchTipo     = filtroTipo   === 'Todos' || e.tipo === filtroTipo
      const matchStatus   = filtroStatus === 'Todos' || e.status.toUpperCase() === filtroStatus
      const matchLocal    = filtroLocal === 'Todos' ||
        (filtroLocal === 'estoque' && e.local === 'Em Estoque') ||
        e.local === filtroLocal
      const matchClasse   = filtroClasse === 'Todos' || e.extintorClasse === filtroClasse
      const matchAgente   = filtroAgente === 'Todos' || e.agente === filtroAgente
      const matchCarga    = filtroCarga  === 'Todos' || e.extintorCarga === filtroCarga
      const matchValidade = !filtroValidade || e.proximaRecarga === filtroValidade

      return matchBusca && matchTipo && matchStatus && matchLocal && matchClasse && matchAgente && matchCarga && matchValidade
    })
  }, [equipamentos, busca, campoBusca, filtroTipo, filtroStatus, filtroLocal, filtroClasse, filtroAgente, filtroCarga, filtroValidade])

  const limparFiltros = () => {
    setBusca(''); setCampoBusca('todos'); setFiltroTipo('Todos')
    setFiltroStatus('Todos'); setFiltroLocal('Todos'); setFiltroClasse('Todos')
    setFiltroAgente('Todos'); setFiltroCarga('Todos'); setFiltroValidade('')
  }

  const filtrosAtivos = [
    busca,
    filtroTipo    !== 'Todos',
    filtroStatus  !== 'Todos',
    filtroLocal   !== 'Todos',
    filtroClasse  !== 'Todos',
    filtroAgente  !== 'Todos',
    filtroCarga   !== 'Todos',
    filtroValidade,
  ].filter(Boolean).length

  // Mostra filtros de extintor apenas se o filtro de tipo for Extintor ou se há extintores na lista filtrada
  const showExtintorFilters = filtroTipo === 'Extintor' || filtroTipo === 'Todos'

  return (
    <DashboardLayout title="Equipamentos" breadcrumb="SIGS / Equipamentos / Listagem">
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Syne:wght@700;800&display=swap');
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
        @media(min-width:1024px){ .filter-body { grid-template-columns:2fr 1fr 1fr 1fr; } }
        .filter-body-ext { padding:0 14px 12px; display:grid; grid-template-columns:1fr; gap:10px; }
        @media(min-width:640px){ .filter-body-ext { padding:0 20px 14px; grid-template-columns:repeat(2,1fr); } }
        @media(min-width:1024px){ .filter-body-ext { grid-template-columns:repeat(4,1fr); } }
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
        .filter-ext-label { font-size:10px; font-weight:800; color:#1d4ed8; text-transform:uppercase; letter-spacing:.08em; padding:8px 14px 0; display:flex; align-items:center; gap:6px; }
        @media(min-width:640px){ .filter-ext-label { padding:8px 20px 0; } }

        .table-scroll { overflow-x:auto; -webkit-overflow-scrolling:touch; }
        .ins-main-card { background:#fff; border:1px solid #e2e8f0; border-radius:18px; overflow:visible; }
        .ins-table { width:100%; border-collapse:collapse; min-width:860px; }
        .ins-table th { background:#f8fafc; padding:12px 14px; text-align:left; font-size:10px; font-weight:800; color:#8896ab; text-transform:uppercase; border-bottom:1px solid #e2e8f0; white-space:nowrap; }
        @media(min-width:1024px){ .ins-table th { padding:14px 20px; } }
        .ins-row td { padding:12px 14px; vertical-align:top; border-bottom:1px solid #f1f5f9; transition:background .1s; }
        @media(min-width:1024px){ .ins-row td { padding:14px 20px; } }
        .ins-row:last-child td { border-bottom:none; }
        .ins-row:hover td { background:#fafbfd; }

        .btn-new { background:#E67A0E; color:#fff; padding:9px 14px; border-radius:12px; font-weight:800; font-size:12px; text-transform:uppercase; border:none; cursor:pointer; display:flex; align-items:center; gap:6px; transition:opacity .2s; white-space:nowrap; }
        .btn-new:hover { opacity:.9; }

        @keyframes menuIn { from{opacity:0;transform:translateY(-4px);} to{opacity:1;transform:translateY(0);} }
        .action-item { width:100%; padding:10px 14px; display:flex; align-items:center; gap:10px; font-size:12px; font-weight:600; color:#4a5568; transition:all .15s; border:none; background:none; cursor:pointer; text-align:left; }
        .action-item:hover { background:#f8fafc; color:#094780; }
        .action-item.delete { color:#ef4444; }
        .action-item.delete:hover { background:#fef2f2; }
        .action-sep { height:1px; background:#f1f5f9; margin:2px 0; }

        @keyframes fadeIn { from{opacity:0;} to{opacity:1;} }
        @keyframes scaleIn { from{opacity:0;transform:scale(.95);} to{opacity:1;transform:scale(1);} }
      `}} />

      <div className="list-root">

        {/* Header */}
        <div className="flex justify-between items-start mb-4 gap-3 flex-wrap">
          <div>
            <h2 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 'clamp(18px,4vw,26px)', color: '#0d1e33' }}>
              Equipamentos
            </h2>
            <p className="text-[11px] text-[#8896ab] font-bold uppercase mt-1">
              {loading ? 'Sincronizando...' : `${filteredData.length} itens encontrados`}
            </p>
          </div>
          <button className="btn-new" onClick={() => router.push('/equipamentos/novo')}>
            <Plus size={15} strokeWidth={3} /> Novo Equipamento
          </button>
        </div>

        {/* Filtros */}
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

          {/* Linha principal */}
          <div className="filter-body">
            {/* Busca com campo selecionável */}
            <div className="filter-field">
              <span className="filter-label">Busca</span>
              <div
                style={{ display: 'flex', height: '36px', border: '1px solid #e3e8ef', borderRadius: '8px', overflow: 'hidden', background: '#f8fafc', transition: 'border-color .15s,box-shadow .15s' }}
                onFocusCapture={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor='#3d6cf0'; el.style.boxShadow='0 0 0 3px rgba(61,108,240,.08)'; el.style.background='#fff' }}
                onBlurCapture={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor='#e3e8ef'; el.style.boxShadow='none'; el.style.background='#f8fafc' }}
              >
                <div style={{ position: 'relative', borderRight: '1px solid #e3e8ef', flexShrink: 0 }}>
                  <select
                    value={campoBusca}
                    onChange={e => { setCampoBusca(e.target.value); setBusca('') }}
                    style={{ height: '100%', background: 'transparent', border: 'none', outline: 'none', fontSize: '12px', fontWeight: 700, color: '#3d6cf0', fontFamily: 'inherit', paddingLeft: '10px', paddingRight: '22px', appearance: 'none', cursor: 'pointer' }}
                  >
                    <option value="todos">Todos os campos</option>
                    <option value="nome">Nome / Descrição</option>
                    <option value="codigo">Nº Série / Patrimônio</option>
                    <option value="inmetro">Nº Selo INMETRO</option>
                    <option value="cilindro">Nº Série Cilindro</option>
                    <option value="local">Local</option>
                  </select>
                  <svg style={{ position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#3d6cf0' }} width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="6 9 12 15 18 9" /></svg>
                </div>
                <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
                  <Search style={{ position: 'absolute', left: '9px', color: '#c4cbd6' }} size={13} />
                  <input
                    style={{ width: '100%', height: '100%', background: 'transparent', border: 'none', outline: 'none', paddingLeft: '28px', paddingRight: '8px', fontSize: '13px', fontFamily: 'inherit', color: '#111827' }}
                    placeholder={
                      campoBusca === 'nome'     ? 'Nome ou descrição...' :
                      campoBusca === 'codigo'   ? 'Ex: AMX-2024-9921...' :
                      campoBusca === 'inmetro'  ? 'Nº do selo INMETRO...' :
                      campoBusca === 'cilindro' ? 'Nº do cilindro...' :
                      campoBusca === 'local'    ? 'Nome do local...' : 'Pesquisar...'
                    }
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
                  <option value="Todos">Todos os Tipos</option>
                  {Object.keys(TIPO_CONFIG).map(t => <option key={t} value={t}>{t}</option>)}
                  <option value="Outro">Outro</option>
                </select>
              </div>
            </div>

            <div className="filter-field">
              <span className="filter-label">Status</span>
              <div className="filter-select-wrap">
                <select className="filter-input" value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}>
                  <option value="Todos">Todos os Status</option>
                  <option value="ATIVO">Ativo</option>
                  <option value="VENCIDO">Vencido</option>
                  <option value="MANUTENCAO">Manutenção</option>
                  <option value="INATIVO">Inativo</option>
                </select>
              </div>
            </div>

            <div className="filter-field">
              <span className="filter-label">Localização</span>
              <div className="filter-select-wrap">
                <select className="filter-input" value={filtroLocal} onChange={e => setFiltroLocal(e.target.value)}>
                  <option value="Todos">Todos os Locais</option>
                  <option value="estoque">Em Estoque</option>
                  {listaLocais.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Linha de filtros do Extintor */}
          {showExtintorFilters && (listaClasses.length > 0 || listaAgentes.length > 0 || listaCargas.length > 0) && (
            <>
              <div className="filter-ext-label">
                <Flame size={12} />
                Filtros específicos — Extintor
              </div>
              <div className="filter-body-ext">
                <div className="filter-field">
                  <span className="filter-label">Classe</span>
                  <div className="filter-select-wrap">
                    <select className="filter-input" value={filtroClasse} onChange={e => setFiltroClasse(e.target.value)}>
                      <option value="Todos">Todas as Classes</option>
                      {listaClasses.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                <div className="filter-field">
                  <span className="filter-label">Agente</span>
                  <div className="filter-select-wrap">
                    <select className="filter-input" value={filtroAgente} onChange={e => setFiltroAgente(e.target.value)}>
                      <option value="Todos">Todos os Agentes</option>
                      {listaAgentes.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                  </div>
                </div>

                <div className="filter-field">
                  <span className="filter-label">Carga (kg)</span>
                  <div className="filter-select-wrap">
                    <select className="filter-input" value={filtroCarga} onChange={e => setFiltroCarga(e.target.value)}>
                      <option value="Todos">Todas as Cargas</option>
                      {listaCargas.map(c => <option key={c} value={c}>{c} kg</option>)}
                    </select>
                  </div>
                </div>

                <div className="filter-field">
                  <span className="filter-label">Validade da Recarga</span>
                  <input className="filter-input" type="date" value={filtroValidade} onChange={e => setFiltroValidade(e.target.value)} />
                </div>
              </div>
            </>
          )}

          {/* Chips de filtros ativos */}
          {filtrosAtivos > 0 && (
            <div className="filter-chips">
              {busca && <span className="filter-chip">"{busca}" <button onClick={() => setBusca('')}><X size={10} /></button></span>}
              {filtroTipo    !== 'Todos' && <span className="filter-chip">{filtroTipo} <button onClick={() => setFiltroTipo('Todos')}><X size={10} /></button></span>}
              {filtroStatus  !== 'Todos' && <span className="filter-chip">{filtroStatus} <button onClick={() => setFiltroStatus('Todos')}><X size={10} /></button></span>}
              {filtroLocal   !== 'Todos' && <span className="filter-chip">{filtroLocal === 'estoque' ? 'Em Estoque' : filtroLocal} <button onClick={() => setFiltroLocal('Todos')}><X size={10} /></button></span>}
              {filtroClasse  !== 'Todos' && <span className="filter-chip">Classe {filtroClasse} <button onClick={() => setFiltroClasse('Todos')}><X size={10} /></button></span>}
              {filtroAgente  !== 'Todos' && <span className="filter-chip">{filtroAgente} <button onClick={() => setFiltroAgente('Todos')}><X size={10} /></button></span>}
              {filtroCarga   !== 'Todos' && <span className="filter-chip">{filtroCarga} kg <button onClick={() => setFiltroCarga('Todos')}><X size={10} /></button></span>}
              {filtroValidade && <span className="filter-chip">Recarga: {new Date(filtroValidade + 'T00:00:00').toLocaleDateString('pt-BR')} <button onClick={() => setFiltroValidade('')}><X size={10} /></button></span>}
            </div>
          )}
        </div>

        {/* Tabela */}
        <div className="ins-main-card">
          {loading ? (
            <div className="py-24 text-center">
              <Loader2 size={40} className="mx-auto mb-4 text-[#094780] animate-spin" />
            </div>
          ) : filteredData.length === 0 ? (
            <div className="py-20 text-center">
              <div className="w-14 h-14 rounded-full bg-[#f4f6f9] flex items-center justify-center mx-auto mb-3">
                <Search size={22} className="text-[#c4cbd6]" />
              </div>
              <p className="text-[14px] font-semibold text-[#9ca3af]">Nenhum equipamento encontrado</p>
              <p className="text-[12px] text-[#c4cbd6] mt-1">Tente ajustar os filtros acima</p>
            </div>
          ) : (
            <div className="table-scroll">
              <table className="ins-table">
                <thead>
                  <tr>
                    <th>Código / ID</th>
                    <th>Nome / Descrição</th>
                    <th>Tipo</th>
                    <th>Localização</th>
                    <th>Validade Recarga</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map(item => (
                    <tr key={item.dbId} className="ins-row">
                      <td style={{ minWidth: '130px' }}>
                        <div
                          className="font-bold text-[#094780] text-[13px] font-mono cursor-pointer hover:underline w-fit"
                          onClick={() => router.push(`/equipamentos/detalhes/${item.dbId}`)}
                        >
                          {item.id || '—'}
                        </div>
                        {item.serieInmetro && (
                          <div className="text-[10px] text-emerald-600 font-bold mt-0.5 flex items-center gap-1">
                            <span className="text-emerald-400">INMETRO</span> {item.serieInmetro}
                          </div>
                        )}
                      </td>

                      <td style={{ minWidth: '180px' }}>
                        <div className="font-bold text-[#1a2535] text-[13.5px] leading-tight">
                          {item.nome || <span className="text-slate-400 font-normal italic text-[12px]">Sem descrição</span>}
                        </div>
                        {item.local !== 'Em Estoque' && (
                          <div className="flex items-center gap-1 mt-1">
                            <MapPin size={10} className="text-slate-400 flex-shrink-0" />
                            <span className="text-[11px] text-slate-400">{item.local}</span>
                          </div>
                        )}
                        {item.local === 'Em Estoque' && (
                          <span className="text-[10px] text-slate-400 italic">Em Estoque</span>
                        )}
                      </td>

                      <td style={{ minWidth: '140px' }}>
                        <TipoBadge tipo={item.tipo} subtipo={item.subtipo} />
                      </td>

                      <td style={{ minWidth: '140px' }}>
                        <div className="text-sm font-bold text-slate-700">{item.local}</div>
                        {item.regional !== 'N/A' && (
                          <div className="text-[11px] text-slate-400 mt-0.5">{item.regional}</div>
                        )}
                      </td>

                      <td style={{ minWidth: '120px' }}>
                        {item.proximaRecarga ? (
                          <span className={cn(
                            'text-sm font-medium',
                            new Date(item.proximaRecarga) < new Date() ? 'text-red-500 font-bold' :
                            new Date(item.proximaRecarga) < new Date(Date.now() + 30 * 86400000) ? 'text-amber-500 font-bold' :
                            'text-slate-600'
                          )}>
                            {new Date(item.proximaRecarga + 'T00:00:00').toLocaleDateString('pt-BR')}
                          </span>
                        ) : (
                          <span className="text-[12px] text-slate-400 italic">—</span>
                        )}
                      </td>

                      <td style={{ minWidth: '110px' }}>
                        <StatusBadge status={item.status} />
                      </td>

                      <td style={{ textAlign: 'right', minWidth: '60px' }}>
                        <div className="flex justify-end">
                          <ActionMenu
                            onVer={() => router.push(`/equipamentos/detalhes/${item.dbId}`)}
                            onEditar={() => router.push(`/equipamentos/editar/${item.dbId}`)}
                            onExcluir={() => { setItemParaDeletar(item); setShowDeleteModal(true) }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal Exclusão */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
          style={{ animation: 'fadeIn .2s ease' }}>
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl"
            style={{ animation: 'scaleIn .25s cubic-bezier(0.16,1,0.3,1)' }}>
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-5">
                <AlertCircle size={32} className="text-red-500" />
              </div>
              <h3 style={{ fontFamily: 'Syne', fontWeight: 800 }} className="text-xl text-[#0d1e33] mb-2">
                Excluir Equipamento?
              </h3>
              <p className="text-sm text-[#8896ab] leading-relaxed">
                Deseja remover <strong>{itemParaDeletar?.id}</strong>? Esta ação é permanente.
              </p>
            </div>
            <div className="flex gap-3 p-6 bg-slate-50 border-t border-slate-100">
              <button onClick={() => setShowDeleteModal(false)} disabled={isDeleting}
                className="flex-1 py-3 px-4 rounded-xl text-sm font-bold text-[#4a5568] bg-white border border-[#e2e8f0] hover:bg-slate-100 disabled:opacity-50">
                Cancelar
              </button>
              <button onClick={confirmDelete} disabled={isDeleting}
                className="flex-1 py-3 px-4 rounded-xl text-sm font-bold text-white bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/20 flex items-center justify-center gap-2 disabled:opacity-70">
                {isDeleting ? <><Loader2 size={16} className="animate-spin" />Excluindo...</> : 'Sim, excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}