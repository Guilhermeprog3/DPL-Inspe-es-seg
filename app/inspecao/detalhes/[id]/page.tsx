'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import {
  ArrowLeft, Edit2, CheckCircle2, AlertTriangle, XCircle, Clock,
  ShieldCheck, Wrench, MapPin, Calendar,
  ClipboardList, AlertCircle, Loader2, MinusCircle,CheckCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Tipos Reais (Sincronizados com o Backend) ────────────────────────────────
type StatusKey = 'APROVADO' | 'ATENCAO' | 'REPROVADO' | 'CANCELADA'
type RespostaKey = 'sim' | 'nao' | 'na'

interface ChecklistItem {
  id: string
  pergunta: string
  resposta: RespostaKey
}

interface AcaoCorretiva {
  id: string
  titulo: string
  descricao: string
  status: string
  dataVencimento: string
  empresaResponsavel: string
  nomeResponsavel: string
  numNC?: string
  emailsCopia?: string
}

interface InspecaoReal {
  id: string
  status: StatusKey
  data: string
  localNome: string
  uf: string
  regional: string
  base: string
  respostas: string // JSON string vindo do backend
  latitude?: number
  longitude?: number
  inspetor: { nome: string; sobrenome: string }
  equipamento: { codigo: string; tipo: string }
  acoesCorretivas: AcaoCorretiva[]
}

// ─── Configurações Visuais ───────────────────────────────────────────────────
const STATUS_CONFIG: Record<StatusKey, { label: string; icon: React.ElementType; color: string; bg: string; border: string }> = {
  APROVADO: { label: 'Aprovado', icon: CheckCircle2, color: '#059669', bg: '#ecfdf5', border: '#a7f3d0' },
  ATENCAO: { label: 'Atenção', icon: AlertTriangle, color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  REPROVADO: { label: 'Reprovado', icon: XCircle, color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
  CANCELADA: { label: 'Cancelada', icon: Clock, color: '#6b7280', bg: '#f9fafb', border: '#e5e7eb' },
}

const TIPO_CONFIG: Record<string, { color: string; bg: string; border: string }> = {
  'Extintor': { color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe' },
  'Hidrante': { color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0' },
  'Iluminação de Emergência': { color: '#b45309', bg: '#fffbeb', border: '#fde68a' },
  'Botoeiras e Sirenes': { color: '#7c3aed', bg: '#faf5ff', border: '#e9d5ff' },
  'Detector de Fumaça': { color: '#c2410c', bg: '#fff7ed', border: '#fed7aa' },
}

const RESPOSTA_CONFIG: Record<RespostaKey, { label: string; icon: React.ElementType; color: string; bg: string; border: string }> = {
  sim: { label: 'Conforme', icon: CheckCircle2, color: '#059669', bg: '#ecfdf5', border: '#a7f3d0' },
  nao: { label: 'Não Conforme', icon: XCircle, color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
  na: { label: 'N/A', icon: MinusCircle, color: '#6b7280', bg: '#f9fafb', border: '#e5e7eb' },
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

  const [inspecao, setInspecao] = useState<InspecaoReal | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'checklist' | 'acao'>('checklist')

  const id = params?.id as string

  useEffect(() => {
    const fetchInspecao = async () => {
      if (!id || !session) return
      setLoading(true)
      try {
        const token = (session as any)?.access_token || (session as any)?.accessToken
        const res = await fetch(`http://localhost:3001/inspecoes/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (!res.ok) throw new Error()
        const data = await res.json()
        setInspecao(data)
      } catch (error) {
        console.error('Falha ao carregar inspeção:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchInspecao()
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

  const checklistData: ChecklistItem[] = JSON.parse(inspecao.respostas)
  const statusCfg = STATUS_CONFIG[inspecao.status] || STATUS_CONFIG.CANCELADA
  const StatusIcon = statusCfg.icon
  const tipoCfg = TIPO_CONFIG[inspecao.equipamento.tipo] ?? { color: '#4b5563', bg: '#f8fafc', border: '#e3e8ef' }
  const dt = new Date(inspecao.data)

  const totalItens = checklistData.length
  const conformes = checklistData.filter(c => c.resposta === 'sim').length
  const naoConformes = checklistData.filter(c => c.resposta === 'nao').length
  const naoAplicaveis = checklistData.filter(c => c.resposta === 'na').length
  const temAcao = inspecao.acoesCorretivas.length > 0

  const TABS = [
    { key: 'checklist' as const, label: 'Checklist', icon: ClipboardList },
    { key: 'acao' as const, label: 'Ações Corretivas', icon: Wrench },
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
              onClick={() => router.push('/inspecao/lista')}
              className="hover:text-[#3d6cf0] transition-colors flex items-center gap-1.5 font-medium"
            >
              <ArrowLeft size={14} /> Inspeções
            </button>
            <span className="text-[11px]">›</span>
            <span className="text-[#3d6cf0] font-semibold">{inspecao.id.slice(-8).toUpperCase()}</span>
          </div>
          <button
            onClick={() => router.push(`/inspecao/editar/${inspecao.id}`)}
            className="flex items-center gap-2 px-4 py-2 bg-[#3d6cf0] text-white rounded-xl text-xs font-black hover:bg-[#3460d8] transition-all"
          >
            <Edit2 size={13} /> EDITAR
          </button>
        </div>

        {/* ── Tab bar ── */}
        <div className="bg-white border-b border-[#e3e8ef] px-7 flex overflow-x-auto shadow-sm">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                'flex items-center gap-2 px-5 py-4 text-[13.5px] border-b-[2.5px] whitespace-nowrap transition-all -mb-px',
                tab === t.key
                  ? 'text-[#3d6cf0] border-[#3d6cf0] font-bold'
                  : 'text-[#9ca3af] border-transparent hover:text-[#374151]'
              )}
            >
              {t.label}
              {t.key === 'acao' && temAcao && (
                <span className="w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] flex items-center justify-center font-black">
                  {inspecao.acoesCorretivas.length}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-4 sm:px-8 pt-6 pb-20">

          {/* ══ TAB CHECKLIST ══ */}
          {tab === 'checklist' && (
            <div className="fade-up space-y-4 max-w-4xl mx-auto">

              {/* Cabeçalho da inspeção */}
              <div className="bg-white border border-[#e3e8ef] rounded-xl shadow-sm overflow-hidden">
                <div className={sectionTitleCls}>Resumo da Inspeção</div>

                <div className="px-6 py-5 flex items-start justify-between gap-4 border-b border-[#f1f5f9]">
                  <div className="flex items-start gap-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 border"
                      style={{ background: tipoCfg.bg, borderColor: tipoCfg.border }}
                    >
                      <ShieldCheck size={22} style={{ color: tipoCfg.color }} />
                    </div>
                    <div>
                      <p className="text-[18px] font-black text-[#111827] leading-tight">{inspecao.localNome}</p>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span
                          className="inline-flex px-2 py-0.5 rounded text-[9px] font-black uppercase border"
                          style={{ background: tipoCfg.bg, color: tipoCfg.color, borderColor: tipoCfg.border }}
                        >
                          {inspecao.equipamento.tipo}
                        </span>
                        <span className="text-[11px] font-mono text-[#9ca3af] bg-[#f1f5f9] px-1.5 py-0.5 rounded">{inspecao.equipamento.codigo}</span>
                      </div>
                    </div>
                  </div>
                  <span
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-black border flex-shrink-0 uppercase tracking-tight"
                    style={{ background: statusCfg.bg, color: statusCfg.color, borderColor: statusCfg.border }}
                  >
                    <StatusIcon size={11} strokeWidth={3} />
                    {statusCfg.label}
                  </span>
                </div>

                <InfoRow label="ID do Sistema" value={<span className="font-mono text-[12px]">{inspecao.id}</span>} />
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
                        {inspecao.inspetor.nome.charAt(0)}
                      </div>
                      <span>{inspecao.inspetor.nome} {inspecao.inspetor.sobrenome}</span>
                    </div>
                  }
                />
                <InfoRow label="Regional / Base"
                  value={
                    <div className="flex items-center gap-1.5">
                      <MapPin size={13} className="text-[#9ca3af]" />
                      <span>{inspecao.base} · {inspecao.regional} ({inspecao.uf})</span>
                    </div>
                  }
                />
              </div>

              {/* Cards de resumo estatístico */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Conformes', value: conformes, color: '#059669', bg: '#ecfdf5', border: '#a7f3d0', icon: CheckCircle2 },
                  { label: 'Não Conformes', value: naoConformes, color: '#dc2626', bg: '#fef2f2', border: '#fecaca', icon: XCircle },
                  { label: 'N/A', value: naoAplicaveis, color: '#6b7280', bg: '#f9fafb', border: '#e5e7eb', icon: MinusCircle },
                ].map(({ label, value, color, bg, border, icon: Icon }) => (
                  <div key={label} className="bg-white border border-[#e3e8ef] rounded-xl p-4 text-center shadow-sm">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-2 border" style={{ background: bg, borderColor: border }}>
                      <Icon size={14} style={{ color }} />
                    </div>
                    <p className="text-[22px] font-black" style={{ color }}>{value}</p>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-[#9ca3af] mt-0.5">{label}</p>
                  </div>
                ))}
              </div>

              {/* Itens do checklist dinâmico */}
              <div className="bg-white border border-[#e3e8ef] rounded-xl shadow-sm overflow-hidden">
                <div className={sectionTitleCls}>Itens Verificados — {totalItens} itens</div>
                <div className="divide-y divide-[#f1f5f9]">
                  {checklistData.map((item, idx) => {
                    const cfg = RESPOSTA_CONFIG[item.resposta] || RESPOSTA_CONFIG.na
                    const Icon = cfg.icon
                    return (
                      <div key={item.id || idx} className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-[#fcfdfe] transition-colors">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <span className="text-[10px] font-black text-[#d1d5db] w-5 flex-shrink-0 tabular-nums mt-1">
                            {String(idx + 1).padStart(2, '0')}
                          </span>
                          <p className="text-[13.5px] font-medium text-[#374151] leading-snug">{item.pergunta}</p>
                        </div>
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black border flex-shrink-0 uppercase"
                          style={{ background: cfg.bg, color: cfg.color, borderColor: cfg.border }}
                        >
                          <Icon size={11} strokeWidth={3} />
                          {cfg.label}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ══ TAB AÇÕES CORRETIVAS ══ */}
          {tab === 'acao' && (
            <div className="fade-up space-y-4 max-w-4xl mx-auto">
              {!temAcao ? (
                <div className="bg-white border border-[#e3e8ef] border-dashed rounded-2xl py-20 text-center">
                  <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-4 border border-slate-100">
                    <CheckCircle className="text-emerald-500" size={32} />
                  </div>
                  <h3 className="text-lg font-black text-slate-700">Tudo em conformidade!</h3>
                  <p className="text-[13px] text-slate-400 mt-1">Nenhuma ação corretiva foi necessária para esta vistoria.</p>
                </div>
              ) : (
                inspecao.acoesCorretivas.map((acao, idx) => {
                  const ncRelacionada = checklistData.find(c => c.id === acao.numNC)
                  return (
                    <div key={acao.id} className="bg-white border border-[#e3e8ef] rounded-2xl shadow-sm overflow-hidden">
                      <div className="px-6 py-3 bg-amber-50/50 border-b border-amber-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 bg-amber-500 text-white rounded-md flex items-center justify-center text-[10px] font-black">{idx + 1}</span>
                          <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest">Ação Corretiva</span>
                        </div>
                        <span className="text-[10px] font-black bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full uppercase tracking-tighter">
                          {acao.status}
                        </span>
                      </div>
                      
                      <div className="p-6">
                        <h3 className="text-[16px] font-black text-slate-800 mb-2">{acao.titulo}</h3>
                        <p className="text-[13.5px] text-slate-500 leading-relaxed mb-6">{acao.descricao}</p>
                        
                        {ncRelacionada && (
                          <div className="mb-6 p-3 bg-red-50/50 border border-red-100 rounded-xl flex items-start gap-3">
                            <XCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-[10px] font-bold text-red-400 uppercase">Não Conformidade Origem</p>
                              <p className="text-[12px] text-red-700 font-semibold leading-tight">{ncRelacionada.pergunta}</p>
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t border-slate-50">
                          <div>
                            <p className={labelCls}>Responsável</p>
                            <div className="flex items-center gap-2 mt-1">
                               <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-[9px] font-bold text-blue-600 uppercase">
                                 {acao.nomeResponsavel.charAt(0)}
                               </div>
                               <p className="text-[13px] font-bold text-slate-700">{acao.nomeResponsavel}</p>
                            </div>
                            <p className="text-[11px] text-slate-400 ml-7">{acao.empresaResponsavel}</p>
                          </div>

                          <div>
                            <p className={labelCls}>Prazo Limite</p>
                            <p className="text-[13px] font-bold text-slate-700 flex items-center gap-2 mt-1">
                              <Calendar size={14} className="text-amber-500" />
                              {new Date(acao.dataVencimento).toLocaleDateString('pt-BR')}
                            </p>
                          </div>

                          <div>
                            <p className={labelCls}>Cópia de E-mail</p>
                            <p className="text-[11px] text-slate-500 mt-1 truncate" title={acao.emailsCopia || 'Nenhum'}>
                              {acao.emailsCopia || '—'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}