'use client'

import { useState, useCallback, useRef, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'

// Layout e Utils
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { mockEquipamentos, mockChecklistTemplates } from '@/lib/mock-data'
import { useGeolocation } from '@/hooks/useGeolocation'
import { gerarCodigoInspecao } from '@/lib/utils'

// Tipos e Ícones
import { MapPin, CheckCircle, RotateCcw, ChevronLeft, Zap } from 'lucide-react'
import type { Equipamento, RespostaChecklist, ChecklistTemplate } from '@/types'

const QrScanner = dynamic(() => import('@/components/inspecao/QrScanner').then(m => m.QrScanner), {
  ssr: false
})

export default function InspecaoPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  
  // Estados
  const [equipamento, setEquipamento] = useState<Equipamento | null>(null)
  const [respostas, setRespostas] = useState<RespostaChecklist[]>([])
  const [successModal, setSuccessModal] = useState(false)
  const [codigoGerado, setCodigoGerado] = useState('')
  const [scanKey, setScanKey] = useState(0)

  const { coords, capture: captureGeo, loading: geoLoading } = useGeolocation()
  const equipamentoRef = useRef<Equipamento | null>(null)

  // Garante que o componente só renderize no cliente (mata o erro de Hydration)
  useEffect(() => {
    setMounted(true)
  }, [])

  // Lógica de Seleção corrigida para a sua interface RespostaChecklist
  const handleToggleResposta = useCallback((idItem: string, valor: 'OK' | 'NC') => {
    setRespostas(prev => {
      const existeIndex = prev.findIndex(r => r.idItem === idItem)
      // Mapeando para bater com sua interface: 'ok' | 'nao_conforme' e valor: 'OK' | 'NC'
      const novaResposta: RespostaChecklist = {
        idItem,
        valor,
        resposta: valor === 'OK' ? 'ok' : 'nao_conforme'
      }

      if (existeIndex > -1) {
        const novoArray = [...prev]
        novoArray[existeIndex] = novaResposta
        return novoArray
      }
      return [...prev, novaResposta]
    })
  }, [])

  const handleScan = useCallback((scannedValue: string) => {
    if (equipamentoRef.current) return
    const found = mockEquipamentos.find(
      (e) => e.uuid === scannedValue || e.codigo.toLowerCase() === scannedValue.toLowerCase()
    ) as Equipamento
    
    if (found) {
      equipamentoRef.current = found
      setEquipamento(found)
      captureGeo()
    }
  }, [captureGeo])

  const handleReset = () => {
    equipamentoRef.current = null
    setEquipamento(null)
    setRespostas([])
    setScanKey(k => k + 1)
    setSuccessModal(false)
  }

  const template = useMemo(() => {
    if (!equipamento) return null
    return (mockChecklistTemplates.find((t) => t.tipoEquipamento === equipamento.tipo) || mockChecklistTemplates[0]) as ChecklistTemplate
  }, [equipamento])

  const totalItens = template?.itens?.length || 0
  const respondidosCount = respostas.length
  const progresso = totalItens > 0 ? (respondidosCount / totalItens) * 100 : 0

  // Se não estiver montado, não renderiza nada para evitar erro de servidor/cliente
  if (!mounted) return null

  return (
    <DashboardLayout title="Nova Inspeção" breadcrumb="SIGS / Inspeção / Nova">
      <style>{`
        .btn-option { padding: 8px 16px; border-radius: 10px; font-size: 11px; font-weight: 800; border: 1px solid #e2e8f0; color: #94a3b8; transition: 0.2s; cursor: pointer; background: white; }
        .active-ok { background: #dcfce7 !important; border-color: #22c55e !important; color: #16a34a !important; }
        .active-nc { background: #fee2e2 !important; border-color: #ef4444 !important; color: #dc2626 !important; }
        .check-card { background: white; border: 1px solid #f1f5f9; border-radius: 16px; padding: 16px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
      `}</style>

      <div className="max-w-[560px] mx-auto pb-12 font-sans">
        {!equipamento ? (
          <div className="p-8 bg-[#020b18] rounded-[28px]">
            <h2 className="text-white font-black text-2xl mb-4 uppercase tracking-tighter">Leitura de Campo</h2>
            <QrScanner key={scanKey} onScan={handleScan} />
            <button className="w-full mt-6 py-3 border border-white/10 rounded-xl text-white/40 text-xs font-bold" onClick={() => router.back()}>CANCELAR</button>
          </div>
        ) : (
          <div className="rounded-[24px] overflow-hidden border border-slate-200 shadow-2xl bg-white">
            <div className="bg-[#041628] p-8 text-white">
              <span className="text-[10px] opacity-50 uppercase font-bold tracking-widest">Equipamento Identificado</span>
              <h1 className="text-4xl font-black tracking-tighter">{equipamento.codigo}</h1>
              <div className="flex gap-4 mt-4 pt-4 border-t border-white/10 text-[11px] font-bold opacity-70">
                <span>BASE: {equipamento.base}</span>
                <span>TIPO: {equipamento.tipo}</span>
              </div>
            </div>

            <div className="p-6 bg-slate-50">
              {/* Barra de Progresso */}
              <div className="flex justify-between items-end mb-2">
                <span className="text-[10px] font-black text-slate-400 uppercase">Progresso da Inspeção</span>
                <span className="text-sm font-black text-blue-600 font-mono">{respondidosCount}/{totalItens}</span>
              </div>
              <div className="h-2 w-full bg-slate-200 rounded-full mb-8 overflow-hidden">
                <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${progresso}%` }} />
              </div>

              {/* LISTA DE PERGUNTAS CORRIGIDA */}
              <div className="space-y-3 mb-8">
                {template?.itens.map((item) => {
                  const r = respostas.find(res => res.idItem === item.id)
                  return (
                    <div key={item.id} className="check-card">
                      <div className="max-w-[65%]">
                        <h4 className="text-sm font-bold text-slate-800 leading-tight">{item.pergunta}</h4>
                        {item.descricao && <p className="text-[10px] text-slate-400 mt-1 uppercase">{item.descricao}</p>}
                      </div>
                      <div className="flex gap-2">
                        <button 
                          type="button"
                          onClick={() => handleToggleResposta(item.id, 'OK')}
                          className={`btn-option ${r?.valor === 'OK' ? 'active-ok' : ''}`}
                        >OK</button>
                        <button 
                          type="button"
                          onClick={() => handleToggleResposta(item.id, 'NC')}
                          className={`btn-option ${r?.valor === 'NC' ? 'active-nc' : ''}`}
                        >NC</button>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* GPS */}
              <div className="flex items-center gap-3 p-4 bg-white border border-slate-200 rounded-2xl mb-6 shadow-sm">
                <MapPin size={18} className={coords ? "text-green-500" : "text-blue-500"} />
                <div className="text-[10px]">
                  <p className="text-slate-400 font-bold uppercase">Coordenadas de Campo</p>
                  <p className="text-slate-900 font-mono">{coords ? `${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}` : 'Sincronizando satélites...'}</p>
                </div>
              </div>

              <button 
                className={`w-full py-5 rounded-2xl font-black text-white flex items-center justify-center gap-2 transition-all ${
                  respondidosCount < totalItens ? 'bg-slate-300' : 'bg-orange-600 shadow-lg shadow-orange-200'
                }`}
                disabled={respondidosCount < totalItens || geoLoading}
                onClick={() => {
                  setCodigoGerado(gerarCodigoInspecao())
                  setSuccessModal(true)
                }}
              >
                <Zap size={18} fill="currentColor" />
                {respondidosCount < totalItens ? 'PREENCHA TODO O CHECKLIST' : 'CONFIRMAR INSPEÇÃO'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL DE SUCESSO */}
      {successModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/90 backdrop-blur-md">
          <div className="bg-white rounded-[32px] w-full max-w-sm p-8 text-center shadow-2xl scale-in-center">
             <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-white shadow-xl">
               <CheckCircle size={40} />
             </div>
             <p className="text-[10px] font-mono text-slate-400 mb-2 uppercase tracking-widest">Registro Gerado: #{codigoGerado}</p>
             <h3 className="text-2xl font-black uppercase text-slate-900 leading-none mb-6">Inspeção Finalizada</h3>
             <button className="w-full py-4 bg-[#041628] text-white rounded-2xl font-bold uppercase text-xs tracking-widest" onClick={handleReset}>
               Próximo Equipamento →
             </button>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}