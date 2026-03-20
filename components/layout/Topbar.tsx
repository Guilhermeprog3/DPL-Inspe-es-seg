'use client'
import { useSession } from 'next-auth/react'
import { Bell } from 'lucide-react'

interface TopbarProps {
  title: string
  breadcrumb?: string
}

export function Topbar({ title, breadcrumb }: TopbarProps) {
  const { data: session } = useSession()
  const user = session?.user as any

  return (
    <header className="bg-white border-b border-[#dde3ec] px-7 h-[60px] flex items-center justify-between sticky top-0 z-40">
      <div>
        <h1 className="text-[17px] font-semibold text-[#1a2535]">{title}</h1>
        {breadcrumb && (
          <p className="text-xs text-[#6b7a90] mt-0.5">{breadcrumb}</p>
        )}
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs text-[#6b7a90]">
          {user?.uf ?? 'PI'} · {user?.regional ?? 'Metropolitana'}
        </span>
        <div className="relative">
          <Bell size={18} className="text-[#6b7a90]" />
          <span className="absolute -top-1 -right-1 bg-[#E67A0E] text-white text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
            3
          </span>
        </div>
        <div className="w-8 h-8 rounded-full bg-[#E67A0E] flex items-center justify-center text-[12px] font-bold text-white">
          {user?.name?.charAt(0) ?? 'U'}
        </div>
      </div>
    </header>
  )
}
