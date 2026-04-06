'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import {
  Plus, Loader2, Trash2, AlertCircle, Eye,
  MapPin, Building2, Globe, QrCode, Package,
  Flame, Droplets, Waves, Radio, Search, X,
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
  'Iluminação de Emergência': { color: '#b45309', bg: '#fffbeb', border: '#fde68a', icon: Waves    },
  'Botoeiras e Sirenes':      { color: '#7c3aed', bg: '#faf5ff', border: '#e9d5ff', icon: Radio    },
  'Detector de Fumaça':       { color: '#c2410c', bg: '#fff7ed', border: '#fed7aa', icon: Radio    },
  'Sprinkler':                { color: '#0e7490', bg: '#ecfeff', border: '#a5f3fc', icon: Waves    },
}

// ─── Badges ───────────────────────────────────────────────────────────────────
function TipoBadge({ tipo }: { tipo?: string }) {
  if (!tipo) return <span className="text-[10px] text-slate-400 font-bold italic">Sem equip.</span>
  const cfg = TIPO_CONFIG[tipo] ?? { color: '#4b5563', bg: '#f8fafc', border: '#e3e8ef', icon: Package }
  const Icon = cfg.icon
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-black uppercase border"
      style={{ background: cfg.bg, color: cfg.color, borderColor: cfg.border }}
    >
      <Icon size={9} /> {tipo}
    </span>
  )
}

// ─── Modal QR ─────────────────────────────────────────────────────────────────
function QrModal({ local, onClose }: { local: Local; onClose: () => void }) {
  const [qrDataUrl, setQrDataUrl] = useState('')

  useEffect(() => {
    if (!local?.qrCode) return
    QRCode.toDataURL(local.qrCode, {
      width: 280, margin: 2,
      color: { dark: '#0d1e33', light: '#ffffff' },
    })
      .then(setQrDataUrl)
      .catch(console.error)
  }, [local.qrCode])

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-6">
      <div className="bg-white p-8 rounded-3xl text-center shadow-2xl max-w-xs w-full"
        style={{ animation: 'scaleIn .15s ease forwards' }}>
        <div className="flex items-center justify-center gap-2 mb-1">
          <QrCode size={18} className="text-[#3d6cf0]" />
          <h3 className="font-black text-lg text-slate-800">QR Code</h3>
        </div>
        <p className="text-[11px] font-bold text-[#3d6cf0] uppercase tracking-widest mb-1">{local.nome}</p>
        <p className="text-[11px] text-slate-400 mb-5">{local.regional} · {local.base}</p>

        {qrDataUrl
          ? <img src={qrDataUrl} alt="QR Code" className="mx-auto rounded-xl border border-slate-100 shadow-sm" />
          : <div className="w-[280px] h-[280px] bg-slate-100 rounded-xl mx-auto flex items-center justify-center">
              <Loader2 className="animate-spin text-slate-300" size={32} />
            </div>
        }

        <p className="text-[10px] text-slate-400 mt-4 font-mono break-all">{local.qrCode}</p>

        <div className="flex gap-3 mt-6">
          {qrDataUrl && (
            <a
              href={qrDataUrl}
              download={`qrcode-${local.qrCode}.png`}
              className="flex-1 py-2.5 bg-[#3d6cf0] text-white rounded-xl font-black text-xs text-center flex items-center justify-center"
            >
              BAIXAR
            </a>
          )}
          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-black text-xs"
          >
            FECHAR
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Página Principal ─────────────────────────────────────────────────────────
export default function ListaLocaisPage() {
  const router = useRouter()
  const { data: session } = useSession()

  const [locais, setLocais]     = useState<Local[]>([])
  const [loading, setLoading]   = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [itemParaDeletar, setItemParaDeletar] = useState<Local | null>(null)
  const [localQr, setLocalQr]   = useState<Local | null>(null)

  const [busca, setBusca]               = useState('')
  const [filtroRegional, setFiltroRegional] = useState('Todos')
  const [filtroUf, setFiltroUf]         = useState('Todos')

  // ── Carrega lista de pontos ──────────────────────────────────────────────
  const loadData = useCallback(async () => {
    if (!session) return
    setLoading(true)
    try {
      // Suporte aos dois formatos de token usados pelo next-auth
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
    } finally {
      setLoading(false)
    }
  }, [session])

  useEffect(() => { loadData() }, [loadData])

  // ── Excluir ponto ────────────────────────────────────────────────────────
  const confirmDelete = async () => {
    if (!itemParaDeletar || !session) return
    setIsDeleting(true)
    try {
      const token = (session as any).access_token || (session as any).accessToken
      const res = await fetch(`http://localhost:3001/pontos/${itemParaDeletar.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok || res.status === 204) {
        setLocais(prev => prev.filter(l => l.id !== itemParaDeletar.id))
        setShowDeleteModal(false)
        setItemParaDeletar(null)
      } else {
        const err = await res.json().catch(() => ({}))
        alert(err?.message || 'Erro ao excluir local.')
      }
    } catch {
      alert('Erro de conexão ao excluir local.')
    } finally {
      setIsDeleting(false)
    }
  }

  // ── Filtros ──────────────────────────────────────────────────────────────
  const filteredData = useMemo(() => {
    if (!Array.isArray(locais)) return []
    const t = busca.toLowerCase()
    return locais.filter(l =>
      (!busca ||
        l.nome?.toLowerCase().includes(t) ||
        l.qrCode?.toLowerCase().includes(t) ||
        l.base?.toLowerCase().includes(t) ||
        l.equipamentoAtual?.codigo?.toLowerCase().includes(t)
      ) &&
      (filtroRegional === 'Todos' || l.regional === filtroRegional) &&
      (filtroUf === 'Todos' || l.uf === filtroUf)
    )
  }, [locais, busca, filtroRegional, filtroUf])

  // Listas dinâmicas extraídas dos dados reais do backend
  const listaRegionais = useMemo(
    () => Array.from(new Set(locais.map(l => l.regional).filter(Boolean))).sort(),
    [locais],
  )
  const listaUfs = useMemo(
    () => Array.from(new Set(locais.map(l => l.uf).filter(Boolean))).sort(),
    [locais],
  )

  const filtrosAtivos = [
    busca,
    filtroRegional !== 'Todos',
    filtroUf !== 'Todos',
  ].filter(Boolean).length

  const limparFiltros = () => {
    setBusca(''); setFiltroRegional('Todos'); setFiltroUf('Todos')
  }

  return (
    <DashboardLayout title="Locais" breadcrumb="SIGS / Locais / Listagem">
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Syne:wght@700;800&display=swap');
        .list-root { font-family:'DM Sans',sans-serif; padding:16px; background:#f8fafc; min-height:calc(100vh - 60px); }
        @media(min-width:640px){ .list-root { padding:20px 24px 60px; } }
        @media(min-width:1024px){ .list-root { padding:24px 32px 60px; } }
        .filter-wrap { background:#fff; border:1px solid #e3e8ef; border-radius:14px; margin-bottom:16px; overflow:hidden; }
        .filter-input { height:36px; background:#f8fafc; border:1px solid #e3e8ef; border-radius:8px; padding:0 10px; font-size:13px; font-family:inherit; outline:none; width:100%; transition:border-color .15s; appearance:none; }
        .filter-input:focus { border-color:#3d6cf0; background:#fff; }
        .ins-main-card { background:#fff; border:1px solid #e2e8f0; border-radius:18px; overflow:visible; }
        .ins-table { width:100%; border-collapse:collapse; min-width:900px; }
        .ins-table th { background:#f8fafc; padding:12px 20px; text-align:left; font-size:10px; font-weight:800; color:#8896ab; text-transform:uppercase; border-bottom:1px solid #e2e8f0; white-space:nowrap; }
        .ins-row td { padding:14px 20px; border-bottom:1px solid #f1f5f9; vertical-align:middle; transition:background .1s; }
        .ins-row:last-child td { border-bottom:none; }
        .ins-row:hover td { background:#fafbfd; }
        .btn-new { background:#E67A0E; color:#fff; padding:9px 14px; border-radius:12px; font-weight:800; font-size:12px; display:flex; align-items:center; gap:6px; border:none; cursor:pointer; white-space:nowrap; transition:opacity .2s; }
        .btn-new:hover { opacity:.9; }
        @keyframes scaleIn { from{opacity:0;transform:scale(.95);}to{opacity:1;transform:scale(1);} }
        @keyframes fadeIn  { from{opacity:0;}to{opacity:1;} }
      `}} />

      <div className="list-root">

        {/* Header */}
        <div className="flex justify-between items-start mb-5 flex-wrap gap-4">
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
          <div className="flex items-center justify-between px-5 py-3 border-b border-[#f1f5f9]">
            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
              Filtros
              {filtrosAtivos > 0 && (
                <span className="ml-2 bg-[#3d6cf0] text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                  {filtrosAtivos}
                </span>
              )}
            </span>
            {filtrosAtivos > 0 && (
              <button
                onClick={limparFiltros}
                className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-red-500 transition-colors"
              >
                <X size={11} /> Limpar
              </button>
            )}
          </div>
          <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Busca */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase mb-1.5 block">Pesquisa</label>
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  className="filter-input pl-8"
                  placeholder="Nome, QR Code, Base..."
                  value={busca}
                  onChange={e => setBusca(e.target.value)}
                />
                {busca && (
                  <button
                    onClick={() => setBusca('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>

            {/* Regional — populada dinamicamente do backend */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase mb-1.5 block">Regional</label>
              <div className="relative">
                <select
                  className="filter-input pr-7"
                  value={filtroRegional}
                  onChange={e => setFiltroRegional(e.target.value)}
                >
                  <option value="Todos">Todas as Regionais</option>
                  {listaRegionais.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <svg className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="6 9 12 15 18 9" /></svg>
              </div>
            </div>

            {/* UF — populada dinamicamente do backend */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase mb-1.5 block">UF</label>
              <div className="relative">
                <select
                  className="filter-input pr-7"
                  value={filtroUf}
                  onChange={e => setFiltroUf(e.target.value)}
                >
                  <option value="Todos">Todos os Estados</option>
                  {listaUfs.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                </select>
                <svg className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="6 9 12 15 18 9" /></svg>
              </div>
            </div>
          </div>
        </div>

        {/* Tabela */}
        <div className="ins-main-card">
          {loading ? (
            <div className="py-24 text-center">
              <Loader2 size={40} className="mx-auto text-[#3d6cf0] animate-spin" />
            </div>
          ) : filteredData.length === 0 ? (
            <div className="py-20 text-center">
              <MapPin size={40} className="mx-auto text-slate-200 mb-3" />
              <p className="text-slate-400 font-bold text-sm">Nenhum local encontrado</p>
              {filtrosAtivos > 0 && (
                <button onClick={limparFiltros} className="mt-2 text-xs text-[#3d6cf0] font-semibold hover:underline">
                  Limpar filtros
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
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
                            className="font-bold text-slate-800 text-sm cursor-pointer hover:text-[#3d6cf0] hover:underline"
                            onClick={() => router.push(`/locais/${item.id}`)}
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
                          <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                            {item.equipamentoAtual.codigo}
                          </div>
                        )}
                      </td>

                      <td style={{ textAlign: 'right', minWidth: 120 }}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            title="Ver QR Code"
                            className="p-2 text-slate-400 hover:text-[#3d6cf0] transition-colors rounded-lg hover:bg-blue-50"
                            onClick={() => setLocalQr(item)}
                          >
                            <QrCode size={16} />
                          </button>
                          <button
                            title="Ver detalhes"
                            className="p-2 text-slate-400 hover:text-blue-600 transition-colors rounded-lg hover:bg-blue-50"
                            onClick={() => router.push(`/locais/${item.id}`)}
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            title="Excluir"
                            className="p-2 text-slate-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
                            onClick={() => { setItemParaDeletar(item); setShowDeleteModal(true) }}
                          >
                            <Trash2 size={16} />
                          </button>
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
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
          style={{ animation: 'fadeIn .2s ease' }}
        >
          <div
            className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl"
            style={{ animation: 'scaleIn .2s ease' }}
          >
            <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-black mb-2 text-slate-800">Excluir Local?</h3>
            <p className="text-sm text-slate-500 mb-6">
              Isso removerá o ponto <strong>{itemParaDeletar?.nome}</strong> permanentemente.
              O equipamento vinculado (se houver) será desvinculado automaticamente.
            </p>
            <div className="flex gap-3">
              <button
                className="flex-1 py-3 font-bold bg-slate-100 rounded-xl text-slate-600"
                onClick={() => { setShowDeleteModal(false); setItemParaDeletar(null) }}
                disabled={isDeleting}
              >
                CANCELAR
              </button>
              <button
                className="flex-1 py-3 font-bold bg-red-500 text-white rounded-xl shadow-lg shadow-red-200 flex items-center justify-center gap-2 disabled:opacity-70"
                onClick={confirmDelete}
                disabled={isDeleting}
              >
                {isDeleting
                  ? <><Loader2 className="animate-spin" size={16} /> Excluindo...</>
                  : 'SIM, EXCLUIR'
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}