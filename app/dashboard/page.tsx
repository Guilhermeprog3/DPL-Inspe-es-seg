'use client'
import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useRouter } from 'next/navigation'
import { ClipboardList, ListChecks, Boxes, ArrowRight, Search, QrCode } from 'lucide-react'

const actions = [
  {
    icon: ClipboardList,
    color: '#094780',
    colorLight: 'rgba(9,71,128,0.08)',
    title: 'Realizar Inspeção',
    description: 'Inicie uma nova inspeção de equipamentos, registre executores e não-conformidades.',
    cta: 'Nova inspeção',
    href: '/inspecao/nova',
  },
  {
    icon: ListChecks,
    color: '#10b959',
    colorLight: 'rgba(16,185,89,0.08)',
    title: 'Lista de Inspeções',
    description: 'Consulte o histórico de inspeções realizadas, filtre por status, inspetor ou regional.',
    cta: 'Ver inspeções',
    href: '/inspecao/lista',
  },
  {
    icon: QrCode,
    color: '#E67A0E',
    colorLight: 'rgba(230,122,14,0.08)',
    title: 'Gerar QR Code',
    description: 'Gere e imprima QR Codes para equipamentos cadastrados e fixe nos pontos de inspeção.',
    cta: 'Gerar QR Code',
    href: '/equipamentos/qrcode',
  },
  {
    icon: Boxes,
    color: '#7c3aed',
    colorLight: 'rgba(124,58,237,0.08)',
    title: 'Lista de Equipamentos',
    description: 'Consulte todos os equipamentos cadastrados, seus tipos, localizações e situação atual.',
    cta: 'Ver equipamentos',
    href: '/equipamentos',
  },
]

export default function DashboardPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')

  const filteredActions = actions.filter(action =>
    action.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    action.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <DashboardLayout
      title="Dashboard"
      breadcrumb="SIGS / Dashboard / PI · Metropolitana"
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Syne:wght@700;800&display=swap');

        .db-wrap {
          font-family: 'DM Sans', sans-serif;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 56px 24px 80px;
          min-height: calc(100vh - 64px);
          position: relative;
        }

        .db-ring {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
        }
        .db-ring-1 { width: 480px; height: 480px; top: -160px; right: -160px; border: 1px solid rgba(9,71,128,0.06); }
        .db-ring-2 { width: 320px; height: 320px; top: -100px; right: -100px; border: 1px solid rgba(9,71,128,0.05); }
        .db-ring-3 { width: 400px; height: 400px; bottom: -180px; left: -180px; border: 1px solid rgba(230,122,14,0.05); }

        .db-logo-wrap {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 32px;
          animation: dbFadeUp 0.5s ease forwards;
        }
        .db-logo-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #fff;
          border: 1px solid rgba(9,71,128,0.1);
          border-radius: 100px;
          padding: 6px 16px 6px 8px;
          box-shadow: 0 2px 12px rgba(9,71,128,0.07);
          margin-bottom: 20px;
        }
        .db-logo-icon {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: linear-gradient(135deg, #094780, #1a6ab5);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .db-logo-badge span {
          font-family: 'Syne', sans-serif;
          font-size: 13px;
          font-weight: 800;
          color: #094780;
          letter-spacing: 2px;
        }
        .db-version {
          font-size: 10px;
          font-weight: 700;
          background: rgba(230,122,14,0.12);
          color: #E67A0E;
          padding: 2px 7px;
          border-radius: 100px;
        }
        .db-headline {
          font-family: 'Syne', sans-serif;
          font-size: 22px;
          font-weight: 800;
          color: #0d1e33;
          text-align: center;
          letter-spacing: -0.3px;
        }
        .db-subline {
          font-size: 13px;
          color: #8896ab;
          margin-top: 6px;
          text-align: center;
        }

        .search-container {
          width: 100%;
          max-width: 500px;
          margin: 0 auto 40px;
          position: relative;
          animation: dbFadeUp 0.5s ease forwards;
          animation-delay: 0.08s;
          opacity: 0;
        }
        .search-input {
          width: 100%;
          padding: 13px 20px 13px 48px;
          background: #fff;
          border: 1px solid rgba(9,71,128,0.1);
          border-radius: 12px;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          color: #0d1e33;
          box-shadow: 0 4px 20px rgba(9,71,128,0.04);
          transition: all 0.2s ease;
        }
        .search-input::placeholder { color: #b0bac8; }
        .search-input:focus {
          outline: none;
          border-color: rgba(9,71,128,0.35);
          box-shadow: 0 0 0 3px rgba(9,71,128,0.08), 0 4px 20px rgba(9,71,128,0.06);
        }
        .search-icon {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          color: #8896ab;
          pointer-events: none;
          display: flex;
          align-items: center;
        }

        .db-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          width: 100%;
          max-width: 1100px;
        }

        .db-card {
          background: #fff;
          border-radius: 18px;
          border: 1px solid rgba(9,71,128,0.08);
          padding: 24px 20px 20px;
          display: flex;
          flex-direction: column;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          box-shadow: 0 2px 16px rgba(9,71,128,0.06);
          transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.2s ease;
          text-align: left;
          opacity: 0;
          animation: dbFadeUp 0.45s ease forwards;
        }
        .db-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 18px 48px rgba(9,71,128,0.12);
          border-color: rgba(9,71,128,0.13);
        }

        .db-card-bar {
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 3px;
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.3s ease;
          border-radius: 18px 18px 0 0;
        }
        .db-card:hover .db-card-bar { transform: scaleX(1); }

        .db-card-bg {
          position: absolute;
          top: -40px; right: -40px;
          width: 130px; height: 130px;
          border-radius: 50%;
          opacity: 0.5;
          pointer-events: none;
          transition: transform 0.3s ease;
        }
        .db-card:hover .db-card-bg { transform: scale(1.15); }

        .db-card-icon {
          width: 48px;
          height: 48px;
          border-radius: 13px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 18px;
          position: relative;
          box-shadow: 0 4px 14px rgba(0,0,0,0.12);
        }

        .db-card-title {
          font-family: 'Syne', sans-serif;
          font-size: 15px;
          font-weight: 700;
          color: #0d1e33;
          line-height: 1.25;
          margin-bottom: 8px;
        }
        .db-card-desc {
          font-size: 12px;
          color: #8896ab;
          line-height: 1.6;
          flex: 1;
          margin-bottom: 22px;
        }
        .db-card-cta {
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 12px;
          font-weight: 600;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
          font-family: 'DM Sans', sans-serif;
          transition: gap 0.18s ease;
        }
        .db-card:hover .db-card-cta { gap: 12px; }
        .db-card-cta-line {
          height: 1.5px;
          width: 18px;
          transition: width 0.2s ease;
          border-radius: 2px;
        }
        .db-card:hover .db-card-cta-line { width: 28px; }

        .no-results {
          grid-column: 1 / -1;
          text-align: center;
          padding: 48px 20px;
          color: #8896ab;
          font-size: 14px;
          line-height: 1.6;
        }
        .no-results strong {
          display: block;
          font-size: 15px;
          font-weight: 600;
          color: #4a5568;
          margin-bottom: 6px;
        }

        @keyframes dbFadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 960px) {
          .db-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 560px) {
          .db-grid { grid-template-columns: 1fr; max-width: 420px; }
        }
      `}</style>

      <div className="db-wrap">
        <div className="db-ring db-ring-1" />
        <div className="db-ring db-ring-2" />
        <div className="db-ring db-ring-3" />

        <div className="db-logo-wrap">
          <div className="db-logo-badge">
            <div className="db-logo-icon">
              <ClipboardList size={16} color="#fff" strokeWidth={2} />
            </div>
            <span>SIGS</span>
            <span className="db-version">v2.0</span>
          </div>
          <h1 className="db-headline">Inspeção de Equipamentos de Segurança</h1>
          <p className="db-subline">PI · Regional Metropolitana</p>
        </div>

        <div className="search-container">
          <span className="search-icon">
            <Search size={16} />
          </span>
          <input
            type="text"
            className="search-input"
            placeholder="Buscar módulo ou funcionalidade..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoComplete="off"
          />
        </div>

        <div className="db-grid">
          {filteredActions.length > 0 ? (
            filteredActions.map((a, index) => {
              const Icon = a.icon
              return (
                <div
                  key={a.href}
                  className="db-card"
                  style={{ animationDelay: `${0.1 + index * 0.05}s` }}
                  onClick={() => router.push(a.href)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && router.push(a.href)}
                >
                  <div
                    className="db-card-bar"
                    style={{ background: `linear-gradient(90deg, ${a.color}, ${a.color}88)` }}
                  />
                  <div
                    className="db-card-bg"
                    style={{ background: `radial-gradient(circle, ${a.colorLight} 0%, transparent 70%)` }}
                  />
                  <div
                    className="db-card-icon"
                    style={{ background: `linear-gradient(135deg, ${a.color} 0%, ${a.color}cc 100%)` }}
                  >
                    <Icon size={22} color="#fff" strokeWidth={1.8} />
                  </div>

                  <p className="db-card-title">{a.title}</p>
                  <p className="db-card-desc">{a.description}</p>

                  <button className="db-card-cta" style={{ color: a.color }}>
                    <span className="db-card-cta-line" style={{ background: a.color }} />
                    {a.cta}
                    <ArrowRight size={13} />
                  </button>
                </div>
              )
            })
          ) : (
            <div className="no-results">
              <strong>Nenhum resultado encontrado</strong>
              Tente buscar por outro termo.
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}