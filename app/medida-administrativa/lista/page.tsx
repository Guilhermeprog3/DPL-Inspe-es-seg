'use client'

import { useState, useMemo, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { MedidaLayout } from '@/components/layout/MedidasLayout'
import { 
  Search, Plus, MoreVertical, 
  Loader2, Trash2, Edit2, AlertCircle, X, SlidersHorizontal
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

  // Estados dos Filtros
  const [busca, setBusca] = useState('')
  const [campoBusca, setCampoBusca] = useState('todos')
  const [filtroCategoria, setFiltroCategoria] = useState('Todos')
  const [filtroMedida, setFiltroMedida] = useState('Todos')
  const [filtroGravidade, setFiltroGravidade] = useState('Todos')
  const [filtroClassificacao, setFiltroClassificacao] = useState('Todos')
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

  const listaClassificacoes = useMemo(() => {
    const uniques = new Set(medidas.map(m => m.classificacao).filter(Boolean));
    return Array.from(uniques).sort();
  }, [medidas]);

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
      const termoBusca = busca.toLowerCase();
      const matchBusca = !busca || (() => {
        switch (campoBusca) {
          case 'colaborador':   return m.colaborador?.toLowerCase().includes(termoBusca)
          case 'matricula':     return m.matricula?.toLowerCase().includes(termoBusca)
          case 'supervisor':    return m.supervisor?.toLowerCase().includes(termoBusca)
          case 'numeroInspecao': return m.numeroInspecao?.toLowerCase().includes(termoBusca)
          case 'id':            return m.id?.toLowerCase().includes(termoBusca)
          default: // 'todos'
            return (
              m.colaborador?.toLowerCase().includes(termoBusca) ||
              m.matricula?.toLowerCase().includes(termoBusca) ||
              m.supervisor?.toLowerCase().includes(termoBusca) ||
              m.numeroInspecao?.toLowerCase().includes(termoBusca) ||
              m.id?.toLowerCase().includes(termoBusca)
            )
        }
      })()

      const matchCategoria = filtroCategoria === 'Todos' || m.tipo === filtroCategoria;
      const matchMedida = filtroMedida === 'Todos' || m.medida === filtroMedida;
      const matchGravidade = filtroGravidade === 'Todos' || m.gravidade === filtroGravidade;
      const matchClassificacao = filtroClassificacao === 'Todos' || m.classificacao === filtroClassificacao;
      
      const dataFormatada = m.data?.split('T')[0]; 
      const matchData = !filtroData || dataFormatada === filtroData;

      return matchBusca && matchCategoria && matchMedida && matchGravidade && matchClassificacao && matchData;
    })
  }, [medidas, busca, campoBusca, filtroCategoria, filtroMedida, filtroGravidade, filtroClassificacao, filtroData])

  const limparFiltros = () => {
    setBusca('');
    setCampoBusca('todos');
    setFiltroCategoria('Todos');
    setFiltroMedida('Todos');
    setFiltroGravidade('Todos');
    setFiltroClassificacao('Todos');
    setFiltroData('');
  };

  const filtrosAtivos = [busca, filtroCategoria !== 'Todos', filtroMedida !== 'Todos', filtroGravidade !== 'Todos', filtroClassificacao !== 'Todos', filtroData].filter(Boolean).length

  return (
    <MedidaLayout title="Gestão de Medidas" breadcrumb="SIGS / Medida Administrativa / Listagem">
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Syne:wght@700;800&display=swap');
        .list-root { font-family: 'DM Sans', sans-serif; padding: 24px 32px 60px; background: #f8fafc; min-height: calc(100vh - 60px); }

        /* ── FILTER SECTION ── */
        .filter-wrap {
          background: #fff;
          border: 1px solid #e3e8ef;
          border-radius: 14px;
          margin-bottom: 20px;
          overflow: hidden;
        }
        .filter-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 20px;
          border-bottom: 1px solid #f1f5f9;
        }
        .filter-header-left {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          font-weight: 700;
          color: #374151;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }
        .filter-header-left svg { color: #9ca3af; }
        .filter-badge {
          background: #3d6cf0;
          color: #fff;
          font-size: 10px;
          font-weight: 700;
          padding: 2px 7px;
          border-radius: 99px;
          line-height: 1.6;
        }
        .filter-clear {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 12px;
          font-weight: 600;
          color: #9ca3af;
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 6px;
          transition: all 0.15s;
        }
        .filter-clear:hover { color: #ef4444; background: #fef2f2; }

        .filter-body {
          padding: 16px 20px;
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
        }
        @media (min-width: 640px) { .filter-body { grid-template-columns: repeat(2, 1fr); } }
        @media (min-width: 1024px) { .filter-body { grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1fr; } }

        .filter-field { display: flex; flex-direction: column; gap: 5px; }

        .filter-label {
          font-size: 10.5px;
          font-weight: 700;
          color: #9ca3af;
          text-transform: uppercase;
          letter-spacing: 0.07em;
        }

        .filter-input {
          height: 36px;
          background: #f8fafc;
          border: 1px solid #e3e8ef;
          border-radius: 8px;
          padding: 0 10px;
          font-size: 13px;
          font-family: inherit;
          color: #111827;
          outline: none;
          width: 100%;
          transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
          appearance: none;
        }
        .filter-input:focus {
          border-color: #3d6cf0;
          background: #fff;
          box-shadow: 0 0 0 3px rgba(61,108,240,0.08);
        }
        .filter-input::placeholder { color: #c4cbd6; }
        .filter-input-wrap { position: relative; }
        .filter-input-wrap .filter-input { padding-left: 32px; }
        .filter-search-icon {
          position: absolute;
          left: 10px;
          top: 50%;
          transform: translateY(-50%);
          color: #c4cbd6;
          pointer-events: none;
        }
        select.filter-input { cursor: pointer; padding-right: 28px; }
        .filter-select-wrap { position: relative; }
        .filter-select-wrap::after {
          content: '';
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          width: 0; height: 0;
          border-left: 4px solid transparent;
          border-right: 4px solid transparent;
          border-top: 5px solid #c4cbd6;
          pointer-events: none;
        }

        /* ── ACTIVE FILTER CHIPS ── */
        .filter-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          padding: 0 20px 14px;
        }
        .filter-chip {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 3px 10px 3px 10px;
          background: #eef2ff;
          border: 1px solid #c7d5fb;
          border-radius: 99px;
          font-size: 11.5px;
          font-weight: 600;
          color: #3d6cf0;
        }
        .filter-chip button {
          background: none; border: none; cursor: pointer;
          color: #3d6cf0; display: flex; align-items: center;
          padding: 0; opacity: 0.6; transition: opacity 0.1s;
        }
        .filter-chip button:hover { opacity: 1; }

        /* ── TABLE ── */
        .ins-main-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 24px; overflow: visible; }
        .ins-table { width: 100%; border-collapse: collapse; }
        .ins-table th { background: #f8fafc; padding: 16px 24px; text-align: left; font-size: 10px; font-weight: 800; color: #8896ab; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; }
        .ins-row td { padding: 16px 24px; vertical-align: middle; border-bottom: 1px solid #f1f5f9; position: relative; }
        .btn-new { background: #E67A0E; color: #fff; padding: 10px 20px; border-radius: 12px; font-weight: 800; font-size: 12px; text-transform: uppercase; border: none; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: opacity 0.2s; }
        .btn-new:hover { opacity: 0.9; }
        .action-menu { position: absolute; right: 60px; top: 50%; transform: translateY(-50%); background: white; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.08); z-index: 50; width: 140px; overflow: hidden; animation: slideIn 0.2s ease-out; }
        @keyframes slideIn { from { opacity: 0; transform: translateY(-40%); } to { opacity: 1; transform: translateY(-50%); } }
        .action-item { width: 100%; padding: 10px 14px; display: flex; align-items: center; gap: 10px; font-size: 12px; font-weight: 600; color: #4a5568; transition: all 0.2s; border: none; background: none; cursor: pointer; }
        .action-item:hover { background: #f8fafc; color: #094780; }
        .action-item.delete { color: #ef4444; }
        .action-item.delete:hover { background: #fef2f2; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
      ` }} />

      <div className="list-root">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: '26px', color: '#0d1e33' }}>Medidas Administrativas</h2>
            <p className="text-[11px] text-[#8896ab] font-bold uppercase mt-1">
              {loading ? 'Sincronizando...' : `${filteredData.length} registros encontrados`}
            </p>
          </div>
          <button className="btn-new" onClick={() => router.push('/medida-administrativa/nova')}>
            <Plus size={16} strokeWidth={3} /> Nova Medida
          </button>
        </div>

        {/* ── FILTROS ── */}
        <div className="filter-wrap">
          <div className="filter-header">
            <div className="filter-header-left">
              <SlidersHorizontal size={14} />
              Filtros
              {filtrosAtivos > 0 && (
                <span className="filter-badge">{filtrosAtivos}</span>
              )}
            </div>
            {filtrosAtivos > 0 && (
              <button className="filter-clear" onClick={limparFiltros}>
                <X size={12} /> Limpar
              </button>
            )}
          </div>

          <div className="filter-body">
            {/* Busca */}
            <div className="filter-field">
              <span className="filter-label">Busca</span>
              <div style={{ display: 'flex', height: '36px', border: '1px solid #e3e8ef', borderRadius: '8px', overflow: 'hidden', background: '#f8fafc', transition: 'box-shadow 0.15s, border-color 0.15s' }}
                onFocusCapture={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = '#3d6cf0'; el.style.boxShadow = '0 0 0 3px rgba(61,108,240,0.08)'; el.style.background = '#fff' }}
                onBlurCapture={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = '#e3e8ef'; el.style.boxShadow = 'none'; el.style.background = '#f8fafc' }}
              >
                {/* Seletor de campo */}
                <div style={{ position: 'relative', borderRight: '1px solid #e3e8ef', flexShrink: 0 }}>
                  <select
                    value={campoBusca}
                    onChange={e => { setCampoBusca(e.target.value); setBusca('') }}
                    style={{
                      height: '100%', background: 'transparent', border: 'none', outline: 'none',
                      fontSize: '12px', fontWeight: 700, color: '#3d6cf0', fontFamily: 'inherit',
                      paddingLeft: '10px', paddingRight: '22px', appearance: 'none', cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <option value="todos">Todos os campos</option>
                    <option value="colaborador">Nome</option>
                    <option value="matricula">Matrícula</option>
                    <option value="supervisor">Supervisor</option>
                    <option value="numeroInspecao">ID Click</option>
                    <option value="id">ID Sistema</option>
                  </select>
                  <svg style={{ position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#3d6cf0' }} width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="6 9 12 15 18 9"/></svg>
                </div>
                {/* Input */}
                <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
                  <Search style={{ position: 'absolute', left: '9px', color: '#c4cbd6', flexShrink: 0 }} size={13} />
                  <input
                    style={{
                      width: '100%', height: '100%', background: 'transparent', border: 'none',
                      outline: 'none', paddingLeft: '28px', paddingRight: '8px',
                      fontSize: '13px', fontFamily: 'inherit', color: '#111827',
                    }}
                    placeholder={
                      campoBusca === 'colaborador' ? 'Nome do colaborador...' :
                      campoBusca === 'matricula'   ? 'Ex: M1234...' :
                      campoBusca === 'supervisor'  ? 'Matrícula do supervisor...' :
                      campoBusca === 'numeroInspecao' ? 'Ex: INSP-2026-001...' :
                      campoBusca === 'id'          ? 'ID do sistema...' :
                      'Pesquisar...'
                    }
                    value={busca}
                    onChange={e => setBusca(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Categoria */}
            <div className="filter-field">
              <span className="filter-label">Categoria</span>
              <div className="filter-select-wrap">
                <select className="filter-input" value={filtroCategoria} onChange={e => setFiltroCategoria(e.target.value)}>
                  <option value="Todos">Todas</option>
                  <option value="SEGURANÇA">Segurança</option>
                  <option value="ADMINISTRATIVA">Administrativa</option>
                </select>
              </div>
            </div>

            {/* Tipo de Medida */}
            <div className="filter-field">
              <span className="filter-label">Tipo de Medida</span>
              <div className="filter-select-wrap">
                <select className="filter-input" value={filtroMedida} onChange={e => setFiltroMedida(e.target.value)}>
                  <option value="Todos">Todos</option>
                  <option value="ADVERTÊNCIA VERBAL">Adv. Verbal</option>
                  <option value="ADVERTÊNCIA ESCRITA">Adv. Escrita</option>
                  <option value="SUSPENSÃO">Suspensão</option>
                  <option value="CONVERSA PEDAGÓGICA">Conv. Pedagógica</option>
                  <option value="TREINAMENTO">Treinamento</option>
                </select>
              </div>
            </div>

            {/* Classificação */}
            <div className="filter-field">
              <span className="filter-label">Classificação</span>
              <div className="filter-select-wrap">
                <select className="filter-input" value={filtroClassificacao} onChange={e => setFiltroClassificacao(e.target.value)}>
                  <option value="Todos">Todas</option>
                  {listaClassificacoes.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {/* Gravidade */}
            <div className="filter-field">
              <span className="filter-label">Gravidade</span>
              <div className="filter-select-wrap">
                <select className="filter-input" value={filtroGravidade} onChange={e => setFiltroGravidade(e.target.value)}>
                  <option value="Todos">Todas</option>
                  {Object.keys(GRAVIDADE_CONFIG).map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
            </div>

            {/* Data */}
            <div className="filter-field">
              <span className="filter-label">Data Ocorrência</span>
              <input className="filter-input" type="date" value={filtroData} onChange={e => setFiltroData(e.target.value)} />
            </div>
          </div>

          {/* Chips dos filtros ativos */}
          {filtrosAtivos > 0 && (
            <div className="filter-chips">
              {busca && (
                <span className="filter-chip">
                  "{busca}"
                  <button onClick={() => setBusca('')}><X size={10} /></button>
                </span>
              )}
              {filtroCategoria !== 'Todos' && (
                <span className="filter-chip">
                  {filtroCategoria}
                  <button onClick={() => setFiltroCategoria('Todos')}><X size={10} /></button>
                </span>
              )}
              {filtroMedida !== 'Todos' && (
                <span className="filter-chip">
                  {filtroMedida}
                  <button onClick={() => setFiltroMedida('Todos')}><X size={10} /></button>
                </span>
              )}
              {filtroGravidade !== 'Todos' && (
                <span className="filter-chip">
                  {filtroGravidade}
                  <button onClick={() => setFiltroGravidade('Todos')}><X size={10} /></button>
                </span>
              )}
              {filtroClassificacao !== 'Todos' && (
                <span className="filter-chip">
                  {filtroClassificacao}
                  <button onClick={() => setFiltroClassificacao('Todos')}><X size={10} /></button>
                </span>
              )}
              {filtroData && (
                <span className="filter-chip">
                  {new Date(filtroData + 'T00:00:00').toLocaleDateString('pt-BR')}
                  <button onClick={() => setFiltroData('')}><X size={10} /></button>
                </span>
              )}
            </div>
          )}
        </div>

        <div className="ins-main-card">
          {loading ? (
            <div className="py-24 text-center"><Loader2 size={40} className="mx-auto mb-4 text-[#094780] animate-spin" /></div>
          ) : (
            <table className="ins-table">
              <thead>
                <tr>
                  <th>ID / Click / Data</th>
                  <th>Colaborador / Sup.</th>
                  <th>Tipo / Medida</th>
                  <th>Gravidade / Classif.</th>
                  <th style={{ textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((item) => {
                  const grav = GRAVIDADE_CONFIG[item.gravidade] || GRAVIDADE_CONFIG['LEVE']
                  return (
                    <tr key={item.id} className="ins-row">
                      <td>
                        <div className="font-bold text-[#094780] text-[13px]">#{item.id.slice(-6).toUpperCase()}</div>
                        {item.numeroInspecao && (
                          <div className="text-[10px] text-amber-600 font-bold uppercase mt-0.5">Click: {item.numeroInspecao}</div>
                        )}
                        <div className="text-[10px] text-[#8896ab] mt-1 font-medium">{new Date(item.data).toLocaleDateString('pt-BR')}</div>
                      </td>
                      <td>
                        <div className="font-bold text-[#1a2535] text-[14px]">{item.colaborador}</div>
                        <div className="text-[10px] text-[#8896ab] font-bold">Mat: {item.matricula}</div>
                        <div className="text-[9px] text-[#8896ab] font-medium italic mt-0.5">Supervisor: {item.supervisor || 'N/A'}</div>
                      </td>
                      <td>
                        <div className={cn("inline-flex px-2 py-0.5 rounded text-[9px] font-black uppercase mb-1", item.tipo === 'SEGURANÇA' ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600")}>
                          {item.tipo}
                        </div>
                        <div className="text-[12px] font-bold text-[#4a5568]">{item.medida}</div>
                      </td>
                      <td>
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold border mb-1.5" style={{ background: grav.bg, color: grav.color, borderColor: grav.border }}>
                          {item.gravidade}
                        </span>
                        <div className="text-[10px] font-bold text-slate-400 line-clamp-1 max-w-[180px]" title={item.classificacao}>
                          {item.classificacao}
                        </div>
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