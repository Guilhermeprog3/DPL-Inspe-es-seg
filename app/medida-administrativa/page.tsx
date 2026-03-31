'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { MedidaLayout } from '@/components/layout/MedidasLayout'
import {
  ShieldAlert, PlusCircle, List, Clock,
  BarChart2, FileWarning, Search, ArrowRight,
  AlertOctagon, CheckCircle2, TrendingUp,
} from 'lucide-react'

const actions = [
  {
    icon: PlusCircle,
    color: '#094780',
    colorLight: 'rgba(9,71,128,0.07)',
    title: 'Nova Medida',
    description: 'Registre uma nova advertência, suspensão, treinamento ou conversa pedagógica.',
    cta: 'Registrar medida',
    href: '/medida-administrativa/nova',
  },
  {
    icon: List,
    color: '#10b981',
    colorLight: 'rgba(16,185,129,0.07)',
    title: 'Lista de Medidas',
    description: 'Consulte o histórico de medidas aplicadas, filtre por colaborador, tipo ou data.',
    cta: 'Ver todas',
    href: '/medida-administrativa/lista',
  },
  {
    icon: Clock,
    color: '#f59e0b',
    colorLight: 'rgba(245,158,11,0.07)',
    title: 'Pendentes / Em Aberto',
    description: 'Visualize medidas que ainda não foram concluídas ou aguardam providências.',
    cta: 'Ver pendentes',
    href: '/medida-administrativa/pendentes',
    badge: '4 pendentes',
  },
  {
    icon: BarChart2,
    color: '#6366f1',
    colorLight: 'rgba(99,102,241,0.07)',
    title: 'Relatório Geral',
    description: 'Acompanhe indicadores, frequência de ocorrências e evolução por período.',
    cta: 'Ver relatório',
    href: '/medida-administrativa/relatorios',
  },
  {
    icon: FileWarning,
    color: '#ef4444',
    colorLight: 'rgba(239,68,68,0.07)',
    title: 'Por Colaborador',
    description: 'Consulte o histórico individual de medidas por matrícula ou nome do colaborador.',
    cta: 'Consultar',
    href: '/medida-administrativa/colaborador',
  },
]

const kpis = [
  { icon: AlertOctagon, label: 'Total do Mês', value: '18', sub: '+3 vs mês anterior', color: '#094780', bg: 'rgba(9,71,128,0.06)' },
  { icon: Clock,        label: 'Pendentes',     value: '4',  sub: 'Aguardando ação',   color: '#f59e0b', bg: 'rgba(245,158,11,0.06)' },
  { icon: CheckCircle2, label: 'Concluídas',    value: '14', sub: 'Este mês',          color: '#10b981', bg: 'rgba(16,185,129,0.06)' },
  { icon: TrendingUp,   label: 'Suspensões',    value: '2',  sub: 'Últimos 30 dias',   color: '#ef4444', bg: 'rgba(239,68,68,0.06)' },
]

export default function MedidaDashboardPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')

  const filtered = actions.filter(a =>
    a.title.toLowerCase().includes(search.toLowerCase()) ||
    a.description.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <MedidaLayout title="Dashboard" breadcrumb="SIGS / Medida Administrativa / PI · Metropolitana">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Syne:wght@700;800&display=swap');

        .md-wrap {
          font-family: 'DM Sans', sans-serif;
          background: #fff;
          min-height: calc(100vh - 60px);
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 52px 40px 80px;
          position: relative;
          overflow: hidden;
        }

        .md-ring { position: absolute; border-radius: 50%; pointer-events: none; }
        .md-ring-1 { width: 500px; height: 500px; top: -180px; right: -180px; border: 1px solid rgba(9,71,128,0.05); }
        .md-ring-2 { width: 320px; height: 320px; top: -110px; right: -110px; border: 1px solid rgba(9,71,128,0.04); }
        .md-ring-3 { width: 420px; height: 420px; bottom: -200px; left: -180px; border: 1px solid rgba(230,122,14,0.04); }

        /* KPI */
        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          width: 100%;
          max-width: 960px;
          margin-bottom: 44px;
        }
        @media (max-width: 900px) { .kpi-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 480px) { .kpi-grid { grid-template-columns: 1fr; } }

        .kpi-card {
          background: #fff;
          border: 1px solid #eef0f4;
          border-radius: 18px;
          padding: 20px 22px;
          display: flex;
          align-items: center;
          gap: 14px;
          box-shadow: 0 2px 12px rgba(9,71,128,0.04);
          transition: box-shadow 0.2s, transform 0.2s;
        }
        .kpi-card:hover { box-shadow: 0 8px 28px rgba(9,71,128,0.09); transform: translateY(-2px); }
        .kpi-icon  { width: 44px; height: 44px; border-radius: 13px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .kpi-value { font-family: 'Syne', sans-serif; font-size: 26px; font-weight: 800; color: #0d1e33; line-height: 1; }
        .kpi-label { font-size: 11px; color: #8896ab; font-weight: 500; margin-top: 3px; }
        .kpi-sub   { font-size: 10px; color: #b0bac8; font-weight: 500; margin-top: 3px; }

        /* Search */
        .search-wrap {
          position: relative;
          width: 100%;
          max-width: 520px;
          margin-bottom: 40px;
        }
        .search-icon { position: absolute; left: 16px; top: 50%; transform: translateY(-50%); color: #8896ab; pointer-events: none; display: flex; align-items: center; }
        .search-input {
          width: 100%; padding: 13px 20px 13px 48px;
          background: #fff; border: 1px solid rgba(9,71,128,0.1);
          border-radius: 12px; font-family: 'DM Sans', sans-serif;
          font-size: 14px; color: #0d1e33;
          box-shadow: 0 4px 20px rgba(9,71,128,0.04);
          transition: all 0.2s ease; outline: none;
        }
        .search-input::placeholder { color: #b0bac8; }
        .search-input:focus {
          border-color: rgba(9,71,128,0.35);
          box-shadow: 0 0 0 3px rgba(9,71,128,0.08), 0 4px 20px rgba(9,71,128,0.06);
        }

        /* Action grid — 5 colunas com min largura decente */
        .ac-grid {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 220px));
          gap: 18px;
          width: 100%;
          justify-content: center;
        }
        @media (max-width: 1180px) { .ac-grid { grid-template-columns: repeat(3, minmax(0, 240px)); } }
        @media (max-width: 780px)  { .ac-grid { grid-template-columns: repeat(2, minmax(0, 280px)); } }
        @media (max-width: 520px)  { .ac-grid { grid-template-columns: minmax(0, 320px); } }

        /* Action card */
        .ac-card {
          background: #fff;
          border: 1px solid #eef0f4;
          border-radius: 20px;
          padding: 26px 22px 22px;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          position: relative;
          overflow: hidden;
          box-shadow: 0 2px 16px rgba(9,71,128,0.05);
          transition: transform 0.22s, box-shadow 0.22s, border-color 0.2s;
          text-align: left;
          opacity: 0;
          animation: mdFadeUp 0.4s ease forwards;
        }
        .ac-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 16px 40px rgba(9,71,128,0.11);
          border-color: rgba(9,71,128,0.12);
        }
        .ac-bar {
          position: absolute; top: 0; left: 0; right: 0; height: 3px;
          transform: scaleX(0); transform-origin: left;
          transition: transform 0.3s ease; border-radius: 20px 20px 0 0;
        }
        .ac-card:hover .ac-bar { transform: scaleX(1); }
        .ac-bg {
          position: absolute; top: -36px; right: -36px;
          width: 120px; height: 120px; border-radius: 50%;
          opacity: 0.5; pointer-events: none; transition: transform 0.3s;
        }
        .ac-card:hover .ac-bg { transform: scale(1.15); }

        .ac-icon   { width: 48px; height: 48px; border-radius: 14px; display: flex; align-items: center; justify-content: center; margin-bottom: 18px; box-shadow: 0 4px 14px rgba(0,0,0,0.12); position: relative; flex-shrink: 0; }
        .ac-badge  { display: inline-flex; align-items: center; gap: 5px; font-size: 10px; font-weight: 700; padding: 3px 10px; border-radius: 100px; margin-bottom: 10px; align-self: flex-start; }
        .badge-dot { width: 5px; height: 5px; border-radius: 50%; animation: mdPulse 1.8s infinite; }
        .ac-title  { font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 700; color: #0d1e33; margin-bottom: 8px; line-height: 1.3; }
        .ac-desc   { font-size: 12px; color: #8896ab; line-height: 1.65; flex: 1; margin-bottom: 22px; }
        .ac-cta    { display: flex; align-items: center; gap: 7px; font-size: 12px; font-weight: 600; background: none; border: none; cursor: pointer; padding: 0; font-family: 'DM Sans', sans-serif; transition: gap 0.18s; }
        .ac-card:hover .ac-cta { gap: 11px; }
        .ac-line   { height: 1.5px; width: 18px; transition: width 0.2s; border-radius: 2px; }
        .ac-card:hover .ac-line { width: 28px; }

        .ac-card:nth-child(1) { animation-delay: 0.08s; }
        .ac-card:nth-child(2) { animation-delay: 0.13s; }
        .ac-card:nth-child(3) { animation-delay: 0.18s; }
        .ac-card:nth-child(4) { animation-delay: 0.23s; }
        .ac-card:nth-child(5) { animation-delay: 0.28s; }

        .no-results { grid-column: 1/-1; text-align: center; padding: 48px 20px; color: #8896ab; font-size: 14px; }
        .no-results strong { display: block; font-size: 15px; font-weight: 600; color: #4a5568; margin-bottom: 6px; }

        @keyframes mdFadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes mdPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.7); }
        }

        .anim-0 { animation: mdFadeUp 0.4s ease forwards; }
        .anim-1 { animation: mdFadeUp 0.4s 0.05s ease both; }
        .anim-2 { animation: mdFadeUp 0.4s 0.1s ease both; opacity: 0; }
      `}</style>

      <div className="md-wrap">
        <div className="md-ring md-ring-1" />
        <div className="md-ring md-ring-2" />
        <div className="md-ring md-ring-3" />

        {/* Header */}
        <div className="anim-0 flex flex-col items-center mb-8">
          <div className="flex items-center gap-2 mb-5 px-4 py-2 rounded-full bg-white border border-[#eef0f4] shadow-sm">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#094780,#1a6ab5)' }}>
              <ShieldAlert size={14} className="text-white" />
            </div>
            <span style={{ fontFamily: "'Syne', sans-serif" }}
              className="text-[13px] font-black text-[#094780] tracking-widest uppercase">SESMT</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(230,122,14,0.1)', color: '#E67A0E' }}>v1.0</span>
          </div>
          <h1 style={{ fontFamily: "'Syne', sans-serif" }}
            className="text-[22px] sm:text-[26px] font-black text-[#0d1e33] text-center tracking-tight mb-1">
            Medidas Administrativas
          </h1>
          <p className="text-[13px] text-[#8896ab] text-center">PI · Regional Metropolitana</p>
        </div>

        {/* KPIs */}
        <div className="kpi-grid anim-1">
          {kpis.map((k, i) => {
            const Icon = k.icon
            return (
              <div key={i} className="kpi-card">
                <div className="kpi-icon" style={{ background: k.bg }}>
                  <Icon size={20} style={{ color: k.color }} />
                </div>
                <div>
                  <p className="kpi-value">{k.value}</p>
                  <p className="kpi-label">{k.label}</p>
                  <p className="kpi-sub">{k.sub}</p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Search */}
        <div className="search-wrap anim-2">
          <span className="search-icon"><Search size={16} /></span>
          <input className="search-input" type="text"
            placeholder="Buscar módulo ou funcionalidade..."
            value={search} onChange={e => setSearch(e.target.value)} autoComplete="off" />
        </div>

        {/* Cards */}
        <div className="ac-grid">
          {filtered.length > 0 ? filtered.map((a) => {
            const Icon = a.icon
            return (
              <div key={a.href} className="ac-card"
                onClick={() => router.push(a.href)}
                role="button" tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && router.push(a.href)}>
                <div className="ac-bar" style={{ background: `linear-gradient(90deg,${a.color},${a.color}88)` }} />
                <div className="ac-bg"  style={{ background: `radial-gradient(circle,${a.colorLight} 0%,transparent 70%)` }} />
                <div className="ac-icon" style={{ background: `linear-gradient(135deg,${a.color} 0%,${a.color}cc 100%)` }}>
                  <Icon size={22} color="#fff" strokeWidth={1.8} />
                </div>
                {a.badge && (
                  <div className="ac-badge" style={{ background: a.colorLight, color: a.color }}>
                    <span className="badge-dot" style={{ background: a.color }} />
                    {a.badge}
                  </div>
                )}
                <p className="ac-title">{a.title}</p>
                <p className="ac-desc">{a.description}</p>
                <button className="ac-cta" style={{ color: a.color }}>
                  <span className="ac-line" style={{ background: a.color }} />
                  {a.cta}
                  <ArrowRight size={13} />
                </button>
              </div>
            )
          }) : (
            <div className="no-results">
              <strong>Nenhum resultado encontrado</strong>
              Tente buscar por outro termo.
            </div>
          )}
        </div>
      </div>
    </MedidaLayout>
  )
}