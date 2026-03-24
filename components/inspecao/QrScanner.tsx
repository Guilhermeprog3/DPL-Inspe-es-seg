'use client'

import { useRef } from 'react'
import { QrReader } from '@blackbox-vision/react-qr-reader'
import { Html5Qrcode } from 'html5-qrcode'
import { ImageIcon } from 'lucide-react'

interface QrScannerProps {
  onScan: (data: string) => void
}

export function QrScanner({ onScan }: QrScannerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Função para limpar e validar o texto (Extrai ID de URLs se necessário)
  const parseScannedText = (text: string) => {
    const trimmed = text.trim()
    try {
      const url = new URL(trimmed)
      return url.searchParams.get('id') || trimmed
    } catch {
      return trimmed
    }
  }

  // Lógica para processar o arquivo de imagem carregado
  const processFile = async (file: File) => {
    // Criamos um elemento temporário para o processador de arquivos do html5-qrcode
    const containerId = "qr-file-processor-temp"
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
      const finalCode = parseScannedText(result)
      onScan(finalCode)
    } catch (err) {
      alert("Não foi possível detectar um QR Code nesta imagem. Tente uma foto mais clara.")
    }
  }

  return (
    <div className="relative w-full h-full bg-black group">
      {/* Leitor de Câmera Real-time */}
      <QrReader
        onResult={(result: any) => {
          if (result) {
            onScan(parseScannedText(result.getText()))
          }
        }}
        constraints={{ facingMode: 'environment' }}
        containerStyle={{ width: '100%', height: '100%' }}
        videoStyle={{ 
          width: '100%', 
          height: '100%', 
          objectFit: 'cover' 
        }}
      />

      {/* Input de arquivo escondido */}
      <input 
        type="file" 
        ref={fileInputRef} 
        hidden 
        accept="image/*" 
        onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])} 
      />

      {/* Botão Flutuante de Upload (Opcional, aparece sobre a câmera) */}
      <button 
        onClick={() => fileInputRef.current?.click()}
        className="absolute bottom-4 right-4 z-20 p-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white hover:bg-white/20 transition-all"
        title="Upload de foto"
      >
        <ImageIcon size={24} />
      </button>

      {/* Overlay de Guia (Visual apenas) */}
      <div className="absolute inset-0 border-[40px] border-black/40 pointer-events-none flex items-center justify-center">
        <div className="w-64 h-64 border-2 border-blue-500/50 rounded-3xl" />
      </div>
    </div>
  )
}