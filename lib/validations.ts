import { z } from 'zod'
import { REGIONAIS_POR_UF, type UF } from '@/types'

// ---- Login ----
export const loginSchema = z.object({
  email: z.string().min(1, 'E-mail obrigatório').email('E-mail inválido'),
  senha: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
})
export type LoginInput = z.infer<typeof loginSchema>

// ---- Cadastro ----
const ROLES_VALIDAS = [
  'inspetor', 'sesmt', 'admin', 'agente_cobli',
  'coordenador', 'gerente', 'supervisor',
] as const

export const cadastroSchema = z
  .object({
    nomeCompleto: z
      .string()
      .min(3, 'Nome completo obrigatório')
      .max(200, 'Máximo 200 caracteres'),

    email: z
      .string()
      .email('E-mail inválido')
      .max(254, 'E-mail muito longo'),

    chapa: z
      .string()
      .min(1, 'Selecione um funcionário pela matrícula ou nome'),

    uf: z.preprocess(
      (val) => (val === '' ? undefined : val),
      z.enum(['PI', 'MA'], {
        required_error: 'Selecione o estado',
        invalid_type_error: 'Selecione o estado',
      }),
    ),

    regional: z.string().min(1, 'Selecione a regional'),

    // ← Substituído z.enum por z.string + refine para mensagem em PT-BR
    role: z
      .string({ required_error: 'Selecione um perfil de acesso' })
      .min(1, 'Selecione um perfil de acesso')
      .refine(
        (val) => (ROLES_VALIDAS as readonly string[]).includes(val),
        { message: 'Perfil de acesso inválido' },
      ),

    senha: z
      .string()
      .min(8, 'Mínimo 8 caracteres')
      .max(128, 'Máximo 128 caracteres')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).+$/,
        'A senha deve ter maiúscula, minúscula, número e símbolo (ex: Senha@123)',
      ),

    confirmarSenha: z.string(),
  })
  .refine(
    (data) => data.senha === data.confirmarSenha,
    { message: 'As senhas não conferem', path: ['confirmarSenha'] },
  )
  .refine(
    (data) => {
      const listaRegionais = REGIONAIS_POR_UF[data.uf as UF] as string[]
      if (!listaRegionais) return false
      return listaRegionais.some(
        (r) => r.toUpperCase().trim() === data.regional.toUpperCase().trim(),
      )
    },
    { message: 'Regional inválida para o estado selecionado', path: ['regional'] },
  )

export type CadastroInput = z.infer<typeof cadastroSchema>

// ---- Recuperar Senha ----
export const recuperarSenhaSchema = z.object({
  email: z.string().email('E-mail inválido'),
})
export type RecuperarSenhaInput = z.infer<typeof recuperarSenhaSchema>

// ---- Novo Equipamento ----
export const equipamentoSchema = z.object({
  codigo: z.string().min(1, 'Obrigatório'),
  tipo: z.string().min(1, 'Selecione um tipo'),
  codigoGalao: z.string().optional(),
  capacidade: z.string().optional(),
  pontoInstalacao: z.string().min(1, 'Obrigatório'),
  uf: z.string().length(2),
  regional: z.string().min(1, 'Obrigatório'),
  base: z.string().min(1, 'Obrigatório'),
  fabricacao: z.string(),
  proximaInspecao: z.string(),
})
export type EquipamentoInput = z.infer<typeof equipamentoSchema>