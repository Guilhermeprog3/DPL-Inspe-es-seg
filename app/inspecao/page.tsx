'use client'
import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardHeader, CardTitle, Button, Alert, Badge, Modal } from '@/components/ui'
import { QrScanner } from '@/components/inspecao/QrScanner'
import { ChecklistForm } from '@/components/inspecao/ChecklistForm'
import { mockEquipamentos, mockChecklistTemplates, mockInspecoes } from '@/lib/mock-data'
import { useGeolocation } from '@/hooks/useGeolocation'
import { formatDateTime, gerarCodigoInspecao } from '@/lib/utils'
import type { Equipamento, RespostaChecklist } from '@/types'
import { MapPin, CheckCircle } from 'lucide-react'

export default function InspecaoPage() {
  const [equipamento, setEquipamento] = useState<Equipamento | null>(null)
  const [respostas, setRespostas] = useState<RespostaChecklist[]>([])
  const [observacoes, setObservacoes] = useState('')
  const [successModal, setSuccessModal] = useState(false)
  const [codigoGerado, setCodigoGerado] = useState('')
  const { coords, capture: captureGeo, loading: geoLoading } = useGeolocation()

  function handleScan(codigo: string) {
    const found = mockEquipamentos.find(
      (e) => e.codigo.toLowerCase() === codigo.toLowerCase()
    )
    setEquipamento(found ?? mockEquipamentos[0])
    captureGeo()
  }

  function handleSalvar() {
    const codigo = gerarCodigoInspecao()
    setCodigoGerado(codigo)
    setSuccessModal(true)
  }

  const template = equipamento
    ? mockChecklistTemplates.find((t) => t.tipoEquipamento === equipamento.tipo)
      ?? mockChecklistTemplates[0]
    : null

  const statusMap = {
    aprovado:  { label: 'Aprovado',  variant: 'ok'    as const },
    atencao:   { label: 'Atenção',   variant: 'alert' as const },
    reprovado: { label: 'Reprovado', variant: 'error' as const },
    pendente:  { label: 'Pendente',  variant: 'muted' as const },
  }

  return (
    <DashboardLayout title="Nova Inspeção" breadcrumb="SIGS / Inspeção / Nova">
      <div className="grid grid-cols-2 gap-5 items-start">
        {/* Left column */}
        <div className="space-y-4">
          {/* Scanner card */}
          <Card>
            <CardHeader>
              <CardTitle>📷 Escanear QR Code</CardTitle>
            </CardHeader>
            <QrScanner onScan={handleScan} />
          </Card>

          {/* Equipment + checklist */}
          {equipamento && template && (
            <Card>
              {/* Header gradient */}
              <div className="bg-gradient-to-br from-[#094780] to-[#1a6ab5] rounded-xl p-5 mb-4 text-white">
                <p className="font-condensed text-2xl font-bold">
                  {equipamento.codigo} — {equipamento.tipo} {equipamento.capacidade}
                </p>
                <p className="text-sm opacity-75 mt-1">
                  Ponto: {equipamento.pontoInstalacao}
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {[
                    `${equipamento.uf} · ${equipamento.regional}`,
                    `Fabricação: ${equipamento.fabricacao}`,
                    `Próx. insp.: ${equipamento.proximaInspecao}`,
                  ].map((chip) => (
                    <span key={chip} className="bg-white/18 px-3 py-0.5 rounded-full text-xs font-semibold">
                      {chip}
                    </span>
                  ))}
                </div>
              </div>

              <p className="text-[11px] font-semibold text-[#6b7a90] uppercase tracking-wide mb-2">
                Checklist de Inspeção
              </p>
              <ChecklistForm itens={template.itens} onChange={setRespostas} />

              <div className="mt-4 space-y-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold text-[#6b7a90] uppercase tracking-wide">
                    Observações
                  </label>
                  <textarea
                    rows={2}
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    placeholder="Observações adicionais..."
                    className="w-full px-3 py-2 border-[1.5px] border-[#dde3ec] rounded-lg text-sm resize-none focus:outline-none focus:border-[#094780]"
                  />
                </div>

                {coords ? (
                  <Alert variant="success">
                    <MapPin size={13} className="inline mr-1" />
                    GPS capturado: {coords.latitude.toFixed(4)}, {coords.longitude.toFixed(4)}
                  </Alert>
                ) : (
                  <Alert variant="info">
                    Geolocalização GPS será capturada automaticamente ao salvar
                  </Alert>
                )}

                <Button
                  variant="orange"
                  size="lg"
                  className="w-full"
                  onClick={handleSalvar}
                  loading={geoLoading}
                >
                  <CheckCircle size={16} />
                  Salvar Inspeção
                </Button>
              </div>
            </Card>
          )}
        </div>

        {/* Right column — recent */}
        <Card>
          <CardHeader>
            <CardTitle>Minhas Inspeções Recentes</CardTitle>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#dde3ec]">
                  {['ID', 'Tipo', 'Status', 'Hora'].map((h) => (
                    <th key={h} className="text-left pb-2 text-[11px] font-semibold uppercase tracking-wide text-[#6b7a90] px-2 first:pl-0">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {mockInspecoes.map((ins) => {
                  const s = statusMap[ins.status]
                  return (
                    <tr key={ins.id} className="border-b border-[#dde3ec] last:border-0 hover:bg-[#f8faff]">
                      <td className="py-2.5 px-2 first:pl-0 font-semibold">{ins.equipamentoCodigo}</td>
                      <td className="py-2.5 px-2 text-[#6b7a90] text-xs">{ins.equipamentoId}</td>
                      <td className="py-2.5 px-2"><Badge variant={s.variant} dot>{s.label}</Badge></td>
                      <td className="py-2.5 px-2 text-[#6b7a90] text-xs">{formatDateTime(ins.data)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Success modal */}
      <Modal
        open={successModal}
        onClose={() => setSuccessModal(false)}
        title="Inspeção Registrada!"
      >
        <div className="text-center">
          <div className="w-14 h-14 bg-green-500/12 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={28} className="text-green-600" />
          </div>
          <p className="text-sm text-[#6b7a90] mb-4">
            {equipamento?.codigo} inspecionado com sucesso. GPS e timestamp gravados.
          </p>
          <Alert variant="info" className="text-left mb-4">
            <div className="space-y-0.5 text-xs">
              <p><strong>ID Inspeção:</strong> {codigoGerado}</p>
              <p><strong>Inspetor:</strong> João Silva · PI · Metropolitana</p>
              {coords && <p><strong>GPS:</strong> {coords.latitude.toFixed(4)}, {coords.longitude.toFixed(4)}</p>}
              <p><strong>Timestamp:</strong> {formatDateTime(new Date())}</p>
            </div>
          </Alert>
          <Button className="w-full" onClick={() => setSuccessModal(false)}>Fechar</Button>
        </div>
      </Modal>
    </DashboardLayout>
  )
}
