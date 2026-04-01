'use client'

import { useState, useMemo, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { MedidaLayout } from '@/components/layout/MedidasLayout'
import { 
  Search, Plus, MoreVertical, Calendar, 
  ShieldAlert, AlertTriangle, Filter, 
  Loader2, Trash2, Edit2, AlertCircle
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
  
  const [medidas, setMedidas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [menuAberto, setMenuAberto] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [idParaDeletar, setIdParaDeletar] = useState<string | null>(null)

  const [busca, setBusca] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('Todos')
  const [filtroGravidade, setFiltroGravidade] = useState('Todos')
  const [filtroData, setFiltroData] = useState('')

  useEffect(() => {
    async function fetchMedidas() {
      const token = (session as any)?.access_token || (session as any)?.accessToken;
      if (!token) return;
      try {
        setLoading(true)
        const response = await fetch('http://localhost:3001/medidas', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (!response.ok) throw new Error('Falha ao carregar')
        const data = await response.json()
        setMedidas(data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    if (session) fetchMedidas()
  }, [session])

  const handleOpenDeleteModal = (id: string) => {
    setIdParaDeletar(id)
    setShowDeleteModal(true)
    setMenuAberto(null)
  }

  const confirmDelete = async () => {
    if (!idParaDeletar) return
    const token = (session as any)?.access_token || (session as any)?.accessToken;
    setIsDeleting(true)
    try {
      const res = await fetch(`http://localhost:3001/medidas/${idParaDeletar}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        setMedidas(prev => prev.filter(m => m.id !== idParaDeletar))
        setShowDeleteModal(false)
      }
    } catch (err) {
      alert('Não foi possível excluir.')
    } finally {
      setIsDeleting(false)
      setIdParaDeletar(null)
    }
  }

  const filteredData = useMemo(() => {
    return medidas.filter(m => {
      const matchBusca = m.colaborador?.toLowerCase().includes(busca.toLowerCase()) || 
                         m.id?.toLowerCase().includes(busca.toLowerCase());
      const matchTipo = filtroTipo === 'Todos' || m.tipo === filtroTipo;
      const matchGravidade = filtroGravidade === 'Todos' || m.gravidade === filtroGravidade;
      const dataFormatada = m.data?.split('T')[0]; 
      const matchData = !filtroData || dataFormatada === filtroData;
      return matchBusca && matchTipo && matchGravidade && matchData;
    })
  }, [medidas, busca, filtroTipo, filtroGravidade, filtroData])

  return (
    <MedidaLayout title="Gestão de Medidas" breadcrumb="SIGS / Medida Administrativa / Listagem">
      {/* CORREÇÃO DO ERRO DE HYDRATION AQUI */}
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Syne:wght@700;800&display=swap');
        .list-root { font-family: 'DM Sans', sans-serif; padding: 24px 32px 60px; background: #f8fafc; min-height: calc(100vh - 60px); }
        .ins-filter-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 20px; padding: 20px 24px; margin-bottom: 24px; }
        .ins-input { width: 100%; height: 44px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 0 12px 0 40px; font-size: 13px; font-weight: 600; outline: none; }
        .ins-main-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 24px; overflow: visible; }
        .ins-table { width: 100%; border-collapse: collapse; }
        .ins-table th { background: #f8fafc; padding: 16px 24px; text-align: left; font-size: 10px; font-weight: 800; color: #8896ab; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; }
        .ins-row td { padding: 16px 24px; vertical-align: middle; border-bottom: 1px solid #f1f5f9; position: relative; }
        .btn-new { background: #E67A0E; color: #fff; padding: 10px 20px; border-radius: 12px; font-weight: 800; font-size: 12px; text-transform: uppercase; border: none; cursor: pointer; display: flex; align-items: center; gap: 8px; }
        
        .action-menu {
          position: absolute; right: 60px; top: 50%; transform: translateY(-50%);
          background: white; border: 1px solid #e2e8f0; border-radius: 12px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.08); z-index: 50; width: 140px; overflow: hidden;
          animation: slideIn 0.2s ease-out;
        }
        @keyframes slideIn { from { opacity: 0; transform: translateY(-40%); } to { opacity: 1; transform: translateY(-50%); } }
        
        .action-item {
          width: 100%; padding: 10px 14px; display: flex; align-items: center; gap: 10px;
          font-size: 12px; font-weight: 600; color: #4a5568; transition: all 0.2s; border: none; background: none; cursor: pointer;
        }
        .action-item:hover { background: #f8fafc; color: #094780; }
        .action-item.delete { color: #ef4444; }
        .action-item.delete:hover { background: #fef2f2; }

        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
      ` }} />

      <div className="list-root">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: '26px', color: '#0d1e33' }}>Medidas Administrativas</h2>
            <p className="text-[11px] text-[#8896ab] font-bold uppercase mt-1">{loading ? 'Sincronizando...' : `${filteredData.length} registros`}</p>
          </div>
          <button className="btn-new" onClick={() => router.push('/medida-administrativa/nova')}>
            <Plus size={16} strokeWidth={3} /> Nova Medida
          </button>
        </div>

        <div className="ins-filter-card">
          <div className="ins-filter-grid grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#b0bac8]" size={15} />
              <input className="ins-input" placeholder="Pesquisar..." value={busca} onChange={e => setBusca(e.target.value)} />
            </div>
            <select className="ins-input !pl-4" value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}>
              <option value="Todos">Todos os Tipos</option>
              <option value="SEGURANÇA">Segurança</option>
              <option value="ADMINISTRATIVA">Administrativa</option>
            </select>
            <select className="ins-input !pl-4" value={filtroGravidade} onChange={e => setFiltroGravidade(e.target.value)}>
              <option value="Todos">Todas Gravidades</option>
              {Object.keys(GRAVIDADE_CONFIG).map(g => <option key={g} value={g}>{g}</option>)}
            </select>
            <input className="ins-input !pl-4" type="date" value={filtroData} onChange={e => setFiltroData(e.target.value)} />
          </div>
        </div>

        <div className="ins-main-card">
          {loading ? (
            <div className="py-24 text-center"><Loader2 size={40} className="mx-auto mb-4 text-[#094780] animate-spin" /></div>
          ) : (
            <table className="ins-table">
              <thead>
                <tr>
                  <th>ID / Data</th>
                  <th>Colaborador</th>
                  <th>Tipo / Medida</th>
                  <th>Gravidade</th>
                  <th style={{ textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((item) => {
                  const grav = GRAVIDADE_CONFIG[item.gravidade] || GRAVIDADE_CONFIG['LEVE']
                  return (
                    <tr key={item.id} className="ins-row">
                      <td className="font-bold text-[#094780] text-[13px]">
                        #{item.id.slice(-6).toUpperCase()}
                        <div className="text-[10px] text-[#8896ab] font-bold mt-1">{new Date(item.data).toLocaleDateString('pt-BR')}</div>
                      </td>
                      <td>
                        <div className="font-bold text-[#1a2535] text-[14px]">{item.colaborador}</div>
                        <div className="text-[10px] text-[#8896ab] font-bold">Mat: {item.matricula}</div>
                      </td>
                      <td>
                        <div className={cn("inline-flex px-2 py-0.5 rounded text-[9px] font-black uppercase mb-1", item.tipo === 'SEGURANÇA' ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600")}>{item.tipo}</div>
                        <div className="text-[12px] font-bold text-[#4a5568]">{item.medida}</div>
                      </td>
                      <td>
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold border" style={{ background: grav.bg, color: grav.color, borderColor: grav.border }}>{item.gravidade}</span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="flex justify-end items-center relative">
                          {menuAberto === item.id && (
                            <div className="action-menu">
                              <button onClick={() => router.push(`/medida-administrativa/editar/${item.id}`)} className="action-item">
                                <Edit2 size={14} /> Editar
                              </button>
                              <button onClick={() => handleOpenDeleteModal(item.id)} className="action-item delete">
                                <Trash2 size={14} /> Excluir
                              </button>
                            </div>
                          )}
                          <button 
                            onClick={() => setMenuAberto(menuAberto === item.id ? null : item.id)}
                            className={cn("p-2 rounded-xl transition-all", menuAberto === item.id ? "bg-[#f0f4f9] text-[#094780]" : "text-[#b0bac8] hover:text-[#094780]")}
                          >
                            <MoreVertical size={20} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* MODAL DE EXCLUSÃO */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4" style={{ animation: 'fadeIn 0.2s ease' }}>
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl" style={{ animation: 'scaleIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)' }}>
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-5">
                <AlertCircle size={32} className="text-red-500" />
              </div>
              <h3 style={{ fontFamily: 'Syne', fontWeight: 800 }} className="text-xl text-[#0d1e33] mb-2">Excluir Medida?</h3>
              <p className="text-sm text-[#8896ab] leading-relaxed">Esta ação é permanente e removerá todos os dados do sistema.</p>
            </div>
            <div className="flex gap-3 p-6 bg-slate-50 border-t border-slate-100">
              <button onClick={() => setShowDeleteModal(false)} disabled={isDeleting} className="flex-1 py-3 px-4 rounded-xl text-sm font-bold text-[#4a5568] bg-white border border-[#e2e8f0] hover:bg-slate-100 disabled:opacity-50">Cancelar</button>
              <button onClick={confirmDelete} disabled={isDeleting} className="flex-1 py-3 px-4 rounded-xl text-sm font-bold text-white bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/20 flex items-center justify-center gap-2 disabled:opacity-70">
                {isDeleting ? <><Loader2 size={16} className="animate-spin" />Excluindo...</> : 'Sim, excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </MedidaLayout>
  )
}