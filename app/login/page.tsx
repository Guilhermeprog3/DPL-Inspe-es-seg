'use client'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useState } from 'react'
import { loginSchema, type LoginInput } from '@/lib/validations'
import { REGIONAIS_POR_UF, type UF } from '@/types'
import { Mail, Lock, ChevronDown } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [ufSel, setUfSel] = useState<UF | ''>('')

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  })

  async function onSubmit(data: LoginInput) {
    setError('')
    const res = await signIn('credentials', {
      email: data.email,
      password: data.senha,
      redirect: false,
    })
    if (res?.ok) {
      router.push('/modulos')
    } else {
      setError('E-mail ou senha inválidos.')
    }
  }

  function handleUfChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value as UF
    setUfSel(val)
    setValue('uf', val)
    setValue('regional', '')
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#d6dde6] px-4">
      {/* Card */}
      <div className="bg-white rounded-lg shadow-md w-full max-w-[400px] px-8 py-8">
        
        {/* Logo Interna */}
        <div className="mb-6 text-center">
          <span className="font-condensed text-[32px] font-bold text-[#094780] tracking-[1px]">SIGS</span>
          <span className="font-condensed text-[32px] font-normal text-[#555] tracking-[1px] ml-2">Gestor</span>
          <p className="text-[#555] text-sm mt-2">Faça login para iniciar a sua sessão</p>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">

          {/* Email */}
          <div className="relative">
            <input
              type="email"
              placeholder="E-mail"
              className="w-full pl-4 pr-10 py-3 border border-[#ccd3db] rounded text-sm text-[#333] bg-[#f4f7fb] focus:outline-none focus:border-[#094780] transition-colors"
              {...register('email')}
            />
            <Mail size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
            {errors.email && (
              <p className="text-[10px] text-red-500 mt-1">{errors.email.message}</p>
            )}
          </div>

          {/* Senha */}
          <div className="relative">
            <input
              type="password"
              placeholder="Senha"
              className="w-full pl-4 pr-10 py-3 border border-[#ccd3db] rounded text-sm text-[#333] bg-[#f4f7fb] focus:outline-none focus:border-[#094780] transition-colors"
              {...register('senha')}
            />
            <Lock size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
            {errors.senha && (
              <p className="text-[10px] text-red-500 mt-1">{errors.senha.message}</p>
            )}
          </div>

          {/* Estado (UF) */}
          <div className="relative">
            <select
              className="w-full appearance-none pl-4 pr-10 py-3 border border-[#ccd3db] rounded text-sm bg-white text-[#333] focus:outline-none focus:border-[#094780] transition-colors cursor-pointer"
              value={ufSel}
              onChange={handleUfChange}
            >
              <option value="">Selecione o Estado</option>
              <option value="PI">PI — Piauí</option>
              <option value="MA">MA — Maranhão</option>
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] pointer-events-none" />
            {errors.uf && (
              <p className="text-[10px] text-red-500 mt-1">{errors.uf.message}</p>
            )}
          </div>

          {/* Regional */}
          <div className="relative">
            <select
              className="w-full appearance-none pl-4 pr-10 py-3 border border-[#ccd3db] rounded text-sm bg-white text-[#333] focus:outline-none focus:border-[#094780] transition-colors cursor-pointer disabled:bg-[#f4f7fb] disabled:text-[#aaa] disabled:cursor-not-allowed"
              disabled={!ufSel}
              {...register('regional')}
            >
              <option value="">Selecione a Regional</option>
              {ufSel &&
                REGIONAIS_POR_UF[ufSel].map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] pointer-events-none" />
            {errors.regional && (
              <p className="text-[10px] text-red-500 mt-1">{errors.regional.message}</p>
            )}
          </div>

          {/* Botão Logar */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-[#094780] hover:bg-[#1a6ab5] text-white font-semibold text-sm rounded transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
          >
            {isSubmitting && (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            Logar
          </button>
        </form>

        {/* Links inferiores */}
        <div className="mt-6 pt-6 border-t border-[#eee] flex items-center justify-between">
          <Link
            href="/cadastro"
            className="text-sm font-semibold text-[#094780] hover:underline"
          >
            Solicitar Acesso
          </Link>
          <Link
            href="/recuperar-senha"
            className="text-sm font-semibold text-[#094780] hover:underline"
          >
            Esqueceu a senha?
          </Link>
        </div>
      </div>
    </div>
  )
}