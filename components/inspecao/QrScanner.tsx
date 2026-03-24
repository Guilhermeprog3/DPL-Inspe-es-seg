'use client'

import { useState, useRef, useEffect } from 'react'
import { QrReader } from '@blackbox-vision/react-qr-reader'
import { Html5Qrcode } from 'html5-qrcode'
import { Image as ImageIcon, AlertTriangle, RefreshCw, Hash, Send } from 'lucide-react'

interface QrScannerProps {
  onScan: (data: string) => void
}

export function QrScanner({ onScan }: QrScannerProps) {
  const [loading, setLoading] = useState(true)
  const [cameraError, setCameraError] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [manualCode, setManualCode] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1500)
    return () => clearTimeout(timer)
  }, [])

  // Função centralizada para limpar o texto (extrair ID de URL ou remover espaços)
  const parseScannedText = (text: string) => {
    const trimmed = text.trim()
    try {
      const url = new URL(trimmed)
      return url.searchParams.get('id') || trimmed
    } catch {
      return trimmed
    }
  }

  const processFile = async (file: File) => {
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
      
      // Correção: Agora processa o texto do arquivo antes de enviar
      const finalCode = parseScannedText(result)
      onScan(finalCode)
    } catch {
      alert("QR Code não detectado na imagem. Tente uma foto mais nítida ou digite o código.")
    }
  }

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (manualCode.trim()) {
      onScan(manualCode.trim())
    }
  }

  return (
    <>
      <style>{`
        .qr-root { font-family: 'Syne', sans-serif; display: flex; flex-direction: column; align-items: center; gap: 20px; width: 100%; }
        .qr-status-badge { display: flex; align-items: center; gap: 6px; font-family: 'DM Mono', monospace; font-size: 9px; letter-spacing: 0.12em; text-transform: uppercase; color: rgba(9,71,128,0.45); }
        .qr-status-dot { width: 6px; height: 6px; border-radius: 50%; background: #22c55e; box-shadow: 0 0 6px rgba(34,197,94,0.6); animation: dot-pulse 2s ease-in-out infinite; }
        .qr-status-dot.loading { background: #f59e0b; }
        .qr-status-dot.error   { background: #ef4444; animation: none; }
        @keyframes dot-pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(0.75); } }
        .qr-viewport { position: relative; width: 100%; max-width: 360px; aspect-ratio: 1; border-radius: 28px; overflow: hidden; background: #060d18; box-shadow: 0 24px 64px rgba(0,0,0,0.45); }
        .qr-grid { position: absolute; inset: 0; z-index: 5; pointer-events: none; background-image: linear-gradient(rgba(59,158,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(59,158,255,0.04) 1px, transparent 1px); background-size: 36px 36px; }
        .qr-corner { position: absolute; width: 28px; height: 28px; border-color: #3b9eff; border-style: solid; z-index: 20; }
        .qr-corner.tl { top:20px; left:20px; border-width: 2.5px 0 0 2.5px; border-radius: 6px 0 0 0; }
        .qr-corner.tr { top:20px; right:20px; border-width: 2.5px 2.5px 0 0; border-radius: 0 6px 0 0; }
        .qr-corner.bl { bottom:20px; left:20px; border-width: 0 0 2.5px 2.5px; border-radius: 0 0 0 6px; }
        .qr-corner.br { bottom:20px; right:20px; border-width: 0 2.5px 2.5px 0; border-radius: 0 0 6px 0; }
        .qr-scanline { position: absolute; left: 24px; right: 24px; height: 1.5px; z-index: 15; background: linear-gradient(90deg, transparent, #3b9eff, transparent); animation: scan 2.8s linear infinite; top: 24px; }
        @keyframes scan { 0% { transform: translateY(0); opacity: 0; } 5% { opacity: 1; } 95% { opacity: 1; } 100% { transform: translateY(312px); opacity: 0; } }
        .qr-loading, .qr-error { position: absolute; inset: 0; z-index: 40; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #060d18; gap: 14px; }
        .qr-loading-label { font-family: 'DM Mono', monospace; font-size: 10px; color: rgba(255,255,255,0.35); text-transform: uppercase; }
        .qr-dropzone { width: 100%; max-width: 360px; border-radius: 20px; border: 1.5px dashed rgba(9,71,128,0.2); background: rgba(9,71,128,0.03); padding: 16px; display: flex; align-items: center; gap: 12px; cursor: pointer; transition: all 0.2s; }
        .qr-dropzone:hover { border-color: #3b9eff; background: rgba(59,158,255,0.05); }
        .qr-divider { width: 100%; max-width: 360px; display: flex; align-items: center; gap: 12px; color: rgba(9,71,128,0.2); font-size: 9px; text-transform: uppercase; font-family: 'DM Mono'; }
        .qr-divider::before, .qr-divider::after { content: ''; flex: 1; height: 1px; background: rgba(9,71,128,0.1); }
        .qr-manual-form { width: 100%; max-width: 360px; display: flex; gap: 8px; }
        .qr-input-group { flex: 1; position: relative; }
        .qr-input { width: 100%; background: white; border: 1.5px solid rgba(9,71,128,0.1); border-radius: 12px; padding: 10px 10px 10px 35px; font-family: 'DM Mono'; font-size: 13px; }
        .qr-input-icon { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: rgba(9,71,128,0.3); }
        .qr-submit-btn { background: #0f3460; color: white; border: none; border-radius: 10px; padding: 0 15px; cursor: pointer; }
      `}</style>

      <div className="qr-root">
        <div className="qr-status-badge">
          <span className={`qr-status-dot ${loading ? 'loading' : cameraError ? 'error' : ''}`} />
          {loading ? 'Iniciando câmera...' : cameraError ? 'Câmera Offline' : 'Pronto para leitura'}
        </div>

        <div className="qr-viewport">
          <div className="qr-grid" />
          <div className="qr-corner tl" /><div className="qr-corner tr" />
          <div className="qr-corner bl" /><div className="qr-corner br" />
          
          {!loading && !cameraError && <div className="qr-scanline" />}
          
          {loading && (
            <div className="qr-loading">
              <span className="qr-loading-label">Carregando Módulo...</span>
            </div>
          )}

          <QrReader
            // @ts-ignore
            onResult={(result: any) => {
              if (result) {
                onScan(parseScannedText(result.getText()))
              }
            }}
            constraints={{ facingMode: 'environment' }}
            containerStyle={{ width: '100%', height: '100%' }}
            videoStyle={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>

        <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])} />
        
        <div className="qr-dropzone" onClick={() => fileInputRef.current?.click()}>
          <ImageIcon size={18} className="text-blue-500" />
          <div>
            <p style={{fontSize: '13px', fontWeight: 700}}>Upload de Imagem</p>
            <p style={{fontSize: '9px', opacity: 0.5}}>Clique para selecionar foto</p>
          </div>
        </div>

        <div className="qr-divider">Ou</div>

        <form className="qr-manual-form" onSubmit={handleManualSubmit}>
          <div className="qr-input-group">
            <Hash className="qr-input-icon" size={14} />
            <input 
              className="qr-input" 
              placeholder="Código do equipamento..."
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
            />
          </div>
          <button type="submit" className="qr-submit-btn"><Send size={14} /></button>
        </form>
      </div>
    </>
  )
}