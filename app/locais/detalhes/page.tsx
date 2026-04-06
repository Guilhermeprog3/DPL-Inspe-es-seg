'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import {
  ArrowLeft, Edit2, Loader2,
  MapPin, Building2, Globe, QrCode, Package,
  Flame, Droplets, Waves, Radio, Zap, Bell, Wind,
  CheckCircle2, AlertTriangle, XCircle, Clock,
  ClipboardList, Activity, Plus,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import QRCode from 'qrcode'

// ─── Config Visual ────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; icon: any; color: string; bg: string; border: string }> = {
  'ATIVO':      { label: 'Ativo',      icon: CheckCircle2,  color: '#059669', bg: '#ecfdf5', border: '#a7f3d0' },
  'VENCIDO':    { label: 'Vencido',    icon: AlertTriangle, color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  'MANUTENCAO': { label: 'Manutenção', icon: XCircle,       color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
  'INATIVO':    { label: 'Inativo',    icon: Clock,         color: '#6b7280', bg: '#f9fafb', border: '#e5e7eb' },
}

const TIPO_CONFIG: Record<string, { color: string; bg: string; border: string; icon: any }> = {
  'Extintor':                  { color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe', icon: Flame    },
  'Hidrante':                  { color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0', icon: Droplets },
  'Iluminação de Emergência':  { color: '#b45309', bg: '#fffbeb', border: '#fde68a', icon: Zap      },
  'Botoeiras e Sirenes':       { color: '#7c3aed', bg: '#faf5ff', border: '#e9d5ff', icon: Bell     },
  'Detector de Fumaça':        { color: '#c2410c', bg: '#fff7ed', border: '#fed7aa', icon: Wind     },
  'Sprinkler':                 { color: '#0e7490', bg: '#ecfeff', border: '#a5f3fc', icon: Waves    },
  'Outro':                     { color: '#4b5563', bg: '#f8fafc', border: '#e3e8ef', icon: Package  },
}

const INSP_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  'CONCLUIDA': { label: 'Concluída', color: '#059669', bg: '#ecfdf5', border: '#a7f3d0' },
  'PENDENTE':  { label: 'Pendente',  color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  'CANCELADA': { label: 'Cancelada', color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
}

// ─── Componentes de UI ────────────────────────────────────────────────────────
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

const TABS = [
  { key: 'dados'     as const, label: 'Dados do Local', icon: MapPin        },
  { key: 'historico' as const, label: 'Histórico',      icon: ClipboardList },
] as const
type TabKey = typeof TABS[number]['key']

// ─── Página ───────────────────────────────────────────────────────────────────
export default function DetalhesLocalPage() {
  const router = useRouter()
  const params = useParams()
  const { data: session } = useSession()

  const id = params?.id as string

  const [local, setLocal]     = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab]         = useState<TabKey>('dados')
  const [qrDataUrl, setQrDataUrl] = useState('')

  // ── Carrega o ponto + equipamento + inspeções ────────────────────────────
  useEffect(() => {
    if (!session || !id) return
    const fetchLocal = async () => {
      setLoading(true)
      try {
        const token = (session as any).access_token || (session as any).accessToken
        const res = await fetch(`http://localhost:3001/pontos/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        setLocal(data)
      } catch {
        alert('Erro ao carregar dados do local.')
        router.push('/locais')
      } finally {
        setLoading(false)
      }
    }
    fetchLocal()
  }, [id, session, router])

  // ── Gera QR para exibição e download ─────────────────────────────────────
  useEffect(() => {
    if (!local?.qrCode) return
    QRCode.toDataURL(local.qrCode, {
      width: 300, margin: 2,
      color: { dark: '#0d1e33', light: '#ffffff' },
    })
      .then(setQrDataUrl)
      .catch(console.error)
  }, [local?.qrCode])

  if (loading) return (
    <DashboardLayout title="Detalhes do Local">
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={36} className="animate-spin text-[#3d6cf0]" />
      </div>
    </DashboardLayout>
  )

  if (!local) return null

  const equip      = local.equipamentoAtual
  const tipoCfg    = TIPO_CONFIG[equip?.tipo] ?? TIPO_CONFIG['Outro']
  const TipoIcon   = tipoCfg.icon
  // Normaliza o status para MAIÚSCULAS para bater com STATUS_CONFIG
  const statusKey  = (equip?.status ?? '').toUpperCase()
  const statusCfg  = STATUS_CONFIG[statusKey] ?? STATUS_CONFIG['INATIVO']
  const StatusIcon = statusCfg.icon
  // As inspeções vêm do include Prisma — fallback para array vazio
  const historico: any[] = local.inspecoes ?? []

  return (
    <DashboardLayout title="Detalhes do Local">
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeUp { from{opacity:0;transform:translateY(6px);}to{opacity:1;transform:none;} }
        .fade-up { animation: fadeUp 0.2s ease forwards; }
      `}} />

      <div className="w-full flex flex-col bg-[#f4f6f9] min-h-[calc(100vh-60px)]">

        {/* Breadcrumb & Actions */}
        <div className="bg-white border-b border-[#e3e8ef] px-7 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[13px] text-[#9ca3af]">
            <button
              onClick={() => router.push('/locais')}
              className="hover:text-[#3d6cf0] transition-colors flex items-center gap-1.5 font-medium"
            >
              <ArrowLeft size={14} /> Locais
            </button>
            <span className="text-[11px]">›</span>
            <span className="text-[#3d6cf0] font-semibold truncate max-w-[180px]">{local.qrCode}</span>
          </div>
          <button
            onClick={() => router.push(`/locais/${id}/editar`)}
            className="flex items-center gap-2 px-4 py-2 bg-[#3d6cf0] text-white rounded-xl text-xs font-black hover:bg-[#3460d8] transition-all"
          >
            <Edit2 size={13} /> EDITAR LOCAL
          </button>
        </div>

        {/* Tab bar */}
        <div className="bg-white border-b border-[#e3e8ef] px-7 flex overflow-x-auto shadow-sm">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                'flex items-center gap-2 px-5 py-4 text-[13.5px] border-b-[2.5px] transition-all -mb-px whitespace-nowrap',
                tab === t.key
                  ? 'text-[#3d6cf0] border-[#3d6cf0] font-bold'
                  : 'text-[#9ca3af] border-transparent hover:text-[#374151]',
              )}
            >
              {t.label}
              {t.key === 'historico' && historico.length > 0 && (
                <span className="text-[10px] font-black text-[#3d6cf0] bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                  {historico.length}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-4 sm:px-8 pt-6 pb-20">

          {/* ══ TAB DADOS ══ */}
          {tab === 'dados' && (
            <div className="fade-up space-y-4">

              {/* Header do local */}
              <div className="bg-white border border-[#e3e8ef] rounded-2xl shadow-sm overflow-hidden">
                <div className={sectionTitleCls}>Informações de Instalação</div>
                <div className="px-6 py-6 flex items-start gap-5 border-b border-[#f1f5f9] flex-wrap">
                  <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center border border-blue-100 text-[#3d6cf0]">
                    <MapPin size={32} />
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-xl font-black text-slate-800 leading-none">{local.nome}</h2>
                    <p className="text-sm text-slate-400 font-medium">
                      {local.base} · {local.regional} · {local.uf}
                    </p>
                    <div className="inline-block mt-2 px-2 py-1 bg-slate-100 rounded font-mono text-[11px] font-bold text-slate-500 uppercase">
                      QR: {local.qrCode}
                    </div>
                  </div>
                </div>
                <InfoRow label="Base / Unidade" value={local.base || 'Não informada'} />
                <InfoRow label="Regional"       value={local.regional || 'Não informada'} />
                <InfoRow label="Estado (UF)"    value={local.uf || '—'} />
                <InfoRow
                  label="Status"
                  value={
                    <span className={cn(
                      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold',
                      local.ativo
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-500 border border-slate-200',
                    )}>
                      {local.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  }
                />
              </div>

              {/* Equipamento atual */}
              <div className="bg-white border border-[#e3e8ef] rounded-2xl shadow-sm overflow-hidden">
                <div className={sectionTitleCls}>Equipamento Atualmente no Local</div>
                {equip ? (
                  <div className="p-6">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <div className="flex items-center gap-4">
                        <div
                          className="w-14 h-14 rounded-2xl flex items-center justify-center border-2 shadow-sm"
                          style={{ background: tipoCfg.bg, borderColor: tipoCfg.border }}
                        >
                          <TipoIcon size={28} style={{ color: tipoCfg.color }} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-black text-slate-800 text-base">{equip.tipo}</span>
                            <span
                              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border"
                              style={{ background: statusCfg.bg, color: statusCfg.color, borderColor: statusCfg.border }}
                            >
                              <StatusIcon size={10} strokeWidth={3} /> {statusCfg.label}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 font-mono mt-1">
                            Código: {equip.codigo}
                          </p>
                          {equip.nome && (
                            <p className="text-xs text-slate-500 mt-0.5">{equip.nome}</p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => router.push(`/equipamentos/detalhes/${equip.id}`)}
                        className="px-5 py-2.5 bg-slate-50 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-white hover:border-[#3d6cf0] hover:text-[#3d6cf0] transition-all"
                      >
                        Ver Ficha Técnica
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-10 flex flex-col items-center text-center gap-3">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                      <Package size={32} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-400">Ponto Vazio</p>
                      <p className="text-xs text-slate-300">Não há equipamento vinculado a este ponto no momento.</p>
                    </div>
                    <button
                      onClick={() => router.push(`/locais/${id}/editar`)}
                      className="mt-2 text-xs font-bold text-[#3d6cf0] flex items-center gap-1 hover:underline"
                    >
                      <Plus size={14} /> Vincular um equipamento agora
                    </button>
                  </div>
                )}
              </div>

              {/* QR Code */}
              <div className="bg-white border border-[#e3e8ef] rounded-2xl shadow-sm overflow-hidden">
                <div className={sectionTitleCls}>Etiqueta de Identificação (QR)</div>
                <div className="p-8 flex flex-col md:flex-row items-center gap-10">
                  <div className="bg-white p-4 border rounded-3xl shadow-xl flex flex-col items-center gap-2 flex-shrink-0">
                    {qrDataUrl ? (
                      <>
                        <img src={qrDataUrl} alt="QR Code" className="w-40 h-40" />
                        <span className="font-mono text-[10px] font-black text-slate-800">{local.qrCode}</span>
                      </>
                    ) : (
                      <Loader2 className="animate-spin text-slate-200 m-10" size={40} />
                    )}
                  </div>
                  <div className="space-y-4 max-w-sm">
                    <h3 className="font-black text-slate-800 text-lg">Impressão de Identificador</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">
                      Este QR Code deve ser fixado fisicamente no local. Ao ser escaneado por um inspetor,
                      o sistema abrirá automaticamente o formulário de inspeção correto para este ponto.
                    </p>
                    {qrDataUrl && (
                      <a
                        href={qrDataUrl}
                        download={`QR-${local.qrCode}.png`}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl text-xs font-black shadow-lg hover:bg-black transition-all"
                      >
                        <QrCode size={16} /> DOWNLOAD ETIQUETA
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══ TAB HISTÓRICO ══ */}
          {tab === 'historico' && (
            <div className="fade-up space-y-4">
              <div className="bg-white border border-[#e3e8ef] rounded-2xl shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 bg-[#f8fafc] border-b border-[#e3e8ef]">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-[#9ca3af]">
                    Logs de Inspeção
                  </span>
                  {equip && (
                    <button
                      onClick={() => router.push(`/inspecao/novo?pontoId=${id}`)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[#3d6cf0] text-white rounded-lg text-[10px] font-black shadow-sm"
                    >
                      <Plus size={12} /> NOVA INSPEÇÃO
                    </button>
                  )}
                </div>

                {historico.length === 0 ? (
                  <div className="p-20 flex flex-col items-center gap-3 text-center">
                    <Activity size={40} className="text-slate-100" />
                    <p className="text-sm font-bold text-slate-400">Sem registros</p>
                    <p className="text-xs text-slate-300">
                      Este local ainda não passou por nenhuma inspeção técnica.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {[...historico]
                      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
                      .map((ins, idx) => {
                        const cfg = INSP_STATUS_CONFIG[ins.status] ?? INSP_STATUS_CONFIG['PENDENTE']
                        const dataFormatada = new Date(ins.data).toLocaleString('pt-BR')

                        return (
                          <div
                            key={ins.id}
                            onClick={() => router.push(`/inspecao/${ins.id}`)}
                            className="px-6 py-5 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors group"
                          >
                            <div className="flex items-center gap-4">
                              <div
                                className="w-10 h-10 rounded-full border-2 flex items-center justify-center text-[10px] font-black flex-shrink-0"
                                style={{ borderColor: cfg.border, color: cfg.color, background: cfg.bg }}
                              >
                                {historico.length - idx}
                              </div>
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-black text-slate-800 text-[13px]">
                                    #{ins.id.substring(0, 8)}
                                  </span>
                                  <span
                                    className="px-2 py-0.5 rounded-full text-[9px] font-bold border"
                                    style={{ background: cfg.bg, color: cfg.color, borderColor: cfg.border }}
                                  >
                                    {cfg.label}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1 flex-wrap">
                                  <span>{dataFormatada}</span>
                                  <span>•</span>
                                  <span>
                                    Inspetor: {ins.inspetor?.nome
                                      ? `${ins.inspetor.nome} ${ins.inspetor.sobrenome ?? ''}`.trim()
                                      : 'Sistema'}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <ArrowLeft
                              size={16}
                              className="text-slate-300 rotate-180 group-hover:text-[#3d6cf0] transition-all flex-shrink-0"
                            />
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