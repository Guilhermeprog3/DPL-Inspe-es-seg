'use client'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useRouter } from 'next/navigation'
import { ClipboardList, ListChecks, PackageSearch, ArrowRight, Boxes, Flame } from 'lucide-react'

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
    icon: Flame,
    color: '#ef4444',
    colorLight: 'rgba(239,68,68,0.08)',
    title: 'Equipamentos Pendentes',
    description: 'Visualize equipamentos que ainda não foram inspecionados ou com prazo vencido.',
    cta: 'Ver pendentes',
    href: '/equipamentos/pendentes',
    badge: '7 pendentes',
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

        /* decorative rings */
        .db-ring {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
        }
        .db-ring-1 {
          width: 480px; height: 480px;
          top: -160px; right: -160px;
          border: 1px solid rgba(9,71,128,0.06);
        }
        .db-ring-2 {
          width: 320px; height: 320px;
          top: -100px; right: -100px;
          border: 1px solid rgba(9,71,128,0.05);
        }
        .db-ring-3 {
          width: 400px; height: 400px;
          bottom: -180px; left: -180px;
          border: 1px solid rgba(230,122,14,0.05);
        }

        /* logo section */
        .db-logo-wrap {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 56px;
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
          width: 32px; height: 32px;
          border-radius: 8px;
          background: linear-gradient(135deg, #094780, #1a6ab5);
          display: flex; align-items: center; justify-content: center;
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

        /* cards grid */
        .db-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
          width: 100%;
          max-width: 760px;
        }

        .db-card {
          background: #fff;
          border-radius: 18px;
          border: 1px solid rgba(9,71,128,0.08);
          padding: 32px 28px 26px;
          display: flex;
          flex-direction: column;
          gap: 0;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          box-shadow: 0 2px 16px rgba(9,71,128,0.06);
          transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.2s ease;
          text-align: left;
        }
        .db-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 18px 48px rgba(9,71,128,0.12);
          border-color: rgba(9,71,128,0.13);
        }

        /* top accent bar */
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

        /* subtle bg shape */
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
          width: 52px; height: 52px;
          border-radius: 14px;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 22px;
          position: relative;
          flex-shrink: 0;
          box-shadow: 0 4px 14px rgba(0,0,0,0.12);
        }
        .db-card-icon::after {
          content: '';
          position: absolute; inset: 0;
          border-radius: 14px;
          background: linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 60%);
        }

        .db-card-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 10px;
          font-weight: 700;
          padding: 3px 9px;
          border-radius: 100px;
          margin-bottom: 10px;
          align-self: flex-start;
        }
        .db-card-badge-dot {
          width: 5px; height: 5px;
          border-radius: 50%;
          animation: dbPulse 1.8s infinite;
        }
        @keyframes dbPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.7); }
        }

        .db-card-title {
          font-family: 'Syne', sans-serif;
          font-size: 17px;
          font-weight: 700;
          color: #0d1e33;
          line-height: 1.25;
          margin-bottom: 8px;
          letter-spacing: -0.2px;
        }
        .db-card-desc {
          font-size: 12.5px;
          color: #8896ab;
          line-height: 1.6;
          flex: 1;
          margin-bottom: 26px;
        }

        .db-card-cta {
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 12px;
          font-weight: 600;
          text-decoration: none;
          transition: gap 0.18s ease;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
          font-family: 'DM Sans', sans-serif;
        }
        .db-card:hover .db-card-cta { gap: 12px; }

        .db-card-cta-line {
          height: 1.5px;
          width: 18px;
          transition: width 0.2s ease;
          border-radius: 2px;
        }
        .db-card:hover .db-card-cta-line { width: 28px; }

        .db-card-cta svg {
          transition: transform 0.18s ease;
        }
        .db-card:hover .db-card-cta svg { transform: translateX(3px); }

        /* staggered entrance */
        @keyframes dbFadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .db-card { opacity: 0; animation: dbFadeUp 0.45s ease forwards; }
        .db-card:nth-child(1) { animation-delay: 0.15s; }
        .db-card:nth-child(2) { animation-delay: 0.22s; }
        .db-card:nth-child(3) { animation-delay: 0.29s; }
        .db-card:nth-child(4) { animation-delay: 0.36s; }

        @media (max-width: 640px) {
          .db-grid { grid-template-columns: 1fr; max-width: 420px; }
        }
      `}</style>

      <div className="db-wrap">
        {/* Decorative rings */}
        <div className="db-ring db-ring-1" />
        <div className="db-ring db-ring-2" />
        <div className="db-ring db-ring-3" />

        {/* Logo / title */}
        <div className="db-logo-wrap">
          <div className="db-logo-badge">
            <div className="db-logo-icon">
              <ClipboardList size={16} color="#fff" strokeWidth={2} />
            </div>
            <span>SIGS</span>
            <span className="db-version">v2.0</span>
          </div>
          <h1 className="db-headline">Inspeção de Equipamentos de Segurança</h1>
          <p className="db-subline">PI · Regional Metropolitana — selecione uma ação para continuar</p>
        </div>

        {/* Action cards */}
        <div className="db-grid">
          {actions.map((a) => {
            const Icon = a.icon
            return (
              <div
                key={a.href}
                className="db-card"
                onClick={() => router.push(a.href)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && router.push(a.href)}
              >
                {/* top bar */}
                <div
                  className="db-card-bar"
                  style={{ background: `linear-gradient(90deg, ${a.color}, ${a.color}88)` }}
                />

                {/* bg circle */}
                <div
                  className="db-card-bg"
                  style={{ background: `radial-gradient(circle, ${a.colorLight} 0%, transparent 70%)` }}
                />

                {/* icon */}
                <div
                  className="db-card-icon"
                  style={{ background: `linear-gradient(135deg, ${a.color} 0%, ${a.color}cc 100%)` }}
                >
                  <Icon size={24} color="#fff" strokeWidth={1.8} />
                </div>

                {/* badge (optional) */}
                {a.badge && (
                  <div
                    className="db-card-badge"
                    style={{
                      background: `${a.colorLight}`,
                      color: a.color,
                    }}
                  >
                    <span className="db-card-badge-dot" style={{ background: a.color }} />
                    {a.badge}
                  </div>
                )}

                <p className="db-card-title">{a.title}</p>
                <p className="db-card-desc">{a.description}</p>

                {/* CTA */}
                <button
                  className="db-card-cta"
                  style={{ color: a.color }}
                  onClick={(e) => { e.stopPropagation(); router.push(a.href) }}
                >
                  <span className="db-card-cta-line" style={{ background: a.color }} />
                  {a.cta}
                  <ArrowRight size={14} />
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </DashboardLayout>
  )
}