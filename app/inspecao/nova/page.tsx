'use client'

import { useState, useCallback, useRef, useMemo, useEffect } from 'react'
import dynamic from 'next/dynamic'

import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { mockEquipamentos, mockChecklistTemplates } from '@/lib/mock-data'
import { useGeolocation } from '@/hooks/useGeolocation'
import { gerarCodigoInspecao, cn } from '@/lib/utils'
import { Html5Qrcode } from 'html5-qrcode'

import {
  CheckCircle, Search, AlertCircle, ShieldCheck,
  Wrench, Image as ImageIcon, ArrowLeft, CheckCircle2,
  XCircle, MinusCircle, Loader2, QrCode, X, Keyboard,
} from 'lucide-react'
import type { Equipamento, RespostaChecklist } from '@/types'

const QrScanner = dynamic(
  () => import('@/components/inspecao/QrScanner').then(m => m.QrScanner),
  { ssr: false }
)

type OpcaoResposta = 'ok' | 'nao_conforme' | 'na'

type AcaoCorretiva = {
  status: 'a_atribuir' | 'a_iniciar' | 'em_andamento' | 'cancelado' | 'concluido' | ''
  dataVencimento: string
  titulo: string
  descricao: string
  numNaoConformidade: string
  empresaResponsavel: string
  nomeResponsavel: string
  emailsCopia: string
}

const STATUS_OPTIONS: { value: AcaoCorretiva['status']; label: string; color: string }[] = [
  { value: 'a_atribuir',   label: 'A Atribuir',   color: '#6b7a90' },
  { value: 'a_iniciar',    label: 'A Iniciar',     color: '#3b82f6' },
  { value: 'em_andamento', label: 'Em Andamento',  color: '#f59e0b' },
  { value: 'cancelado',    label: 'Cancelado',     color: '#ef4444' },
  { value: 'concluido',    label: 'Concluído',     color: '#10b981' },
]

// Todas as tabs sempre visíveis — QR Code é a primeira etapa
const TABS = [
  { key: 'qrcode',    label: 'QR Code',        icon: QrCode      },
  { key: 'checklist', label: 'Inspeção',        icon: ShieldCheck },
  { key: 'acao',      label: 'Ação Corretiva',  icon: Wrench      },
] as const

type TabKey = typeof TABS[number]['key']

export default function InspecaoPage() {
  const [mounted, setMounted]                   = useState(false)
  const [tab, setTab]                           = useState<TabKey>('qrcode')
  const [equipamentoPonto, setEquipamentoPonto] = useState<Equipamento | null>(null)
  const [serieBusca, setSerieBusca]             = useState('')
  const [showSuggestions, setShowSuggestions]   = useState(false)
  const [respostas, setRespostas]               = useState<RespostaChecklist[]>([])
  const [successModal, setSuccessModal]         = useState(false)
  const [codigoGerado, setCodigoGerado]         = useState('')
  const [scanKey, setScanKey]                   = useState(0)
  const [isSaving, setIsSaving]                 = useState(false)
  const [idManual, setIdManual]                 = useState('')
  const [idManualError, setIdManualError]       = useState('')

  const [acao, setAcao] = useState<AcaoCorretiva>({
    status: '', dataVencimento: '', titulo: '', descricao: '',
    numNaoConformidade: '', empresaResponsavel: '', nomeResponsavel: '', emailsCopia: '',
  })

  const { capture: captureGeo, loading: geoLoading } = useGeolocation()
  const scanFinishedRef = useRef(false)
  const fileInputRef    = useRef<HTMLInputElement>(null)

  useEffect(() => { setMounted(true) }, [])

  // ── Leitura do QR Code ──
  const handleScan = useCallback((val: string) => {
    if (scanFinishedRef.current) return
    const found = mockEquipamentos.find(e =>
      e.uuid === val || e.codigo.toLowerCase() === val.toLowerCase()
    ) as Equipamento | undefined
    if (found) {
      scanFinishedRef.current = true
      setEquipamentoPonto(found)
      if (found.tipo.toLowerCase().includes('extintor'))
        setSerieBusca(found.numeroSerieCilindro || found.codigoGalao || '')
      captureGeo()
    }
  }, [captureGeo])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const containerId = 'qr-file-processor-page'
    let container = document.getElementById(containerId)
    if (!container) {
      container = document.createElement('div')
      container.id = containerId
      container.style.display = 'none'
      document.body.appendChild(container)
    }
    try {
      const html5QrCode = new Html5Qrcode(containerId)
      const result = await html5QrCode.scanFile(file, true)
      let finalCode = result
      try {
        const url = new URL(result)
        finalCode = url.searchParams.get('id') || result
      } catch { /* não é URL */ }
      handleScan(finalCode)
    } catch {
      alert('QR Code não detectado na imagem. Tente uma foto mais nítida.')
    }
    e.target.value = ''
  }

  // Limpa apenas o QR sem resetar o formulário
  const handleClearQr = () => {
    scanFinishedRef.current = false
    setEquipamentoPonto(null)
    setSerieBusca('')
    setIdManual('')
    setIdManualError('')
    setScanKey(k => k + 1)
  }

  // Reset completo para nova inspeção
  const handleReset = () => {
    handleClearQr()
    setRespostas([])
    setShowSuggestions(false)
    setSuccessModal(false)
    setTab('qrcode')
    setAcao({
      status: '', dataVencimento: '', titulo: '', descricao: '',
      numNaoConformidade: '', empresaResponsavel: '', nomeResponsavel: '', emailsCopia: '',
    })
  }

  const handleIdManualSubmit = () => {
    const val = idManual.trim()
    if (!val) return
    const found = mockEquipamentos.find(e =>
      e.uuid === val || e.codigo.toLowerCase() === val.toLowerCase()
    ) as Equipamento | undefined
    if (found) {
      scanFinishedRef.current = true
      setEquipamentoPonto(found)
      setIdManualError('')
      if (found.tipo.toLowerCase().includes('extintor'))
        setSerieBusca(found.numeroSerieCilindro || found.codigoGalao || '')
      captureGeo()
    } else {
      setIdManualError('Equipamento não encontrado. Verifique o ID informado.')
    }
  }

  const handleToggleResposta = (idItem: string, valor: string) => {
    setRespostas(prev => {
      const idx = prev.findIndex(r => r.idItem === idItem)
      const valorDisplay = valor === 'ok' ? 'OK' : valor === 'na' ? 'N/A' : valor === 'nao_conforme' ? 'NC' : valor
      const nova = { idItem, resposta: valor as any, valor: valorDisplay as any } as RespostaChecklist
      if (idx > -1) { const arr = [...prev]; arr[idx] = nova; return arr }
      return [...prev, nova]
    })
  }

  const template = useMemo(() => {
    if (!equipamentoPonto) return null
    return mockChecklistTemplates.find(t => t.tipoEquipamento === equipamentoPonto.tipo) || mockChecklistTemplates[0]
  }, [equipamentoPonto])

  const itensChecklist    = useMemo(() => template?.itens.filter(i => i.pergunta !== 'Teste Hidrostático') || [], [template])
  const itensNaoConformes  = useMemo(() => respostas.filter(r => (r.resposta as string) === 'nao_conforme'), [respostas])
  const temNaoConformidade = itensNaoConformes.length > 0
  const isExtintor        = useMemo(() => equipamentoPonto?.tipo.toLowerCase().includes('extintor'), [equipamentoPonto])

  const dadosCilindro = useMemo(() => {
    if (!serieBusca) return null
    return mockEquipamentos.find(e =>
      e.numeroSerieCilindro?.toLowerCase() === serieBusca.toLowerCase() ||
      e.codigoGalao?.toLowerCase() === serieBusca.toLowerCase()
    ) || null
  }, [serieBusca])

  const sugestoes = useMemo(() => {
    if (!serieBusca) return []
    return mockEquipamentos.filter(e =>
      e.tipo.toLowerCase().includes('extintor') &&
      (e.numeroSerieCilindro?.toLowerCase().includes(serieBusca.toLowerCase()) ||
       e.codigoGalao?.toLowerCase().includes(serieBusca.toLowerCase()))
    ).slice(0, 5)
  }, [serieBusca])

  const checklistOk = respostas.length >= (itensChecklist.length || 0) && (!isExtintor || !!dadosCilindro)
  const acaoOk      = acao.status !== '' && !!acao.dataVencimento && !!acao.titulo && !!acao.descricao && !!acao.empresaResponsavel && !!acao.nomeResponsavel

  const progressoPct = itensChecklist.length > 0
    ? Math.round((respostas.length / itensChecklist.length) * 100)
    : 0

  // Progresso das etapas (acao só entra se houver não conformidade)
  const tabOrder: TabKey[] = temNaoConformidade ? ['qrcode', 'checklist', 'acao'] : ['qrcode', 'checklist']
  const currentIdx = tabOrder.indexOf(tab) === -1 ? 0 : tabOrder.indexOf(tab)

  const tabValid: Record<TabKey, boolean> = {
    qrcode:    !!equipamentoPonto,
    checklist: checklistOk,
    acao:      acaoOk,
  }
  const completedCount = tabOrder.filter(k => tabValid[k]).length

  // ── Estilos compartilhados (idênticos à tela de medidas) ──
  const inputCls        = cn('w-full bg-[#f8fafc] border border-[#e3e8ef] rounded-lg h-10 px-3 text-[13.5px] outline-none focus:border-[#3d6cf0] transition-all')
  const sectionTitleCls = 'text-[11px] font-bold uppercase tracking-widest text-[#9ca3af] px-6 py-3 bg-[#f8fafc] border-b border-[#e3e8ef]'
  const labelCls        = 'text-[13.5px] font-medium text-[#111827]'

  if (!mounted) return null

  return (
    <DashboardLayout title="Executar Inspeção">
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes fadeUp { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
          .fade-up { animation: fadeUp 0.2s ease forwards; }
          @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
          .scale-in { animation: scaleIn 0.15s ease forwards; }
          @keyframes scanLine { 0% { top: 0; } 100% { top: 100%; } }
          .scan-line { animation: scanLine 1.8s ease-in-out infinite alternate; }
          .prog-bar { transition: width 0.5s cubic-bezier(.4,0,.2,1); }
        `
      }} />

      <div className="w-full flex flex-col bg-[#f4f6f9] min-h-[calc(100vh-60px)]">

        {/* ── Breadcrumb ── */}
        <div className="bg-white border-b border-[#e3e8ef] px-7 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[13px] text-[#9ca3af]">
            <button
              onClick={() => window.history.back()}
              className="hover:text-[#3d6cf0] transition-colors flex items-center gap-1.5 font-medium"
            >
              <ArrowLeft size={14} /> Inspeções
            </button>
            <span className="text-[11px]">›</span>
            <span className="text-[#3d6cf0] font-semibold">Nova Inspeção</span>
          </div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Etapa {currentIdx + 1} de {tabOrder.length}
          </span>
        </div>

        {/* ── Tab bar — todas sempre clicáveis ── */}
        <div className="bg-white border-b border-[#e3e8ef] px-7 flex overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                'flex items-center gap-2 px-5 py-4 text-[13.5px] border-b-[2.5px] whitespace-nowrap transition-all -mb-px',
                tab === t.key
                  ? 'text-[#3d6cf0] border-[#3d6cf0] font-semibold'
                  : 'text-[#9ca3af] border-transparent hover:text-[#374151]'
              )}
            >
              {t.label}
              {tabValid[t.key] && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              )}
            </button>
          ))}
        </div>

        {/* ── Conteúdo rolável ── */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-8 pt-6 pb-28">

          {/* ══ TAB QR CODE ══ */}
          {tab === 'qrcode' && (
            <div className="fade-up max-w-sm mx-auto space-y-4">

              <div className="bg-white border border-[#e3e8ef] rounded-xl shadow-sm overflow-hidden">
                <div className={sectionTitleCls}>Leitura de Campo</div>
                <div className="p-6 space-y-4">

                  {/* Badge: equipamento lido */}
                  {equipamentoPonto ? (
                    <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <CheckCircle size={16} className="text-emerald-500 flex-shrink-0" />
                        <div>
                          <p className="text-[13px] font-black text-emerald-800 uppercase">{equipamentoPonto.codigo}</p>
                          <p className="text-[11px] text-emerald-600">{equipamentoPonto.tipo}</p>
                        </div>
                      </div>
                      <button
                        onClick={handleClearQr}
                        title="Remover e reler"
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-emerald-400 hover:text-red-400 hover:bg-red-50 transition-all"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex justify-center">
                      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#f8fafc] border border-[#e3e8ef]">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                        <span className="text-[9px] font-bold text-[#9ca3af] uppercase tracking-widest">
                          Aguardando leitura
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Câmera — só quando não leu ainda */}
                  {!equipamentoPonto && (
                    <div className="relative rounded-xl overflow-hidden bg-[#07111f] shadow-lg">
                      <div className="aspect-square relative">
                        <div className="absolute inset-0 z-0">
                          <QrScanner key={scanKey} onScan={handleScan} />
                        </div>
                        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
                          <div className="w-44 h-44 relative">
                            <div className="absolute top-0 left-0 w-7 h-7 border-t-[3px] border-l-[3px] border-[#3d6cf0] rounded-tl-lg" />
                            <div className="absolute top-0 right-0 w-7 h-7 border-t-[3px] border-r-[3px] border-[#3d6cf0] rounded-tr-lg" />
                            <div className="absolute bottom-0 left-0 w-7 h-7 border-b-[3px] border-l-[3px] border-[#3d6cf0] rounded-bl-lg" />
                            <div className="absolute bottom-0 right-0 w-7 h-7 border-b-[3px] border-r-[3px] border-[#3d6cf0] rounded-br-lg" />
                            <div
                              className="scan-line absolute left-0 right-0 h-[2px] rounded-full"
                              style={{ background: 'rgba(61,108,240,0.7)', boxShadow: '0 0 12px rgba(61,108,240,0.8)' }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Upload de imagem */}
                  <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-10 bg-[#f8fafc] border border-[#e3e8ef] rounded-lg flex items-center gap-3 px-3 hover:border-[#3d6cf0] transition-all group"
                  >
                    <ImageIcon size={15} className="text-[#9ca3af] group-hover:text-[#3d6cf0] transition-colors flex-shrink-0" />
                    <span className="text-[13px] font-medium text-[#9ca3af] group-hover:text-[#3d6cf0] transition-colors">
                      Upload de imagem com QR Code
                    </span>
                  </button>

                  {/* Divisor */}
                  {!equipamentoPonto && (
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-px bg-[#e3e8ef]" />
                      <span className="text-[10px] font-bold text-[#c3cad4] uppercase tracking-widest">ou</span>
                      <div className="flex-1 h-px bg-[#e3e8ef]" />
                    </div>
                  )}

                  {/* Input manual de ID */}
                  {!equipamentoPonto && (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Keyboard size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" />
                          <input
                            type="text"
                            value={idManual}
                            onChange={e => { setIdManual(e.target.value); setIdManualError('') }}
                            onKeyDown={e => e.key === 'Enter' && handleIdManualSubmit()}
                            className={cn(
                              inputCls,
                              'pl-9',
                              idManualError ? 'border-red-300 focus:border-red-400' : ''
                            )}
                            placeholder="Digitar ID do equipamento..."
                          />
                        </div>
                        <button
                          onClick={handleIdManualSubmit}
                          disabled={!idManual.trim()}
                          className={cn(
                            'h-10 px-4 rounded-lg text-xs font-black text-white transition-all flex-shrink-0',
                            idManual.trim() ? 'bg-[#3d6cf0] hover:bg-[#3460d8]' : 'bg-slate-200 cursor-not-allowed'
                          )}
                        >
                          OK
                        </button>
                      </div>
                      {idManualError && (
                        <div className="flex items-center gap-2 p-2.5 bg-red-50 border border-red-100 rounded-lg">
                          <AlertCircle size={13} className="text-red-400 flex-shrink-0" />
                          <p className="text-[11px] text-red-600 font-medium">{idManualError}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Reler outro QR (quando já leu) */}
                  {equipamentoPonto && (
                    <button
                      onClick={handleClearQr}
                      className="w-full h-10 bg-[#f8fafc] border border-[#e3e8ef] rounded-lg flex items-center gap-3 px-3 hover:border-[#3d6cf0] transition-all group"
                    >
                      <QrCode size={15} className="text-[#9ca3af] group-hover:text-[#3d6cf0] transition-colors flex-shrink-0" />
                      <span className="text-[13px] font-medium text-[#9ca3af] group-hover:text-[#3d6cf0] transition-colors">
                        Ler outro QR Code
                      </span>
                    </button>
                  )}
                </div>
              </div>

              {/* Aviso de avanço sem QR */}
              {!equipamentoPonto && (
                <div className="flex items-start gap-2.5 p-3.5 bg-amber-50 border border-amber-200 rounded-lg">
                  <AlertCircle size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-[12px] text-amber-700 font-medium leading-relaxed">
                    Você pode avançar sem ler o QR Code, mas o equipamento não será vinculado automaticamente à inspeção.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ══ TAB CHECKLIST ══ */}
          {tab === 'checklist' && (
            <div className="fade-up space-y-4">

              {/* Info do equipamento */}
              <div className="bg-white border border-[#e3e8ef] rounded-xl shadow-sm overflow-hidden">
                <div className={sectionTitleCls}>Ponto de Instalação</div>
                <div className="px-6 py-4 flex items-center justify-between">
                  {equipamentoPonto ? (
                    <>
                      <div>
                        <p className="text-[18px] font-black text-[#111827] uppercase tracking-tight">
                          {equipamentoPonto.codigo}
                        </p>
                        <p className="text-[12px] text-[#9ca3af] mt-0.5">{equipamentoPonto.tipo}</p>
                      </div>
                      <button
                        onClick={() => setTab('qrcode')}
                        className="flex items-center gap-1.5 text-[11px] font-bold text-[#3d6cf0] hover:underline"
                      >
                        <QrCode size={13} /> Trocar
                      </button>
                    </>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center flex-shrink-0">
                        <AlertCircle size={16} className="text-amber-500" />
                      </div>
                      <div>
                        <p className="text-[13px] font-semibold text-[#374151]">Sem equipamento vinculado</p>
                        <button
                          onClick={() => setTab('qrcode')}
                          className="text-[11px] font-bold text-[#3d6cf0] hover:underline"
                        >
                          Ler QR Code →
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Barra de progresso */}
                {itensChecklist.length > 0 && (
                  <div className="px-6 pb-4 border-t border-[#e3e8ef] pt-4">
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-[#9ca3af] mb-1.5">
                      <span>Progresso</span>
                      <span>{respostas.length}/{itensChecklist.length} itens · {progressoPct}%</span>
                    </div>
                    <div className="h-1.5 bg-[#f0f4f9] rounded-full overflow-hidden">
                      <div
                        className="prog-bar h-full rounded-full"
                        style={{
                          width: `${progressoPct}%`,
                          background: progressoPct === 100 ? '#10b981' : 'linear-gradient(90deg,#3d6cf0,#60a5fa)',
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Busca cilindro extintor */}
              {isExtintor && (
                <div className="bg-white border border-[#e3e8ef] rounded-xl shadow-sm overflow-hidden">
                  <div className={sectionTitleCls}>Número de Série do Cilindro</div>
                  <div className="px-6 py-4 space-y-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" size={15} />
                      <input
                        type="text"
                        value={serieBusca}
                        onChange={e => { setSerieBusca(e.target.value); setShowSuggestions(true) }}
                        onFocus={() => setShowSuggestions(true)}
                        className={cn(inputCls, 'pl-9 uppercase')}
                        placeholder="Pesquisar cilindro..."
                      />
                      {showSuggestions && sugestoes.length > 0 && (
                        <>
                          <div className="fixed inset-0 z-30" onClick={() => setShowSuggestions(false)} />
                          <div className="absolute z-40 w-full mt-1 bg-white border border-[#e3e8ef] rounded-lg shadow-xl max-h-60 overflow-auto">
                            {sugestoes.map(s => (
                              <div
                                key={s.id}
                                className="p-3 hover:bg-blue-50 cursor-pointer text-xs border-b last:border-0"
                                onMouseDown={() => { setSerieBusca(s.numeroSerieCilindro || s.codigoGalao || ''); setShowSuggestions(false) }}
                              >
                                <p className="font-bold text-slate-700">{s.numeroSerieCilindro || s.codigoGalao}</p>
                                <p className="text-slate-400">{s.agente} · {s.carga}</p>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                    {serieBusca && (
                      dadosCilindro ? (
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { label: 'Carga',    value: dadosCilindro.carga,   ok: true },
                            { label: 'Agente',   value: dadosCilindro.agente,  ok: true },
                            { label: 'Validade', value: dadosCilindro.validadeRecarga || dadosCilindro.proximaInspecao, ok: dadosCilindro.status !== 'vencido' },
                          ].map(info => (
                            <div key={info.label} className="bg-[#f8fafc] border border-[#e3e8ef] rounded-lg p-3 text-center">
                              <p className="text-[9px] text-[#9ca3af] uppercase font-bold tracking-wider mb-1">{info.label}</p>
                              <p className={cn('text-[11px] font-black truncate', info.ok ? 'text-[#111827]' : 'text-red-500')}>
                                {info.value}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2.5 p-3 bg-red-50 border border-red-100 rounded-lg">
                          <AlertCircle size={14} className="text-red-500 flex-shrink-0" />
                          <p className="text-[12px] text-red-600 font-semibold">Cilindro não localizado no sistema</p>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* Itens do checklist */}
              <div className="bg-white border border-[#e3e8ef] rounded-xl shadow-sm overflow-hidden">
                <div className={sectionTitleCls}>Itens de Verificação</div>

                {itensChecklist.length === 0 ? (
                  <div className="px-6 py-10 text-center space-y-2">
                    <p className="text-[13px] text-[#9ca3af]">
                      {equipamentoPonto
                        ? 'Nenhum item de verificação para este equipamento.'
                        : 'Leia o QR Code para carregar os itens de verificação.'}
                    </p>
                    {!equipamentoPonto && (
                      <button
                        onClick={() => setTab('qrcode')}
                        className="text-[12px] font-bold text-[#3d6cf0] hover:underline"
                      >
                        Ir para leitura QR →
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="divide-y divide-[#f1f5f9]">
                    {itensChecklist.map((item, idx) => {
                      const r = respostas.find(res => res.idItem === item.id)
                      return (
                        <div
                          key={item.id}
                          className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-[#fafbff] transition-colors"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <span className="text-[10px] font-black text-[#d1d5db] w-5 flex-shrink-0 tabular-nums">
                              {String(idx + 1).padStart(2, '0')}
                            </span>
                            <p className="text-[13.5px] font-medium text-[#111827] leading-snug">{item.pergunta}</p>
                          </div>
                          <div className="flex gap-1.5 flex-shrink-0">
                            <button
                              onClick={() => handleToggleResposta(item.id, 'ok')}
                              className={cn(
                                'w-9 h-9 rounded-lg border-2 flex items-center justify-center transition-all',
                                (r?.resposta as string) === 'ok'
                                  ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm'
                                  : 'bg-white border-[#e3e8ef] text-[#d1d5db] hover:border-emerald-300 hover:text-emerald-500',
                              )}
                            >
                              <CheckCircle2 size={14} />
                            </button>
                            <button
                              onClick={() => handleToggleResposta(item.id, 'nao_conforme')}
                              className={cn(
                                'w-9 h-9 rounded-lg border-2 flex items-center justify-center transition-all',
                                (r?.resposta as string) === 'nao_conforme'
                                  ? 'bg-red-500 border-red-500 text-white shadow-sm'
                                  : 'bg-white border-[#e3e8ef] text-[#d1d5db] hover:border-red-300 hover:text-red-500',
                              )}
                            >
                              <XCircle size={14} />
                            </button>
                            <button
                              onClick={() => handleToggleResposta(item.id, 'na')}
                              className={cn(
                                'w-9 h-9 rounded-lg border-2 flex items-center justify-center transition-all',
                                (r?.resposta as string) === 'na'
                                  ? 'bg-slate-500 border-slate-500 text-white shadow-sm'
                                  : 'bg-white border-[#e3e8ef] text-[#d1d5db] hover:border-slate-300 hover:text-slate-500',
                              )}
                            >
                              <MinusCircle size={14} />
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {itensChecklist.length > 0 && (
                  <div className="px-6 py-3 bg-[#f8fafc] border-t border-[#e3e8ef] flex items-center gap-5">
                    {[
                      { icon: CheckCircle2, label: 'Conforme',      color: '#10b981' },
                      { icon: XCircle,      label: 'Não Conforme',  color: '#ef4444' },
                      { icon: MinusCircle,  label: 'Não Aplicável', color: '#64748b' },
                    ].map(({ icon: Icon, label, color }) => (
                      <div key={label} className="flex items-center gap-1.5">
                        <Icon size={11} style={{ color }} />
                        <span className="text-[10px] text-[#9ca3af] font-medium">{label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══ TAB AÇÃO CORRETIVA ══ */}
          {tab === 'acao' && (
            <div className="fade-up space-y-4">

              {/* Status */}
              <div className="bg-white border border-[#e3e8ef] rounded-xl shadow-sm overflow-hidden">
                <div className={sectionTitleCls}>Status da Ação *</div>
                <div className="p-4 space-y-1.5">
                  {STATUS_OPTIONS.map(opt => (
                    <div
                      key={opt.value}
                      onClick={() => setAcao(a => ({ ...a, status: opt.value }))}
                      className={cn(
                        'p-4 rounded-xl border cursor-pointer flex items-center justify-between transition-all',
                        acao.status === opt.value
                          ? 'border-[#3d6cf0] bg-blue-50/50'
                          : 'border-slate-50 hover:border-slate-100'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: opt.color }} />
                        <span className="text-sm font-semibold text-slate-700">{opt.label}</span>
                      </div>
                      {acao.status === opt.value && <CheckCircle size={16} className="text-[#3d6cf0]" />}
                    </div>
                  ))}
                </div>
              </div>

              {/* Detalhes */}
              <div className="bg-white border border-[#e3e8ef] rounded-xl shadow-sm overflow-hidden">
                <div className={sectionTitleCls}>Detalhes da Ação</div>
                <div className="divide-y divide-[#f1f5f9]">
                  <div className="grid gap-4 items-center px-6 py-4 grid-cols-1 sm:grid-cols-[200px_1fr]">
                    <span className={labelCls}>Data Limite *</span>
                    <input
                      type="date"
                      value={acao.dataVencimento}
                      onChange={e => setAcao(a => ({ ...a, dataVencimento: e.target.value }))}
                      className={cn(inputCls, 'max-w-[200px]')}
                    />
                  </div>
                  <div className="grid gap-4 items-center px-6 py-4 grid-cols-1 sm:grid-cols-[200px_1fr]">
                    <span className={labelCls}>Título da Ação *</span>
                    <input
                      type="text"
                      value={acao.titulo}
                      onChange={e => setAcao(a => ({ ...a, titulo: e.target.value }))}
                      className={inputCls}
                      placeholder="Ex: Troca de mangueira"
                    />
                  </div>
                  <div className="grid gap-4 items-start px-6 py-4 grid-cols-1 sm:grid-cols-[200px_1fr]">
                    <span className={cn(labelCls, 'mt-2')}>Descrição Detalhada *</span>
                    <textarea
                      value={acao.descricao}
                      onChange={e => setAcao(a => ({ ...a, descricao: e.target.value }))}
                      placeholder="Descreva o que deve ser feito..."
                      rows={4}
                      className={cn(inputCls, 'h-auto py-2.5 resize-none leading-relaxed')}
                    />
                  </div>
                </div>
              </div>

              {/* Responsável */}
              <div className="bg-white border border-[#e3e8ef] rounded-xl shadow-sm overflow-hidden">
                <div className={sectionTitleCls}>Responsável</div>
                <div className="divide-y divide-[#f1f5f9]">
                  <div className="grid gap-4 items-center px-6 py-4 grid-cols-1 sm:grid-cols-[200px_1fr]">
                    <span className={labelCls}>Não Conformidade</span>
                    <select
                      value={acao.numNaoConformidade}
                      onChange={e => setAcao(a => ({ ...a, numNaoConformidade: e.target.value }))}
                      className={inputCls}
                    >
                      <option value="">— Selecionar —</option>
                      {itensNaoConformes.map((nc, i) => (
                        <option key={nc.idItem} value={nc.idItem}>{i + 1} — {nc.idItem}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid gap-4 items-center px-6 py-4 grid-cols-1 sm:grid-cols-[200px_1fr]">
                    <span className={labelCls}>Empresa Responsável *</span>
                    <input
                      type="text"
                      value={acao.empresaResponsavel}
                      onChange={e => setAcao(a => ({ ...a, empresaResponsavel: e.target.value }))}
                      className={inputCls}
                      placeholder="Nome da empresa"
                    />
                  </div>
                  <div className="grid gap-4 items-center px-6 py-4 grid-cols-1 sm:grid-cols-[200px_1fr]">
                    <span className={labelCls}>Nome do Responsável *</span>
                    <input
                      type="text"
                      value={acao.nomeResponsavel}
                      onChange={e => setAcao(a => ({ ...a, nomeResponsavel: e.target.value }))}
                      className={inputCls}
                      placeholder="Nome do técnico/encarregado"
                    />
                  </div>
                  <div className="grid gap-4 items-center px-6 py-4 grid-cols-1 sm:grid-cols-[200px_1fr]">
                    <span className={labelCls}>Copiar E-mail(s)</span>
                    <input
                      type="text"
                      value={acao.emailsCopia}
                      onChange={e => setAcao(a => ({ ...a, emailsCopia: e.target.value }))}
                      className={inputCls}
                      placeholder="e-mails separados por vírgula"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Barra inferior fixa ── */}
        <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t px-8 py-4 flex items-center justify-between z-50">

          {/* Indicador de progresso */}
          <div className="hidden md:flex items-center gap-4">
            <div className="flex gap-1.5">
              {tabOrder.map((key) => (
                <div
                  key={key}
                  className={cn(
                    'h-1.5 w-6 rounded-full transition-all',
                    tabValid[key] ? 'bg-[#3d6cf0]' : 'bg-slate-200'
                  )}
                />
              ))}
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase">
              Etapas: {completedCount}/{tabOrder.length}
            </span>
          </div>

          <div className="flex gap-3 w-full md:w-auto">

            {/* Botão VOLTAR — não aparece na primeira tab */}
            {currentIdx > 0 && (
              <button
                onClick={() => setTab(tabOrder[currentIdx - 1])}
                className="flex-1 md:flex-none px-6 py-2 border-2 rounded-xl text-xs font-bold text-slate-500"
              >
                VOLTAR
              </button>
            )}

            {/* QR Code → sempre pode avançar */}
            {tab === 'qrcode' && (
              <button
                onClick={() => setTab('checklist')}
                className="flex-1 md:flex-none px-8 py-2 rounded-xl text-xs font-black text-white bg-[#3d6cf0] transition-all"
              >
                {equipamentoPonto ? 'PRÓXIMO' : 'AVANÇAR SEM QR CODE'}
              </button>
            )}

            {/* Checklist → precisa completar todos os itens */}
            {tab === 'checklist' && (
              <button
                disabled={!checklistOk}
                onClick={() => {
                  if (temNaoConformidade) setTab('acao')
                  else { setCodigoGerado(gerarCodigoInspecao()); setSuccessModal(true) }
                }}
                className={cn(
                  'flex-1 md:flex-none px-8 py-2 rounded-xl text-xs font-black text-white transition-all flex items-center justify-center',
                  checklistOk ? 'bg-[#3d6cf0]' : 'bg-slate-200 cursor-not-allowed'
                )}
              >
                {isSaving
                  ? <Loader2 className="animate-spin" size={16} />
                  : temNaoConformidade ? 'PRÓXIMO' : 'CONCLUIR INSPEÇÃO'
                }
              </button>
            )}

            {/* Ação Corretiva → precisa preencher todos os campos */}
            {tab === 'acao' && (
              <button
                disabled={!acaoOk || isSaving || geoLoading}
                onClick={() => { setCodigoGerado(gerarCodigoInspecao()); setSuccessModal(true) }}
                className={cn(
                  'flex-1 md:flex-none px-8 py-2 rounded-xl text-xs font-black text-white transition-all flex items-center justify-center gap-2',
                  acaoOk && !geoLoading ? 'bg-[#3d6cf0]' : 'bg-slate-200 cursor-not-allowed'
                )}
              >
                {isSaving || geoLoading
                  ? <Loader2 className="animate-spin" size={16} />
                  : 'SALVAR INSPEÇÃO'
                }
              </button>
            )}
          </div>
        </div>

        {/* ══ MODAL SUCESSO ══ */}
        {successModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-6">
            <div className="bg-white p-10 rounded-3xl text-center shadow-2xl max-w-sm scale-in">
              <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle size={48} className="text-emerald-500" />
              </div>
              <h3 className="font-black text-xl text-slate-800 mb-2">Sucesso!</h3>
              <p className="text-slate-500 text-sm mb-2 leading-relaxed">
                Inspeção registrada com sucesso.
              </p>
              <p className="text-[#3d6cf0] font-black text-xs mb-8 uppercase tracking-widest">
                #{codigoGerado}
              </p>
              <button
                onClick={handleReset}
                className="w-full py-4 bg-[#3d6cf0] text-white rounded-2xl font-black text-xs tracking-widest"
              >
                PRÓXIMA INSPEÇÃO →
              </button>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  )
}