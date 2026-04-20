// ─── admin/usuarios/editar/[id]/page.tsx ─────────────────────────────────────
'use client'

import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { UsuarioForm } from '../../usuarios/novo/page'
import { Users, Plus, LayoutDashboard, ArrowLeft } from 'lucide-react'
import { useParams } from 'next/navigation'

const navItems = [
  { section: 'Administração' },
  { label: 'Dashboard',         href: '/modulos',             icon: LayoutDashboard },
  { section: 'Usuários' },
  { label: 'Lista de Usuários', href: '/admin/usuarios',      icon: Users },
  { label: 'Novo Usuário',      href: '/admin/usuarios/novo', icon: Plus },
]

export default function EditarUsuarioPage() {
  const router = useRouter()
  const params = useParams()
  const userId = params?.id as string

  return (
    <DashboardLayout title="Editar Usuário" navItems={navItems} accentColor="#094780">
      {/* Breadcrumb igual ao padrão das outras telas */}
      <div className="-mx-4 md:-mx-7 -mt-4 md:-mt-7 mb-6 bg-white border-b border-[#e3e8ef] px-4 md:px-7 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[13px] text-[#9ca3af]">
          <button onClick={() => router.push('/admin/usuarios')}
            className="hover:text-[#094780] transition-colors font-medium flex items-center gap-1.5">
            <ArrowLeft size={13} /> Usuários
          </button>
          <span className="text-[11px]">›</span>
          <span className="text-[#094780] font-semibold">Editar Usuário</span>
        </div>
        <span className="text-[11px] font-mono text-[#9ca3af] bg-[#f4f6f9] border border-[#e3e8ef] px-2.5 py-1 rounded-md hidden sm:block">
          ID #{userId?.slice(-6).toUpperCase()}
        </span>
      </div>
      <UsuarioForm isEdit={true} />
    </DashboardLayout>
  )
}