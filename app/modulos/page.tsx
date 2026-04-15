'use client'

import './modulos.css'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { ClipboardList, LogOut, ChevronRight, Search, ShieldAlert } from 'lucide-react'
import { useState, useMemo } from 'react'

const ALL_MODULOS = [
  {
    id: 1,
    icon: <ClipboardList size={26} color="#fff" strokeWidth={1.8} />,
    title: 'Inspeção de Equipamentos de Segurança',
    subtitle: 'Gerencie inspeções de equipamentos de segurança.',
    route: '/dashboard',
    roles: ['inspetor', 'admin'],
  },
  {
    id: 2,
    icon: <ShieldAlert size={26} color="#fff" strokeWidth={1.8} />,
    badge: '',
    title: 'Medida Administrativa',
    subtitle: 'Registre medidas, advertências e suspensões. vinculadas a colaboradores',
    route: '/medida-administrativa',
    roles: ['agente_cobli', 'admin'],
  },
]

export default function ModulosPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const userData = session?.user as any
  const [search, setSearch] = useState('')

  const filteredModulos = useMemo(() => {
    // Normalizamos para lowercase para evitar problemas de "Admin" vs "admin"
    const userRole = userData?.role?.toLowerCase()
    
    return ALL_MODULOS.filter((modulo) => {
      // MODIFICAÇÃO: Se for 'admin', tem permissão automática (true). 
      // Caso contrário, verifica se a role está incluída no array do módulo.
      const hasPermission = userRole === 'admin' || modulo.roles.includes(userRole)

      const matchesSearch =
        modulo.title.toLowerCase().includes(search.toLowerCase()) ||
        modulo.subtitle.toLowerCase().includes(search.toLowerCase())
      
      return hasPermission && matchesSearch
    })
  }, [userData?.role, search])

  return (
    <div className="page">
      <header className="header">
        <div className="logo">
          SIG<span className="logo-dot" />
        </div>
        <div className="user-area">
          <div className="avatar">
            {userData?.email?.charAt(0).toUpperCase() ?? 'U'}
          </div>
          <div className="user-info">
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
  )
}