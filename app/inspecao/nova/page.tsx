'use client'

import { useState, useCallback } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardHeader, CardTitle, Button, Alert, Modal, Badge } from '@/components/ui'
import { ChecklistForm } from '@/components/inspecao/ChecklistForm'
import { mockEquipamentos, mockChecklistTemplates } from '@/lib/mock-data'
import { useGeolocation } from '@/hooks/useGeolocation'
import { formatDateTime, gerarCodigoInspecao } from '@/lib/utils'
import type { Equipamento, RespostaChecklist } from '@/types'
import { MapPin, CheckCircle, QrCode, RotateCcw, ChevronLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

// Import dinâmico crucial para evitar erro 'window is not defined'
import dynamic from 'next/dynamic'
const QrScanner = dynamic(() => import('@/components/inspecao/QrScanner').then(m => m.QrScanner), { 
  ssr: false 
})

export default function InspecaoPage() {
  const router = useRouter()
  const [equipamento, setEquipamento] = useState<Equipamento | null>(null)
  const [respostas, setRespostas] = useState<RespostaChecklist[]>([])
  const [successModal, setSuccessModal] = useState(false)
  const [codigoGerado, setCodigoGerado] = useState('')
  const { coords, capture: captureGeo, loading: geoLoading } = useGeolocation()

  const handleScan = useCallback((scannedValue: string) => {
    if (equipamento) return;

    const found = mockEquipamentos.find(
      (e) => e.uuid === scannedValue || e.codigo.toLowerCase() === scannedValue.toLowerCase()
    )

    if (found) {
      setEquipamento(found)
      captureGeo()
      if (navigator.vibrate) navigator.vibrate(200)
    }
  }, [equipamento, captureGeo])

  function handleSalvar() {
    setCodigoGerado(gerarCodigoInspecao())
    setSuccessModal(true)
  }

  const template = equipamento
    ? mockChecklistTemplates.find((t) => t.tipoEquipamento === equipamento.tipo) || mockChecklistTemplates[0]
    : null

  return (
    <DashboardLayout title="Nova Inspeção" breadcrumb="SIGS / Inspeção / Nova">
      <div className="max-w-[600px] mx-auto space-y-4 pb-10">
        
        {/* Botão de Voltar Geral (sempre visível no topo) */}
        {!equipamento && (
          <button 
            onClick={() => router.back()}
            className="flex items-center gap-1 text-sm font-semibold text-[#6b7a90] hover:text-[#094780] transition-colors mb-2"
          >
            <ChevronLeft size={18} />
            Voltar ao início
          </button>
        )}

        {!equipamento ? (
          <Card className="border-none shadow-none bg-transparent">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-[#0d1e33]">Leitura de Equipamento</h2>
              <p className="text-sm text-[#6b7a90]">Aproxime a câmera do adesivo QR Code</p>
            </div>
            
            <QrScanner onScan={handleScan} />

            {/* Botão secundário de cancelamento/voltar abaixo do scanner */}
            <div className="mt-6">
              <Button 
                variant="ghost" 
                className="w-full text-[#6b7a90]" 
                onClick={() => router.push('/equipamentos')}
              >
                Cancelar e voltar ao inventário
              </Button>
            </div>
          </Card>
        ) : (
          <div className="flex justify-start">
            <Button 
              variant="ghost" 
              className="text-xs flex gap-2 items-center text-[#094780] hover:bg-blue-50"
              onClick={() => { setEquipamento(null); setRespostas([]); }}
            >
              <RotateCcw size={14} /> Escanear outro item
            </Button>
          </div>
        )}

        {equipamento && template && (
          <Card className="overflow-hidden border-none shadow-xl animate-in fade-in zoom-in-95 duration-300">
            {/* Cabeçalho do Equipamento */}
            <div className="bg-[#094780] p-6 text-white">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <Badge className="bg-white/20 text-white border-none mb-2 px-3 py-1">
                    {equipamento.status === 'vencido' ? 'VENCIDO' : 'EM DIA'}
                  </Badge>
                  <h2 className="text-3xl font-black tracking-tighter leading-none">{equipamento.codigo}</h2>
                </div>
                <div className="text-right">
                  <p className="text-xs opacity-70 font-bold uppercase tracking-widest text-white/80">Regional</p>
                  <p className="font-bold">{equipamento.regional}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                 <div>
                    <p className="text-[10px] uppercase opacity-60 font-bold tracking-widest">Base</p>
                    <p className="text-sm font-semibold">{equipamento.base}</p>
                 </div>
                 <div>
                    <p className="text-[10px] uppercase opacity-60 font-bold tracking-widest">Tipo</p>
                    <p className="text-sm font-semibold">{equipamento.tipo}</p>
                 </div>
              </div>
            </div>

            <div className="p-6">
              <ChecklistForm itens={template.itens} onChange={setRespostas} />

              <div className="mt-8 space-y-4">
                <Alert variant={coords ? "success" : "info"} className="border-none bg-gray-50">
                  <MapPin size={16} className={coords ? "text-green-600" : "text-blue-600"} />
                  <span className="text-xs font-bold text-gray-600 ml-2">
                    {coords 
                      ? `GPS: ${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`
                      : "Capturando localização precisa..."}
                  </span>
                </Alert>

                <Button
                  variant="orange"
                  size="lg"
                  className="w-full py-7 text-lg font-black uppercase tracking-wide shadow-lg"
                  onClick={handleSalvar}
                  disabled={respostas.length < template.itens.length}
                  loading={geoLoading}
                >
                  Confirmar Inspeção
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>

      <Modal open={successModal} onClose={() => window.location.reload()} title="Registrado!">
        <div className="text-center p-2">
           <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-green-500">
              <CheckCircle size={40} className="text-green-600" />
           </div>
           <h3 className="text-xl font-black text-[#0d1e33] uppercase tracking-tight">Inspeção Finalizada</h3>
           <p className="text-sm text-[#6b7a90] mt-2 mb-6">
             Relatório enviado para a base <strong>{equipamento?.base}</strong>.
           </p>
           <Button className="w-full py-6" onClick={() => window.location.reload()}>Próximo Equipamento</Button>
        </div>
      </Modal>
    </DashboardLayout>
  )
}