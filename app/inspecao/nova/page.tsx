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
  Zap, Bell, Wind, Camera,
} from 'lucide-react'

const QrScanner = dynamic(
  () => import('@/components/inspecao/QrScanner').then(m => m.QrScanner),
  { ssr: false }
)

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

interface OpcaoResp {
  val:    RespVal
  label:  string
  color:  string
  bg:     string
  border: string
  icon:   React.ElementType
}

const OPCOES_RESP: OpcaoResp[] = [
  { val: 'sim', label: 'SIM', color: '#059669', bg: '#ecfdf5', border: '#a7f3d0', icon: CheckCircle2  },
  { val: 'nao', label: 'NÃO', color: '#dc2626', bg: '#fef2f2', border: '#fecaca', icon: XCircle       },
  { val: 'na',  label: 'N/A', color: '#6b7280', bg: '#f9fafb', border: '#e5e7eb', icon: AlertTriangle },
]

type StepKey = 'qrcode' | 'confirmacao' | 'checklist'

// ─────────────────────────────────────────────────────────────────────────────
function InspecaoInner() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const { capture: captureGeo } = useGeolocation()

  const pontoIdParam = searchParams.get('pontoId') ?? ''

  const [mounted,      setMounted]      = useState(false)
  const [step,         setStep]         = useState<StepKey>(pontoIdParam ? 'confirmacao' : 'qrcode')
  const [loadingQr,    setLoadingQr]    = useState(false)
  const [isSaving,     setIsSaving]     = useState(false)
  const [successModal, setSuccessModal] = useState(false)
  const [inspecaoId,   setInspecaoId]   = useState('')
  const [erroQr,       setErroQr]       = useState('')

  const [ponto,    setPonto]    = useState<any | null>(null)
  const [pontoId,  setPontoId]  = useState(pontoIdParam)
  const [qrInput,  setQrInput]  = useState('')

  const [sugestoes,     setSugestoes]     = useState<any[]>([])
  const [loadingSug,    setLoadingSug]    = useState(false)
  const [showSugestoes, setShowSugestoes] = useState(false)
  const inputRef      = useRef<HTMLInputElement>(null)
  const sugestoesRef  = useRef<HTMLDivElement>(null)
  const debounceRef   = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [cameraAberta,     setCameraAberta]     = useState(false)
  const [usarCameraNativa, setUsarCameraNativa] = useState(false)
  const videoRef        = useRef<HTMLVideoElement>(null)
  const canvasRef       = useRef<HTMLCanvasElement>(null)
  const streamRef       = useRef<MediaStream | null>(null)
  const scanIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const [respostas,   setRespostas]   = useState<Record<string, Resp>>({})
  const [observacoes, setObs]         = useState('')
  const [statusFinal, setStatusFinal] = useState<'APROVADO' | 'REPROVADO' | 'ATENCAO'>('APROVADO')

  useEffect(() => { setMounted(true) }, [])

  const buscarPontoPorId = useCallback(async (id: string) => {
    setLoadingQr(true)
    setErroQr('')
    try {
      const token = (session as any)?.access_token || (session as any)?.accessToken
      const res = await fetch(`http://localhost:3001/pontos/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setPonto(data)
      setPontoId(data.id)
      setStep('confirmacao')
    } catch {
      setErroQr('Ponto não encontrado.')
    } finally {
      setLoadingQr(false)
    }
  }, [session])

  useEffect(() => {
    if (pontoIdParam && session) buscarPontoPorId(pontoIdParam)
  }, [pontoIdParam, session, buscarPontoPorId])

  const buscarPontoPorQr = useCallback(async (val: string) => {
    if (!val || loadingQr) return
    setShowSugestoes(false)
    setLoadingQr(true)
    setErroQr('')
    try {
      const token = (session as any)?.access_token || (session as any)?.accessToken
      const res = await fetch(`http://localhost:3001/pontos/qrcode/${encodeURIComponent(val.trim())}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setPonto(data)
      setPontoId(data.id)
      captureGeo()
      setStep('confirmacao')
    } catch {
      setErroQr('QR Code inválido ou Ponto de Instalação não cadastrado.')
    } finally {
      setLoadingQr(false)
    }
  }, [session, captureGeo, loadingQr])

  const handleScan = useCallback((val: string) => {
    buscarPontoPorQr(val)
  }, [buscarPontoPorQr])

  const buscarSugestoes = useCallback(async (termo: string) => {
    if (termo.length < 2) { setSugestoes([]); setShowSugestoes(false); return }
    setLoadingSug(true)
    try {
      const token = (session as any)?.access_token || (session as any)?.accessToken
      const res = await fetch('http://localhost:3001/pontos', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error()
      const data: any[] = await res.json()
      const lista = Array.isArray(data) ? data : (data?.data ?? [])
      const t = termo.toLowerCase()
      const filtrado = lista
        .filter(p => p.qrCode?.toLowerCase().includes(t) || p.nome?.toLowerCase().includes(t))
        .slice(0, 6)
      setSugestoes(filtrado)
      setShowSugestoes(filtrado.length > 0)
    } catch {
      setSugestoes([])
    } finally {
      setLoadingSug(false)
    }
  }, [session])

  const handleQrInputChange = (val: string) => {
    setQrInput(val.toUpperCase())
    setErroQr('')
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => buscarSugestoes(val), 300)
  }

  const selecionarSugestao = (s: any) => {
    setQrInput(s.qrCode)
    setShowSugestoes(false)
    setSugestoes([])
    setPonto(s)
    setPontoId(s.id)
    captureGeo()
    setStep('confirmacao')
  }

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        !inputRef.current?.contains(e.target as Node) &&
        !sugestoesRef.current?.contains(e.target as Node)
      ) setShowSugestoes(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const abrirCameraNativa = async () => {
    setErroQr('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      streamRef.current = stream
      setCameraAberta(true)
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play()
          iniciarScanNativo()
        }
      }, 200)
    } catch {
      setErroQr('Não foi possível acessar a câmera. Verifique as permissões.')
    }
  }

  const fecharCameraNativa = () => {
    if (scanIntervalRef.current) clearInterval(scanIntervalRef.current)
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    setCameraAberta(false)
  }

  const iniciarScanNativo = () => {
    import('jsqr').then(({ default: jsQR }) => {
      scanIntervalRef.current = setInterval(() => {
        const video  = videoRef.current
        const canvas = canvasRef.current
        if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        canvas.width  = video.videoWidth
        canvas.height = video.videoHeight
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const code = jsQR(imageData.data, imageData.width, imageData.height)
        if (code?.data) {
          fecharCameraNativa()
          buscarPontoPorQr(code.data)
        }
      }, 300)
    }).catch(() => {
      setErroQr('jsQR não disponível. Instale com: npm install jsqr')
      fecharCameraNativa()
    })
  }

  useEffect(() => {
    return () => {
      fecharCameraNativa()
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const checklist = useMemo(() => {
    if (!ponto?.equipamentoAtual) return CHECKLIST_PADRAO['default']
    return CHECKLIST_PADRAO[ponto.equipamentoAtual.tipo] ?? CHECKLIST_PADRAO['default']
  }, [ponto])

  const iniciarChecklist = () => {
    const inicial: Record<string, Resp> = {}
    checklist.forEach(c => { inicial[c.id] = null })
    setRespostas(inicial)
    setStatusFinal('APROVADO')
    setObs('')
    setStep('checklist')
  }

  const setResp = (id: string, val: RespVal) => {
    setRespostas(prev => {
      const novo = { ...prev, [id]: val }
      const qtdNao = Object.values(novo).filter(v => v === 'nao').length
      if (qtdNao >= 3)      setStatusFinal('REPROVADO')
      else if (qtdNao >= 1) setStatusFinal('ATENCAO')
      else                  setStatusFinal('APROVADO')
      return novo
    })
  }

  const totalRespondidas       = Object.values(respostas).filter(v => v !== null).length
  const totalPerguntas         = checklist.length
  const progresso              = totalPerguntas > 0 ? Math.round((totalRespondidas / totalPerguntas) * 100) : 0
  const podeFinalizarChecklist = totalRespondidas === totalPerguntas && totalPerguntas > 0

  const handleSalvar = async () => {
    if (isSaving || !podeFinalizarChecklist) return
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
      }

      const res = await fetch('http://localhost:3001/inspecoes', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify(payload),
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

  // ── Helpers de estilo (igual ao cadastro de equipamentos) ─────────────────
  const tipoCfg  = ponto?.equipamentoAtual
    ? (TIPO_CONFIG[ponto.equipamentoAtual.tipo] ?? TIPO_CONFIG['Extintor'])
    : null
  const TipoIcon = tipoCfg?.icon ?? Package

  const statusColor =
    statusFinal === 'APROVADO' ? '#059669' :
    statusFinal === 'ATENCAO'  ? '#d97706' : '#dc2626'
  const statusBg =
    statusFinal === 'APROVADO' ? '#ecfdf5' :
    statusFinal === 'ATENCAO'  ? '#fffbeb' : '#fef2f2'

  // Shared style tokens — mesmo padrão do cadastro de equipamentos
  const inp  = 'w-full bg-[#f8fafc] border border-[#e3e8ef] rounded-lg h-10 px-3 text-[13.5px] outline-none focus:border-[#3d6cf0] transition-all'
  const sec  = 'text-[11px] font-bold uppercase tracking-widest text-[#9ca3af] px-6 py-3 bg-[#f8fafc] border-b border-[#e3e8ef]'
  const lbl  = 'text-[13.5px] font-medium text-[#111827]'
  const lbl2 = 'text-[11px] text-slate-400 mt-0.5'
  const row  = 'grid gap-4 items-start py-4 grid-cols-1 sm:grid-cols-[220px_1fr]'
  const divi = 'divide-y divide-[#f1f5f9]'

  if (!mounted) return null

  return (
    <div className="w-full flex flex-col bg-[#f4f6f9] min-h-[calc(100vh-60px)]">

      {/* Breadcrumb */}
      <div className="bg-white border-b border-[#e3e8ef] px-7 py-3 flex items-center gap-2 text-[13px] text-[#9ca3af]">
        <button
          onClick={() => router.push('/inspecao/lista')}
          className="hover:text-[#3d6cf0] transition-colors flex items-center gap-1.5 font-medium"
        >
          <ArrowLeft size={14} /> Inspeções
        </button>
        <span className="text-[11px]">›</span>
        <span className="text-[#3d6cf0] font-bold">
          {step === 'qrcode' ? 'Nova Vistoria' : step === 'confirmacao' ? 'Confirmar Ponto' : 'Checklist'}
        </span>
      </div>

      {/* Conteúdo scrollável */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-8 pt-6 pb-28">

        {/* ══ STEP 1 — LEITURA QR ══ */}
        {step === 'qrcode' && (
          <div className="max-w-md mx-auto space-y-4 animate-in fade-in slide-in-from-bottom-4">

            {/* Modal câmera nativa */}
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
                <button
                  onClick={fecharCameraNativa}
                  className="mt-6 flex items-center gap-2 px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-bold transition-all"
                >
                  <X size={16} /> Cancelar
                </button>
              </div>
            )}

            <div className="bg-white border border-[#e3e8ef] rounded-2xl shadow-sm overflow-hidden p-6 text-center">
              <QrCode size={40} className="mx-auto text-blue-500 mb-4" />
              <h2 className="text-lg font-black text-slate-800">Escaneie o Ponto</h2>
              <p className="text-sm text-slate-500 mb-6">
                Aponte a câmera para o QR Code fixado no local de instalação.
              </p>

              {/* Câmera principal */}
              {!usarCameraNativa && (
                <div className="aspect-square bg-slate-900 rounded-2xl overflow-hidden relative mb-6">
                  {loadingQr ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 z-20">
                      <Loader2 className="animate-spin text-white" size={40} />
                    </div>
                  ) : (
                    <QrScanner onScan={handleScan} />
                  )}
                </div>
              )}

              {/* Busca manual com autocomplete */}
              {/* CORREÇÃO: isolate + z-index no container para o dropdown flutuar acima de tudo */}
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
                      placeholder="Código ou nome do local..."
                      autoComplete="off"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center">
                      {loadingSug
                        ? <Loader2 size={14} className="animate-spin text-slate-400" />
                        : qrInput
                        ? (
                          <button
                            onClick={() => { setQrInput(''); setSugestoes([]); setShowSugestoes(false); setErroQr(''); inputRef.current?.focus() }}
                            className="text-slate-400 hover:text-slate-600 transition-colors"
                          >
                            <X size={14} />
                          </button>
                        ) : null
                      }
                    </div>

                    {/* ── Dropdown de sugestões ── 
                        CORREÇÃO: z-[9999] garante que fica acima do card pai (overflow:hidden removido do card pai)
                    */}
                    {showSugestoes && sugestoes.length > 0 && (
                      <div
                        ref={sugestoesRef}
                        className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#e3e8ef] rounded-xl shadow-2xl text-left"
                        style={{ zIndex: 9999 }}
                      >
                        {sugestoes.map(s => {
                          const qrCode = s.qrCode as string
                          const t      = qrInput.toLowerCase()
                          const idx    = qrCode.toLowerCase().indexOf(t)
                          return (
                            <button
                              key={s.id}
                              onMouseDown={e => { e.preventDefault(); selecionarSugestao(s) }}
                              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#f8fafc] transition-colors text-left border-b border-[#f1f5f9] last:border-0"
                            >
                              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                                <QrCode size={14} className="text-[#3d6cf0]" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[12px] font-mono font-bold text-slate-700 leading-tight">
                                  {idx >= 0 ? (
                                    <>
                                      {qrCode.slice(0, idx)}
                                      <mark className="bg-yellow-200 text-yellow-900 rounded px-0.5">
                                        {qrCode.slice(idx, idx + qrInput.length)}
                                      </mark>
                                      {qrCode.slice(idx + qrInput.length)}
                                    </>
                                  ) : qrCode}
                                </p>
                                <p className="text-[11px] text-slate-500 truncate mt-0.5">{s.nome}</p>
                                <p className="text-[10px] text-slate-400">
                                  {[s.base, s.regional, s.uf].filter(Boolean).join(' · ')}
                                </p>
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

                  {/* Botão câmera nativa */}
                  <button
                    onClick={() => { setUsarCameraNativa(true); abrirCameraNativa() }}
                    title="Câmera nativa (fallback)"
                    className="h-10 px-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-all flex items-center gap-1.5 text-xs font-bold flex-shrink-0"
                  >
                    <Camera size={16} />
                    <span className="hidden sm:inline">CAM</span>
                  </button>

                  <button
                    onClick={() => buscarPontoPorQr(qrInput)}
                    disabled={!qrInput.trim() || loadingQr}
                    className={cn(
                      'h-10 px-4 rounded-lg text-sm font-black text-white transition-all flex items-center gap-2 flex-shrink-0',
                      qrInput.trim() && !loadingQr
                        ? 'bg-[#3d6cf0] hover:bg-[#3460d8]'
                        : 'bg-slate-200 cursor-not-allowed'
                    )}
                  >
                    {loadingQr ? <Loader2 size={16} className="animate-spin" /> : 'OK'}
                  </button>
                </div>

                {erroQr && (
                  <p className="text-[12px] text-red-500 font-medium flex items-center gap-1">
                    <AlertCircle size={12} /> {erroQr}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ══ STEP 2 — CONFIRMAR PONTO ══ */}
        {step === 'confirmacao' && (
          <div className="max-w-xl mx-auto space-y-4 animate-in fade-in">
            {loadingQr || !ponto ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 size={36} className="animate-spin text-[#3d6cf0]" />
              </div>
            ) : (
              <>
                {/* Card do ponto */}
                <div className="bg-white border border-[#e3e8ef] rounded-2xl shadow-sm overflow-hidden">
                  <div className={sec}>Ponto Identificado</div>
                  <div className="px-6 py-5 flex items-start gap-4">
                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0 border border-blue-100">
                      <MapPin size={22} className="text-[#3d6cf0]" />
                    </div>
                    <div className="flex-1">
                      <p className="font-black text-[#111827] text-lg leading-tight">{ponto.nome}</p>
                      <p className="text-[12px] text-slate-400 mt-0.5 font-mono">{ponto.qrCode}</p>
                      <p className="text-[12px] text-slate-500 mt-1">
                        {[ponto.base, ponto.regional, ponto.uf].filter(Boolean).join(' · ')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Card do equipamento */}
                {ponto.equipamentoAtual ? (
                  <div
                    className="bg-white border-2 rounded-2xl shadow-sm overflow-hidden"
                    style={{ borderColor: tipoCfg?.border ?? '#e3e8ef' }}
                  >
                    <div
                      className="px-6 py-3 border-b flex items-center gap-2"
                      style={{ background: tipoCfg?.bg ?? '#f8fafc', borderColor: tipoCfg?.border ?? '#e3e8ef' }}
                    >
                      <TipoIcon size={14} style={{ color: tipoCfg?.color }} />
                      <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: tipoCfg?.color }}>
                        Equipamento Vinculado
                      </span>
                    </div>
                    <div className="px-6 py-5 flex items-center gap-4">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center border flex-shrink-0"
                        style={{ background: tipoCfg?.bg, borderColor: tipoCfg?.border }}
                      >
                        <TipoIcon size={22} style={{ color: tipoCfg?.color }} />
                      </div>
                      <div>
                        <p className="font-black text-[#111827]">
                          {ponto.equipamentoAtual.nome || ponto.equipamentoAtual.tipo}
                        </p>
                        <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                          {ponto.equipamentoAtual.codigo}
                        </p>
                        {ponto.equipamentoAtual.extintorClasse && (
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {ponto.equipamentoAtual.extintorClasse}
                            {ponto.equipamentoAtual.extintorCarga ? ` · ${ponto.equipamentoAtual.extintorCarga}kg` : ''}
                            {ponto.equipamentoAtual.agente ? ` · ${ponto.equipamentoAtual.agente}` : ''}
                          </p>
                        )}
                        <p className="text-[10px] font-black bg-slate-100 px-2 py-0.5 rounded text-slate-500 mt-1 inline-block">
                          {ponto.equipamentoAtual.tipo}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-3">
                    <AlertCircle size={20} className="text-amber-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-bold text-amber-800 text-sm">Sem equipamento vinculado</p>
                      <p className="text-[12px] text-amber-700 mt-0.5">
                        Este ponto não possui equipamento. Vincule um antes de realizar a inspeção.
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => { setPonto(null); setStep('qrcode') }}
                    className="flex-1 py-3 border-2 border-[#e3e8ef] rounded-xl text-sm font-bold text-slate-500"
                  >
                    VOLTAR
                  </button>
                  <button
                    onClick={iniciarChecklist}
                    disabled={!ponto.equipamentoAtual}
                    className={cn(
                      'flex-1 py-3 rounded-xl text-sm font-black text-white transition-all flex items-center justify-center gap-2',
                      ponto.equipamentoAtual ? 'bg-[#3d6cf0] hover:bg-[#3460d8]' : 'bg-slate-200 cursor-not-allowed'
                    )}
                  >
                    <ClipboardList size={16} /> INICIAR CHECKLIST
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* ══ STEP 3 — CHECKLIST (padrão visual do cadastro de equipamentos) ══ */}
        {step === 'checklist' && ponto && (
          <div className="max-w-2xl mx-auto space-y-4 animate-in fade-in">

            {/* Barra de progresso — mesmo estilo dos cards de topo do cadastro */}
            <div className="bg-white border border-[#e3e8ef] rounded-xl shadow-sm overflow-hidden">
              <div className={sec}>Progresso da Inspeção</div>
              <div className="px-6 py-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[12px] font-bold text-slate-500">
                    {ponto.nome} · {ponto.equipamentoAtual?.tipo}
                  </span>
                  <span className="text-[12px] font-black text-[#3d6cf0]">{totalRespondidas}/{totalPerguntas}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300 bg-[#3d6cf0]"
                    style={{ width: `${progresso}%` }}
                  />
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <span
                    className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: statusBg, color: statusColor }}
                  >
                    {statusFinal === 'APROVADO' ? '✓ Aprovado'
                      : statusFinal === 'ATENCAO' ? '⚠ Atenção'
                      : '✗ Reprovado'}
                  </span>
                  <span className="text-[11px] text-slate-400">{progresso}% concluído</span>
                </div>
              </div>
            </div>

            {/* Perguntas — mesmo padrão de linhas label + controle do cadastro */}
            <div className="bg-white border border-[#e3e8ef] rounded-xl shadow-sm overflow-hidden">
              <div className={sec}>Checklist — {checklist.length} itens</div>
              <div className={cn('px-6', divi)}>
                {checklist.map((item, idx) => {
                  const resp = respostas[item.id]
                  return (
                    <div key={item.id} className={row}>
                      {/* Coluna esquerda: número + pergunta */}
                      <div className="flex items-start gap-2.5">
                        <span className="text-[11px] font-black text-slate-300 mt-0.5 w-5 flex-shrink-0 tabular-nums">
                          {String(idx + 1).padStart(2, '0')}
                        </span>
                        <div>
                          <p className={lbl}>{item.pergunta}</p>
                          {resp === 'nao' && (
                            <p className={cn(lbl2, 'text-red-400')}>Não conforme — registre nas observações</p>
                          )}
                          {resp === 'na' && (
                            <p className={cn(lbl2, 'text-slate-400')}>Item não aplicável</p>
                          )}
                          {resp === 'sim' && (
                            <p className={cn(lbl2, 'text-emerald-500')}>Conforme</p>
                          )}
                        </div>
                      </div>

                      {/* Coluna direita: botões de resposta */}
                      <div className="flex gap-2 flex-wrap ml-7 sm:ml-0">
                        {OPCOES_RESP.map(opt => {
                          const sel  = resp === opt.val
                          const Icon = opt.icon
                          return (
                            <button
                              key={opt.val}
                              onClick={() => setResp(item.id, opt.val)}
                              className={cn(
                                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all',
                                sel ? 'shadow-sm' : 'opacity-50 hover:opacity-80'
                              )}
                              style={
                                sel
                                  ? { background: opt.bg, borderColor: opt.border, color: opt.color }
                                  : { background: '#f8fafc', borderColor: '#e3e8ef', color: '#9ca3af' }
                              }
                            >
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

            {/* Observações — mesmo padrão de card do cadastro */}
            <div className="bg-white border border-[#e3e8ef] rounded-xl shadow-sm overflow-hidden">
              <div className={sec}>Observações (Opcional)</div>
              <div className={cn('px-6', divi)}>
                <div className={row}>
                  <div>
                    <p className={lbl}>Anotações adicionais</p>
                    <p className={lbl2}>Anomalias, não conformidades ou descrições</p>
                  </div>
                  <textarea
                    value={observacoes}
                    onChange={e => setObs(e.target.value)}
                    rows={3}
                    className={cn(inp, 'h-auto py-2.5 resize-none leading-relaxed')}
                    placeholder="Registre anomalias, observações adicionais ou descrição da não conformidade..."
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Barra inferior fixa (checklist) — mesmo padrão do cadastro ── */}
      {step === 'checklist' && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t px-8 py-4 flex items-center justify-between z-50 shadow-lg">
          <div className="hidden md:flex items-center gap-4">
            <div className="flex gap-1.5">
              {[...Array(totalPerguntas)].map((_, i) => {
                const val = Object.values(respostas)[i]
                return (
                  <div
                    key={i}
                    className={cn('h-1.5 w-3 rounded-full transition-all', 
                      val === 'sim' ? 'bg-emerald-400' :
                      val === 'nao' ? 'bg-red-400' :
                      val === 'na'  ? 'bg-slate-300' : 'bg-slate-100'
                    )}
                  />
                )
              })}
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              {totalRespondidas}/{totalPerguntas} respondidas
            </span>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <button
              onClick={() => setStep('confirmacao')}
              className="flex-1 md:flex-none px-6 py-2 border-2 rounded-xl text-xs font-bold text-slate-500"
            >
              VOLTAR
            </button>
            <button
              disabled={!podeFinalizarChecklist || isSaving}
              onClick={handleSalvar}
              className={cn(
                'flex-1 md:flex-none px-8 py-2 rounded-xl text-xs font-black text-white transition-all flex items-center justify-center gap-2',
                podeFinalizarChecklist && !isSaving ? 'bg-[#3d6cf0]' : 'bg-slate-200 cursor-not-allowed'
              )}
            >
              {isSaving ? <Loader2 className="animate-spin" size={16} /> : 'FINALIZAR INSPEÇÃO'}
            </button>
          </div>
        </div>
      )}

      {/* ── Modal Sucesso ── */}
      {successModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-6">
          <div className="bg-white p-10 rounded-3xl text-center shadow-2xl max-w-sm scale-in">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
              style={{ background: statusBg }}
            >
              {statusFinal === 'APROVADO' ? (
                <CheckCircle size={48} className="text-emerald-500" />
              ) : statusFinal === 'ATENCAO' ? (
                <AlertTriangle size={48} className="text-amber-500" />
              ) : (
                <XCircle size={48} className="text-red-500" />
              )}
            </div>
            <h3 className="font-black text-xl text-slate-800 mb-1">Inspeção Registrada!</h3>
            <p className="font-black text-xs mb-2 uppercase tracking-widest" style={{ color: statusColor }}>
              {statusFinal}
            </p>
            <p className="text-slate-500 text-sm mb-2">{ponto?.nome}</p>
            <p className="text-slate-400 text-xs font-mono mb-8">
              #{inspecaoId.slice(-12).toUpperCase()}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => router.push('/inspecao/lista')}
                className="flex-1 py-3 bg-white border-2 border-[#e3e8ef] text-slate-600 rounded-2xl font-black text-xs"
              >
                VER LISTA
              </button>
              <button
                onClick={() => window.location.reload()}
                className="flex-1 py-3 bg-[#3d6cf0] text-white rounded-2xl font-black text-xs"
              >
                NOVA
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Page wrapper ──────────────────────────────────────────────────────────────
export default function InspecaoPage() {
  return (
    <DashboardLayout title="Executar Inspeção">
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeUp  { from{opacity:0;transform:translateY(6px);}to{opacity:1;transform:none;} }
        .fade-up   { animation: fadeUp 0.2s ease forwards; }
        @keyframes scaleIn { from{opacity:0;transform:scale(.95);}to{opacity:1;transform:scale(1);} }
        .scale-in  { animation: scaleIn 0.15s ease forwards; }
        @keyframes scanLine { 0%{top:8px;opacity:1;} 50%{opacity:.6;} 100%{top:calc(100% - 8px);opacity:1;} }
        .scan-line { animation: scanLine 1.8s ease-in-out infinite alternate; }
      `}} />
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-[60vh]">
            <Loader2 size={36} className="animate-spin text-[#3d6cf0]" />
          </div>
        }
      >
        <InspecaoInner />
      </Suspense>
    </DashboardLayout>
  )
}