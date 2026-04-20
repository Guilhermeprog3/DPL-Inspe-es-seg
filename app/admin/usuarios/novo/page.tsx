'use client'

import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { UsuarioForm } from '@/components/admin/UsuarioForm'
import { Users, Plus, LayoutDashboard, ArrowLeft } from 'lucide-react'

const navItems = [
  { section: 'Administração' },
  { label: 'Dashboard', href: '/modulos', icon: LayoutDashboard },
  { section: 'Usuários' },
  { label: 'Lista de Usuários', href: '/admin/usuarios', icon: Users },
  { label: 'Novo Usuário', href: '/admin/usuarios/novo', icon: Plus },
]

export default function NovoUsuarioPage() {
  const router = useRouter()
  return (
    <DashboardLayout title="Novo Usuário" navItems={navItems} accentColor="#094780">
      <div className="-mx-4 md:-mx-7 -mt-4 md:-mt-7 mb-6 bg-white border-b border-[#e3e8ef] px-4 md:px-7 py-3">
        <button onClick={() => router.push('/admin/usuarios')} className="text-[13px] text-[#9ca3af] flex items-center gap-1.5">
          <ArrowLeft size={13} /> Usuários › <span className="text-[#094780] font-semibold">Novo Usuário</span>
        </button>
      </div>
      <UsuarioForm isEdit={false} />
    </DashboardLayout>
  )
}