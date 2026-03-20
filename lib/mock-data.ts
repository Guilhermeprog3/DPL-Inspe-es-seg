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
  {
    id: 'usr-003', nome: 'Pedro', sobrenome: 'Alves',
    email: 'pedro@empresa.com', uf: 'MA', regional: 'NORTE',
    role: 'inspetor', ativo: false, criadoEm: '2024-03-05T00:00:00Z',
  },
  {
    id: 'usr-004', nome: 'Ana', sobrenome: 'Ferreira',
    email: 'ana@empresa.com', uf: 'PI', regional: 'Metropolitana',
    role: 'admin', ativo: true, criadoEm: '2023-12-01T00:00:00Z',
  },
]

export const mockEquipamentos: Equipamento[] = [
  {
    id: 'eq-001', uuid: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    codigo: 'EXT-001', tipo: 'Extintor PQS', capacidade: '6kg',
    pontoInstalacao: 'Corredor A — Bloco 2',
    fabricacao: '2023-01-01', proximaInspecao: '2025-06-15',
    uf: 'PI', regional: 'Metropolitana', status: 'ativo',
  },
  {
    id: 'eq-002', uuid: 'e5f6g7h8-i9j0-1234-klmn-op5678901234',
    codigo: 'EXT-002', tipo: 'Extintor CO2', capacidade: '4kg',
    pontoInstalacao: 'Sala de Servidores',
    fabricacao: '2022-03-01', proximaInspecao: '2025-06-20',
    uf: 'PI', regional: 'Metropolitana', status: 'ativo',
  },
  {
    id: 'eq-003', uuid: 'i9j0k1l2-m3n4-5678-opqr-st9012345678',
    codigo: 'HID-003', tipo: 'Hidrante', capacidade: '—',
    pontoInstalacao: 'Saída de Emergência N2',
    fabricacao: '2021-06-01', proximaInspecao: '2025-06-01',
    uf: 'PI', regional: 'Metropolitana', status: 'ativo',
  },
  {
    id: 'eq-004', uuid: 'm3n4o5p6-q7r8-9012-stuv-wx3456789012',
    codigo: 'SPK-007', tipo: 'Sprinkler', capacidade: '—',
    pontoInstalacao: 'Depósito — Piso 3',
    fabricacao: '2020-11-01', proximaInspecao: '2025-07-10',
    uf: 'PI', regional: 'Metropolitana', status: 'ativo',
  },
  {
    id: 'eq-005', uuid: 'q7r8s9t0-u1v2-3456-wxyz-ab7890123456',
    codigo: 'EXT-012', tipo: 'Extintor Água', capacidade: '10L',
    pontoInstalacao: 'Recepção Principal',
    fabricacao: '2020-02-01', proximaInspecao: '2024-12-01',
    uf: 'PI', regional: 'Metropolitana', status: 'vencido',
  },
]

export const mockChecklistTemplates: ChecklistTemplate[] = [
  {
    id: 'tpl-extintor',
    tipoEquipamento: 'Extintor PQS',
    itens: [
      { id: 'i1', pergunta: 'Validade da carga', descricao: 'Verificar data no manômetro', obrigatorio: true },
      { id: 'i2', pergunta: 'Pressão do manômetro', descricao: 'Agulha na zona verde', obrigatorio: true },
      { id: 'i3', pergunta: 'Sinalização de piso', descricao: 'Fita amarela visível', obrigatorio: true },
      { id: 'i4', pergunta: 'Pino de segurança', descricao: 'Lacre intacto', obrigatorio: true },
      { id: 'i5', pergunta: 'Estado do cilindro', descricao: 'Sem amassados ou ferrugem', obrigatorio: true },
    ],
  },
  {
    id: 'tpl-hidrante',
    tipoEquipamento: 'Hidrante',
    itens: [
      { id: 'h1', pergunta: 'Mangueira sem danos', descricao: 'Verificar integridade física', obrigatorio: true },
      { id: 'h2', pergunta: 'Registro de abertura', descricao: 'Gira sem dificuldade', obrigatorio: true },
      { id: 'h3', pergunta: 'Sinalização visível', descricao: 'Placa e pintura', obrigatorio: true },
      { id: 'h4', pergunta: 'Esguicho no local', descricao: 'Acoplado e sem danos', obrigatorio: true },
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
      { itemId: 'i1', resposta: 'ok' },
      { itemId: 'i2', resposta: 'ok' },
      { itemId: 'i3', resposta: 'ok' },
      { itemId: 'i4', resposta: 'ok' },
      { itemId: 'i5', resposta: 'ok' },
    ],
    latitude: -5.0892, longitude: -42.8016,
    uf: 'PI', regional: 'Metropolitana',
  },
  {
    id: 'ins-002', equipamentoId: 'eq-003', equipamentoCodigo: 'HID-003',
    inspetorId: 'usr-001', inspetorNome: 'João Silva',
    data: new Date(Date.now() - 3600000).toISOString(),
    status: 'atencao',
    respostas: [
      { itemId: 'h1', resposta: 'ok' },
      { itemId: 'h2', resposta: 'nao_conforme', observacao: 'Registro com dificuldade de abertura' },
      { itemId: 'h3', resposta: 'ok' },
      { itemId: 'h4', resposta: 'ok' },
    ],
    latitude: -5.0901, longitude: -42.8022,
    uf: 'PI', regional: 'Metropolitana',
  },
]

export const mockMetricas: MetricaConformidade[] = [
  { uf: 'PI', regional: 'Metropolitana', totalEquipamentos: 124, totalInspecoes: 512, percentualConformidade: 96, ultimaNaoConformidade: '2025-05-02' },
  { uf: 'PI', regional: 'SUL',           totalEquipamentos: 88,  totalInspecoes: 320, percentualConformidade: 89, ultimaNaoConformidade: '2025-05-15' },
  { uf: 'PI', regional: 'NORTE',         totalEquipamentos: 62,  totalInspecoes: 198, percentualConformidade: 78, ultimaNaoConformidade: '2025-05-18' },
  { uf: 'MA', regional: 'SUL',           totalEquipamentos: 94,  totalInspecoes: 415, percentualConformidade: 93, ultimaNaoConformidade: '2025-05-10' },
  { uf: 'MA', regional: 'NORTE',         totalEquipamentos: 71,  totalInspecoes: 280, percentualConformidade: 88, ultimaNaoConformidade: '2025-05-12' },
  { uf: 'MA', regional: 'SUDESTE',       totalEquipamentos: 56,  totalInspecoes: 210, percentualConformidade: 82, ultimaNaoConformidade: '2025-05-20' },
  { uf: 'MA', regional: 'NOROESTE',      totalEquipamentos: 38,  totalInspecoes: 142, percentualConformidade: 65, ultimaNaoConformidade: '2025-05-21' },
]
