'use client'

import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import {
  Plus, Loader2, Eye,
  MapPin, CheckCircle2, AlertTriangle, XCircle,
  Search, SlidersHorizontal, X, MoreVertical,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'

// ─── Config ───────────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, {
  label:  string
  icon:   React.ElementType
  color:  string
  bg:     string
  border: string
}> = {
  'APROVADO':  { label: 'Aprovado',  icon: CheckCircle2,  color: '#059669', bg: '#ecfdf5', border: '#a7f3d0' },
  'ATENCAO':   { label: 'Atenção',   icon: AlertTriangle, color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  'REPROVADO': { label: 'Reprovado', icon: XCircle,       color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
}

function StatusBadge({ status }: { status: string }) {
  const s    = (status ?? '').toUpperCase()
  const cfg  = STATUS_CONFIG[s] ?? { label: s, icon: CheckCircle2, color: '#6b7280', bg: '#f9fafb', border: '#e5e7eb' }
  const Icon = cfg.icon
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border"
      style={{ background: cfg.bg, color: cfg.color, borderColor: cfg.border }}
    >
      <Icon size={10} strokeWidth={2.5} /> {cfg.label}
    </span>
  )
}

// ─── Action Menu ──────────────────────────────────────────────────────────────
function ActionMenu({ onVer }: { onVer: () => void }) {
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
      if (document.getElementById('insp-action-menu')?.contains(e.target as Node)) return
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
          id="insp-action-menu"
          style={{
            position:     'fixed',
            top:          coords.top,
            right:        coords.right,
            background:   '#fff',
            border:       '1px solid #e2e8f0',
            borderRadius: '12px',
            boxShadow:    '0 8px 30px rgba(0,0,0,.15)',
            zIndex:       9999,
            width:        '148px',
            overflow:     'hidden',
            animation:    'menuIn .15s ease-out',
          }}
        >
          <button className="action-item" onClick={() => { setOpen(false); onVer() }}>
            <Eye size={14} /> Ver Detalhes
          </button>
        </div>
      )}
    </>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ListaInspecoesPage() {
  const router = useRouter()
  const { data: session } = useSession()

  const [inspecoes, setInspecoes] = useState<any[]>([])
  const [loading, setLoading]     = useState(true)

  // ── Filtros ──
  const [busca, setBusca]               = useState('')
  const [campoBusca, setCampoBusca]     = useState('todos')
  const [filtroStatus, setFiltroStatus] = useState('Todos')
  const [filtroUf, setFiltroUf]         = useState('Todos')
  const [filtroRegional, setFiltroRegional] = useState('Todos')
  const [filtroData, setFiltroData]     = useState('')

  const loadData = useCallback(async () => {
    if (!session) return
    setLoading(true)
    try {
      const token = (session as any)?.access_token || (session as any)?.accessToken
      const res = await fetch('http://localhost:3001/inspecoes', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setInspecoes(Array.isArray(data) ? data : [])
    } catch {
      setInspecoes([])
    } finally {
      setLoading(false)
    }
  }, [session])

  useEffect(() => { loadData() }, [loadData])

  // ── Listas dinâmicas ──
  const listaUfs       = useMemo(() =>
    Array.from(new Set(inspecoes.map(i => i.uf).filter(Boolean))).sort() as string[],
  [inspecoes])

  const listaRegionais = useMemo(() =>
    Array.from(new Set(inspecoes.map(i => i.regional).filter(Boolean))).sort() as string[],
  [inspecoes])

  // ── Filtros ──
  const filteredData = useMemo(() => {
    const t = busca.toLowerCase()
    return inspecoes.filter(ins => {
      const nomeInspetor = `${ins.inspetor?.nome ?? ''} ${ins.inspetor?.sobrenome ?? ''}`.trim()

      const matchBusca = !busca || (() => {
        switch (campoBusca) {
          case 'local':       return ins.localNome?.toLowerCase().includes(t)
          case 'inspetor':    return nomeInspetor.toLowerCase().includes(t)
          case 'equipamento': return (
            ins.equipamento?.codigo?.toLowerCase().includes(t) ||
            ins.equipamento?.tipo?.toLowerCase().includes(t)
          )
          case 'id': return ins.id?.toLowerCase().includes(t)
          default: return (
            ins.localNome?.toLowerCase().includes(t) ||
            nomeInspetor.toLowerCase().includes(t) ||
            ins.equipamento?.codigo?.toLowerCase().includes(t) ||
            ins.id?.toLowerCase().includes(t)
          )
        }
      })()

      const matchStatus   = filtroStatus   === 'Todos' || ins.status?.toUpperCase() === filtroStatus
      const matchUf       = filtroUf       === 'Todos' || ins.uf === filtroUf
      const matchRegional = filtroRegional === 'Todos' || ins.regional === filtroRegional
      const matchData     = !filtroData    || ins.data?.split('T')[0] === filtroData

      return matchBusca && matchStatus && matchUf && matchRegional && matchData
    })
  }, [inspecoes, busca, campoBusca, filtroStatus, filtroUf, filtroRegional, filtroData])

  const limparFiltros = () => {
    setBusca(''); setCampoBusca('todos'); setFiltroStatus('Todos')
    setFiltroUf('Todos'); setFiltroRegional('Todos'); setFiltroData('')
  }

  const filtrosAtivos = [
    busca,
    filtroStatus   !== 'Todos',
    filtroUf       !== 'Todos',
    filtroRegional !== 'Todos',
    filtroData,
  ].filter(Boolean).length

  return (
    <DashboardLayout title="Inspeções" breadcrumb="SIGS / Inspeções / Listagem">
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

        .table-scroll { overflow-x:auto; -webkit-overflow-scrolling:touch; }
        .ins-main-card { background:#fff; border:1px solid #e2e8f0; border-radius:18px; overflow:visible; }
        .ins-table { width:100%; border-collapse:collapse; min-width:820px; }
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
            <h2
              style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 'clamp(18px,4vw,26px)', color: '#0d1e33' }}
            >
              Inspeções
            </h2>
            <p className="text-[11px] text-[#8896ab] font-bold uppercase mt-1">
              {loading ? 'Sincronizando...' : `${filteredData.length} registros encontrados`}
            </p>
          </div>
          <button className="btn-new" onClick={() => router.push('/inspecao/nova')}>
            <Plus size={15} strokeWidth={3} /> Nova Inspeção
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
              <button className="filter-clear" onClick={limparFiltros}>
                <X size={12} /> Limpar
              </button>
            )}
          </div>

          <div className="filter-body">
            {/* Busca com campo selecionável */}
            <div className="filter-field">
              <span className="filter-label">Busca</span>
              <div
                style={{
                  display:    'flex',
                  height:     '36px',
                  border:     '1px solid #e3e8ef',
                  borderRadius:'8px',
                  overflow:   'hidden',
                  background: '#f8fafc',
                  transition: 'border-color .15s,box-shadow .15s',
                }}
                onFocusCapture={e => {
                  const el = e.currentTarget as HTMLElement
                  el.style.borderColor = '#3d6cf0'
                  el.style.boxShadow   = '0 0 0 3px rgba(61,108,240,.08)'
                  el.style.background  = '#fff'
                }}
                onBlurCapture={e => {
                  const el = e.currentTarget as HTMLElement
                  el.style.borderColor = '#e3e8ef'
                  el.style.boxShadow   = 'none'
                  el.style.background  = '#f8fafc'
                }}
              >
                <div style={{ position: 'relative', borderRight: '1px solid #e3e8ef', flexShrink: 0 }}>
                  <select
                    value={campoBusca}
                    onChange={e => { setCampoBusca(e.target.value); setBusca('') }}
                    style={{
                      height:      '100%',
                      background:  'transparent',
                      border:      'none',
                      outline:     'none',
                      fontSize:    '12px',
                      fontWeight:  700,
                      color:       '#3d6cf0',
                      fontFamily:  'inherit',
                      paddingLeft: '10px',
                      paddingRight:'22px',
                      appearance:  'none',
                      cursor:      'pointer',
                    }}
                  >
                    <option value="todos">Todos os campos</option>
                    <option value="local">Local</option>
                    <option value="inspetor">Inspetor</option>
                    <option value="equipamento">Equipamento</option>
                    <option value="id">ID Inspeção</option>
                  </select>
                  <svg
                    style={{ position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#3d6cf0' }}
                    width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
                <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
                  <Search style={{ position: 'absolute', left: '9px', color: '#c4cbd6' }} size={13} />
                  <input
                    style={{
                      width:       '100%',
                      height:      '100%',
                      background:  'transparent',
                      border:      'none',
                      outline:     'none',
                      paddingLeft: '28px',
                      paddingRight:'8px',
                      fontSize:    '13px',
                      fontFamily:  'inherit',
                      color:       '#111827',
                    }}
                    placeholder={
                      campoBusca === 'local'       ? 'Nome do local...'       :
                      campoBusca === 'inspetor'    ? 'Nome do inspetor...'    :
                      campoBusca === 'equipamento' ? 'Código ou tipo...'      :
                      campoBusca === 'id'          ? 'ID da inspeção...'      : 'Pesquisar...'
                    }
                    value={busca}
                    onChange={e => setBusca(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="filter-field">
              <span className="filter-label">Status</span>
              <div className="filter-select-wrap">
                <select className="filter-input" value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}>
                  <option value="Todos">Todos os Status</option>
                  <option value="APROVADO">Aprovado</option>
                  <option value="ATENCAO">Atenção</option>
                  <option value="REPROVADO">Reprovado</option>
                </select>
              </div>
            </div>

            <div className="filter-field">
              <span className="filter-label">UF</span>
              <div className="filter-select-wrap">
                <select className="filter-input" value={filtroUf} onChange={e => setFiltroUf(e.target.value)}>
                  <option value="Todos">Todas</option>
                  {listaUfs.map(uf => <option key={uf} value={uf}>{uf}</option>)}
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
              <span className="filter-label">Data</span>
              <input
                className="filter-input"
                type="date"
                value={filtroData}
                onChange={e => setFiltroData(e.target.value)}
              />
            </div>
          </div>

          {filtrosAtivos > 0 && (
            <div className="filter-chips">
              {busca          && <span className="filter-chip">"{busca}" <button onClick={() => setBusca('')}><X size={10} /></button></span>}
              {filtroStatus   !== 'Todos' && <span className="filter-chip">{filtroStatus} <button onClick={() => setFiltroStatus('Todos')}><X size={10} /></button></span>}
              {filtroUf       !== 'Todos' && <span className="filter-chip">{filtroUf} <button onClick={() => setFiltroUf('Todos')}><X size={10} /></button></span>}
              {filtroRegional !== 'Todos' && <span className="filter-chip">{filtroRegional} <button onClick={() => setFiltroRegional('Todos')}><X size={10} /></button></span>}
              {filtroData     && (
                <span className="filter-chip">
                  {new Date(filtroData + 'T00:00:00').toLocaleDateString('pt-BR')}
                  <button onClick={() => setFiltroData('')}><X size={10} /></button>
                </span>
              )}
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
              <p className="text-[14px] font-semibold text-[#9ca3af]">Nenhuma inspeção encontrada</p>
              <p className="text-[12px] text-[#c4cbd6] mt-1">Tente ajustar os filtros acima</p>
            </div>
          ) : (
            <div className="table-scroll">
              <table className="ins-table">
                <thead>
                  <tr>
                    <th>ID / Data</th>
                    <th>Local</th>
                    <th>Equipamento</th>
                    <th>Inspetor</th>
                    <th>Regional / UF</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map(item => {
                    const dt = new Date(item.data)
                    const nomeInspetor = `${item.inspetor?.nome ?? ''} ${item.inspetor?.sobrenome ?? ''}`.trim()
                    return (
                      <tr key={item.id} className="ins-row">
                        <td style={{ minWidth: 130 }}>
                          <div
                            className="font-bold text-[#094780] text-[13px] font-mono cursor-pointer hover:underline"
                            onClick={() => router.push(`/inspecao/${item.id}`)}
                          >
                            #{item.id.slice(-8).toUpperCase()}
                          </div>
                          <div className="text-[11px] text-[#8896ab] font-medium mt-0.5">
                            {dt.toLocaleDateString('pt-BR')}
                            {' · '}
                            {dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>

                        <td style={{ minWidth: 180 }}>
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                              <MapPin size={11} className="text-[#3d6cf0]" />
                            </div>
                            <span className="font-bold text-[#1a2535] text-[13px]">{item.localNome}</span>
                          </div>
                          {item.base && (
                            <div className="text-[10px] text-slate-400 mt-0.5 ml-8">{item.base}</div>
                          )}
                        </td>

                        <td style={{ minWidth: 150 }}>
                          <div className="font-bold text-slate-700 text-[13px]">
                            {item.equipamento?.tipo || '—'}
                          </div>
                          {item.equipamento?.codigo && (
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                              {item.equipamento.codigo}
                            </div>
                          )}
                        </td>

                        <td style={{ minWidth: 140 }}>
                          <div className="font-medium text-slate-700 text-[13px]">
                            {nomeInspetor || '—'}
                          </div>
                        </td>

                        <td style={{ minWidth: 120 }}>
                          <div className="text-[13px] font-bold text-slate-700">{item.regional}</div>
                          <div className="text-[11px] text-slate-400 mt-0.5">{item.uf}</div>
                        </td>

                        <td style={{ minWidth: 110 }}>
                          <StatusBadge status={item.status} />
                        </td>

                        <td style={{ textAlign: 'right', minWidth: 60 }}>
                          <div className="flex justify-end">
                            <ActionMenu onVer={() => router.push(`/inspecao/${item.id}`)} />
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
    </DashboardLayout>
  )
}