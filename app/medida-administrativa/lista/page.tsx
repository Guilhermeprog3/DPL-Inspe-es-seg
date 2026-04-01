'use client'

import { useState, useMemo, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { MedidaLayout } from '@/components/layout/MedidasLayout'
import { 
  Search, Plus, MoreVertical, Calendar, 
  ShieldAlert, AlertTriangle, ExternalLink, Filter, 
  Loader2, Zap, ArrowLeft 
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'

const GRAVIDADE_CONFIG: Record<string, { color: string; bg: string; border: string }> = {
  LEVE: { color: '#10b981', bg: '#f0fdf4', border: '#bcf0da' },
  MÉDIA: { color: '#f59e0b', bg: '#fffbeb', border: '#fde68a' },
  GRAVE: { color: '#ef4444', bg: '#fef2f2', border: '#fecaca' },
  GRAVÍSSIMA: { color: '#a855f7', bg: '#faf5ff', border: '#e9d5ff' },
}

export default function ListagemMedidasPage() {
  const router = useRouter()
  const { data: session } = useSession()
  
  // Estados para dados da API
  const [medidas, setMedidas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Estados de Filtro
  const [busca, setBusca] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('Todos')
  const [filtroGravidade, setFiltroGravidade] = useState('Todos')
  const [filtroData, setFiltroData] = useState('')

  // ─── BUSCA DE DADOS NA API ────────────────────────────────────────────────
  useEffect(() => {
    async function fetchMedidas() {
      const token = (session as any)?.access_token || (session as any)?.accessToken;
      if (!token) return;

      try {
        setLoading(true)
        const response = await fetch('http://localhost:3001/medidas', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (!response.ok) throw new Error('Falha ao carregar medidas')
        
        const data = await response.json()
        setMedidas(data)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    if (session) fetchMedidas()
  }, [session])

  // ─── LÓGICA DE FILTRAGEM (Client Side) ────────────────────────────────────
  const filteredData = useMemo(() => {
    return medidas.filter(m => {
      const matchBusca = m.colaborador?.toLowerCase().includes(busca.toLowerCase()) || 
                         m.id?.toLowerCase().includes(busca.toLowerCase());
      const matchTipo = filtroTipo === 'Todos' || m.tipo === filtroTipo;
      const matchGravidade = filtroGravidade === 'Todos' || m.gravidade === filtroGravidade;
      
      // Ajuste de data (o banco retorna ISO, o input é YYYY-MM-DD)
      const dataFormatada = m.data?.split('T')[0]; 
      const matchData = !filtroData || dataFormatada === filtroData;

      return matchBusca && matchTipo && matchGravidade && matchData;
    })
  }, [medidas, busca, filtroTipo, filtroGravidade, filtroData])

  return (
    <MedidaLayout title="Gestão de Medidas" breadcrumb="SIGS / Medida Administrativa / Listagem">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Syne:wght@700;800&display=swap');
        .list-root { font-family: 'DM Sans', sans-serif; padding: 24px 32px 60px; background: #f8fafc; min-height: calc(100vh - 60px); }
        .ins-filter-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 20px; padding: 20px 24px; margin-bottom: 24px; }
        .ins-filter-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; align-items: end; }
        .ins-input { width: 100%; height: 44px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 0 12px 0 40px; font-size: 13px; font-weight: 600; color: #1a2535; outline: none; }
        .ins-main-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 24px; overflow: hidden; }
        .ins-table { width: 100%; border-collapse: collapse; }
        .ins-table th { background: #f8fafc; padding: 16px 24px; text-align: left; font-size: 10px; font-weight: 800; color: #8896ab; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; }
        .ins-row td { padding: 16px 24px; vertical-align: middle; border-bottom: 1px solid #f1f5f9; }
        .ins-status-pill { display: inline-flex; align-items: center; gap: 6px; padding: 5px 12px; border-radius: 8px; font-size: 10px; font-weight: 800; text-transform: uppercase; border: 1px solid; }
        .btn-new { background: #E67A0E; color: #fff; padding: 10px 20px; border-radius: 12px; font-weight: 800; font-size: 12px; text-transform: uppercase; border: none; cursor: pointer; display: flex; align-items: center; gap: 8px; }
      `}</style>

      <div className="list-root">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: '26px', color: '#0d1e33' }}>Medidas Administrativas</h2>
            <p className="text-[11px] text-[#8896ab] font-bold uppercase tracking-widest mt-1">
              {loading ? 'Carregando registros...' : `${filteredData.length} registros encontrados`}
            </p>
          </div>
          <button className="btn-new" onClick={() => router.push('/medida-administrativa/nova')}>
            <Plus size={16} strokeWidth={3} /> Nova Medida
          </button>
        </div>

        {/* Filtros */}
        <div className="ins-filter-card">
          <div className="ins-filter-grid">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-[#8896ab] uppercase tracking-widest ml-1">Pesquisar</label>
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#b0bac8]" size={15} />
                <input className="ins-input" placeholder="Colaborador ou ID..." value={busca} onChange={e => setBusca(e.target.value)} />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-[#8896ab] uppercase tracking-widest ml-1">Categoria</label>
              <div className="relative">
                <ShieldAlert className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#b0bac8]" size={15} />
                <select className="ins-input" value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}>
                  <option value="Todos">Todos os Tipos</option>
                  <option value="SEGURANÇA">Segurança</option>
                  <option value="ADMINISTRATIVA">Administrativa</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-[#8896ab] uppercase tracking-widest ml-1">Gravidade</label>
              <div className="relative">
                <AlertTriangle className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#b0bac8]" size={15} />
                <select className="ins-input" value={filtroGravidade} onChange={e => setFiltroGravidade(e.target.value)}>
                  <option value="Todos">Todas</option>
                  {Object.keys(GRAVIDADE_CONFIG).map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-[#8896ab] uppercase tracking-widest ml-1">Data</label>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#b0bac8]" size={15} />
                <input className="ins-input" type="date" value={filtroData} onChange={e => setFiltroData(e.target.value)} />
              </div>
            </div>
          </div>
        </div>

        {/* Tabela Principal */}
        <div className="ins-main-card">
          {loading ? (
            <div className="py-24 text-center">
              <Loader2 size={40} className="mx-auto mb-4 text-[#094780] animate-spin" />
              <p className="text-[#8896ab] font-bold uppercase text-[10px] tracking-widest">Sincronizando com o servidor...</p>
            </div>
          ) : (
            <table className="ins-table">
              <thead>
                <tr>
                  <th>ID / Data</th>
                  <th>Colaborador</th>
                  <th>Tipo / Medida</th>
                  <th>Gravidade</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length > 0 ? (
                  filteredData.map((item) => {
                    const grav = GRAVIDADE_CONFIG[item.gravidade] || GRAVIDADE_CONFIG['LEVE']
                    return (
                      <tr key={item.id} className="ins-row">
                        <td className="font-bold text-[#094780] text-[13px]">
                          #{item.id.slice(-6).toUpperCase()}
                          <div className="text-[10px] text-[#8896ab] font-bold mt-1">
                            {new Date(item.data).toLocaleDateString('pt-BR')}
                          </div>
                        </td>
                        <td>
                          <div className="font-bold text-[#1a2535] text-[14px]">{item.colaborador}</div>
                          <div className="text-[10px] text-[#8896ab] font-bold uppercase mt-0.5">Mat: {item.matricula}</div>
                        </td>
                        <td>
                          <div className={cn(
                            "inline-flex px-2 py-0.5 rounded text-[9px] font-black uppercase mb-1",
                            item.tipo === 'SEGURANÇA' ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"
                          )}>
                            {item.tipo}
                          </div>
                          <div className="text-[12px] font-bold text-[#4a5568]">{item.medida}</div>
                        </td>
                        <td>
                          <span className="ins-status-pill" style={{ background: grav.bg, color: grav.color, borderColor: grav.border }}>
                            {item.gravidade}
                          </span>
                        </td>
                        <td>
                           <div className="text-[10px] font-black text-[#094780] bg-[#f0f4f9] px-2 py-1 rounded-md w-fit">
                             {item.status}
                           </div>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button className="p-2 text-[#b0bac8] hover:text-[#094780] hover:bg-[#f0f4f9] rounded-xl transition-all">
                            <MoreVertical size={20} />
                          </button>
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="py-24 text-center">
                      <Filter size={48} className="mx-auto mb-4 text-slate-200" />
                      <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Nenhum registro encontrado</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </MedidaLayout>
  )
}