'use client'
import { useSession } from 'next-auth/react'
import { Bell, Menu } from 'lucide-react'

interface MedidaTopbarProps {
  title: string
  breadcrumb?: string
  sidebarExpanded: boolean
  onToggleSidebar: () => void
}

export function MedidaTopbar({ title, breadcrumb, sidebarExpanded, onToggleSidebar }: MedidaTopbarProps) {
  const { data: session } = useSession()
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

      <div className="flex items-center gap-3">
        <span className="text-xs text-[#8896ab] hidden sm:block">
          {user?.uf ?? 'PI'} · {user?.regional ?? 'Metropolitana'}
        </span>
        <div className="relative">
          <Bell size={18} className="text-[#8896ab]" />
          <span className="absolute -top-1 -right-1 bg-[#E67A0E] text-white text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full">3</span>
        </div>
        <div className="w-8 h-8 rounded-full bg-[#E67A0E] flex items-center justify-center text-[12px] font-bold text-white">
          {user?.name?.charAt(0) ?? 'U'}
        </div>
      </div>
    </header>
  )
}