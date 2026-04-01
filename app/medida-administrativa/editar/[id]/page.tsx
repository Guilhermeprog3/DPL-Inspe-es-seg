'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useParams, useRouter } from 'next/navigation'
import { MedidaLayout } from '@/components/layout/MedidasLayout'
import {
  User, Tag, AlertTriangle, FileText,
  Paperclip, Link2, CheckCircle, Loader2,
  Save, Trash2, AlertCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Tipos ──────────────────────────────────────────────────────────────────
type TipoCategoria = 'SEGURANÇA' | 'ADMINISTRATIVA' | ''
type TipoMedida =
  | 'ADVERTÊNCIA VERBAL' | 'ADVERTÊNCIA ESCRITA' | 'SUSPENSÃO'
  | 'CONVERSA PEDAGÓGICA' | 'TREINAMENTO' | ''
type Gravidade = 'LEVE' | 'MÉDIA' | 'GRAVE' | 'GRAVÍSSIMA' | ''

type LoadState = 'loading' | 'success' | 'error'

const CLASSIFICACOES = [
  'Uso inadequado de EPI', 'Falta de EPI', 'Comportamento de risco',
  'Descumprimento de NR', 'Acidente de trabalho', 'Quase-acidente',
  'Uso indevido de equipamento', 'Ausência injustificada', 'Atraso recorrente',
  'Descumprimento de procedimento interno', 'Conduta inadequada com colegas',
  'Dano ao patrimônio', 'Falta de comunicação de incidente',
  'Violação de norma de segurança', 'Negligência em atividade crítica',
]

const GRAVIDADE_CFG: Record<string, { color: string }> = {
  LEVE:       { color: '#10b981' },
  MÉDIA:      { color: '#f59e0b' },
  GRAVE:      { color: '#ef4444' },
  GRAVÍSSIMA: { color: '#a855f7' },
}

const TABS = [
  { key: 'identificacao', label: 'Identificação', icon: User },
  { key: 'classificacao', label: 'Classificação', icon: Tag },
  { key: 'gravidade',     label: 'Gravidade',     icon: AlertTriangle },
  { key: 'ocorrencia',    label: 'Ocorrência',    icon: FileText },
  { key: 'anexos',        label: 'Anexos & Vínculo', icon: Paperclip },
] as const

type TabKey = typeof TABS[number]['key']

export default function EditarMedidaPage() {
  const { data: session } = useSession()
  const params = useParams()
  const router = useRouter()
  const medidaId = params?.id as string

  const [loadState, setLoadState] = useState<LoadState>('loading')
  const [tab, setTab] = useState<TabKey>('identificacao')
  const [successModal, setSuccessModal] = useState(false)
  const [deleteModal, setDeleteModal] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  // CORREÇÃO DA TIPAGEM: Permitir strings, numbers e null
  const [original, setOriginal] = useState<Record<string, any>>({})

  // Form States
  const [nomeColab, setNomeColab] = useState('')
  const [matriculaColab, setMatriculaColab] = useState('')
  const [statusColab, setStatusColab] = useState<'idle' | 'loading' | 'valid' | 'invalid'>('idle')
  const [matriculaSup, setMatriculaSup] = useState('')
  const [statusSup, setStatusSup] = useState<'idle' | 'loading' | 'valid' | 'invalid'>('idle')
  const [dataMedida, setDataMedida] = useState('')
  const [tipoCategoria, setTipoCategoria] = useState<TipoCategoria>('')
  const [tipoMedida, setTipoMedida] = useState<TipoMedida>('')
  const [diasSuspensao, setDiasSuspensao] = useState('')
  const [gravidade, setGravidade] = useState<Gravidade>('')
  const [classificacao, setClassificacao] = useState('')
  const [ocorrencia, setOcorrencia] = useState('')
  const [relacionarClick, setRelacionarClick] = useState(false)
  const [numeroInspecao, setNumeroInspecao] = useState('')

  // ─── CARREGAR DADOS ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!medidaId) return
    const token = (session as any)?.access_token || (session as any)?.accessToken
    if (!token) return

    async function fetchMedida() {
      try {
        const res = await fetch(`http://localhost:3001/medidas/${medidaId}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        })
        if (!res.ok) throw new Error('Medida não encontrada.')
        const data = await res.json()
        console.log("Dados recebidos da API:", data)

        // Sincronização com os campos do Prisma
        setNomeColab(data.colaborador ?? '')
        setMatriculaColab(data.matricula ?? '')
        setMatriculaSup(data.supervisor ?? '')
        setDataMedida(data.data ? data.data.slice(0, 10) : '')
        setTipoCategoria((data.tipo as TipoCategoria) ?? '')
        setTipoMedida((data.medida as TipoMedida) ?? '')
        // setDiasSuspensao(data.diasSuspensao ? String(data.diasSuspensao) : '')
        setGravidade((data.gravidade as Gravidade) ?? '')
        setClassificacao(data.classificacao ?? '')
        setOcorrencia(data.ocorrencia ?? '')
        setNumeroInspecao(data.numeroInspecao ?? '')
        setRelacionarClick(!!data.numeroInspecao)

        setStatusColab('valid')
        setStatusSup('valid')

        setOriginal({
          colaborador: data.colaborador ?? '',
          matricula: data.matricula ?? '',
          supervisor: data.supervisor ?? '',
          data: data.data ? data.data.slice(0, 10) : '',
          tipo: data.tipo ?? '',
          medida: data.medida ?? '',
          diasSuspensao: data.diasSuspensao ? String(data.diasSuspensao) : '',
          gravidade: data.gravidade ?? '',
          classificacao: data.classificacao ?? '',
          ocorrencia: data.ocorrencia ?? '',
          numeroInspecao: data.numeroInspecao ?? '',
        })

        setLoadState('success')
      } catch (err) {
        setLoadState('error')
      }
    }
    fetchMedida()
  }, [medidaId, session])

  // ── Detectar alterações
  useEffect(() => {
    if (loadState !== 'success') return
    const current = {
      colaborador: nomeColab,
      matricula: matriculaColab,
      supervisor: matriculaSup,
      data: dataMedida,
      tipo: tipoCategoria,
      medida: tipoMedida,
      diasSuspensao: diasSuspensao,
      gravidade: gravidade,
      classificacao: classificacao,
      ocorrencia: ocorrencia,
      numeroInspecao: relacionarClick ? numeroInspecao : '',
    }
    const changed = Object.keys(original).some(k => original[k] !== (current as any)[k])
    setHasChanges(changed)
  }, [nomeColab, matriculaColab, matriculaSup, dataMedida, tipoCategoria, tipoMedida, 
      diasSuspensao, gravidade, classificacao, ocorrencia, numeroInspecao, relacionarClick, original, loadState])

  // ─── SALVAR ──────────────────────────────────────────────────────────────
  async function handleSave() {
    if (isSaving || !allValid) return
    const token = (session as any)?.access_token || (session as any)?.accessToken
    if (!token) return

    setIsSaving(true)
    const payload = {
      colaborador: nomeColab,
      matricula: matriculaColab,
      supervisor: matriculaSup,
      data: new Date(dataMedida).toISOString(),
      tipo: tipoCategoria,
      medida: tipoMedida,
      ocorrencia,
      gravidade,
      classificacao,
      // diasSuspensao: diasSuspensao ? Number(diasSuspensao) : null,
      numeroInspecao: relacionarClick ? numeroInspecao : null,
    }

    try {
      const res = await fetch(`http://localhost:3001/medidas/${medidaId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('Erro ao salvar no servidor.')

      setOriginal({ ...payload, data: dataMedida, diasSuspensao: String(diasSuspensao || ''), numeroInspecao: payload.numeroInspecao || '' }) 
      setHasChanges(false)
      setSuccessModal(true)
    } catch (error: any) {
      alert(error.message)
    } finally {
      setIsSaving(false)
    }
  }

  // ─── EXCLUIR ─────────────────────────────────────────────────────────────
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
      if (!res.ok) throw new Error('Erro ao excluir medida.')
      router.push('/medida-administrativa/lista')
    } catch (error: any) {
      alert(error.message)
      setIsDeleting(false)
    }
  }

  const validar = (val: string, set: any) => {
    if (val.length < 4) { set('idle'); return }
    set('loading')
    setTimeout(() => set('valid'), 600)
  }

  const tabValid: Record<TabKey, boolean> = {
    identificacao: !!nomeColab && statusColab === 'valid' && statusSup === 'valid' && !!dataMedida,
    classificacao: !!tipoCategoria && !!tipoMedida && (tipoMedida !== 'SUSPENSÃO' || !!diasSuspensao),
    gravidade:     !!gravidade,
    ocorrencia:    !!classificacao && ocorrencia.trim().length >= 10,
    anexos:        !relacionarClick || !!numeroInspecao.trim(),
  }

  const tabOrder: TabKey[] = ['identificacao', 'classificacao', 'gravidade', 'ocorrencia', 'anexos']
  const currentIdx = tabOrder.indexOf(tab)
  const allValid = tabOrder.every(k => tabValid[k])
  const completedCount = tabOrder.filter(k => tabValid[k]).length

  // Styles
  const inputCls = cn('w-full bg-[#f8fafc] border border-[#e3e8ef] rounded-lg h-10 px-3 text-[13.5px] outline-none focus:border-[#094780] transition-all')
  const formRowCls = cn('grid gap-4 items-center px-6 py-4 border-b border-[#e3e8ef] last:border-b-0')
  const labelCls = 'text-[13.5px] font-medium text-[#111827]'
  const sectionTitleCls = 'text-[11px] font-bold uppercase tracking-widest text-[#9ca3af] px-6 py-3 bg-[#f8fafc] border-b border-[#e3e8ef]'

  if (loadState === 'loading') return (
    <MedidaLayout title="Editar Medida">
        <div className="flex items-center justify-center h-[60vh] gap-3 text-[#9ca3af]">
            <Loader2 size={20} className="animate-spin" />
            <span>Carregando dados...</span>
        </div>
    </MedidaLayout>
  )

  return (
    <MedidaLayout title="Editar Medida">
      <div className="w-full flex flex-col bg-[#f4f6f9] min-h-[calc(100vh-60px)]">
        <div className="bg-white border-b border-[#e3e8ef] px-7 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[13px] text-[#9ca3af]">
            <button onClick={() => router.push('/medida-administrativa/lista')}>Medidas</button>
            <span>›</span>
            <span className="text-[#094780] font-semibold">Editar</span>
          </div>
          <span className="text-[11px] font-mono text-[#9ca3af] bg-[#f4f6f9] border px-2 py-1 rounded-md">ID #{medidaId.slice(-6)}</span>
        </div>

        {hasChanges && (
          <div className="bg-amber-50 border-b border-amber-200 px-7 py-2 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span className="text-[12px] text-amber-700 font-medium">Alterações não salvas</span>
          </div>
        )}

        <div className="bg-white border-b border-[#e3e8ef] px-7 flex overflow-x-auto">
          {TABS.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={cn('px-5 py-4 text-[13px] border-b-2 transition-all -mb-px', tab === t.key ? 'text-[#094780] border-[#094780] font-bold' : 'text-[#9ca3af] border-transparent')}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-8 pt-6 pb-28">
          {tab === 'identificacao' && (
            <div className="bg-white border border-[#e3e8ef] rounded-xl overflow-hidden">
              <div className={sectionTitleCls}>Identificação</div>
              <div className={cn(formRowCls, 'grid-cols-[200px_1fr]')}>
                <span className={labelCls}>Nome Colaborador *</span>
                <input type="text" value={nomeColab} onChange={e => setNomeColab(e.target.value)} className={inputCls} />
              </div>
              <div className={cn(formRowCls, 'grid-cols-[200px_1fr_1fr]')}>
                <span className={labelCls}>Matrículas (Colab/Sup) *</span>
                <input type="text" value={matriculaColab} onChange={e => { setMatriculaColab(e.target.value); validar(e.target.value, setStatusColab) }} className={inputCls} placeholder="M001" />
                <input type="text" value={matriculaSup} onChange={e => { setMatriculaSup(e.target.value); validar(e.target.value, setStatusSup) }} className={inputCls} placeholder="M002" />
              </div>
              <div className={cn(formRowCls, 'grid-cols-[200px_1fr]')}>
                <span className={labelCls}>Data *</span>
                <input type="date" value={dataMedida} onChange={e => setDataMedida(e.target.value)} className={cn(inputCls, 'max-w-[200px]')} />
              </div>
            </div>
          )}

          {tab === 'classificacao' && (
            <div className="bg-white border border-[#e3e8ef] rounded-xl overflow-hidden">
                <div className={sectionTitleCls}>Categoria e Tipo</div>
                <div className={cn(formRowCls, 'grid-cols-[200px_1fr]')}>
                    <span className={labelCls}>Categoria *</span>
                    <div className="flex gap-2">
                        {['SEGURANÇA', 'ADMINISTRATIVA'].map(opt => (
                            <button key={opt} onClick={() => setTipoCategoria(opt as any)} className={cn('px-4 py-2 rounded-lg border text-xs font-bold', tipoCategoria === opt ? 'bg-[#094780] text-white' : 'bg-white')}>{opt}</button>
                        ))}
                    </div>
                </div>
                <div className="p-6 space-y-2">
                    {['ADVERTÊNCIA VERBAL', 'ADVERTÊNCIA ESCRITA', 'SUSPENSÃO', 'CONVERSA PEDAGÓGICA', 'TREINAMENTO'].map(opt => (
                        <div key={opt} onClick={() => setTipoMedida(opt as any)} className={cn('p-3 rounded-lg border cursor-pointer flex justify-between', tipoMedida === opt ? 'border-[#094780] bg-blue-50' : 'border-[#e3e8ef]')}>
                            <span className="text-sm font-medium">{opt}</span>
                            {tipoMedida === opt && <CheckCircle size={16} className="text-[#094780]" />}
                        </div>
                    ))}
                </div>
            </div>
          )}

          {tab === 'gravidade' && (
              <div className="bg-white border border-[#e3e8ef] rounded-xl overflow-hidden">
                  <div className={sectionTitleCls}>Gravidade</div>
                  <div className="p-6 space-y-2">
                      {Object.keys(GRAVIDADE_CFG).map(key => (
                          <div key={key} onClick={() => setGravidade(key as any)} className={cn('p-4 rounded-lg border cursor-pointer flex items-center gap-3', gravidade === key ? 'border-[#094780] bg-blue-50' : 'border-[#e3e8ef]')}>
                              <div className="w-3 h-3 rounded-full" style={{ background: GRAVIDADE_CFG[key].color }} />
                              <span className="text-sm font-bold">{key}</span>
                          </div>
                      ))}
                  </div>
              </div>
          )}

          {tab === 'ocorrencia' && (
              <div className="bg-white border border-[#e3e8ef] rounded-xl overflow-hidden">
                  <div className={sectionTitleCls}>Ocorrência</div>
                  <div className="p-6 space-y-4">
                      <select value={classificacao} onChange={e => setClassificacao(e.target.value)} className={inputCls}>
                          <option value="">Selecione...</option>
                          {CLASSIFICACOES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <textarea value={ocorrencia} onChange={e => setOcorrencia(e.target.value)} rows={6} className={cn(inputCls, 'h-auto py-3')} placeholder="Descrição..." />
                  </div>
              </div>
          )}

          {tab === 'anexos' && (
              <div className="bg-white border border-[#e3e8ef] rounded-xl overflow-hidden">
                  <div className={sectionTitleCls}>Vínculo</div>
                  <div className="p-6">
                      <button onClick={() => setRelacionarClick(!relacionarClick)} className={cn('px-4 py-2 rounded-lg border font-bold text-xs', relacionarClick ? 'bg-[#094780] text-white' : 'bg-white')}>Vincular Inspeção</button>
                      {relacionarClick && <input type="text" value={numeroInspecao} onChange={e => setNumeroInspecao(e.target.value)} className={cn(inputCls, 'mt-4')} placeholder="Código da Inspeção" />}
                  </div>
              </div>
          )}
        </div>

        <div className="fixed bottom-0 left-0 right-0 bg-white border-t px-7 py-4 flex items-center justify-between">
          <button onClick={() => setDeleteModal(true)} className="flex items-center gap-2 text-red-500 font-bold text-sm"><Trash2 size={16}/> Excluir</button>
          <div className="flex gap-3">
             <button onClick={() => router.back()} className="px-4 py-2 border rounded-lg text-sm font-bold">Cancelar</button>
             <button disabled={!hasChanges || !allValid || isSaving} onClick={handleSave} className={cn('px-6 py-2 rounded-lg text-white font-bold text-sm', hasChanges && allValid ? 'bg-[#094780]' : 'bg-gray-200')}>
                {isSaving ? <Loader2 className="animate-spin" size={16}/> : 'Salvar Alterações'}
             </button>
          </div>
        </div>

        {successModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white p-10 rounded-2xl text-center shadow-xl max-w-xs">
              <CheckCircle size={40} className="text-emerald-500 mx-auto mb-4" />
              <h3 className="font-bold text-lg">Sucesso!</h3>
              <p className="text-gray-500 text-sm mb-6">Medida atualizada com sucesso.</p>
              <button onClick={() => router.push('/medida-administrativa/lista')} className="w-full py-3 bg-[#094780] text-white rounded-xl font-bold">Voltar para Lista</button>
            </div>
          </div>
        )}

        {deleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white p-8 rounded-2xl text-center max-w-xs">
              <Trash2 size={40} className="text-red-500 mx-auto mb-4" />
              <h3 className="font-bold">Excluir Medida?</h3>
              <p className="text-gray-500 text-sm mb-6">Esta ação não pode ser desfeita.</p>
              <div className="flex gap-2">
                <button onClick={() => setDeleteModal(false)} className="flex-1 py-2 border rounded-lg font-bold">Não</button>
                <button onClick={handleDelete} className="flex-1 py-2 bg-red-500 text-white rounded-lg font-bold">Sim, excluir</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MedidaLayout>
  )
}