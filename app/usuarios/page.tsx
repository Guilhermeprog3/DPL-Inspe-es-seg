'use client'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardHeader, CardTitle, Badge, Button } from '@/components/ui'
import { mockUsers } from '@/lib/mock-data'
import { Plus } from 'lucide-react'

const roleLabel: Record<string, string> = {
  admin:    'Admin',
  inspetor: 'Inspetor',
  sesmt:    'SESMT',
  rh:       'RH',
}

const roleStyle: Record<string, string> = {
  admin:    'bg-purple-500/10 text-purple-600',
  inspetor: 'bg-[#094780]/10 text-[#094780]',
  sesmt:    'bg-[#E67A0E]/12 text-[#E67A0E]',
  rh:       'bg-green-500/10 text-green-600',
}

const avatarBg: Record<string, string> = {
  admin:    'bg-purple-500',
  inspetor: 'bg-[#094780]',
  sesmt:    'bg-[#E67A0E]',
  rh:       'bg-green-500',
}

export default function UsuariosPage() {
  return (
    <DashboardLayout title="Usuários" breadcrumb="SIGS / Configurações / Usuários">
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-sm text-[#6b7a90]">
            Controle de acesso baseado em perfil <strong>(RBAC)</strong>
          </p>
        </div>
        <Button>
          <Plus size={15} /> Novo Usuário
        </Button>
      </div>

      <Card padding={false}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#f8fafc] border-b border-[#dde3ec]">
                {['Usuário', 'E-mail', 'Perfil', 'UF', 'Regional', 'Status', 'Ação'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#6b7a90]">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mockUsers.map((user) => {
                const initials = `${user.nome[0]}${user.sobrenome[0]}`
                return (
                  <tr key={user.id} className="border-b border-[#dde3ec] last:border-0 hover:bg-[#f8faff]">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 ${avatarBg[user.role]}`}>
                          {initials}
                        </div>
                        <span className="font-semibold">{user.nome} {user.sobrenome}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[#6b7a90]">{user.email}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${roleStyle[user.role]}`}>
                        {roleLabel[user.role]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#6b7a90]">{user.uf}</td>
                    <td className="px-4 py-3 text-[#6b7a90]">{user.regional}</td>
                    <td className="px-4 py-3">
                      <Badge variant={user.ativo ? 'ok' : 'muted'} dot>
                        {user.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Button variant="ghost" size="sm">Editar</Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </DashboardLayout>
  )
}
