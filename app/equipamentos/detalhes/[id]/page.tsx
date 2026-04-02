'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import {
  ArrowLeft, Edit2, CheckCircle2, AlertTriangle, XCircle, Clock,
  Flame, Droplets, Waves, Radio, Package, MapPin, Calendar,
  AlertCircle, Loader2, ClipboardList, Wrench, Building2, Hash,
  Activity,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Tipos / Config ───────────────────────────────────────────────────────────
type StatusEquip = 'ativo' | 'vencido' | 'manutencao' | 'inativo'

const STATUS_CONFIG: Record<StatusEquip, {
  label: string; icon: React.ElementType; color: string; bg: string; border: string
}> = {
  ativo:      { label: 'Ativo',      icon: CheckCircle2,  color: '#059669', bg: '#ecfdf5', border: '#a7f3d0' },
  vencido:    { label: 'Vencido',    icon: AlertTriangle, color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  manutencao: { label: 'Manutenção', icon: XCircle,       color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
  inativo:    { label: 'Inativo',    icon: Clock,         color: '#6b7280', bg: '#f9fafb', border: '#e5e7eb' },
}

const TIPO_CONFIG: Record<string, { color: string; bg: string; border: string; icon: React.ElementType }> = {
  'Extintor':  { color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe', icon: Flame    },
  'Hidrante':  { color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0', icon: Droplets },
  'Sprinkler': { color: '#7e22ce', bg: '#faf5ff', border: '#e9d5ff', icon: Waves    },
  'Detector':  { color: '#c2410c', bg: '#fff7ed', border: '#fed7aa', icon: Radio    },
}

const INSP_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  aprovado:  { label: 'Aprovado',  color: '#059669', bg: '#ecfdf5', border: '#a7f3d0' },
  atencao:   { label: 'Atenção',   color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  reprovado: { label: 'Reprovado', color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
  pendente:  { label: 'Pendente',  color: '#6b7280', bg: '#f9fafb', border: '#e5e7eb' },
}

// ─── Mock ─────────────────────────────────────────────────────────────────────
const MOCK_EQUIP = {
  id:               'EQ-9921',
  nome:             'Extintor CO₂ – Bloco A',
  tipo:             'Extintor',
  local:            'Bloco A – Térreo',
  regional:         'Metropolitana',
  fabricante:       'Amerex',
  modelo:           'B260',
  capacidade:       '6 kg',
  agente:           'CO₂',
  numeroSerie:      'AMX-2024-9921',
  dataFabricacao:   '2022-04-15',
  ultimaRecarga:    '2024-11-20',
  proximaRecarga:   '2026-11-20',
  ultimaInspecao:   '2026-03-19',
  proximaInspecao:  '2026-09-19',
  status:           'ativo' as StatusEquip,
  latitude:         -23.5505,
  longitude:        -46.6333,
  observacoes:      'Equipamento fixado na parede lateral esquerda da entrada do Bloco A. Acessível 24h.',
  historico: [
    { id: 'INS-0041', data: '2026-03-19T10:32:00', inspetor: 'Carlos Mendes', status: 'aprovado' },
    { id: 'INS-0029', data: '2025-09-10T09:15:00', inspetor: 'Ana Souza',     status: 'atencao'  },
    { id: 'INS-0017', data: '2025-03-05T14:00:00', inspetor: 'Carlos Mendes', status: 'aprovado' },
  ],
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const sectionTitleCls = 'text-[11px] font-bold uppercase tracking-widest text-[#9ca3af] px-6 py-3 bg-[#f8fafc] border-b border-[#e3e8ef]'
const labelCls        = 'text-[11px] font-bold uppercase tracking-widest text-[#9ca3af]'
const valueCls        = 'text-[13.5px] font-semibold text-[#111827] mt-0.5'

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid gap-1 px-6 py-4 border-b border-[#f1f5f9] last:border-0 grid-cols-1 sm:grid-cols-[200px_1fr] sm:items-center">
      <span className={labelCls}>{label}</span>
      <span className={valueCls}>{value}</span>
    </div>
  )
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────
const TABS = [
  { key: 'dados'     as const, label: 'Dados',           icon: Package      },
  { key: 'historico' as const, label: 'Histórico',       icon: ClipboardList },
] as const
type TabKey = typeof TABS[number]['key']

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function DetalhesEquipamentoPage() {
  const router = useRouter()
  const params = useParams()
  const { data: session } = useSession()

  const [equip, setEquip]   = useState<typeof MOCK_EQUIP | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab]       = useState<TabKey>('dados')

  const id = params?.id as string

  useEffect(() => {
    const fetch_ = async () => {
      setLoading(true)
      try {
        await new Promise(r => setTimeout(r, 500))
        setEquip(MOCK_EQUIP)
      } finally { setLoading(false) }
    }
    fetch_()
  }, [id, session])

  if (loading) return (
    <DashboardLayout title="Detalhes do Equipamento">
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={36} className="animate-spin text-[#3d6cf0]" />
      </div>
    </DashboardLayout>
  )

  if (!equip) return (
    <DashboardLayout title="Detalhes do Equipamento">
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <AlertCircle size={40} className="text-[#c4cbd6]" />
        <p className="text-[14px] font-semibold text-[#9ca3af]">Equipamento não encontrado</p>
        <button onClick={() => router.back()} className="text-[12px] font-bold text-[#3d6cf0] hover:underline">← Voltar</button>
      </div>
    </DashboardLayout>
  )

  const statusCfg  = STATUS_CONFIG[equip.status] ?? STATUS_CONFIG.inativo
  const StatusIcon = statusCfg.icon
  const tipoCfg    = TIPO_CONFIG[equip.tipo] ?? { color: '#4b5563', bg: '#f8fafc', border: '#e3e8ef', icon: Package }
  const TipoIcon   = tipoCfg.icon

  const proxDt    = new Date(equip.proximaInspecao + 'T00:00:00')
  const hoje      = new Date()
  const diasFalta = Math.ceil((proxDt.getTime() - hoje.getTime()) / 86400000)
  const vencendo  = diasFalta <= 30 && diasFalta > 0
  const vencido   = diasFalta <= 0

  return (
    <DashboardLayout title="Detalhes do Equipamento">
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeUp { from{opacity:0;transform:translateY(6px);}to{opacity:1;transform:none;} }
        .fade-up { animation: fadeUp 0.2s ease forwards; }
      `}} />

      <div className="w-full flex flex-col bg-[#f4f6f9] min-h-[calc(100vh-60px)]">

        {/* ── Breadcrumb ── */}
        <div className="bg-white border-b border-[#e3e8ef] px-7 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[13px] text-[#9ca3af]">
            <button onClick={() => router.push('/equipamentos')} className="hover:text-[#3d6cf0] transition-colors flex items-center gap-1.5 font-medium">
              <ArrowLeft size={14} /> Equipamentos
            </button>
            <span className="text-[11px]">›</span>
            <span className="text-[#3d6cf0] font-semibold">{equip.id}</span>
          </div>
          <button
            onClick={() => router.push(`/equipamentos/editar/${equip.id}`)}
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
              {t.key === 'historico' && (
                <span className="text-[10px] font-black text-[#9ca3af] bg-[#f1f5f9] px-1.5 py-0.5 rounded-full">
                  {equip.historico.length}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-4 sm:px-8 pt-6 pb-12">

          {/* ══ TAB DADOS ══ */}
          {tab === 'dados' && (
            <div className="fade-up space-y-4">

              {/* Hero card */}
              <div className="bg-white border border-[#e3e8ef] rounded-xl shadow-sm overflow-hidden">
                <div className={sectionTitleCls}>Identificação</div>

                {/* Hero com tipo + status */}
                <div className="px-6 py-5 flex items-start justify-between gap-4 border-b border-[#f1f5f9]">
                  <div className="flex items-start gap-4">
                    <div
                      className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 border"
                      style={{ background: tipoCfg.bg, borderColor: tipoCfg.border }}
                    >
                      <TipoIcon size={26} style={{ color: tipoCfg.color }} />
                    </div>
                    <div>
                      <p className="text-[20px] font-black text-[#111827] leading-tight">{equip.nome}</p>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-black uppercase border"
                          style={{ background: tipoCfg.bg, color: tipoCfg.color, borderColor: tipoCfg.border }}
                        >
                          <TipoIcon size={9} />{equip.tipo}
                        </span>
                        <span className="text-[11px] font-mono text-[#9ca3af] bg-[#f1f5f9] px-1.5 py-0.5 rounded">{equip.id}</span>
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

                <InfoRow label="Localização"
                  value={
                    <div className="flex items-center gap-2">
                      <MapPin size={13} className="text-[#9ca3af] flex-shrink-0" />
                      <span>{equip.local}</span>
                    </div>
                  }
                />
                <InfoRow label="Regional" value={equip.regional} />
                {equip.latitude && (
                  <InfoRow label="Coordenadas"
                    value={<span className="text-[12px] font-mono text-[#6b7280]">{equip.latitude.toFixed(4)}, {equip.longitude.toFixed(4)}</span>}
                  />
                )}
                {equip.observacoes && (
                  <div className="px-6 py-4 border-b border-[#f1f5f9] last:border-0">
                    <p className={labelCls}>Observações</p>
                    <p className="text-[13.5px] text-[#374151] mt-1.5 leading-relaxed">{equip.observacoes}</p>
                  </div>
                )}
              </div>

              {/* Especificações técnicas */}
              <div className="bg-white border border-[#e3e8ef] rounded-xl shadow-sm overflow-hidden">
                <div className={sectionTitleCls}>Especificações Técnicas</div>
                <InfoRow label="Fabricante"   value={<div className="flex items-center gap-2"><Building2 size={13} className="text-[#9ca3af]" />{equip.fabricante}</div>} />
                <InfoRow label="Modelo"       value={equip.modelo} />
                <InfoRow label="Nº de Série"  value={<span className="font-mono text-[12px]">{equip.numeroSerie}</span>} />
                <InfoRow label="Capacidade"   value={equip.capacidade} />
                {equip.agente && <InfoRow label="Agente Extintor" value={equip.agente} />}
                <InfoRow label="Fabricação"   value={<div className="flex items-center gap-2"><Calendar size={13} className="text-[#9ca3af]" />{new Date(equip.dataFabricacao + 'T00:00:00').toLocaleDateString('pt-BR')}</div>} />
              </div>

              {/* Datas de inspeção / recarga */}
              <div className="bg-white border border-[#e3e8ef] rounded-xl shadow-sm overflow-hidden">
                <div className={sectionTitleCls}>Manutenção & Inspeções</div>
                <InfoRow label="Última Recarga"    value={new Date(equip.ultimaRecarga + 'T00:00:00').toLocaleDateString('pt-BR')} />
                <InfoRow label="Próxima Recarga"   value={new Date(equip.proximaRecarga + 'T00:00:00').toLocaleDateString('pt-BR')} />
                <InfoRow label="Última Inspeção"   value={new Date(equip.ultimaInspecao + 'T00:00:00').toLocaleDateString('pt-BR')} />
                <InfoRow label="Próxima Inspeção"
                  value={
                    <div className="flex items-center gap-2">
                      <span className={cn('font-bold', vencido ? 'text-red-500' : vencendo ? 'text-amber-500' : 'text-[#111827]')}>
                        {proxDt.toLocaleDateString('pt-BR')}
                      </span>
                      {vencido && <span className="text-[10px] text-red-400 font-bold bg-red-50 border border-red-100 px-2 py-0.5 rounded-full">Vencida há {Math.abs(diasFalta)}d</span>}
                      {vencendo && <span className="text-[10px] text-amber-400 font-bold bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full">Vence em {diasFalta}d</span>}
                    </div>
                  }
                />
              </div>
            </div>
          )}

          {/* ══ TAB HISTÓRICO ══ */}
          {tab === 'historico' && (
            <div className="fade-up space-y-4">
              <div className="bg-white border border-[#e3e8ef] rounded-xl shadow-sm overflow-hidden">
                <div className={sectionTitleCls}>Histórico de Inspeções — {equip.historico.length} registros</div>

                {equip.historico.length === 0 ? (
                  <div className="px-6 py-12 text-center">
                    <Activity size={28} className="text-[#c4cbd6] mx-auto mb-2" />
                    <p className="text-[13px] text-[#9ca3af]">Nenhuma inspeção registrada</p>
                  </div>
                ) : (
                  <div className="divide-y divide-[#f1f5f9]">
                    {equip.historico.map((ins, idx) => {
                      const cfg = INSP_STATUS_CONFIG[ins.status] ?? INSP_STATUS_CONFIG.pendente
                      const dt  = new Date(ins.data)
                      return (
                        <div
                          key={ins.id}
                          className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-[#fafbff] transition-colors cursor-pointer"
                          onClick={() => router.push(`/inspecao/${ins.id}`)}
                        >
                          <div className="flex items-center gap-4">
                            {/* Linha do tempo */}
                            <div className="relative flex flex-col items-center flex-shrink-0">
                              <div
                                className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-[10px] font-black"
                                style={{ borderColor: cfg.border, background: cfg.bg, color: cfg.color }}
                              >
                                {equip.historico.length - idx}
                              </div>
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-black text-[#3d6cf0] text-[13px] hover:underline">{ins.id}</span>
                                <span
                                  className="inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold border"
                                  style={{ background: cfg.bg, color: cfg.color, borderColor: cfg.border }}
                                >
                                  {cfg.label}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 mt-0.5">
                                <span className="text-[11px] text-[#9ca3af]">
                                  {dt.toLocaleDateString('pt-BR')} · {dt.toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' })}
                                </span>
                                <span className="text-[11px] text-[#9ca3af]">·</span>
                                <span className="text-[11px] text-[#9ca3af]">{ins.inspetor}</span>
                              </div>
                            </div>
                          </div>
                          <ArrowLeft size={14} className="text-[#c4cbd6] rotate-180 flex-shrink-0" />
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}