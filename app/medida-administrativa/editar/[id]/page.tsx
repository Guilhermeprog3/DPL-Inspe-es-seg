'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useParams, useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import {
  User, Tag, AlertTriangle, FileText,
  Paperclip, CheckCircle, Loader2,
  Trash2, Search, X,
  Upload, File, FileImage, LayoutDashboard, PlusCircle, List, AlertCircle,
  Link2, Hash
} from 'lucide-react'
import { cn } from '@/lib/utils'
import api from '@/lib/api'

type TipoCategoria = 'SEGURANÇA' | 'ADMINISTRATIVA' | ''
type TipoMedida    = 'ADVERTÊNCIA VERBAL' | 'ADVERTÊNCIA ESCRITA' | 'SUSPENSÃO' | 'CONVERSA PEDAGÓGICA' | 'TREINAMENTO' | ''
type Gravidade     = 'LEVE' | 'MÉDIA' | 'GRAVE' | 'GRAVÍSSIMA' | 'TOLERÂNCIA ZERO' | ''
type LoadState     = 'loading' | 'success' | 'error'
type Anexo         = { id: string; file?: File; preview?: string; url?: string; nome: string; tipo: string }

const navItems = [
  { section: 'Medida Administrativa' },
  { label: 'Dashboard',     href: '/medida-administrativa',       icon: LayoutDashboard },
  { section: 'Operações' },
  { label: 'Nova Medida',   href: '/medida-administrativa/nova',  icon: PlusCircle },
  { label: 'Histórico',     href: '/medida-administrativa/lista', icon: List },
]

const CLASSIFICACOES_DATA = [
  "ADMNISTRATIVA","NÃO CONFORMIDADE GRAVE EM PROCEDIMENTOS DE SEGURANÇA DURANTE A ATIVIDADE","VELOCIDADE","PAPEL DE GUARDIÃO","CELULAR","REINTEGRA","CÂMERA","LUVA/MANGA ISOLANTE/PROTETOR FACIAL","OBSTRUÇÃO DE CÂMERA","REGRAS DE OURO","LUVAS DE VAQUETA/ VISEIRA/ BALACLAVA","EPI / EPI'S","CAMISA POR FORA DA CALÇA/ PERNEIRAS/ÓCULOS DE PROTEÇÃO/CINTO PARAQUEDITAS/CAPACETE/SINALIZAÇÃO","CINTO DE SEGURANÇA","SINALIZAÇÃO/PR","SONOLÊNCIA","PROTETOR FACIAL/SEM SINALIZAÇÃO/ SEM GUARDIÃO","EXCESSO DE VELOCIDADE","MANTAS ISOLANTES","VELOCIDADE/ OBSTRUÇÃO","ATERRAMENTO TEMPORÁRIO BT","MANOBRA DE RÉ / MANOBRA MARCHA RÉ","COLABORADOR NÃO SE APRESENTOU NO SOBREAVISO","BALACLAVA/LUVA ISOLANTE/LUVA DE COBERTURA/VESTIMENTA RF","VELOCIDADE/ CELULAR","CABO DE MT PARTIDO","FOLHA DE PONTO","CAPACETE","APR","NÃO UTILIZOU EPI ADEQUADO","PROTETOR FACIAL","NÃO COMUNICOU ACIDENTE DE TRABALHO","BALACLAVA/PROTETOR FACIAL/SINALIZAÇÃO","NOTA COMERCIAL ENCERRADA DE FORMA INCORRETA","LUVA CLASSE 0","LENÇOL ISOLANTE/ BALACLAVA/ MANGA ISOLANTE/ SINALIZAÇÃO","PNEUS","ESCADA/ MANGAS ISOLANTES/LENÇÓIS ISOLANTES/CINTO PARAQUEDITA","FALTA DE SINALIZAÇÃO NO LOCAL DE SERVIÇO","RECUSOU SE DESLOCAR PARA OUTRA CIDADE (SOLITAÇÃO DO SUPERVISOR DE CAMPO)","ERRO DE PROCEDIMENTO OPERACIONAL","TRANSITAR EM VIA PÚBLICA PELA CONTRA MÃO","BANDEIROLA","ESCADA/TRAVA QUEDAS","PROTETOR FACIAL(VISEIRA)","ESCADA","AUSÊNCIA SEM JUSTIFICATIVA NA REC DE NR35","LUVA ISOLANTE/ LUVA DE COBERTURA/VESTIMENTA RF","DESCUPRIMENTO DAS LEIS DE TRÂNSITO","DELIMITAÇÃO DA AREA/EPI","CELULAR/EXCESSO DE VELOCIDADE","FREIO ABS/TRAVA QUEDA","CIGARRO / FUMANDO","DESVIO DE CONDUTA","APR PREENCHIDA INCORRETAMENTE E EXECUÇÃO DA TAREFA SEM SINALIZAÇÃO ADEQUADA","RECUSA INJUSTIFICADA EM CUMPRIR ORDENS DE TRABALHO","TAXA DE CONTATO","DESCUMPRIMENTO DE PROCEDIMENTO CRÍTICO DE SEGURANÇA","DESCUMPRIR NORMAS E PROCEDIMENTOS INTERNOS DA EMPRESA","FALHA DE PROCEDIMENTO / ATO INSEGURO","FALHA DE PROCEDIMENTO / NEGLIGÊNCIA","EXERCÍCIO INDEVIDO DE FUNÇÃO","LINHA VIVA","EPC/PROCEDIMENTO DE SEGURANÇA","SEM SINALIZAÇÃO DA AREA/PAPEL DE GUARDIÃO","SEM SINALIZAÇÃO DA AREA/EPI","VELOCIDADE/CELULAR","DESVIOS DE SEGURANÇA","CNH/DIREÇÃO DISTRAÍDA","DIREÇÃO DISTRAÍDA","NÃO UTILIZOU ESCADA/ANCORAGEM/TRAVA QUEDAS/LUVA ISOLANTE/NÃO UTILIZOU VEICULO COMO BARREIRA","CELULAR/OBSTRUÇÃO CÂMERA","NÃO UTILIZOU A FITA DE ANCORAGEM","VELOCIDADE/DIREÇÃO DISTRAÍDA/OBSTRUÇÃO","CÂMERA OBSTRUIDA/DIREÇÃO DISTRAÍDA","POSSIVEL USO DO CELULAR","NEGLIGÊNCIA DURANTE A ATIVIDADE","NÃO UTILIZOU A FITA DE ANCORAGEM/EPI/EPC","REALIZANDO A TAREFA COM A ÁREA DE TRABALHO NÃO ISOLADA/EPI/EPC","FALHA DE PROCEDIMENTO / ATO INSEGURO / SEM GUARDIÃO DA VIDA","ATO INSEGURO / SEM GUARDIÃO DA VIDA","ATO INSEGURO","NÃO UTILIZAÇÃO DOS EPI'S, EPC'S OU ESCADAS, DANIFICADAS E/OU NÃO INSPECIONADOS","EFETUOU MANOBRA DE RÉ WITHOUT AUXILIO DO GUARDIÃO/ACABOU COLIDINDO COM PORTÃO DA BASE","DEIXOU DE UTILIZAR ACESSÓRIOS OBRIGATÓRIOS PARA MOVIMENTAÇÃO DE CARGA SUSPENSA","AUTOINSPECÇÃO DIÁRIA","CONSTRUÇÃO/MANUTENÇÃO","FICHA SEGURANÇA","UTILIZAÇÃO DA VESTIMENTA DANIFICADA","SEM O USO DO CINTO DE SEGURANÇA","DESCUMPRIMENTO DA LEGISLAÇÃO DE TRÂNSITO VIGENTE DURANTE A CONDUÇÃO DE VEÍCULO DA EMPRESA","PERMITIR A APROXIMAÇÃO OU PERMANENCIA DE TERCEIROS DENTRO DA AREA ISOLADA PARA SERVIÇO","DIREÇÃO DISTRAÍDA/VELOCIDADE","VELOCIDADE/OBSTRUÇÃO","DESCUMPRIMENTO DE NORMAS E PROCEDIMENTOS INTERNOS","VELOCIDADE/CÂMERA OBSTRUIDA/USO DO CELULAR DURANTE CONDUÇÃO","VELOCIDADE/DIREÇÃO DISTRAIDA","NÃO COMUNICAÇÃO DE AVARIA VEICULAR","OBSTRUÇÃO CÂMERA","ATERRAMENTO","DESCUMPRIMENTO DE NORMAS E PROCEDIMENTOS","EFETUOU MANOBRA DE RÉ WITHOUT AUXILIO DO GUARDIÃO/ACABOU COLIDINDO com UM TERCEIRO","TRABALHAR SEM ESCADA AMARRADA/SEM USAR EPI-EPC/NÃO UTILIZAR LUVAS ISOLANTES BT e AT NA EXECUÇÃO DA ATIVIDADE","DESCUMPRIMENTO DA HIERARQUIA FUNCIONAL /VIOLAÇÃO PROCEDIMENTO DE SEGURANÇA/INSUBORDINAÇÃO","COLABORADOR ESTAVA COCHILANDO AO VOLANTE",
  "OUTROS"
]

const ORIGENS = ['ESS', 'CLICK', 'NMC', 'MULTA DE TRÂNSITO', 'GESTÃO DE GENTE']

const GRAVIDADE_CFG: Record<string, { color: string; bg: string; border: string; label: string }> = {
  LEVE:               { color: '#10b981', bg: '#f0fdf4', border: '#10b981', label: 'Ocorrência de baixo impacto' },
  MÉDIA:              { color: '#f59e0b', bg: '#fffbeb', border: '#f59e0b', label: 'Requer atenção e acompanhamento' },
  GRAVE:              { color: '#ef4444', bg: '#fef2f2', border: '#ef4444', label: 'Impacto significativo na segurança' },
  GRAVÍSSIMA:         { color: '#a855f7', bg: '#faf5ff', border: '#a855f7', label: 'Risco crítico — ação imediata' },
  'TOLERÂNCIA ZERO':  { color: '#000000', bg: '#f1f5f9', border: '#000000', label: 'Violação de norma absoluta' },
}

const TABS = [
  { key: 'identificacao', label: 'Identificação',    icon: User },
  { key: 'classificacao', label: 'Classificação',    icon: Tag },
  { key: 'gravidade',     label: 'Gravidade',        icon: AlertTriangle },
  { key: 'ocorrencia',    label: 'Ocorrência',       icon: FileText },
  { key: 'anexos',        label: 'Anexos & Vínculo', icon: Paperclip },
] as const

type TabKey = typeof TABS[number]['key']

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return (
    <div className="flex items-center gap-1.5 mt-1.5">
      <AlertCircle size={12} className="text-red-500 shrink-0" />
      <span className="text-[11px] text-red-500 font-medium">{message}</span>
    </div>
  )
}

function AbsoluteDropdown({ open, children }: { open: boolean; children: React.ReactNode }) {
  if (!open) return null
  return (
    <div className="slide-down absolute left-0 right-0 top-[calc(100%+4px)] z-[200] bg-white border border-slate-200 rounded-xl shadow-2xl max-h-60 overflow-y-auto">
      {children}
    </div>
  )
}

export default function EditarMedidaPage() {
  const { data: session } = useSession()
  const params   = useParams()
  const router   = useRouter()
  const medidaId = params?.id as string
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [loadState,    setLoadState   ] = useState<LoadState>('loading')
  const [tab,          setTab         ] = useState<TabKey>('identificacao')
  const [successModal, setSuccessModal] = useState(false)
  const [deleteModal,  setDeleteModal ] = useState(false)
  const [isSaving,     setIsSaving    ] = useState(false)
  const [isDeleting,   setIsDeleting  ] = useState(false)
  const [hasChanges,   setHasChanges  ] = useState(false)
  const [original,     setOriginal    ] = useState<Record<string, any>>({})

  const [colabSelecionado, setColabSelecionado] = useState<any>(null)
  const [supSelecionado,   setSupSelecionado  ] = useState<any>(null)

  const [nomeColabInput, setNomeColabInput] = useState('')
  const [matColabInput,  setMatColabInput ] = useState('')
  const [nomeSupInput,   setNomeSupInput  ] = useState('')
  const [matSupInput,    setMatSupInput   ] = useState('')

  const [dataMedida,    setDataMedida   ] = useState('')
  const [tipoCategoria, setTipoCategoria] = useState<TipoCategoria>('')
  const [tipoMedida,    setTipoMedida   ] = useState<TipoMedida>('')
  const [diasSuspensao, setDiasSuspensao] = useState('')
  const [gravidade,     setGravidade    ] = useState<Gravidade>('')
  const [classificacao, setClassificacao] = useState('')
  const [ocorrencia,    setOcorrencia   ] = useState('')
  const [origem,        setOrigem       ] = useState('')

  const [inspecoes,    setInspecoes   ] = useState<string[]>([])
  const [novaInspecao, setNovaInspecao] = useState('')

  function adicionarInspecao() {
    const val = novaInspecao.trim()
    if (!val || inspecoes.includes(val)) return
    setInspecoes(prev => [...prev, val])
    setNovaInspecao('')
    setHasChanges(true)
  }

  function removerInspecao(idx: number) {
    setInspecoes(prev => prev.filter((_, i) => i !== idx))
    setHasChanges(true)
  }

  const [showColabDropdown,     setShowColabDropdown    ] = useState(false)
  const [showMatriculaDropdown, setShowMatriculaDropdown] = useState(false)
  const [showSupDropdown,       setShowSupDropdown      ] = useState(false)
  const [showMatSupDropdown,    setShowMatSupDropdown   ] = useState(false)
  const [showClassifDropdown,   setShowClassifDropdown  ] = useState(false)

  const [classificacaoSelecionada, setClassificacaoSelecionada] = useState(false)
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  function touch(field: string) {
    setTouched(prev => ({ ...prev, [field]: true }))
  }

  const [colaboradoresRepo, setColaboradoresRepo] = useState<any[]>([])
  const [searchQuery,       setSearchQuery       ] = useState('')
  const [anexos,            setAnexos            ] = useState<Anexo[]>([])
  const [isDragging,        setIsDragging        ] = useState(false)

  useEffect(() => {
    if (!session) return
    api.get('/base-gente/recentes/').then(r => {
      const data = Array.isArray(r.data) ? r.data : (r.data?.data || [])
      setColaboradoresRepo(data)
    }).catch(console.error)
  }, [session])

  // ── Filtros de busca — comparação sempre em string ──────────────────────────
  const colabsFiltradosNome = useMemo(() => {
    const t = nomeColabInput.trim().toLowerCase()
    if (t.length < 2) return []
    return colaboradoresRepo.filter(c => String(c.nome || '').toLowerCase().includes(t)).slice(0, 8)
  }, [nomeColabInput, colaboradoresRepo])

  const colabsFiltradosMat = useMemo(() => {
    const t = matColabInput.trim()
    if (!t) return []
    return colaboradoresRepo.filter(c => String(c.chapa || '').includes(t)).slice(0, 8)
  }, [matColabInput, colaboradoresRepo])

  const supsFiltradosNome = useMemo(() => {
    const t = nomeSupInput.trim().toLowerCase()
    if (t.length < 2) return []
    return colaboradoresRepo.filter(c => String(c.nome || '').toLowerCase().includes(t)).slice(0, 8)
  }, [nomeSupInput, colaboradoresRepo])

  const supsFiltradosMat = useMemo(() => {
    const t = matSupInput.trim()
    if (!t) return []
    return colaboradoresRepo.filter(c => String(c.chapa || '').includes(t)).slice(0, 8)
  }, [matSupInput, colaboradoresRepo])

  const filteredClassificacoes = useMemo(() =>
    searchQuery ? CLASSIFICACOES_DATA.filter(i => i.toLowerCase().includes(searchQuery.toLowerCase())) : CLASSIFICACOES_DATA
  , [searchQuery])

  // ── Helpers de seleção ──────────────────────────────────────────────────────
  // A chave da correção: sempre normalizar chapa para string antes de comparar
  function selecionarColab(item: any) {
    const normalizado = { ...item, chapa: String(item.chapa ?? '') }
    setColabSelecionado(normalizado)
    setNomeColabInput(normalizado.nome)
    setMatColabInput(normalizado.chapa)
    setShowColabDropdown(false)
    setShowMatriculaDropdown(false)
    setHasChanges(true)
  }

  function selecionarSupervisor(item: any) {
    const normalizado = { ...item, chapa: String(item.chapa ?? '') }
    setSupSelecionado(normalizado)
    setNomeSupInput(normalizado.nome)
    setMatSupInput(normalizado.chapa)
    setShowSupDropdown(false)
    setShowMatSupDropdown(false)
    setHasChanges(true)
  }

  function handleFilesAdd(files: FileList | null) {
    if (!files) return
    setAnexos(prev => [
      ...prev,
      ...Array.from(files).map(file => ({
        id: Math.random().toString(36).slice(2),
        file,
        nome: file.name,
        tipo: file.type,
        preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
      })),
    ])
    setHasChanges(true)
  }

  function removerAnexo(id: string) {
    setAnexos(prev => {
      const a = prev.find(x => x.id === id)
      if (a?.preview) URL.revokeObjectURL(a.preview)
      return prev.filter(x => x.id !== id)
    })
    setHasChanges(true)
  }

  const renderIcon = (tipo: string) => {
    if (tipo.startsWith('image/'))  return <FileImage size={20} className="text-blue-400" />
    if (tipo.includes('pdf'))       return <FileText  size={20} className="text-red-400"  />
    return <File size={20} className="text-slate-400" />
  }

  useEffect(() => () => anexos.forEach(a => a.preview && URL.revokeObjectURL(a.preview)), [])

  useEffect(() => {
    if (!medidaId || !session) return
    async function fetchMedida() {
      try {
        setLoadState('loading')
        const res = await api.get(`/medidas/${medidaId}`)
        const d   = res.data

        const chapaColab = String(d.matricula ?? '')
        const chapaSup   = String(d.supervisor ?? '')

        setNomeColabInput(d.colaborador ?? '')
        setMatColabInput(chapaColab)
        setMatSupInput(chapaSup)
        setNomeSupInput(d.nomeSupervisor ?? '')
        setDataMedida(d.data ? d.data.slice(0, 10) : '')
        setTipoCategoria((d.tipo as TipoCategoria) ?? '')
        setTipoMedida((d.medida as TipoMedida) ?? '')
        setDiasSuspensao(d.diasSuspensao ? String(d.diasSuspensao) : '')
        setGravidade((d.gravidade as Gravidade) ?? '')
        setClassificacao(d.classificacao ?? '')
        setSearchQuery(d.classificacao ?? '')
        setOcorrencia(d.ocorrencia ?? '')
        setOrigem(d.origem ?? '')

        if (Array.isArray(d.numerosInspecao) && d.numerosInspecao.length > 0) {
          setInspecoes(d.numerosInspecao)
        } else if (d.numeroInspecao) {
          setInspecoes([d.numeroInspecao])
        } else {
          setInspecoes([])
        }

        if (d.classificacao) setClassificacaoSelecionada(true)

        // Popula os objetos selecionados com chapa sempre como string
        if (d.colaborador) setColabSelecionado({ nome: d.colaborador, chapa: chapaColab })
        if (d.nomeSupervisor) setSupSelecionado({ nome: d.nomeSupervisor, chapa: chapaSup })

        if (d.anexos && Array.isArray(d.anexos)) {
          setAnexos(d.anexos.map((a: any) => ({
            id:   String(a.id),
            nome: a.nome,
            url:  a.url,
            tipo: a.tipo || 'application/octet-stream',
          })))
        }

        setOriginal({
          colaborador:     d.colaborador    ?? '',
          matricula:       chapaColab,
          supervisor:      chapaSup,
          nomeSupervisor:  d.nomeSupervisor ?? '',
          data:            d.data ? d.data.slice(0, 10) : '',
          tipo:            d.tipo           ?? '',
          medida:          d.medida         ?? '',
          diasSuspensao:   d.diasSuspensao ? String(d.diasSuspensao) : '',
          gravidade:       d.gravidade      ?? '',
          classificacao:   d.classificacao  ?? '',
          ocorrencia:      d.ocorrencia     ?? '',
          numerosInspecao: JSON.stringify(Array.isArray(d.numerosInspecao) ? d.numerosInspecao : []),
          origem:          d.origem         ?? '',
        })
        setLoadState('success')
      } catch (err) {
        console.error(err)
        setLoadState('error')
      }
    }
    fetchMedida()
  }, [medidaId, session])

  useEffect(() => {
    if (loadState !== 'success') return
    const current = {
      colaborador:     nomeColabInput,
      matricula:       matColabInput,
      supervisor:      matSupInput,
      nomeSupervisor:  nomeSupInput,
      data:            dataMedida,
      tipo:            tipoCategoria,
      medida:          tipoMedida,
      diasSuspensao,
      gravidade,
      classificacao,
      ocorrencia,
      numerosInspecao: JSON.stringify(inspecoes),
      origem,
    }
    const changed = Object.keys(original).some(k => original[k] !== (current as any)[k])
    if (changed) setHasChanges(true)
  }, [nomeColabInput, matColabInput, matSupInput, nomeSupInput, dataMedida, tipoCategoria, tipoMedida, diasSuspensao, gravidade, classificacao, ocorrencia, inspecoes, origem, original, loadState])

  async function handleSave() {
    if (isSaving || !allValid) return
    setIsSaving(true)

    const fd = new FormData()
    fd.append('colaborador',    nomeColabInput)
    fd.append('matricula',      matColabInput)
    fd.append('supervisor',     matSupInput)
    fd.append('nomeSupervisor', nomeSupInput)
    fd.append('data',           new Date(dataMedida).toISOString())
    fd.append('tipo',           tipoCategoria)
    fd.append('medida',         tipoMedida)
    fd.append('ocorrencia',     ocorrencia)
    fd.append('gravidade',      gravidade)
    fd.append('classificacao',  classificacao)
    fd.append('origem',         origem)
    if (diasSuspensao) fd.append('diasSuspensao', diasSuspensao)
    if (inspecoes.length > 0) fd.append('numerosInspecao', inspecoes.join(','))
    anexos.forEach(a => { if (a.file) fd.append('files', a.file) })

    try {
      await api.patch(`/medidas/${medidaId}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      setAnexos(prev => prev.map(a => ({ ...a, file: undefined, preview: undefined })))
      setHasChanges(false)
      setSuccessModal(true)
    } catch (e: any) {
      const msg = e.response?.data?.message
      alert(Array.isArray(msg) ? msg.join('\n') : (msg || 'Erro ao salvar.'))
    } finally {
      setIsSaving(false)
    }
  }

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

  const tabValid: Record<TabKey, boolean> = {
    identificacao: !!colabSelecionado && !!supSelecionado && !!dataMedida,
    classificacao: !!tipoCategoria && !!tipoMedida && (tipoMedida !== 'SUSPENSÃO' || !!diasSuspensao),
    gravidade:     true,
    ocorrencia:    !!classificacao && classificacaoSelecionada && ocorrencia.trim().length >= 10,
    anexos:        !!origem,
  }

  const tabOrder: TabKey[] = ['identificacao', 'classificacao', 'gravidade', 'ocorrencia', 'anexos']
  const allValid           = tabOrder.every(k => tabValid[k])

  // ── Helpers de estilo ───────────────────────────────────────────────────────
  // Verifica se o item está "confirmado" — chapa e nome batem com o selecionado
  const colabConfirmado = !!colabSelecionado &&
    String(colabSelecionado.chapa) === matColabInput &&
    colabSelecionado.nome === nomeColabInput

  const supConfirmado = !!supSelecionado &&
    String(supSelecionado.chapa) === matSupInput &&
    supSelecionado.nome === nomeSupInput

  const inputCls = (isSelected?: boolean) => cn(
    'w-full bg-[#f8fafc] border rounded-lg h-10 px-3 text-[13.5px] outline-none transition-all',
    isSelected
      ? 'border-emerald-500 bg-emerald-50/30'
      : 'border-[#e3e8ef] focus:border-[#094780] focus:bg-white'
  )

  const inputClsWithError = (isSelected: boolean, hasError: boolean) => cn(
    'w-full bg-[#f8fafc] border rounded-lg h-10 px-3 text-[13.5px] outline-none transition-all',
    isSelected
      ? 'border-emerald-500 bg-emerald-50/30'
      : hasError
        ? 'border-red-400 bg-red-50/40 focus:border-red-500'
        : 'border-[#e3e8ef] focus:border-[#094780] focus:bg-white'
  )

  const secTitle = 'text-[11px] font-bold uppercase tracking-widest text-[#9ca3af] px-6 py-3 bg-[#f8fafc] border-b border-[#e3e8ef]'
  const labelCls = 'text-[13.5px] font-medium text-[#111827]'

  if (loadState === 'loading') return (
    <DashboardLayout title="Editar Medida" navItems={navItems}>
      <div className="flex items-center justify-center h-[60vh] gap-3 text-[#9ca3af]">
        <Loader2 size={20} className="animate-spin" /><span>Carregando dados...</span>
      </div>
    </DashboardLayout>
  )

  return (
    <DashboardLayout title="Editar Medida" navItems={navItems}>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeUp    { from{opacity:0;transform:translateY(6px)}  to{opacity:1;transform:none} }
        @keyframes scaleIn   { from{opacity:0;transform:scale(0.95)}      to{opacity:1;transform:scale(1)} }
        @keyframes slideDown { from{opacity:0;transform:translateY(-4px)} to{opacity:1;transform:none} }
        .fade-up   { animation: fadeUp    0.2s  ease forwards }
        .scale-in  { animation: scaleIn   0.15s ease forwards }
        .slide-down{ animation: slideDown 0.15s ease forwards }
      `}} />

      <div className="w-full flex flex-col bg-[#f4f6f9] min-h-[calc(100vh-60px)]">

        {/* ─── Header ─── */}
        <div className="bg-white border-b border-[#e3e8ef] shadow-sm">
          <div className="px-7 py-3 flex items-center justify-between border-b border-[#f0f2f5]">
            <div className="flex items-center gap-2 text-[13px] text-[#9ca3af]">
              <button onClick={() => router.push('/medida-administrativa/lista')} className="hover:text-[#094780] transition-colors font-medium">
                Medidas
              </button>
              <span className="text-[11px]">›</span>
              <span className="text-[#094780] font-semibold">Editar</span>
            </div>
            <span className="text-[11px] font-mono text-[#9ca3af] bg-[#f4f6f9] border px-2 py-1 rounded-md">
              ID #{medidaId.slice(-6)}
            </span>
          </div>

          {hasChanges && (
            <div className="bg-amber-50 border-b border-amber-200 px-7 py-2 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span className="text-[12px] text-amber-700 font-medium">Alterações não salvas</span>
            </div>
          )}

          <div className="px-7 flex overflow-x-auto">
            {TABS.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={cn(
                  'flex items-center gap-2 px-5 py-4 text-[13.5px] border-b-2 whitespace-nowrap transition-all',
                  tab === t.key
                    ? 'text-[#094780] border-[#094780] font-semibold'
                    : 'text-[#9ca3af] border-transparent hover:text-slate-600'
                )}>
                {t.label}
                {tabValid[t.key] && t.key !== 'gravidade' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ─── Conteúdo das abas ─── */}
        <div className="flex-1 overflow-y-auto pb-28">

          {/* ─── ABA: IDENTIFICAÇÃO ─── */}
          {tab === 'identificacao' && (
            <div className="fade-up mx-4 sm:mx-8 mt-6">
              <div className="bg-white border border-[#e3e8ef] rounded-xl shadow-sm overflow-visible">
                <div className={cn(secTitle, 'rounded-t-xl')}>Identificação</div>

                {/* MATRÍCULAS */}
                <div className="grid grid-cols-[180px_1fr_1fr] gap-x-4 gap-y-1 items-start px-6 py-4 border-b border-[#e3e8ef] overflow-visible">
                  <span className={cn(labelCls, 'mt-2')}>Matrículas *</span>

                  {/* Matrícula colaborador */}
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={matColabInput}
                      placeholder="Mat. Colaborador"
                      className={inputClsWithError(
                        colabConfirmado,
                        touched['matColab'] === true && !colabSelecionado
                      )}
                      onChange={e => {
                        const val = e.target.value.replace(/[^0-9]/g, '')
                        setMatColabInput(val)
                        setColabSelecionado(null)
                        setShowMatriculaDropdown(true)
                        setHasChanges(true)
                      }}
                      onFocus={() => setShowMatriculaDropdown(true)}
                      onBlur={() => {
                        touch('matColab')
                        setTimeout(() => setShowMatriculaDropdown(false), 200)
                      }}
                    />
                    <AbsoluteDropdown open={showMatriculaDropdown && colabsFiltradosMat.length > 0}>
                      {colabsFiltradosMat.map((c, i) => (
                        <div key={i} className="p-3 hover:bg-blue-50 cursor-pointer text-xs border-b last:border-0 transition-colors"
                          onMouseDown={() => selecionarColab(c)}>
                          <p className="font-bold text-slate-700">{c.chapa}</p>
                          <p className="text-slate-400">{c.nome}</p>
                        </div>
                      ))}
                    </AbsoluteDropdown>
                    {touched['matColab'] && !colabSelecionado && matColabInput && (
                      <FieldError message="Selecione um colaborador da lista" />
                    )}
                  </div>

                  {/* Matrícula supervisor */}
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={matSupInput}
                      placeholder="Mat. Supervisor"
                      className={inputClsWithError(
                        supConfirmado,
                        touched['matSup'] === true && !supSelecionado
                      )}
                      onChange={e => {
                        const val = e.target.value.replace(/[^0-9]/g, '')
                        setMatSupInput(val)
                        setSupSelecionado(null)
                        setShowMatSupDropdown(true)
                        setHasChanges(true)
                      }}
                      onFocus={() => setShowMatSupDropdown(true)}
                      onBlur={() => {
                        touch('matSup')
                        setTimeout(() => setShowMatSupDropdown(false), 200)
                      }}
                    />
                    <AbsoluteDropdown open={showMatSupDropdown && supsFiltradosMat.length > 0}>
                      {supsFiltradosMat.map((c, i) => (
                        <div key={i} className="p-3 hover:bg-blue-50 cursor-pointer text-xs border-b last:border-0 transition-colors"
                          onMouseDown={() => selecionarSupervisor(c)}>
                          <p className="font-bold text-slate-700">{c.chapa}</p>
                          <p className="text-slate-400">{c.nome}</p>
                        </div>
                      ))}
                    </AbsoluteDropdown>
                    {touched['matSup'] && !supSelecionado && matSupInput && (
                      <FieldError message="Selecione um supervisor da lista" />
                    )}
                  </div>
                </div>

                {/* NOMES */}
                <div className="grid grid-cols-[180px_1fr_1fr] gap-x-4 gap-y-1 items-start px-6 py-4 border-b border-[#e3e8ef] overflow-visible">
                  <span className={cn(labelCls, 'mt-2')}>Nomes *</span>

                  {/* Nome colaborador */}
                  <div className="relative">
                    <input
                      type="text"
                      value={nomeColabInput}
                      placeholder="Pesquisar nome..."
                      className={inputClsWithError(
                        colabConfirmado,
                        touched['nomeColab'] === true && !colabSelecionado
                      )}
                      onChange={e => {
                        const val = e.target.value.replace(/[0-9]/g, '')
                        setNomeColabInput(val)
                        setColabSelecionado(null)
                        setShowColabDropdown(true)
                        setHasChanges(true)
                      }}
                      onFocus={() => setShowColabDropdown(true)}
                      onBlur={() => {
                        touch('nomeColab')
                        setTimeout(() => setShowColabDropdown(false), 200)
                      }}
                    />
                    <AbsoluteDropdown open={showColabDropdown && colabsFiltradosNome.length > 0}>
                      {colabsFiltradosNome.map((c, i) => (
                        <div key={i} className="p-3 hover:bg-blue-50 cursor-pointer text-xs border-b last:border-0 transition-colors"
                          onMouseDown={() => selecionarColab(c)}>
                          <p className="font-bold text-slate-700">{c.nome}</p>
                          <p className="text-slate-400">Chapa: {c.chapa}</p>
                        </div>
                      ))}
                    </AbsoluteDropdown>
                    {touched['nomeColab'] && !colabSelecionado && nomeColabInput && (
                      <FieldError message="Selecione um colaborador da lista" />
                    )}
                  </div>

                  {/* Nome supervisor */}
                  <div className="relative">
                    <input
                      type="text"
                      value={nomeSupInput}
                      placeholder="Nome do supervisor"
                      className={inputClsWithError(
                        supConfirmado,
                        touched['nomeSup'] === true && !supSelecionado
                      )}
                      onChange={e => {
                        const val = e.target.value.replace(/[0-9]/g, '')
                        setNomeSupInput(val)
                        setSupSelecionado(null)
                        setShowSupDropdown(true)
                        setHasChanges(true)
                      }}
                      onFocus={() => setShowSupDropdown(true)}
                      onBlur={() => {
                        touch('nomeSup')
                        setTimeout(() => setShowSupDropdown(false), 200)
                      }}
                    />
                    <AbsoluteDropdown open={showSupDropdown && supsFiltradosNome.length > 0}>
                      {supsFiltradosNome.map((c, i) => (
                        <div key={i} className="p-3 hover:bg-blue-50 cursor-pointer text-xs border-b last:border-0 transition-colors"
                          onMouseDown={() => selecionarSupervisor(c)}>
                          <p className="font-bold text-slate-700">{c.nome}</p>
                          <p className="text-slate-400">Chapa: {c.chapa}</p>
                        </div>
                      ))}
                    </AbsoluteDropdown>
                    {touched['nomeSup'] && !supSelecionado && nomeSupInput && (
                      <FieldError message="Selecione um supervisor da lista" />
                    )}
                  </div>
                </div>

                {/* DATA */}
                <div className="grid grid-cols-[180px_auto] gap-4 items-center px-6 py-4">
                  <span className={labelCls}>Data *</span>
                  <input
                    type="date"
                    value={dataMedida}
                    onChange={e => { setDataMedida(e.target.value); setHasChanges(true) }}
                    className={cn(inputCls(), 'w-[200px]')}
                  />
                </div>
              </div>

              {(!colabSelecionado || !supSelecionado) && (
                <p className="mt-3 text-[11px] text-amber-600 font-medium flex items-center gap-1.5">
                  <AlertCircle size={14} /> Selecione os funcionários nas listas de pesquisa para continuar.
                </p>
              )}
            </div>
          )}

          {/* ─── ABA: CLASSIFICAÇÃO ─── */}
          {tab === 'classificacao' && (
            <div className="fade-up mx-4 sm:mx-8 mt-6">
              <div className="bg-white border border-[#e3e8ef] rounded-xl overflow-hidden shadow-sm">
                <div className={secTitle}>Categoria e Tipo</div>
                <div className="p-6 flex gap-3">
                  {(['SEGURANÇA', 'ADMINISTRATIVA'] as const).map(cat => (
                    <button key={cat} onClick={() => { setTipoCategoria(cat); setHasChanges(true) }}
                      className={cn('flex-1 py-3 rounded-xl border-2 font-bold text-xs transition-all',
                        tipoCategoria === cat ? 'bg-[#094780] border-[#094780] text-white shadow-sm' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200')}>
                      {cat}
                    </button>
                  ))}
                </div>
                <div className="p-6 pt-0 space-y-2">
                  {(['ADVERTÊNCIA VERBAL', 'ADVERTÊNCIA ESCRITA', 'SUSPENSÃO', 'CONVERSA PEDAGÓGICA', 'TREINAMENTO'] as const).map(m => (
                    <div key={m} onClick={() => { setTipoMedida(m); setHasChanges(true) }}
                      className={cn('p-4 rounded-xl border cursor-pointer flex justify-between items-center transition-all',
                        tipoMedida === m ? 'border-[#094780] bg-blue-50/50 shadow-sm' : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50/50')}>
                      <span className="text-sm font-semibold text-slate-700">{m}</span>
                      {tipoMedida === m && <CheckCircle size={18} className="text-[#094780]" />}
                    </div>
                  ))}
                </div>
                {tipoMedida === 'SUSPENSÃO' && (
                  <div className="p-6 border-t bg-slate-50/30 flex items-center gap-4">
                    <span className="text-xs font-bold text-slate-500 uppercase">Dias *</span>
                    <input type="number" value={diasSuspensao}
                      onChange={e => { setDiasSuspensao(e.target.value); setHasChanges(true) }}
                      className={cn(inputCls(), 'max-w-[120px]')} />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ─── ABA: GRAVIDADE ─── */}
          {tab === 'gravidade' && (
            <div className="fade-up mx-4 sm:mx-8 mt-6">
              <div className="bg-white border border-[#e3e8ef] rounded-xl overflow-hidden shadow-sm">
                <div className={secTitle}>
                  Nível de Gravidade <span className="ml-2 text-[10px] font-normal normal-case text-slate-400">(opcional)</span>
                </div>
                <div className="p-4 space-y-2">
                  {Object.entries(GRAVIDADE_CFG).map(([g, cfg]) => (
                    <div key={g}
                      onClick={() => { setGravidade(gravidade === g ? '' : (g as Gravidade)); setHasChanges(true) }}
                      className={cn('p-4 rounded-xl border-2 cursor-pointer flex items-center gap-4 transition-all group',
                        gravidade === g ? 'shadow-sm' : 'border-transparent bg-slate-50/60 hover:bg-slate-100/60')}
                      style={gravidade === g ? { borderColor: cfg.border, backgroundColor: cfg.bg } : {}}>
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ background: cfg.color }} />
                      <div className="flex-1">
                        <p className="text-sm font-bold text-slate-700">{g}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">{cfg.label}</p>
                      </div>
                      {gravidade === g && <CheckCircle size={18} style={{ color: cfg.color }} />}
                    </div>
                  ))}
                </div>
                {gravidade && (
                  <div className="px-6 pb-4">
                    <button onClick={() => { setGravidade(''); setHasChanges(true) }}
                      className="text-[11px] text-slate-400 hover:text-slate-600 transition-colors underline underline-offset-2">
                      Limpar seleção
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ─── ABA: OCORRÊNCIA ─── */}
          {tab === 'ocorrencia' && (
            <div className="fade-up mx-4 sm:mx-8 mt-6">
              <div className="bg-white border border-[#e3e8ef] rounded-xl shadow-sm overflow-visible">
                <div className={cn(secTitle, 'rounded-t-xl')}>Detalhes da Ocorrência</div>
                <div className="p-6 space-y-6 overflow-visible">

                  <div>
                    <label className="text-[12px] font-bold text-slate-500 uppercase mb-1.5 block">Desvio *</label>
                    <div className="relative">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                      <input
                        type="text"
                        className={cn(
                          'w-full bg-[#f8fafc] border rounded-lg h-11 pl-10 pr-10 text-[13.5px] outline-none transition-all',
                          classificacaoSelecionada
                            ? 'border-emerald-500 bg-emerald-50/30'
                            : touched['classificacao'] && !classificacaoSelecionada
                              ? 'border-red-400 bg-red-50/40 focus:border-red-500'
                              : 'border-[#e3e8ef] focus:border-[#094780] focus:bg-white'
                        )}
                        placeholder="Busque e selecione um motivo..."
                        value={searchQuery}
                        onChange={e => {
                          setSearchQuery(e.target.value)
                          setClassificacaoSelecionada(false)
                          setClassificacao('')
                          setShowClassifDropdown(true)
                          setHasChanges(true)
                        }}
                        onFocus={() => setShowClassifDropdown(true)}
                        onBlur={() => {
                          touch('classificacao')
                          setTimeout(() => {
                            setShowClassifDropdown(false)
                            if (!classificacaoSelecionada) { setSearchQuery(''); setClassificacao('') }
                          }, 200)
                        }}
                      />
                      {classificacaoSelecionada && (
                        <CheckCircle size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-500 pointer-events-none" />
                      )}
                      {touched['classificacao'] && !classificacaoSelecionada && searchQuery && (
                        <AlertCircle size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-red-400 pointer-events-none" />
                      )}
                      <AbsoluteDropdown open={showClassifDropdown}>
                        {filteredClassificacoes.length > 0
                          ? filteredClassificacoes.map((item, i) => (
                              <button key={i} type="button"
                                onMouseDown={() => {
                                  setClassificacao(item)
                                  setSearchQuery(item)
                                  setClassificacaoSelecionada(true)
                                  setShowClassifDropdown(false)
                                  setHasChanges(true)
                                }}
                                className={cn('w-full text-left px-4 py-3 text-[12.5px] border-b border-slate-50 last:border-0 transition-colors',
                                  classificacao === item ? 'bg-blue-50 text-[#094780] font-semibold' : 'text-slate-600 hover:bg-slate-50')}>
                                {item}
                              </button>
                            ))
                          : <div className="p-6 text-center text-slate-400 text-xs">Nenhum resultado</div>
                        }
                      </AbsoluteDropdown>
                    </div>
                    {touched['classificacao'] && !classificacaoSelecionada && (
                      <FieldError message="Selecione uma classificação da lista" />
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[12px] font-bold text-slate-500 uppercase block">
                      Descrição * <span className="font-normal normal-case text-slate-400">(mín. 10 caracteres)</span>
                    </label>
                    <textarea
                      value={ocorrencia}
                      onChange={e => { setOcorrencia(e.target.value); setHasChanges(true) }}
                      rows={6}
                      className={cn('w-full bg-[#f8fafc] border rounded-lg px-3 py-3 text-[13.5px] outline-none transition-all resize-none',
                        ocorrencia.length > 0 && ocorrencia.trim().length < 10
                          ? 'border-red-300 focus:border-red-400'
                          : 'border-[#e3e8ef] focus:border-[#094780] focus:bg-white')}
                      placeholder="Detalhes..."
                    />
                    <div className="flex items-center justify-between">
                      {ocorrencia.length > 0 && ocorrencia.trim().length < 10 && (
                        <FieldError message={`Faltam ${10 - ocorrencia.trim().length} caracteres`} />
                      )}
                      <span className={cn('text-[11px] ml-auto', ocorrencia.trim().length >= 10 ? 'text-emerald-500' : 'text-slate-400')}>
                        {ocorrencia.length} caracteres
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── ABA: ANEXOS ─── */}
          {tab === 'anexos' && (
            <div className="fade-up mx-4 sm:mx-8 mt-6 space-y-4">

              <div className="bg-white border border-[#e3e8ef] rounded-xl overflow-hidden shadow-sm">
                <div className={secTitle}>Anexos</div>
                <div className="p-6 border-b border-[#e3e8ef]">
                  <div
                    className={cn('border-2 border-dashed rounded-2xl transition-all cursor-pointer',
                      isDragging ? 'border-[#094780] bg-blue-50' : 'border-slate-200 bg-slate-50/50 hover:border-[#094780] hover:bg-blue-50/20')}
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={e => { e.preventDefault(); setIsDragging(false); handleFilesAdd(e.dataTransfer.files) }}>
                    <div className="flex flex-col items-center justify-center py-10 px-6 text-center select-none">
                      <div className={cn('w-14 h-14 rounded-2xl flex items-center justify-center mb-4 border transition-all',
                        isDragging ? 'bg-blue-100 border-blue-300 text-[#094780]' : 'bg-white border-slate-200 text-slate-400')}>
                        <Upload size={24} />
                      </div>
                      <p className="text-sm font-semibold text-slate-600 mb-1">Clique ou <span className="text-[#094780]">arraste arquivos</span></p>
                      <p className="text-[11px] text-slate-400">Imagens e PDFs aceitos</p>
                    </div>
                  </div>
                  <input ref={fileInputRef} type="file" multiple accept="image/*,application/pdf" className="hidden"
                    onChange={e => handleFilesAdd(e.target.files)} />
                </div>

                {anexos.length > 0 && (
                  <div className="px-6 py-4 space-y-2">
                    {anexos.map(a => (
                      <div key={a.id} className="scale-in flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl group hover:border-slate-200 transition-all">
                        <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden">
                          {(a.url || a.preview) && a.tipo.startsWith('image/') ? (
                            <img src={a.preview || `${process.env.NEXT_PUBLIC_API_URL}/medidas/anexo/${a.id}`}
                              className="w-full h-full object-cover" alt={a.nome} />
                          ) : renderIcon(a.tipo)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-semibold text-slate-700 truncate">{a.nome}</p>
                          {a.url && <p className="text-[10px] text-[#094780] font-bold uppercase tracking-tight">Salvo no servidor</p>}
                        </div>
                        <div className="flex items-center gap-2">
                          {a.url && (
                            <a href={`${process.env.NEXT_PUBLIC_API_URL}/medidas/anexo/${a.id}`}
                              target="_blank" rel="noopener noreferrer"
                              className="p-2 text-slate-400 hover:text-[#094780] transition-colors">
                              <Upload size={14} className="rotate-180" />
                            </a>
                          )}
                          <button onClick={() => removerAnexo(a.id)} className="p-2 text-slate-400 hover:text-red-400 transition-colors">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-white border border-[#e3e8ef] rounded-xl overflow-hidden shadow-sm">
                <div className={secTitle}>Origem *</div>
                <div className="px-6 py-5">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {ORIGENS.map(op => (
                      <button key={op} type="button"
                        onClick={() => { setOrigem(origem === op ? '' : op); setHasChanges(true) }}
                        className={cn('py-3 px-4 rounded-xl border-2 font-bold text-xs transition-all text-left relative',
                          origem === op ? 'bg-[#094780] border-[#094780] text-white shadow-sm' : 'bg-white border-slate-100 text-slate-500 hover:border-[#094780]/30 hover:bg-blue-50/30')}>
                        {op}
                        {origem === op && <CheckCircle size={13} className="absolute top-2 right-2 text-white/80" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-white border border-[#e3e8ef] rounded-xl overflow-hidden shadow-sm">
                <div className={secTitle}>Vínculo Externo</div>
                <div className="px-6 py-5 space-y-4">
                  <div>
                    <p className={labelCls}>Inspeções CLICK vinculadas</p>
                    <p className="text-[11px] text-slate-400 mt-0.5 mb-4">
                      Adicione ou remova inspeções vinculadas a esta medida
                    </p>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Hash size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <input
                          type="text"
                          value={novaInspecao}
                          onChange={e => setNovaInspecao(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), adicionarInspecao())}
                          placeholder="Ex: 2024-00123"
                          className={cn(inputCls(), 'pl-8')}
                        />
                      </div>
                      <button type="button" onClick={adicionarInspecao}
                        disabled={!novaInspecao.trim() || inspecoes.includes(novaInspecao.trim())}
                        className={cn('px-4 py-2 rounded-lg text-xs font-bold transition-all border shrink-0',
                          novaInspecao.trim() && !inspecoes.includes(novaInspecao.trim())
                            ? 'bg-[#094780] text-white border-[#094780] hover:bg-[#0a5494]'
                            : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed')}>
                        + Adicionar
                      </button>
                    </div>

                    {inspecoes.length > 0 ? (
                      <div className="mt-3 space-y-1.5">
                        {inspecoes.map((insp, idx) => (
                          <div key={idx} className="scale-in flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                            <Link2 size={13} className="text-[#094780] shrink-0" />
                            <span className="text-[12px] font-bold text-[#094780] flex-1">CLICK #{insp}</span>
                            <button type="button" onClick={() => removerInspecao(idx)}
                              className="text-slate-300 hover:text-red-400 transition-colors">
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-3 text-[11px] text-slate-400 italic">Nenhuma inspeção vinculada</p>
                    )}
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>

        {/* ─── BARRA INFERIOR ─── */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#e3e8ef] px-7 py-4 flex items-center justify-between z-50">
          <button onClick={() => setDeleteModal(true)}
            className="flex items-center gap-2 text-red-500 font-bold text-sm hover:text-red-600 transition-colors">
            <Trash2 size={16} /> Excluir
          </button>
          <div className="flex gap-3">
            <button onClick={() => router.back()}
              className="px-4 py-2 border border-[#e3e8ef] rounded-lg text-sm font-bold hover:bg-slate-50 transition-all">
              Cancelar
            </button>
            <button
              disabled={!hasChanges || !allValid || isSaving}
              onClick={handleSave}
              className={cn('px-6 py-2 rounded-lg text-white font-bold text-sm transition-all',
                hasChanges && allValid ? 'bg-[#094780] shadow-lg shadow-blue-900/20 hover:bg-[#0a5494]' : 'bg-gray-200 cursor-not-allowed')}>
              {isSaving ? <Loader2 className="animate-spin" size={16} /> : 'Salvar Alterações'}
            </button>
          </div>
        </div>

        {/* ─── MODAL DE SUCESSO ─── */}
        {successModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-6">
            <div className="bg-white p-10 rounded-[40px] text-center shadow-2xl max-w-sm">
              <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle size={48} className="text-emerald-500" />
              </div>
              <h3 className="font-bold text-xl mb-2">Atualizado!</h3>
              <p className="text-slate-500 text-sm mb-8">As alterações foram salvas.</p>
              <button onClick={() => router.push('/medida-administrativa/lista')}
                className="w-full py-4 bg-[#094780] text-white rounded-2xl font-bold hover:bg-[#0a5494] transition-colors">
                Voltar
              </button>
            </div>
          </div>
        )}

        {/* ─── MODAL DE EXCLUSÃO ─── */}
        {deleteModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-6">
            <div className="bg-white p-8 rounded-3xl text-center max-w-xs shadow-2xl">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={32} className="text-red-500" />
              </div>
              <h3 className="font-bold text-lg">Excluir Medida?</h3>
              <p className="text-slate-500 text-sm mb-6">Esta ação não pode ser desfeita.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteModal(false)}
                  className="flex-1 py-2 border rounded-xl font-bold">Não</button>
                <button onClick={handleDelete} disabled={isDeleting}
                  className="flex-1 py-2 bg-red-500 text-white rounded-xl font-bold flex items-center justify-center gap-2">
                  {isDeleting ? <Loader2 size={14} className="animate-spin" /> : 'Sim, excluir'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}