'use client'

import * as XLSX from 'xlsx'

import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { MedidaLayout } from '@/components/layout/MedidasLayout'
import {
  Search, Plus, MoreVertical, Eye,
  Loader2, Trash2, Edit2, AlertCircle, X, SlidersHorizontal,
  Download,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'

const GRAVIDADE_CONFIG: Record<string, { color: string; bg: string; border: string }> = {
  LEVE:       { color: '#10b981', bg: '#f0fdf4', border: '#bcf0da' },
  MÉDIA:      { color: '#f59e0b', bg: '#fffbeb', border: '#fde68a' },
  GRAVE:      { color: '#ef4444', bg: '#fef2f2', border: '#fecaca' },
  GRAVÍSSIMA: { color: '#a855f7', bg: '#faf5ff', border: '#e9d5ff' },
}

function exportToExcel(data: any[]) {
  const rows = data.map(m => ({
    'ID':                m.id ?? '',
    'Colaborador':       m.colaborador ?? '',
    'Matrícula':         m.matricula ?? '',
    'Supervisor':        m.supervisor ?? '',
    'Data':              m.data ? new Date(m.data).toLocaleDateString('pt-BR') : '',
    'Categoria':         m.tipo ?? '',
    'Tipo de Medida':    m.medida ?? '',
    'Gravidade':         m.gravidade ?? '',
    'Classificação':     m.classificacao ?? '',
    'Descrição':         m.ocorrencia ?? '',
    'Dias Suspensão':    m.diasSuspensao ?? '',
    'ID Inspeção Click': m.numeroInspecao ?? '',
  }))
  const ws = XLSX.utils.json_to_sheet(rows)
  ws['!cols'] = [
    { wch: 28 }, { wch: 28 }, { wch: 14 }, { wch: 20 }, { wch: 14 },
    { wch: 16 }, { wch: 22 }, { wch: 12 }, { wch: 40 }, { wch: 50 },
    { wch: 14 }, { wch: 20 },
  ]
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Medidas')
  const date = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')
  XLSX.writeFile(wb, `medidas_${date}.xlsx`)
}

// ─── Componente isolado de menu — usa useRef para fechar ao clicar fora ──────
function ActionMenu({
  onVisualizar,
  onEditar,
  onExcluir,
}: {
  onVisualizar: () => void
  onEditar: () => void
  onExcluir: () => void
}) {
  const [open, setOpen] = useState(false)
  const [coords, setCoords] = useState({ top: 0, right: 0 })
  const btnRef = useRef<HTMLButtonElement>(null)

  // Calcula posição fixed ao abrir
  function handleOpen() {
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect()
      setCoords({
        top: r.bottom + 6,
        right: window.innerWidth - r.right,
      })
    }
    setOpen(v => !v)
  }

  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      const target = e.target as Node
      // Ignora cliques dentro do próprio botão ou do menu (portal)
      if (btnRef.current?.contains(target)) return
      const menu = document.getElementById('action-menu-portal')
      if (menu?.contains(target)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // Fecha ao rolar a página
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
          open
            ? 'bg-[#f0f4f9] text-[#094780]'
            : 'text-[#b0bac8] hover:text-[#094780] hover:bg-[#f0f4f9]'
        )}
      >
        <MoreVertical size={20} />
      </button>

      {open && (
        // Portal via position:fixed — nunca é clipado por overflow de pai
        <div
          id="action-menu-portal"
          style={{
            position: 'fixed',
            top: coords.top,
            right: coords.right,
            background: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            boxShadow: '0 8px 30px rgba(0,0,0,.15)',
            zIndex: 9999,
            width: '155px',
            overflow: 'hidden',
            animation: 'menuIn .15s ease-out',
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

  const listaClassificacoes = useMemo(() => {
    return Array.from(new Set(medidas.map(m => m.classificacao).filter(Boolean))).sort() as string[]
  }, [medidas])

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
          case 'numeroInspecao': return m.numeroInspecao?.toLowerCase().includes(t)
          case 'id':             return m.id?.toLowerCase().includes(t)
          default: return (
            m.colaborador?.toLowerCase().includes(t) || m.matricula?.toLowerCase().includes(t) ||
            m.supervisor?.toLowerCase().includes(t) || m.numeroInspecao?.toLowerCase().includes(t) ||
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

  const limparFiltros = () => {
    setBusca(''); setCampoBusca('todos'); setFiltroCategoria('Todos')
    setFiltroMedida('Todos'); setFiltroGravidade('Todos')
    setFiltroClassificacao('Todos'); setFiltroData('')
  }

  const filtrosAtivos = [busca, filtroCategoria !== 'Todos', filtroMedida !== 'Todos',
    filtroGravidade !== 'Todos', filtroClassificacao !== 'Todos', filtroData].filter(Boolean).length

  const handleExport = useCallback(() => {
    if (isExporting || filteredData.length === 0) return
    setIsExporting(true)
    try { exportToExcel(filteredData) }
    catch (e) { console.error(e); alert('Erro ao exportar.') }
    finally { setIsExporting(false) }
  }, [filteredData, isExporting])

  return (
    <MedidaLayout title="Gestão de Medidas" breadcrumb="SIGS / Medida Administrativa / Listagem">
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
        @media(min-width:1024px){ .filter-body { grid-template-columns:2fr 1fr 1fr 1fr 1fr 1fr; } }
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
        
        
        .ins-table { width:100%; border-collapse:collapse; min-width:600px; }
        .ins-table th { background:#f8fafc; padding:12px 14px; text-align:left; font-size:10px; font-weight:800; color:#8896ab; text-transform:uppercase; border-bottom:1px solid #e2e8f0; white-space:nowrap; }
        @media(min-width:1024px){ .ins-table th { padding:16px 24px; } }
        .ins-row td { padding:12px 14px; vertical-align:middle; border-bottom:1px solid #f1f5f9; transition:background .1s; }
        @media(min-width:1024px){ .ins-row td { padding:16px 24px; } }
        .ins-row:last-child td { border-bottom:none; }
        .ins-row:hover td { background:#fafbfd; }

        .btn-new { background:#E67A0E; color:#fff; padding:9px 14px; border-radius:12px; font-weight:800; font-size:12px; text-transform:uppercase; border:none; cursor:pointer; display:flex; align-items:center; gap:6px; transition:opacity .2s; white-space:nowrap; }
        .btn-new:hover { opacity:.9; }
        .btn-export { background:#fff; color:#374151; padding:8px 12px; border-radius:12px; font-weight:700; font-size:12px; border:1.5px solid #e3e8ef; cursor:pointer; display:flex; align-items:center; gap:6px; transition:all .2s; white-space:nowrap; }
        .btn-export:hover:not(:disabled) { border-color:#10b981; color:#10b981; background:#f0fdf4; }
        .btn-export:disabled { opacity:.5; cursor:not-allowed; }

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
        <div className="flex justify-between items-start mb-4 gap-3 flex-wrap">
          <div>
            <h2 style={{ fontFamily:'Syne', fontWeight:800, fontSize:'clamp(18px,4vw,26px)', color:'#0d1e33' }}>
              Medidas Administrativas
            </h2>
            <p className="text-[11px] text-[#8896ab] font-bold uppercase mt-1">
              {loading ? 'Sincronizando...' : `${filteredData.length} registros encontrados`}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button className="btn-export" onClick={handleExport}
              disabled={isExporting || filteredData.length === 0 || loading}>
              {isExporting ? <Loader2 size={14} className="animate-spin"/> : <Download size={14}/>}
              <span className="hidden sm:inline">{isExporting ? 'Exportando...' : 'Exportar Excel'}</span>
              {!isExporting && filteredData.length > 0 && (
                <span style={{ background:'#f0fdf4', color:'#10b981', fontSize:'10px', fontWeight:800, padding:'1px 6px', borderRadius:'99px', border:'1px solid #bbf7d0' }}>
                  {filteredData.length}
                </span>
              )}
            </button>
            <button className="btn-new" onClick={() => router.push('/medida-administrativa/nova')}>
              <Plus size={15} strokeWidth={3}/>
              <span className="hidden sm:inline">Nova Medida</span>
              <span className="sm:hidden">Nova</span>
            </button>
          </div>
        </div>

        <div className="filter-wrap">
          <div className="filter-header">
            <div className="filter-header-left">
              <SlidersHorizontal size={14}/>
              Filtros
              {filtrosAtivos > 0 && <span className="filter-badge">{filtrosAtivos}</span>}
            </div>
            {filtrosAtivos > 0 && (
              <button className="filter-clear" onClick={limparFiltros}><X size={12}/> Limpar</button>
            )}
          </div>

          <div className="filter-body">
            <div className="filter-field">
              <span className="filter-label">Busca</span>
              <div style={{ display:'flex', height:'36px', border:'1px solid #e3e8ef', borderRadius:'8px', overflow:'hidden', background:'#f8fafc', transition:'border-color .15s,box-shadow .15s' }}
                onFocusCapture={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor='#3d6cf0'; el.style.boxShadow='0 0 0 3px rgba(61,108,240,.08)'; el.style.background='#fff' }}
                onBlurCapture={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor='#e3e8ef'; el.style.boxShadow='none'; el.style.background='#f8fafc' }}
              >
                <div style={{ position:'relative', borderRight:'1px solid #e3e8ef', flexShrink:0 }}>
                  <select value={campoBusca} onChange={e => { setCampoBusca(e.target.value); setBusca('') }}
                    style={{ height:'100%', background:'transparent', border:'none', outline:'none', fontSize:'12px', fontWeight:700, color:'#3d6cf0', fontFamily:'inherit', paddingLeft:'10px', paddingRight:'22px', appearance:'none', cursor:'pointer' }}>
                    <option value="todos">Todos os campos</option>
                    <option value="colaborador">Nome</option>
                    <option value="matricula">Matrícula</option>
                    <option value="supervisor">Supervisor</option>
                    <option value="numeroInspecao">ID Click</option>
                    <option value="id">ID Sistema</option>
                  </select>
                  <svg style={{ position:'absolute', right:'6px', top:'50%', transform:'translateY(-50%)', pointerEvents:'none', color:'#3d6cf0' }} width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="6 9 12 15 18 9"/></svg>
                </div>
                <div style={{ position:'relative', flex:1, display:'flex', alignItems:'center' }}>
                  <Search style={{ position:'absolute', left:'9px', color:'#c4cbd6' }} size={13}/>
                  <input
                    style={{ width:'100%', height:'100%', background:'transparent', border:'none', outline:'none', paddingLeft:'28px', paddingRight:'8px', fontSize:'13px', fontFamily:'inherit', color:'#111827' }}
                    placeholder={
                      campoBusca === 'colaborador' ? 'Nome do colaborador...' :
                      campoBusca === 'matricula' ? 'Ex: M1234...' :
                      campoBusca === 'supervisor' ? 'Matrícula do supervisor...' :
                      campoBusca === 'numeroInspecao' ? 'Ex: INSP-2026-001...' :
                      campoBusca === 'id' ? 'ID do sistema...' : 'Pesquisar...'
                    }
                    value={busca} onChange={e => setBusca(e.target.value)}
                  />
                </div>
              </div>
            </div>

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

            <div className="filter-field">
              <span className="filter-label">Classificação</span>
              <div className="filter-select-wrap">
                <select className="filter-input" value={filtroClassificacao} onChange={e => setFiltroClassificacao(e.target.value)}>
                  <option value="Todos">Todas</option>
                  {listaClassificacoes.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className="filter-field">
              <span className="filter-label">Gravidade</span>
              <div className="filter-select-wrap">
                <select className="filter-input" value={filtroGravidade} onChange={e => setFiltroGravidade(e.target.value)}>
                  <option value="Todos">Todas</option>
                  {Object.keys(GRAVIDADE_CONFIG).map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
            </div>

            <div className="filter-field">
              <span className="filter-label">Data Ocorrência</span>
              <input className="filter-input" type="date" value={filtroData} onChange={e => setFiltroData(e.target.value)}/>
            </div>
          </div>

          {filtrosAtivos > 0 && (
            <div className="filter-chips">
              {busca && <span className="filter-chip">"{busca}" <button onClick={() => setBusca('')}><X size={10}/></button></span>}
              {filtroCategoria !== 'Todos' && <span className="filter-chip">{filtroCategoria} <button onClick={() => setFiltroCategoria('Todos')}><X size={10}/></button></span>}
              {filtroMedida !== 'Todos' && <span className="filter-chip">{filtroMedida} <button onClick={() => setFiltroMedida('Todos')}><X size={10}/></button></span>}
              {filtroGravidade !== 'Todos' && <span className="filter-chip">{filtroGravidade} <button onClick={() => setFiltroGravidade('Todos')}><X size={10}/></button></span>}
              {filtroClassificacao !== 'Todos' && <span className="filter-chip">{filtroClassificacao} <button onClick={() => setFiltroClassificacao('Todos')}><X size={10}/></button></span>}
              {filtroData && <span className="filter-chip">{new Date(filtroData + 'T00:00:00').toLocaleDateString('pt-BR')} <button onClick={() => setFiltroData('')}><X size={10}/></button></span>}
            </div>
          )}
        </div>

        <div className="ins-main-card">
          {loading ? (
            <div className="py-24 text-center"><Loader2 size={40} className="mx-auto mb-4 text-[#094780] animate-spin"/></div>
          ) : filteredData.length === 0 ? (
            <div className="py-20 text-center">
              <div className="w-14 h-14 rounded-full bg-[#f4f6f9] flex items-center justify-center mx-auto mb-3">
                <Search size={22} className="text-[#c4cbd6]"/>
              </div>
              <p className="text-[14px] font-semibold text-[#9ca3af]">Nenhum registro encontrado</p>
              <p className="text-[12px] text-[#c4cbd6] mt-1">Tente ajustar os filtros acima</p>
            </div>
          ) : (
            <div className="table-scroll">
              <table className="ins-table">
                <thead>
                  <tr>
                    <th>ID / Click / Data</th>
                    <th>Colaborador / Sup.</th>
                    <th>Tipo / Medida</th>
                    <th>Gravidade / Classif.</th>
                    <th style={{ textAlign:'right' }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map(item => {
                    const grav = GRAVIDADE_CONFIG[item.gravidade] ?? GRAVIDADE_CONFIG['LEVE']
                    return (
                      <tr key={item.id} className="ins-row">
                        <td>
                          <div className="font-bold text-[#094780] text-[13px] cursor-pointer hover:underline w-fit"
                            onClick={() => router.push(`/medida-administrativa/detalhes/${item.id}`)}>
                            #{item.id.slice(-6).toUpperCase()}
                          </div>
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
                          <div className={cn('inline-flex px-2 py-0.5 rounded text-[9px] font-black uppercase mb-1',
                            item.tipo === 'SEGURANÇA' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600')}>
                            {item.tipo}
                          </div>
                          <div className="text-[12px] font-bold text-[#4a5568]">{item.medida}</div>
                        </td>
                        <td>
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold border mb-1.5"
                            style={{ background:grav.bg, color:grav.color, borderColor:grav.border }}>
                            {item.gravidade}
                          </span>
                          <div className="text-[10px] font-bold text-slate-400 line-clamp-1 max-w-[180px]" title={item.classificacao}>
                            {item.classificacao}
                          </div>
                        </td>
                        <td style={{ textAlign:'right' }}>
                          <div className="flex justify-end">
                            <ActionMenu
                              onVisualizar={() => router.push(`/medida-administrativa/detalhes/${item.id}`)}
                              onEditar={() => router.push(`/medida-administrativa/editar/${item.id}`)}
                              onExcluir={() => handleOpenDeleteModal(item.id)}
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

      {showDeleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
          style={{ animation:'fadeIn .2s ease' }}>
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl"
            style={{ animation:'scaleIn .25s cubic-bezier(0.16,1,0.3,1)' }}>
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-5">
                <AlertCircle size={32} className="text-red-500"/>
              </div>
              <h3 style={{ fontFamily:'Syne', fontWeight:800 }} className="text-xl text-[#0d1e33] mb-2">Excluir Medida?</h3>
              <p className="text-sm text-[#8896ab] leading-relaxed">Esta ação é permanente e removerá todos os dados do sistema.</p>
            </div>
            <div className="flex gap-3 p-6 bg-slate-50 border-t border-slate-100">
              <button onClick={() => setShowDeleteModal(false)} disabled={isDeleting}
                className="flex-1 py-3 px-4 rounded-xl text-sm font-bold text-[#4a5568] bg-white border border-[#e2e8f0] hover:bg-slate-100 disabled:opacity-50">
                Cancelar
              </button>
              <button onClick={confirmDelete} disabled={isDeleting}
                className="flex-1 py-3 px-4 rounded-xl text-sm font-bold text-white bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/20 flex items-center justify-center gap-2 disabled:opacity-70">
                {isDeleting ? <><Loader2 size={16} className="animate-spin"/>Excluindo...</> : 'Sim, excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </MedidaLayout>
  )
}