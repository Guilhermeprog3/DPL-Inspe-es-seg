'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useState } from 'react'
import { recuperarSenhaSchema, type RecuperarSenhaInput } from '@/lib/validations'
import { Mail, ArrowLeft, KeyRound } from 'lucide-react'

export default function RecuperarSenhaPage() {
  const [enviado, setEnviado] = useState(false)
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RecuperarSenhaInput>({
    resolver: zodResolver(recuperarSenhaSchema),
  })

  async function onSubmit(data: RecuperarSenhaInput) {
    await new Promise((r) => setTimeout(r, 1000))
    setEnviado(true)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#d6dde6] px-4">
      <div className="bg-white rounded-lg shadow-md w-full max-w-[400px] px-8 py-8">
        {/* Logo Interna */}
        <div className="mb-6 text-center">
          <span className="font-condensed text-[32px] font-bold text-[#094780] tracking-[1px]">SIGS</span>
          <span className="font-condensed text-[32px] font-normal text-[#555] tracking-[1px] ml-2">Gestor</span>
          <h2 className="text-[#333] font-bold text-lg mt-4">Recuperar Senha</h2>
        </div>

        {enviado ? (
          <div className="text-center space-y-6">
            <div className="px-4 py-4 bg-green-50 border border-green-100 rounded text-sm text-green-700 leading-relaxed">
              <strong>E-mail enviado!</strong><br /> 
              Confira sua caixa de entrada para redefinir sua senha.
            </div>
            <Link href="/login" className="inline-flex items-center gap-2 text-sm font-semibold text-[#094780] hover:underline">
              <ArrowLeft size={16} /> Voltar para o Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <p className="text-sm text-[#666] text-center mb-2">
              Informe seu e-mail para receber as instruções.
            </p>
            
            <div className="relative">
              <input
                type="email"
                placeholder="E-mail cadastrado"
                className="w-full pl-4 pr-10 py-3 border border-[#ccd3db] rounded text-sm text-[#333] bg-[#f4f7fb] focus:outline-none focus:border-[#094780]"
                {...register('email')}
              />
              <Mail size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
            </div>

            <button type="submit" disabled={isSubmitting} className="w-full py-3 bg-[#094780] hover:bg-[#1a6ab5] text-white font-semibold text-sm rounded transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
              {isSubmitting ? (
                 <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <KeyRound size={16} />
              )}
              Enviar Instruções
            </button>

            <div className="text-center mt-6 pt-4 border-t border-[#eee]">
              <Link href="/login" className="text-sm font-semibold text-[#094780] hover:underline inline-flex items-center gap-2">
                <ArrowLeft size={14} /> Voltar ao login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}