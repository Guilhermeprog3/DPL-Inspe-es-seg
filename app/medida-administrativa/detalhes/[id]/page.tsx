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
  LEVE:             { color: '#10b981', bg: '#f0fdf4', border: '#10b981' },
  MÉDIA:            { color: '#f59e0b', bg: '#fffbeb', border: '#f59e0b' },
  GRAVE:            { color: '#ef4444', bg: '#fef2f2', border: '#ef4444' },
  GRAVÍSSIMA:       { color: '#a855f7', bg: '#faf5ff', border: '#a855f7' },
  'TOLERÂNCIA ZERO': { color: '#000000', bg: '#f1f5f9', border: '#000000' },
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

const TABS = [
  { key: 'identificacao', label: 'Identificação',     icon: User },
  { key: 'classificacao', label: 'Classificação',     icon: Tag },
  { key: 'gravidade',     label: 'Gravidade',         icon: AlertTriangle },
  { key: 'ocorrencia',    label: 'Ocorrência',        icon: FileText },
  { key: 'anexos',        label: 'Anexos & Vínculo', icon: Paperclip },
] as const

type TabKey = typeof TABS[number]['key']

function formatDateLong(raw: string | null | undefined): string {
  if (!raw) return '—'
  const [y, m, d] = raw.split('T')[0].split('-').map(Number)
  if (!y || !m || !d) return '—'
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric', timeZone: 'UTC',
  })
}

export default function DetalharMedidaPage() {
  const { data: session } = useSession()
  const params   = useParams()
  const router   = useRouter()
  const medidaId = params?.id as string

  const [loadState,   setLoadState  ] = useState<LoadState>('loading')
  const [tab,         setTab         ] = useState<TabKey>('identificacao')
  const [deleteModal, setDeleteModal] = useState(false)
  const [isDeleting,  setIsDeleting ] = useState(false)
  const [data,        setData       ] = useState<any>({})

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
    try { 
      await api.delete(`/medidas/${medidaId}`)
      router.push('/medida-administrativa/lista') 
    } catch (e: any) { 
      alert(e.response?.data?.message || 'Erro ao excluir.')
      setIsDeleting(false) 
    }
  }

  if (loadState === 'loading') return (
    <DashboardLayout title="Detalhar Medida" navItems={navItems}>
      <div className="flex items-center justify-center h-[60vh] gap-3 text-[#9ca3af]">
        <Loader2 size={20} className="animate-spin" /><span className="text-[14px]">Carregando medida...</span>
      </div>
    </DashboardLayout>
  )

  const medCfg = MEDIDA_CFG[data.medida] ?? { color: '#4b5563', bg: '#f8fafc', border: '#e3e8ef' }
  const tipCfg = TIPO_CFG[data.tipo] ?? { color: '#4b5563', bg: '#f8fafc' }
  const gravCfg = GRAVIDADE_CFG[data.gravidade] ?? null

  const anexos: AnexoRemoto[] = Array.isArray(data.anexos) ? data.anexos : []
  const numerosInspecao: string[] = typeof data.numerosInspecao === 'string' 
    ? data.numerosInspecao.split(',').filter(Boolean)
    : (Array.isArray(data.numerosInspecao) ? data.numerosInspecao : [])

  const sectionTitleCls = 'text-[11px] font-bold uppercase tracking-widest text-[#9ca3af] px-6 py-3 bg-[#f8fafc] border-b border-[#e3e8ef]'
  const fieldRowCls     = 'grid gap-4 items-start px-6 py-4 border-b border-[#e3e8ef] last:border-b-0'

  return (
    <DashboardLayout title="Detalhar Medida" navItems={navItems}>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:none} }
        .fade-up { animation: fadeUp 0.2s ease forwards }
      `}</style>

      <div className="w-full flex flex-col bg-[#f4f6f9] min-h-[calc(100vh-60px)]">
        
        {/* Breadcrumb + Tabs */}
        <div className="bg-white border-b border-[#e3e8ef] shadow-sm">
          <div className="px-7 py-3 flex items-center justify-between border-b border-[#f0f2f5]">
            <div className="flex items-center gap-2 text-[13px] text-[#9ca3af]">
              <button onClick={() => router.push('/medida-administrativa/lista')} className="hover:text-[#3d6cf0]">Medidas</button>
              <span>›</span>
              <span className="text-[#3d6cf0] font-semibold">Detalhar Medida</span>
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ID #{medidaId.slice(-6).toUpperCase()}</span>
          </div>

          <div className="px-7 flex overflow-x-auto">
            {TABS.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={cn('flex items-center gap-2 px-5 py-4 text-[13.5px] border-b-2 whitespace-nowrap transition-all',
                  tab === t.key ? 'text-[#3d6cf0] border-[#3d6cf0] font-semibold' : 'text-[#9ca3af] border-transparent hover:text-slate-600')}>
                <t.icon size={16} />
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pb-28">
          
          {/* IDENTIFICAÇÃO */}
          {tab === 'identificacao' && (
            <div className="fade-up mx-4 sm:mx-8 mt-6 space-y-6">
              <div className="bg-white border border-[#e3e8ef] rounded-xl shadow-sm overflow-hidden">
                <div className={sectionTitleCls}>Dados do Colaborador e Supervisor</div>
                
                <div className={cn(fieldRowCls, 'grid-cols-[180px_1fr_1fr]')}>
                  <span className="text-[13.5px] font-medium text-[#111827] mt-1">Matrículas</span>
                  <div><p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Colaborador</p><p className="text-[14px] font-semibold text-slate-700">{data.matricula || '—'}</p></div>
                  <div><p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Supervisor</p><p className="text-[14px] font-semibold text-slate-700">{data.supervisor || '—'}</p></div>
                </div>

                <div className={cn(fieldRowCls, 'grid-cols-[180px_1fr_1fr]')}>
                  <span className="text-[13.5px] font-medium text-[#111827] mt-1">Nomes</span>
                  <div><p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Colaborador</p><p className="text-[14px] font-semibold text-slate-700">{data.colaborador || '—'}</p></div>
                  <div><p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Supervisor</p><p className="text-[14px] font-semibold text-slate-700">{data.nomeSupervisor || '—'}</p></div>
                </div>

                <div className={cn(fieldRowCls, 'grid-cols-[180px_1fr_1fr]')}>
                  <span className="text-[13.5px] font-medium text-[#111827] mt-1">Localização</span>
                  <div><p className="text-[10px] font-bold text-slate-400 uppercase mb-1">UF</p><p className="text-[14px] font-semibold text-slate-700">{data.uf || '—'}</p></div>
                  <div><p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Regional</p><p className="text-[14px] font-semibold text-slate-700">{data.regional || '—'}</p></div>
                </div>

                <div className={cn(fieldRowCls, 'grid-cols-[180px_1fr]')}>
                  <span className="text-[13.5px] font-medium text-[#111827]">Data da Medida</span>
                  <p className="text-[14px] font-semibold text-slate-700">{formatDateLong(data.data)}</p>
                </div>
              </div>
            </div>
          )}

          {/* CLASSIFICAÇÃO */}
          {tab === 'classificacao' && (
            <div className="fade-up mx-4 sm:mx-8 mt-6">
              <div className="bg-white border border-[#e3e8ef] rounded-xl shadow-sm overflow-hidden">
                <div className={sectionTitleCls}>Categoria e Tipo</div>
                <div className={cn(fieldRowCls, 'grid-cols-[180px_1fr]')}>
                  <span className="text-[13.5px] font-medium text-[#111827]">Categoria</span>
                  <span className="text-[11px] font-black uppercase px-3 py-1 rounded-md max-w-max" style={{ color: tipCfg.color, background: tipCfg.bg }}>{data.tipo || '—'}</span>
                </div>
                <div className={cn(fieldRowCls, 'grid-cols-[180px_1fr]')}>
                  <span className="text-[13.5px] font-medium text-[#111827]">Tipo de Medida</span>
                  <span className="text-[11px] font-bold px-3 py-1 rounded-md border max-w-max" style={{ color: medCfg.color, background: medCfg.bg, borderColor: medCfg.border }}>{data.medida || '—'}</span>
                </div>
                {data.diasSuspensao && (
                  <div className={cn(fieldRowCls, 'grid-cols-[180px_1fr]')}>
                    <span className="text-[13.5px] font-medium text-[#111827]">Dias de Suspensão</span>
                    <p className="text-[14px] font-semibold text-slate-700">{data.diasSuspensao} dias</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* GRAVIDADE */}
          {tab === 'gravidade' && (
            <div className="fade-up mx-4 sm:mx-8 mt-6">
              <div className="bg-white border border-[#e3e8ef] rounded-xl shadow-sm overflow-hidden">
                <div className={sectionTitleCls}>Nível de Gravidade</div>
                <div className="p-6">
                  {gravCfg ? (
                    <div className="p-4 rounded-xl border-2 flex items-center gap-4 max-w-md" style={{ borderColor: gravCfg.border, backgroundColor: gravCfg.bg }}>
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ background: gravCfg.color }} />
                      <p className="text-sm font-bold text-slate-700">{data.gravidade}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400 italic">Não informada</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* OCORRÊNCIA */}
          {tab === 'ocorrencia' && (
            <div className="fade-up mx-4 sm:mx-8 mt-6">
              <div className="bg-white border border-[#e3e8ef] rounded-xl shadow-sm overflow-hidden">
                <div className={sectionTitleCls}>Detalhes da Ocorrência</div>
                <div className="p-6 space-y-6">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Desvio / Classificação</label>
                    <p className="text-[14px] font-semibold text-slate-700">{data.classificacao || '—'}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Descrição Completa</label>
                    <p className="text-[13.5px] text-slate-600 leading-relaxed whitespace-pre-wrap bg-slate-50 p-4 rounded-xl border border-slate-100">{data.ocorrencia || '—'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ANEXOS & VÍNCULO */}
          {tab === 'anexos' && (
            <div className="fade-up mx-4 sm:mx-8 mt-6 space-y-6">
              <div className="bg-white border border-[#e3e8ef] rounded-xl shadow-sm overflow-hidden">
                <div className={sectionTitleCls}>Anexos e Documentos</div>
                <div className="p-6">
                  {anexos.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {anexos.map((file) => (
                        <a key={file.id} href={file.url} target="_blank" rel="noreferrer" 
                          className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl hover:border-[#3d6cf0] hover:bg-blue-50 transition-all group">
                          <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0">
                            {file.tipo?.includes('image') ? <FileImage size={20} className="text-blue-500" /> : <File size={20} className="text-slate-400" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-semibold text-slate-700 truncate group-hover:text-[#3d6cf0]">{file.nome}</p>
                            <p className="text-[11px] text-slate-400 uppercase font-bold">{file.tipo?.split('/')[1] || 'Arquivo'}</p>
                          </div>
                        </a>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400 italic">Nenhum anexo vinculado.</p>
                  )}
                </div>
                
                <div className={sectionTitleCls}>Origem e Vínculos</div>
                <div className={cn(fieldRowCls, 'grid-cols-[180px_1fr]')}>
                  <span className="text-[13.5px] font-medium text-[#111827]">Origem</span>
                  <span className="text-[11px] font-black uppercase px-3 py-1 bg-slate-100 rounded-md max-w-max">{data.origem || '—'}</span>
                </div>
                <div className={cn(fieldRowCls, 'grid-cols-[180px_1fr]')}>
                  <span className="text-[13.5px] font-medium text-[#111827]">Inspeções CLICK</span>
                  <div className="flex flex-wrap gap-2">
                    {numerosInspecao.length > 0 ? (
                      numerosInspecao.map((n, i) => (
                        <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-lg text-[12px] font-bold text-[#3d6cf0]">
                          <Link2 size={12} /> #{n}
                        </span>
                      ))
                    ) : (
                      <p className="text-sm text-slate-400 italic">Nenhuma inspeção vinculada.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Barra Inferior de Ações */}
        <div className="fixed bottom-0 right-0 bg-white border-t border-[#e3e8ef] px-8 py-4 flex items-center justify-between z-40 transition-all"
          style={{ left: 0 }}>
          <button onClick={() => setDeleteModal(true)} className="flex items-center gap-2 px-4 py-2 text-red-500 hover:bg-red-50 rounded-xl transition-all font-bold text-xs">
            <Trash2 size={16} /> EXCLUIR
          </button>
          <div className="flex gap-3">
            <button onClick={() => router.push('/medida-administrativa/lista')} className="px-6 py-2 border-2 border-slate-200 rounded-xl text-xs font-bold text-slate-500 hover:border-slate-300">VOLTAR</button>
            <button onClick={() => router.push(`/medida-administrativa/editar/${medidaId}`)} className="px-8 py-2 bg-[#3d6cf0] hover:bg-[#2f5cd9] rounded-xl text-xs font-black text-white transition-all flex items-center gap-2">
              <Edit2 size={16} /> EDITAR MEDIDA
            </button>
          </div>
        </div>

        {/* Modal de Exclusão */}
        {deleteModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-6">
            <div className="bg-white p-8 rounded-3xl text-center shadow-2xl max-w-sm w-full">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4"><AlertTriangle size={32} className="text-red-500" /></div>
              <h3 className="font-black text-lg text-slate-800 mb-2">Excluir Registro?</h3>
              <p className="text-slate-500 text-sm mb-8">Esta ação não pode ser desfeita. A medida e seus anexos serão removidos permanentemente.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteModal(false)} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-2xl font-bold text-xs hover:bg-slate-200">CANCELAR</button>
                <button onClick={handleDelete} disabled={isDeleting} className="flex-1 py-3 bg-red-500 text-white rounded-2xl font-black text-xs hover:bg-red-600 flex items-center justify-center">
                  {isDeleting ? <Loader2 className="animate-spin" size={16} /> : 'SIM, EXCLUIR'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}