'use client'

import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import {
  Plus, Loader2, Trash2, AlertCircle, Eye, Edit2,
  MapPin, Building2, Globe, QrCode, Package,
  Flame, Droplets, Zap, Bell, Wind,
  Search, SlidersHorizontal, X, MoreVertical,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import QRCode from 'qrcode'

// ─── Tipos ────────────────────────────────────────────────────────────────────
type Local = {
  id: string
  nome: string
  base: string
  regional: string
  uf: string
  qrCode: string
  ativo: boolean
  equipamentoAtual?: {
    id: string
    tipo: string
    status: string
    codigo: string
    nome?: string
  } | null
}

// ─── Config Visual ────────────────────────────────────────────────────────────
const TIPO_CONFIG: Record<string, { color: string; bg: string; border: string; icon: any }> = {
  'Extintor':                 { color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe', icon: Flame    },
  'Hidrante':                 { color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0', icon: Droplets },
  'Iluminação de Emergência': { color: '#b45309', bg: '#fffbeb', border: '#fde68a', icon: Zap      },
  'Botoeiras e Sirenes':      { color: '#7c3aed', bg: '#faf5ff', border: '#e9d5ff', icon: Bell     },
  'Detector de Fumaça':       { color: '#c2410c', bg: '#fff7ed', border: '#fed7aa', icon: Wind     },
}

function TipoBadge({ tipo }: { tipo?: string }) {
  if (!tipo) return <span className="text-[10px] text-slate-400 font-bold italic">Sem equip.</span>
  const cfg = TIPO_CONFIG[tipo] ?? { color: '#4b5563', bg: '#f8fafc', border: '#e3e8ef', icon: Package }
  const Icon = cfg.icon
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-black uppercase border"
      style={{ background: cfg.bg, color: cfg.color, borderColor: cfg.border }}>
      <Icon size={9} /> {tipo}
    </span>
  )
}

// ─── Modal QR ─────────────────────────────────────────────────────────────────
function QrModal({ local, onClose }: { local: Local; onClose: () => void }) {
  const [qrDataUrl, setQrDataUrl] = useState('')

  useEffect(() => {
    if (!local?.qrCode) return
    QRCode.toDataURL(local.qrCode, { width: 280, margin: 2, color: { dark: '#0d1e33', light: '#ffffff' } })
      .then(setQrDataUrl).catch(console.error)
  }, [local.qrCode])

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-6">
      <div className="bg-white p-8 rounded-3xl text-center shadow-2xl max-w-xs w-full" style={{ animation: 'scaleIn .15s ease forwards' }}>
        <div className="flex items-center justify-center gap-2 mb-1">
          <QrCode size={18} className="text-[#3d6cf0]" />
          <h3 className="font-black text-lg text-slate-800">QR Code</h3>
        </div>
        <p className="text-[11px] font-bold text-[#3d6cf0] uppercase tracking-widest mb-1">{local.nome}</p>
        <p className="text-[11px] text-slate-400 mb-5">{local.regional} · {local.base}</p>
        {qrDataUrl
          ? <img src={qrDataUrl} alt="QR Code" className="mx-auto rounded-xl border border-slate-100 shadow-sm" />
          : <div className="w-[280px] h-[280px] bg-slate-100 rounded-xl mx-auto flex items-center justify-center"><Loader2 className="animate-spin text-slate-300" size={32} /></div>
        }
        <p className="text-[10px] text-slate-400 mt-4 font-mono break-all">{local.qrCode}</p>
        <div className="flex gap-3 mt-6">
          {qrDataUrl && (
            <a href={qrDataUrl} download={`qrcode-${local.qrCode}.png`}
              className="flex-1 py-2.5 bg-[#3d6cf0] text-white rounded-xl font-black text-xs text-center">
              BAIXAR
            </a>
          )}
          <button onClick={onClose} className="flex-1 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-black text-xs">
            FECHAR
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Action Menu ──────────────────────────────────────────────────────────────
function ActionMenu({ onVer, onEditar, onQr, onExcluir }: {
  onVer: () => void; onEditar: () => void; onQr: () => void; onExcluir: () => void
}) {
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
      if (document.getElementById('loc-action-menu')?.contains(e.target as Node)) return
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
        <div id="loc-action-menu" style={{
          position: 'fixed', top: coords.top, right: coords.right,
          background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px',
          boxShadow: '0 8px 30px rgba(0,0,0,.15)', zIndex: 9999,
          width: '158px', overflow: 'hidden', animation: 'menuIn .15s ease-out',
        }}>
          <button className="action-item" onClick={() => { setOpen(false); onVer() }}>
            <Eye size={14} /> Ver Detalhes
          </button>
          <button className="action-item" onClick={() => { setOpen(false); onEditar() }}>
            <Edit2 size={14} /> Editar
          </button>
          <button className="action-item" onClick={() => { setOpen(false); onQr() }}>
            <QrCode size={14} /> Ver QR Code
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
export default function ListaLocaisPage() {
  const router = useRouter()
  const { data: session } = useSession()

  const [locais, setLocais]         = useState<Local[]>([])
  const [loading, setLoading]       = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [itemParaDeletar, setItemParaDeletar] = useState<Local | null>(null)
  const [localQr, setLocalQr]       = useState<Local | null>(null)

  // ── Filtros ──
  const [busca, setBusca]               = useState('')
  const [campoBusca, setCampoBusca]     = useState('todos')
  const [filtroRegional, setFiltroRegional] = useState('Todos')
  const [filtroUf, setFiltroUf]         = useState('Todos')
  const [filtroEquipado, setFiltroEquipado] = useState('Todos') // com/sem equipamento

  const loadData = useCallback(async () => {
    if (!session) return
    setLoading(true)
    try {
      const token = (session as any).access_token || (session as any).accessToken
      const res = await fetch('http://localhost:3001/pontos', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setLocais(Array.isArray(data) ? data : (data?.data ?? []))
    } catch (e) {
      console.error('Erro ao carregar locais', e)
      setLocais([])
    } finally { setLoading(false) }
  }, [session])

  useEffect(() => { loadData() }, [loadData])

  const confirmDelete = async () => {
    if (!itemParaDeletar || !session) return
    setIsDeleting(true)
    try {
      const token = (session as any).access_token || (session as any).accessToken
      const res = await fetch(`http://localhost:3001/pontos/${itemParaDeletar.id}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok || res.status === 204) {
        setLocais(prev => prev.filter(l => l.id !== itemParaDeletar.id))
        setShowDeleteModal(false)
        setItemParaDeletar(null)
      } else {
        const err = await res.json().catch(() => ({}))
        alert(err?.message || 'Erro ao excluir local.')
      }
    } catch { alert('Erro de conexão.') }
    finally { setIsDeleting(false) }
  }

  // ── Listas dinâmicas ──
  const listaRegionais        = useMemo(() => Array.from(new Set(locais.map(l => l.regional).filter(Boolean))).sort(), [locais])
  const listaUfs              = useMemo(() => Array.from(new Set(locais.map(l => l.uf).filter(Boolean))).sort(), [locais])
  // Tipos de equipamento que estão vinculados a algum ponto (dinâmico, vem do backend)
  const listaTiposEquipamento = useMemo(() =>
    Array.from(new Set(locais.map(l => l.equipamentoAtual?.tipo).filter(Boolean))).sort() as string[],
  [locais])

  // ── Filtros ──
  const filteredData = useMemo(() => {
    if (!Array.isArray(locais)) return []
    const t = busca.toLowerCase()
    return locais.filter(l => {
      const matchBusca = !busca || (() => {
        switch (campoBusca) {
          case 'nome':        return l.nome?.toLowerCase().includes(t)
          case 'qrcode':      return l.qrCode?.toLowerCase().includes(t)
          case 'base':        return l.base?.toLowerCase().includes(t)
          case 'equipamento': return l.equipamentoAtual?.codigo?.toLowerCase().includes(t) || l.equipamentoAtual?.nome?.toLowerCase().includes(t)
          default: return (
            l.nome?.toLowerCase().includes(t) ||
            l.qrCode?.toLowerCase().includes(t) ||
            l.base?.toLowerCase().includes(t) ||
            l.equipamentoAtual?.codigo?.toLowerCase().includes(t)
          )
        }
      })()

      const matchRegional = filtroRegional === 'Todos' || l.regional === filtroRegional
      const matchUf       = filtroUf       === 'Todos' || l.uf === filtroUf
      // 'livre' = sem equipamento; qualquer outro valor = filtra pelo tipo do equipamento
      const matchEquipado =
        filtroEquipado === 'Todos' ? true :
        filtroEquipado === 'livre' ? !l.equipamentoAtual :
        l.equipamentoAtual?.tipo === filtroEquipado

      return matchBusca && matchRegional && matchUf && matchEquipado
    })
  }, [locais, busca, campoBusca, filtroRegional, filtroUf, filtroEquipado])

  const limparFiltros = () => {
    setBusca(''); setCampoBusca('todos')
    setFiltroRegional('Todos'); setFiltroUf('Todos'); setFiltroEquipado('Todos')
  }

  const filtrosAtivos = [
    busca,
    filtroRegional  !== 'Todos',
    filtroUf        !== 'Todos',
    filtroEquipado  !== 'Todos',
  ].filter(Boolean).length

  return (
    <DashboardLayout title="Locais" breadcrumb="SIGS / Locais / Listagem">
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

        @keyframes fadeIn  { from{opacity:0;} to{opacity:1;} }
        @keyframes scaleIn { from{opacity:0;transform:scale(.95);} to{opacity:1;transform:scale(1);} }
      `}} />

      <div className="list-root">

        {/* Header */}
        <div className="flex justify-between items-start mb-4 gap-3 flex-wrap">
          <div>
            <h2 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 'clamp(18px,4vw,26px)', color: '#0d1e33' }}>
              Locais de Instalação
            </h2>
            <p className="text-[11px] text-[#8896ab] font-bold uppercase mt-1">
              {loading ? 'Sincronizando...' : `${filteredData.length} pontos encontrados`}
            </p>
          </div>
          <button className="btn-new" onClick={() => router.push('/locais/novo')}>
            <Plus size={15} strokeWidth={3} /> Novo Local
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
                    <option value="nome">Nome do Local</option>
                    <option value="qrcode">QR Code</option>
                    <option value="base">Base</option>
                    <option value="equipamento">Equipamento</option>
                  </select>
                  <svg style={{ position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#3d6cf0' }} width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="6 9 12 15 18 9" /></svg>
                </div>
                <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
                  <Search style={{ position: 'absolute', left: '9px', color: '#c4cbd6' }} size={13} />
                  <input
                    style={{ width: '100%', height: '100%', background: 'transparent', border: 'none', outline: 'none', paddingLeft: '28px', paddingRight: '8px', fontSize: '13px', fontFamily: 'inherit', color: '#111827' }}
                    placeholder={
                      campoBusca === 'nome'        ? 'Nome do local...' :
                      campoBusca === 'qrcode'      ? 'Ex: LOC-ABC123...' :
                      campoBusca === 'base'        ? 'Nome da base...' :
                      campoBusca === 'equipamento' ? 'Código ou nome do equip...' : 'Pesquisar...'
                    }
                    value={busca}
                    onChange={e => setBusca(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="filter-field">
              <span className="filter-label">Regional</span>
              <div className="filter-select-wrap">
                <select className="filter-input" value={filtroRegional} onChange={e => setFiltroRegional(e.target.value)}>
                  <option value="Todos">Todas as Regionais</option>
                  {listaRegionais.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>

            <div className="filter-field">
              <span className="filter-label">UF</span>
              <div className="filter-select-wrap">
                <select className="filter-input" value={filtroUf} onChange={e => setFiltroUf(e.target.value)}>
                  <option value="Todos">Todos os Estados</option>
                  {listaUfs.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                </select>
              </div>
            </div>

            <div className="filter-field">
              <span className="filter-label">Situação</span>
              <div className="filter-select-wrap">
                <select className="filter-input" value={filtroEquipado} onChange={e => setFiltroEquipado(e.target.value)}>
                  <option value="Todos">Todos</option>
                  <option value="livre">Sem Equipamento</option>
                  {listaTiposEquipamento.map(tipo => (
                    <option key={tipo} value={tipo}>{tipo}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Chips */}
          {filtrosAtivos > 0 && (
            <div className="filter-chips">
              {busca         && <span className="filter-chip">"{busca}" <button onClick={() => setBusca('')}><X size={10} /></button></span>}
              {filtroRegional !== 'Todos' && <span className="filter-chip">{filtroRegional} <button onClick={() => setFiltroRegional('Todos')}><X size={10} /></button></span>}
              {filtroUf       !== 'Todos' && <span className="filter-chip">{filtroUf} <button onClick={() => setFiltroUf('Todos')}><X size={10} /></button></span>}
              {filtroEquipado !== 'Todos' && <span className="filter-chip">{filtroEquipado === 'livre' ? 'Sem Equipamento' : filtroEquipado} <button onClick={() => setFiltroEquipado('Todos')}><X size={10} /></button></span>}
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
              <p className="text-[14px] font-semibold text-[#9ca3af]">Nenhum local encontrado</p>
              <p className="text-[12px] text-[#c4cbd6] mt-1">Tente ajustar os filtros acima</p>
            </div>
          ) : (
            <div className="table-scroll">
              <table className="ins-table">
                <thead>
                  <tr>
                    <th>QR Code</th>
                    <th>Nome do Local</th>
                    <th>Base</th>
                    <th>Regional / UF</th>
                    <th>Equipamento</th>
                    <th style={{ textAlign: 'right' }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map(item => (
                    <tr key={item.id} className="ins-row">
                      <td style={{ minWidth: 130 }}>
                        <span className="font-mono text-[11px] bg-slate-100 px-2 py-1 rounded text-slate-600 font-bold">
                          {item.qrCode}
                        </span>
                      </td>

                      <td style={{ minWidth: 180 }}>
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                            <MapPin size={13} className="text-[#3d6cf0]" />
                          </div>
                          <span
                            className="font-bold text-[#094780] text-sm cursor-pointer hover:underline"
                            onClick={() => router.push(`/locais/detalhes/${item.id}`)}
                          >
                            {item.nome}
                          </span>
                        </div>
                      </td>

                      <td style={{ minWidth: 140 }}>
                        <div className="flex items-center gap-1.5">
                          <Building2 size={12} className="text-slate-400" />
                          <span className="text-sm text-slate-600 font-medium">{item.base || '—'}</span>
                        </div>
                      </td>

                      <td style={{ minWidth: 140 }}>
                        <div className="text-sm font-bold text-slate-700">{item.regional}</div>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Globe size={10} className="text-slate-400" />
                          <span className="text-[11px] text-slate-400">{item.uf}</span>
                        </div>
                      </td>

                      <td style={{ minWidth: 160 }}>
                        <TipoBadge tipo={item.equipamentoAtual?.tipo} />
                        {item.equipamentoAtual && (
                          <div className="text-[10px] text-slate-400 mt-0.5 font-mono">{item.equipamentoAtual.codigo}</div>
                        )}
                      </td>

                      <td style={{ textAlign: 'right', minWidth: 60 }}>
                        <div className="flex justify-end">
                          <ActionMenu
                            onVer={() => router.push(`/locais/detalhes/${item.id}`)}
                            onEditar={() => router.push(`/locais/editar/${item.id}`)}
                            onQr={() => setLocalQr(item)}
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

      {/* Modal QR */}
      {localQr && <QrModal local={localQr} onClose={() => setLocalQr(null)} />}

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
                Excluir Local?
              </h3>
              <p className="text-sm text-[#8896ab] leading-relaxed">
                Isso removerá o ponto <strong>{itemParaDeletar?.nome}</strong> permanentemente. O equipamento vinculado será desvinculado.
              </p>
            </div>
            <div className="flex gap-3 p-6 bg-slate-50 border-t border-slate-100">
              <button onClick={() => { setShowDeleteModal(false); setItemParaDeletar(null) }} disabled={isDeleting}
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