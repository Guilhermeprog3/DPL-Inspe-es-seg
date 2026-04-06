'use client'

import * as XLSX from 'xlsx'
import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import {
  Search, Plus, MoreVertical, Eye,
  Loader2, Trash2, Edit2, AlertCircle, X, SlidersHorizontal,
  Download, CheckCircle2, AlertTriangle, XCircle, Clock,
  ShieldCheck,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'

// ─── Configurações de Status ──────────────────────────────────────────────────
type StatusKey = 'CONCLUIDA' | 'PENDENTE' | 'CANCELADA' | 'ATENCAO'

const STATUS_CONFIG: Record<string, { label: string; icon: any; color: string; bg: string; border: string }> = {
  'CONCLUIDA': { label: 'Concluída', icon: CheckCircle2,  color: '#059669', bg: '#ecfdf5', border: '#a7f3d0' },
  'ATENCAO':   { label: 'Atenção',   icon: AlertTriangle, color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  'CANCELADA': { label: 'Reprovado', icon: XCircle,       color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
  'PENDENTE':  { label: 'Pendente',  icon: Clock,         color: '#6b7280', bg: '#f9fafb', border: '#e5e7eb' },
}

const TIPO_CONFIG: Record<string, { color: string; bg: string; border: string }> = {
  'Extintor':  { color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe' },
  'Hidrante':  { color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0' },
  'Sprinkler': { color: '#7e22ce', bg: '#faf5ff', border: '#e9d5ff' },
  'Detector':  { color: '#c2410c', bg: '#fff7ed', border: '#fed7aa' },
}

// ─── Função de Exportação (Resolve o erro ts2304) ─────────────────────────────
function exportToExcel(data: any[]) {
  const rows = data.map(i => ({
    'Protocolo': i.id,
    'Data': new Date(i.data).toLocaleDateString('pt-BR'),
    'Hora': new Date(i.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    'Equipamento': i.equipamento,
    'Patrimônio': i.equipId,
    'Tipo': i.tipo,
    'Inspetor': i.inspetor,
    'Regional': i.regional,
    'Status': STATUS_CONFIG[i.status]?.label || i.status,
  }))

  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Inspeções')
  
  const date = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')
  XLSX.writeFile(wb, `relatorio_inspecoes_${date}.xlsx`)
}

// ─── Menu de Ações ────────────────────────────────────────────────────────────
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
      if (!btnRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <>
      <button ref={btnRef} onClick={handleOpen} className={cn('p-2 rounded-xl transition-all', open ? 'bg-[#f0f4f9] text-[#3d6cf0]' : 'text-[#b0bac8] hover:text-[#3d6cf0] hover:bg-[#f0f4f9]')}>
        <MoreVertical size={20} />
      </button>
      {open && (
        <div style={{ position: 'fixed', top: coords.top, right: coords.right, background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 8px 30px rgba(0,0,0,.15)', zIndex: 9999, width: '155px', overflow: 'hidden' }}>
          <button className="action-item" onClick={() => { setOpen(false); onVisualizar() }}><Eye size={14} /> Visualizar</button>
          <button className="action-item" onClick={() => { setOpen(false); onEditar() }}><Edit2 size={14} /> Editar</button>
          <div className="h-px bg-[#f1f5f9] my-1" />
          <button className="action-item text-red-500 hover:bg-red-50" onClick={() => { setOpen(false); onExcluir() }}><Trash2 size={14} /> Excluir</button>
        </div>
      )}
    </>
  )
}

// ─── Componente Principal ─────────────────────────────────────────────────────
export default function ListaInspecoesPage() {
  const router = useRouter()
  const { data: session } = useSession()

  const [inspecoes, setInspecoes]     = useState<any[]>([])
  const [loading, setLoading]         = useState(true)
  const [isDeleting, setIsDeleting]   = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [idParaDeletar, setIdParaDeletar]     = useState<string | null>(null)

  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('Todos')
  const [filtroRegional, setFiltroRegional] = useState('Todos')

  const fetchInspecoes = useCallback(async () => {
    if (!session) return
    setLoading(true)
    try {
      const token = (session as any).accessToken
      const res = await fetch('http://localhost:3001/inspecoes', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      
      const list = (Array.isArray(data) ? data : (data.data || [])).map((ins: any) => ({
        id: ins.id,
        equipId: ins.equipamento?.codigo || 'N/A',
        equipamento: ins.localNome || 'Ponto de Instalação',
        tipo: ins.equipamento?.tipo || 'Outro',
        inspetor: ins.inspetor?.nome || 'Sistema',
        regional: ins.regional || 'N/A',
        data: ins.data,
        status: ins.status.toUpperCase()
      }))
      setInspecoes(list)
    } catch { setInspecoes([]) }
    finally { setLoading(false) }
  }, [session])

  useEffect(() => { fetchInspecoes() }, [fetchInspecoes])

  const filteredData = useMemo(() => {
    return inspecoes.filter(i => {
      const matchBusca = !busca || i.id.toLowerCase().includes(busca.toLowerCase()) || i.equipamento.toLowerCase().includes(busca.toLowerCase())
      const matchStatus = filtroStatus === 'Todos' || i.status === filtroStatus
      const matchRegional = filtroRegional === 'Todos' || i.regional === filtroRegional
      return matchBusca && matchStatus && matchRegional
    })
  }, [inspecoes, busca, filtroStatus, filtroRegional])

  const handleExport = () => {
    setIsExporting(true)
    try { exportToExcel(filteredData) }
    finally { setIsExporting(false) }
  }

  const confirmDelete = async () => {
    if (!idParaDeletar || !session) return
    setIsDeleting(true)
    try {
      const token = (session as any).accessToken
      await fetch(`http://localhost:3001/inspecoes/${idParaDeletar}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      setInspecoes(p => p.filter(i => i.id !== idParaDeletar))
      setShowDeleteModal(false)
    } finally { setIsDeleting(false) }
  }

  return (
    <DashboardLayout title="Inspeções">
      <style dangerouslySetInnerHTML={{ __html: `
        .list-root { padding:24px; background:#f8fafc; min-height:calc(100vh - 60px); font-family:'DM Sans', sans-serif; }
        .ins-main-card { background:#fff; border:1px solid #e2e8f0; border-radius:18px; }
        .ins-table { width:100%; border-collapse:collapse; }
        .ins-table th { background:#f8fafc; padding:14px 20px; text-align:left; font-size:10px; font-weight:800; color:#8896ab; text-transform:uppercase; border-bottom:1px solid #e2e8f0; }
        .ins-row td { padding:14px 20px; border-bottom:1px solid #f1f5f9; }
        .action-item { width:100%; padding:10px 14px; display:flex; align-items:center; gap:10px; font-size:12px; font-weight:600; color:#4a5568; border:none; background:none; cursor:pointer; text-align:left; }
        .action-item:hover { background:#f8fafc; color:#3d6cf0; }
      `}} />

      <div className="list-root">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-black text-[#0d1e33]" style={{ fontFamily: 'Syne' }}>Inspeções</h2>
          <div className="flex gap-2">
            <button onClick={handleExport} disabled={loading || isExporting} className="flex items-center gap-2 px-4 py-2 bg-white border border-[#e3e8ef] rounded-xl text-xs font-bold hover:bg-slate-50 transition-all">
              {isExporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />} EXPORTAR EXCEL
            </button>
            <button onClick={() => router.push('/inspecao/nova')} className="flex items-center gap-2 px-4 py-2 bg-[#E67A0E] text-white rounded-xl text-xs font-black hover:opacity-90 transition-all">
              <Plus size={16} /> NOVA INSPEÇÃO
            </button>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#e3e8ef] mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <input className="h-10 bg-[#f8fafc] border border-[#e3e8ef] rounded-lg px-3 text-sm outline-none focus:border-[#3d6cf0]" placeholder="Pesquisar protocolo ou local..." value={busca} onChange={e => setBusca(e.target.value)} />
          <select className="h-10 bg-[#f8fafc] border border-[#e3e8ef] rounded-lg px-3 text-sm outline-none" value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}>
            <option value="Todos">Todos os Status</option>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <select className="h-10 bg-[#f8fafc] border border-[#e3e8ef] rounded-lg px-3 text-sm outline-none" value={filtroRegional} onChange={e => setFiltroRegional(e.target.value)}>
            <option value="Todos">Todas as Regionais</option>
            {Array.from(new Set(inspecoes.map(i => i.regional))).map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        <div className="ins-main-card">
          {loading ? (
            <div className="p-20 text-center"><Loader2 size={40} className="animate-spin mx-auto text-[#3d6cf0]" /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="ins-table">
                <thead>
                  <tr>
                    <th>Protocolo / Data</th>
                    <th>Local / Equipamento</th>
                    <th>Inspetor</th>
                    <th>Status</th>
                    <th className="text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map(item => {
                    const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.PENDENTE
                    return (
                      <tr key={item.id} className="ins-row hover:bg-slate-50 transition-colors">
                        <td>
                          <div className="font-bold text-[#3d6cf0] text-sm cursor-pointer hover:underline" onClick={() => router.push(`/inspecao/${item.id}`)}>{item.id.substring(0, 8)}...</div>
                          <div className="text-[11px] text-[#8896ab] font-medium">{new Date(item.data).toLocaleDateString('pt-BR')}</div>
                        </td>
                        <td>
                          <div className="font-bold text-[#1a2535] text-sm">{item.equipamento}</div>
                          <div className="text-[10px] text-slate-400 font-mono uppercase">{item.tipo} · {item.equipId}</div>
                        </td>
                        <td>
                          <div className="flex items-center gap-2">
                             <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-[10px] font-black">{item.inspetor.charAt(0)}</div>
                             <span className="text-xs font-semibold text-slate-700">{item.inspetor}</span>
                          </div>
                        </td>
                        <td>
                           <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border" style={{ background: cfg.bg, color: cfg.color, borderColor: cfg.border }}>
                             <cfg.icon size={10} strokeWidth={3} /> {cfg.label}
                           </span>
                        </td>
                        <td className="text-right">
                          <ActionMenu
                            onVisualizar={() => router.push(`/inspecao/${item.id}`)}
                            onEditar={() => router.push(`/inspecao/editar/${item.id}`)}
                            onExcluir={() => { setIdParaDeletar(item.id); setShowDeleteModal(true) }}
                          />
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

      {showDeleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center">
            <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-black mb-2">Excluir Inspeção?</h3>
            <p className="text-sm text-slate-500 mb-6">Esta ação não pode ser desfeita.</p>
            <div className="flex gap-3">
              <button className="flex-1 py-3 font-bold bg-slate-100 rounded-xl" onClick={() => setShowDeleteModal(false)}>CANCELAR</button>
              <button className="flex-1 py-3 font-bold bg-red-500 text-white rounded-xl" onClick={confirmDelete} disabled={isDeleting}>
                {isDeleting ? 'Excluindo...' : 'SIM, EXCLUIR'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}