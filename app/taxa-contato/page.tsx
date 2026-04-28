'use client'

import { useState, useMemo, useEffect } from 'react'
import {
  TrendingUp, TrendingDown, ChevronRight,
  Search, SlidersHorizontal, Download, LayoutDashboard,
  PhoneCall, UserCheck, AlertCircle, ArrowUpDown,
  ArrowUp, ArrowDown, ChevronLeft, RefreshCw, Calendar, X,
  ChevronDown
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import api from '@/lib/api' 

// ─── Nav ──────────────────────────────────────────────────────────────────────
const navItems = [
  { section: 'Gestão de Pessoas' },
  { label: 'Dashboard',       href: '/gestao-pessoas',               icon: LayoutDashboard },
  { section: 'Módulos' },
  { label: 'Taxa de Contato', href: '/gestao-pessoas/taxa-contato', icon: PhoneCall },
  { label: 'Base de Gente',   href: '/gestao-pessoas/base-gente',   icon: UserCheck },
]

const MES_ATUAL = 'Abril/2026'

// Gera lista de meses para o filtro (últimos 24 meses até o atual)
function gerarMeses() {
  const meses = []
  const nomeMes = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
  const hoje = new Date(2026, 3, 1) // Abril/2026
  for (let i = 0; i < 24; i++) {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1)
    const value = `${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
    const label = `${nomeMes[d.getMonth()]}/${d.getFullYear()}`
    meses.push({ value, label })
  }
  return meses
}
const MESES_OPTIONS = gerarMeses()

const STATUS_CFG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  'ATIVO':       { label: 'Ativo',          color: '#10b981', bg: '#f0fdf4', border: '#bbf7d0' },
  'FÉRIAS':      { label: 'Férias',         color: '#f59e0b', bg: '#fffbeb', border: '#fde68a' },
  'AFASTADO':    { label: 'Afastado',       color: '#ef4444', bg: '#fef2f2', border: '#fecaca' },
  'DESLIGADO':   { label: 'Desligado',      color: '#64748b', bg: '#f8fafc', border: '#e2e8f0' },
  'PENDENTE':    { label: 'Pendente',       color: '#ef4444', bg: '#fef2f2', border: '#fecaca' },
}

const ALL_AREAS     = ['SESMT', 'RH', 'OPERAÇÕES', 'SEGURANÇA', 'GEOM', 'PLANTÃO', 'COMERCIAL']
const ALL_REGIONAIS = ['METROPOLITANA', 'METRO', 'NORTE', 'SUL', 'NOROESTE', 'LESTE']
const ALL_UFS       = ['PI', 'MA']
const ALL_BASES     = ['Teresina', 'Parnaíba', 'Picos', 'Floriano', 'São Luís', 'Timon', 'Caxias']
const UF_LABELS: Record<string, string> = { PI: 'Piauí', MA: 'Maranhão' }

type SortField = 'supervisor' | 'taxa' | 'contatados'
type SortDir   = 'asc' | 'desc'

// ─── Helpers ──────────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const key = (status || 'PENDENTE').toUpperCase();
  const cfg = STATUS_CFG[key] ?? { label: status, color: '#64748b', bg: '#f8fafc', border: '#e2e8f0' };
  
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border"
      style={{ background: cfg.bg, color: cfg.color, borderColor: cfg.border }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.color }} />
      {cfg.label}
    </span>
  )
}

function FilterSelect({ label, value, onChange, options, placeholder = 'Todos' }: any) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
      <div className="relative">
        <select value={value} onChange={e => onChange(e.target.value)} className={cn('gp-select', value && 'has-value')}>
          <option value="">{placeholder}</option>
          {options.map((o: any) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <ChevronDown size={13} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
      </div>
    </div>
  )
}

function ChipFilter({ label, options, value, onChange, renderLabel }: any) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
      <div className="flex flex-wrap gap-1.5">
        <button onClick={() => onChange([])} className={cn('chip', value.length === 0 && 'chip-active')}>Todos</button>
        {options.map((opt: any) => (
          <button
            key={opt}
            onClick={() => value.includes(opt) ? onChange(value.filter((v: any) => v !== opt)) : onChange([...value, opt])}
            className={cn('chip', value.includes(opt) && 'chip-active')}
          >
            {renderLabel ? renderLabel(opt) : opt}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function TaxaContatoPage() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [busca, setBusca] = useState('')
  const [filtroArea, setFiltroArea] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('')
  const [filtroBase, setFiltroBase] = useState('')
  const [filtroUf, setFiltroUf] = useState<string[]>([])
  const [filtroRegional, setFiltroRegional] = useState<string[]>([])
  // ── NOVO: filtro de competência (MM/YYYY) ──────────────────────────────────
  const [filtroMes, setFiltroMes] = useState(MESES_OPTIONS[0].value) // padrão = mês atual

  const [sortField, setSortField] = useState<SortField>('supervisor')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [currentPage, setCurrentPage] = useState(1)
  const PAGE_SIZE = 12

  const filtrosAtivos = [
    busca, 
    filtroArea, 
    filtroStatus, 
    filtroBase, 
    filtroUf.length > 0, 
    filtroRegional.length > 0,
    // filtroMes não conta como "filtro extra" pois sempre há um mês selecionado
  ].filter(Boolean).length;

  useEffect(() => {
    fetchData()
  }, [filtroMes]) // re-busca ao mudar o mês

  async function fetchData() {
    setLoading(true)
    try {
      // Passa a competência como query param para a API
      const response = await api.get('/taxa-contato', { params: { competencia: filtroMes } })
      setData(response.data)
    } catch (error) {
      console.error('Erro ao buscar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  function handleSort(f: SortField) {
    if (f === sortField) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(f); setSortDir('asc') }
    setCurrentPage(1)
  }

  function limparTudo() {
    setBusca(''); setFiltroArea(''); setFiltroStatus(''); setFiltroBase('')
    setFiltroUf([]); setFiltroRegional([]); setCurrentPage(1)
    // filtroMes não é limpo no "limpar tudo" pois é o contexto principal da página
  }

  const filtered = useMemo(() => {
    const t = busca.toLowerCase().trim()
    return data.filter(s => {
      if (t) {
        const matchSupervisor  = s.supervisor?.toLowerCase().includes(t)
        const matchColab = s.nome?.toLowerCase().includes(t) || s.chapa?.includes(t)
        if (!matchSupervisor && !matchColab) return false
      }
      if (filtroArea && s.area !== filtroArea) return false
      if (filtroStatus && (s.codsituacao || '').toUpperCase() !== filtroStatus.toUpperCase()) return false
      if (filtroBase && s.base !== filtroBase) return false
      if (filtroUf.length > 0 && !filtroUf.includes(s.filial)) return false
      if (filtroRegional.length > 0 && !filtroRegional.includes(s.regional)) return false
      return true
    }).sort((a, b) => {
      let diff = 0
      if (sortField === 'supervisor') diff = (a.supervisor || '').localeCompare(b.supervisor || '', 'pt-BR')
      return sortDir === 'asc' ? diff : -diff
    })
  }, [data, busca, filtroArea, filtroStatus, filtroBase, filtroUf, filtroRegional, sortField, sortDir])

  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))

  // Label do mês selecionado para exibir no título
  const mesLabel = MESES_OPTIONS.find(m => m.value === filtroMes)?.label ?? filtroMes

  return (
    <DashboardLayout title="Taxa de Contato" breadcrumb="SIGS / Gestão de Pessoas / Taxa de Contato" navItems={navItems}>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Syne:wght@700;800&display=swap');
        .gp-root { font-family:'DM Sans',sans-serif; padding:16px; }
        .filter-wrap { background:#fff; border:1px solid #e3e8ef; border-radius:14px; margin-bottom:14px; overflow:hidden; }
        .filter-header { display:flex; align-items:center; justify-content:space-between; padding:10px 14px; border-bottom:1px solid #f1f5f9; }
        .filter-body { padding:16px; display:flex; flex-direction:column; gap:18px; }
        .filter-section-label { font-size:10px; font-weight:800; color:#cbd5e1; text-transform:uppercase; letter-spacing:.08em; display:flex; align-items:center; gap:8px; margin-bottom:10px; }
        .filter-section-label::after { content:''; flex:1; height:1px; background:#f1f5f9; }
        .select-grid { display:grid; grid-template-columns:1fr; gap:12px; }
        @media(min-width:640px)  { .select-grid{ grid-template-columns:1fr 1fr; } }
        @media(min-width:1024px) { .select-grid{ grid-template-columns:repeat(3,1fr); } }
        .gp-select { width:100%; height:36px; appearance:none; background:#fff; border:1.5px solid #e3e8ef; border-radius:10px; padding:0 32px 0 12px; font-size:13px; cursor:pointer; transition: all 0.2s; }
        .gp-select.has-value { border-color:#094780; color:#094780; font-weight:600; background:#f0f6ff; }
        .gp-select-date { width:100%; height:40px; appearance:none; background:#f0f6ff; border:1.5px solid #094780; border-radius:10px; padding:0 36px 0 38px; font-size:13px; font-weight:700; color:#094780; cursor:pointer; transition: all 0.2s; }
        .gp-input { width:100%; height:36px; background:#f8fafc; border:1.5px solid #e3e8ef; border-radius:10px; padding:0 32px 0 36px; font-size:13px; outline:none; transition: all 0.2s; }
        .gp-input:focus { border-color:#094780; background:#fff; }
        .chip { display:inline-flex; align-items:center; gap:4px; padding:4px 11px; border-radius:99px; cursor:pointer; font-size:11px; font-weight:700; border:1.5px solid #e3e8ef; background:#fff; color:#64748b; transition:all .15s; }
        .chip-active { background:#094780 !important; color:#fff !important; border-color:#094780 !important; }
        .main-card { background:#fff; border:1px solid #e2e8f0; border-radius:18px; overflow:hidden; }
        .table-scroll { overflow-x:auto; }
        .gp-table { width:100%; border-collapse:collapse; min-width:980px; }
        .gp-table th { background:#f8fafc; padding:11px 14px; text-align:left; font-size:10px; font-weight:800; color:#8896ab; text-transform:uppercase; border-bottom:1px solid #e2e8f0; }
        .gp-row td { padding:12px 14px; border-bottom:1px solid #f1f5f9; vertical-align:middle; }
        .gp-row:hover td { background:#fafbfc; }
        .pag-wrap { display:flex; align-items:center; justify-content:space-between; padding:12px 18px; border-top:1px solid #f1f5f9; }
        .pg-btn { min-width:32px; height:32px; border-radius:8px; border:1.5px solid #e3e8ef; background:#fff; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:600; }
        .pg-active { background:#094780 !important; color:#fff !important; border-color:#094780; }
        .btn-outline { background:#fff; color:#374151; padding:8px 13px; border-radius:12px; font-weight:700; font-size:12px; border:1.5px solid #e3e8ef; cursor:pointer; display:flex; align-items:center; gap:6px; transition:all .15s; }
        .btn-outline:hover { border-color:#094780; color:#094780; }
        .date-filter-wrap { display:flex; align-items:center; gap:10px; background:#f8fafc; border:1px solid #e3e8ef; border-radius:12px; padding:10px 14px; }
      `}} />

      <div className="gp-root">
        <div className="flex justify-between items-start mb-4 flex-wrap gap-3">
          <div>
            <h2 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: '26px', color: '#0d1e33' }}>Taxa de Contato</h2>
            <p className="text-[11px] text-[#8896ab] font-bold uppercase mt-1">
              {mesLabel} · {filtered.length} registro(s) encontrado(s)
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* ── NOVO: seletor de competência destacado no topo ── */}
            <div className="relative flex items-center">
              <Calendar size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#094780] z-10" />
              <select
                value={filtroMes}
                onChange={e => { setFiltroMes(e.target.value); setCurrentPage(1) }}
                className="gp-select-date"
                style={{ minWidth: 180 }}
              >
                {MESES_OPTIONS.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
              <ChevronDown size={13} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#094780]" />
            </div>
            <button onClick={fetchData} className="btn-outline"><RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Atualizar</button>
            <button className="btn-outline"><Download size={13} /> Exportar</button>
          </div>
        </div>

        <div className="filter-wrap">
          <div className="filter-header">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
              <SlidersHorizontal size={13} /> Filtros {filtrosAtivos > 0 && <span className="bg-[#094780] text-white px-1.5 py-0.5 rounded-full">{filtrosAtivos}</span>}
            </div>
            {filtrosAtivos > 0 && <button onClick={limparTudo} className="text-xs font-bold text-slate-400 hover:text-red-500">Limpar tudo</button>}
          </div>

          <div className="filter-body">
            <div>
              <div className="filter-section-label">Pesquisa</div>
              <div className="relative max-w-xl">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input className="gp-input" type="text" placeholder="Nome, chapa ou supervisor..." value={busca} onChange={e => {setBusca(e.target.value); setCurrentPage(1)}} />
              </div>
            </div>

            <div className="select-grid">
              <FilterSelect label="Área" value={filtroArea} onChange={(v:any) => {setFiltroArea(v); setCurrentPage(1)}} options={ALL_AREAS.map(a => ({ value: a, label: a }))} />
              <FilterSelect label="Situação (Banco)" value={filtroStatus} onChange={(v:any) => {setFiltroStatus(v); setCurrentPage(1)}} options={Object.keys(STATUS_CFG).filter(k => k !== 'PENDENTE').map(k => ({ value: k, label: STATUS_CFG[k].label }))} />
              <FilterSelect label="Base" value={filtroBase} onChange={(v:any) => {setFiltroBase(v); setCurrentPage(1)}} options={ALL_BASES.map(b => ({ value: b, label: b }))} />
            </div>

            <div className="flex flex-wrap gap-x-10 gap-y-4">
              <ChipFilter label="Filial (UF)" options={ALL_UFS} value={filtroUf} onChange={(v:any) => {setFiltroUf(v); setCurrentPage(1)}} renderLabel={(uf:any) => UF_LABELS[uf]} />
              <ChipFilter label="Regional" options={ALL_REGIONAIS} value={filtroRegional} onChange={(v:any) => {setFiltroRegional(v); setCurrentPage(1)}} />
            </div>
          </div>
        </div>

        <div className="main-card">
          {loading ? (
             <div className="py-20 text-center animate-pulse text-slate-400 font-bold">Carregando base de dados...</div>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center">
              <AlertCircle size={32} className="mx-auto mb-3 text-slate-300" />
              <p className="text-[14px] font-semibold text-slate-400">Nenhum registro encontrado</p>
            </div>
          ) : (
            <>
              <div className="table-scroll">
                <table className="gp-table">
                  <thead>
                    <tr>
                      {/* ── Colaborador agora é a 1ª coluna ── */}
                      <th>Colaborador</th>
                      <th className="cursor-pointer" onClick={() => handleSort('supervisor')}>Supervisor {sortField === 'supervisor' && (sortDir === 'asc' ? '↑' : '↓')}</th>
                      <th>Área</th>
                      <th>Filial/Regional</th>
                      <th>Local</th>
                      <th>Situação (Banco)</th>
                      <th style={{ textAlign: 'right' }}>Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map((s: any) => (
                      <tr key={s.id} className="gp-row">
                        {/* ── Colaborador antes do Supervisor ── */}
                        <td>
                          <div className="font-bold text-[#1a2535] text-[13px] uppercase">{s.nome}</div>
                          <div className="text-[10px] text-[#8896ab]">Chapa: {s.chapa}</div>
                        </td>
                        <td>
                           <div className="font-bold text-[#1a2535] text-[13px]">{s.supervisor || 'NÃO ASSUMIDO'}</div>
                        </td>
                        <td><span className="inline-flex px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold">{s.area}</span></td>
                        <td><div className="font-bold text-slate-700 text-[11px] uppercase">{s.filial}</div><div className="text-[9px] text-[#8896ab] font-bold">{s.regional}</div></td>
                        <td><span className="text-[12px] font-semibold text-slate-600">{s.local}</span></td>
                        <td><StatusBadge status={s.codsituacao} /></td>
                        <td style={{ textAlign: 'right' }}>
                          <button className="text-[11px] font-bold text-[#094780] hover:underline flex items-center gap-1 ml-auto">
                            Detalhar <ChevronRight size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="pag-wrap">
                <span className="text-[11px] text-[#8896ab]">Exibindo <strong>{(currentPage - 1) * PAGE_SIZE + 1} a {Math.min(currentPage * PAGE_SIZE, filtered.length)}</strong> de <strong>{filtered.length}</strong></span>
                <div className="flex gap-1">
                  <button className="pg-btn" onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}><ChevronLeft size={14} /></button>
                  <div className="px-4 flex items-center text-xs font-bold text-slate-600">Página {currentPage} de {totalPages}</div>
                  <button className="pg-btn" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages}><ChevronRight size={14} /></button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}