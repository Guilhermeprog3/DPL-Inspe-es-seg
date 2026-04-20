'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { recuperarSenhaSchema, type RecuperarSenhaInput } from '@/lib/validations'
import { Mail, ArrowLeft, Wrench, AlertTriangle } from 'lucide-react'

export default function RecuperarSenhaPage() {
  const { register, formState: { errors } } = useForm<RecuperarSenhaInput>({
    resolver: zodResolver(recuperarSenhaSchema),
  })

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#d6dde6] px-4">
      <div className="relative bg-white rounded-lg shadow-md w-full max-w-[400px] px-8 py-8 overflow-hidden">
        
        {/* CAMADA DE MANUTENÇÃO (OVERLAY FIXO) */}
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm p-6 text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
            <Wrench className="w-8 h-8 text-amber-600 animate-pulse" />
          </div>
          <h3 className="text-[#094780] font-bold text-xl mb-2">Página em Manutenção</h3>
          <p className="text-gray-600 text-sm leading-relaxed mb-6">
            Estamos trabalhando na recuperação de senha. Esta funcionalidade estará disponível em breve.
          </p>
          <Link 
            href="/login" 
            className="flex items-center gap-2 px-6 py-2 bg-[#094780] text-white rounded-full text-sm font-semibold hover:bg-[#1a6ab5] transition-all"
          >
            <ArrowLeft size={16} /> Voltar para o Login
          </Link>
        </div>

        {/* CONTEÚDO AO FUNDO (DESFOCADO E INACESSÍVEL) */}
        <div className="opacity-30 pointer-events-none select-none">
          <div className="mb-6 text-center">
            <span className="font-condensed text-[32px] font-bold text-[#094780] tracking-[1px]">SIGS</span>
            <span className="font-condensed text-[32px] font-normal text-[#555] tracking-[1px] ml-2">Gestor</span>
            <h2 className="text-[#333] font-bold text-lg mt-4">Recuperar Senha</h2>
          </div>

          <form className="space-y-4">
            <div className="relative">
              <input
                type="email"
                placeholder="E-mail cadastrado"
                className="w-full pl-4 pr-10 py-3 border border-[#ccd3db] rounded text-sm bg-[#f4f7fb]"
                {...register('email')}
              />
              <Mail size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
            </div>

            <button type="button" className="w-full py-3 bg-[#094780] text-white font-semibold text-sm rounded">
              Enviar Instruções
            </button>
          </form>
        </div>
      </div>
      
      {/* AVISO ADICIONAL NO RODAPÉ DA PÁGINA */}
      <div className="mt-4 flex items-center gap-2 text-amber-800 bg-amber-100/50 px-4 py-2 rounded-full border border-amber-200">
        <AlertTriangle size={14} />
        <span className="text-xs font-medium">Módulo de segurança em atualização técnica.</span>
      </div>
    </div>
  )
}