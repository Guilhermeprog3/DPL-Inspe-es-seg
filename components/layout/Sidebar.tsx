'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, ClipboardList, Briefcase,
  QrCode, BarChart2, Users, LogOut, Grid2x2,
} from 'lucide-react'

const navItems = [
  { section: 'Principal' },
  { label: 'Dashboard',     href: '/dashboard',     icon: LayoutDashboard },
  { section: 'Inspeção' },
  { label: 'Nova Inspeção', href: '/inspecao',       icon: ClipboardList },
  { label: 'Equipamentos',  href: '/equipamentos',   icon: Briefcase },
  { label: 'QR Codes',      href: '/qr-codes',       icon: QrCode },
  { section: 'Gestão' },
  { label: 'Relatórios',    href: '/relatorios',     icon: BarChart2 },
  { label: 'Usuários',      href: '/usuarios',       icon: Users },
]

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const user = session?.user as any

  return (
    <aside className="w-[240px] bg-[#063357] text-white flex flex-col fixed h-screen z-50 overflow-y-auto">
      {/* Logo */}
      <div className="px-5 py-[22px] border-b border-white/10">
        <p className="font-condensed text-[22px] font-bold tracking-wide">SIGS</p>
        <p className="text-[10px] text-white/50 uppercase tracking-[2px] mt-0.5">Segurança do Trabalho</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3">
        {navItems.map((item, i) => {
          if ('section' in item) {
            return (
              <p key={i} className="px-5 pt-4 pb-1.5 text-[10px] font-semibold uppercase tracking-[2px] text-white/35">
                {item.section}
              </p>
            )
          }
          const Icon = item.icon!
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href!}
              className={cn(
                'flex items-center gap-3 px-5 py-2.5 text-sm font-medium border-l-[3px] border-transparent transition-all',
                'text-white/70 hover:bg-white/7 hover:text-white',
                active && 'bg-[#E67A0E]/15 text-white border-l-[#E67A0E]'
              )}
            >
              <Icon size={18} className="opacity-80" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-5 border-t border-white/10 space-y-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#E67A0E] flex items-center justify-center text-[12px] font-bold shrink-0">
            {user?.name?.charAt(0) ?? 'U'}
          </div>
          <div className="overflow-hidden">
            <p className="text-[13px] font-semibold text-white truncate">{user?.name ?? 'Usuário'}</p>
            <p className="text-[11px] text-white/45 truncate">
              {user?.role ?? 'inspetor'} · {user?.uf ?? 'PI'} · {user?.regional ?? 'Metropolitana'}
            </p>
          </div>
        </div>
        <Link
          href="/modulos"
          className="flex items-center gap-2 w-full px-3 py-1.5 rounded-md bg-white/8 text-white/70 hover:text-white text-[12px] font-semibold transition-colors"
        >
          <Grid2x2 size={14} />
          Trocar Módulo
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex items-center gap-2 w-full px-3 py-1.5 rounded-md bg-red-500/15 text-red-400 hover:text-red-300 text-[12px] font-semibold transition-colors"
        >
          <LogOut size={14} />
          Sair do Sistema
        </button>
      </div>
    </aside>
  )
}
