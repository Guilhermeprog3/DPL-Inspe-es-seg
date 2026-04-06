'use client'

import { useState, useCallback, useRef, useMemo, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { useSession } from 'next-auth/react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { mockChecklistTemplates } from '@/lib/mock-data'
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

type TabKey = 'qrcode' | 'checklist' | 'acao'

export default function InspecaoPage() {
  const { data: session } = useSession()
  const [mounted, setMounted] = useState(false)
  const [tab, setTab] = useState<TabKey>('qrcode')
  const [loadingQr, setLoadingQr] = useState(false)
  
  // Dados vindos do Banco via QR
  const [pontoData, setPontoData] = useState<any | null>(null)
  const [equipamentoPonto, setEquipamentoPonto] = useState<any | null>(null)
  
  const [respostas, setRespostas] = useState<RespostaChecklist[]>([])
  const [successModal, setSuccessModal] = useState(false)
  const [codigoGerado, setCodigoGerado] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [idManual, setIdManual] = useState('')

  const { capture: captureGeo, loading: geoLoading } = useGeolocation()
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { setMounted(true) }, [])

  // ── Integração: Buscar dados do Ponto/Equipamento pelo Código ──
  const handleScan = useCallback(async (val: string) => {
    if (!val || loadingQr) return
    setLoadingQr(true)
    try {
      const token = (session as any)?.accessToken
      // Chamada para a rota que você tem no Controller de Pontos
      const res = await fetch(`http://localhost:3001/pontos/qrcode/${val}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (!res.ok) throw new Error('Ponto não encontrado')
      
      const data = await res.json()
      setPontoData(data)
      setEquipamentoPonto(data.equipamentoAtual)
      captureGeo()
      setTab('checklist') // Avança automaticamente ao ler
    } catch (err) {
      alert('QR Code inválido ou Ponto de Instalação não cadastrado.')
    } finally {
      setLoadingQr(false)
    }
  }, [session, captureGeo, loadingQr])

  // ── Integração: Salvar Inspeção no Backend ──
  async function handleFinalizar() {
    if (isSaving || !checklistOk) return
    setIsSaving(true)
    try {
      const token = (session as any)?.accessToken
      
      // Define o status baseado nas respostas
      const temNC = respostas.some(r => r.resposta === 'nao_conforme')
      const statusFinal = temNC ? 'ATENCAO' : 'APROVADO'

      const payload = {
        pontoId: pontoData.id,
        equipamentoId: equipamentoPonto.id,
        status: statusFinal,
        respostas: respostas, // O NestJS vai fazer o JSON.stringify
      }

      const res = await fetch('http://localhost:3001/inspecoes', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(payload),
      })

      if (!res.ok) throw new Error()
      
      const result = await res.json()
      setCodigoGerado(result.id.substring(0,8).toUpperCase())
      setSuccessModal(true)
    } catch (error) {
      alert('Erro ao salvar inspeção no servidor.')
    } finally {
      setIsSaving(false)
    }
  }

  // Lógica de Checklist
  const handleToggleResposta = (idItem: string, valor: string) => {
    setRespostas(prev => {
      const idx = prev.findIndex(r => r.idItem === idItem)
      const nova = { idItem, resposta: valor as any, valor: valor.toUpperCase() } as RespostaChecklist
      if (idx > -1) { const arr = [...prev]; arr[idx] = nova; return arr }
      return [...prev, nova]
    })
  }

  const template = useMemo(() => {
    if (!equipamentoPonto) return mockChecklistTemplates[0]
    return mockChecklistTemplates.find(t => t.tipoEquipamento === equipamentoPonto.tipo) || mockChecklistTemplates[0]
  }, [equipamentoPonto])

  const checklistOk = respostas.length >= (template?.itens.length || 0)

  const inputCls = "w-full bg-[#f8fafc] border border-[#e3e8ef] rounded-lg h-10 px-3 text-[13.5px] outline-none focus:border-[#3d6cf0] transition-all"
  const sectionTitleCls = 'text-[11px] font-bold uppercase tracking-widest text-[#9ca3af] px-6 py-3 bg-[#f8fafc] border-b border-[#e3e8ef]'

  if (!mounted) return null

  return (
    <DashboardLayout title="Executar Inspeção">
      <div className="w-full flex flex-col bg-[#f4f6f9] min-h-[calc(100vh-60px)]">

        {/* Breadcrumb */}
        <div className="bg-white border-b border-[#e3e8ef] px-7 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[13px] text-[#9ca3af]">
            <ArrowLeft size={14} /> <span className="font-medium">Inspeções</span>
            <span className="text-[11px]">›</span>
            <span className="text-[#3d6cf0] font-bold">Nova Vistoria</span>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-8 pt-6 pb-28">
          
          {/* ETAPA 1: LEITURA */}
          {tab === 'qrcode' && (
            <div className="max-w-md mx-auto space-y-4 animate-in fade-in slide-in-from-bottom-4">
              <div className="bg-white border border-[#e3e8ef] rounded-2xl shadow-sm overflow-hidden p-6 text-center">
                <QrCode size={40} className="mx-auto text-blue-500 mb-4" />
                <h2 className="text-lg font-black text-slate-800">Escaneie o Ponto</h2>
                <p className="text-sm text-slate-500 mb-6">Aponte a câmera para o QR Code fixado no local de instalação.</p>
                
                <div className="aspect-square bg-slate-900 rounded-2xl overflow-hidden relative mb-6">
                   {loadingQr ? (
                     <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 z-20">
                        <Loader2 className="animate-spin text-white" size={40} />
                     </div>
                   ) : (
                     <QrScanner onScan={handleScan} />
                   )}
                </div>

                <div className="flex gap-2">
                  <input 
                    className={inputCls} 
                    placeholder="Ou digite o código manualmente..." 
                    value={idManual} 
                    onChange={e => setIdManual(e.target.value)} 
                  />
                  <button 
                    onClick={() => handleScan(idManual)}
                    className="px-4 bg-slate-800 text-white rounded-lg font-bold text-xs"
                  >OK</button>
                </div>
              </div>
            </div>
          )}

          {/* ETAPA 2: CHECKLIST */}
          {tab === 'checklist' && (
            <div className="max-w-2xl mx-auto space-y-4 animate-in fade-in">
              <div className="bg-white border border-[#e3e8ef] rounded-2xl shadow-sm overflow-hidden">
                <div className={sectionTitleCls}>Identificação do Local</div>
                <div className="p-6 flex items-center justify-between">
                   <div>
                     <p className="text-xs font-bold text-blue-600 uppercase">{pontoData?.qrCode}</p>
                     <h3 className="text-lg font-black text-slate-800">{pontoData?.nome}</h3>
                     <p className="text-xs text-slate-400">{pontoData?.regional} · {pontoData?.base}</p>
                   </div>
                   <div className="text-right">
                     <span className="text-[10px] font-black bg-slate-100 px-2 py-1 rounded text-slate-500">
                       {equipamentoPonto?.tipo || 'SEM EQUIPAMENTO'}
                     </span>
                   </div>
                </div>
              </div>

              <div className="bg-white border border-[#e3e8ef] rounded-2xl shadow-sm overflow-hidden">
                <div className={sectionTitleCls}>Itens de Inspeção</div>
                <div className="divide-y divide-slate-50">
                  {template.itens.map((item, idx) => {
                    const r = respostas.find(res => res.idItem === item.id)
                    return (
                      <div key={item.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                        <div className="flex gap-3 items-center">
                          <span className="text-[10px] font-bold text-slate-300">{idx + 1}</span>
                          <p className="text-sm font-semibold text-slate-700">{item.pergunta}</p>
                        </div>
                        <div className="flex gap-1">
                          <button 
                            onClick={() => handleToggleResposta(item.id, 'ok')}
                            className={cn("w-10 h-10 rounded-xl border-2 flex items-center justify-center transition-all", r?.resposta === 'ok' ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-100 text-slate-300")}
                          ><CheckCircle2 size={18} /></button>
                          <button 
                            onClick={() => handleToggleResposta(item.id, 'nao_conforme')}
                            className={cn("w-10 h-10 rounded-xl border-2 flex items-center justify-center transition-all", r?.resposta === 'nao_conforme' ? "bg-red-500 border-red-500 text-white" : "border-slate-100 text-slate-300")}
                          ><XCircle size={18} /></button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Rodapé Fixo */}
        {tab === 'checklist' && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 flex justify-center z-40">
             <div className="max-w-2xl w-full flex justify-between items-center">
                <button onClick={() => setTab('qrcode')} className="text-xs font-bold text-slate-400">ABORTAR</button>
                <button 
                  disabled={!checklistOk || isSaving}
                  onClick={handleFinalizar}
                  className={cn("px-10 py-3 rounded-2xl font-black text-sm text-white shadow-lg transition-all", checklistOk ? "bg-blue-600 shadow-blue-200" : "bg-slate-200")}
                >
                  {isSaving ? <Loader2 className="animate-spin" /> : "FINALIZAR INSPEÇÃO"}
                </button>
             </div>
          </div>
        )}

        {/* Modal Sucesso */}
        {successModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white p-10 rounded-[40px] text-center shadow-2xl max-w-sm mx-4 animate-in zoom-in-95">
              <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle size={40} className="text-emerald-500" />
              </div>
              <h3 className="font-black text-xl text-slate-800">Enviado com Sucesso!</h3>
              <p className="text-slate-500 text-sm mt-2 mb-8">O protocolo <strong>#{codigoGerado}</strong> foi gerado e salvo no histórico do local.</p>
              <button 
                onClick={() => window.location.reload()}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs tracking-widest hover:bg-black transition-all"
              >
                REALIZAR NOVA LEITURA
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}