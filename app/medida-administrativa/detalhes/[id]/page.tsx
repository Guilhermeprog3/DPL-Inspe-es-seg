'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useParams, useRouter } from 'next/navigation'
import { MedidaLayout } from '@/components/layout/MedidasLayout'
import {
  User, Tag, AlertTriangle, FileText,
  Paperclip, Link2, Loader2, AlertCircle,
  Edit2, Trash2, Calendar, Hash, Shield,
  CheckCircle2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Tipos ──────────────────────────────────────────────────────────────────
type LoadState = 'loading' | 'success' | 'error'

const GRAVIDADE_CFG: Record<string, { color: string; bg: string; border: string }> = {
  LEVE:       { color: '#10b981', bg: '#f0fdf4', border: '#bbf7d0' },
  MÉDIA:      { color: '#f59e0b', bg: '#fffbeb', border: '#fde68a' },
  GRAVE:      { color: '#ef4444', bg: '#fef2f2', border: '#fecaca' },
  GRAVÍSSIMA: { color: '#a855f7', bg: '#faf5ff', border: '#e9d5ff' },
}

const TIPO_CFG: Record<string, { color: string; bg: string }> = {
  'SEGURANÇA':       { color: '#ef4444', bg: '#fef2f2' },
  'ADMINISTRATIVA':  { color: '#3d6cf0', bg: '#eef2ff' },
}

const MEDIDA_CFG: Record<string, { color: string; bg: string; border: string }> = {
  'ADVERTÊNCIA VERBAL':  { color: '#f59e0b', bg: '#fffbeb', border: '#fde68a' },
  'ADVERTÊNCIA ESCRITA': { color: '#ef4444', bg: '#fef2f2', border: '#fecaca' },
  'SUSPENSÃO':           { color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
  'CONVERSA PEDAGÓGICA': { color: '#0891b2', bg: '#ecfeff', border: '#a5f3fc' },
  'TREINAMENTO':         { color: '#10b981', bg: '#f0fdf4', border: '#bbf7d0' },
}

const TABS = [
  { key: 'identificacao', label: 'Identificação',    icon: User },
  { key: 'classificacao', label: 'Classificação',    icon: Tag },
  { key: 'gravidade',     label: 'Gravidade',        icon: AlertTriangle },
  { key: 'ocorrencia',    label: 'Ocorrência',       icon: FileText },
  { key: 'anexos',        label: 'Anexos & Vínculo', icon: Paperclip },
] as const

type TabKey = typeof TABS[number]['key']

export default function DetalharMedidaPage() {
  const { data: session } = useSession()
  const params  = useParams()
  const router  = useRouter()
  const medidaId = params?.id as string

  const [loadState, setLoadState] = useState<LoadState>('loading')
  const [tab, setTab]             = useState<TabKey>('identificacao')
  const [deleteModal, setDeleteModal] = useState(false)
  const [isDeleting, setIsDeleting]   = useState(false)
  const [data, setData]               = useState<Record<string, any>>({})

  // ─── CARREGAR ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!medidaId) return
    const token = (session as any)?.access_token || (session as any)?.accessToken
    if (!token) return

    async function fetchMedida() {
      try {
        const res = await fetch(`http://localhost:3001/medidas/${medidaId}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        })
        if (!res.ok) throw new Error()
        setData(await res.json())
        setLoadState('success')
      } catch {
        setLoadState('error')
      }
    }
    fetchMedida()
  }, [medidaId, session])

  // ─── EXCLUIR ──────────────────────────────────────────────────────────────
  async function handleDelete() {
    if (isDeleting) return
    const token = (session as any)?.access_token || (session as any)?.accessToken
    if (!token) return
    setIsDeleting(true)
    try {
      const res = await fetch(`http://localhost:3001/medidas/${medidaId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Erro ao excluir.')
      router.push('/medida-administrativa/lista')
    } catch (e: any) {
      alert(e.message)
      setIsDeleting(false)
    }
  }

  // ─── ESTILOS ──────────────────────────────────────────────────────────────
  const sectionTitleCls = 'text-[11px] font-bold uppercase tracking-widest text-[#9ca3af] px-4 sm:px-6 py-3 bg-[#f8fafc] border-b border-[#e3e8ef]'

  const fieldRowCls = cn(
    'grid gap-4 items-start px-4 sm:px-6 py-4',
    'border-b border-[#e3e8ef] last:border-b-0',
  )

  // ─── LOADING / ERROR ──────────────────────────────────────────────────────
  if (loadState === 'loading') return (
    <MedidaLayout title="Detalhar Medida">
      <div className="flex items-center justify-center h-[60vh] gap-3 text-[#9ca3af]">
        <Loader2 size={20} className="animate-spin" />
        <span className="text-[14px]">Carregando medida...</span>
      </div>
    </MedidaLayout>
  )

  if (loadState === 'error') return (
    <MedidaLayout title="Detalhar Medida">
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4 text-center px-6">
        <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
          <AlertCircle size={24} className="text-red-500" />
        </div>
        <div>
          <p className="text-[15px] font-semibold text-[#111827] mb-1">Medida não encontrada</p>
          <p className="text-[13px] text-[#9ca3af]">Não foi possível carregar os dados desta medida.</p>
        </div>
        <button onClick={() => router.back()}
          className="px-5 py-2 rounded-lg bg-[#094780] text-white text-[13px] font-semibold hover:opacity-90 transition-all">
          ← Voltar
        </button>
      </div>
    </MedidaLayout>
  )

  const grav   = GRAVIDADE_CFG[data.gravidade]  ?? GRAVIDADE_CFG['LEVE']
  const medCfg = MEDIDA_CFG[data.medida]        ?? { color: '#4b5563', bg: '#f8fafc', border: '#e3e8ef' }
  const tipCfg = TIPO_CFG[data.tipo]            ?? { color: '#4b5563', bg: '#f8fafc' }

  const dataFormatada = data.data
    ? new Date(data.data).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
    : '—'

  // ─── RENDER ───────────────────────────────────────────────────────────────
  return (
    <MedidaLayout title="Detalhar Medida">
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:none; } }
        .fade-up { animation: fadeUp 0.2s ease forwards; }
        @keyframes zoomIn { from { opacity:0; transform:scale(0.95); } to { opacity:1; transform:scale(1); } }
        .modal-in { animation: zoomIn 0.25s cubic-bezier(.22,.68,0,1.2) forwards; }
      `}</style>

      <div className="w-full flex flex-col bg-[#f4f6f9] min-h-[calc(100vh-60px)]"
        style={{ fontFamily: "'Geist', 'Inter', sans-serif" }}>

        {/* ── BREADCRUMB ── */}
        <div className="bg-white border-b border-[#e3e8ef] px-4 sm:px-7 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[13px] text-[#9ca3af]">
            <button onClick={() => router.push('/medida-administrativa/lista')}
              className="hover:text-[#094780] transition-colors">Medidas</button>
            <span className="text-[11px]">›</span>
            <span className="text-[#094780] font-semibold">Detalhar Medida</span>
          </div>
          <span className="text-[11px] font-mono text-[#9ca3af] bg-[#f4f6f9] border border-[#e3e8ef] px-2.5 py-1 rounded-md hidden sm:block">
            ID #{medidaId.slice(-6).toUpperCase()}
          </span>
        </div>

        {/* ── TABS ── */}
        <div className="bg-white border-b border-[#e3e8ef] px-4 sm:px-7 flex overflow-x-auto">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={cn(
                'px-4 sm:px-5 py-[14px] text-[13px] border-b-[2.5px] whitespace-nowrap transition-all -mb-px',
                tab === t.key
                  ? 'text-[#094780] border-[#094780] font-semibold'
                  : 'text-[#9ca3af] border-transparent hover:text-[#4b5563]'
              )}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── CONTEÚDO ── */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 pt-6 pb-28 w-full">

          {/* IDENTIFICAÇÃO */}
          {tab === 'identificacao' && (
            <div className="fade-up space-y-4">
              <div className="bg-white border border-[#e3e8ef] rounded-xl overflow-hidden">
                <div className={sectionTitleCls}>Dados do colaborador</div>

                <div className={cn(fieldRowCls, 'grid-cols-1 sm:grid-cols-[200px_1fr]')}>
                  <span className="text-[12px] font-semibold text-[#9ca3af] uppercase tracking-wide flex items-center gap-1.5">
                    <User size={13} /> Nome
                  </span>
                  <span className="text-[14px] font-semibold text-[#111827]">{data.colaborador ?? '—'}</span>
                </div>

                <div className={cn(fieldRowCls, 'grid-cols-1 sm:grid-cols-[200px_1fr_1fr]')}>
                  <span className="text-[12px] font-semibold text-[#9ca3af] uppercase tracking-wide flex items-center gap-1.5">
                    <Hash size={13} /> Matrículas
                  </span>
                  <div>
                    <p className="text-[10.5px] text-[#9ca3af] mb-0.5">Colaborador</p>
                    <p className="text-[14px] font-semibold text-[#111827]">{data.matricula ?? '—'}</p>
                  </div>
                  <div>
                    <p className="text-[10.5px] text-[#9ca3af] mb-0.5">Supervisor</p>
                    <p className="text-[14px] font-semibold text-[#111827]">{data.supervisor ?? '—'}</p>
                  </div>
                </div>

                <div className={cn(fieldRowCls, 'grid-cols-1 sm:grid-cols-[200px_1fr]')}>
                  <span className="text-[12px] font-semibold text-[#9ca3af] uppercase tracking-wide flex items-center gap-1.5">
                    <Calendar size={13} /> Data
                  </span>
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
                  <span className="text-[12px] font-semibold text-[#9ca3af] uppercase tracking-wide flex items-center gap-1.5">
                    <Shield size={13} /> Categoria
                  </span>
                  <span className="text-[12px] font-black uppercase px-3 py-1 rounded-md max-w-max"
                    style={{ color: tipCfg.color, background: tipCfg.bg }}>
                    {data.tipo ?? '—'}
                  </span>
                </div>

                <div className={cn(fieldRowCls, 'grid-cols-1 sm:grid-cols-[200px_1fr]')}>
                  <span className="text-[12px] font-semibold text-[#9ca3af] uppercase tracking-wide flex items-center gap-1.5">
                    <Tag size={13} /> Tipo de Medida
                  </span>
                  <span className="text-[12px] font-bold px-3 py-1 rounded-md border max-w-max"
                    style={{ color: medCfg.color, background: medCfg.bg, borderColor: medCfg.border }}>
                    {data.medida ?? '—'}
                  </span>
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
                <div className={sectionTitleCls}>Nível de gravidade</div>
                <div className="p-6 flex flex-col gap-3">
                  {Object.keys(GRAVIDADE_CFG).map(key => {
                    const cfg    = GRAVIDADE_CFG[key]
                    const active = data.gravidade === key
                    return (
                      <div key={key}
                        className={cn(
                          'flex items-center justify-between px-4 py-3.5 rounded-xl border-[1.5px] transition-all',
                          active ? 'border-[#094780]' : 'border-[#e3e8ef] opacity-40'
                        )}
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

                <div className={cn(fieldRowCls, 'grid-cols-1 sm:grid-cols-[200px_1fr]', 'items-start')}>
                  <span className="text-[12px] font-semibold text-[#9ca3af] uppercase tracking-wide pt-0.5">Descrição</span>
                  <p className="text-[13.5px] text-[#374151] leading-relaxed whitespace-pre-wrap">
                    {data.ocorrencia ?? '—'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ANEXOS */}
          {tab === 'anexos' && (
            <div className="fade-up space-y-4">
              <div className="bg-white border border-[#e3e8ef] rounded-xl overflow-hidden">
                <div className={sectionTitleCls}>
                  Vínculo com inspeção
                </div>

                <div className={cn(fieldRowCls, 'grid-cols-1 sm:grid-cols-[200px_1fr]')}>
                  <span className="text-[12px] font-semibold text-[#9ca3af] uppercase tracking-wide flex items-center gap-1.5">
                    <Link2 size={13} /> Inspeção CLICK
                  </span>
                  {data.numeroInspecao ? (
                    <span className="inline-flex items-center gap-2 text-[13.5px] font-semibold text-[#094780]">
                      <span className="w-2 h-2 rounded-full bg-[#094780]" />
                      {data.numeroInspecao}
                    </span>
                  ) : (
                    <span className="text-[13.5px] text-[#9ca3af] italic">Nenhuma inspeção vinculada</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── FOOTER FIXO ── */}
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-sm border-t border-[#e3e8ef] px-4 sm:px-7 py-3.5 flex items-center justify-between gap-3">
          <button
            onClick={() => setDeleteModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#fecaca] text-[12.5px] font-medium text-red-500 hover:bg-red-50 transition-all"
          >
            <Trash2 size={13} />
            <span className="hidden sm:inline">Excluir</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push('/medida-administrativa/lista')}
              className="px-3 sm:px-4 py-2 rounded-lg border border-[#e3e8ef] text-[13px] font-medium text-[#4b5563] hover:border-[#9ca3af] hover:text-[#111827] transition-all"
            >
              ← Voltar
            </button>
            <button
              onClick={() => router.push(`/medida-administrativa/editar/${medidaId}`)}
              className="flex items-center gap-2 px-4 sm:px-5 py-2 rounded-lg bg-[#094780] text-white text-[13px] font-semibold hover:bg-[#0a5494] transition-all"
            >
              <Edit2 size={14} /> Editar Medida
            </button>
          </div>
        </div>

        {/* ── MODAL EXCLUIR ── */}
        {deleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#111827]/60 backdrop-blur-md p-6">
            <div className="modal-in bg-white rounded-2xl w-full max-w-xs p-8 text-center shadow-2xl border border-[#e3e8ef]">
              <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={24} className="text-red-500" />
              </div>
              <h3 className="text-[16px] font-bold text-[#111827] mb-2">Excluir medida?</h3>
              <p className="text-[13px] text-[#9ca3af] mb-6 leading-relaxed">
                Esta ação não pode ser desfeita. O registro será removido permanentemente.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setDeleteModal(false)}
                  disabled={isDeleting}
                  className="flex-1 py-2.5 border border-[#e3e8ef] text-[#4b5563] rounded-lg text-[13px] font-medium hover:border-[#9ca3af] transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 py-2.5 bg-red-500 text-white rounded-lg text-[13px] font-semibold hover:bg-red-600 transition-all flex items-center justify-center gap-2"
                >
                  {isDeleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                  {isDeleting ? 'Excluindo...' : 'Excluir'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MedidaLayout>
  )
}