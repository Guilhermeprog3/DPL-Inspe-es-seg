'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { useParams, useRouter } from 'next/navigation'
import { MedidaLayout } from '@/components/layout/MedidasLayout'
import {
  User, Tag, AlertTriangle, FileText,
  Paperclip, Link2, CheckCircle, Loader2,
  Save, Trash2, AlertCircle, Search, X, ChevronDown
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Tipos e Configurações ──────────────────────────────────────────────────
type TipoCategoria = 'SEGURANÇA' | 'ADMINISTRATIVA' | ''
type TipoMedida =
  | 'ADVERTÊNCIA VERBAL' | 'ADVERTÊNCIA ESCRITA' | 'SUSPENSÃO'
  | 'CONVERSA PEDAGÓGICA' | 'TREINAMENTO' | ''
type Gravidade = 'LEVE' | 'MÉDIA' | 'GRAVE' | 'GRAVÍSSIMA' | ''

type LoadState = 'loading' | 'success' | 'error'

const CLASSIFICACOES_DATA = [
  "ADMNISTRATIVA", "NÃO CONFORMIDADE GRAVE EM PROCEDIMENTOS DE SEGURANÇA DURANTE A ATIVIDADE", "VELOCIDADE", "PAPEL DE GUARDIÃO", "CELULAR", "REINTEGRA", "CÂMERA", "LUVA/MANGA ISOLANTE/PROTETOR FACIAL", "OBSTRUÇÃO DE CÂMERA", "REGRAS DE OURO", "LUVAS DE VAQUETA/ VISEIRA/ BALACLAVA", "EPI / EPI'S", "CAMISA POR FORA DA CALÇA/ PERNEIRAS/ÓCULOS DE PROTEÇÃO/CINTO PARAQUEDITAS/CAPACETE/SINALIZAÇÃO", "CINTO DE SEGURANÇA", "SINALIZAÇÃO/PR", "SONOLÊNCIA", "PROTETOR FACIAL/SEM SINALIZAÇÃO/ SEM GUARDIÃO", "EXCESSO DE VELOCIDADE", "MANTAS ISOLANTES", "VELOCIDADE/ OBSTRUÇÃO", "ATERRAMENTO TEMPORÁRIO BT", "MANOBRA DE RÉ / MANOBRA MARCHA RÉ", "COLABORADOR NÃO SE APRESENTOU NO SOBREAVISO", "BALACLAVA/LUVA ISOLANTE/LUVA DE COBERTURA/VESTIMENTA RF", "VELOCIDADE/ CELULAR", "CABO DE MT PARTIDO", "FOLHA DE PONTO", "CAPACETE", "APR", "NÃO UTILIZOU EPI ADEQUADO", "PROTETOR FACIAL", "NÃO COMUNICOU ACIDENTE DE TRABALHO", "BALACLAVA/PROTETOR FACIAL/SINALIZAÇÃO", "NOTA COMERCIAL ENCERRADA DE FORMA INCORRETA", "LUVA CLASSE 0", "LENÇOL ISOLANTE/ BALACLAVA/ MANGA ISOLANTE/ SINALIZAÇÃO", "PNEUS", "ESCADA/ MANGAS ISOLANTES/LENÇÓIS ISOLANTES/CINTO PARAQUEDITA", "FALTA DE SINALIZAÇÃO NO LOCAL DE SERVIÇO", "RECUSOU SE DESLOCAR PARA OUTRA CIDADE (SOLITAÇÃO DO SUPERVISOR DE CAMPO)", "ERRO DE PROCEDIMENTO OPERACIONAL", "TRANSITAR EM VIA PÚBLICA PELA CONTRA MÃO", "BANDEIROLA", "ESCADA/TRAVA QUEDAS", "PROTETOR FACIAL(VISEIRA)", "ESCADA", "AUSÊNCIA SEM JUSTIFICATIVA NA REC DE NR35", "LUVA ISOLANTE/ LUVA DE COBERTURA/VESTIMENTA RF", "DESCUPRIMENTO DAS LEIS DE TRÂNSITO", "DELIMITAÇÃO DA AREA/EPI", "CELULAR/EXCESSO DE VELOCIDADE", "FREIO ABS/TRAVA QUEDA", "CIGARRO / FUMANDO", "DESVIO DE CONDUTA", "APR PREENCHIDA INCORRETAMENTE E EXECUÇÃO DA TAREFA SEM SINALIZAÇÃO ADEQUADA", "RECUSA INJUSTIFICADA EM CUMPRIR ORDENS DE TRABALHO", "TAXA DE CONTATO", "DESCUMPRIMENTO DE PROCEDIMENTO CRÍTICO DE SEGURANÇA", "DESCUMPRIR NORMAS E PROCEDIMENTOS INTERNOS DA EMPRESA", "FALHA DE PROCEDIMENTO / ATO INSEGURO", "FALHA DE PROCEDIMENTO / NEGLIGÊNCIA", "EXERCÍCIO INDEVIDO DE FUNÇÃO", "LINHA VIVA", "EPC/PROCEDIMENTO DE SEGURANÇA", "SEM SINALIZAÇÃO DA AREA/PAPEL DE GUARDIÃO", "SEM SINALIZAÇÃO DA AREA/EPI", "VELOCIDADE/CELULAR", "DESVIOS DE SEGURANÇA", "CNH/DIREÇÃO DISTRAÍDA", "DIREÇÃO DISTRAÍDA", "NÃO UTILIZOU ESCADA/ANCORAGEM/TRAVA QUEDAS/LUVA ISOLANTE/NÃO UTILIZOU VEICULO COMO BARREIRA", "CELULAR/OBSTRUÇÃO CÂMERA", "NÃO UTILIZOU A FITA DE ANCORAGEM", "VELOCIDADE/DIREÇÃO DISTRAÍDA/OBSTRUÇÃO", "CÂMERA OBSTRUIDA/DIREÇÃO DISTRAÍDA", "POSSIVEL USO DO CELULAR", "NEGLIGÊNCIA DURANTE A ATIVIDADE", "NÃO UTILIZOU A FITA DE ANCORAGEM/EPI/EPC", "REALIZANDO A TAREFA COM A ÁREA DE TRABALHO NÃO ISOLADA/EPI/EPC", "FALHA DE PROCEDIMENTO / ATO INSEGURO / SEM GUARDIÃO DA VIDA", "ATO INSEGURO / SEM GUARDIÃO DA VIDA", "ATO INSEGURO", "NÃO UTILIZAÇÃO DOS EPI'S, EPC'S OU ESCADAS, DANIFICADAS E/OU NÃO INSPECIONADOS", "EFETUOU MANOBRA DE RÉ SEM AUXILIO DO GUARDIÃO/ACABOU COLIDINDO COM PORTÃO DA BASE", "DEIXOU DE UTILIZAR ACESSÓRIOS OBRIGATÓRIOS PARA MOVIMENTAÇÃO DE CARGA SUSPENSA", "AUTOINSPECÇÃO DIÁRIA", "CONSTRUÇÃO/MANUTENÇÃO", "FICHA SEGURANÇA", "UTILIZAÇÃO DA VESTIMENTA DANIFICADA", "SEM O USO DO CINTO DE SEGURANÇA", "DESCUMPRIMENTO DA LEGISLAÇÃO DE TRÂNSITO VIGENTE DURANTE A CONDUÇÃO DE VEÍCULO DA EMPRESA", "PERMITIR A APROXIMAÇÃO OU PERMANENCIA DE TERCEIROS DENTRO DA AREA ISOLADA PARA SERVIÇO", "DIREÇÃO DISTRAÍDA/VELOCIDADE", "VELOCIDADE/OBSTRUÇÃO", "DESCUMPRIMENTO DE NORMAS E PROCEDIMENTOS INTERNOS", "VELOCIDADE/CÂMERA OBSTRUIDA/USO DO CELULAR DURANTE CONDUÇÃO", "VELOCIDADE/DIREÇÃO DISTRAIDA", "NÃO COMUNICAÇÃO DE AVARIA VEICULAR", "OBSTRUÇÃO CÂMERA", "ATERRAMENTO", "DESCUMPRIMENTO DE NORMAS E PROCEDIMENTOS", "EFETUOU MANOBRA DE RÉ SEM AUXILIO DO GUARDIÃO/ACABOU COLIDINDO COM UM TERCEIRO", "TRABALHAR SEM ESCADA AMARRADA/SEM USAR EPI-EPC/NÃO UTILIZAR LUVAS ISOLANTES BT e AT NA EXECUÇÃO DA ATIVIDADE", "DESCUMPRIMENTO DA HIERARQUIA FUNCIONAL /VIOLAÇÃO PROCEDIMENTO DE SEGURANÇA/INSUBORDINAÇÃO", "COLABORADOR ESTAVA COCHILANDO AO VOLANTE"
]

const GRAVIDADE_CFG: Record<string, { color: string }> = {
  LEVE: { color: '#10b981' },
  MÉDIA: { color: '#f59e0b' },
  GRAVE: { color: '#ef4444' },
  GRAVÍSSIMA: { color: '#a855f7' },
}

const TABS = [
  { key: 'identificacao', label: 'Identificação', icon: User },
  { key: 'classificacao', label: 'Classificação', icon: Tag },
  { key: 'gravidade', label: 'Gravidade', icon: AlertTriangle },
  { key: 'ocorrencia', label: 'Ocorrência', icon: FileText },
  { key: 'anexos', label: 'Anexos & Vínculo', icon: Paperclip },
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

  // Pesquisa Classificação
  const [searchQuery, setSearchQuery] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)

  const filteredClassificacoes = useMemo(() => {
    if (!searchQuery) return CLASSIFICACOES_DATA
    return CLASSIFICACOES_DATA.filter(item => 
      item.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [searchQuery])

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

        setNomeColab(data.colaborador ?? '')
        setMatriculaColab(data.matricula ?? '')
        setMatriculaSup(data.supervisor ?? '')
        setDataMedida(data.data ? data.data.slice(0, 10) : '')
        setTipoCategoria((data.tipo as TipoCategoria) ?? '')
        setTipoMedida((data.medida as TipoMedida) ?? '')
        setDiasSuspensao(data.diasSuspensao ? String(data.diasSuspensao) : '')
        setGravidade((data.gravidade as Gravidade) ?? '')
        setClassificacao(data.classificacao ?? '')
        setSearchQuery(data.classificacao ?? '') // Preenche a pesquisa com o valor atual
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

  // Detectar alterações
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
      diasSuspensao: diasSuspensao ? Number(diasSuspensao) : null,
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
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeUp { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
        .fade-up { animation: fadeUp 0.2s ease forwards; }
      `}} />

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
              {tabValid[t.key] && <span className="ml-2 w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-8 pt-6 pb-28">
          {tab === 'identificacao' && (
            <div className="fade-up bg-white border border-[#e3e8ef] rounded-xl overflow-hidden">
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
            <div className="fade-up bg-white border border-[#e3e8ef] rounded-xl overflow-hidden">
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
                {tipoMedida === 'SUSPENSÃO' && (
                  <div className={cn(formRowCls, 'grid-cols-[200px_1fr]')}>
                    <span className={labelCls}>Dias de Suspensão *</span>
                    <input type="number" value={diasSuspensao} onChange={e => setDiasSuspensao(e.target.value)} className={cn(inputCls, 'max-w-[150px]')} />
                  </div>
                )}
            </div>
          )}

          {tab === 'gravidade' && (
              <div className="fade-up bg-white border border-[#e3e8ef] rounded-xl overflow-hidden">
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
              <div className="fade-up bg-white border border-[#e3e8ef] rounded-xl overflow-hidden">
                  <div className={sectionTitleCls}>Ocorrência</div>
                  <div className="p-6 space-y-6">
                      <div className="relative">
                        <label className="text-[12px] font-bold text-slate-500 uppercase mb-1.5 block">Classificação *</label>
                        <div className="relative group">
                          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                          <input 
                            type="text" 
                            className={cn(inputCls, "pl-12 h-12")}
                            placeholder="Pesquise o motivo..."
                            value={searchQuery}
                            onFocus={() => setShowDropdown(true)}
                            onChange={(e) => {
                              const val = e.target.value
                              setSearchQuery(val)
                              if (val === '') setClassificacao('') 
                              setShowDropdown(true)
                            }}
                          />
                          {searchQuery && (
                            <button onClick={() => { setSearchQuery(''); setClassificacao(''); }} className="absolute right-10 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500">
                              <X size={14} />
                            </button>
                          )}
                          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                        </div>

                        {showDropdown && (
                          <>
                            <div className="fixed inset-0 z-30" onClick={() => setShowDropdown(false)} />
                            <div className="absolute left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl z-40 max-h-64 overflow-y-auto p-2">
                              {filteredClassificacoes.length > 0 ? filteredClassificacoes.map((item, i) => (
                                <button key={i} type="button" onClick={() => { setClassificacao(item); setSearchQuery(item); setShowDropdown(false); }} 
                                  className={cn("w-full text-left px-4 py-3 text-[13px] font-semibold rounded-xl transition-all mb-1 last:mb-0", 
                                  classificacao === item ? "bg-blue-50 text-[#094780]" : "text-slate-600 hover:bg-slate-50")}>
                                  {item}
                                </button>
                              )) : (
                                <div className="p-4 text-center text-slate-400 text-xs">Nenhum resultado encontrado.</div>
                              )}
                            </div>
                          </>
                        )}
                      </div>

                      <div>
                        <label className="text-[12px] font-bold text-slate-500 uppercase mb-1.5 block">Descrição *</label>
                        <textarea value={ocorrencia} onChange={e => setOcorrencia(e.target.value)} rows={6} className={cn(inputCls, 'h-auto py-3')} placeholder="Descrição detalhada..." />
                      </div>
                  </div>
              </div>
          )}

          {tab === 'anexos' && (
              <div className="fade-up bg-white border border-[#e3e8ef] rounded-xl overflow-hidden">
                  <div className={sectionTitleCls}>Vínculo</div>
                  <div className="p-6 text-center">
                      <button onClick={() => setRelacionarClick(!relacionarClick)} className={cn('px-6 py-3 rounded-xl border-2 font-bold transition-all', relacionarClick ? 'bg-[#094780] border-[#094780] text-white shadow-lg' : 'bg-white border-slate-100 text-slate-400')}>
                        <Link2 size={18} className="inline mr-2" /> {relacionarClick ? 'Inspeção Vinculada' : 'Vincular Inspeção'}
                      </button>
                      {relacionarClick && <input type="text" value={numeroInspecao} onChange={e => setNumeroInspecao(e.target.value)} className={cn(inputCls, 'mt-4 max-w-[300px] mx-auto block text-center')} placeholder="Número da Inspeção" />}
                  </div>
              </div>
          )}
        </div>

        <div className="fixed bottom-0 left-0 right-0 bg-white border-t px-7 py-4 flex items-center justify-between z-50">
          <button onClick={() => setDeleteModal(true)} className="flex items-center gap-2 text-red-500 font-bold text-sm"><Trash2 size={16}/> Excluir</button>
          <div className="flex gap-3">
             <button onClick={() => router.back()} className="px-4 py-2 border rounded-lg text-sm font-bold hover:bg-slate-50 transition-colors">Cancelar</button>
             <button disabled={!hasChanges || !allValid || isSaving} onClick={handleSave} className={cn('px-6 py-2 rounded-lg text-white font-bold text-sm transition-all', hasChanges && allValid ? 'bg-[#094780] shadow-lg shadow-blue-900/20' : 'bg-gray-200 cursor-not-allowed')}>
                {isSaving ? <Loader2 className="animate-spin" size={16}/> : 'Salvar Alterações'}
             </button>
          </div>
        </div>

        {/* Modais de Sucesso e Deleção idênticos ao padrão */}
        {successModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white p-10 rounded-[40px] text-center shadow-2xl max-w-sm">
              <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle size={48} className="text-emerald-500" />
              </div>
              <h3 className="font-bold text-xl mb-2">Atualizado!</h3>
              <p className="text-slate-500 text-sm mb-8 leading-relaxed">As alterações foram salvas com sucesso no banco de dados.</p>
              <button onClick={() => router.push('/medida-administrativa/lista')} className="w-full py-4 bg-[#094780] text-white rounded-2xl font-bold">Voltar para Lista</button>
            </div>
          </div>
        )}

        {deleteModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white p-8 rounded-3xl text-center max-w-xs shadow-2xl">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={32} className="text-red-500" />
              </div>
              <h3 className="font-bold text-lg">Excluir Medida?</h3>
              <p className="text-slate-500 text-sm mb-6 leading-relaxed">Esta ação removerá permanentemente este registro.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteModal(false)} className="flex-1 py-2 border rounded-xl font-bold hover:bg-slate-50">Não</button>
                <button onClick={handleDelete} className="flex-1 py-2 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600">Sim, excluir</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MedidaLayout>
  )
}