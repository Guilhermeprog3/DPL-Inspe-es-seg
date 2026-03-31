'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useState } from 'react'
import { cadastroSchema, type CadastroInput } from '@/lib/validations'
import { REGIONAIS_POR_UF, type UF } from '@/types'
import { User, Mail, Lock, ChevronDown, Briefcase, ArrowLeft } from 'lucide-react'

export default function CadastroPage() {
  const router = useRouter()
  const [ufSel, setUfSel] = useState<UF | ''>('')

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<CadastroInput>({
    resolver: zodResolver(cadastroSchema),
  })

  function handleUfChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value as UF
    setUfSel(val)
    setValue('uf', val)
    setValue('regional', '')
  }

  async function onSubmit(data: CadastroInput) {
  try {
    const response = await fetch('http://localhost:3001/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        nome: data.nome,
        sobrenome: data.sobrenome,
        email: data.email,
        password: data.senha, 
        uf: data.uf,
        regional: data.regional,
        role: data.role,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Erro ao realizar cadastro');
    }

    const result = await response.json();
    console.log('Usuário criado com sucesso:', result);
    
    alert('Cadastro realizado com sucesso!');
    router.push('/login');
  } catch (error: any) {
    console.error('Erro no cadastro:', error);
    alert(error.message);
  }
}

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#d6dde6] px-4 py-10">
      <div className="bg-white rounded-lg shadow-md w-full max-w-[450px] px-8 py-8">
        {/* Logo Interna */}
        <div className="mb-6 text-center">
          <span className="font-condensed text-[32px] font-bold text-[#094780] tracking-[1px]">SIGS</span>
          <span className="font-condensed text-[32px] font-normal text-[#555] tracking-[1px] ml-2">Gestor</span>
          <p className="text-[#666] text-sm mt-2">Solicite seu acesso ao sistema</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <input {...register('nome')} placeholder="Nome" className="w-full pl-4 pr-10 py-3 border border-[#ccd3db] rounded text-sm bg-[#f4f7fb] focus:outline-none focus:border-[#094780]" />
              <User size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
              {errors.nome && <p className="text-[10px] text-red-500 mt-1">{errors.nome.message}</p>}
            </div>
            <div className="relative">
              <input {...register('sobrenome')} placeholder="Sobrenome" className="w-full pl-4 pr-10 py-3 border border-[#ccd3db] rounded text-sm bg-[#f4f7fb] focus:outline-none focus:border-[#094780]" />
              {errors.sobrenome && <p className="text-[10px] text-red-500 mt-1">{errors.sobrenome.message}</p>}
            </div>
          </div>

          <div className="relative">
            <input type="email" {...register('email')} placeholder="E-mail corporativo" className="w-full pl-4 pr-10 py-3 border border-[#ccd3db] rounded text-sm bg-[#f4f7fb] focus:outline-none focus:border-[#094780]" />
            <Mail size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
            {errors.email && <p className="text-[10px] text-red-500 mt-1">{errors.email.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <select value={ufSel} onChange={handleUfChange} className="w-full appearance-none pl-4 pr-10 py-3 border border-[#ccd3db] rounded text-sm bg-white focus:outline-none focus:border-[#094780] cursor-pointer">
                <option value="">UF</option>
                <option value="PI">PI</option>
                <option value="MA">MA</option>
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] pointer-events-none" />
            </div>

            <div className="relative">
              <select disabled={!ufSel} {...register('regional')} className="w-full appearance-none pl-4 pr-10 py-3 border border-[#ccd3db] rounded text-sm bg-white disabled:bg-[#f4f7fb] focus:outline-none focus:border-[#094780] cursor-pointer">
                <option value="">Regional</option>
                {ufSel && REGIONAIS_POR_UF[ufSel].map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] pointer-events-none" />
            </div>
          </div>

          <div className="relative">
  <select {...register('role')} className="w-full appearance-none pl-4 pr-10 py-3 border border-[#ccd3db] rounded text-sm bg-white focus:outline-none focus:border-[#094780] cursor-pointer">
    <option value="">Selecione o Perfil</option>
    <option value="inspetor">Inspetor</option>
    <option value="sesmt">SESMT</option>
    <option value="agente_cobli">Agente Cobli</option>
    <option value="admin">Administrador</option>
  </select>
  <Briefcase size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] pointer-events-none" />
</div>

          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <input type="password" {...register('senha')} placeholder="Senha" className="w-full pl-4 pr-10 py-3 border border-[#ccd3db] rounded text-sm bg-[#f4f7fb] focus:outline-none focus:border-[#094780]" />
              <Lock size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
            </div>
            <div className="relative">
              <input type="password" {...register('confirmarSenha')} placeholder="Repetir" className="w-full pl-4 pr-10 py-3 border border-[#ccd3db] rounded text-sm bg-[#f4f7fb] focus:outline-none focus:border-[#094780]" />
            </div>
          </div>

          <button type="submit" disabled={isSubmitting} className="w-full py-3 bg-[#094780] hover:bg-[#1a6ab5] text-white font-semibold text-sm rounded transition-colors disabled:opacity-60 flex items-center justify-center gap-2 mt-4">
            {isSubmitting && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            Cadastrar
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-[#eee] text-center">
          <Link href="/login" className="text-sm font-semibold text-[#094780] hover:underline flex items-center justify-center gap-2">
            <ArrowLeft size={14} /> Já tenho conta
          </Link>
        </div>
      </div>
    </div>
  )
}