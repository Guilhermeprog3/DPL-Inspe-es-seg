// ─── DETALHAR MEDIDA COMPLETA ─────────────────────────────────────────────────
// medida-administrativa/detalhes/[id]/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useParams, useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import {
  User, Tag, AlertTriangle, FileText,
  Paperclip, Link2, Loader2, AlertCircle,
  Edit2, Trash2, Calendar, Hash, Shield,
  CheckCircle2, File, FileImage, LayoutDashboard, PlusCircle, List, MapPin
} from 'lucide-react'
import { cn } from '@/lib/utils'
import api from '@/lib/api'

type LoadState   = 'loading' | 'success' | 'error'
type AnexoRemoto = { id: string; nome: string; url: string; tamanho?: number; tipo?: string }

const navItems = [
  { section: 'Medida Administrativa' },
  { label: 'Dashboard',  href: '/medida-administrativa',       icon: LayoutDashboard },
  { section: 'Operações' },
  { label: 'Nova Medida',href: '/medida-administrativa/nova',  icon: PlusCircle },
  { label: 'Histórico',  href: '/medida-administrativa/lista', icon: List },
]

const GRAVIDADE_CFG: Record<string, { color: string; bg: string; border: string }> = {
  LEVE:       { color: '#10b981', bg: '#f0fdf4', border: '#bbf7d0' },
  MÉDIA:      { color: '#f59e0b', bg: '#fffbeb', border: '#fde68a' },
  GRAVE:      { color: '#ef4444', bg: '#fef2f2', border: '#fecaca' },
  GRAVÍSSIMA: { color: '#a855f7', bg: '#faf5ff', border: '#e9d5ff' },
}

const TIPO_CFG: Record<string, { color: string; bg: string }> = {
  'SEGURANÇA':      { color: '#ef4444', bg: '#fef2f2' },
  'ADMINISTRATIVA': { color: '#3d6cf0', bg: '#eef2ff' },
}

const MEDIDA_CFG: Record<string, { color: string; bg: string; border: string }> = {
  'ADVERTÊNCIA VERBAL':  { color: '#f59e0b', bg: '#fffbeb', border: '#fde68a' },
  'ADVERTÊNCIA ESCRITA': { color: '#ef4444', bg: '#fef2f2', border: '#fecaca' },
  'SUSPENSÃO':           { color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
  'CONVERSA PEDAGÓGICA': { color: '#0891b2', bg: '#ecfeff', border: '#a5f3fc' },
  'TREINAMENTO':         { color: '#10b981', bg: '#f0fdf4', border: '#bbf7d0' },
}

const ORIGENS_CFG: Record<string, { color: string; bg: string; border: string }> = {
  'ESS':              { color: '#0891b2', bg: '#ecfeff', border: '#a5f3fc' },
  'CLICK':            { color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
  'NMC':              { color: '#10b981', bg: '#f0fdf4', border: '#bbf7d0' },
  'MULTA DE TRÂNSITO':{ color: '#ef4444', bg: '#fef2f2', border: '#fecaca' },
  'GESTÃO DE GENTE':  { color: '#f59e0b', bg: '#fffbeb', border: '#fde68a' },
}

const TABS = [
  { key: 'identificacao', label: 'Identificação',    icon: User },
  { key: 'classificacao', label: 'Classificação',    icon: Tag },
  { key: 'gravidade',     label: 'Gravidade',        icon: AlertTriangle },
  { key: 'ocorrencia',    label: 'Ocorrência',       icon: FileText },
  { key: 'anexos',        label: 'Anexos & Vínculo', icon: Paperclip },
] as const

type TabKey = typeof TABS[number]['key']

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
function isImage(tipo?: string, nome?: string) {
  if (tipo?.startsWith('image/')) return true
  if (nome) return /\.(jpg|jpeg|png|webp|gif)$/i.test(nome)
  return false
}
function isPdf(tipo?: string, nome?: string) {
  if (tipo === 'application/pdf') return true
  if (nome) return /\.pdf$/i.test(nome)
  return false
}
function FileIcon({ tipo, nome, size = 20 }: { tipo?: string; nome?: string; size?: number }) {
  if (isImage(tipo, nome)) return <FileImage size={size} className="text-blue-400" />
  if (isPdf(tipo, nome))   return <File      size={size} className="text-red-400"  />
  return                           <File      size={size} className="text-slate-400" />
}

export default function DetalharMedidaPage() {
  const { data: session } = useSession()
  const params   = useParams()
  const router   = useRouter()
  const medidaId = params?.id as string

  const [loadState,   setLoadState  ] = useState<LoadState>('loading')
  const [tab,         setTab        ] = useState<TabKey>('identificacao')
  const [deleteModal, setDeleteModal] = useState(false)
  const [isDeleting,  setIsDeleting ] = useState(false)
  const [data,        setData       ] = useState<Record<string, any>>({})

  useEffect(() => {
    if (!medidaId || !session) return
    async function fetchMedida() {
      try {
        setLoadState('loading')
        const res = await api.get(`/medidas/${medidaId}`)
        setData(res.data)
        setLoadState('success')
      } catch (err) { console.error(err); setLoadState('error') }
    }
    fetchMedida()
  }, [medidaId, session])

  async function handleDelete() {
    if (isDeleting) return
    setIsDeleting(true)
    try { await api.delete(`/medidas/${medidaId}`); router.push('/medida-administrativa/lista') }
    catch (e: any) { alert(e.response?.data?.message || 'Erro ao excluir.'); setIsDeleting(false) }
  }

  const sectionTitleCls = 'text-[11px] font-bold uppercase tracking-widest text-[#9ca3af] px-4 sm:px-6 py-3 bg-[#f8fafc] border-b border-[#e3e8ef]'
  const fieldRowCls     = cn('grid gap-4 items-start px-4 sm:px-6 py-4 border-b border-[#e3e8ef] last:border-b-0')

  if (loadState === 'loading') return (
    <DashboardLayout title="Detalhar Medida" navItems={navItems}>
      <div className="flex items-center justify-center h-[60vh] gap-3 text-[#9ca3af]">
        <Loader2 size={20} className="animate-spin" /><span className="text-[14px]">Carregando medida...</span>
      </div>
    </DashboardLayout>
  )

  if (loadState === 'error') return (
    <DashboardLayout title="Detalhar Medida" navItems={navItems}>
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4 text-center px-6">
        <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center"><AlertCircle size={24} className="text-red-500" /></div>
        <div><p className="text-[15px] font-semibold text-[#111827] mb-1">Medida não encontrada</p><p className="text-[13px] text-[#9ca3af]">Não foi possível carregar os dados desta medida.</p></div>
        <button onClick={() => router.back()} className="px-5 py-2 rounded-lg bg-[#094780] text-white text-[13px] font-semibold hover:opacity-90 transition-all">← Voltar</button>
      </div>
    </DashboardLayout>
  )

  const medCfg       = MEDIDA_CFG[data.medida]   ?? { color: '#4b5563', bg: '#f8fafc', border: '#e3e8ef' }
  const tipCfg       = TIPO_CFG[data.tipo]        ?? { color: '#4b5563', bg: '#f8fafc' }
  const origemCfg    = ORIGENS_CFG[data.origem]   ?? null
  const dataFormatada = data.data ? new Date(data.data).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }) : '—'
  const anexos: AnexoRemoto[] = Array.isArray(data.anexos) ? data.anexos : []

  return (
    <DashboardLayout title="Detalhar Medida" navItems={navItems}>
      <style>{`
        @keyframes fadeUp  { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:none} }
        @keyframes zoomIn  { from{opacity:0;transform:scale(0.95)}     to{opacity:1;transform:scale(1)} }
        @keyframes scaleIn { from{opacity:0;transform:scale(0.96)}     to{opacity:1;transform:scale(1)} }
        .fade-up   { animation: fadeUp  0.2s ease forwards }
        .modal-in  { animation: zoomIn  0.25s cubic-bezier(.22,.68,0,1.2) forwards }
        .scale-in  { animation: scaleIn 0.15s ease forwards }
      `}</style>

      <div className="w-full flex flex-col bg-[#f4f6f9] min-h-[calc(100vh-60px)]">

        {/* ── Breadcrumb + Tabs ── */}
        <div className="bg-white" style={{ borderBottom: '1px solid #e3e8ef', boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.05)' }}>
          <div className="px-4 sm:px-7 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid #f0f2f5' }}>
            <div className="flex items-center gap-2 text-[13px] text-[#9ca3af]">
              <button onClick={() => router.push('/medida-administrativa/lista')} className="hover:text-[#094780] transition-colors">Medidas</button>
              <span className="text-[11px]">›</span>
              <span className="text-[#094780] font-semibold">Detalhar Medida</span>
            </div>
            <span className="text-[11px] font-mono text-[#9ca3af] bg-[#f4f6f9] border border-[#e3e8ef] px-2.5 py-1 rounded-md hidden sm:block">
              ID #{medidaId.slice(-6).toUpperCase()}
            </span>
          </div>

          <div className="px-4 sm:px-7 flex overflow-x-auto">
            {TABS.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={cn('px-4 sm:px-5 py-[14px] text-[13px] border-b-[2.5px] whitespace-nowrap transition-all -mb-px',
                  tab === t.key ? 'text-[#094780] border-[#094780] font-semibold' : 'text-[#9ca3af] border-transparent hover:text-[#4b5563]')}>
                {t.label}
                {t.key === 'anexos' && anexos.length > 0 && (
                  <span className="ml-1.5 text-[10px] font-bold bg-[#094780] text-white rounded-full px-1.5 py-0.5 align-middle">{anexos.length}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 pt-6 pb-28 w-full">

          {/* IDENTIFICAÇÃO */}
          {tab === 'identificacao' && (
            <div className="fade-up space-y-4">
              <div className="bg-white border border-[#e3e8ef] rounded-xl overflow-hidden">
                <div className={sectionTitleCls}>Dados do colaborador</div>

                {/* MATRÍCULAS — primeiro */}
                <div className={cn(fieldRowCls, 'grid-cols-1 sm:grid-cols-[200px_1fr_1fr]')}>
                  <span className="text-[12px] font-semibold text-[#9ca3af] uppercase tracking-wide flex items-center gap-1.5"><Hash size={13} /> Matrículas</span>
                  <div><p className="text-[10.5px] text-[#9ca3af] mb-0.5">Colaborador</p><p className="text-[14px] font-semibold text-[#111827]">{data.matricula ?? '—'}</p></div>
                  <div><p className="text-[10.5px] text-[#9ca3af] mb-0.5">Supervisor</p><p className="text-[14px] font-semibold text-[#111827]">{data.supervisor ?? '—'}</p></div>
                </div>

                {/* NOMES — segundo */}
                <div className={cn(fieldRowCls, 'grid-cols-1 sm:grid-cols-[200px_1fr_1fr]')}>
                  <span className="text-[12px] font-semibold text-[#9ca3af] uppercase tracking-wide flex items-center gap-1.5"><User size={13} /> Nomes</span>
                  <div><p className="text-[10.5px] text-[#9ca3af] mb-0.5">Colaborador</p><p className="text-[14px] font-semibold text-[#111827]">{data.colaborador ?? '—'}</p></div>
                  <div><p className="text-[10.5px] text-[#9ca3af] mb-0.5">Supervisor</p><p className="text-[14px] font-semibold text-[#111827]">{data.nomeSupervisor ?? '—'}</p></div>
                </div>

                <div className={cn(fieldRowCls, 'grid-cols-1 sm:grid-cols-[200px_1fr]')}>
                  <span className="text-[12px] font-semibold text-[#9ca3af] uppercase tracking-wide flex items-center gap-1.5"><Calendar size={13} /> Data</span>
                  <span className="text-[14px] font-semibold text-[#111827]">{dataFormatada}</span>
                </div>
              </div>
            </div>
          )}

          {/* CLASSIFICAÇÃO */}
          {tab === 'classificacao' && (
            <div className="fade-up space-y-4">
              <div className="bg-white border border-[#e3e8ef] rounded-xl overflow-hidden">
                <div className={sectionTitleCls}>Categoria e tipo</div>
                <div className={cn(fieldRowCls, 'grid-cols-1 sm:grid-cols-[200px_1fr]')}>
                  <span className="text-[12px] font-semibold text-[#9ca3af] uppercase tracking-wide flex items-center gap-1.5"><Shield size={13} /> Categoria</span>
                  <span className="text-[12px] font-black uppercase px-3 py-1 rounded-md max-w-max" style={{ color: tipCfg.color, background: tipCfg.bg }}>{data.tipo ?? '—'}</span>
                </div>
                <div className={cn(fieldRowCls, 'grid-cols-1 sm:grid-cols-[200px_1fr]')}>
                  <span className="text-[12px] font-semibold text-[#9ca3af] uppercase tracking-wide flex items-center gap-1.5"><Tag size={13} /> Tipo de Medida</span>
                  <span className="text-[12px] font-bold px-3 py-1 rounded-md border max-w-max" style={{ color: medCfg.color, background: medCfg.bg, borderColor: medCfg.border }}>{data.medida ?? '—'}</span>
                </div>
                {data.diasSuspensao && (
                  <div className={cn(fieldRowCls, 'grid-cols-1 sm:grid-cols-[200px_1fr]')}>
                    <span className="text-[12px] font-semibold text-[#9ca3af] uppercase tracking-wide">Dias de Suspensão</span>
                    <span className="text-[14px] font-semibold text-[#111827]">{data.diasSuspensao} dias</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* GRAVIDADE */}
          {tab === 'gravidade' && (
            <div className="fade-up space-y-4">
              <div className="bg-white border border-[#e3e8ef] rounded-xl overflow-hidden">
                <div className={sectionTitleCls}>
                  Nível de gravidade
                  {!data.gravidade && <span className="ml-2 text-[10px] font-normal normal-case tracking-normal text-slate-400">(não informado)</span>}
                </div>
                <div className="p-6 flex flex-col gap-3">
                  {Object.entries(GRAVIDADE_CFG).map(([key, cfg]) => {
                    const active = data.gravidade === key
                    return (
                      <div key={key} className={cn('flex items-center justify-between px-4 py-3.5 rounded-xl border-[1.5px] transition-all',
                        active ? '' : 'border-[#e3e8ef] opacity-40')}
                        style={active ? { background: cfg.bg, borderColor: cfg.border } : {}}>
                        <div className="flex items-center gap-3">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ background: cfg.color }} />
                          <span className={cn('text-[13.5px] font-semibold', active ? 'text-[#111827]' : 'text-[#9ca3af]')}>{key}</span>
                        </div>
                        {active && <CheckCircle2 size={16} style={{ color: cfg.color }} />}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* OCORRÊNCIA */}
          {tab === 'ocorrencia' && (
            <div className="fade-up space-y-4">
              <div className="bg-white border border-[#e3e8ef] rounded-xl overflow-hidden">
                <div className={sectionTitleCls}>Detalhes da ocorrência</div>
                <div className={cn(fieldRowCls, 'grid-cols-1 sm:grid-cols-[200px_1fr]')}>
                  <span className="text-[12px] font-semibold text-[#9ca3af] uppercase tracking-wide">Classificação</span>
                  <span className="text-[13.5px] font-semibold text-[#111827] leading-snug">{data.classificacao ?? '—'}</span>
                </div>
                <div className={cn(fieldRowCls, 'grid-cols-1 sm:grid-cols-[200px_1fr] items-start')}>
                  <span className="text-[12px] font-semibold text-[#9ca3af] uppercase tracking-wide pt-0.5">Descrição</span>
                  <p className="text-[13.5px] text-[#374151] leading-relaxed whitespace-pre-wrap">{data.ocorrencia ?? '—'}</p>
                </div>
              </div>
            </div>
          )}

          {/* ANEXOS & VÍNCULO */}
          {tab === 'anexos' && (
            <div className="fade-up space-y-4">

              {/* Anexos */}
              <div className="bg-white border border-[#e3e8ef] rounded-xl overflow-hidden shadow-sm">
                <div className={sectionTitleCls}>
                  Anexos
                  {anexos.length > 0 && <span className="ml-2 text-[10px] font-normal normal-case tracking-normal text-slate-400">— {anexos.length} arquivo(s)</span>}
                </div>
                {anexos.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-3"><Paperclip size={20} className="text-slate-300" /></div>
                    <p className="text-[13px] font-semibold text-slate-400">Nenhum anexo</p>
                  </div>
                ) : (
                  <div className="p-6 space-y-2">
                    {anexos.map((anexo, i) => (
                      <a key={anexo.id} href={anexo.url} target="_blank" rel="noopener noreferrer"
                        className="scale-in flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl group hover:border-[#094780]/30 hover:bg-blue-50/30 transition-all"
                        style={{ animationDelay: `${i * 40}ms` }}>
                        {isImage(anexo.tipo, anexo.nome) ? (
                          <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 border border-slate-200 bg-slate-100">
                            <img src={anexo.url} alt={anexo.nome} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center flex-shrink-0">
                            <FileIcon tipo={anexo.tipo} nome={anexo.nome} size={20} />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-semibold text-slate-700 truncate group-hover:text-[#094780] transition-colors">{anexo.nome}</p>
                          {anexo.tamanho !== undefined && <p className="text-[11px] text-slate-400">{formatBytes(anexo.tamanho)}</p>}
                        </div>
                        <div className="flex-shrink-0 text-slate-300 group-hover:text-[#094780] transition-colors"><Link2 size={14} /></div>
                      </a>
                    ))}
                  </div>
                )}
              </div>

              {/* Origem */}
              <div className="bg-white border border-[#e3e8ef] rounded-xl overflow-hidden shadow-sm">
                <div className={sectionTitleCls}>Origem</div>
                <div className={cn(fieldRowCls, 'grid-cols-1 sm:grid-cols-[200px_1fr]')}>
                  <span className="text-[12px] font-semibold text-[#9ca3af] uppercase tracking-wide flex items-center gap-1.5">
                    <MapPin size={13} /> Sistema de origem
                  </span>
                  {data.origem && origemCfg ? (
                    <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[12px] font-bold max-w-max"
                      style={{ color: origemCfg.color, background: origemCfg.bg, borderColor: origemCfg.border }}>
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: origemCfg.color }} />
                      {data.origem}
                    </span>
                  ) : (
                    <span className="text-[13.5px] text-[#9ca3af] italic">Não informado</span>
                  )}
                </div>
              </div>

              {/* Vínculo externo */}
              <div className="bg-white border border-[#e3e8ef] rounded-xl overflow-hidden shadow-sm">
                <div className={sectionTitleCls}>Vínculo externo</div>
                <div className={cn(fieldRowCls, 'grid-cols-1 sm:grid-cols-[200px_1fr]')}>
                  <span className="text-[12px] font-semibold text-[#9ca3af] uppercase tracking-wide flex items-center gap-1.5">
                    <Link2 size={13} /> Inspeção CLICK
                  </span>
                  {data.numeroInspecao
                    ? <span className="inline-flex items-center gap-2 text-[13.5px] font-semibold text-[#094780]"><span className="w-2 h-2 rounded-full bg-[#094780]" />{data.numeroInspecao}</span>
                    : <span className="text-[13.5px] text-[#9ca3af] italic">Nenhuma inspeção vinculada</span>
                  }
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Bar */}
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-sm border-t border-[#e3e8ef] px-4 sm:px-7 py-3.5 flex items-center justify-between gap-3">
          <button onClick={() => setDeleteModal(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#fecaca] text-[12.5px] font-medium text-red-500 hover:bg-red-50 transition-all">
            <Trash2 size={13} /> <span className="hidden sm:inline">Excluir</span>
          </button>
          <div className="flex items-center gap-2">
            <button onClick={() => router.push('/medida-administrativa/lista')} className="px-3 sm:px-4 py-2 rounded-lg border border-[#e3e8ef] text-[13px] font-medium text-[#4b5563] hover:text-[#111827] transition-all">← Voltar</button>
            <button onClick={() => router.push(`/medida-administrativa/editar/${medidaId}`)} className="flex items-center gap-2 px-4 sm:px-5 py-2 rounded-lg bg-[#094780] text-white text-[13px] font-semibold hover:bg-[#0a5494] transition-all">
              <Edit2 size={14} /> Editar Medida
            </button>
          </div>
        </div>

        {deleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#111827]/60 backdrop-blur-md p-6">
            <div className="modal-in bg-white rounded-2xl w-full max-w-xs p-8 text-center shadow-2xl border border-[#e3e8ef]">
              <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4"><Trash2 size={24} className="text-red-500" /></div>
              <h3 className="text-[16px] font-bold text-[#111827] mb-2">Excluir medida?</h3>
              <p className="text-[13px] text-[#9ca3af] mb-6">Esta ação não pode ser desfeita.</p>
              <div className="flex gap-2">
                <button onClick={() => setDeleteModal(false)} disabled={isDeleting} className="flex-1 py-2.5 border border-[#e3e8ef] text-[#4b5563] rounded-lg text-[13px] font-medium">Cancelar</button>
                <button onClick={handleDelete} disabled={isDeleting} className="flex-1 py-2.5 bg-red-500 text-white rounded-lg text-[13px] font-semibold hover:bg-red-600 transition-all flex items-center justify-center gap-2">
                  {isDeleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                  {isDeleting ? 'Excluindo...' : 'Excluir'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}