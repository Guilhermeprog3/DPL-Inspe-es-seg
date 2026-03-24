// ============================================================
// types/index.ts — Tipos compartilhados do sistema SIGS
// ============================================================

export type UF = 'PI' | 'MA'

export type Regional =
  | 'Metropolitana'
  | 'SUL'
  | 'NORTE'
  | 'SUDESTE'
  | 'NOROESTE'

export type Role =
  | 'admin'
  | 'inspetor'
  | 'sesmt'
  | 'rh'

export type StatusInspecao = 'aprovado' | 'reprovado' | 'atencao' | 'pendente'

export type TipoEquipamento =
  | 'Extintor PQS'
  | 'Extintor CO2'
  | 'Extintor Água'
  | 'Hidrante'
  | 'Sprinkler'
  | 'Detector de Fumaça'

export interface User {
  id: string
  nome: string
  sobrenome: string
  email: string
  uf: UF
  regional: Regional
  role: Role
  ativo: boolean
  criadoEm: string
}

export interface Equipamento {
  id: string;
  uuid: string;
  codigo: string;       // ADICIONE ESTA LINHA
  codigoGalao?: string;  // ADICIONE ESTA LINHA (com ? pois é opcional)
  tipo: string;
  capacidade: string;
  pontoInstalacao: string;
  base: string;
  fabricacao: string;
  proximaInspecao: string;
  uf: string;
  regional: string;
  status: 'ativo' | 'manutencao' | 'vencido';
}

export interface ChecklistItem {
  id: string
  pergunta: string
  descricao?: string
  obrigatorio: boolean
}

export interface ChecklistTemplate {
  id: string
  tipoEquipamento: TipoEquipamento
  itens: ChecklistItem[]
}

export interface RespostaChecklist {
  idItem: string;
  resposta: 'ok' | 'nao_conforme' | null
  observacao?: string
  valor: 'OK' | 'NC';  // O valor da resposta
}

export interface Inspecao {
  id: string
  equipamentoId: string
  equipamentoCodigo: string
  inspetorId: string
  inspetorNome: string
  data: string
  status: StatusInspecao
  respostas: RespostaChecklist[]
  latitude?: number
  longitude?: number
  observacoes?: string
  fotos?: string[]
  uf: UF
  regional: Regional
}

export interface MetricaConformidade {
  uf: UF
  regional: Regional
  totalEquipamentos: number
  totalInspecoes: number
  percentualConformidade: number
  ultimaNaoConformidade?: string
}

// Mapeamento de regionais por UF
export const REGIONAIS_POR_UF: Record<UF, Regional[]> = {
  PI: ['Metropolitana', 'SUL', 'NORTE'],
  MA: ['SUL', 'NORTE', 'SUDESTE', 'NOROESTE'],
}