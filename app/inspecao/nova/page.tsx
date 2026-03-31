'use client'

import { useState, useCallback, useRef, useMemo, useEffect } from 'react'
import dynamic from 'next/dynamic'

import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { mockEquipamentos, mockChecklistTemplates } from '@/lib/mock-data'
import { useGeolocation } from '@/hooks/useGeolocation'
import { gerarCodigoInspecao, cn } from '@/lib/utils'
import { Html5Qrcode } from 'html5-qrcode'

import {
  CheckCircle, Zap, Search, AlertCircle, ShieldCheck,
  Wrench, Image as ImageIcon, ArrowLeft, CheckCircle2,
  XCircle, MinusCircle,
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
  { value: 'a_atribuir',   label: 'A Atribuir',    color: '#6b7a90' },
  { value: 'a_iniciar',    label: 'A Iniciar',      color: '#3b82f6' },
  { value: 'em_andamento', label: 'Em Andamento',   color: '#f59e0b' },
  { value: 'cancelado',    label: 'Cancelado',      color: '#ef4444' },
  { value: 'concluido',    label: 'Concluído',      color: '#10b981' },
]

const TABS = [
  { key: 'checklist', label: 'Inspeção',        icon: ShieldCheck },
  { key: 'acao',      label: 'Ação Corretiva',  icon: Wrench },
] as const

export default function InspecaoPage() {
  const [mounted, setMounted]                   = useState(false)
  const [equipamentoPonto, setEquipamentoPonto] = useState<Equipamento | null>(null)
  const [serieBusca, setSerieBusca]             = useState('')
  const [showSuggestions, setShowSuggestions]   = useState(false)
  const [respostas, setRespostas]               = useState<RespostaChecklist[]>([])
  const [successModal, setSuccessModal]         = useState(false)
  const [codigoGerado, setCodigoGerado]         = useState('')
  const [scanKey, setScanKey]                   = useState(0)
  const [tab, setTab]                           = useState<'checklist' | 'acao'>('checklist')

  const [acao, setAcao] = useState<AcaoCorretiva>({
    status: '', dataVencimento: '', titulo: '', descricao: '',
    numNaoConformidade: '', empresaResponsavel: '', nomeResponsavel: '', emailsCopia: '',
  })

  const { capture: captureGeo, loading: geoLoading } = useGeolocation()
  const scanFinishedRef = useRef(false)
  const fileInputRef    = useRef<HTMLInputElement>(null)

  useEffect(() => { setMounted(true) }, [])

  const handleScan = useCallback((val: string) => {
    if (scanFinishedRef.current) return
    const found = mockEquipamentos.find(e =>
      e.uuid === val || e.codigo.toLowerCase() === val.toLowerCase()
    ) as Equipamento
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
  }

  const handleToggleResposta = (idItem: string, valor: OpcaoResposta | string) => {
    setRespostas(prev => {
      const idx = prev.findIndex(r => r.idItem === idItem)
      const nova: RespostaChecklist = {
        idItem,
        resposta: valor as any,
        valor: (valor === 'ok' ? 'OK' : valor === 'na' ? 'N/A' : valor === 'nao_conforme' ? 'NC' : valor) as any,
      }
      if (idx > -1) { const arr = [...prev]; arr[idx] = nova; return arr }
      return [...prev, nova]
    })
  }

  const handleReset = () => {
    scanFinishedRef.current = false
    setEquipamentoPonto(null); setSerieBusca(''); setRespostas([])
    setShowSuggestions(false); setScanKey(k => k + 1)
    setSuccessModal(false); setTab('checklist')
    setAcao({ status: '', dataVencimento: '', titulo: '', descricao: '', numNaoConformidade: '', empresaResponsavel: '', nomeResponsavel: '', emailsCopia: '' })
  }

  const template = useMemo(() => {
    if (!equipamentoPonto) return null
    return mockChecklistTemplates.find(t => t.tipoEquipamento === equipamentoPonto.tipo) || mockChecklistTemplates[0]
  }, [equipamentoPonto])

  const itensChecklist    = useMemo(() => template?.itens.filter(i => i.pergunta !== 'Teste Hidrostático') || [], [template])
  const itensNaoConformes = useMemo(() => respostas.filter(r => r.resposta === 'nao_conforme'), [respostas])
  const temNaoConformidade = itensNaoConformes.length > 0
  const isExtintor = useMemo(() => equipamentoPonto?.tipo.toLowerCase().includes('extintor'), [equipamentoPonto])

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

  const canFinishChecklist = respostas.length >= (template?.itens.length || 0) && (!isExtintor || !!dadosCilindro)
  const canSaveAcao = acao.status !== '' && !!acao.dataVencimento && !!acao.titulo && !!acao.descricao && !!acao.empresaResponsavel && !!acao.nomeResponsavel

  // Progresso do checklist
  const progressoPct = itensChecklist.length > 0
    ? Math.round((respostas.length / itensChecklist.length) * 100)
    : 0

  const inputCls = 'w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl py-3.5 px-4 text-sm font-semibold text-[#1a2535] outline-none focus:border-[#094780]/40 focus:ring-2 focus:ring-[#094780]/08 transition-all placeholder:font-normal placeholder:text-[#b0bac8]'
  const labelCls = 'text-[10px] font-black text-[#8896ab] uppercase tracking-[0.25em] mb-2 block'

  if (!mounted) return null

  return (
    <DashboardLayout title="Executar Inspeção">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Syne:wght@700;800&display=swap');

        .insp-root { font-family: 'DM Sans', sans-serif; }

        @keyframes scanLine {
          0%   { top: 0; }
          100% { top: 100%; }
        }
        .scan-line { animation: scanLine 1.8s ease-in-out infinite alternate; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.35s ease forwards; }

        @keyframes zoomIn {
          from { opacity: 0; transform: scale(0.9); }
          to   { opacity: 1; transform: scale(1); }
        }
        .modal-in { animation: zoomIn 0.28s cubic-bezier(.22,.68,0,1.2) forwards; }

        /* Scrollbar */
        .light-scroll::-webkit-scrollbar { width: 3px; }
        .light-scroll::-webkit-scrollbar-track { background: transparent; }
        .light-scroll::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 99px; }

        /* Radio */
        .status-opt { transition: background 0.15s, border-color 0.15s; }
        .status-opt:hover { background: #f8fafc; }

        /* Progress bar */
        .prog-bar { transition: width 0.5s cubic-bezier(.4,0,.2,1); }
      `}</style>

      <div className="insp-root w-full flex flex-col bg-white min-h-[calc(100vh-60px)]">

        {/* ══ ESTADO 1 — AGUARDANDO QR CODE ══════════════════════════════════ */}
        {!equipamentoPonto ? (
          <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 bg-white">

            {/* Eyebrow */}
            <div className="flex items-center gap-3 mb-3">
              <span className="w-8 h-px bg-[#094780]/20" />
              <span className="text-[9px] font-black uppercase tracking-[0.4em] text-[#8896ab]">Leitura de Campo</span>
              <span className="w-8 h-px bg-[#094780]/20" />
            </div>

            <h2 className="text-[#0d1e33] font-black text-3xl uppercase italic tracking-tighter mb-10 text-center leading-tight"
              style={{ fontFamily: "'Syne', sans-serif" }}>
              Aguardando<br />QR Code
            </h2>

            {/* Scanner card */}
            <div className="w-full max-w-[320px] fade-up">
              {/* Status pill */}
              <div className="flex justify-center mb-4">
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-[#e8edf3] shadow-sm">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-[9px] font-black text-[#6b7a90] uppercase tracking-[0.3em]">Pronto para leitura</span>
                </div>
              </div>

              {/* Scanner box */}
              <div className="relative rounded-[28px] overflow-hidden bg-[#07111f] shadow-2xl"
                style={{ boxShadow: '0 24px 64px rgba(9,71,128,0.18)' }}>
                <div className="aspect-square relative">
                  <div className="absolute inset-0 z-0">
                    <QrScanner key={scanKey} onScan={handleScan} />
                  </div>

                  {/* Overlay corners */}
                  <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
                    <div className="w-44 h-44 relative">
                      <div className="absolute top-0 left-0 w-7 h-7 border-t-[3px] border-l-[3px] border-[#094780] rounded-tl-lg" />
                      <div className="absolute top-0 right-0 w-7 h-7 border-t-[3px] border-r-[3px] border-[#094780] rounded-tr-lg" />
                      <div className="absolute bottom-0 left-0 w-7 h-7 border-b-[3px] border-l-[3px] border-[#094780] rounded-bl-lg" />
                      <div className="absolute bottom-0 right-0 w-7 h-7 border-b-[3px] border-r-[3px] border-[#094780] rounded-br-lg" />
                      {/* Scan line */}
                      <div className="scan-line absolute left-0 right-0 h-[2px] rounded-full"
                        style={{ background: 'rgba(9,71,128,0.7)', boxShadow: '0 0 12px rgba(9,71,128,0.8)' }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Upload */}
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
              <button onClick={() => fileInputRef.current?.click()}
                className="w-full mt-3 p-4 bg-white border border-[#e8edf3] rounded-[22px] flex items-center gap-4 hover:bg-[#f8fafc] hover:border-[#094780]/20 transition-all shadow-sm group">
                <div className="w-11 h-11 bg-[#f0f4f9] text-[#094780] rounded-xl flex items-center justify-center group-hover:bg-[#094780]/10 group-hover:scale-105 transition-all">
                  <ImageIcon size={20} />
                </div>
                <div className="text-left">
                  <p className="text-[12px] font-black text-[#1a2535] uppercase tracking-wide">Upload de Imagem</p>
                  <p className="text-[10px] text-[#8896ab] font-medium mt-0.5">Selecionar foto com QR Code</p>
                </div>
              </button>
            </div>
          </div>

        ) : (
          /* ══ ESTADO 2 — CHECKLIST + AÇÃO CORRETIVA ══════════════════════ */
          <div className="flex flex-col min-h-[calc(100vh-60px)] bg-white">

            {/* ── Cabeçalho branco com info do equipamento ────────────────── */}
            <div className="bg-white border-b border-[#e8edf3] px-6 pt-6 pb-0">
              <button onClick={handleReset}
                className="flex items-center gap-2 text-[#8896ab] hover:text-[#094780] mb-5 group transition-colors">
                <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
                <span className="text-[10px] font-black uppercase tracking-widest">Voltar para leitura</span>
              </button>

              {/* Equipamento info */}
              <div className="flex items-start justify-between mb-5">
                <div>
                  <span className="text-[9px] font-black text-[#094780] uppercase tracking-[0.35em]">
                    {tab === 'checklist' ? 'Ponto de Instalação' : 'Ação Corretiva'}
                  </span>
                  <h1 className="text-[28px] font-black tracking-tighter text-[#0d1e33] uppercase leading-none mt-0.5"
                    style={{ fontFamily: "'Syne', sans-serif" }}>
                    {equipamentoPonto.codigo}
                  </h1>
                  <p className="text-[11px] text-[#8896ab] font-medium mt-1">{equipamentoPonto.tipo}</p>
                </div>
                <div className="bg-[#f0f4f9] p-2.5 rounded-xl border border-[#e2e8f0]">
                  {tab === 'checklist'
                    ? <ShieldCheck size={20} className="text-[#094780]" />
                    : <Wrench size={20} className="text-[#094780]" />}
                </div>
              </div>

              {/* Barra de progresso do checklist */}
              {tab === 'checklist' && (
                <div className="mb-5">
                  <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-[#8896ab] mb-1.5">
                    <span>Progresso</span>
                    <span>{respostas.length}/{itensChecklist.length} itens · {progressoPct}%</span>
                  </div>
                  <div className="h-1.5 bg-[#f0f4f9] rounded-full overflow-hidden">
                    <div className="prog-bar h-full rounded-full"
                      style={{
                        width: `${progressoPct}%`,
                        background: progressoPct === 100 ? '#10b981' : 'linear-gradient(90deg,#094780,#3b82f6)',
                      }} />
                  </div>
                </div>
              )}

              {/* Busca cilindro extintor */}
              {tab === 'checklist' && isExtintor && (
                <div className="border-t border-[#e8edf3] pt-5 mb-0">
                  <label className={labelCls}>Número de Série do Cilindro</label>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8896ab]" size={15} />
                    <input type="text" value={serieBusca}
                      onChange={e => { setSerieBusca(e.target.value); setShowSuggestions(true) }}
                      onFocus={() => setShowSuggestions(true)}
                      className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl py-3.5 pl-11 pr-4 text-sm font-semibold text-[#1a2535] focus:border-[#094780]/40 focus:ring-2 focus:ring-[#094780]/06 transition-all outline-none uppercase placeholder:font-normal placeholder:text-[#b0bac8] placeholder:normal-case"
                      placeholder="Pesquisar cilindro..." />
                    {showSuggestions && sugestoes.length > 0 && (
                      <div className="absolute z-50 w-full mt-2 bg-white rounded-2xl shadow-xl border border-[#e8edf3] overflow-hidden">
                        {sugestoes.map(s => (
                          <div key={s.id}
                            className="p-4 border-b border-[#f0f2f5] last:border-0 cursor-pointer hover:bg-[#f8fafc] transition-colors"
                            onClick={() => { setSerieBusca(s.numeroSerieCilindro || s.codigoGalao || ''); setShowSuggestions(false) }}>
                            <p className="text-sm font-bold text-[#1a2535]">{s.numeroSerieCilindro || s.codigoGalao}</p>
                            <p className="text-[10px] text-[#094780] font-bold uppercase mt-0.5">{s.agente} · {s.carga}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {serieBusca && (
                    <div className="mt-3 mb-1">
                      {dadosCilindro ? (
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { label: 'Carga',    value: dadosCilindro.carga,   ok: true },
                            { label: 'Agente',   value: dadosCilindro.agente,  ok: true },
                            { label: 'Validade', value: dadosCilindro.validadeRecarga || dadosCilindro.proximaInspecao, ok: dadosCilindro.status !== 'vencido' },
                          ].map(info => (
                            <div key={info.label} className="bg-[#f8fafc] border border-[#e8edf3] rounded-xl p-3 text-center">
                              <p className="text-[8px] text-[#8896ab] uppercase font-black tracking-wider mb-1">{info.label}</p>
                              <p className={cn('text-[11px] font-black truncate', info.ok ? 'text-[#1a2535]' : 'text-red-500')}>
                                {info.value}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2.5 p-3.5 bg-red-50 border border-red-100 rounded-2xl">
                          <AlertCircle size={15} className="text-red-500 flex-shrink-0" />
                          <p className="text-[11px] text-red-600 font-bold">Cilindro não localizado no sistema</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Tab bar */}
              <div className="flex gap-0 -mb-px mt-2">
                {TABS.map(t => {
                  const Icon = t.icon
                  const isActive = tab === t.key
                  const isLocked = t.key === 'acao' && !canFinishChecklist
                  return (
                    <button key={t.key}
                      onClick={() => !isLocked && setTab(t.key)}
                      className={cn(
                        'flex items-center gap-2 px-5 py-3.5 text-[12px] font-bold border-b-2 transition-all relative',
                        isActive
                          ? 'text-[#094780] border-[#094780]'
                          : isLocked
                            ? 'text-[#c8d0dc] border-transparent cursor-not-allowed'
                            : 'text-[#8896ab] border-transparent hover:text-[#1a2535] hover:border-[#e2e8f0]',
                      )}>
                      <Icon size={14} />
                      {t.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* ── Conteúdo scrollável ──────────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto light-scroll bg-[#f8fafc] px-6 pt-6 pb-32">

              {/* TAB — CHECKLIST */}
              {tab === 'checklist' && (
                <div className="space-y-2.5 max-w-2xl mx-auto fade-up">
                  {itensChecklist.map((item, idx) => {
                    const r = respostas.find(res => res.idItem === item.id)
                    return (
                      <div key={item.id}
                        className="bg-white rounded-[20px] border border-[#e8edf3] px-5 py-4 flex items-center justify-between gap-4 shadow-sm hover:border-[#094780]/15 transition-all"
                        style={{ animationDelay: `${idx * 0.03}s` }}>
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <span className="text-[10px] font-black text-[#b0bac8] w-5 flex-shrink-0">{String(idx + 1).padStart(2, '0')}</span>
                          <p className="text-[13px] font-semibold text-[#1a2535] leading-snug">{item.pergunta}</p>
                        </div>
                        <div className="flex gap-1.5 flex-shrink-0">
                          {/* OK */}
                          <button onClick={() => handleToggleResposta(item.id, 'ok')}
                            className={cn(
                              'w-10 h-10 rounded-xl font-black text-[10px] border-2 flex items-center justify-center transition-all',
                              r?.resposta === 'ok'
                                ? 'bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/25'
                                : 'bg-white border-[#e2e8f0] text-[#b0bac8] hover:border-emerald-300 hover:text-emerald-500',
                            )}>
                            <CheckCircle2 size={15} />
                          </button>
                          {/* NC */}
                          <button onClick={() => handleToggleResposta(item.id, 'nao_conforme')}
                            className={cn(
                              'w-10 h-10 rounded-xl font-black text-[10px] border-2 flex items-center justify-center transition-all',
                              r?.resposta === 'nao_conforme'
                                ? 'bg-red-500 border-red-500 text-white shadow-md shadow-red-500/25'
                                : 'bg-white border-[#e2e8f0] text-[#b0bac8] hover:border-red-300 hover:text-red-500',
                            )}>
                            <XCircle size={15} />
                          </button>
                          {/* N/A */}
                          <button onClick={() => handleToggleResposta(item.id, 'na')}
                            className={cn(
                              'w-10 h-10 rounded-xl font-black text-[10px] border-2 flex items-center justify-center transition-all',
                              r?.resposta === 'na'
                                ? 'bg-slate-500 border-slate-500 text-white shadow-md shadow-slate-500/20'
                                : 'bg-white border-[#e2e8f0] text-[#b0bac8] hover:border-slate-300 hover:text-slate-500',
                            )}>
                            <MinusCircle size={15} />
                          </button>
                        </div>
                      </div>
                    )
                  })}

                  {/* Legenda */}
                  <div className="flex items-center gap-4 pt-2 px-1">
                    {[
                      { icon: CheckCircle2, label: 'Conforme',       color: '#10b981' },
                      { icon: XCircle,      label: 'Não Conforme',   color: '#ef4444' },
                      { icon: MinusCircle,  label: 'Não Aplicável',  color: '#64748b' },
                    ].map(({ icon: Icon, label, color }) => (
                      <div key={label} className="flex items-center gap-1.5">
                        <Icon size={12} style={{ color }} />
                        <span className="text-[10px] text-[#8896ab] font-medium">{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB — AÇÃO CORRETIVA */}
              {tab === 'acao' && (
                <div className="max-w-2xl mx-auto fade-up space-y-5">
                  
                  {/* Status */}
                  <div className="bg-white rounded-[20px] border border-[#e8edf3] p-5 shadow-sm">
                    <label className={labelCls}>Status da Ação *</label>
                    <div className="space-y-2">
                      {STATUS_OPTIONS.map(opt => (
                        <div key={opt.value}
                          onClick={() => setAcao(a => ({ ...a, status: opt.value }))}
                          className={cn(
                            'status-opt flex items-center gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all',
                            acao.status === opt.value
                              ? 'border-[#094780]/20 bg-[#094780]/4'
                              : 'border-transparent hover:bg-[#f8fafc]',
                          )}>
                          <div className={cn('w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all',
                            acao.status === opt.value ? 'border-[#094780]' : 'border-[#d1d9e6]')}>
                            {acao.status === opt.value && (
                              <div className="w-2.5 h-2.5 rounded-full bg-[#094780]" />
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ background: opt.color }} />
                            <span className={cn('text-sm font-semibold',
                              acao.status === opt.value ? 'text-[#094780]' : 'text-[#4a5568]')}>
                              {opt.label}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Campos principais */}
                  <div className="bg-white rounded-[20px] border border-[#e8edf3] p-5 shadow-sm space-y-4">
                    <div>
                      <label className={labelCls}>Data Limite *</label>
                      <input type="date" value={acao.dataVencimento}
                        onChange={e => setAcao(a => ({ ...a, dataVencimento: e.target.value }))}
                        className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Título da Ação *</label>
                      <input type="text" value={acao.titulo}
                        onChange={e => setAcao(a => ({ ...a, titulo: e.target.value }))}
                        placeholder="Ex: Troca de mangueira"
                        className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Descrição Detalhada *</label>
                      <textarea value={acao.descricao}
                        onChange={e => setAcao(a => ({ ...a, descricao: e.target.value }))}
                        placeholder="Descreva o que deve ser feito..."
                        rows={3} className={cn(inputCls, 'resize-none')} />
                    </div>
                  </div>

                  {/* Responsável */}
                  <div className="bg-white rounded-[20px] border border-[#e8edf3] p-5 shadow-sm space-y-4">
                    <div className="flex items-center gap-3 pb-1">
                      <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#8896ab]">Responsável</span>
                      <div className="flex-1 h-px bg-[#e8edf3]" />
                    </div>
                    <div>
                      <label className={labelCls}>Relacionar com Não Conformidade</label>
                      <select value={acao.numNaoConformidade}
                        onChange={e => setAcao(a => ({ ...a, numNaoConformidade: e.target.value }))}
                        className={inputCls}>
                        <option value="">-</option>
                        {itensNaoConformes.map((nc, i) => (
                          <option key={nc.idItem} value={nc.idItem}>{i + 1} — {nc.idItem}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Empresa Responsável *</label>
                      <input type="text" value={acao.empresaResponsavel}
                        onChange={e => setAcao(a => ({ ...a, empresaResponsavel: e.target.value }))}
                        placeholder="Empresa responsável"
                        className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Nome do Responsável *</label>
                      <input type="text" value={acao.nomeResponsavel}
                        onChange={e => setAcao(a => ({ ...a, nomeResponsavel: e.target.value }))}
                        placeholder="Nome do técnico/encarregado"
                        className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Copiar E-mail(s)</label>
                      <input type="text" value={acao.emailsCopia}
                        onChange={e => setAcao(a => ({ ...a, emailsCopia: e.target.value }))}
                        placeholder="e-mails separados por vírgula"
                        className={inputCls} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ── Barra inferior fixa ──────────────────────────────────────── */}
            <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-md border-t border-[#e8edf3] px-6 py-4">
              <button
                disabled={(tab === 'checklist' ? !canFinishChecklist : !canSaveAcao) || geoLoading}
                onClick={() => {
                  if (tab === 'checklist') {
                    if (temNaoConformidade) setTab('acao')
                    else { setCodigoGerado(gerarCodigoInspecao()); setSuccessModal(true) }
                  } else {
                    setCodigoGerado(gerarCodigoInspecao()); setSuccessModal(true)
                  }
                }}
                className={cn(
                  'w-full py-4 rounded-2xl font-black text-white flex items-center justify-center gap-2.5 transition-all text-[12px] uppercase tracking-wide',
                  (tab === 'checklist' ? canFinishChecklist : canSaveAcao) && !geoLoading
                    ? 'bg-[#094780] shadow-lg shadow-[#094780]/20 hover:bg-[#0a5494]'
                    : 'bg-[#d1d9e6] text-[#8896ab] cursor-not-allowed',
                )}>
                <Zap size={16} fill="currentColor" />
                {tab === 'checklist'
                  ? (temNaoConformidade ? 'Próximo — Ação Corretiva' : 'Concluir Inspeção')
                  : 'Salvar e Concluir Inspeção'}
              </button>
            </div>
          </div>
        )}

        {/* ══ MODAL SUCESSO ════════════════════════════════════════════════ */}
        {successModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[#0d1e33]/80 backdrop-blur-md">
            <div className="modal-in bg-white rounded-[36px] w-full max-w-xs p-10 text-center shadow-2xl">
              <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-white shadow-lg">
                <CheckCircle size={40} className="text-emerald-500" />
              </div>
              <h3 className="text-2xl font-black text-[#0d1e33] mb-1 uppercase italic"
                style={{ fontFamily: "'Syne', sans-serif" }}>Sucesso!</h3>
              <p className="text-[10px] text-[#8896ab] font-bold mb-8 uppercase tracking-[0.25em]">
                Inspeção #{codigoGerado} salva.
              </p>
              <button
                className="w-full py-4 bg-[#094780] text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-[#0a5494] transition-all"
                onClick={handleReset}>
                Próximo Equipamento →
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}