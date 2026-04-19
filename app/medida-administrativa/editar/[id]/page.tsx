'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useParams, useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import {
  User, Tag, AlertTriangle, FileText,
  Paperclip, Link2, CheckCircle, Loader2,
  Trash2, Search, X, ChevronDown,
  Upload, File, FileImage, LayoutDashboard, PlusCircle, List, Users
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Tipos e Configurações ──────────────────────────────────────────────────
type TipoCategoria = 'SEGURANÇA' | 'ADMINISTRATIVA' | ''
type TipoMedida =
  | 'ADVERTÊNCIA VERBAL' | 'ADVERTÊNCIA ESCRITA' | 'SUSPENSÃO'
  | 'CONVERSA PEDAGÓGICA' | 'TREINAMENTO' | ''
type Gravidade = 'LEVE' | 'MÉDIA' | 'GRAVE' | 'GRAVÍSSIMA' | ''

type LoadState = 'loading' | 'success' | 'error'

type Anexo = { id: string; file: File; preview?: string }

// ─── Menu Lateral (Sidebar) ──────────────────────────────────────────────────
const navItems = [
  { section: 'Medida Administrativa' },
  { label: 'Dashboard', href: '/medida-administrativa', icon: LayoutDashboard },
  { section: 'Operações' },
  { label: 'Nova Medida', href: '/medida-administrativa/nova', icon: PlusCircle },
  { label: 'Histórico', href: '/medida-administrativa/lista', icon: List }
]

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
  const fileInputRef = useRef<HTMLInputElement>(null)

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
  const [matriculaSup, setMatriculaSup] = useState('')
  const [nomeSupervisor, setNomeSupervisor] = useState('')
  const [dataMedida, setDataMedida] = useState('')
  const [tipoCategoria, setTipoCategoria] = useState<TipoCategoria>('')
  const [tipoMedida, setTipoMedida] = useState<TipoMedida>('')
  const [diasSuspensao, setDiasSuspensao] = useState('')
  const [gravidade, setGravidade] = useState<Gravidade>('')
  const [classificacao, setClassificacao] = useState('')
  const [ocorrencia, setOcorrencia] = useState('')
  const [relacionarClick, setRelacionarClick] = useState(false)
  const [numeroInspecao, setNumeroInspecao] = useState('')

  // ── Estados Autocomplete ──
  const [colaboradoresRepo, setColaboradoresRepo] = useState<any[]>([])
  const [showColabDropdown, setShowColabDropdown] = useState(false)
  const [showMatriculaDropdown, setShowMatriculaDropdown] = useState(false)

  // Estados Anexos
  const [anexos, setAnexos] = useState<Anexo[]>([])
  const [isDragging, setIsDragging] = useState(false)

  // Pesquisa Classificação
  const [searchQuery, setSearchQuery] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)

  // ─── BUSCA COLABORADORES ───
  useEffect(() => {
    const fetchColabs = async () => {
      const token = (session as any)?.access_token || (session as any)?.accessToken
      if (!token) return
      try {
        const res = await fetch('http://localhost:3001/taxa-contato/recentes', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (res.ok) {
          const data = await res.json()
          setColaboradoresRepo(data)
        }
      } catch (e) { console.error("Erro fetch colabs", e) }
    }
    fetchColabs()
  }, [session])

  const colabsFiltrados = useMemo(() => {
    const termoBusca = String(nomeColab || '').toLowerCase()
    if (termoBusca.length < 2) return []
    return colaboradoresRepo.filter(c =>
      String(c.NOME || '').toLowerCase().includes(termoBusca)
    ).slice(0, 8)
  }, [nomeColab, colaboradoresRepo])

  const chapasFiltradas = useMemo(() => {
    const termoBusca = String(matriculaColab || '').toLowerCase()
    if (termoBusca.length < 1) return []
    return colaboradoresRepo.filter(c =>
      String(c.CHAPA || '').toLowerCase().includes(termoBusca)
    ).slice(0, 8)
  }, [matriculaColab, colaboradoresRepo])

  const selecionarColab = (item: any) => {
    setNomeColab(String(item.NOME || ''))
    setMatriculaColab(String(item.CHAPA || ''))
    setNomeSupervisor(String(item.SUPERVISOR || ''))
    setShowColabDropdown(false)
    setShowMatriculaDropdown(false)
  }

  // ─── FUNÇÕES ANEXOS ───
  function handleFilesAdd(files: FileList | null) {
    if (!files) return
    const novos = Array.from(files).map(file => {
      const id = Math.random().toString(36).slice(2)
      const preview = file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
      return { id, file, preview }
    })
    setAnexos(prev => [...prev, ...novos])
  }

  function removerAnexo(id: string) {
    setAnexos(prev => {
      const item = prev.find(a => a.id === id)
      if (item?.preview) URL.revokeObjectURL(item.preview)
      return prev.filter(a => a.id !== id)
    })
  }

  function formatBytes(bytes: number) {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  function getFileIcon(file: File) {
    if (file.type.startsWith('image/')) return <FileImage size={20} className="text-blue-400" />
    if (file.type === 'application/pdf') return <FileText size={20} className="text-red-400" />
    return <File size={20} className="text-slate-400" />
  }

  useEffect(() => {
    return () => anexos.forEach(a => a.preview && URL.revokeObjectURL(a.preview))
  }, [])

  const filteredClassificacoes = useMemo(() => {
    if (!searchQuery) return CLASSIFICACOES_DATA
    return CLASSIFICACOES_DATA.filter(item =>
      item.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [searchQuery])

  // ─── CARREGAR DADOS DA MEDIDA ───
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
        setNomeSupervisor(data.nomeSupervisor ?? '')
        setDataMedida(data.data ? data.data.slice(0, 10) : '')
        setTipoCategoria((data.tipo as TipoCategoria) ?? '')
        setTipoMedida((data.medida as TipoMedida) ?? '')
        setDiasSuspensao(data.diasSuspensao ? String(data.diasSuspensao) : '')
        setGravidade((data.gravidade as Gravidade) ?? '')
        setClassificacao(data.classificacao ?? '')
        setSearchQuery(data.classificacao ?? '')
        setOcorrencia(data.ocorrencia ?? '')
        setNumeroInspecao(data.numeroInspecao ?? '')
        setRelacionarClick(!!data.numeroInspecao)

        setOriginal({
          colaborador: data.colaborador ?? '',
          matricula: data.matricula ?? '',
          supervisor: data.supervisor ?? '',
          nomeSupervisor: data.nomeSupervisor ?? '',
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
      } catch {
        setLoadState('error')
      }
    }
    fetchMedida()
  }, [medidaId, session])

  // ─── DETECTAR ALTERAÇÕES ───
  useEffect(() => {
    if (loadState !== 'success') return
    const current = {
      colaborador: nomeColab,
      matricula: matriculaColab,
      supervisor: matriculaSup,
      nomeSupervisor: nomeSupervisor,
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
  }, [
    nomeColab, matriculaColab, matriculaSup, nomeSupervisor, dataMedida,
    tipoCategoria, tipoMedida, diasSuspensao, gravidade, classificacao,
    ocorrencia, numeroInspecao, relacionarClick, original, loadState,
  ])

  // ─── SALVAR ───
  async function handleSave() {
    if (isSaving || !allValid) return
    const token = (session as any)?.access_token || (session as any)?.accessToken
    if (!token) return

    setIsSaving(true)
    const payload = {
      colaborador: nomeColab,
      matricula: matriculaColab,
      supervisor: matriculaSup,
      nomeSupervisor,
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

      anexos.forEach(a => a.preview && URL.revokeObjectURL(a.preview))
      setAnexos([])

      setOriginal({
        ...payload,
        data: dataMedida,
        diasSuspensao: String(diasSuspensao || ''),
        numeroInspecao: payload.numeroInspecao || '',
      })
      setHasChanges(false)
      setSuccessModal(true)
    } catch (error: any) {
      alert(error.message)
    } finally {
      setIsSaving(false)
    }
  }

  // ─── DELETAR ───
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

  const tabValid: Record<TabKey, boolean> = {
    identificacao: !!nomeColab && !!matriculaColab && !!nomeSupervisor && !!dataMedida,
    classificacao: !!tipoCategoria && !!tipoMedida && (tipoMedida !== 'SUSPENSÃO' || !!diasSuspensao),
    gravidade: !!gravidade,
    ocorrencia: !!classificacao && ocorrencia.trim().length >= 10,
    anexos: !relacionarClick || !!numeroInspecao.trim(),
  }

  const tabOrder: TabKey[] = ['identificacao', 'classificacao', 'gravidade', 'ocorrencia', 'anexos']
  const allValid = tabOrder.every(k => tabValid[k])

  // Styles
  const inputCls = cn('w-full bg-[#f8fafc] border border-[#e3e8ef] rounded-lg h-10 px-3 text-[13.5px] outline-none focus:border-[#094780] transition-all')
  const formRowCls = cn('grid gap-4 items-start px-6 py-4 border-b border-[#e3e8ef] last:border-b-0')
  const labelCls = 'text-[13.5px] font-medium text-[#111827] mt-2'
  const sectionTitleCls = 'text-[11px] font-bold uppercase tracking-widest text-[#9ca3af] px-6 py-3 bg-[#f8fafc] border-b border-[#e3e8ef]'

  if (loadState === 'loading') return (
    <DashboardLayout title="Editar Medida" navItems={navItems}>
      <div className="flex items-center justify-center h-[60vh] gap-3 text-[#9ca3af]">
        <Loader2 size={20} className="animate-spin" />
        <span>Carregando dados...</span>
      </div>
    </DashboardLayout>
  )

  return (
    <DashboardLayout title="Editar Medida" navItems={navItems}>
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes fadeUp { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
        .fade-up { animation: fadeUp 0.2s ease forwards; }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .scale-in { animation: scaleIn 0.15s ease forwards; }
      `}}
      />

      <div className="relative w-full flex flex-col bg-[#f4f6f9] min-h-[calc(100vh-60px)]">

        {/* ── BREADCRUMB ── */}
        <div className="bg-white border-b border-[#e3e8ef] px-7 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[13px] text-[#9ca3af]">
            <button onClick={() => router.push('/medida-administrativa/lista')}>Medidas</button>
            <span>›</span>
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

        {/* ── TABS ── */}
        <div className="bg-white border-b border-[#e3e8ef] px-7 flex overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                'px-5 py-4 text-[13px] border-b-2 transition-all -mb-px whitespace-nowrap',
                tab === t.key
                  ? 'text-[#094780] border-[#094780] font-bold'
                  : 'text-[#9ca3af] border-transparent'
              )}
            >
              {t.label}
              {tabValid[t.key] && (
                <span className="ml-2 w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
              )}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-4 sm:px-8 pt-6 pb-28">

          {/* ── IDENTIFICAÇÃO ── */}
          {tab === 'identificacao' && (
            <div className="fade-up bg-white border border-[#e3e8ef] rounded-xl shadow-sm">
              <div className={sectionTitleCls + ' rounded-t-xl'}>Identificação</div>

              <div className={cn(formRowCls, 'grid-cols-1 sm:grid-cols-[200px_1fr_1fr]')}>
                <span className={labelCls}>Nomes *</span>
                <div className="relative">
                  <input
                    type="text"
                    value={nomeColab}
                    onFocus={() => setShowColabDropdown(true)}
                    onBlur={() => setTimeout(() => setShowColabDropdown(false), 200)}
                    onChange={e => {
                      setNomeColab(e.target.value)
                      setShowColabDropdown(true)
                    }}
                    className={inputCls}
                    placeholder="Pesquisar nome..."
                  />
                  {showColabDropdown && colabsFiltrados.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-60 overflow-auto">
                      {colabsFiltrados.map((c, i) => (
                        <div
                          key={i}
                          className="p-3 hover:bg-blue-50 cursor-pointer text-xs border-b last:border-0"
                          onMouseDown={() => selecionarColab(c)}
                        >
                          <p className="font-bold text-slate-700">{c.NOME}</p>
                          <p className="text-slate-400">Chapa: {c.CHAPA} | Supervisor: {c.SUPERVISOR}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <input
                  type="text"
                  value={nomeSupervisor}
                  onChange={e => setNomeSupervisor(e.target.value)}
                  className={cn(inputCls, 'bg-slate-50/50')}
                  placeholder="Nome do supervisor"
                />
              </div>

              <div className={cn(formRowCls, 'grid-cols-1 sm:grid-cols-[200px_1fr_1fr]')}>
                <span className={labelCls}>Matrículas *</span>
                <div className="relative">
                  <input
                    type="text"
                    value={matriculaColab}
                    onFocus={() => setShowMatriculaDropdown(true)}
                    onBlur={() => setTimeout(() => setShowMatriculaDropdown(false), 200)}
                    onChange={e => {
                      setMatriculaColab(e.target.value)
                      setShowMatriculaDropdown(true)
                    }}
                    className={inputCls}
                    placeholder="Mat. Colaborador (Chapa)"
                  />
                  {showMatriculaDropdown && chapasFiltradas.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-60 overflow-auto">
                      {chapasFiltradas.map((c, i) => (
                        <div
                          key={i}
                          className="p-3 hover:bg-blue-50 cursor-pointer text-xs border-b last:border-0"
                          onMouseDown={() => selecionarColab(c)}
                        >
                          <p className="font-bold text-slate-700">{c.CHAPA}</p>
                          <p className="text-slate-400">{c.NOME}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <input
                  type="text"
                  value={matriculaSup}
                  onChange={e => setMatriculaSup(e.target.value)}
                  className={inputCls}
                  placeholder="Mat. Supervisor"
                />
              </div>

              <div className={cn(formRowCls, 'grid-cols-1 sm:grid-cols-[200px_1fr]')}>
                <span className={labelCls}>Data *</span>
                <input
                  type="date"
                  value={dataMedida}
                  onChange={e => setDataMedida(e.target.value)}
                  className={cn(inputCls, 'max-w-[200px]')}
                />
              </div>
            </div>
          )}

          {/* ── CLASSIFICAÇÃO ── */}
          {tab === 'classificacao' && (
            <div className="fade-up bg-white border border-[#e3e8ef] rounded-xl overflow-hidden shadow-sm">
              <div className={sectionTitleCls}>Categoria e Tipo</div>
              <div className={cn(formRowCls, 'grid-cols-1 sm:grid-cols-[200px_1fr]')}>
                <span className={labelCls}>Categoria *</span>
                <div className="flex gap-2">
                  {['SEGURANÇA', 'ADMINISTRATIVA'].map(opt => (
                    <button
                      key={opt}
                      onClick={() => setTipoCategoria(opt as any)}
                      className={cn(
                        'px-4 py-2 rounded-lg border text-xs font-bold transition-all',
                        tipoCategoria === opt
                          ? 'bg-[#094780] text-white border-[#094780]'
                          : 'bg-white border-slate-200 text-slate-500'
                      )}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
              <div className="p-6 space-y-2">
                {['ADVERTÊNCIA VERBAL', 'ADVERTÊNCIA ESCRITA', 'SUSPENSÃO', 'CONVERSA PEDAGÓGICA', 'TREINAMENTO'].map(opt => (
                  <div
                    key={opt}
                    onClick={() => setTipoMedida(opt as any)}
                    className={cn(
                      'p-4 rounded-xl border cursor-pointer flex justify-between items-center transition-all',
                      tipoMedida === opt
                        ? 'border-[#094780] bg-blue-50/50'
                        : 'border-slate-100 hover:border-slate-200'
                    )}
                  >
                    <span className="text-sm font-semibold text-slate-700">{opt}</span>
                    {tipoMedida === opt && <CheckCircle size={18} className="text-[#094780]" />}
                  </div>
                ))}
              </div>
              {tipoMedida === 'SUSPENSÃO' && (
                <div className={cn(formRowCls, 'grid-cols-1 sm:grid-cols-[200px_1fr]', 'bg-slate-50/30')}>
                  <span className={labelCls}>Dias de Suspensão *</span>
                  <input
                    type="number"
                    value={diasSuspensao}
                    onChange={e => setDiasSuspensao(e.target.value)}
                    className={cn(inputCls, 'max-w-[150px]')}
                  />
                </div>
              )}
            </div>
          )}

          {/* ── GRAVIDADE ── */}
          {tab === 'gravidade' && (
            <div className="fade-up bg-white border border-[#e3e8ef] rounded-xl overflow-hidden shadow-sm">
              <div className={sectionTitleCls}>Gravidade</div>
              <div className="p-6 space-y-3">
                {Object.keys(GRAVIDADE_CFG).map(key => (
                  <div
                    key={key}
                    onClick={() => setGravidade(key as any)}
                    className={cn(
                      'p-5 rounded-2xl border-2 cursor-pointer flex items-center gap-4 transition-all',
                      gravidade === key
                        ? 'border-[#094780] bg-blue-50/30'
                        : 'border-slate-50 hover:border-slate-100'
                    )}
                  >
                    <div className="w-3 h-3 rounded-full" style={{ background: GRAVIDADE_CFG[key].color }} />
                    <span className="text-sm font-bold text-slate-700">{key}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── OCORRÊNCIA ── */}
          {tab === 'ocorrencia' && (
            <div className="fade-up bg-white p-8 rounded-3xl border border-[#eef1f6] shadow-sm space-y-6">
              <div className="relative">
                <label className="text-[12px] font-bold text-slate-500 uppercase mb-1.5 block">
                  Pesquisar Classificação *
                </label>
                <div className="relative group">
                  <Search
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#094780]"
                    size={18}
                  />
                  <input
                    type="text"
                    className={cn(inputCls, 'pl-12 h-11')}
                    placeholder="Pesquise o motivo..."
                    value={searchQuery}
                    onFocus={() => setShowDropdown(true)}
                    onChange={e => {
                      const val = e.target.value
                      setSearchQuery(val)
                      if (val === '') setClassificacao('')
                      setShowDropdown(true)
                    }}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => { setSearchQuery(''); setClassificacao('') }}
                      className="absolute right-10 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500"
                    >
                      <X size={14} />
                    </button>
                  )}
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                </div>
                {showDropdown && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setShowDropdown(false)} />
                    <div className="absolute left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl z-40 max-h-72 overflow-y-auto p-2">
                      {filteredClassificacoes.length > 0
                        ? filteredClassificacoes.map((item, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => { setClassificacao(item); setSearchQuery(item); setShowDropdown(false) }}
                            className={cn(
                              'w-full text-left px-4 py-3 text-[13px] font-semibold rounded-xl transition-all mb-1 last:mb-0',
                              classificacao === item ? 'bg-blue-50 text-[#094780]' : 'text-slate-600 hover:bg-slate-50'
                            )}
                          >
                            {item}
                          </button>
                        ))
                        : (
                          <div className="p-4 text-center text-slate-400 text-xs">
                            Nenhum resultado para "{searchQuery}"
                          </div>
                        )}
                    </div>
                  </>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Descrição Detalhada *</label>
                <textarea
                  value={ocorrencia}
                  onChange={e => setOcorrencia(e.target.value)}
                  rows={6}
                  className={cn(inputCls, 'h-auto py-3 leading-relaxed')}
                  placeholder="Descreva detalhadamente o que aconteceu..."
                />
              </div>
            </div>
          )}

          {/* ── ANEXOS & VÍNCULO ── */}
          {tab === 'anexos' && (
            <div className="fade-up space-y-4">
              <div className="bg-white border border-[#e3e8ef] rounded-xl overflow-hidden shadow-sm">
                <div className={sectionTitleCls}>Anexos</div>
                <div className="p-6">
                  <div
                    className={cn(
                      'border-2 border-dashed rounded-2xl transition-all cursor-pointer',
                      isDragging ? 'border-[#094780] bg-blue-50' : 'border-slate-200 bg-slate-50/50 hover:border-[#094780]'
                    )}
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={e => { e.preventDefault(); setIsDragging(false); handleFilesAdd(e.dataTransfer.files) }}
                  >
                    <div className="flex flex-col items-center justify-center py-10 px-6 text-center select-none">
                      <div className="w-14 h-14 bg-white border border-slate-200 text-slate-400 rounded-2xl flex items-center justify-center mb-4">
                        <Upload size={24} />
                      </div>
                      <p className="text-sm font-semibold text-slate-600 mb-1">Clique ou arraste arquivos</p>
                      <p className="text-xs text-slate-400">JPG, PNG, WEBP ou PDF até 10 MB</p>
                    </div>
                  </div>
                  <input ref={fileInputRef} type="file" multiple accept="image/*,application/pdf" className="hidden" onChange={e => handleFilesAdd(e.target.files)} />
                </div>
                {anexos.length > 0 && (
                  <div className="px-6 pb-6 space-y-2">
                    {anexos.map(anexo => (
                      <div key={anexo.id} className="scale-in flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl group">
                        <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center flex-shrink-0">
                          {getFileIcon(anexo.file)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-semibold text-slate-700 truncate">{anexo.file.name}</p>
                          <p className="text-[11px] text-slate-400">{formatBytes(anexo.file.size)}</p>
                        </div>
                        <button onClick={() => removerAnexo(anexo.id)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-red-400 opacity-0 group-hover:opacity-100"><Trash2 size={15} /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-white border border-[#e3e8ef] rounded-xl overflow-hidden shadow-sm">
                <div className={sectionTitleCls}>Vínculo Externo</div>
                <div className="px-6 py-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className={labelCls}>Inspeção CLICK</span>
                    <button onClick={() => { setRelacionarClick(v => !v); if (relacionarClick) setNumeroInspecao('') }} className={cn('relative inline-flex h-6 w-11 items-center rounded-full transition-colors', relacionarClick ? 'bg-[#094780]' : 'bg-slate-200')}>
                      <span className={cn('inline-block h-4 w-4 rounded-full bg-white transition-transform', relacionarClick ? 'translate-x-6' : 'translate-x-1')} />
                    </button>
                  </div>
                  {relacionarClick && <input type="text" value={numeroInspecao} onChange={e => setNumeroInspecao(e.target.value)} className={inputCls} placeholder="Número da inspeção" />}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── FOOTER ── */}
        <div className="absolute bottom-0 left-0 right-0 bg-white border-t px-7 py-4 flex items-center justify-between z-50">
          <button onClick={() => setDeleteModal(true)} className="flex items-center gap-2 text-red-500 font-bold text-sm hover:text-red-600 transition-colors">
            <Trash2 size={16} /> Excluir
          </button>
          <div className="flex gap-3">
            <button onClick={() => router.back()} className="px-4 py-2 border rounded-lg text-sm font-bold hover:bg-slate-50">Cancelar</button>
            <button disabled={!hasChanges || !allValid || isSaving} onClick={handleSave} className={cn('px-6 py-2 rounded-lg text-white font-bold text-sm transition-all', hasChanges && allValid ? 'bg-[#094780] shadow-lg shadow-blue-900/20' : 'bg-gray-200 cursor-not-allowed')}>
              {isSaving ? <Loader2 className="animate-spin" size={16} /> : 'Salvar Alterações'}
            </button>
          </div>
        </div>

        {/* ── MODALS ── */}
        {successModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white p-10 rounded-[40px] text-center shadow-2xl max-w-sm">
              <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6"><CheckCircle size={48} className="text-emerald-500" /></div>
              <h3 className="font-bold text-xl mb-2">Atualizado!</h3>
              <p className="text-slate-500 text-sm mb-8">As alterações foram salvas com sucesso.</p>
              <button onClick={() => router.push('/medida-administrativa/lista')} className="w-full py-4 bg-[#094780] text-white rounded-2xl font-bold">Voltar para Lista</button>
            </div>
          </div>
        )}

        {deleteModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white p-8 rounded-3xl text-center max-w-xs shadow-2xl">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4"><Trash2 size={32} className="text-red-500" /></div>
              <h3 className="font-bold text-lg">Excluir Medida?</h3>
              <p className="text-slate-500 text-sm mb-6">Esta ação não pode ser desfeita.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteModal(false)} className="flex-1 py-2 border rounded-xl font-bold">Não</button>
                <button onClick={handleDelete} disabled={isDeleting} className="flex-1 py-2 bg-red-500 text-white rounded-xl font-bold flex items-center justify-center gap-2">
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