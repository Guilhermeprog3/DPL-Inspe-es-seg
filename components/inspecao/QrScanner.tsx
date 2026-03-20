'use client'
import { useState } from 'react'
import { Button, Input } from '@/components/ui'
import { QrCode } from 'lucide-react'

interface QrScannerProps {
  onScan: (codigo: string) => void
}

export function QrScanner({ onScan }: QrScannerProps) {
  const [manual, setManual] = useState('')

  return (
    <div>
      {/* Camera area */}
      <div
        onClick={() => onScan('EXT-001')}
        className="border-2 border-dashed border-[#dde3ec] rounded-xl p-8 text-center cursor-pointer
                   hover:border-[#094780] hover:bg-[#094780]/3 transition-all"
      >
        <div className="w-36 h-36 mx-auto rounded-lg bg-[#f0f4f8] border border-[#dde3ec] relative overflow-hidden flex items-center justify-center mb-4">
          {/* scan animation line */}
          <div className="qr-scan-line absolute left-0 right-0 h-0.5 bg-[#E67A0E]" />
          <QrCode size={56} className="text-[#094780]/40" />
        </div>
        <p className="text-sm font-semibold text-[#094780]">Toque para escanear</p>
        <p className="text-xs text-[#6b7a90] mt-1">ou insira o ID manualmente abaixo</p>
      </div>

      {/* Manual input */}
      <div className="flex gap-2 mt-3">
        <Input
          placeholder="ID do equipamento (ex: EXT-001)"
          value={manual}
          onChange={(e) => setManual(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && manual && onScan(manual)}
        />
        <Button
          onClick={() => manual && onScan(manual)}
          disabled={!manual}
        >
          Buscar
        </Button>
      </div>
    </div>
  )
}
