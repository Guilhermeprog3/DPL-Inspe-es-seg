'use client'
import { useSession } from 'next-auth/react'
import { Menu } from 'lucide-react'

interface MedidaTopbarProps {
  title: string
  breadcrumb?: string
  sidebarExpanded: boolean
  onToggleSidebar: () => void
}

export function MedidaTopbar({ title, breadcrumb, sidebarExpanded, onToggleSidebar }: MedidaTopbarProps) {
  const { data: session } = useSession()
  
  // Dados vindos diretamente da raiz de session.user conforme seu route.ts
  const user = session?.user as any

  return (
    <header className="bg-white border-b border-[#e8edf3] px-5 h-[60px] flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center gap-3">
        {!sidebarExpanded && (
          <button onClick={onToggleSidebar}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-[#6b7a90] hover:bg-[#f0f3f8] hover:text-[#1a2535] transition-colors shrink-0">
            <Menu size={18} />
          </button>
        )}
        {!sidebarExpanded && <div className="w-px h-5 bg-[#e8edf3]" />}
        <div>
          <h1 className="text-[17px] font-semibold text-[#1a2535] leading-tight">{title}</h1>
          {breadcrumb && <p className="text-xs text-[#8896ab] mt-0.5">{breadcrumb}</p>}
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Exibição da Localização/Regional */}
        <span className="text-[11px] font-bold text-[#8896ab] uppercase tracking-wider hidden sm:block">
          {user?.uf ?? '--'} · {user?.regional ?? 'Sem Regional'}
        </span>

        {/* Área do Perfil */}
        <div className="flex items-center gap-2.5 pl-4 border-l border-[#e8edf3]">
          <div className="text-right hidden md:block">
            <p className="text-[11px] font-bold text-[#1a2535] leading-none">
              {user?.nome ?? 'Usuário'}
            </p>
            <p className="text-[9px] text-[#8896ab] font-medium mt-1 uppercase tracking-tighter">
              {user?.role?.replace('_', ' ') ?? 'Perfil'}
            </p>
          </div>
          
          {/* Avatar com Inicial dinâmica */}
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#E67A0E] to-[#ff9d3d] flex items-center justify-center text-[12px] font-bold text-white shadow-sm shadow-[#E67A0E]/20 ring-2 ring-white">
            {(user?.nome ?? 'U').charAt(0).toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  )
}