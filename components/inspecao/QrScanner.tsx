'use client'

import { useState, useRef, useEffect } from 'react'
import { QrReader } from '@blackbox-vision/react-qr-reader'
import { Html5Qrcode } from 'html5-qrcode'
import { Image as ImageIcon, AlertTriangle, RefreshCw } from 'lucide-react'

interface QrScannerProps {
  onScan: (data: string) => void
}

export function QrScanner({ onScan }: QrScannerProps) {
  const [loading, setLoading] = useState(true)
  const [cameraError, setCameraError] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Mesma lógica do código que funcionava: timeout simples de 1.5s
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1500)
    return () => clearTimeout(timer)
  }, [])

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
      onScan(result)
    } catch {
      alert("QR Code não detectado. Tente uma foto mais nítida ou use a câmera.")
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) await processFile(file)
  }

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) await processFile(file)
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Mono:wght@400;500&display=swap');

        .qr-root {
          font-family: 'Syne', sans-serif;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
        }

        .qr-status-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: 'DM Mono', monospace;
          font-size: 9px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(9,71,128,0.45);
        }

        .qr-status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #22c55e;
          box-shadow: 0 0 6px rgba(34,197,94,0.6);
          animation: dot-pulse 2s ease-in-out infinite;
        }
        .qr-status-dot.loading { background: #f59e0b; box-shadow: 0 0 6px rgba(245,158,11,0.6); }
        .qr-status-dot.error   { background: #ef4444; box-shadow: 0 0 6px rgba(239,68,68,0.6); animation: none; }

        @keyframes dot-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.5; transform: scale(0.75); }
        }

        .qr-viewport {
          position: relative;
          width: 100%;
          max-width: 360px;
          aspect-ratio: 1;
          border-radius: 28px;
          overflow: hidden;
          background: #060d18;
          box-shadow:
            0 0 0 1px rgba(255,255,255,0.06),
            0 24px 64px rgba(0,0,0,0.45),
            0 0 80px rgba(9,71,128,0.12);
        }

        .qr-grid {
          position: absolute;
          inset: 0;
          z-index: 5;
          pointer-events: none;
          background-image:
            linear-gradient(rgba(59,158,255,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59,158,255,0.04) 1px, transparent 1px);
          background-size: 36px 36px;
        }

        .qr-corner {
          position: absolute;
          width: 28px;
          height: 28px;
          border-color: #3b9eff;
          border-style: solid;
          z-index: 20;
          pointer-events: none;
          animation: corner-pulse 2.4s ease-in-out infinite;
        }
        .qr-corner.tl { top:20px; left:20px;  border-width: 2.5px 0 0 2.5px; border-radius: 6px 0 0 0; }
        .qr-corner.tr { top:20px; right:20px; border-width: 2.5px 2.5px 0 0; border-radius: 0 6px 0 0; animation-delay:.2s }
        .qr-corner.bl { bottom:20px; left:20px;  border-width: 0 0 2.5px 2.5px; border-radius: 0 0 0 6px; animation-delay:.4s }
        .qr-corner.br { bottom:20px; right:20px; border-width: 0 2.5px 2.5px 0; border-radius: 0 0 6px 0; animation-delay:.6s }

        @keyframes corner-pulse {
          0%, 100% { opacity: 0.45; }
          50%       { opacity: 1; }
        }

        .qr-scanline {
          position: absolute;
          left: 24px; right: 24px;
          height: 1.5px;
          z-index: 15;
          pointer-events: none;
          background: linear-gradient(90deg, transparent, #3b9eff, #80c8ff, #3b9eff, transparent);
          box-shadow: 0 0 18px 4px rgba(59,158,255,0.4);
          animation: scan 2.8s cubic-bezier(0.4,0,0.6,1) infinite;
          top: 24px;
        }

        @keyframes scan {
          0%   { transform: translateY(0); opacity: 0; }
          5%   { opacity: 1; }
          95%  { opacity: 1; }
          100% { transform: translateY(312px); opacity: 0; }
        }

        .qr-loading {
          position: absolute;
          inset: 0; z-index: 40;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          background: #060d18;
          gap: 14px;
        }
        .qr-loading-ring {
          width: 48px; height: 48px;
          border-radius: 50%;
          border: 2px solid rgba(59,158,255,0.12);
          border-top-color: #3b9eff;
          animation: spin 0.85s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .qr-loading-label {
          font-family: 'DM Mono', monospace;
          font-size: 10px; letter-spacing: 0.15em;
          color: rgba(255,255,255,0.35); text-transform: uppercase;
        }
        .qr-loading-sub {
          font-family: 'DM Mono', monospace;
          font-size: 9px; color: rgba(59,158,255,0.4); letter-spacing: 0.08em;
        }

        .qr-error {
          position: absolute;
          inset: 0; z-index: 50;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          background: #060d18; padding: 32px; text-align: center; gap: 12px;
        }
        .qr-error-icon {
          width: 52px; height: 52px; border-radius: 50%;
          background: rgba(251,146,60,0.1);
          border: 1px solid rgba(251,146,60,0.25);
          display: flex; align-items: center; justify-content: center;
          color: #fb923c;
        }
        .qr-error-title { font-size: 14px; font-weight: 700; color: #fff; letter-spacing: -0.02em; }
        .qr-error-desc {
          font-family: 'DM Mono', monospace; font-size: 10px;
          color: rgba(255,255,255,0.35); line-height: 1.6; letter-spacing: 0.03em;
        }
        .qr-retry-btn {
          margin-top: 4px;
          display: flex; align-items: center; gap: 6px;
          padding: 8px 18px; border-radius: 999px;
          border: 1px solid rgba(59,158,255,0.35);
          background: rgba(59,158,255,0.08);
          color: #3b9eff;
          font-family: 'Syne', sans-serif; font-size: 11px; font-weight: 600; letter-spacing: 0.05em;
          cursor: pointer; transition: background .2s, border-color .2s;
        }
        .qr-retry-btn:hover { background: rgba(59,158,255,0.15); border-color: rgba(59,158,255,0.6); }

        .qr-hint {
          position: absolute; bottom: 16px; left: 0; right: 0;
          z-index: 20; pointer-events: none;
          display: flex; justify-content: center;
        }
        .qr-hint span {
          font-family: 'DM Mono', monospace;
          font-size: 9px; letter-spacing: 0.14em; text-transform: uppercase;
          background: rgba(0,0,0,0.55); color: rgba(255,255,255,0.6);
          padding: 5px 14px; border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.08);
          backdrop-filter: blur(6px);
        }

        .qr-dropzone {
          width: 100%; max-width: 360px;
          position: relative; border-radius: 20px;
          border: 1.5px dashed rgba(9,71,128,0.28);
          background: rgba(9,71,128,0.03);
          padding: 20px 24px;
          display: flex; align-items: center; gap: 16px;
          cursor: pointer;
          transition: border-color .2s, background .2s, transform .15s;
          overflow: hidden;
        }
        .qr-dropzone:hover, .qr-dropzone.dragging {
          border-color: rgba(59,158,255,0.5);
          background: rgba(59,158,255,0.05);
          transform: translateY(-1px);
        }
        .qr-dropzone::before {
          content: '';
          position: absolute; inset: 0;
          background: radial-gradient(ellipse at 20% 50%, rgba(59,158,255,0.05) 0%, transparent 70%);
          pointer-events: none;
        }
        .qr-dropzone-icon {
          flex-shrink: 0; width: 44px; height: 44px; border-radius: 14px;
          background: linear-gradient(135deg, #0f3460, #1a4a7a);
          border: 1px solid rgba(59,158,255,0.2);
          display: flex; align-items: center; justify-content: center;
          color: #60b4ff;
        }
        .qr-dropzone-title { font-size: 13px; font-weight: 700; color: #1e3a5f; letter-spacing: -0.01em; margin-bottom: 3px; }
        .qr-dropzone-sub {
          font-family: 'DM Mono', monospace;
          font-size: 9px; color: rgba(9,71,128,0.4);
          letter-spacing: 0.1em; text-transform: uppercase;
        }
      `}</style>

      <div className="qr-root">

        <div className="qr-status-badge">
          <span className={`qr-status-dot ${loading ? 'loading' : cameraError ? 'error' : ''}`} />
          {loading ? 'Iniciando câmera...' : cameraError ? 'Câmera indisponível' : 'Câmera ativa'}
        </div>

        <div className="qr-viewport">
          <div className="qr-grid" />

          <div className="qr-corner tl" />
          <div className="qr-corner tr" />
          <div className="qr-corner bl" />
          <div className="qr-corner br" />

          {!loading && !cameraError && <div className="qr-scanline" />}
          {!loading && !cameraError && (
            <div className="qr-hint"><span>Aponte para o QR Code</span></div>
          )}

          {loading && (
            <div className="qr-loading">
              <div className="qr-loading-ring" />
              <span className="qr-loading-label">Iniciando câmera</span>
              <span className="qr-loading-sub">Requer conexão HTTPS</span>
            </div>
          )}

          {cameraError && (
            <div className="qr-error">
              <div className="qr-error-icon"><AlertTriangle size={22} /></div>
              <p className="qr-error-title">Câmera não responde</p>
              <p className="qr-error-desc">Permissão negada ou navegador sem suporte a câmera em HTTP.</p>
              <button className="qr-retry-btn" onClick={() => window.location.reload()}>
                <RefreshCw size={11} /> Tentar novamente
              </button>
            </div>
          )}

          {/* QrReader — props idênticas ao código que funcionava */}
          <QrReader
            // @ts-ignore
            onResult={(result: any) => {
              if (result) {
                const text = result.getText()
                try {
                  const url = new URL(text)
                  const id = url.searchParams.get('id')
                  onScan(id || text)
                } catch {
                  onScan(text)
                }
              }
            }}
            constraints={{ facingMode: 'environment' }}
            containerStyle={{ width: '100%', height: '100%' }}
            videoStyle={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>

        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
        <div
          className={`qr-dropzone ${isDragging ? 'dragging' : ''}`}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          <div className="qr-dropzone-icon"><ImageIcon size={20} /></div>
          <div>
            <p className="qr-dropzone-title">Enviar foto do QR Code</p>
            <p className="qr-dropzone-sub">Clique ou arraste uma imagem</p>
          </div>
        </div>

      </div>
    </>
  )
}