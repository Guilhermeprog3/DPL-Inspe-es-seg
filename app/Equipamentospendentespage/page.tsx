'use client'
import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useRouter } from 'next/navigation'
import {
  Search, ClipboardList, PackageSearch, AlertTriangle,
  CalendarX2, MapPin, Tag, ChevronRight, Flame, Clock,
} from 'lucide-react'

/* ─── Mock data ─── */
const EQUIPAMENTOS = [
  { id: 'EQ-0102', nome: 'Extintor CO₂ – Bloco B', tipo: 'Extintor', regional: 'Metropolitana', local: 'Pav 2 – Corredor Norte', vencimento: '2026-03-10', diasAtraso: 10, prioridade: 'critico' },
  { id: 'EQ-0089', nome: 'Mangueira HID-03 – Térreo', tipo: 'Hidrante', regional: 'Norte', local: 'Recepção Principal', vencimento: '2026-03-15', diasAtraso: 5, prioridade: 'critico' },
  { id: 'EQ-0117', nome: 'Extintor Pó – Almoxarifado', tipo: 'Extintor', regional: 'Metropolitana', local: 'Galpão C', vencimento: '2026-03-18', diasAtraso: 2, prioridade: 'alto' },
  { id: 'EQ-0055', nome: 'Detector de Fumaça – TI', tipo: 'Detector', regional: 'Sul', local: 'Sala de Servidores', vencimento: '2026-03-19', diasAtraso: 1, prioridade: 'alto' },
  { id: 'EQ-0078', nome: 'Sprinkler – Refeitório', tipo: 'Sprinkler', regional: 'Metropolitana', local: 'Bloco A – 1º Andar', vencimento: '2026-03-22', diasAtraso: -2, prioridade: 'medio' },
  { id: 'EQ-0091', nome: 'Extintor ABC – Portaria', tipo: 'Extintor', regional: 'Norte', local: 'Entrada Principal', vencimento: '2026-03-25', diasAtraso: -5, prioridade: 'medio' },
  { id: 'EQ-0133', nome: 'Mangueira HID-11 – Pav 4', tipo: 'Hidrante', regional: 'Metropolitana', local: 'Corredor Leste', vencimento: '2026-03-28', diasAtraso: -8, prioridade: 'baixo' },
]

const PRIORIDADE_CONFIG = {
  critico: { label: 'Crítico',  color: '#ef4444', bg: 'rgba(239,68,68,0.1)',   icon: Flame },
  alto:    { label: 'Alto',     color: '#E67A0E', bg: 'rgba(230,122,14,0.1)',  icon: AlertTriangle },
  medio:   { label: 'Médio',    color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  icon: Clock },
  baixo:   { label: 'Baixo',    color: '#8896ab', bg: 'rgba(136,150,171,0.1)', icon: CalendarX2 },
} as const

const TIPOS = ['Todos', 'Extintor', 'Hidrante', 'Sprinkler', 'Detector']
const PRIORS = ['Todos', 'Crítico', 'Alto', 'Médio', 'Baixo']

export default function EquipamentosPendentesPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [tipoFilter, setTipoFilter] = useState('Todos')
  const [priorFilter, setPriorFilter] = useState('Todos')

  const filtered = EQUIPAMENTOS.filter((e) => {
    const ms = search.toLowerCase()
    const matchSearch =
      e.id.toLowerCase().includes(ms) ||
      e.nome.toLowerCase().includes(ms) ||
      e.local.toLowerCase().includes(ms)
    const matchTipo = tipoFilter === 'Todos' || e.tipo === tipoFilter
    const matchPrior =
      priorFilter === 'Todos' ||
      PRIORIDADE_CONFIG[e.prioridade as keyof typeof PRIORIDADE_CONFIG].label === priorFilter
    return matchSearch && matchTipo && matchPrior
  })

  const countBy = (p: string) => EQUIPAMENTOS.filter((e) => e.prioridade === p).length

  return (
    <DashboardLayout title="Equipamentos Pendentes" breadcrumb="SIGS / Dashboard / Pendentes">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Syne:wght@700;800&display=swap');
        .ep-wrap { font-family: 'DM Sans', sans-serif; padding: 32px 0; }

        /* alert banner */
        .ep-alert {
          display: flex;
          align-items: center;
          gap: 12px;
          background: rgba(239,68,68,0.07);
          border: 1px solid rgba(239,68,68,0.2);
          border-left: 4px solid #ef4444;
          border-radius: 12px;
          padding: 14px 18px;
          margin-bottom: 28px;
          font-size: 13px;
          color: #c0392b;
        }
        .ep-alert strong { font-weight: 700; }

        /* summary */
        .ep-summary {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
          margin-bottom: 28px;
        }
        .ep-sum-card {
          background: #fff;
          border: 1px solid rgba(9,71,128,0.08);
          border-radius: 14px;
          padding: 18px 20px;
          display: flex;
          align-items: center;
          gap: 14px;
          box-shadow: 0 2px 10px rgba(9,71,128,0.05);
          position: relative;
          overflow: hidden;
        }
        .ep-sum-card::after {
          content: '';
          position: absolute;
          bottom: 0; left: 0; right: 0;
          height: 3px;
          border-radius: 0 0 14px 14px;
        }
        .ep-sum-icon {
          width: 40px; height: 40px;
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .ep-sum-val {
          font-family: 'Syne', sans-serif;
          font-size: 24px;
          font-weight: 800;
          color: #0d1e33;
          line-height: 1;
        }
        .ep-sum-lbl {
          font-size: 11px;
          color: #8896ab;
          font-weight: 500;
          margin-top: 3px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        /* toolbar */
        .ep-toolbar {
          display: flex;
          gap: 12px;
          margin-bottom: 20px;
          flex-wrap: wrap;
          align-items: center;
        }
        .ep-search {
          flex: 1;
          min-width: 220px;
          position: relative;
        }
        .ep-search input {
          width: 100%;
          height: 40px;
          border: 1px solid rgba(9,71,128,0.12);
          border-radius: 10px;
          padding: 0 14px 0 38px;
          font-size: 13px;
          font-family: 'DM Sans', sans-serif;
          color: #1a2535;
          background: #fff;
          outline: none;
          transition: border-color 0.2s;
        }
        .ep-search input:focus { border-color: #094780; }
        .ep-search svg { position: absolute; left: 11px; top: 50%; transform: translateY(-50%); color: #8896ab; }

        .ep-filter-group { display: flex; gap: 6px; }
        .ep-filter-label {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #8896ab;
          display: flex;
          align-items: center;
          margin-right: 2px;
        }
        .ep-filter-btn {
          height: 36px;
          padding: 0 12px;
          border-radius: 8px;
          border: 1px solid rgba(9,71,128,0.12);
          background: #fff;
          font-size: 12px;
          font-weight: 600;
          color: #6b7a90;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          transition: all 0.15s ease;
        }
        .ep-filter-btn:hover { border-color: #094780; color: #094780; }
        .ep-filter-btn.active { background: #094780; border-color: #094780; color: #fff; }

        /* card grid */
        .ep-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 16px;
        }

        .ep-card {
          background: #fff;
          border: 1px solid rgba(9,71,128,0.08);
          border-radius: 16px;
          padding: 22px 22px 18px;
          box-shadow: 0 2px 12px rgba(9,71,128,0.05);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          position: relative;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          gap: 0;
          cursor: default;
        }
        .ep-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 36px rgba(9,71,128,0.1);
        }
        .ep-card-stripe {
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 3px;
          border-radius: 16px 16px 0 0;
        }

        .ep-card-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 14px;
        }
        .ep-card-id {
          font-family: 'Syne', sans-serif;
          font-size: 11px;
          font-weight: 700;
          color: #8896ab;
          letter-spacing: 0.5px;
        }
        .ep-prior-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 9px;
          border-radius: 100px;
          font-size: 10.5px;
          font-weight: 700;
        }

        .ep-card-name {
          font-family: 'Syne', sans-serif;
          font-size: 14px;
          font-weight: 700;
          color: #0d1e33;
          line-height: 1.3;
          margin-bottom: 4px;
        }
        .ep-card-tipo {
          font-size: 11px;
          color: #8896ab;
          margin-bottom: 14px;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .ep-card-meta {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-bottom: 18px;
          padding: 12px 14px;
          background: #f8fafc;
          border-radius: 10px;
        }
        .ep-card-meta-row {
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 12px;
          color: #6b7a90;
        }

        .ep-card-venc {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 14px;
          border-top: 1px solid rgba(9,71,128,0.06);
        }
        .ep-venc-label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #8896ab; }
        .ep-venc-date { font-size: 13px; font-weight: 600; color: #1a2535; margin-top: 2px; }
        .ep-venc-atraso {
          font-size: 11px;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 6px;
        }

        .ep-btn-inspecionar {
          width: 100%;
          margin-top: 14px;
          height: 38px;
          border-radius: 10px;
          border: none;
          background: linear-gradient(135deg, #094780, #1a6ab5);
          color: #fff;
          font-size: 12px;
          font-weight: 700;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          letter-spacing: 0.3px;
          box-shadow: 0 4px 14px rgba(9,71,128,0.25);
          transition: opacity 0.15s ease, transform 0.15s ease;
        }
        .ep-btn-inspecionar:hover { opacity: 0.9; transform: translateY(-1px); }

        .ep-empty {
          grid-column: 1 / -1;
          padding: 64px;
          text-align: center;
          color: #8896ab;
          font-size: 13px;
        }

        @keyframes epFadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .ep-wrap { animation: epFadeUp 0.4s ease forwards; }
        .ep-card { opacity: 0; animation: epFadeUp 0.4s ease forwards; }
        .ep-card:nth-child(1) { animation-delay: 0.05s; }
        .ep-card:nth-child(2) { animation-delay: 0.1s; }
        .ep-card:nth-child(3) { animation-delay: 0.15s; }
        .ep-card:nth-child(4) { animation-delay: 0.2s; }
        .ep-card:nth-child(5) { animation-delay: 0.25s; }
        .ep-card:nth-child(6) { animation-delay: 0.3s; }
        .ep-card:nth-child(7) { animation-delay: 0.35s; }
      `}</style>

      <div className="ep-wrap">
        {/* Alert */}
        <div className="ep-alert">
          <Flame size={18} color="#ef4444" />
          <span><strong>2 equipamentos críticos</strong> com vencimento de inspeção ultrapassado — ação imediata necessária.</span>
        </div>

        {/* Summary */}
        <div className="ep-summary">
          {[
            { label: 'Total pendente', val: EQUIPAMENTOS.length, color: '#094780', bg: 'rgba(9,71,128,0.1)', bar: '#094780', icon: PackageSearch },
            { label: 'Crítico', val: countBy('critico'), color: '#ef4444', bg: 'rgba(239,68,68,0.1)', bar: '#ef4444', icon: Flame },
            { label: 'Alto', val: countBy('alto'), color: '#E67A0E', bg: 'rgba(230,122,14,0.1)', bar: '#E67A0E', icon: AlertTriangle },
            { label: 'Médio / Baixo', val: countBy('medio') + countBy('baixo'), color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', bar: '#f59e0b', icon: Clock },
          ].map((s) => {
            const Icon = s.icon
            return (
              <div className="ep-sum-card" key={s.label} style={{ '--bar': s.bar } as any}>
                <div className="ep-sum-icon" style={{ background: s.bg }}>
                  <Icon size={18} color={s.color} strokeWidth={2} />
                </div>
                <div>
                  <div className="ep-sum-val" style={{ color: s.color }}>{s.val}</div>
                  <div className="ep-sum-lbl">{s.label}</div>
                </div>
                <style>{`.ep-sum-card:nth-child(${['Total pendente','Crítico','Alto','Médio / Baixo'].indexOf(s.label) + 1})::after { background: ${s.bar}; }`}</style>
              </div>
            )
          })}
        </div>

        {/* Toolbar */}
        <div className="ep-toolbar">
          <div className="ep-search">
            <Search size={15} />
            <input
              placeholder="Buscar por ID, nome ou localização…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="ep-filter-group">
            <span className="ep-filter-label">Tipo:</span>
            {TIPOS.map((t) => (
              <button
                key={t}
                className={`ep-filter-btn${tipoFilter === t ? ' active' : ''}`}
                onClick={() => setTipoFilter(t)}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="ep-filter-group">
            <span className="ep-filter-label">Prior:</span>
            {PRIORS.map((p) => (
              <button
                key={p}
                className={`ep-filter-btn${priorFilter === p ? ' active' : ''}`}
                onClick={() => setPriorFilter(p)}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Cards */}
        <div className="ep-grid">
          {filtered.length === 0 ? (
            <div className="ep-empty">Nenhum equipamento encontrado.</div>
          ) : filtered.map((eq) => {
            const p = PRIORIDADE_CONFIG[eq.prioridade as keyof typeof PRIORIDADE_CONFIG]
            const PIcon = p.icon
            const atrasado = eq.diasAtraso > 0
            const vencDate = new Date(eq.vencimento).toLocaleDateString('pt-BR')
            return (
              <div className="ep-card" key={eq.id}>
                <div className="ep-card-stripe" style={{ background: p.color }} />

                <div className="ep-card-top">
                  <span className="ep-card-id">{eq.id}</span>
                  <span className="ep-prior-badge" style={{ background: p.bg, color: p.color }}>
                    <PIcon size={10} strokeWidth={2.5} />
                    {p.label}
                  </span>
                </div>

                <div className="ep-card-name">{eq.nome}</div>
                <div className="ep-card-tipo">
                  <Tag size={11} />
                  {eq.tipo}
                </div>

                <div className="ep-card-meta">
                  <div className="ep-card-meta-row">
                    <MapPin size={12} color="#094780" />
                    {eq.local}
                  </div>
                  <div className="ep-card-meta-row">
                    <MapPin size={12} color="#8896ab" />
                    Regional {eq.regional}
                  </div>
                </div>

                <div className="ep-card-venc">
                  <div>
                    <div className="ep-venc-label">Vencimento</div>
                    <div className="ep-venc-date" style={{ color: atrasado ? '#ef4444' : '#1a2535' }}>
                      {vencDate}
                    </div>
                  </div>
                  <span
                    className="ep-venc-atraso"
                    style={{
                      background: atrasado ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,89,0.1)',
                      color: atrasado ? '#ef4444' : '#10b959',
                    }}
                  >
                    {atrasado
                      ? `${eq.diasAtraso}d atrasado`
                      : `${Math.abs(eq.diasAtraso)}d restantes`}
                  </span>
                </div>

                <button
                  className="ep-btn-inspecionar"
                  onClick={() => router.push(`/inspecao/nova?eq=${eq.id}`)}
                >
                  <ClipboardList size={14} />
                  Realizar Inspeção
                  <ChevronRight size={13} />
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </DashboardLayout>
  )
}