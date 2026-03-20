'use client'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { ClipboardList } from 'lucide-react'

export default function ModulosPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const user = session?.user as any

  return (
    <div className="min-h-screen bg-[#f4f6f9] flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-[#dde3ec] px-10 h-16 flex items-center justify-between">
        <p className="font-condensed text-2xl font-bold text-[#094780] tracking-[2px]">SIGS</p>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#E67A0E] flex items-center justify-center text-xs font-bold text-white">
            {user?.name?.charAt(0) ?? 'U'}
          </div>
          <div>
            <p className="text-sm font-semibold text-[#1a2535] leading-none">{user?.name ?? 'Usuário'}</p>
            <p className="text-xs text-[#6b7a90]">
              {user?.role ?? 'inspetor'} · {user?.uf ?? 'PI'} · {user?.regional ?? 'Metropolitana'}
            </p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="ml-4 px-3 py-1.5 border border-[#dde3ec] rounded-md text-xs font-semibold text-[#6b7a90] hover:text-[#1a2535] hover:bg-[#f0f4f8] transition-colors"
          >
            Sair
          </button>
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <p className="text-[11px] font-semibold text-[#6b7a90] uppercase tracking-[2px] mb-8">
          Selecione um módulo
        </p>

        {/* Single module card */}
        <button
          onClick={() => router.push('/dashboard')}
          className="bg-white rounded-2xl border border-[#dde3ec] p-8 flex flex-col items-center gap-4 w-52
                     shadow-[0_1px_4px_rgba(0,0,0,0.06)] cursor-pointer transition-all duration-200
                     hover:shadow-[0_8px_24px_rgba(9,71,128,0.14)] hover:-translate-y-1 hover:border-[#c8d8ec]
                     focus:outline-none focus:ring-2 focus:ring-[#094780]/30"
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#E67A0E] to-[#f4a04a] flex items-center justify-center shadow-md">
            <ClipboardList size={32} color="#fff" strokeWidth={1.8} />
          </div>
          <div className="text-center">
            <p className="text-[13px] font-bold text-[#1a2535] uppercase tracking-wide leading-snug">
              Inspeção de Equipamentos<br />de Segurança
            </p>
            <p className="text-[11px] text-[#6b7a90] uppercase tracking-wide mt-1">
              Inspeção de Equipamentos<br />de Segurança
            </p>
          </div>
          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#E67A0E]/12 text-[#E67A0E]">
            3 pendentes
          </span>
        </button>
      </div>
    </div>
  )
}
