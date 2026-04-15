'use client'
import { useSession } from 'next-auth/react'
import { Menu } from 'lucide-react'

interface TopbarProps {
  title: string
  breadcrumb?: string
  sidebarExpanded: boolean
  onToggleSidebar: () => void
}

export function Topbar({ title, breadcrumb, sidebarExpanded, onToggleSidebar }: TopbarProps) {
  const { data: session } = useSession()
  
  // O seu route.ts coloca os dados dentro de session.user
  const user = session?.user as any

  // Pega a inicial do nome ou sobrenome para o avatar
  const getInitial = () => {
    if (user?.nome) return user.nome.charAt(0).toUpperCase()
    if (user?.name) return user.name.charAt(0).toUpperCase()
    return 'U'
  }

  return (
    <header className="bg-white border-b border-[#dde3ec] px-5 h-[60px] flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center gap-3">
        {/* Botão Menu — só aparece quando a sidebar está fechada */}
        {!sidebarExpanded && (
          <button
            onClick={onToggleSidebar}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-[#6b7a90] hover:bg-[#f0f3f8] hover:text-[#1a2535] transition-colors shrink-0"
            aria-label="Abrir menu"
          >
            <Menu size={18} />
          </button>
        )}

        {/* Divisor — só aparece quando a sidebar está fechada */}
        {!sidebarExpanded && (
          <div className="w-px h-5 bg-[#dde3ec]" />
        )}

        {/* Título e Contexto */}
        <div>
          <h1 className="text-[17px] font-semibold text-[#1a2535] leading-tight">{title}</h1>
          {breadcrumb && (
            <p className="text-xs text-[#6b7a90] mt-0.5">{breadcrumb}</p>
          )}
        </div>
      </div>

      {/* Lado direito — Identificação do Usuário */}
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex flex-col items-end mr-1">
          <span className="text-[13px] font-bold text-[#1a2535] leading-none">
            {user?.nome ? `${user.nome} ${user.sobrenome ?? ''}` : (user?.name ?? 'Usuário')}
          </span>
          <span className="text-[10px] text-[#6b7a90] font-medium mt-1 uppercase tracking-wider">
            {user?.uf ?? '--'} · {user?.regional ?? 'DPL'}
          </span>
        </div>

        {/* Avatar com a cor padrão do sistema */}
        <div 
          title={user?.email}
          className="w-9 h-9 rounded-full bg-[#E67A0E] flex items-center justify-center text-[13px] font-black text-white shadow-sm border-2 border-white ring-1 ring-slate-100"
        >
          {getInitial()}
        </div>
      </div>
    </header>
  )
}