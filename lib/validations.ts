import { z } from 'zod'
import { REGIONAIS_POR_UF } from '@/types'

// ---- Login ----
export const loginSchema = z
  .object({
    email: z.string().min(1, 'E-mail obrigatório').email('E-mail inválido'),
    senha: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
    uf: z.enum(['PI', 'MA'], { required_error: 'Selecione o estado' }),
    regional: z.string().min(1, 'Selecione a regional'),
  })
  .refine(
    (data) => {
      const regionais = REGIONAIS_POR_UF[data.uf] as string[]
      return regionais.includes(data.regional)
    },
    { message: 'Regional inválida para o estado selecionado', path: ['regional'] }
  )
export type LoginInput = z.infer<typeof loginSchema>

// ---- Cadastro ----
export const cadastroSchema = z
  .object({
    nome: z.string().min(2, 'Nome obrigatório'),
    sobrenome: z.string().min(2, 'Sobrenome obrigatório'),
    email: z.string().email('E-mail inválido'),
    uf: z.enum(['PI', 'MA'], { required_error: 'Selecione o estado' }),
    regional: z.string().min(1, 'Selecione a regional'),
    role: z.enum(['inspetor', 'sesmt', 'rh', 'admin', 'agente_cobli']),
    senha: z.string().min(8, 'Mínimo 8 caracteres'),
    confirmarSenha: z.string(),
  })
  .refine((data) => data.senha === data.confirmarSenha, {
    message: 'As senhas não conferem',
    path: ['confirmarSenha'],
  })
  .refine(
    (data) => {
      const regionais = REGIONAIS_POR_UF[data.uf] as string[]
      return regionais.includes(data.regional)
    },
    { message: 'Regional inválida para o estado selecionado', path: ['regional'] }
  )
export type CadastroInput = z.infer<typeof cadastroSchema>

// ---- Recuperar Senha ----
export const recuperarSenhaSchema = z.object({
  email: z.string().email('E-mail inválido'),
})
export type RecuperarSenhaInput = z.infer<typeof recuperarSenhaSchema>

// ---- Novo Equipamento ----
export const equipamentoSchema = z.object({
  codigo: z.string().min(1, "Obrigatório"),
  tipo: z.string().min(1, "Selecione um tipo"),
  // Adicione esta linha:
  codigoGalao: z.string().optional(), 
  capacidade: z.string().optional(),
  pontoInstalacao: z.string().min(1, "Obrigatório"),
  uf: z.string().length(2),
  regional: z.string().min(1, "Obrigatório"),
  base: z.string().min(1, "Obrigatório"),
  fabricacao: z.string(),
  proximaInspecao: z.string(),
})

export type EquipamentoInput = z.infer<typeof equipamentoSchema>
