import { z } from 'zod'
import { REGIONAIS_POR_UF, type UF } from '@/types'

// ---- Login ----
export const loginSchema = z
  .object({
    email: z.string().min(1, 'E-mail obrigatório').email('E-mail inválido'),
    senha: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
   // No loginSchema e cadastroSchema:
uf: z.preprocess(
  (val) => (val === '' ? undefined : val),
  z.enum(['PI', 'MA'], { 
    required_error: 'Selecione o estado',
    invalid_type_error: 'Selecione o estado' 
  })
),
    regional: z.string().min(1, 'Selecione a regional'),
  })
  .refine(
    (data) => {
      // 1. Verificação de segurança básica
      if (!data.uf || !data.regional) return false;

      // 2. Acesso tipado ao objeto de constantes
      // Usamos 'as UF' para garantir ao TS que a chave é válida
      const listaRegionais = REGIONAIS_POR_UF[data.uf as UF] as string[];

      if (!listaRegionais) return false;

      // 3. Comparação ignorando maiúsculas/minúsculas e espaços extras
      return listaRegionais.some(
        (r) => r.toUpperCase().trim() === data.regional.toUpperCase().trim()
      );
    },
    {
      message: 'Regional inválida para o estado selecionado',
      path: ['regional'],
    }
  )

export type LoginInput = z.infer<typeof loginSchema>

// ---- Cadastro ----
export const cadastroSchema = z
  .object({
    nome: z.string().min(2, 'Nome obrigatório'),
    sobrenome: z.string().min(2, 'Sobrenome obrigatório'),
    email: z.string().email('E-mail inválido'),
    uf: z.preprocess(
      (val) => (val === '' ? undefined : val),
      z.enum(['PI', 'MA'], { 
        required_error: 'Selecione o estado',
        invalid_type_error: 'Selecione o estado' 
      })
    ),
    regional: z.string().min(1, 'Selecione a regional'),
    // ATUALIZADO: Incluídas as novas roles aqui
    role: z.enum([
      'inspetor', 
      'sesmt', 
      'rh', 
      'admin', 
      'agente_cobli', 
      'coordenador', 
      'gerente', 
      'supervisor'
    ]),
    senha: z.string().min(8, 'Mínimo 8 caracteres'),
    confirmarSenha: z.string(),
  })
  .refine((data) => data.senha === data.confirmarSenha, {
    message: 'As senhas não conferem',
    path: ['confirmarSenha'],
  })
  .refine(
    (data) => {
      // Repetindo a lógica robusta no cadastro também
      const listaRegionais = REGIONAIS_POR_UF[data.uf as UF] as string[];
      if (!listaRegionais) return false;

      return listaRegionais.some(
        (r) => r.toUpperCase().trim() === data.regional.toUpperCase().trim()
      );
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
