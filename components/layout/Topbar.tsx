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
  const user = session?.user as any

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

        {/* Título */}
        <div>
          <h1 className="text-[17px] font-semibold text-[#1a2535] leading-tight">{title}</h1>
          {breadcrumb && (
            <p className="text-xs text-[#6b7a90] mt-0.5">{breadcrumb}</p>
          )}
        </div>
      </div>

      {/* Lado direito */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-[#6b7a90]">
          {user?.uf ?? 'PI'} · {user?.regional ?? 'Metropolitana'}
        </span>

        <div className="w-8 h-8 rounded-full bg-[#E67A0E] flex items-center justify-center text-[12px] font-bold text-white">
          {user?.name?.charAt(0) ?? 'U'}
        </div>
      </div>
    </header>
  )
}