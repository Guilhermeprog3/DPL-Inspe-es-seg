'use client'

import { useState, useCallback, useRef, useMemo, useEffect } from 'react'
import dynamic from 'next/dynamic'

import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { mockEquipamentos, mockChecklistTemplates } from '@/lib/mock-data'
import { useGeolocation } from '@/hooks/useGeolocation'
import { gerarCodigoInspecao, cn } from '@/lib/utils'
import { Html5Qrcode } from 'html5-qrcode'

import { 
  CheckCircle, 
  Zap, 
  Search, 
  AlertCircle, 
  ShieldCheck, 
  Wrench, 
  Image as ImageIcon,
  ArrowLeft 
} from 'lucide-react'
import type { Equipamento, RespostaChecklist } from '@/types'

const QrScanner = dynamic(() => import('@/components/inspecao/QrScanner').then(m => m.QrScanner), {
  ssr: false
})

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

const STATUS_OPTIONS: { value: AcaoCorretiva['status']; label: string }[] = [
  { value: 'a_atribuir',   label: 'A Atribuir' },
  { value: 'a_iniciar',    label: 'A Iniciar' },
  { value: 'em_andamento', label: 'Em Andamento' },
  { value: 'cancelado',    label: 'Cancelado' },
  { value: 'concluido',    label: 'Concluído' },
]

const TABS = [
  { key: 'checklist', label: 'Inspeção' },
  { key: 'acao',       label: 'Ação Corretiva' },
] as const

export default function InspecaoPage() {
  const [mounted, setMounted] = useState(false)
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
    numNaoConformidade: '', empresaResponsavel: '', nomeResponsavel: '', emailsCopia: ''
  })

  const { capture: captureGeo, loading: geoLoading } = useGeolocation()
  const scanFinishedRef = useRef(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { setMounted(true) }, [])

  // --- LÓGICA DE SCAN E UPLOAD ---
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
    const containerId = "qr-file-processor-page"
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
    } catch (err) {
      alert("QR Code não detectado na imagem. Tente uma foto mais nítida.")
    }
  }

  // --- LÓGICA DE CHECKLIST ---
  const handleToggleResposta = (idItem: string, valor: OpcaoResposta | string) => {
    setRespostas(prev => {
      const idx = prev.findIndex(r => r.idItem === idItem)
      const nova: RespostaChecklist = {
        idItem,
        resposta: valor as any, 
        valor: (valor === 'ok' ? 'OK' : valor === 'na' ? 'N/A' : valor === 'nao_conforme' ? 'NC' : valor) as any
      }
      if (idx > -1) { const arr = [...prev]; arr[idx] = nova; return arr }
      return [...prev, nova]
    })
  }

  const handleReset = () => {
    scanFinishedRef.current = false
    setEquipamentoPonto(null); setSerieBusca(''); setRespostas([]); setShowSuggestions(false)
    setScanKey(k => k + 1); setSuccessModal(false); setTab('checklist')
    setAcao({ status: '', dataVencimento: '', titulo: '', descricao: '', numNaoConformidade: '', empresaResponsavel: '', nomeResponsavel: '', emailsCopia: '' })
  }

  // --- MEMOS E VALIDAÇÕES ---
  const template = useMemo(() => {
    if (!equipamentoPonto) return null
    return mockChecklistTemplates.find(t => t.tipoEquipamento === equipamentoPonto.tipo) || mockChecklistTemplates[0]
  }, [equipamentoPonto])

  const itensChecklist = useMemo(() =>
    template?.itens.filter(item => item.pergunta !== 'Teste Hidrostático') || [],
  [template])

  const itensNaoConformes = useMemo(() => respostas.filter(r => r.resposta === 'nao_conforme'), [respostas])
  const temNaoConformidade = itensNaoConformes.length > 0

  const isExtintor = useMemo(() => equipamentoPonto?.tipo.toLowerCase().includes('extintor'), [equipamentoPonto])
  const dadosCilindro = useMemo(() => {
    if (!serieBusca) return null
    return mockEquipamentos.find(e => e.numeroSerieCilindro?.toLowerCase() === serieBusca.toLowerCase() || e.codigoGalao?.toLowerCase() === serieBusca.toLowerCase()) || null
  }, [serieBusca])

  const sugestoes = useMemo(() => {
    if (!serieBusca) return []
    return mockEquipamentos.filter(e => e.tipo.toLowerCase().includes('extintor') && (e.numeroSerieCilindro?.toLowerCase().includes(serieBusca.toLowerCase()) || e.codigoGalao?.toLowerCase().includes(serieBusca.toLowerCase()))).slice(0, 5)
  }, [serieBusca])

  const canFinishChecklist = respostas.length >= (template?.itens.length || 0) && (!isExtintor || !!dadosCilindro)
  const canSaveAcao = acao.status !== '' && !!acao.dataVencimento && !!acao.titulo && !!acao.descricao && !!acao.empresaResponsavel && !!acao.nomeResponsavel

  const inputCls = "w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 px-4 text-sm font-semibold text-slate-800 outline-none focus:border-blue-500 transition-all placeholder:font-normal placeholder:text-slate-400"
  const labelCls = "text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 block"

  if (!mounted) return null

  return (
    <DashboardLayout title="Executar Inspeção">
      <div className="w-full flex flex-col bg-white min-h-[calc(100vh-64px)]">
        
        {!equipamentoPonto ? (
          <div className="flex-1 flex flex-col items-center justify-start px-6 pt-12 pb-10 overflow-y-auto">
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.4em] mb-4 text-center">Leitura de Campo</p>
            <h2 className="text-slate-900 font-black text-4xl uppercase italic tracking-tighter mb-10 text-center leading-none">Aguardando <br/> QR Code</h2>
            
            <div className="w-full max-w-sm p-4 bg-slate-50 rounded-[48px] border border-slate-100 shadow-sm relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white px-4 py-1.5 rounded-full border border-slate-100 shadow-sm flex items-center gap-2 z-20">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Pronto para leitura</span>
              </div>
              
              <div className="relative overflow-hidden rounded-[32px] bg-black aspect-square shadow-inner">
                <div className="absolute inset-0 z-0"><QrScanner key={scanKey} onScan={handleScan} /></div>
                <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
                   <div className="w-48 h-48 relative">
                      <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-500 rounded-tl-xl" />
                      <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-500 rounded-tr-xl" />
                      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-500 rounded-bl-xl" />
                      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-500 rounded-br-xl" />
                      <div className="absolute top-0 left-0 w-full h-[2px] bg-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.8)] animate-scan-line" />
                   </div>
                </div>
              </div>

              <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
              <button onClick={() => fileInputRef.current?.click()} className="w-full mt-4 p-5 bg-white border border-slate-100 rounded-[28px] flex items-center gap-4 hover:bg-slate-50 transition-all shadow-sm group">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <ImageIcon size={24} />
                </div>
                <div className="text-left">
                  <p className="text-sm font-black text-slate-900 uppercase italic">Upload de Imagem</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Clique para selecionar foto</p>
                </div>
              </button>
            </div>
          </div>
        ) : (
          <div className="min-h-[calc(100vh-64px)] flex flex-col bg-[#041628]">
            {/* CABEÇALHO ESCURO */}
            <div className="bg-[#041628] px-6 pt-8 pb-6">
              <button onClick={handleReset} className="flex items-center gap-2 text-white/40 hover:text-blue-500 mb-6 group transition-colors">
                <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                <span className="text-[10px] font-black uppercase tracking-widest">Voltar para leitura</span>
              </button>
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{tab === 'checklist' ? 'Ponto de Instalação' : 'Ação Corretiva'}</span>
                  <h1 className="text-4xl font-black tracking-tighter text-white uppercase italic leading-none">{equipamentoPonto.codigo}</h1>
                </div>
                <div className="bg-white/5 p-3 rounded-2xl border border-white/10">
                  {tab === 'checklist' ? <ShieldCheck className="text-blue-500" size={24} /> : <Wrench className="text-blue-500" size={24} />}
                </div>
              </div>

              {/* BUSCA DE CILINDRO (EXTINTOR) */}
              {tab === 'checklist' && isExtintor && (
                <div className="mt-6 pt-6 border-t border-white/10">
                  <label className="text-[10px] font-black uppercase text-white/30 mb-3 block tracking-widest">Número de Série do Cilindro</label>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                    <input type="text" value={serieBusca} onChange={(e) => { setSerieBusca(e.target.value); setShowSuggestions(true) }} onFocus={() => setShowSuggestions(true)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm font-black text-white focus:border-blue-500 transition-all outline-none uppercase" placeholder="PESQUISAR CILINDRO..." />
                    {showSuggestions && sugestoes.length > 0 && (
                      <div className="absolute z-50 w-full mt-2 bg-[#1a2535] rounded-2xl shadow-2xl border border-white/10 overflow-hidden">
                        {sugestoes.map(s => (
                          <div key={s.id} className="p-4 border-b border-white/5 cursor-pointer hover:bg-white/10" onClick={() => { setSerieBusca(s.numeroSerieCilindro || s.codigoGalao || ''); setShowSuggestions(false) }}>
                            <p className="text-sm font-black text-white">{s.numeroSerieCilindro || s.codigoGalao}</p>
                            <p className="text-[10px] text-blue-500 font-black uppercase">{s.agente} • {s.carga}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="mt-4">
                    {dadosCilindro ? (
                      <div className="grid grid-cols-3 gap-2">
                        <div className="bg-white/5 p-3 rounded-xl border border-white/5 text-center"><p className="text-[8px] text-white/30 uppercase font-black">Carga</p><p className="text-xs font-black text-white">{dadosCilindro.carga}</p></div>
                        <div className="bg-white/5 p-3 rounded-xl border border-white/5 text-center"><p className="text-[8px] text-white/30 uppercase font-black">Agente</p><p className="text-xs font-black text-white truncate">{dadosCilindro.agente}</p></div>
                        <div className="bg-blue-500/10 p-3 rounded-xl border border-blue-500/20 text-center"><p className="text-[8px] text-blue-400 uppercase font-black">Validade</p><p className={cn("text-xs font-black", dadosCilindro.status === 'vencido' ? "text-red-500" : "text-green-400")}>{dadosCilindro.validadeRecarga || dadosCilindro.proximaInspecao}</p></div>
                      </div>
                    ) : (
                      <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3"><AlertCircle className="text-red-500" size={18} /><p className="text-red-400 text-[10px] font-black uppercase">Cilindro não localizado</p></div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* TAB BAR */}
            <div className="bg-white border-b border-slate-200 px-6 flex">
              {TABS.map(t => (
                <button key={t.key} onClick={() => (t.key === 'acao' && !canFinishChecklist) ? null : setTab(t.key)}
                  className={cn("relative py-4 px-5 text-sm font-bold transition-all", tab === t.key ? "text-blue-600" : (canFinishChecklist || t.key === 'checklist' ? "text-slate-500 hover:text-slate-800" : "text-slate-300 cursor-not-allowed"))}>
                  {t.label}
                  <span className={cn("absolute bottom-0 left-0 right-0 h-0.5 rounded-full", tab === t.key ? "bg-blue-600" : "bg-transparent")} />
                </button>
              ))}
            </div>

            <div className="flex-1 bg-slate-50 px-6 pt-8 pb-32 overflow-y-auto">
              {tab === 'checklist' ? (
                <div className="space-y-3">
                  {itensChecklist.map((item) => {
                    const r = respostas.find(res => res.idItem === item.id)
                    return (
                      <div key={item.id} className="bg-white p-5 rounded-[24px] border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm">
                        <p className="text-sm font-bold text-slate-700 max-w-[65%] leading-tight">{item.pergunta}</p>
                        <div className="flex gap-1.5 w-full sm:w-auto">
                          {(['ok', 'nao_conforme', 'na'] as const).map((val) => (
                            <button key={val} onClick={() => handleToggleResposta(item.id, val)}
                              className={cn("flex-1 sm:w-11 h-10 rounded-xl font-black text-[10px] border transition-all", r?.resposta === val ? (val === 'ok' ? "bg-green-500 border-green-500 text-white" : val === 'nao_conforme' ? "bg-red-500 border-red-500 text-white" : "bg-slate-500 border-slate-500 text-white") : "bg-white border-slate-200 text-slate-400")}>
                              {val === 'ok' ? 'OK' : val === 'nao_conforme' ? 'NC' : 'N/A'}
                            </button>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="space-y-6">
                  {/* FORMULÁRIO COMPLETO DE AÇÃO CORRETIVA */}
                  <div>
                    <label className={labelCls}>Status da Ação *</label>
                    <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
                      {STATUS_OPTIONS.map(opt => (
                        <label key={opt.value} onClick={() => setAcao(a => ({ ...a, status: opt.value }))} className="flex items-center gap-3 cursor-pointer">
                          <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center", acao.status === opt.value ? "border-blue-500 bg-blue-500" : "border-slate-300")}>
                            {acao.status === opt.value && <div className="w-2 h-2 rounded-full bg-white" />}
                          </div>
                          <span className={cn("text-sm font-semibold", acao.status === opt.value ? "text-blue-600" : "text-slate-600")}>{opt.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-5">
                    <div><label className={labelCls}>Data Limite *</label><input type="date" value={acao.dataVencimento} onChange={e => setAcao(a => ({ ...a, dataVencimento: e.target.value }))} className={inputCls} /></div>
                    <div><label className={labelCls}>Título da Ação *</label><input type="text" value={acao.titulo} onChange={e => setAcao(a => ({ ...a, titulo: e.target.value }))} placeholder="Ex: Troca de mangueira" className={inputCls} /></div>
                    <div><label className={labelCls}>Descrição Detalhada *</label><textarea value={acao.descricao} onChange={e => setAcao(a => ({ ...a, descricao: e.target.value }))} placeholder="Descreva o que deve ser feito..." rows={3} className={cn(inputCls, "resize-none")} /></div>
                    
                    <div className="flex items-center gap-3 my-2"><div className="flex-1 h-px bg-slate-200" /><span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Responsável</span><div className="flex-1 h-px bg-slate-200" /></div>
                    
                    <div><label className={labelCls}>Relacionar com Não Conformidade</label><select value={acao.numNaoConformidade} onChange={e => setAcao(a => ({ ...a, numNaoConformidade: e.target.value }))} className={inputCls}><option value="">-</option>{itensNaoConformes.map((nc, i) => <option key={nc.idItem} value={nc.idItem}>{i+1} - {nc.idItem}</option>)}</select></div>
                    <div><label className={labelCls}>Empresa Responsável *</label><input type="text" value={acao.empresaResponsavel} onChange={e => setAcao(a => ({ ...a, empresaResponsavel: e.target.value }))} placeholder="Empresa responsável" className={inputCls} /></div>
                    <div><label className={labelCls}>Nome do Responsável *</label><input type="text" value={acao.nomeResponsavel} onChange={e => setAcao(a => ({ ...a, nomeResponsavel: e.target.value }))} placeholder="Nome do técnico/encarregado" className={inputCls} /></div>
                    <div><label className={labelCls}>Copiar E-mail(s)</label><input type="text" value={acao.emailsCopia} onChange={e => setAcao(a => ({ ...a, emailsCopia: e.target.value }))} placeholder="emails separados por vírgula" className={inputCls} /></div>
                  </div>
                </div>
              )}
            </div>

            <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-50/90 backdrop-blur-md border-t border-slate-200 px-6 py-4">
              <button disabled={(tab === 'checklist' ? !canFinishChecklist : !canSaveAcao) || geoLoading}
                onClick={() => {
                  if (tab === 'checklist') { if (temNaoConformidade) setTab('acao'); else { setCodigoGerado(gerarCodigoInspecao()); setSuccessModal(true) } }
                  else { setCodigoGerado(gerarCodigoInspecao()); setSuccessModal(true) }
                }}
                className={cn("w-full py-5 rounded-2xl font-black text-white flex items-center justify-center gap-3 transition-all text-sm uppercase", (tab === 'checklist' ? canFinishChecklist : canSaveAcao) ? "bg-blue-600 shadow-xl" : "bg-slate-300 cursor-not-allowed")}>
                <Zap size={20} fill="currentColor" />
                {tab === 'checklist' ? (temNaoConformidade ? 'PRÓXIMO — AÇÃO CORRETIVA' : 'CONCLUIR INSPEÇÃO (OK)') : 'SALVAR E CONCLUIR INSPEÇÃO'}
              </button>
            </div>
          </div>
        )}

        {/* MODAL SUCESSO */}
        {successModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/95 backdrop-blur-md">
            <div className="bg-white rounded-[48px] w-full max-w-sm p-12 text-center shadow-2xl animate-in zoom-in">
              <div className="w-24 h-24 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-8 border-8 border-white shadow-xl"><CheckCircle size={48} /></div>
              <h3 className="text-3xl font-black text-slate-900 mb-2 uppercase italic leading-none">Sucesso!</h3>
              <p className="text-[11px] text-slate-400 font-bold mb-10 uppercase tracking-widest">Inspeção #{codigoGerado} salva.</p>
              <button className="w-full py-5 bg-[#041628] text-white rounded-2xl font-black uppercase text-[10px] tracking-widest" onClick={handleReset}>PRÓXIMO EQUIPAMENTO →</button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}