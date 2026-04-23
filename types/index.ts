// ============================================================
// types/index.ts — Tipos compartilhados do sistema SIGS
// ============================================================

export type UF = 'PI' | 'MA'

export type Regional =
  | 'METROPOLITANA'
  | 'SUL'
  | 'NORTE'
  | 'LESTE'
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

// types/index.ts

export interface Equipamento {
  id: string;
  uuid: string;
  codigo: string;       
  codigoGalao?: string; 
  tipo: string | TipoEquipamento; // Usar o tipo para lógica condicional
  
  // Novos campos solicitados para extintores (institores)
  carga?: string;           // Ex: 6kg, 10L
  agente?: string;          // Ex: PQS, CO2, Água
  numeroSerieCilindro?: string; 

  capacidade: string;
  pontoInstalacao: string;
  base: string;
  fabricacao: string;
  proximaInspecao: string;
  uf: string;
  regional: string;
  status: 'ativo' | 'manutencao' | 'vencido';
  validadeRecarga?: string;
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
  PI: ['METROPOLITANA', 'SUL', 'NORTE'],
  MA: ['SUL', 'NORTE', 'LESTE', 'NOROESTE'],
}