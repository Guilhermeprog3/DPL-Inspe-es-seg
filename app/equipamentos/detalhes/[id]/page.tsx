'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import {
  ArrowLeft, Edit2,
  CheckCircle2, AlertTriangle, XCircle, Clock,
  Flame, Droplets, Zap, Bell, Wind, Package, MapPin,
  AlertCircle, Loader2, ClipboardList, ShieldCheck, CalendarClock,
  Activity, Plus,  LayoutDashboard,
  ListChecks,
  Boxes,
  QrCode, 
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Config ───────────────────────────────────────────────────────────────────
type StatusEquip = 'ativo' | 'vencido' | 'manutencao' | 'inativo'

const navItems = [
  { section: 'Menu Principal' },
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { section: 'Operações' },
  { label: 'Realizar Inspeção', href: '/inspecao/nova', icon: ClipboardList },
  { label: 'Lista de Inspeções', href: '/inspecao/lista', icon: ListChecks },
  { section: 'Gestão' },
  { label: 'Equipamentos', href: '/equipamentos/lista', icon: Boxes },
  { label: 'QR Codes', href: '/qr-codes', icon: QrCode },
  { label: 'Locais', href: '/locais/lista', icon: MapPin },
]

const STATUS_CONFIG: Record<string, { label: string; icon: any; color: string; bg: string; border: string }> = {
  'ATIVO':      { label: 'Ativo',      icon: CheckCircle2,  color: '#059669', bg: '#ecfdf5', border: '#a7f3d0' },
  'VENCIDO':    { label: 'Vencido',    icon: AlertTriangle, color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  'MANUTENCAO': { label: 'Manutenção', icon: XCircle,       color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
  'INATIVO':    { label: 'Inativo',    icon: Clock,         color: '#6b7280', bg: '#f9fafb', border: '#e5e7eb' },
}

const TIPO_CONFIG: Record<string, { color: string; bg: string; border: string; icon: any }> = {
  'Extintor':                 { color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe', icon: Flame    },
  'Hidrante':                 { color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0', icon: Droplets },
  'Iluminação de Emergência': { color: '#b45309', bg: '#fffbeb', border: '#fde68a', icon: Zap      },
  'Botoeiras e Sirenes':      { color: '#7c3aed', bg: '#faf5ff', border: '#e9d5ff', icon: Bell     },
  'Detector de Fumaça':       { color: '#c2410c', bg: '#fff7ed', border: '#fed7aa', icon: Wind     },
}

const INSP_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  aprovado:  { label: 'Aprovado',  color: '#059669', bg: '#ecfdf5', border: '#a7f3d0' },
  atencao:   { label: 'Atenção',   color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  reprovado: { label: 'Reprovado', color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
  pendente:  { label: 'Pendente',  color: '#6b7280', bg: '#f9fafb', border: '#e5e7eb' },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const sectionTitleCls = 'text-[11px] font-bold uppercase tracking-widest text-[#9ca3af] px-6 py-3 bg-[#f8fafc] border-b border-[#e3e8ef]'
const labelCls        = 'text-[11px] font-bold uppercase tracking-widest text-[#9ca3af]'
const valueCls        = 'text-[13.5px] font-semibold text-[#111827] mt-0.5'

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid gap-1 px-6 py-4 border-b border-[#f1f5f9] last:border-0 grid-cols-1 sm:grid-cols-[220px_1fr] sm:items-center">
      <span className={labelCls}>{label}</span>
      <span className={valueCls}>{value}</span>
    </div>
  )
}

function fmt(dateStr?: string | null) {
  if (!dateStr) return '—'
  try { return new Date(dateStr).toLocaleDateString('pt-BR') } catch { return '—' }
}

const TABS = [
  { key: 'dados'     as const, label: 'Dados',     icon: Package      },
  { key: 'historico' as const, label: 'Histórico', icon: ClipboardList },
] as const
type TabKey = typeof TABS[number]['key']

// ─── Inner ────────────────────────────────────────────────────────────────────
function DetalhesInner() {
  const router = useRouter()
  const params = useParams()
  const { data: session } = useSession()

  const id = params?.id as string

  const [equip, setEquip]     = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab]         = useState<TabKey>('dados')

  useEffect(() => {
    if (!session || !id) return
    const fetchEquip = async () => {
      setLoading(true)
      try {
        const token = (session as any)?.access_token || (session as any)?.accessToken
        const res = await fetch(`http://localhost:3001/equipamentos/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) throw new Error()
        setEquip(await res.json())
      } catch {
        alert('Erro ao carregar equipamento.')
        router.push('/equipamentos/lista')
      } finally { setLoading(false) }
    }
    fetchEquip()
  }, [id, session])

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 size={36} className="animate-spin text-[#3d6cf0]" />
    </div>
  )

  if (!equip) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
      <AlertCircle size={40} className="text-[#c4cbd6]" />
      <p className="text-[14px] font-semibold text-[#9ca3af]">Equipamento não encontrado</p>
      <button onClick={() => router.push('/equipamentos/lista')} className="text-[12px] font-bold text-[#3d6cf0] hover:underline">← Voltar</button>
    </div>
  )

  const isExtintor  = equip.tipo === 'Extintor'
  const statusKey   = (equip.status ?? '').toUpperCase()
  const statusCfg   = STATUS_CONFIG[statusKey] ?? STATUS_CONFIG['INATIVO']
  const StatusIcon  = statusCfg.icon
  const tipoCfg     = TIPO_CONFIG[equip.tipo] ?? { color: '#4b5563', bg: '#f8fafc', border: '#e3e8ef', icon: Package }
  const TipoIcon    = tipoCfg.icon
  const historico   = equip.inspecoes ?? []

  // Alerta de validade da recarga
  const recargaDate = equip.proximaRecarga ? new Date(equip.proximaRecarga) : null
  const hoje        = new Date()
  const diasRecarga = recargaDate ? Math.ceil((recargaDate.getTime() - hoje.getTime()) / 86400000) : null
  const recargaVencida  = diasRecarga !== null && diasRecarga <= 0
  const recargaVencendo = diasRecarga !== null && diasRecarga > 0 && diasRecarga <= 30

  return (
    <div className="w-full flex flex-col bg-[#f4f6f9] min-h-[calc(100vh-60px)]">

      {/* Breadcrumb */}
      <div className="bg-white border-b border-[#e3e8ef] px-7 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[13px] text-[#9ca3af]">
          <button onClick={() => router.push('/equipamentos/lista')}
            className="hover:text-[#3d6cf0] transition-colors flex items-center gap-1.5 font-medium">
            <ArrowLeft size={14} /> Equipamentos
          </button>
          <span className="text-[11px]">›</span>
          <span className="text-[#3d6cf0] font-semibold">{equip.codigo}</span>
        </div>
        <button onClick={() => router.push(`/equipamentos/editar/${id}`)}
          className="flex items-center gap-2 px-4 py-2 bg-[#3d6cf0] text-white rounded-xl text-xs font-black hover:bg-[#3460d8] transition-all">
          <Edit2 size={13} /> EDITAR
        </button>
      </div>

      {/* Tab bar */}
      <div className="bg-white border-b border-[#e3e8ef] px-7 flex overflow-x-auto">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} className={cn(
            'flex items-center gap-2 px-5 py-4 text-[13.5px] border-b-[2.5px] whitespace-nowrap transition-all -mb-px',
            tab === t.key ? 'text-[#3d6cf0] border-[#3d6cf0] font-semibold' : 'text-[#9ca3af] border-transparent hover:text-[#374151]'
          )}>
            {t.label}
            {t.key === 'historico' && historico.length > 0 && (
              <span className="text-[10px] font-black text-[#9ca3af] bg-[#f1f5f9] px-1.5 py-0.5 rounded-full">{historico.length}</span>
            )}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 sm:px-8 pt-6 pb-12">

        {/* ══ TAB DADOS ══ */}
        {tab === 'dados' && (
          <div className="fade-up space-y-4">

            {/* Hero */}
            <div className="bg-white border border-[#e3e8ef] rounded-xl shadow-sm overflow-hidden">
              <div className={sectionTitleCls}>Identificação</div>
              <div className="px-6 py-5 flex items-start justify-between gap-4 border-b border-[#f1f5f9] flex-wrap">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 border"
                    style={{ background: tipoCfg.bg, borderColor: tipoCfg.border }}>
                    <TipoIcon size={26} style={{ color: tipoCfg.color }} />
                  </div>
                  <div>
                    <p className="text-[20px] font-black text-[#111827] leading-tight">
                      {equip.nome || equip.tipo}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-black uppercase border"
                        style={{ background: tipoCfg.bg, color: tipoCfg.color, borderColor: tipoCfg.border }}>
                        <TipoIcon size={9} />{equip.tipo}
                      </span>
                      <span className="text-[11px] font-mono text-[#9ca3af] bg-[#f1f5f9] px-1.5 py-0.5 rounded">{equip.codigo}</span>
                    </div>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold border flex-shrink-0"
                  style={{ background: statusCfg.bg, color: statusCfg.color, borderColor: statusCfg.border }}>
                  <StatusIcon size={11} strokeWidth={2.5} /> {statusCfg.label}
                </span>
              </div>

              {/* Local */}
              <InfoRow label="Local / Ponto" value={
                <div className="flex items-center gap-2">
                  <MapPin size={13} className="text-[#9ca3af] flex-shrink-0" />
                  <span>{equip.pontoInstalacao?.nome || 'Em Estoque'}</span>
                </div>
              } />
              {equip.pontoInstalacao?.regional && <InfoRow label="Regional" value={equip.pontoInstalacao.regional} />}
              {equip.pontoInstalacao?.base && <InfoRow label="Base" value={equip.pontoInstalacao.base} />}
            </div>

            {/* Extintor — dados técnicos */}
            {isExtintor && (
              <div className="bg-white border-2 border-[#bfdbfe] rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-3 bg-blue-50 border-b border-[#bfdbfe] flex items-center gap-2">
                  <Flame size={14} className="text-[#1d4ed8]" />
                  <span className="text-[11px] font-bold uppercase tracking-widest text-[#1d4ed8]">Dados Técnicos do Extintor</span>
                </div>
                {equip.extintorClasse  && <InfoRow label="Classe"           value={equip.extintorClasse} />}
                {equip.extintorCarga   && <InfoRow label="Carga"            value={`${equip.extintorCarga} kg`} />}
                {equip.agente          && <InfoRow label="Agente Extintor"  value={equip.agente} />}
                {equip.serieCilindro   && <InfoRow label="Nº Série Cilindro" value={<span className="font-mono text-[12px]">{equip.serieCilindro}</span>} />}
                {equip.serieInmetro    && (
                  <InfoRow label="Nº Selo INMETRO" value={
                    <div className="flex items-center gap-2">
                      <ShieldCheck size={13} className="text-emerald-500" />
                      <span className="font-mono text-[12px]">{equip.serieInmetro}</span>
                    </div>
                  } />
                )}
                {equip.proximaRecarga && (
                  <InfoRow label="Validade da Recarga" value={
                    <div className="flex items-center gap-2">
                      <CalendarClock size={13} className={recargaVencida ? 'text-red-500' : recargaVencendo ? 'text-amber-500' : 'text-[#9ca3af]'} />
                      <span className={cn('font-bold', recargaVencida ? 'text-red-500' : recargaVencendo ? 'text-amber-500' : 'text-[#111827]')}>
                        {fmt(equip.proximaRecarga)}
                      </span>
                      {recargaVencida  && <span className="text-[10px] text-red-400 font-bold bg-red-50 border border-red-100 px-2 py-0.5 rounded-full">Vencida há {Math.abs(diasRecarga!)}d</span>}
                      {recargaVencendo && <span className="text-[10px] text-amber-400 font-bold bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full">Vence em {diasRecarga}d</span>}
                    </div>
                  } />
                )}
              </div>
            )}

            {/* Identificação / séries */}
            <div className="bg-white border border-[#e3e8ef] rounded-xl shadow-sm overflow-hidden">
              <div className={sectionTitleCls}>Identificação</div>
              <InfoRow label={isExtintor ? 'Nº Série Cilindro' : 'Nº Série / Patrimônio'}
                value={<span className="font-mono text-[12px]">{equip.codigo}</span>} />
              {equip.agente && !isExtintor && <InfoRow label="Agente / Especificação" value={equip.agente} />}
            </div>
          </div>
        )}

        {/* ══ TAB HISTÓRICO ══ */}
        {tab === 'historico' && (
          <div className="fade-up space-y-4">
            <div className="bg-white border border-[#e3e8ef] rounded-xl shadow-sm overflow-hidden">
              <div className="flex items-center justify-between pr-4">
                <div className={cn(sectionTitleCls, 'flex-1')}>
                  Histórico de Inspeções — {historico.length} registros
                </div>
                {equip.pontoInstalacao && (
                  <button onClick={() => router.push(`/inspecao/nova?pontoId=${equip.pontoInstalacao.id}`)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#3d6cf0] text-white rounded-lg text-[11px] font-black">
                    <Plus size={12} /> Nova Inspeção
                  </button>
                )}
              </div>

              {historico.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <Activity size={28} className="text-[#c4cbd6] mx-auto mb-2" />
                  <p className="text-[13px] text-[#9ca3af]">Nenhuma inspeção registrada</p>
                </div>
              ) : (
                <div className="divide-y divide-[#f1f5f9]">
                  {historico.map((ins: any, idx: number) => {
                    const cfg = INSP_STATUS_CONFIG[ins.status?.toLowerCase()] ?? INSP_STATUS_CONFIG.pendente
                    const dt  = new Date(ins.data)
                    return (
                      <div key={ins.id}
                        className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-[#fafbff] transition-colors cursor-pointer"
                        onClick={() => router.push(`/inspecao/${ins.id}`)}>
                        <div className="flex items-center gap-4">
                          <div className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-[10px] font-black flex-shrink-0"
                            style={{ borderColor: cfg.border, background: cfg.bg, color: cfg.color }}>
                            {historico.length - idx}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-black text-[#3d6cf0] text-[13px]">{ins.id.slice(-8).toUpperCase()}</span>
                              <span className="inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold border"
                                style={{ background: cfg.bg, color: cfg.color, borderColor: cfg.border }}>
                                {cfg.label}
                              </span>
                            </div>
                            <div className="text-[11px] text-[#9ca3af] mt-0.5">
                              {dt.toLocaleDateString('pt-BR')} · {dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
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
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function DetalhesEquipamentoPage() {
  return (
    <DashboardLayout navItems={navItems} title="Detalhes do Equipamento">
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeUp { from{opacity:0;transform:translateY(6px);}to{opacity:1;transform:none;} }
        .fade-up { animation: fadeUp 0.2s ease forwards; }
      `}} />
      <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh]"><Loader2 size={36} className="animate-spin text-[#3d6cf0]" /></div>}>
        <DetalhesInner />
      </Suspense>
    </DashboardLayout>
  )
}