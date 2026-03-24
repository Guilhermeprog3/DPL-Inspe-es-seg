// lib/mock-data.ts
import type { Equipamento, Inspecao, User, ChecklistTemplate, MetricaConformidade } from '@/types'

export const mockUser: User = {
  id: 'usr-001',
  nome: 'João',
  sobrenome: 'Silva',
  email: 'joao.silva@empresa.com.br',
  uf: 'PI',
  regional: 'Metropolitana',
  role: 'inspetor',
  ativo: true,
  criadoEm: '2024-01-15T00:00:00Z',
}

export const mockUsers: User[] = [
  mockUser,
  {
    id: 'usr-002', nome: 'Maria', sobrenome: 'Costa',
    email: 'maria@empresa.com', uf: 'PI', regional: 'SUL',
    role: 'sesmt', ativo: true, criadoEm: '2024-02-10T00:00:00Z',
  },
]

export const mockEquipamentos: Equipamento[] = [
  {
    id: 'eq-001',
    uuid: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    codigo: 'EXT-001',
    codigoGalao: 'PQS-99821-B', 
    // Novos campos adicionados aqui:
    carga: '6kg',
    agente: 'PQS (Pó Químico Seco)',
    numeroSerieCilindro: 'PQS-99821-B', 
    tipo: 'Extintor PQS',
    capacidade: '6kg',
    pontoInstalacao: 'Corredor A — Bloco 2',
    base: 'Porto Alegre',
    fabricacao: '2023-01-01',
    proximaInspecao: '2025-06-15',
    uf: 'PI',
    regional: 'Metropolitana',
    status: 'ativo',
  },
  {
    id: 'eq-002',
    uuid: 'e5f6g7h8-i9j0-1234-klmn-op5678901234',
    codigo: 'EXT-002',
    codigoGalao: 'CO2-44102-X',
    // Novos campos adicionados aqui:
    carga: '4kg',
    agente: 'CO2 (Dióxido de Carbono)',
    numeroSerieCilindro: 'CO2-44102-X',
    tipo: 'Extintor CO2',
    capacidade: '4kg',
    pontoInstalacao: 'Sala de Servidores',
    base: 'Monte Castelo',
    fabricacao: '2022-03-01',
    proximaInspecao: '2025-06-20',
    uf: 'PI',
    regional: 'Metropolitana',
    status: 'ativo',
  },
  {
    id: 'eq-003',
    uuid: 'i9j0k1l2-m3n4-5678-opqr-st9012345678',
    codigo: 'HID-003',
    tipo: 'Hidrante',
    capacidade: '—',
    pontoInstalacao: 'Saída de Emergência N2',
    base: 'Floriano',
    fabricacao: '2021-06-01',
    proximaInspecao: '2025-06-01',
    uf: 'PI',
    regional: 'SUL',
    status: 'ativo',
  },
  {
    id: 'eq-005',
    uuid: 'q7r8s9t0-u1v2-3456-wxyz-ab7890123456',
    codigo: 'EXT-012',
    codigoGalao: 'AP-55229-C',
    // Novos campos adicionados aqui:
    carga: '10L',
    agente: 'Água Pressurizada',
    numeroSerieCilindro: 'AP-55229-C',
    tipo: 'Extintor Água',
    capacidade: '10L',
    pontoInstalacao: 'Recepção Principal',
    base: 'Parnaiba',
    fabricacao: '2020-02-01',
    proximaInspecao: '2024-12-01',
    uf: 'PI',
    regional: 'NORTE',
    status: 'vencido',
  },
]

// No seu arquivo lib/mock-data.ts
export const mockChecklistTemplates: ChecklistTemplate[] = [
  {
    id: 'tpl-extintor-oficial',
    tipoEquipamento: 'Extintor PQS', // Aplique aos outros tipos de extintor também
    itens: [
      { id: '1', pergunta: 'Teste Hidrostático', obrigatorio: true },
      { id: '2', pergunta: 'Lacre / Anel / Trava', obrigatorio: true },
      { id: '3', pergunta: 'Manômetro', obrigatorio: true },
      { id: '4', pergunta: 'Bico', obrigatorio: true },
      { id: '5', pergunta: 'Mangote', obrigatorio: true },
      { id: '6', pergunta: 'Pintura', obrigatorio: true },
      { id: '7', pergunta: 'Difusor', obrigatorio: true },
      { id: '8', pergunta: 'Acesso Desobstruído', obrigatorio: true },
      { id: '9', pergunta: 'Equipamento Sinalizado', obrigatorio: true },
      { id: '10', pergunta: 'Sobre pedestais', obrigatorio: true },
      { id: '11', pergunta: 'Parede a 1,60m', obrigatorio: true },
      { id: '12', pergunta: 'Localização Adequada', obrigatorio: true },
    ],
  },
  {
    id: 'tpl-extintor-co2',
    tipoEquipamento: 'Extintor CO2',
    itens: [
      { id: 'c1', pergunta: 'Peso do cilindro', descricao: 'Verificar se há perda de carga', obrigatorio: true },
      { id: 'c2', pergunta: 'Difusor e Mangueira', descricao: 'Sem obstruções ou rachaduras', obrigatorio: true },
      { id: 'c3', pergunta: 'Lacre de segurança', descricao: 'Pino travado e lacrado', obrigatorio: true },
    ],
  },
  {
    id: 'tpl-hidrante',
    tipoEquipamento: 'Hidrante',
    itens: [
      { id: 'h1', pergunta: 'Mangueira sem danos', descricao: 'Verificar integridade física', obrigatorio: true },
      { id: 'h2', pergunta: 'Registro de abertura', descricao: 'Gira sem dificuldade', obrigatorio: true },
    ],
  },
]

export const mockInspecoes: Inspecao[] = [
  {
    id: 'ins-001', equipamentoId: 'eq-001', equipamentoCodigo: 'EXT-001',
    inspetorId: 'usr-001', inspetorNome: 'João Silva',
    data: new Date().toISOString(),
    status: 'aprovado',
    respostas: [
      { idItem: 'i1', resposta: 'ok', valor: 'OK' },
      { idItem: 'i2', resposta: 'ok', valor: 'OK' },
      { idItem: 'i3', resposta: 'ok', valor: 'OK' },
      { idItem: 'i4', resposta: 'ok', valor: 'OK' },
      { idItem: 'i5', resposta: 'ok', valor: 'OK' },
    ],
    uf: 'PI', regional: 'Metropolitana',
  },
]

export const mockMetricas: MetricaConformidade[] = [
  { uf: 'PI', regional: 'Metropolitana', totalEquipamentos: 124, totalInspecoes: 512, percentualConformidade: 96, ultimaNaoConformidade: '2025-05-02' },
  { uf: 'PI', regional: 'SUL',           totalEquipamentos: 88,  totalInspecoes: 320, percentualConformidade: 89, ultimaNaoConformidade: '2025-05-15' },
]