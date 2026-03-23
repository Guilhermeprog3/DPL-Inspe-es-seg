'use client'
import { useState, useRef, useEffect } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useRouter } from 'next/navigation'
import {
  Search, CheckCircle2, AlertTriangle, XCircle,
  Clock, Eye, User, Calendar, Hash, FilterX, SlidersHorizontal, ChevronDown, Boxes, Plus
} from 'lucide-react'

/* ─── Mock data ─── */
const INSPECOES = [
  { id: 'INS-0041', equipId: 'EQ-9921', equipamento: 'Extintor CO₂ – Bloco A', tipo: 'Extintor', inspetor: 'Carlos Mendes', regional: 'Metropolitana', data: '2026-03-19T10:32:00', status: 'aprovado' },
  { id: 'INS-0040', equipId: 'EQ-4412', equipamento: 'Mangueira HID-12 – Pav 3', tipo: 'Hidrante', inspetor: 'Ana Souza', regional: 'Metropolitana', data: '2026-03-19T08:15:00', status: 'atencao' },
  { id: 'INS-0039', equipId: 'EQ-1022', equipamento: 'Extintor Pó – Oficina', tipo: 'Extintor', inspetor: 'João Lima', regional: 'Norte', data: '2026-03-18T16:44:00', status: 'reprovado' },
  { id: 'INS-0038', equipId: 'EQ-8855', equipamento: 'Sprinkler – Almoxarifado', tipo: 'Sprinkler', inspetor: 'Carlos Mendes', regional: 'Metropolitana', data: '2026-03-18T14:10:00', status: 'aprovado' },
  { id: 'INS-0037', equipId: 'EQ-3310', equipamento: 'Extintor ABC – Recepção', tipo: 'Extintor', inspetor: 'Mariana Farias', regional: 'Sul', data: '2026-03-17T11:05:00', status: 'aprovado' },
  { id: 'INS-0036', equipId: 'EQ-5561', equipamento: 'Detector de Fumaça – TI', tipo: 'Detector', inspetor: 'Ana Souza', regional: 'Metropolitana', data: '2026-03-17T09:22:00', status: 'pendente' },
  { id: 'INS-0035', equipId: 'EQ-7701', equipamento: 'Mangueira HID-07 – Pav 1', tipo: 'Hidrante', inspetor: 'João Lima', regional: 'Norte', data: '2026-03-16T15:00:00', status: 'atencao' },
  { id: 'INS-0034', equipId: 'EQ-2230', equipamento: 'Extintor CO₂ – Datacenter', tipo: 'Extintor', inspetor: 'Pedro Alves', regional: 'Metropolitana', data: '2026-03-15T13:30:00', status: 'aprovado' },
]

const STATUS_CONFIG = {
  aprovado: { label: 'Aprovado', icon: CheckCircle2, color: '#059669', bg: '#ecfdf5', border: '#a7f3d0' },
  atencao: { label: 'Atenção', icon: AlertTriangle, color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  reprovado: { label: 'Reprovado', icon: XCircle, color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
  pendente: { label: 'Pendente', icon: Clock, color: '#6b7280', bg: '#f9fafb', border: '#e5e7eb' },
} as const

const TIPO_COLORS: Record<string, { bg: string; color: string }> = {
  Extintor: { bg: '#eff6ff', color: '#1d4ed8' },
  Hidrante: { bg: '#f0fdf4', color: '#15803d' },
  Sprinkler: { bg: '#faf5ff', color: '#7e22ce' },
  Detector: { bg: '#fff7ed', color: '#c2410c' },
}

const fmt = (iso: string) => {
  const d = new Date(iso)
  return {
    date: d.toLocaleDateString('pt-BR'),
    time: d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
  }
}

const INSPETORES = [...new Set(INSPECOES.map((i) => i.inspetor))]

function InspetorCombobox({ value, onApply }: { value: string, onApply: (v: string) => void }) {
  const [inputValue, setInputValue] = useState(value === 'Todos' ? '' : value)
  const [open, setOpen] = useState(false)
  const [highlighted, setHighlighted] = useState(-1)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => { if (value === 'Todos') setInputValue('') }, [value])

  const suggestions = inputValue.trim()
    ? INSPETORES.filter((n) => n.toLowerCase().includes(inputValue.toLowerCase()))
    : INSPETORES

  const select = (name: string) => {
    setInputValue(name)
    onApply(name)
    setOpen(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      setOpen(true)
      setHighlighted((h) => Math.min(h + 1, suggestions.length - 1))
      return
    }
    if (e.key === 'ArrowUp') setHighlighted((h) => Math.max(h - 1, 0))
    if (e.key === 'Enter') {
      if (highlighted >= 0) {
        select(suggestions[highlighted])
      } else {
        onApply(inputValue.trim() === '' ? 'Todos' : inputValue)
        setOpen(false)
      }
    }
    if (e.key === 'Escape') setOpen(false)
  }

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <div className="ins-field">
        <span className="ins-field-icon"><User size={13} /></span>
        <input
          className="ins-input"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Enter p/ filtrar..."
        />
        <span className="ins-field-icon" style={{ right: 11, left: 'auto' }}><ChevronDown size={13} /></span>
      </div>
      {open && suggestions.length > 0 && (
        <ul className="ins-combobox-list">
          {suggestions.map((name, idx) => (
            <li key={name} className={`ins-combobox-item ${highlighted === idx ? 'highlighted' : ''}`} onMouseDown={() => select(name)}>
              {name}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default function InspecoesPage() {
  const router = useRouter()

  const [filterId, setFilterId] = useState('')
  const [filterEquip, setFilterEquip] = useState('')
  const [filterInspetor, setFilterInspetor] = useState('Todos')
  const [filterStatus, setFilterStatus] = useState('Todos')
  const [filterData, setFilterData] = useState('')

  const [draftId, setDraftId] = useState('')
  const [draftEquip, setDraftEquip] = useState('')

  const handleKeyDownId = (e: React.KeyboardEvent) => { if (e.key === 'Enter') setFilterId(draftId) }
  const handleKeyDownEquip = (e: React.KeyboardEvent) => { if (e.key === 'Enter') setFilterEquip(draftEquip) }

  const filtered = INSPECOES.filter((i) => {
    const matchId = i.id.toLowerCase().includes(filterId.toLowerCase())
    const matchEquip = 
        i.equipamento.toLowerCase().includes(filterEquip.toLowerCase()) || 
        i.equipId.toLowerCase().includes(filterEquip.toLowerCase())
    const matchInspetor = filterInspetor === 'Todos' || i.inspetor.toLowerCase().includes(filterInspetor.toLowerCase())
    const matchStatus = filterStatus === 'Todos' || STATUS_CONFIG[i.status as keyof typeof STATUS_CONFIG].label === filterStatus
    const matchData = !filterData || i.data.startsWith(filterData)
    return matchId && matchEquip && matchInspetor && matchStatus && matchData
  })

  const resetFilters = () => {
    setFilterId(''); setFilterEquip(''); setFilterInspetor('Todos')
    setFilterStatus('Todos'); setFilterData(''); setDraftId(''); setDraftEquip('')
  }

  const hasFilters = filterId || filterEquip || filterInspetor !== 'Todos' || filterStatus !== 'Todos' || filterData

  return (
    <DashboardLayout title="Lista de Inspeções" breadcrumb="SIGS / Dashboard / Inspeções">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600&family=Fraunces:wght@600&display=swap');
        .ins-root { font-family: 'Instrument Sans', sans-serif; padding: 8px 0 48px; --blue: #094780; --blue-faint: #f0f6ff; --orange: #E67A0E; }
        .ins-filter-wrap { background: #fff; border: 1px solid #e9eef4; border-radius: 16px; padding: 20px 24px; margin-bottom: 24px; }
        .ins-filter-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
        .ins-btn-primary { display: flex; align-items: center; gap: 8px; background: var(--orange); color: #fff; padding: 10px 18px; border-radius: 10px; font-weight: 600; font-size: 13px; transition: opacity .2s; border: none; cursor: pointer; box-shadow: 0 4px 12px rgba(230, 122, 14, 0.2); }
        .ins-btn-primary:hover { opacity: 0.9; }
        .ins-filter-grid { display: grid; grid-template-columns: 1fr 1.8fr 1.4fr 1fr 1fr; gap: 12px; align-items: end; }
        .ins-field-wrap { display: flex; flex-direction: column; gap: 5px; }
        .ins-field-label { font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: .4px; }
        .ins-field { position: relative; display: flex; align-items: center; }
        .ins-field-icon { position: absolute; left: 11px; color: #94a3b8; pointer-events: none; display: flex; align-items: center; }
        .ins-input { width: 100%; height: 40px; border: 1.5px solid #e2e8f0; border-radius: 10px; padding: 0 12px 0 36px; font-size: 13px; color: #1e293b; outline: none; background: #f8fafc; transition: all .18s; }
        .ins-input:focus { border-color: var(--blue); background: #fff; box-shadow: 0 0 0 3px rgba(9,71,128,.08); }
        .ins-combobox-list { position: absolute; top: calc(100% + 6px); left: 0; right: 0; z-index: 50; background: #fff; border: 1.5px solid #e2e8f0; border-radius: 12px; box-shadow: 0 8px 24px rgba(9,71,128,.10); list-style: none; margin: 0; padding: 6px; max-height: 200px; overflow-y: auto; }
        .ins-combobox-item { padding: 8px 10px; border-radius: 8px; font-size: 13px; cursor: pointer; }
        .ins-combobox-item.highlighted, .ins-combobox-item:hover { background: var(--blue-faint); color: var(--blue); }
        .ins-card { background: #fff; border: 1px solid #e9eef4; border-radius: 18px; overflow: hidden; }
        .ins-card-header { display: flex; align-items: center; justify-content: space-between; padding: 20px 28px; border-bottom: 1px solid #f1f5f9; }
        .ins-table { width: 100%; border-collapse: collapse; }
        .ins-table th { padding: 12px 20px; text-align: left; font-size: 10.5px; font-weight: 700; color: #94a3b8; background: #f8fafc; border-bottom: 1px solid #f1f5f9; text-transform: uppercase; }
        .ins-row td { padding: 15px 20px; border-bottom: 1px solid #f8fafc; font-size: 13.5px; color: #334155; }
        .ins-status-pill { display: inline-flex; align-items: center; gap: 5px; padding: 4px 10px; border-radius: 8px; font-size: 11px; font-weight: 700; border: 1px solid; }
        .ins-btn-detail { display: inline-flex; align-items: center; gap: 6px; padding: 7px 14px; border-radius: 9px; border: 1.5px solid #e2e8f0; font-size: 12px; font-weight: 600; cursor: pointer; transition: .15s; }
        .ins-btn-detail:hover { background: var(--blue); color: #fff; }
        .ins-avatar { width: 24px; height: 24px; border-radius: 50%; background: var(--blue-faint); display: flex; align-items: center; justify-content: center; font-size: 10px; color: var(--blue); font-weight: 700; }
        .ins-equip-id { font-size: 10px; color: #94a3b8; font-family: monospace; background: #f1f5f9; padding: 1px 4px; border-radius: 4px; }
      `}</style>

      <div className="ins-root">
        <div className="ins-filter-wrap">
          <div className="ins-filter-header">
            <span className="ins-field-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
              <SlidersHorizontal size={14} /> Painel de Filtros
            </span>
            <button className="ins-btn-primary" onClick={() => router.push('/inspecao/nova')}>
              <Plus size={16} /> Nova Inspeção
            </button>
          </div>

          <div className="ins-filter-grid">
            <div className="ins-field-wrap">
              <label className="ins-field-label">ID Inspeção</label>
              <div className="ins-field">
                <span className="ins-field-icon"><Hash size={13} /></span>
                <input className="ins-input" value={draftId} onChange={(e) => setDraftId(e.target.value)} onKeyDown={handleKeyDownId} placeholder="ID + Enter" />
              </div>
            </div>

            <div className="ins-field-wrap">
              <label className="ins-field-label">Equipamento / ID</label>
              <div className="ins-field">
                <span className="ins-field-icon"><Boxes size={13} /></span>
                <input className="ins-input" value={draftEquip} onChange={(e) => setDraftEquip(e.target.value)} onKeyDown={handleKeyDownEquip} placeholder="Nome ou ID + Enter" />
              </div>
            </div>

            <div className="ins-field-wrap">
              <label className="ins-field-label">Inspetor</label>
              <InspetorCombobox value={filterInspetor} onApply={setFilterInspetor} />
            </div>

            <div className="ins-field-wrap">
              <label className="ins-field-label">Data</label>
              <div className="ins-field">
                <span className="ins-field-icon"><Calendar size={13} /></span>
                <input className="ins-input" type="date" value={filterData} onChange={(e) => setFilterData(e.target.value)} />
              </div>
            </div>

            <div className="ins-field-wrap">
              <label className="ins-field-label">Status</label>
              <div className="ins-field">
                <span className="ins-field-icon"><CheckCircle2 size={13} /></span>
                <select className="ins-input" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                  <option value="Todos">Todos os status</option>
                  {Object.values(STATUS_CONFIG).map((s) => <option key={s.label} value={s.label}>{s.label}</option>)}
                </select>
              </div>
            </div>
          </div>

          {hasFilters && (
            <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end' }}>
              <button className="ins-btn-reset active" style={{ width: 'auto', padding: '0 18px' }} onClick={resetFilters}>
                <FilterX size={13} /> Limpar filtros
              </button>
            </div>
          )}
        </div>

        <div className="ins-card">
          <div className="ins-card-header">
            <span style={{ fontWeight: 600, fontSize: 16 }}>Registros</span>
            <span className="ins-badge-count">{filtered.length} encontrados</span>
          </div>

          <table className="ins-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Equipamento</th>
                <th>Inspetor</th>
                <th>Data</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((ins) => {
                const s = STATUS_CONFIG[ins.status as keyof typeof STATUS_CONFIG]
                const dt = fmt(ins.data)
                return (
                  <tr className="ins-row" key={ins.id}>
                    <td><span style={{ fontWeight: 700, color: '#094780' }}>{ins.id}</span></td>
                    <td>
                      <div className="ins-equip-name">{ins.equipamento}</div>
                      <div className="ins-equip-sub">
                        <span className="ins-equip-id">{ins.equipId}</span>
                        <span className="ins-regional" style={{fontSize: '11px', color: '#94a3b8'}}>{ins.regional}</span>
                      </div>
                    </td>
                    <td>
                      <div className="ins-inspetor">
                        <div className="ins-avatar">{ins.inspetor.charAt(0)}</div>
                        <span>{ins.inspetor}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{dt.date}</div>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>{dt.time}</div>
                    </td>
                    <td>
                      <span className="ins-status-pill" style={{ background: s.bg, color: s.color, borderColor: s.border }}>
                        <s.icon size={11} strokeWidth={2.5} /> {s.label}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="ins-btn-detail" onClick={() => router.push(`/inspecao/${ins.id}`)}>
                        <Eye size={12} /> Detalhes
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  )
}