'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { cn } from '@/lib/utils'
import {
  PlusCircle, List, 
  LogOut, Grid2x2, LayoutDashboard
} from 'lucide-react'

const navItems = [
  { section: 'Principal' },
  { label: 'Dashboard', href: '/medida-administrativa', icon: LayoutDashboard },
  { section: 'Gerenciamento' },
  { label: 'Nova Medida', href: '/medida-administrativa/nova', icon: PlusCircle },
  { label: 'Lista de Medidas', href: '/medida-administrativa/lista', icon: List },
]

interface SidebarProps {
  expanded: boolean
  onToggle: () => void
}

export function MedidaSidebar({ expanded, onToggle }: SidebarProps) {
  const pathname = usePathname()
  const { data: session } = useSession()
  
  const user = session?.user as any
  // Laranja padrão da DPL para o estado ativo
  const primaryColor = '#E67A0E'

  return (
    <>
      {expanded && (
        <div className="fixed inset-0 bg-black/30 z-40" onClick={onToggle} />
      )}

      <aside className={cn(
        'fixed h-screen z-50 flex flex-col overflow-hidden transition-all duration-300 ease-in-out',
        'bg-white border-r border-[#dde3ec]', // Fundo branco e borda clara
        expanded ? 'w-[240px]' : 'w-0',
      )}>
        {/* Header */}
        <div className="flex items-center border-b border-[#dde3ec] shrink-0 h-[60px] px-5">
          <div className="overflow-hidden">
            <p className="font-bold text-[20px] tracking-wide whitespace-nowrap text-[#063357]">SIGS</p>
            <p className="text-[10px] text-[#6b7a90] uppercase tracking-[2px] mt-0.5 whitespace-nowrap">
              Segurança do Trabalho
            </p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 overflow-y-auto overflow-x-hidden">
          {navItems.map((item, i) => {
            if ('section' in item) {
              return (
                <p key={i} className="px-5 pt-4 pb-1.5 text-[10px] font-semibold uppercase tracking-[2px] text-[#aab4c4] whitespace-nowrap">
                  {item.section}
                </p>
              )
            }

            const Icon = item.icon!
            const active = pathname === item.href

            return (
              <Link key={item.href} href={item.href!}
                className={cn(
                  'flex items-center gap-3 px-5 py-2.5 text-sm font-medium border-l-[3px] border-transparent transition-all whitespace-nowrap',
                  active
                    ? 'bg-[#E67A0E]/10 text-[#1a2535] border-l-[#E67A0E] font-semibold'
                    : 'text-[#6b7a90] hover:bg-[#f0f4f8] hover:text-[#1a2535]',
                )}
              >
                <Icon size={18} className="shrink-0"
                  style={{ color: active ? primaryColor : '#aab4c4' }} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="p-5 border-t border-[#dde3ec] shrink-0 space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold text-white shrink-0 shadow-sm"
              style={{ background: 'linear-gradient(135deg,#E67A0E,#f4a04a)' }}>
              {(user?.nome ?? 'U').charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-[13px] font-bold text-[#1a2535] truncate whitespace-nowrap">
                {user?.nome ?? 'Usuário'}
              </p>
              <p className="text-[11px] text-[#6b7a90] truncate whitespace-nowrap uppercase font-medium">
                {user?.role?.replace('_', ' ') ?? 'Acesso'} · {user?.uf ?? '--'}
              </p>
            </div>
          </div>

          <Link href="/modulos"
            className="flex items-center gap-2 w-full px-3 py-1.5 rounded-md bg-[#f0f4f8] text-[#6b7a90] hover:text-[#1a2535] text-[12px] font-semibold transition-all whitespace-nowrap"
          >
            <Grid2x2 size={14} className="shrink-0" />
            Trocar Módulo
          </Link>

          <button onClick={() => signOut({ callbackUrl: '/login' })}
            className="flex items-center gap-2 w-full px-3 py-1.5 rounded-md bg-red-50 text-red-500 hover:text-red-700 text-[12px] font-bold transition-all whitespace-nowrap"
          >
            <LogOut size={14} className="shrink-0" />
            Sair do Sistema
          </button>
        </div>
      </aside>

      <div className={cn('shrink-0 transition-all duration-300', expanded ? 'w-[240px]' : 'w-0')} />
    </>
  )
}