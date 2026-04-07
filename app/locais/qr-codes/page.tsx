'use client'
import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardHeader, CardTitle, Button, Select } from '@/components/ui'
import { mockEquipamentos } from '@/lib/mock-data'
import type { Equipamento } from '@/types'
import { Printer } from 'lucide-react'

// QRCode is imported dynamically to avoid SSR issues
import dynamic from 'next/dynamic'
const QRCodeSVG = dynamic(() => import('qrcode.react').then(m => m.QRCodeSVG), { ssr: false })

export default function QrCodesPage() {
  const [selected, setSelected] = useState<Equipamento | null>(null)
  const [size, setSize] = useState('medio')
  const [copies, setCopies] = useState(1)

  const qrValue = selected
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://sigs.app'}/inspecao?id=${selected.uuid}`
    : ''

  const qrPx = size === 'pequeno' ? 90 : size === 'medio' ? 120 : 150

  function handlePrint() {
    window.print()
  }

  return (
    <DashboardLayout title="QR Codes" breadcrumb="SIGS / Etiquetas / Gerador">
      <div className="grid grid-cols-2 gap-5 items-start">
        {/* Config */}
        <Card>
          <CardHeader><CardTitle>Gerador de Etiquetas QR</CardTitle></CardHeader>
          <div className="space-y-4">
            <Select
              label="Equipamento"
              onChange={(e) => {
                const eq = mockEquipamentos.find((x) => x.id === e.target.value)
                setSelected(eq ?? null)
              }}
            >
              <option value="">Selecione...</option>
              {mockEquipamentos.map((eq) => (
                <option key={eq.id} value={eq.id}>
                  {eq.codigo} — {eq.tipo} · {eq.pontoInstalacao}
                </option>
              ))}
            </Select>

            <Select label="Tamanho da Etiqueta" value={size} onChange={(e) => setSize(e.target.value)}>
              <option value="pequeno">Pequena (5×5cm)</option>
              <option value="medio">Média (8×8cm)</option>
              <option value="grande">Grande (10×10cm)</option>
            </Select>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold text-[#6b7a90] uppercase tracking-wide">
                Quantidade de Cópias
              </label>
              <input
                type="number"
                min={1}
                max={50}
                value={copies}
                onChange={(e) => setCopies(Number(e.target.value))}
                className="w-full px-3 py-2.5 border-[1.5px] border-[#dde3ec] rounded-lg text-sm focus:outline-none focus:border-[#094780]"
              />
            </div>

            <Button
              variant="primary"
              size="lg"
              className="w-full"
              disabled={!selected}
              onClick={handlePrint}
            >
              <Printer size={16} /> Imprimir Etiqueta
            </Button>
          </div>
        </Card>

        {/* Preview */}
        <Card className="flex flex-col items-center py-8">
          <p className="text-[11px] font-semibold text-[#6b7a90] uppercase tracking-[1px] mb-6">
            Pré-visualização
          </p>
          <div className="border-2 border-[#dde3ec] rounded-xl p-5 text-center bg-white w-[180px]">
            <div className="bg-[#094780] text-white font-condensed text-[9px] font-bold tracking-widest px-2 py-1 rounded mb-3">
              SIGS · SEGURANÇA
            </div>
            <div className="flex items-center justify-center w-[120px] h-[120px] mx-auto mb-2 border border-[#dde3ec] rounded">
              {selected ? (
                <QRCodeSVG value={qrValue} size={qrPx} />
              ) : (
                <p className="text-[10px] text-[#939393]">QR Code</p>
              )}
            </div>
            <p className="font-condensed text-lg font-bold text-[#094780]">
              {selected?.codigo ?? 'EXT-001'}
            </p>
            <p className="text-[9px] text-[#939393] uppercase">
              {selected?.tipo ?? 'Extintor PQS'}
            </p>
            <p className="text-[8px] text-[#939393]">
              {selected ? `${selected.uf} · ${selected.regional}` : 'PI · METROPOLITANA'}
            </p>
          </div>
          <p className="text-xs text-[#6b7a90] mt-4 text-center">
            Gerado com <code className="text-[10px]">qrcode.react</code>
            <br />Impresso com <code className="text-[10px]">react-to-print</code>
          </p>
        </Card>
      </div>
    </DashboardLayout>
  )
}
