'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { cn } from '@/lib/utils'
import {
  ShieldAlert, PlusCircle, List, 
  LogOut, Grid2x2, Clock,
} from 'lucide-react'

const navItems = [
  { section: 'Principal' },
  { label: 'Dashboard',             href: '/medida-administrativa',           icon: ShieldAlert },
  { section: 'Medidas' },
  { label: 'Nova Medida',           href: '/medida-administrativa/nova',      icon: PlusCircle },
  { label: 'Lista de Medidas',      href: '/medida-administrativa/lista',      icon: List },
  { label: 'Pendentes / Em Aberto', href: '/medida-administrativa/pendentes', icon: Clock },
]

interface SidebarProps {
  expanded: boolean
  onToggle: () => void
}

export function MedidaSidebar({ expanded, onToggle }: SidebarProps) {
  const pathname = usePathname()
  const { data: session } = useSession()
  
  // Integração com os dados da sessão (userData agora na raiz do user)
  const user = session?.user as any

  const primaryColor = '#094780'

  return (
    <>
      {expanded && (
        <div className="fixed inset-0 bg-black/30 z-40" onClick={onToggle} />
      )}

      <aside className={cn(
        'fixed h-screen z-50 flex flex-col overflow-hidden transition-all duration-300 ease-in-out',
        'bg-[#041628] border-r border-white/5',
        expanded ? 'w-[240px]' : 'w-0',
      )}>
        {/* Header */}
        <div className="flex items-center shrink-0 h-[60px] px-5 border-b border-white/5">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: primaryColor, boxShadow: `0 4px 12px ${primaryColor}55` }}>
              <ShieldAlert size={14} className="text-white" />
            </div>
            <div className="overflow-hidden">
              <p className="font-black text-[14px] tracking-widest whitespace-nowrap text-white uppercase">
                SESMT
              </p>
              <p className="text-[9px] text-white/25 uppercase tracking-[2px] mt-0.5 whitespace-nowrap font-bold">
                Medidas Adm.
              </p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 overflow-y-auto overflow-x-hidden">
          {navItems.map((item, i) => {
            if ('section' in item) {
              return (
                <p key={i} className="px-5 pt-4 pb-1.5 text-[9px] font-black uppercase tracking-[0.25em] whitespace-nowrap"
                  style={{ color: 'rgba(255,255,255,0.2)' }}>
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
                    ? 'font-semibold'
                    : 'hover:bg-white/5',
                )}
                style={active
                  ? { borderLeftColor: primaryColor, background: 'rgba(9,71,128,0.15)', color: 'white' }
                  : { color: 'rgba(255,255,255,0.4)' }}
              >
                <Icon size={16} className="shrink-0"
                  style={{ color: active ? '#60a5fa' : 'rgba(255,255,255,0.25)' }} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-white/5 shrink-0 space-y-2">
          <div className="flex items-center gap-2.5 px-1">
            {/* Avatar com inicial dinâmica do nome corrigido */}
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold text-white shrink-0"
              style={{ background: 'linear-gradient(135deg,#E67A0E,#f4a04a)' }}>
              {(user?.nome ?? 'U').charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-[12px] font-semibold truncate whitespace-nowrap" style={{ color: 'rgba(255,255,255,0.8)' }}>
                {user?.nome ?? 'Usuário'}
              </p>
              <p className="text-[10px] truncate whitespace-nowrap uppercase font-medium" style={{ color: 'rgba(255,255,255,0.3)' }}>
                {user?.role?.replace('_', ' ') ?? 'Acesso'} · {user?.uf ?? '--'}
              </p>
            </div>
          </div>

          <Link href="/modulos"
            className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-[11px] font-bold transition-all whitespace-nowrap"
            style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.1)')}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)')}
          >
            <Grid2x2 size={13} className="shrink-0" />
            Trocar Módulo
          </Link>

          <button onClick={() => signOut({ callbackUrl: '/login' })}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-[11px] font-bold transition-all whitespace-nowrap"
            style={{ background: 'rgba(239,68,68,0.1)', color: 'rgba(248,113,113,0.7)' }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = 'rgba(248,113,113,1)')}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'rgba(248,113,113,0.7)')}
          >
            <LogOut size={13} className="shrink-0" />
            Sair do Sistema
          </button>
        </div>
      </aside>

      <div className={cn('shrink-0 transition-all duration-300', expanded ? 'w-[240px]' : 'w-0')} />
    </>
  )
}