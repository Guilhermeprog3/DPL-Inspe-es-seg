'use client'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { loginSchema, type LoginInput } from '@/lib/validations'
import { REGIONAIS_POR_UF, type UF } from '@/types'
import { Mail, Lock, ChevronDown, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [ufSel, setUfSel] = useState<UF | ''>('')

  const {
    register,
    handleSubmit,
    setValue,
    clearErrors,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    mode: 'onChange'
  })

  // Monitora o campo de e-mail
  const emailValue = watch('email')

  // Lógica de Autopreenchimento
  useEffect(() => {
    const fetchUserData = async () => {
      // Regra simples: só busca se for um e-mail minimamente válido
      if (emailValue && emailValue.includes('@') && emailValue.length > 5) {
        try {
          // Aqui você faria um fetch: await fetch(`/api/user-metadata?email=${emailValue}`)
          // Simulação de resposta baseada no seu banco:
          if (emailValue === 'gui@exemplo.com') {
            const autoUf = 'PI' as UF
            const autoRegional = 'Metropolitana'
            
            setUfSel(autoUf)
            setValue('uf', autoUf, { shouldValidate: true })
            setValue('regional', autoRegional, { shouldValidate: true })
            clearErrors(['uf', 'regional'])
          }
        } catch (e) {
          console.error("Erro ao buscar metadados do usuário");
        }
      }
    }

    const timer = setTimeout(fetchUserData, 1000) // Debounce para não disparar a cada tecla
    return () => clearTimeout(timer)
  }, [emailValue, setValue, clearErrors])

  async function onSubmit(data: LoginInput) {
    setError('')
    try {
      const res = await signIn('credentials', {
        email: data.email,
        password: data.senha,
        uf: data.uf,
        regional: data.regional,
        redirect: false,
      })

      if (res?.error) {
        setError(res.error === 'Configuration' 
          ? 'Erro de configuração no servidor.' 
          : 'E-mail, senha ou localidade incorretos.')
        return
      }

      if (res?.ok) router.push('/modulos')
    } catch (err) {
      setError('Ocorreu um erro inesperado ao realizar o login.')
    }
  }

  function handleUfChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value as UF
    setUfSel(val)
    setValue('uf', val, { shouldValidate: true })
    setValue('regional', '', { shouldValidate: false })
    clearErrors('regional')
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#d6dde6] px-4 font-sans">
      <div className={`bg-white rounded-2xl shadow-xl w-full max-w-[400px] px-8 py-10 transition-all ${error ? 'border-2 border-red-500 animate-shake' : 'border border-transparent'}`}>
        
        <div className="mb-8 text-center">
          <div className="flex justify-center items-center gap-2 mb-2">
            <span className="text-[36px] font-black text-[#094780] tracking-tighter">SIGS</span>
            <span className="text-[36px] font-light text-slate-400 tracking-tighter">Gestor</span>
          </div>
          <p className="text-slate-500 text-sm font-medium">Controle de Medidas Administrativas</p>
        </div>

        {/* Exibição de Erro no Card */}
        {error && (
          <div className="mb-6 flex items-center gap-3 px-4 py-3 bg-red-50 border-l-4 border-red-500 rounded text-sm text-red-700">
            <AlertCircle size={18} className="shrink-0" />
            <p className="font-semibold">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Email */}
          <div className="space-y-1">
            <div className="relative">
              <input
                type="email"
                placeholder="E-mail funcional"
                className={`w-full pl-4 pr-10 py-3.5 border rounded-xl text-sm transition-all outline-none ${errors.email ? 'border-red-500 bg-red-50/30' : 'border-[#ccd3db] bg-[#f4f7fb] focus:border-[#094780] focus:ring-2 focus:ring-[#094780]/10'}`}
                {...register('email')}
              />
              <Mail size={18} className={`absolute right-3 top-1/2 -translate-y-1/2 ${errors.email ? 'text-red-400' : 'text-[#94a3b8]'}`} />
            </div>
            {errors.email && <p className="text-[11px] text-red-500 font-bold ml-1">{errors.email.message}</p>}
          </div>

          {/* Senha */}
          <div className="space-y-1">
            <div className="relative">
              <input
                type="password"
                placeholder="Sua senha"
                className={`w-full pl-4 pr-10 py-3.5 border rounded-xl text-sm transition-all outline-none ${errors.senha ? 'border-red-500 bg-red-50/30' : 'border-[#ccd3db] bg-[#f4f7fb] focus:border-[#094780] focus:ring-2 focus:ring-[#094780]/10'}`}
                {...register('senha')}
              />
              <Lock size={18} className={`absolute right-3 top-1/2 -translate-y-1/2 ${errors.senha ? 'text-red-400' : 'text-[#94a3b8]'}`} />
            </div>
            {errors.senha && <p className="text-[11px] text-red-500 font-bold ml-1">{errors.senha.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
             {/* Estado (UF) */}
            <div className="space-y-1">
              <div className="relative">
                <select
                  className={`w-full appearance-none pl-4 pr-10 py-3.5 border rounded-xl text-sm transition-all outline-none bg-white cursor-pointer ${errors.uf ? 'border-red-500 bg-red-50/30' : 'border-[#ccd3db] focus:border-[#094780]'}`}
                  value={ufSel}
                  onChange={handleUfChange}
                >
                  <option value="">UF</option>
                  <option value="PI">PI</option>
                  <option value="MA">MA</option>
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] pointer-events-none" />
              </div>
            </div>

            {/* Regional */}
            <div className="space-y-1">
              <div className="relative">
                <select
                  className={`w-full appearance-none pl-4 pr-10 py-3.5 border rounded-xl text-sm transition-all outline-none bg-white cursor-pointer disabled:bg-slate-100 disabled:text-slate-400 ${errors.regional ? 'border-red-500 bg-red-50/30' : 'border-[#ccd3db] focus:border-[#094780]'}`}
                  disabled={!ufSel}
                  {...register('regional')}
                >
                  <option value="">Regional</option>
                  {ufSel && REGIONAIS_POR_UF[ufSel].map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] pointer-events-none" />
              </div>
            </div>
          </div>
          {(errors.uf || errors.regional) && (
            <p className="text-[11px] text-red-500 font-bold text-center">Informe o Estado e a Regional</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 bg-[#094780] hover:bg-[#073661] text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-blue-900/20 active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-3 mt-4"
          >
            {isSubmitting ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : 'ENTRAR NO SISTEMA'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between px-2">
          <Link href="/cadastro" className="text-[13px] font-bold text-[#094780] hover:text-blue-700">
            Solicitar Acesso
          </Link>
          <Link href="/recuperar-senha" className="text-[13px] font-bold text-[#094780] hover:text-blue-700">
            Esqueceu a senha?
          </Link>
        </div>
      </div>

      <style jsx global>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.2s ease-in-out 0s 2;
        }
      `}</style>
    </div>
  )
}