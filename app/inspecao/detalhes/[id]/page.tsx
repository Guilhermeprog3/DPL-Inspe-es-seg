'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import {
  ArrowLeft, Edit2, CheckCircle2, AlertTriangle, XCircle, Clock,
  ShieldCheck, Wrench, QrCode, MapPin, User, Calendar, Hash,
  ClipboardList, AlertCircle, Loader2, CheckCircle, MinusCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Tipos / Config ───────────────────────────────────────────────────────────
type StatusKey = 'aprovado' | 'atencao' | 'reprovado' | 'pendente'
type AcaoStatusKey = 'a_atribuir' | 'a_iniciar' | 'em_andamento' | 'cancelado' | 'concluido'
type RespostaKey = 'ok' | 'nao_conforme' | 'na'

const STATUS_CONFIG: Record<StatusKey, { label: string; icon: React.ElementType; color: string; bg: string; border: string }> = {
  aprovado:  { label: 'Aprovado',  icon: CheckCircle2,  color: '#059669', bg: '#ecfdf5', border: '#a7f3d0' },
  atencao:   { label: 'Atenção',   icon: AlertTriangle, color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  reprovado: { label: 'Reprovado', icon: XCircle,       color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
  pendente:  { label: 'Pendente',  icon: Clock,         color: '#6b7280', bg: '#f9fafb', border: '#e5e7eb' },
}

const TIPO_CONFIG: Record<string, { color: string; bg: string; border: string }> = {
  'Extintor':  { color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe' },
  'Hidrante':  { color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0' },
  'Sprinkler': { color: '#7e22ce', bg: '#faf5ff', border: '#e9d5ff' },
  'Detector':  { color: '#c2410c', bg: '#fff7ed', border: '#fed7aa' },
}

const ACAO_STATUS_CONFIG: Record<AcaoStatusKey, { label: string; color: string }> = {
  a_atribuir:   { label: 'A Atribuir',   color: '#6b7a90' },
  a_iniciar:    { label: 'A Iniciar',     color: '#3b82f6' },
  em_andamento: { label: 'Em Andamento',  color: '#f59e0b' },
  cancelado:    { label: 'Cancelado',     color: '#ef4444' },
  concluido:    { label: 'Concluído',     color: '#10b981' },
}

const RESPOSTA_CONFIG: Record<RespostaKey, { label: string; icon: React.ElementType; color: string; bg: string; border: string }> = {
  ok:           { label: 'Conforme',      icon: CheckCircle2,  color: '#059669', bg: '#ecfdf5', border: '#a7f3d0' },
  nao_conforme: { label: 'Não Conforme',  icon: XCircle,       color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
  na:           { label: 'Não Aplicável', icon: MinusCircle,   color: '#6b7280', bg: '#f9fafb', border: '#e5e7eb' },
}

// ─── Mock — substituir por fetch real ─────────────────────────────────────────
const MOCK_INSPECAO = {
  id: 'INS-0041',
  equipId: 'EQ-9921',
  equipamento: 'Extintor CO₂ – Bloco A',
  tipo: 'Extintor',
  inspetor: 'Carlos Mendes',
  regional: 'Metropolitana',
  data: '2026-03-19T10:32:00',
  status: 'aprovado' as StatusKey,
  latitude: -23.5505,
  longitude: -46.6333,
  checklist: [
    { id: 'c1', pergunta: 'Selo de garantia intacto?',              resposta: 'ok'           as RespostaKey },
    { id: 'c2', pergunta: 'Manômetro na faixa verde?',              resposta: 'ok'           as RespostaKey },
    { id: 'c3', pergunta: 'Mangueira e bico sem obstruções?',       resposta: 'nao_conforme' as RespostaKey },
    { id: 'c4', pergunta: 'Pino de segurança e lacre presentes?',   resposta: 'ok'           as RespostaKey },
    { id: 'c5', pergunta: 'Rótulo legível e dentro da validade?',   resposta: 'ok'           as RespostaKey },
    { id: 'c6', pergunta: 'Extintor acessível e sinalizado?',       resposta: 'na'           as RespostaKey },
  ],
  acaoCorretiva: {
    status: 'em_andamento' as AcaoStatusKey,
    dataVencimento: '2026-04-10',
    titulo: 'Substituição da mangueira',
    descricao: 'A mangueira apresenta rachadura próxima ao bico. Deve ser substituída antes do prazo de vencimento.',
    numNaoConformidade: 'c3',
    empresaResponsavel: 'SafeFire Manutenção Ltda.',
    nomeResponsavel: 'Ricardo Pinto',
    emailsCopia: 'seguranca@empresa.com, manutencao@empresa.com',
  },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const sectionTitleCls = 'text-[11px] font-bold uppercase tracking-widest text-[#9ca3af] px-6 py-3 bg-[#f8fafc] border-b border-[#e3e8ef]'
const labelCls = 'text-[11px] font-bold uppercase tracking-widest text-[#9ca3af]'
const valueCls = 'text-[13.5px] font-semibold text-[#111827] mt-0.5'

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid gap-1 px-6 py-4 border-b border-[#f1f5f9] last:border-0 grid-cols-1 sm:grid-cols-[200px_1fr] sm:items-center">
      <span className={labelCls}>{label}</span>
      <span className={valueCls}>{value}</span>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function DetalhesInspecaoPage() {
  const router = useRouter()
  const params = useParams()
  const { data: session } = useSession()

  const [inspecao, setInspecao] = useState<typeof MOCK_INSPECAO | null>(null)
  const [loading, setLoading]   = useState(true)
  const [tab, setTab]           = useState<'checklist' | 'acao'>('checklist')

  const id = params?.id as string

  useEffect(() => {
    const fetch_ = async () => {
      setLoading(true)
      try {
        // const token = (session as any)?.access_token || (session as any)?.accessToken
        // const res = await fetch(`http://localhost:3001/inspecoes/${id}`, { headers: { Authorization: `Bearer ${token}` } })
        // setInspecao(await res.json())
        await new Promise(r => setTimeout(r, 500))
        setInspecao(MOCK_INSPECAO)
      } catch { console.error('Falha ao carregar') }
      finally { setLoading(false) }
    }
    fetch_()
  }, [id, session])

  if (loading) {
    return (
      <DashboardLayout title="Detalhes da Inspeção">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 size={36} className="animate-spin text-[#3d6cf0]" />
        </div>
      </DashboardLayout>
    )
  }

  if (!inspecao) {
    return (
      <DashboardLayout title="Detalhes da Inspeção">
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
          <AlertCircle size={40} className="text-[#c4cbd6]" />
          <p className="text-[14px] font-semibold text-[#9ca3af]">Inspeção não encontrada</p>
          <button onClick={() => router.back()} className="text-[12px] font-bold text-[#3d6cf0] hover:underline">
            ← Voltar para listagem
          </button>
        </div>
      </DashboardLayout>
    )
  }

  const statusCfg  = STATUS_CONFIG[inspecao.status] ?? STATUS_CONFIG.pendente
  const StatusIcon = statusCfg.icon
  const tipoCfg    = TIPO_CONFIG[inspecao.tipo] ?? { color: '#4b5563', bg: '#f8fafc', border: '#e3e8ef' }
  const dt         = new Date(inspecao.data)

  const totalItens    = inspecao.checklist.length
  const conformes     = inspecao.checklist.filter(c => c.resposta === 'ok').length
  const naoConformes  = inspecao.checklist.filter(c => c.resposta === 'nao_conforme').length
  const naoAplicaveis = inspecao.checklist.filter(c => c.resposta === 'na').length
  const temAcao       = !!inspecao.acaoCorretiva

  const TABS = [
    { key: 'checklist' as const, label: 'Checklist', icon: ClipboardList },
    { key: 'acao'      as const, label: 'Ação Corretiva', icon: Wrench },
  ]

  return (
    <DashboardLayout title="Detalhes da Inspeção">
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeUp { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:none; } }
        .fade-up { animation: fadeUp 0.2s ease forwards; }
      ` }} />

      <div className="w-full flex flex-col bg-[#f4f6f9] min-h-[calc(100vh-60px)]">

        {/* ── Breadcrumb ── */}
        <div className="bg-white border-b border-[#e3e8ef] px-7 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[13px] text-[#9ca3af]">
            <button
              onClick={() => router.push('/inspecao')}
              className="hover:text-[#3d6cf0] transition-colors flex items-center gap-1.5 font-medium"
            >
              <ArrowLeft size={14} /> Inspeções
            </button>
            <span className="text-[11px]">›</span>
            <span className="text-[#3d6cf0] font-semibold">{inspecao.id}</span>
          </div>
          <button
            onClick={() => router.push(`/inspecao/editar/${inspecao.id}`)}
            className="flex items-center gap-2 px-4 py-2 bg-[#3d6cf0] text-white rounded-xl text-xs font-black hover:bg-[#3460d8] transition-all"
          >
            <Edit2 size={13} /> EDITAR
          </button>
        </div>

        {/* ── Tab bar ── */}
        <div className="bg-white border-b border-[#e3e8ef] px-7 flex overflow-x-auto">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                'flex items-center gap-2 px-5 py-4 text-[13.5px] border-b-[2.5px] whitespace-nowrap transition-all -mb-px',
                tab === t.key
                  ? 'text-[#3d6cf0] border-[#3d6cf0] font-semibold'
                  : 'text-[#9ca3af] border-transparent hover:text-[#374151]'
              )}
            >
              {t.label}
              {t.key === 'acao' && temAcao && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              )}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-4 sm:px-8 pt-6 pb-12">

          {/* ══ TAB CHECKLIST ══ */}
          {tab === 'checklist' && (
            <div className="fade-up space-y-4">

              {/* Cabeçalho da inspeção */}
              <div className="bg-white border border-[#e3e8ef] rounded-xl shadow-sm overflow-hidden">
                <div className={sectionTitleCls}>Resumo da Inspeção</div>

                {/* Hero com status */}
                <div className="px-6 py-5 flex items-start justify-between gap-4 border-b border-[#f1f5f9]">
                  <div className="flex items-start gap-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 border"
                      style={{ background: tipoCfg.bg, borderColor: tipoCfg.border }}
                    >
                      <ShieldCheck size={22} style={{ color: tipoCfg.color }} />
                    </div>
                    <div>
                      <p className="text-[18px] font-black text-[#111827] leading-tight">{inspecao.equipamento}</p>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span
                          className="inline-flex px-2 py-0.5 rounded text-[9px] font-black uppercase border"
                          style={{ background: tipoCfg.bg, color: tipoCfg.color, borderColor: tipoCfg.border }}
                        >
                          {inspecao.tipo}
                        </span>
                        <span className="text-[11px] font-mono text-[#9ca3af] bg-[#f1f5f9] px-1.5 py-0.5 rounded">{inspecao.equipId}</span>
                      </div>
                    </div>
                  </div>
                  <span
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold border flex-shrink-0"
                    style={{ background: statusCfg.bg, color: statusCfg.color, borderColor: statusCfg.border }}
                  >
                    <StatusIcon size={11} strokeWidth={2.5} />
                    {statusCfg.label}
                  </span>
                </div>

                {/* Dados principais */}
                <InfoRow label="ID da Inspeção"  value={<span className="font-black text-[#3d6cf0]">{inspecao.id}</span>} />
                <InfoRow label="Data / Hora"
                  value={
                    <div className="flex items-center gap-2">
                      <Calendar size={13} className="text-[#9ca3af]" />
                      <span>{dt.toLocaleDateString('pt-BR')} às {dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  }
                />
                <InfoRow label="Inspetor"
                  value={
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-[#eef2ff] flex items-center justify-center text-[10px] font-black text-[#3d6cf0]">
                        {inspecao.inspetor.charAt(0)}
                      </div>
                      <span>{inspecao.inspetor}</span>
                    </div>
                  }
                />
                <InfoRow label="Regional"
                  value={
                    <div className="flex items-center gap-1.5">
                      <MapPin size={13} className="text-[#9ca3af]" />
                      <span>{inspecao.regional}</span>
                    </div>
                  }
                />
                {inspecao.latitude && (
                  <InfoRow label="Coordenadas"
                    value={
                      <span className="text-[12px] font-mono text-[#6b7280]">
                        {inspecao.latitude.toFixed(4)}, {inspecao.longitude.toFixed(4)}
                      </span>
                    }
                  />
                )}
              </div>

              {/* Cards de resumo */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Conformes',      value: conformes,     color: '#059669', bg: '#ecfdf5', border: '#a7f3d0', icon: CheckCircle2  },
                  { label: 'Não Conformes',  value: naoConformes,  color: '#dc2626', bg: '#fef2f2', border: '#fecaca', icon: XCircle       },
                  { label: 'Não Aplicáveis', value: naoAplicaveis, color: '#6b7280', bg: '#f9fafb', border: '#e5e7eb', icon: MinusCircle   },
                ].map(({ label, value, color, bg, border, icon: Icon }) => (
                  <div key={label} className="bg-white border border-[#e3e8ef] rounded-xl p-4 text-center shadow-sm">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-2 border"
                      style={{ background: bg, borderColor: border }}
                    >
                      <Icon size={15} style={{ color }} />
                    </div>
                    <p className="text-[22px] font-black" style={{ color }}>{value}</p>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-[#9ca3af] mt-0.5">{label}</p>
                  </div>
                ))}
              </div>

              {/* Itens do checklist */}
              <div className="bg-white border border-[#e3e8ef] rounded-xl shadow-sm overflow-hidden">
                <div className={sectionTitleCls}>Itens Verificados — {totalItens} itens</div>
                <div className="divide-y divide-[#f1f5f9]">
                  {inspecao.checklist.map((item, idx) => {
                    const cfg  = RESPOSTA_CONFIG[item.resposta]
                    const Icon = cfg.icon
                    return (
                      <div key={item.id} className="px-6 py-4 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <span className="text-[10px] font-black text-[#d1d5db] w-5 flex-shrink-0 tabular-nums">
                            {String(idx + 1).padStart(2, '0')}
                          </span>
                          <p className="text-[13.5px] font-medium text-[#111827] leading-snug">{item.pergunta}</p>
                        </div>
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold border flex-shrink-0"
                          style={{ background: cfg.bg, color: cfg.color, borderColor: cfg.border }}
                        >
                          <Icon size={11} />
                          {cfg.label}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ══ TAB AÇÃO CORRETIVA ══ */}
          {tab === 'acao' && (
            <div className="fade-up space-y-4">
              {!temAcao ? (
                <div className="bg-white border border-[#e3e8ef] rounded-xl shadow-sm py-16 text-center">
                  <div className="w-12 h-12 rounded-full bg-[#f4f6f9] flex items-center justify-center mx-auto mb-3">
                    <CheckCircle size={22} className="text-[#c4cbd6]" />
                  </div>
                  <p className="text-[14px] font-semibold text-[#9ca3af]">Nenhuma ação corretiva registrada</p>
                  <p className="text-[12px] text-[#c4cbd6] mt-1">Esta inspeção não possui não conformidades</p>
                </div>
              ) : (() => {
                const acao     = inspecao.acaoCorretiva!
                const acaoCfg  = ACAO_STATUS_CONFIG[acao.status]
                const ncItem   = inspecao.checklist.find(c => c.id === acao.numNaoConformidade)
                return (
                  <>
                    {/* Status */}
                    <div className="bg-white border border-[#e3e8ef] rounded-xl shadow-sm overflow-hidden">
                      <div className={sectionTitleCls}>Status da Ação</div>
                      <div className="px-6 py-4 flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: acaoCfg.color }} />
                        <span className="text-[14px] font-bold" style={{ color: acaoCfg.color }}>{acaoCfg.label}</span>
                      </div>
                    </div>

                    {/* Detalhes */}
                    <div className="bg-white border border-[#e3e8ef] rounded-xl shadow-sm overflow-hidden">
                      <div className={sectionTitleCls}>Detalhes</div>
                      <InfoRow label="Título"        value={acao.titulo} />
                      <InfoRow label="Data Limite"
                        value={
                          <div className="flex items-center gap-2">
                            <Calendar size={13} className="text-[#9ca3af]" />
                            <span>{new Date(acao.dataVencimento + 'T00:00:00').toLocaleDateString('pt-BR')}</span>
                          </div>
                        }
                      />
                      <div className="px-6 py-4 border-b border-[#f1f5f9] last:border-0">
                        <p className={labelCls}>Descrição</p>
                        <p className="text-[13.5px] text-[#374151] mt-1.5 leading-relaxed">{acao.descricao}</p>
                      </div>
                      {ncItem && (
                        <div className="px-6 py-4 border-b border-[#f1f5f9]">
                          <p className={labelCls}>Não Conformidade Vinculada</p>
                          <div className="mt-2 flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-lg">
                            <XCircle size={13} className="text-red-400 flex-shrink-0" />
                            <p className="text-[12px] text-red-700 font-semibold">{ncItem.pergunta}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Responsável */}
                    <div className="bg-white border border-[#e3e8ef] rounded-xl shadow-sm overflow-hidden">
                      <div className={sectionTitleCls}>Responsável</div>
                      <InfoRow label="Empresa"        value={acao.empresaResponsavel} />
                      <InfoRow label="Responsável"
                        value={
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-[#eef2ff] flex items-center justify-center text-[10px] font-black text-[#3d6cf0]">
                              {acao.nomeResponsavel.charAt(0)}
                            </div>
                            <span>{acao.nomeResponsavel}</span>
                          </div>
                        }
                      />
                      {acao.emailsCopia && (
                        <InfoRow label="Cópia E-mail"
                          value={<span className="text-[12px] text-[#6b7280]">{acao.emailsCopia}</span>}
                        />
                      )}
                    </div>
                  </>
                )
              })()}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}