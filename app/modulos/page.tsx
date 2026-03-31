'use client'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { ClipboardList, LogOut, ChevronRight, Search, ShieldAlert } from 'lucide-react'
import { useState, useMemo } from 'react'

// Definição dos módulos com as roles que possuem permissão de acesso
const ALL_MODULOS = [
  {
    id: 1,
    icon: <ClipboardList size={26} color="#fff" strokeWidth={1.8} />,
    badge: '3 pendentes',
    title: 'Inspeção de Equipamentos de Segurança',
    subtitle: 'Gerencie inspeções, acompanhe pendências e registre ocorrências.',
    route: '/dashboard',
    roles: ['inspetor', 'admin'], // Permitido para inspetores e administradores
  },
  {
    id: 2,
    icon: <ShieldAlert size={26} color="#fff" strokeWidth={1.8} />,
    badge: 'Recursos Humanos',
    title: 'Medida Administrativa',
    subtitle: 'Registre advertências, suspensões e conversas pedagógicas vinculadas ao colaborador.',
    route: '/medida-administrativa',
    roles: ['agente_cobli', 'admin'], // Permitido para agentes cobli e administradores
  },
]

export default function ModulosPage() {
  const { data: session } = useSession()
  const router = useRouter()
  
  // Mapeamento para acessar os dados aninhados conforme seu log do console
  const userData = (session?.user as any)?.user;
  
  const [search, setSearch] = useState('')

  // Lógica de filtragem baseada em Role e Busca textual
  const filteredModulos = useMemo(() => {
    const userRole = userData?.role?.toLowerCase()

    return ALL_MODULOS.filter((modulo) => {
      // 1. Verifica se o usuário tem a role necessária
      const hasPermission = modulo.roles.includes(userRole)

      // 2. Verifica se o termo de busca bate com o título ou subtítulo
      const matchesSearch =
        modulo.title.toLowerCase().includes(search.toLowerCase()) ||
        modulo.subtitle.toLowerCase().includes(search.toLowerCase())

      return hasPermission && matchesSearch
    })
  }, [userData?.role, search])

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Syne:wght@700;800&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .page {
          min-height: 100vh;
          background: #f0f3f8;
          font-family: 'DM Sans', sans-serif;
          display: flex;
          flex-direction: column;
          position: relative;
          overflow: hidden;
        }

        .page::before {
          content: '';
          position: fixed;
          top: -180px; right: -180px;
          width: 520px; height: 520px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(9,71,128,0.08) 0%, transparent 70%);
          pointer-events: none;
        }
        .page::after {
          content: '';
          position: fixed;
          bottom: -200px; left: -100px;
          width: 480px; height: 480px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(230,122,14,0.07) 0%, transparent 70%);
          pointer-events: none;
        }

        .header {
          background: #fff;
          border-bottom: 1px solid rgba(9,71,128,0.08);
          padding: 0 40px;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: sticky;
          top: 0;
          z-index: 50;
          box-shadow: 0 1px 12px rgba(9,71,128,0.06);
        }

        .logo {
          font-family: 'Syne', sans-serif;
          font-size: 22px;
          font-weight: 800;
          color: #094780;
          letter-spacing: 3px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .logo-dot {
          width: 7px; height: 7px;
          border-radius: 50%;
          background: #E67A0E;
          display: inline-block;
          margin-bottom: 1px;
        }

        .user-area {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .avatar {
          width: 36px; height: 36px;
          border-radius: 10px;
          background: linear-gradient(135deg, #E67A0E, #f4a04a);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 700;
          color: #fff;
          box-shadow: 0 2px 8px rgba(230,122,14,0.35);
          flex-shrink: 0;
        }
        .user-info p:first-child { font-size: 13px; font-weight: 600; color: #1a2535; line-height: 1.2; }
        .user-info p:last-child  { font-size: 11px; color: #8896ab; margin-top: 1px; text-transform: capitalize; }
        .divider-v { width: 1px; height: 28px; background: #e2e8f0; }
        .btn-sair {
          display: flex; align-items: center; gap: 6px;
          padding: 7px 14px;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          background: transparent;
          font-size: 12px; font-weight: 600; color: #8896ab;
          cursor: pointer;
          transition: all 0.18s ease;
          font-family: 'DM Sans', sans-serif;
        }
        .btn-sair:hover { background: #fff8f3; color: #E67A0E; border-color: rgba(230,122,14,0.3); }

        .body {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 60px 24px 80px;
          position: relative;
          z-index: 1;
        }

        .eyebrow {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 10px;
        }
        .eyebrow-line { height: 1px; width: 32px; background: #E67A0E; opacity: 0.6; }
        .eyebrow-text { font-size: 10px; font-weight: 600; letter-spacing: 3px; text-transform: uppercase; color: #E67A0E; }

        .title {
          font-family: 'Syne', sans-serif;
          font-size: 28px; font-weight: 800;
          color: #0d1e33;
          letter-spacing: -0.5px;
          margin-bottom: 32px;
          text-align: center;
        }
        .title span { color: #094780; }

        .search-wrap {
          position: relative;
          width: 100%; max-width: 480px;
          margin-bottom: 40px;
        }
        .search-icon {
          position: absolute; left: 14px; top: 50%;
          transform: translateY(-50%);
          color: #8896ab; pointer-events: none;
          display: flex; align-items: center;
        }
        .search-input {
          width: 100%; height: 44px;
          padding: 0 16px 0 42px;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          background: #fff;
          font-size: 13px; font-family: 'DM Sans', sans-serif; color: #1a2535;
          outline: none;
          box-shadow: 0 2px 10px rgba(9,71,128,0.05);
          transition: border-color 0.18s ease, box-shadow 0.18s ease;
        }
        .search-input::placeholder { color: #b0bac8; }
        .search-input:focus {
          border-color: rgba(9,71,128,0.35);
          box-shadow: 0 0 0 3px rgba(9,71,128,0.08), 0 2px 10px rgba(9,71,128,0.06);
        }

        .cards-grid {
          display: grid;
          grid-template-columns: repeat(2, 340px);
          gap: 20px;
          width: 100%;
          justify-content: center;
        }

        @media (max-width: 740px) {
          .cards-grid {
            grid-template-columns: 1fr;
            max-width: 380px;
          }
        }

        .empty-state {
          text-align: center; padding: 40px 20px;
          color: #8896ab; font-size: 13px; line-height: 1.6;
          grid-column: 1 / -1;
        }
        .empty-state strong {
          display: block; font-size: 15px; font-weight: 600; color: #4a5568; margin-bottom: 6px;
        }

        .card {
          background: #fff;
          border-radius: 20px;
          border: 1px solid rgba(9,71,128,0.08);
          padding: 36px 32px 28px;
          width: 100%;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          box-shadow: 0 4px 24px rgba(9,71,128,0.07);
          transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease;
          position: relative;
          overflow: hidden;
          text-align: left;
        }
        .card::before {
          content: '';
          position: absolute; top: 0; left: 0; right: 0; height: 3px;
          background: linear-gradient(90deg, #094780, #E67A0E);
          transform: scaleX(0); transform-origin: left;
          transition: transform 0.3s ease;
        }
        .card:hover::before { transform: scaleX(1); }
        .card:hover {
          transform: translateY(-5px);
          box-shadow: 0 16px 48px rgba(9,71,128,0.13);
          border-color: rgba(9,71,128,0.14);
        }

        .card-icon-wrap {
          width: 56px; height: 56px;
          border-radius: 14px;
          background: linear-gradient(135deg, #094780 0%, #1a6ab5 100%);
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 6px 18px rgba(9,71,128,0.28);
          margin-bottom: 22px;
          position: relative;
        }
        .card-icon-wrap::after {
          content: ''; position: absolute; inset: 0; border-radius: 14px;
          background: linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 60%);
        }

        .card-badge {
          display: inline-flex; align-items: center; gap: 5px;
          font-size: 10px; font-weight: 700; letter-spacing: 0.5px;
          padding: 4px 10px; border-radius: 100px;
          background: rgba(230,122,14,0.1); color: #E67A0E;
          margin-bottom: 14px;
        }
        .badge-dot {
          width: 5px; height: 5px; border-radius: 50%; background: #E67A0E;
          animation: pulse 1.8s infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.75); }
        }

        .card-title {
          font-family: 'Syne', sans-serif;
          font-size: 16px; font-weight: 700; color: #0d1e33;
          line-height: 1.3; margin-bottom: 6px; letter-spacing: -0.2px;
        }
        .card-subtitle {
          font-size: 12px; color: #8896ab; line-height: 1.5;
          margin-bottom: 28px; flex: 1;
        }

        .card-cta {
          display: flex; align-items: center; gap: 6px;
          font-size: 12px; font-weight: 600; color: #094780;
          transition: gap 0.18s ease;
        }
        .card:hover .card-cta { gap: 10px; }
        .card-cta-line {
          height: 1px; width: 20px; background: #094780;
          transition: width 0.2s ease;
        }
        .card:hover .card-cta-line { width: 32px; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .body > * { animation: fadeUp 0.5s ease forwards; }
        .body > *:nth-child(2) { animation-delay: 0.05s; }
        .body > *:nth-child(3) { animation-delay: 0.12s; }
        .body > *:nth-child(4) { animation-delay: 0.18s; }

        .card { animation: fadeUp 0.45s ease forwards; opacity: 0; }
        .card:nth-child(1) { animation-delay: 0.15s; }
        .card:nth-child(2) { animation-delay: 0.22s; }
        .card:nth-child(3) { animation-delay: 0.29s; }
        .card:nth-child(4) { animation-delay: 0.36s; }
      `}</style>

      <div className="page">
        <header className="header">
          <div className="logo">
            SIGS<span className="logo-dot" />
          </div>
          <div className="user-area">
            {/* Inicial baseada no email do userData */}
            <div className="avatar">
              {userData?.email?.charAt(0).toUpperCase() ?? 'U'}
            </div>
            <div className="user-info">
              {/* Email na parte de cima conforme solicitado */}
              <p>{userData?.email ?? 'carregando...'}</p>
              <p>
                {userData?.role?.replace('_', ' ') ?? 'Acesso restrito'} ·{' '}
                {userData?.uf ?? 'PI'} · {userData?.regional ?? 'Metropolitana'}
              </p>
            </div>
            <div className="divider-v" />
            <button
              className="btn-sair"
              onClick={() => signOut({ callbackUrl: '/login' })}
            >
              <LogOut size={13} />
              Sair
            </button>
          </div>
        </header>

        <main className="body">
          <div className="eyebrow">
            <span className="eyebrow-line" />
            <span className="eyebrow-text">Área de trabalho</span>
            <span className="eyebrow-line" />
          </div>

          <h1 className="title">
            Selecione um <span>módulo</span>
          </h1>

          <div className="search-wrap">
            <span className="search-icon">
              <Search size={15} />
            </span>
            <input
              className="search-input"
              type="text"
              placeholder="Buscar módulo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoComplete="off"
            />
          </div>

          <div className="cards-grid">
            {filteredModulos.length === 0 ? (
              <div className="empty-state">
                <strong>Nenhum módulo encontrado</strong>
                {search
                  ? 'Tente buscar por outro termo.'
                  : 'Seu perfil não possui acesso a módulos nesta regional.'}
              </div>
            ) : (
              filteredModulos.map((modulo) => (
                <button
                  key={modulo.id}
                  className="card"
                  onClick={() => router.push(modulo.route)}
                >
                  <div className="card-icon-wrap">{modulo.icon}</div>
                  <div className="card-badge">
                    <span className="badge-dot" />
                    {modulo.badge}
                  </div>
                  <p className="card-title">{modulo.title}</p>
                  <p className="card-subtitle">{modulo.subtitle}</p>
                  <div className="card-cta">
                    <span className="card-cta-line" />
                    Acessar módulo
                    <ChevronRight size={14} />
                  </div>
                </button>
              ))
            )}
          </div>
        </main>
      </div>
    </>
  )
}