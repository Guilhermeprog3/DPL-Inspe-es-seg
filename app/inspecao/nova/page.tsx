'use client'

import { useState, useCallback, useRef, useMemo, useEffect, Suspense } from 'react'
import dynamic from 'next/dynamic'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useGeolocation } from '@/hooks/useGeolocation'
import { cn } from '@/lib/utils'

import {
  CheckCircle, AlertCircle, ArrowLeft, CheckCircle2,
  XCircle, Loader2, QrCode, X, MapPin, Package,
  ClipboardList, AlertTriangle, Flame, Droplets,
  Zap, Bell, Wind, Camera, Plus, Trash2,
  ChevronDown, ChevronUp, ExternalLink,
  LayoutDashboard,
  ListChecks,
  Boxes,
} from 'lucide-react'

const QrScanner = dynamic(
  () => import('@/components/inspecao/QrScanner').then(m => m.QrScanner),
  { ssr: false }
)

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

// ── Tipos de equipamento ──────────────────────────────────────────────────────
const TIPO_CONFIG: Record<string, { color: string; bg: string; border: string; icon: React.ElementType }> = {
  'Extintor':                 { color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe', icon: Flame    },
  'Hidrante':                 { color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0', icon: Droplets },
  'Iluminação de Emergência': { color: '#b45309', bg: '#fffbeb', border: '#fde68a', icon: Zap      },
  'Botoeiras e Sirenes':      { color: '#7c3aed', bg: '#faf5ff', border: '#e9d5ff', icon: Bell     },
  'Detector de Fumaça':       { color: '#c2410c', bg: '#fff7ed', border: '#fed7aa', icon: Wind     },
}

// ── Checklist por tipo ────────────────────────────────────────────────────────
const CHECKLIST_PADRAO: Record<string, Array<{ id: string; pergunta: string }>> = {
  'Extintor': [
    { id: 'lacre_intacto',   pergunta: 'Lacre/Selo INMETRO intacto e sem violação?' },
    { id: 'manometro_ok',    pergunta: 'Manômetro na faixa verde (pressurizado)?' },
    { id: 'bico_ok',         pergunta: 'Bico/Mangueira sem obstruções ou danos?' },
    { id: 'pino_seguranca',  pergunta: 'Pino de segurança presente e não acionado?' },
    { id: 'corpo_sem_danos', pergunta: 'Corpo do cilindro sem amassados, corrosão ou vazamentos?' },
    { id: 'sinaliz_ok',      pergunta: 'Sinalização e identificação visível e legível?' },
    { id: 'acesso_livre',    pergunta: 'Acesso ao extintor livre de obstáculos?' },
    { id: 'validade_ok',     pergunta: 'Dentro do prazo de validade da recarga?' },
  ],
  'Hidrante': [
    { id: 'registro_ok',  pergunta: 'Registro de abertura funcionando corretamente?' },
    { id: 'mangueira_ok', pergunta: 'Mangueira sem ressecamento, fissuras ou dobras?' },
    { id: 'esguicho_ok',  pergunta: 'Esguicho/Agulheta presente e em boas condições?' },
    { id: 'pressao_ok',   pergunta: 'Pressão da rede dentro dos parâmetros normais?' },
    { id: 'armario_ok',   pergunta: 'Armário/abrigo sem danos e com acesso desobstruído?' },
    { id: 'sinaliz_ok',   pergunta: 'Sinalização visível e identificação correta?' },
  ],
  'Iluminação de Emergência': [
    { id: 'lampada_ok', pergunta: 'Lâmpada funcionando ao acionar o teste?' },
    { id: 'bateria_ok', pergunta: 'Bateria com carga suficiente (mín. 1h de autonomia)?' },
    { id: 'fixacao_ok', pergunta: 'Fixação e posicionamento adequados?' },
    { id: 'led_ok',     pergunta: 'LED indicador de carga ativo?' },
    { id: 'rota_ok',    pergunta: 'Ilumina corretamente a rota de saída/emergência?' },
  ],
  'Botoeiras e Sirenes': [
    { id: 'botao_ok',       pergunta: 'Botão de acionamento operacional?' },
    { id: 'sirene_ok',      pergunta: 'Sirene emite sinal audível claramente?' },
    { id: 'vidro_ok',       pergunta: 'Vidro/proteção sem quebras?' },
    { id: 'sinaliz_ok',     pergunta: 'Sinalização e identificação visíveis?' },
    { id: 'alimentacao_ok', pergunta: 'Alimentação elétrica/bateria adequada?' },
  ],
  'Detector de Fumaça': [
    { id: 'led_ok',     pergunta: 'LED de standby piscando normalmente?' },
    { id: 'teste_ok',   pergunta: 'Ativou ao pressionar o botão de teste?' },
    { id: 'fixacao_ok', pergunta: 'Fixado firmemente no teto/parede?' },
    { id: 'area_livre', pergunta: 'Área ao redor livre (mín. 30cm) sem obstruções?' },
    { id: 'bateria_ok', pergunta: 'Sem alarme de bateria fraca?' },
  ],
  'default': [
    { id: 'estado_geral', pergunta: 'Estado geral do equipamento satisfatório?' },
    { id: 'sinaliz_ok',   pergunta: 'Sinalização e identificação visíveis?' },
    { id: 'acesso_ok',    pergunta: 'Acesso livre e desobstruído?' },
    { id: 'fixacao_ok',   pergunta: 'Fixação e posicionamento adequados?' },
  ],
}

type RespVal = 'sim' | 'nao' | 'na'
type Resp    = RespVal | null

const OPCOES_RESP = [
  { val: 'sim' as RespVal, label: 'SIM', color: '#059669', bg: '#ecfdf5', border: '#a7f3d0', icon: CheckCircle2  },
  { val: 'nao' as RespVal, label: 'NÃO', color: '#dc2626', bg: '#fef2f2', border: '#fecaca', icon: XCircle       },
  { val: 'na'  as RespVal, label: 'N/A', color: '#6b7280', bg: '#f9fafb', border: '#e5e7eb', icon: AlertTriangle },
]

interface AcaoCorretiva {
  id: string
  titulo: string
  descricao: string
  dataVencimento: string
  numNC: string
  empresaResponsavel: string
  emailsCopia: string
  expandido: boolean
}

function novaAcao(): AcaoCorretiva {
  return {
    id: crypto.randomUUID(),
    titulo: '',
    descricao: '',
    dataVencimento: '',
    numNC: '',
    empresaResponsavel: 'DPL',
    emailsCopia: '',
    expandido: true,
  }
}

// ── Abas (espelhando o padrão da tela de equipamentos) ────────────────────────
const TABS = [
  { key: 'ponto'     as const, label: 'Ponto',     icon: QrCode       },
  { key: 'checklist' as const, label: 'Checklist', icon: ClipboardList },
  { key: 'acoes'     as const, label: 'Ações',     icon: AlertTriangle },
] as const
type TabKey = typeof TABS[number]['key']

// ─────────────────────────────────────────────────────────────────────────────
function InspecaoInner() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const { capture: captureGeo } = useGeolocation()

  const pontoIdParam = searchParams.get('pontoId') ?? ''

  const [mounted,      setMounted]      = useState(false)
  const [tab,          setTab]          = useState<TabKey>('ponto')
  const [loadingQr,    setLoadingQr]    = useState(false)
  const [isSaving,     setIsSaving]     = useState(false)
  const [successModal, setSuccessModal] = useState(false)
  const [inspecaoId,   setInspecaoId]   = useState('')
  const [erroQr,       setErroQr]       = useState('')

  const [ponto,   setPonto]   = useState<any | null>(null)
  const [pontoId, setPontoId] = useState(pontoIdParam)
  const [qrInput, setQrInput] = useState('')

  const [sugestoes,     setSugestoes]     = useState<any[]>([])
  const [loadingSug,    setLoadingSug]    = useState(false)
  const [showSugestoes, setShowSugestoes] = useState(false)
  const inputRef     = useRef<HTMLInputElement>(null)
  const sugestoesRef = useRef<HTMLDivElement>(null)
  const debounceRef  = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [cameraAberta,     setCameraAberta]     = useState(false)
  const [usarCameraNativa, setUsarCameraNativa] = useState(false)
  const videoRef        = useRef<HTMLVideoElement>(null)
  const canvasRef       = useRef<HTMLCanvasElement>(null)
  const streamRef       = useRef<MediaStream | null>(null)
  const scanIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const [respostas,   setRespostas]   = useState<Record<string, Resp>>({})
  const [observacoes, setObs]         = useState('')
  const [statusFinal, setStatusFinal] = useState<'APROVADO' | 'REPROVADO' | 'ATENCAO'>('APROVADO')
  const [acoes,       setAcoes]       = useState<AcaoCorretiva[]>([])

  useEffect(() => { setMounted(true) }, [])

  // ── Busca ponto ─────────────────────────────────────────────────────────
  const buscarPontoPorId = useCallback(async (id: string) => {
    setLoadingQr(true); setErroQr('')
    try {
      const token = (session as any)?.access_token || (session as any)?.accessToken
      const res = await fetch(`http://localhost:3001/pontos/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setPonto(data); setPontoId(data.id)
      // Inicializa o checklist ao confirmar o ponto
      const cl = CHECKLIST_PADRAO[data.equipamentoAtual?.tipo] ?? CHECKLIST_PADRAO['default']
      const inicial: Record<string, Resp> = {}
      cl.forEach(c => { inicial[c.id] = null })
      setRespostas(inicial)
    } catch { setErroQr('Ponto não encontrado.') }
    finally { setLoadingQr(false) }
  }, [session])

  useEffect(() => {
    if (pontoIdParam && session) buscarPontoPorId(pontoIdParam)
  }, [pontoIdParam, session, buscarPontoPorId])

  const buscarPontoPorQr = useCallback(async (val: string) => {
    // 1. Trava: Se não houver valor, se estiver carregando, OU se já localizou esse mesmo ponto, ignora.
    if (!val || loadingQr || (ponto && (ponto.id === val || ponto.qrCode === val))) return

    setShowSugestoes(false)
    setLoadingQr(true)
    setErroQr('')

    try {
      let codigoFinal = val.trim()
      if (codigoFinal.includes('pontoId=')) {
        try {
          const url = new URL(codigoFinal)
          const idDaUrl = url.searchParams.get('pontoId')
          if (idDaUrl) codigoFinal = idDaUrl
        } catch { codigoFinal = codigoFinal.split('pontoId=').pop() || codigoFinal }
      }

      const token = (session as any)?.access_token || (session as any)?.accessToken
      
      // Chamada inteligente ao backend (Opção 1 que você escolheu)
      const res = await fetch(`http://localhost:3001/pontos/qrcode/${encodeURIComponent(codigoFinal)}`, { 
        headers: { Authorization: `Bearer ${token}` } 
      })
      
      if (!res.ok) throw new Error()
      const data = await res.json()

      // 2. Sucesso: Atualiza os dados
      setPonto(data)
      setPontoId(data.id)
      setQrInput(data.qrCode) // Atualiza o input com o código amigável
      captureGeo()

      // Inicializa checklist
      const cl = CHECKLIST_PADRAO[data.equipamentoAtual?.tipo] ?? CHECKLIST_PADRAO['default']
      const inicial: Record<string, Resp> = {}
      cl.forEach(c => { inicial[c.id] = null })
      setRespostas(inicial)

      // Opcional: Pular automaticamente para a aba de checklist após localizar
      // setTimeout(() => setTab('checklist'), 500)

    } catch { 
      setErroQr('QR Code inválido ou Ponto de Instalação não cadastrado.') 
    } finally { 
      setLoadingQr(false) 
    }
    // Adicione 'ponto' e 'loadingQr' nas dependências para a trava funcionar
  }, [session, captureGeo, loadingQr, ponto])

  const handleScan = useCallback((val: string) => {
    // Só dispara a busca se o valor for diferente do que já está processando
    if (val && !loadingQr) {
      buscarPontoPorQr(val)
    }
  }, [buscarPontoPorQr, loadingQr])

  const buscarSugestoes = useCallback(async (termo: string) => {
    if (termo.length < 2) { setSugestoes([]); setShowSugestoes(false); return }
    setLoadingSug(true)
    try {
      const token = (session as any)?.access_token || (session as any)?.accessToken
      const res = await fetch('http://localhost:3001/pontos', { headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) throw new Error()
      const responseData: any = await res.json()
      const lista = Array.isArray(responseData) ? responseData : (responseData?.data ?? [])
      const t = termo.toLowerCase()
      const filtrado = lista.filter((p: any) => p.qrCode?.toLowerCase().includes(t) || p.nome?.toLowerCase().includes(t)).slice(0, 6)
      setSugestoes(filtrado); setShowSugestoes(filtrado.length > 0)
    } catch { setSugestoes([]) }
    finally { setLoadingSug(false) }
  }, [session])

  const handleQrInputChange = (val: string) => {
    setQrInput(val.toUpperCase()); setErroQr('')
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => buscarSugestoes(val), 300)
  }

  const selecionarSugestao = (s: any) => {
    setQrInput(s.qrCode); setShowSugestoes(false); setSugestoes([])
    setPonto(s); setPontoId(s.id); captureGeo()
    const cl = CHECKLIST_PADRAO[s.equipamentoAtual?.tipo] ?? CHECKLIST_PADRAO['default']
    const inicial: Record<string, Resp> = {}
    cl.forEach(c => { inicial[c.id] = null })
    setRespostas(inicial)
  }

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!inputRef.current?.contains(e.target as Node) && !sugestoesRef.current?.contains(e.target as Node))
        setShowSugestoes(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // ── Câmera nativa ────────────────────────────────────────────────────────
  const abrirCameraNativa = async () => {
    setErroQr('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      streamRef.current = stream; setCameraAberta(true)
      setTimeout(() => {
        if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play(); iniciarScanNativo() }
      }, 200)
    } catch { setErroQr('Não foi possível acessar a câmera. Verifique as permissões.') }
  }

  const fecharCameraNativa = () => {
    if (scanIntervalRef.current) clearInterval(scanIntervalRef.current)
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null; setCameraAberta(false)
  }

  const iniciarScanNativo = () => {
    import('jsqr').then(({ default: jsQR }) => {
      scanIntervalRef.current = setInterval(() => {
        const video = videoRef.current; const canvas = canvasRef.current
        if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) return
        const ctx = canvas.getContext('2d'); if (!ctx) return
        canvas.width = video.videoWidth; canvas.height = video.videoHeight
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const code = jsQR(imageData.data, imageData.width, imageData.height)
        if (code?.data) { fecharCameraNativa(); buscarPontoPorQr(code.data) }
      }, 300)
    }).catch(() => { setErroQr('jsQR não disponível.'); fecharCameraNativa() })
  }

  useEffect(() => {
    return () => { fecharCameraNativa(); if (debounceRef.current) clearTimeout(debounceRef.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Checklist ────────────────────────────────────────────────────────────
  const checklist = useMemo(() => {
    if (!ponto?.equipamentoAtual) return CHECKLIST_PADRAO['default']
    return CHECKLIST_PADRAO[ponto.equipamentoAtual.tipo] ?? CHECKLIST_PADRAO['default']
  }, [ponto])

  const setResp = (id: string, val: RespVal) => {
    setRespostas(prev => {
      const novo = { ...prev, [id]: val }
      const qtdNao = Object.values(novo).filter(v => v === 'nao').length
      if (qtdNao >= 3) setStatusFinal('REPROVADO')
      else if (qtdNao >= 1) setStatusFinal('ATENCAO')
      else setStatusFinal('APROVADO')
      return novo
    })
  }

  const totalRespondidas = Object.values(respostas).filter(v => v !== null).length
  const totalPerguntas   = checklist.length
  const progresso        = totalPerguntas > 0 ? Math.round((totalRespondidas / totalPerguntas) * 100) : 0

  // ── Ações ────────────────────────────────────────────────────────────────
  const adicionarAcao      = () => setAcoes(prev => [...prev, novaAcao()])
  const removerAcao        = (id: string) => setAcoes(prev => prev.filter(a => a.id !== id))
  const atualizarAcao      = (id: string, campo: keyof AcaoCorretiva, valor: string) =>
    setAcoes(prev => prev.map(a => a.id === id ? { ...a, [campo]: valor } : a))
  const toggleExpandirAcao = (id: string) =>
    setAcoes(prev => prev.map(a => a.id === id ? { ...a, expandido: !a.expandido } : a))
  const acoesValidas       = acoes.every(a => a.titulo.trim().length > 0 && a.descricao.trim().length > 0)

  // ── Validação por aba ─────────────────────────────────────────────────────
  const tabValid: Record<TabKey, boolean> = {
    ponto:     !!ponto && !!ponto.equipamentoAtual,
    checklist: totalRespondidas === totalPerguntas && totalPerguntas > 0,
    acoes:     acoes.length === 0 || acoesValidas,
  }
  const TAB_ORDER: TabKey[] = ['ponto', 'checklist', 'acoes']
  const currentIdx          = TAB_ORDER.indexOf(tab)
  const completedCount      = TAB_ORDER.filter(k => tabValid[k]).length

  // ── Salvar ───────────────────────────────────────────────────────────────
  const handleSalvar = async () => {
    if (isSaving || !tabValid.checklist || !acoesValidas) return
    setIsSaving(true)
    try {
      const token = (session as any)?.access_token || (session as any)?.accessToken
      const payload = {
        pontoId,
        status: statusFinal,
        respostas: Object.entries(respostas).map(([id, resp]) => ({
          id,
          pergunta: checklist.find(c => c.id === id)?.pergunta ?? id,
          resposta: resp,
        })),
        observacoes: observacoes || null,
        acoesCorretivas: acoes.map(({ id: _id, expandido: _exp, ...rest }) => rest),
      }
      const res = await fetch('http://localhost:3001/inspecoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      })
      if (res.status === 401) { alert('Não autorizado.'); router.push('/login'); return }
      if (!res.ok) { const err = await res.json(); throw new Error(err.message || 'Erro') }
      const result = await res.json()
      setInspecaoId(result.id)
      setSuccessModal(true)
    } catch (error: any) {
      alert(error.message || 'Erro ao salvar inspeção.')
    } finally {
      setIsSaving(false)
    }
  }

  // ── Visual helpers ───────────────────────────────────────────────────────
  const tipoCfg  = ponto?.equipamentoAtual ? (TIPO_CONFIG[ponto.equipamentoAtual.tipo] ?? TIPO_CONFIG['Extintor']) : null
  const TipoIcon = tipoCfg?.icon ?? Package

  const statusColor = statusFinal === 'APROVADO' ? '#059669' : statusFinal === 'ATENCAO' ? '#d97706' : '#dc2626'
  const statusBg    = statusFinal === 'APROVADO' ? '#ecfdf5' : statusFinal === 'ATENCAO' ? '#fffbeb' : '#fef2f2'

  const inp  = 'w-full bg-[#f8fafc] border border-[#e3e8ef] rounded-lg h-10 px-3 text-[13.5px] outline-none focus:border-[#3d6cf0] transition-all'
  const sec  = 'text-[11px] font-bold uppercase tracking-widest text-[#9ca3af] px-6 py-3 bg-[#f8fafc] border-b border-[#e3e8ef]'
  const lbl  = 'text-[13.5px] font-medium text-[#111827]'
  const lbl2 = 'text-[11px] text-slate-400 mt-0.5'
  const row  = 'grid gap-4 items-start py-4 grid-cols-1 sm:grid-cols-[220px_1fr]'
  const divi = 'divide-y divide-[#f1f5f9]'

  if (!mounted) return null

  return (
    <div className="w-full flex flex-col bg-[#f4f6f9] min-h-[calc(100vh-60px)]">

      {/* ── Câmera nativa overlay ── */}
      {cameraAberta && usarCameraNativa && (
        <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black">
          <div className="relative w-full max-w-sm">
            <video ref={videoRef} className="w-full rounded-xl" playsInline muted />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-56 h-56 border-2 border-white/70 rounded-2xl relative">
                <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-[#3d6cf0] rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-[#3d6cf0] rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-[#3d6cf0] rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-[#3d6cf0] rounded-br-lg" />
                <div className="scan-line absolute left-1 right-1 h-0.5 bg-[#3d6cf0]/80 rounded-full" />
              </div>
            </div>
            <canvas ref={canvasRef} className="hidden" />
          </div>
          <p className="text-white/80 text-sm mt-4 font-medium">Aponte a câmera para o QR Code</p>
          <button onClick={fecharCameraNativa}
            className="mt-6 flex items-center gap-2 px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-bold transition-all">
            <X size={16} /> Cancelar
          </button>
        </div>
      )}

      {/* ── Breadcrumb ── */}
      <div className="bg-white border-b border-[#e3e8ef] px-7 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[13px] text-[#9ca3af]">
          <button onClick={() => router.push('/inspecao/lista')}
            className="hover:text-[#3d6cf0] transition-colors flex items-center gap-1.5 font-medium">
            <ArrowLeft size={14} /> Inspeções
          </button>
          <span className="text-[11px]">›</span>
          <span className="text-[#3d6cf0] font-semibold">Nova Vistoria</span>
        </div>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          Etapa {currentIdx + 1} de {TAB_ORDER.length}
        </span>
      </div>

      {/* ── Tab bar (idêntico ao de equipamentos) ── */}
      <div className="bg-white border-b border-[#e3e8ef] px-7 flex overflow-x-auto shadow-sm">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={cn(
              'flex items-center gap-2 px-5 py-4 text-[13.5px] border-b-[2.5px] whitespace-nowrap transition-all -mb-px',
              tab === t.key
                ? 'text-[#3d6cf0] border-[#3d6cf0] font-bold'
                : 'text-[#9ca3af] border-transparent hover:text-slate-600'
            )}>
            {t.label}
            {tabValid[t.key] && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 ml-1" />}
          </button>
        ))}
      </div>

      {/* ── Conteúdo ── */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-8 pt-6 pb-28">

        {/* ══ ABA 1 — PONTO ══ */}
        {tab === 'ponto' && (
          <div className="fade-up space-y-4 max-w-7xl mx-auto">

            {/* Bloco do scanner */}
            <div className="bg-white border border-[#e3e8ef] rounded-xl shadow-sm overflow-hidden">
              <div className={sec}>Identificar Ponto de Instalação</div>
              <div className="p-6 space-y-5">

                {/* Scanner QR embutido */}
<div className="aspect-[4/3] bg-slate-900 rounded-2xl overflow-hidden relative">
  {/* O Scanner fica SEMPRE montado */}
  <QrScanner onScan={handleScan} />

  {/* O Loader aparece POR CIMA, sem remover o scanner do DOM */}
  {loadingQr && (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/80 z-20 backdrop-blur-sm">
      <Loader2 className="animate-spin text-white mb-2" size={40} />
      <span className="text-white text-xs font-bold tracking-widest uppercase">Processando...</span>
    </div>
  )}
  
  {/* Overlay de sucesso se já tiver um ponto (opcional, para indicar que parou de ler) */}
  {!loadingQr && ponto && (
    <div className="absolute inset-0 flex items-center justify-center bg-emerald-500/20 z-10 pointer-events-none border-4 border-emerald-500 rounded-2xl">
        <CheckCircle className="text-emerald-500 bg-white rounded-full" size={48} />
    </div>
  )}
</div>

                {/* Input manual + câmera */}
                <div className="space-y-2">
                  <div className="relative flex gap-2" style={{ isolation: 'isolate', zIndex: 100 }}>
                    <div className="relative flex-1">
                      <input
                        ref={inputRef}
                        type="text"
                        value={qrInput}
                        onChange={e => handleQrInputChange(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') buscarPontoPorQr(qrInput)
                          if (e.key === 'Escape') setShowSugestoes(false)
                        }}
                        onFocus={() => { if (sugestoes.length > 0) setShowSugestoes(true) }}
                        className={cn(inp, 'font-mono pr-8', erroQr ? 'border-red-300 bg-red-50' : '')}
                        placeholder="Código QR ou nome do local..."
                        autoComplete="off"
                      />
                      <div className="absolute right-2 top-1/2 -translate-y-1/2">
                        {loadingSug
                          ? <Loader2 size={14} className="animate-spin text-slate-400" />
                          : qrInput
                            ? <button onClick={() => { setQrInput(''); setSugestoes([]); setShowSugestoes(false); setErroQr('') }}
                                className="text-slate-400 hover:text-slate-600"><X size={14} /></button>
                            : null
                        }
                      </div>

                      {/* Dropdown sugestões */}
                      {showSugestoes && sugestoes.length > 0 && (
                        <div ref={sugestoesRef}
                          className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#e3e8ef] rounded-xl shadow-2xl text-left overflow-hidden"
                          style={{ zIndex: 9999 }}>
                          {sugestoes.map(s => {
                            const qrCode = s.qrCode as string
                            const t = qrInput.toLowerCase()
                            const idx = qrCode.toLowerCase().indexOf(t)
                            return (
                              <button key={s.id}
                                onMouseDown={e => { e.preventDefault(); selecionarSugestao(s) }}
                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#f8fafc] transition-colors text-left border-b border-[#f1f5f9] last:border-0">
                                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <QrCode size={14} className="text-[#3d6cf0]" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-[12px] font-mono font-bold text-slate-700 leading-tight">
                                    {idx >= 0 ? (
                                      <>{qrCode.slice(0, idx)}<mark className="bg-yellow-200 text-yellow-900 rounded px-0.5">{qrCode.slice(idx, idx + qrInput.length)}</mark>{qrCode.slice(idx + qrInput.length)}</>
                                    ) : qrCode}
                                  </p>
                                  <p className="text-[11px] text-slate-500 truncate mt-0.5">{s.nome}</p>
                                  <p className="text-[10px] text-slate-400">{[s.base, s.regional, s.uf].filter(Boolean).join(' · ')}</p>
                                </div>
                                {s.equipamentoAtual && (
                                  <span className="text-[9px] font-black uppercase text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded flex-shrink-0">
                                    com equip.
                                  </span>
                                )}
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </div>

                    <button onClick={() => { setUsarCameraNativa(true); abrirCameraNativa() }}
                      title="Câmera nativa"
                      className="h-10 px-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-all flex items-center gap-1.5 text-xs font-bold flex-shrink-0">
                      <Camera size={16} />
                    </button>

                    <button onClick={() => buscarPontoPorQr(qrInput)}
                      disabled={!qrInput.trim() || loadingQr}
                      className={cn(
                        'h-10 px-4 rounded-lg text-sm font-black text-white transition-all flex items-center gap-2 flex-shrink-0',
                        qrInput.trim() && !loadingQr ? 'bg-[#3d6cf0] hover:bg-[#3460d8]' : 'bg-slate-200 cursor-not-allowed'
                      )}>
                      {loadingQr ? <Loader2 size={16} className="animate-spin" /> : 'OK'}
                    </button>
                  </div>

                  {erroQr && (
                    <p className="text-[12px] text-red-500 font-medium flex items-center gap-1">
                      <AlertCircle size={12} /> {erroQr}
                    </p>
                  )}
                </div>

                {/* Aviso de cadastro de ponto */}
                <div className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-100 rounded-xl">
                  <div className="w-8 h-8 bg-white rounded-lg border border-slate-200 flex items-center justify-center flex-shrink-0">
                    <MapPin size={14} className="text-slate-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] text-slate-500">Ponto não cadastrado?</p>
                  </div>
                  <button
                    onClick={() => router.push('/locais/novo')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-[#3d6cf0] hover:text-white border border-[#e3e8ef] hover:border-[#3d6cf0] text-[#3d6cf0] rounded-lg text-[11px] font-black transition-all flex-shrink-0 group">
                    <Plus size={11} />
                    CADASTRAR AQUI
                    <ExternalLink size={10} className="opacity-50 group-hover:opacity-100" />
                  </button>
                </div>
              </div>
            </div>

            {/* Card do ponto identificado */}
            {ponto && (
              <div className="slide-down bg-white border border-[#e3e8ef] rounded-xl shadow-sm overflow-hidden">
                <div className={sec}>Ponto Identificado</div>
                <div className="px-6 py-5 flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0 border border-blue-100">
                    <MapPin size={22} className="text-[#3d6cf0]" />
                  </div>
                  <div className="flex-1">
                    <p className="font-black text-[#111827] text-lg leading-tight">{ponto.nome}</p>
                    <p className="text-[12px] text-slate-400 mt-0.5 font-mono">{ponto.qrCode}</p>
                    <p className="text-[12px] text-slate-500 mt-1">{[ponto.base, ponto.regional, ponto.uf].filter(Boolean).join(' · ')}</p>
                  </div>
                  <button onClick={() => { setPonto(null); setPontoId(''); setQrInput(''); setRespostas({}) }}
                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-300 hover:text-slate-500 transition-colors flex-shrink-0">
                    <X size={16} />
                  </button>
                </div>

                {/* Equipamento vinculado */}
                {ponto.equipamentoAtual ? (
                  <div className="mx-6 mb-5 rounded-xl border-2 overflow-hidden" style={{ borderColor: tipoCfg?.border ?? '#e3e8ef' }}>
                    <div className="px-4 py-2.5 flex items-center gap-2 border-b"
                      style={{ background: tipoCfg?.bg ?? '#f8fafc', borderColor: tipoCfg?.border ?? '#e3e8ef' }}>
                      <TipoIcon size={13} style={{ color: tipoCfg?.color }} />
                      <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: tipoCfg?.color }}>
                        Equipamento Vinculado
                      </span>
                    </div>
                    <div className="px-4 py-3 flex items-center gap-3 bg-white">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center border flex-shrink-0"
                        style={{ background: tipoCfg?.bg, borderColor: tipoCfg?.border }}>
                        <TipoIcon size={18} style={{ color: tipoCfg?.color }} />
                      </div>
                      <div>
                        <p className="font-black text-[#111827] text-[13px]">{ponto.equipamentoAtual.nome || ponto.equipamentoAtual.tipo}</p>
                        <p className="text-[11px] text-slate-400 font-mono">{ponto.equipamentoAtual.codigo}</p>
                        {ponto.equipamentoAtual.extintorClasse && (
                          <p className="text-[11px] text-slate-500">
                            {ponto.equipamentoAtual.extintorClasse}
                            {ponto.equipamentoAtual.extintorCarga ? ` · ${ponto.equipamentoAtual.extintorCarga}kg` : ''}
                            {ponto.equipamentoAtual.agente ? ` · ${ponto.equipamentoAtual.agente}` : ''}
                          </p>
                        )}
                      </div>
                      <span className="ml-auto text-[10px] font-black bg-slate-100 px-2 py-0.5 rounded text-slate-500">
                        {ponto.equipamentoAtual.tipo}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="mx-6 mb-5 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                    <AlertCircle size={18} className="text-amber-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-bold text-amber-800 text-[13px]">Sem equipamento vinculado</p>
                      <p className="text-[11px] text-amber-700 mt-0.5">Vincule um equipamento a este ponto antes de realizar a inspeção.</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ══ ABA 2 — CHECKLIST ══ */}
        {tab === 'checklist' && (
          <div className="fade-up space-y-4 max-w-7xl mx-auto">
            {!ponto ? (
              <div className="bg-white border border-[#e3e8ef] rounded-xl shadow-sm p-10 text-center">
                <QrCode size={32} className="mx-auto text-slate-200 mb-3" />
                <p className="text-[13px] font-bold text-slate-400">Nenhum ponto selecionado</p>
                <p className="text-[11px] text-slate-300 mt-1">Volte para a aba Ponto e escaneie o QR Code.</p>
                <button onClick={() => setTab('ponto')}
                  className="mt-4 px-5 py-2 bg-[#3d6cf0] text-white rounded-xl text-xs font-black">
                  IR PARA PONTO
                </button>
              </div>
            ) : (
              <>
                {/* Barra de progresso */}
                <div className="bg-white border border-[#e3e8ef] rounded-xl shadow-sm overflow-hidden">
                  <div className={sec}>Progresso da Inspeção</div>
                  <div className="px-6 py-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[12px] font-bold text-slate-500">{ponto.nome} · {ponto.equipamentoAtual?.tipo}</span>
                      <span className="text-[12px] font-black text-[#3d6cf0]">{totalRespondidas}/{totalPerguntas}</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-300 bg-[#3d6cf0]" style={{ width: `${progresso}%` }} />
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: statusBg, color: statusColor }}>
                        {statusFinal === 'APROVADO' ? '✓ Aprovado' : statusFinal === 'ATENCAO' ? '⚠ Atenção' : '✗ Reprovado'}
                      </span>
                      <span className="text-[11px] text-slate-400">{progresso}% concluído</span>
                    </div>
                  </div>
                </div>

                {/* Itens do checklist */}
                <div className="bg-white border border-[#e3e8ef] rounded-xl shadow-sm overflow-hidden">
                  <div className={sec}>Checklist — {checklist.length} itens</div>
                  <div className={cn('px-6', divi)}>
                    {checklist.map((item, idx) => {
                      const resp = respostas[item.id]
                      return (
                        <div key={item.id} className="grid gap-4 items-center py-4 grid-cols-1 sm:grid-cols-[1fr_auto]">
                          <div className="flex items-start gap-2.5">
                            <span className="text-[11px] font-black text-slate-300 mt-0.5 w-5 flex-shrink-0 tabular-nums">
                              {String(idx + 1).padStart(2, '0')}
                            </span>
                            <div>
                              <p className={lbl}>{item.pergunta}</p>
                              {resp === 'nao' && <p className={cn(lbl2, 'text-red-400')}>Não conforme</p>}
                              {resp === 'na'  && <p className={cn(lbl2, 'text-slate-400')}>N/A</p>}
                              {resp === 'sim' && <p className={cn(lbl2, 'text-emerald-500')}>Conforme</p>}
                            </div>
                          </div>
                          <div className="flex gap-2 flex-wrap ml-7 sm:ml-0">
                            {OPCOES_RESP.map(opt => {
                              const sel  = resp === opt.val
                              const Icon = opt.icon
                              return (
                                <button key={opt.val} onClick={() => setResp(item.id, opt.val)}
                                  className={cn(
                                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all',
                                    sel ? 'shadow-sm' : 'opacity-50 hover:opacity-80'
                                  )}
                                  style={sel
                                    ? { background: opt.bg, borderColor: opt.border, color: opt.color }
                                    : { background: '#f8fafc', borderColor: '#e3e8ef', color: '#9ca3af' }
                                  }>
                                  <Icon size={12} /> {opt.label}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Observações */}
                <div className="bg-white border border-[#e3e8ef] rounded-xl shadow-sm overflow-hidden">
                  <div className={sec}>Observações (Opcional)</div>
                  <div className={cn('px-6', divi)}>
                    <div className={row}>
                      <div>
                        <p className={lbl}>Anotações adicionais</p>
                        <p className={lbl2}>Anomalias ou descrições</p>
                      </div>
                      <textarea value={observacoes} onChange={e => setObs(e.target.value)} rows={3}
                        className={cn(inp, 'h-auto py-2.5 resize-none leading-relaxed')}
                        placeholder="Registre observações adicionais..." />
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ══ ABA 3 — AÇÕES CORRETIVAS ══ */}
        {tab === 'acoes' && (
          <div className="fade-up space-y-4 max-w-7xl mx-auto">

            {/* Resumo do status da inspeção */}
            {ponto && (
              <div className="rounded-xl p-4 flex items-center gap-3 border"
                style={{ background: statusBg, borderColor: statusColor + '40' }}>
                {statusFinal === 'APROVADO'
                  ? <CheckCircle size={20} style={{ color: statusColor }} />
                  : statusFinal === 'ATENCAO'
                  ? <AlertTriangle size={20} style={{ color: statusColor }} />
                  : <XCircle size={20} style={{ color: statusColor }} />}
                <div>
                  <p className="text-[13px] font-black" style={{ color: statusColor }}>
                    Inspeção {statusFinal === 'APROVADO' ? 'Aprovada' : statusFinal === 'ATENCAO' ? 'com Atenção' : 'Reprovada'}
                  </p>
                  <p className="text-[11px] text-slate-500">{ponto.nome} · {ponto.equipamentoAtual?.tipo}</p>
                </div>
                <div className="ml-auto">
                  <p className="text-[11px] font-bold text-slate-400 text-right">
                    {Object.values(respostas).filter(v => v === 'nao').length} não conformidade(s)
                  </p>
                </div>
              </div>
            )}

            {/* Card de ações */}
            <div className="bg-white border border-[#e3e8ef] rounded-xl shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-6 py-3 bg-[#f8fafc] border-b border-[#e3e8ef]">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-[#9ca3af]">Ações Corretivas</span>
                  {acoes.length > 0 && (
                    <span className="text-[10px] font-black bg-[#3d6cf0] text-white px-1.5 py-0.5 rounded-full">{acoes.length}</span>
                  )}
                </div>
                <button onClick={adicionarAcao}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#3d6cf0] hover:bg-[#3460d8] text-white rounded-lg text-[11px] font-black transition-all">
                  <Plus size={12} /> ADICIONAR AÇÃO
                </button>
              </div>

              {acoes.length === 0 ? (
                <div className="px-6 py-10 text-center">
                  <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <ClipboardList size={20} className="text-slate-300" />
                  </div>
                  <p className="text-[13px] font-bold text-slate-400">Nenhuma ação cadastrada</p>
                  <p className="text-[11px] text-slate-300 mt-0.5">Ações são opcionais. Adicione para registrar não conformidades.</p>
                </div>
              ) : (
                <div className="divide-y divide-[#f1f5f9]">
                  {acoes.map((acao, idx) => {
                    const temErro = acao.titulo.trim() === '' || acao.descricao.trim() === ''
                    return (
                      <div key={acao.id} className="overflow-hidden">
                        {/* Header clicável */}
                        <div
                          className={cn(
                            'flex items-center gap-3 px-6 py-3 cursor-pointer hover:bg-slate-50 transition-colors',
                            temErro && !acao.expandido ? 'bg-red-50/50' : ''
                          )}
                          onClick={() => toggleExpandirAcao(acao.id)}>
                          <div className={cn(
                            'w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0',
                            temErro ? 'bg-red-100 text-red-500' : 'bg-blue-100 text-[#3d6cf0]'
                          )}>{idx + 1}</div>
                          <div className="flex-1 min-w-0">
                            <p className={cn('text-[13px] font-bold truncate', acao.titulo.trim() ? 'text-[#111827]' : 'text-slate-300')}>
                              {acao.titulo.trim() || 'Sem título...'}
                            </p>
                            {!acao.expandido && acao.descricao.trim() && (
                              <p className="text-[11px] text-slate-400 truncate">{acao.descricao}</p>
                            )}
                          </div>
                          {temErro && !acao.expandido && (
                            <span className="text-[10px] font-black text-red-500 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded flex-shrink-0">incompleta</span>
                          )}
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button onClick={e => { e.stopPropagation(); removerAcao(acao.id) }}
                              className="p-1.5 rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-400 transition-colors">
                              <Trash2 size={13} />
                            </button>
                            {acao.expandido ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
                          </div>
                        </div>

                        {/* Formulário expansível */}
                        {acao.expandido && (
                          <div className="px-6 pb-5 space-y-3 bg-slate-50/50">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                              <div className="sm:col-span-2">
                                <label className="block text-[11px] font-bold text-slate-500 mb-1 uppercase tracking-wide">
                                  Título <span className="text-red-400">*</span>
                                </label>
                                <input type="text" value={acao.titulo}
                                  onChange={e => atualizarAcao(acao.id, 'titulo', e.target.value)}
                                  className={cn(inp, acao.titulo.trim() === '' ? 'border-red-300 bg-red-50' : '')}
                                  placeholder="Ex: Substituição do lacre danificado" />
                              </div>
                              <div className="sm:col-span-2">
                                <label className="block text-[11px] font-bold text-slate-500 mb-1 uppercase tracking-wide">
                                  Descrição <span className="text-red-400">*</span>
                                </label>
                                <textarea value={acao.descricao}
                                  onChange={e => atualizarAcao(acao.id, 'descricao', e.target.value)}
                                  rows={2}
                                  className={cn(inp, 'h-auto py-2.5 resize-none leading-relaxed', acao.descricao.trim() === '' ? 'border-red-300 bg-red-50' : '')}
                                  placeholder="Descreva a ação a ser tomada..." />
                              </div>
                              <div>
                                <label className="block text-[11px] font-bold text-slate-500 mb-1 uppercase tracking-wide">Nº Não Conformidade</label>
                                <input type="text" value={acao.numNC}
                                  onChange={e => atualizarAcao(acao.id, 'numNC', e.target.value)}
                                  className={inp} placeholder="Ex: NC-2024-001" />
                              </div>
                              <div>
                                <label className="block text-[11px] font-bold text-slate-500 mb-1 uppercase tracking-wide">Data de Vencimento</label>
                                <input type="date" value={acao.dataVencimento}
                                  onChange={e => atualizarAcao(acao.id, 'dataVencimento', e.target.value)}
                                  className={inp} />
                              </div>
                              <div>
                                <label className="block text-[11px] font-bold text-slate-500 mb-1 uppercase tracking-wide">Empresa Responsável</label>
                                <input type="text" value={acao.empresaResponsavel}
                                  onChange={e => atualizarAcao(acao.id, 'empresaResponsavel', e.target.value)}
                                  className={inp} placeholder="Ex: DPL" />
                              </div>
                              <div>
                                <label className="block text-[11px] font-bold text-slate-500 mb-1 uppercase tracking-wide">E-mails em Cópia</label>
                                <input type="text" value={acao.emailsCopia}
                                  onChange={e => atualizarAcao(acao.id, 'emailsCopia', e.target.value)}
                                  className={inp} placeholder="email1@empresa.com, email2@..." />
                              </div>
                            </div>
                            <div className="flex items-center gap-2 pt-1">
                              <span className="text-[10px] font-black uppercase text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                                Status: A ATRIBUIR
                              </span>
                              <span className="text-[10px] font-black uppercase text-slate-400 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">
                                Responsável: A ATRIBUIR
                              </span>
                              <span className="text-[10px] text-slate-300">— definidos após criação</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {acoes.length > 0 && !acoesValidas && (
              <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-[12px] text-red-600 font-medium">
                <AlertCircle size={14} className="flex-shrink-0" />
                Preencha o título e a descrição de todas as ações antes de finalizar.
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Barra inferior (idêntica ao padrão de equipamentos) ── */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t px-8 py-4 flex items-center justify-between z-50">
        <div className="hidden md:flex items-center gap-4">
          <div className="flex gap-1.5">
            {TAB_ORDER.map(key => (
              <div key={key}
                className={cn('h-1.5 w-6 rounded-full transition-all', tabValid[key] ? 'bg-[#3d6cf0]' : 'bg-slate-200')} />
            ))}
          </div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Etapas concluídas: {completedCount}/{TAB_ORDER.length}
          </span>
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          {currentIdx > 0 && (
            <button onClick={() => setTab(TAB_ORDER[currentIdx - 1])}
              className="flex-1 md:flex-none px-6 py-2 border-2 rounded-xl text-xs font-bold text-slate-500">
              VOLTAR
            </button>
          )}
          {currentIdx < TAB_ORDER.length - 1 ? (
            <button onClick={() => setTab(TAB_ORDER[currentIdx + 1])}
              className="flex-1 md:flex-none px-8 py-2 rounded-xl text-xs font-black text-white bg-[#3d6cf0] hover:bg-[#3460d8] transition-all">
              PRÓXIMO
            </button>
          ) : (
            <button
              disabled={!tabValid.ponto || !tabValid.checklist || !acoesValidas || isSaving}
              onClick={handleSalvar}
              className={cn(
                'flex-1 md:flex-none px-8 py-2 rounded-xl text-xs font-black text-white transition-all flex items-center justify-center gap-2',
                tabValid.ponto && tabValid.checklist && acoesValidas && !isSaving
                  ? 'bg-[#3d6cf0] hover:bg-[#3460d8]'
                  : 'bg-slate-200 cursor-not-allowed'
              )}>
              {isSaving
                ? <Loader2 className="animate-spin" size={16} />
                : <>FINALIZAR INSPEÇÃO{acoes.length > 0 ? ` (${acoes.length} ação)` : ''}</>
              }
            </button>
          )}
        </div>
      </div>

      {/* ── Modal de sucesso ── */}
      {successModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-6">
          <div className="bg-white p-10 rounded-3xl text-center shadow-2xl max-w-sm scale-in">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: statusBg }}>
              {statusFinal === 'APROVADO'
                ? <CheckCircle size={48} className="text-emerald-500" />
                : statusFinal === 'ATENCAO'
                ? <AlertTriangle size={48} className="text-amber-500" />
                : <XCircle size={48} className="text-red-500" />}
            </div>
            <h3 className="font-black text-xl text-slate-800 mb-1">Inspeção Registrada!</h3>
            <p className="font-black text-xs mb-2 uppercase tracking-widest" style={{ color: statusColor }}>{statusFinal}</p>
            <p className="text-slate-500 text-sm mb-1">{ponto?.nome}</p>
            {acoes.length > 0 && (
              <p className="text-[11px] font-bold text-[#3d6cf0] mb-1">{acoes.length} ação(ões) corretiva(s) registrada(s)</p>
            )}
            <p className="text-slate-400 text-xs font-mono mb-8">#{inspecaoId.slice(-12).toUpperCase()}</p>
            <div className="flex gap-3">
              <button onClick={() => router.push('/inspecao/lista')}
                className="flex-1 py-3 bg-white border-2 border-[#e3e8ef] text-slate-600 rounded-2xl font-black text-xs">
                VER LISTA
              </button>
              <button onClick={() => window.location.reload()}
                className="flex-1 py-3 bg-[#3d6cf0] text-white rounded-2xl font-black text-xs">
                NOVA
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function InspecaoPage() {
  return (
    <DashboardLayout navItems={navItems} title="Executar Inspeção">
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeUp    { from{opacity:0;transform:translateY(6px);}to{opacity:1;transform:none;} }
        .fade-up             { animation: fadeUp 0.2s ease forwards; }
        @keyframes scaleIn   { from{opacity:0;transform:scale(.95);}to{opacity:1;transform:scale(1);} }
        .scale-in            { animation: scaleIn 0.15s ease forwards; }
        @keyframes slideDown { from{opacity:0;transform:translateY(-8px);}to{opacity:1;transform:none;} }
        .slide-down          { animation: slideDown 0.2s ease forwards; }
        @keyframes scanLine  { 0%{top:8px;opacity:1;} 50%{opacity:.6;} 100%{top:calc(100% - 8px);opacity:1;} }
        .scan-line           { animation: scanLine 1.8s ease-in-out infinite alternate; }
      `}} />
      <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh]"><Loader2 size={36} className="animate-spin text-[#3d6cf0]" /></div>}>
        <InspecaoInner />
      </Suspense>
    </DashboardLayout>
  )
}