'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'
import dynamic from 'next/dynamic'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import {
  FileDown, Search, Check, Loader2,
  Package, Flame, Droplets,
  Zap, Bell, Wind, Plus, Minus,
  ChevronLeft, ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const QRCodeSVG = dynamic(
  () => import('qrcode.react').then(m => m.QRCodeSVG),
  { ssr: false, loading: () => <div className="bg-slate-100 rounded animate-pulse" style={{ width: 80, height: 80 }} /> }
)

const TIPO_CONFIG: Record<string, { color: string; bg: string; border: string; icon: React.ElementType }> = {
  'Extintor':                 { color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe', icon: Flame    },
  'Hidrante':                 { color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0', icon: Droplets },
  'Iluminação de Emergência': { color: '#b45309', bg: '#fffbeb', border: '#fde68a', icon: Zap      },
  'Botoeiras e Sirenes':      { color: '#7c3aed', bg: '#faf5ff', border: '#e9d5ff', icon: Bell      },
  'Detector de Fumaça':       { color: '#c2410c', bg: '#fff7ed', border: '#fed7aa', icon: Wind      },
}

const TAMANHOS = [
  { value: 'p',  label: 'P',            desc: '16/pág',  qrPx: 110, w: 174, h: 252,  maxCols: 4, maxRows: 4, fontSize: { header: 7,  code: 6,  name: 8,  badge: 6,  local: 6 } },
  { value: 'm',  label: 'M',            desc: '9/pág',   qrPx: 160, w: 234, h: 340,  maxCols: 3, maxRows: 3, fontSize: { header: 9,  code: 8,  name: 11, badge: 8,  local: 7 } },
  { value: 'g',  label: 'G',            desc: '4/pág',   qrPx: 280, w: 350, h: 510,  maxCols: 2, maxRows: 2, fontSize: { header: 12, code: 10, name: 15, badge: 10, local: 9 } },
  { value: 'xg', label: 'XG',           desc: '1/pág',   qrPx: 500, w: 718, h: 1046, maxCols: 1, maxRows: 1, fontSize: { header: 22, code: 16, name: 28, badge: 18, local: 14 } },
] as const

type TamanhoValue = typeof TAMANHOS[number]['value']
type FontSizes = { header: number; code: number; name: number; badge: number; local: number }

function EtiquetaCard({ local, qrPx, w, h, fontSize }: { local: any; qrPx: number; w: number; h: number; fontSize: FontSizes }) {
  const equip   = local.equipamentoAtual
  const tipoCfg = equip ? (TIPO_CONFIG[equip.tipo] ?? null) : null
  const TipoIcon = tipoCfg?.icon ?? Package
  const qrValue  = typeof window !== 'undefined'
    ? `${window.location.origin}/inspecao/nova?pontoId=${local.id}`
    : `https://sigs.app/inspecao/nova?pontoId=${local.id}`

  const tipoLabel =
    equip?.tipo === 'Iluminação de Emergência' ? 'Ilumin.' :
    equip?.tipo === 'Botoeiras e Sirenes'       ? 'Botoeiras' :
    equip?.tipo === 'Detector de Fumaça'        ? 'Detector' :
    equip?.tipo ?? null

  const scale = w / 174
  const pad = Math.max(6, Math.round(8 * scale))
  const gap = Math.max(4, Math.round(6 * scale))

  return (
    <div
      style={{
        width: w, height: h, fontFamily: "'DM Sans', Arial, sans-serif", background: '#fff', border: '1px solid #ccc',
        borderRadius: 0, padding: pad, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        boxSizing: 'border-box', overflow: 'hidden', gap: gap,
      }}
    >
      <div style={{
        width: '100%', background: '#094780', borderRadius: Math.round(4 * scale), padding: `${Math.round(4 * scale)}px ${Math.round(8 * scale)}px`,
        display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0,
      }}>
        <span style={{ color: '#fff', fontSize: fontSize.header, fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', textAlign: 'center' }}>
          SIGS · SEGURANÇA
        </span>
      </div>
      <div style={{ border: '1px solid #e3e8ef', borderRadius: Math.round(6 * scale), padding: Math.round(4 * scale), lineHeight: 0, background: '#fff', flexShrink: 0 }}>
        <QRCodeSVG value={qrValue} size={qrPx} level="M" />
      </div>
      <p style={{ fontSize: fontSize.code, fontFamily: 'monospace', color: '#6b7a90', margin: 0, letterSpacing: '0.05em', textAlign: 'center', flexShrink: 0 }}>
        {local.qrCode}
      </p>
      <p style={{ fontSize: fontSize.name, fontWeight: 800, color: '#094780', textAlign: 'center', lineHeight: 1.2, margin: 0, wordBreak: 'break-word', width: '100%', flexShrink: 0 }}>
        {local.nome}
      </p>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', flexShrink: 0 }}>
        {equip && tipoCfg ? (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: Math.round(3 * scale), background: tipoCfg.bg, border: `1px solid ${tipoCfg.border}`, borderRadius: Math.round(4 * scale), padding: `${Math.round(2 * scale)}px ${Math.round(6 * scale)}px` }}>
            <TipoIcon size={Math.round(10 * scale)} style={{ color: tipoCfg.color, flexShrink: 0 }} />
            <span style={{ fontSize: fontSize.badge, fontWeight: 800, color: tipoCfg.color, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {tipoLabel}
            </span>
          </div>
        ) : <div style={{ fontSize: fontSize.badge, color: '#9ca3af', fontStyle: 'italic' }}>Sem equipamento</div>}
      </div>
      <p style={{ fontSize: fontSize.local, color: '#9ca3af', textAlign: 'center', margin: 0, flexShrink: 0 }}>
        {[local.base, local.regional, local.uf].filter(Boolean).join(' · ')}
      </p>
    </div>
  )
}

export default function QrCodesPage() {
  const { data: session } = useSession()
  const [locais, setLocais] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [gerandoPdf, setGerandoPdf] = useState(false)
  const [busca, setBusca] = useState('')
  const [mostrarSemEquip, setMostrarSemEquip] = useState(true)
  const [selecao, setSelecao] = useState<Map<string, number>>(new Map())
  const [tamanho, setTamanho] = useState<TamanhoValue>('m')
  const [previewPage, setPreviewPage] = useState(0)
  const cardRefs = useRef<Map<number, HTMLDivElement>>(new Map())

  const loadData = useCallback(async () => {
    if (!session) return
    setLoading(true)
    try {
      const token = (session as any)?.access_token || (session as any)?.accessToken
      const res = await fetch('http://localhost:3001/pontos', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setLocais(Array.isArray(data) ? data : (data?.data ?? []))
    } catch {
      setLocais([])
    } finally {
      setLoading(false)
    }
  }, [session])

  useEffect(() => { loadData() }, [loadData])

  const filteredLocais = locais.filter(l => {
    const t = busca.toLowerCase()
    const matchBusca = !busca || l.nome?.toLowerCase().includes(t) || l.qrCode?.toLowerCase().includes(t) || l.base?.toLowerCase().includes(t)
    const matchEquip = mostrarSemEquip ? true : !!l.equipamentoAtual
    return matchBusca && matchEquip
  })

  const tamanhoAtual = TAMANHOS.find(t => t.value === tamanho) ?? TAMANHOS[1]
  const totalCopias = Array.from(selecao.values()).reduce((a, b) => a + b, 0)
  const locaisParaImprimir = Array.from(selecao.entries()).flatMap(([id, copias]) => {
    const local = locais.find(l => l.id === id)
    return local ? Array(copias).fill(local) : []
  })

  const cardsPerPage = tamanhoAtual.maxCols * tamanhoAtual.maxRows
  const totalPages = Math.ceil(locaisParaImprimir.length / cardsPerPage)
  const currentPageCards = locaisParaImprimir.slice(previewPage * cardsPerPage, (previewPage + 1) * cardsPerPage)

  useEffect(() => { setPreviewPage(0) }, [selecao.size, tamanho])

  const toggleLocal = (id: string) => {
    setSelecao(prev => {
      const next = new Map(prev)
      if (next.has(id)) next.delete(id)
      else next.set(id, 1)
      return next
    })
  }

  const setCopias = (id: string, n: number) => {
    setSelecao(prev => {
      const next = new Map(prev)
      next.set(id, Math.max(1, Math.min(20, n)))
      return next
    })
  }

  const selecionarTodos = () => {
    const next = new Map<string, number>()
    filteredLocais.forEach(l => next.set(l.id, selecao.get(l.id) ?? 1))
    setSelecao(next)
  }

  const limparSelecao = () => setSelecao(new Map())

  const handleGerarPdf = async () => {
    if (selecao.size === 0 || gerandoPdf) return
    setGerandoPdf(true)
    try {
      const [jsPDFModule, html2canvasModule] = await Promise.all([
        import('jspdf').then(m => m.default),
        import('html2canvas').then(m => m.default),
      ])
      const pdf = new jsPDFModule({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const margin = 10
      const cols = tamanhoAtual.maxCols, rows = tamanhoAtual.maxRows
      const cardMmW = (190) / cols, cardMmH = (277) / rows

      for (let i = 0; i < locaisParaImprimir.length; i++) {
        const posInPage = i % (cols * rows)
        if (posInPage === 0 && i > 0) pdf.addPage()
        const el = cardRefs.current.get(i)
        if (!el) continue
        const canvas = await html2canvasModule(el, { scale: 3, useCORS: true, backgroundColor: '#ffffff', logging: false })
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', margin + (posInPage % cols) * cardMmW, margin + Math.floor(posInPage / cols) * cardMmH, cardMmW, cardMmH)
      }
      pdf.save(`etiquetas-qr-sigs-${Date.now()}.pdf`)
    } catch (err: any) {
      alert(err?.message ?? 'Erro ao gerar PDF.')
    } finally {
      setGerandoPdf(false)
    }
  }

  return (
    <DashboardLayout title="QR Codes" breadcrumb="SIGS / Etiquetas / Gerador">
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700;800&display=swap');

        .qr-root {
          font-family: 'DM Sans', sans-serif;
          padding: 16px;
          background: #f1f5f9;
          min-height: calc(100vh - 60px);
        }
        @media (min-width: 768px) { .qr-root { padding: 24px; } }
        @media (min-width: 1280px) { .qr-root { padding: 28px 36px; } }

        .qr-layout {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        @media (min-width: 1280px) {
          .qr-layout {
            flex-direction: row;
            align-items: flex-start;
            gap: 20px;
          }
        }

        .qr-sidebar {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        @media (min-width: 640px) {
          .qr-sidebar {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 14px;
          }
        }
        @media (min-width: 1280px) {
          .qr-sidebar {
            display: flex;
            flex-direction: column;
            width: 380px;
            flex-shrink: 0;
          }
        }

        .qr-preview-area {
          flex: 1;
          min-width: 0;
          width: 100%;
        }

        /* Cards */
        .card {
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0,0,0,0.04);
        }
        .card-header {
          padding: 14px 18px;
          border-bottom: 1px solid #f1f5f9;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }
        .card-title {
          font-size: 13px;
          font-weight: 700;
          color: #0f172a;
          letter-spacing: 0.01em;
        }

        /* Tamanho buttons */
        .tamanho-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 6px;
        }
        .tamanho-btn {
          padding: 8px 4px;
          border-radius: 10px;
          border: 1.5px solid #e2e8f0;
          font-size: 13px;
          font-weight: 800;
          color: #64748b;
          cursor: pointer;
          text-align: center;
          background: #f8fafc;
          transition: all .15s;
          line-height: 1.3;
        }
        .tamanho-btn:hover { border-color: #94a3b8; color: #334155; }
        .tamanho-btn.ativo {
          border-color: #3d6cf0;
          color: #3d6cf0;
          background: #eff6ff;
        }

        /* Checkbox */
        .checkbox {
          width: 17px;
          height: 17px;
          min-width: 17px;
          border-radius: 5px;
          border: 1.5px solid #cbd5e1;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #fff;
          transition: all .1s;
        }
        .checkbox.checked {
          background: #3d6cf0;
          border-color: #3d6cf0;
        }

        /* Search */
        .search-wrap { position: relative; }
        .search-icon {
          position: absolute;
          left: 10px;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
          pointer-events: none;
        }
        .filter-input {
          height: 36px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 9px;
          padding: 0 12px 0 32px;
          font-size: 13px;
          outline: none;
          width: 100%;
          color: #0f172a;
          transition: border-color .15s;
          font-family: 'DM Sans', sans-serif;
        }
        .filter-input:focus { border-color: #3d6cf0; background: #fff; }
        .filter-input::placeholder { color: #94a3b8; }

        /* Local list */
        .locais-list { max-height: 340px; overflow-y: auto; }
        @media (min-width: 1280px) { .locais-list { max-height: 400px; } }
        .locais-list::-webkit-scrollbar { width: 4px; }
        .locais-list::-webkit-scrollbar-track { background: transparent; }
        .locais-list::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 99px; }

        .local-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 14px;
          border-bottom: 1px solid #f8fafc;
          cursor: pointer;
          transition: background .1s;
          user-select: none;
        }
        .local-item:last-child { border-bottom: none; }
        .local-item:hover { background: #fafbff; }
        .local-item.sel { background: #f0f5ff; }

        /* Copies input */
        .copies-ctrl {
          display: flex;
          align-items: center;
          gap: 3px;
          flex-shrink: 0;
        }
        .copies-btn {
          width: 24px;
          height: 24px;
          background: #f1f5f9;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #64748b;
          transition: background .1s;
        }
        .copies-btn:hover { background: #e2e8f0; }
        .copies-input {
          width: 32px;
          height: 24px;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          text-align: center;
          font-size: 12px;
          font-weight: 700;
          background: #f8fafc;
          color: #0f172a;
          font-family: 'DM Sans', sans-serif;
        }

        /* PDF button */
        .btn-pdf {
          width: 100%;
          padding: 11px;
          border-radius: 12px;
          border: none;
          font-size: 13px;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          cursor: pointer;
          transition: opacity .15s, transform .1s;
          font-family: 'DM Sans', sans-serif;
          letter-spacing: 0.01em;
        }
        .btn-pdf.active {
          background: linear-gradient(135deg, #E67A0E 0%, #f08c1a 100%);
          color: #fff;
          box-shadow: 0 2px 8px rgba(230,122,14,.35);
        }
        .btn-pdf.active:hover { opacity: .92; }
        .btn-pdf.active:active { transform: scale(.98); }
        .btn-pdf.disabled {
          background: #f1f5f9;
          color: #94a3b8;
          cursor: not-allowed;
        }

        /* Preview */
        .preview-paper {
          background: #fff;
          box-shadow: 0 2px 16px rgba(0,0,0,.08), 0 0 0 1px rgba(0,0,0,.06);
          border-radius: 4px;
        }
        .preview-nav-btn {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          background: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #64748b;
          transition: all .15s;
        }
        .preview-nav-btn:hover:not(:disabled) { border-color: #3d6cf0; color: #3d6cf0; background: #eff6ff; }
        .preview-nav-btn:disabled { opacity: .35; cursor: not-allowed; }

        /* Label section */
        .section-label {
          font-size: 10px;
          font-weight: 700;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 8px;
        }

        /* Toggle switch */
        .toggle-row {
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          user-select: none;
          padding: 2px 0;
        }
        .toggle-switch {
          width: 36px;
          height: 20px;
          border-radius: 10px;
          border: 1.5px solid #cbd5e1;
          background: #f1f5f9;
          display: flex;
          align-items: center;
          padding: 2px;
          transition: all .2s;
          flex-shrink: 0;
        }
        .toggle-switch.on {
          background: #3d6cf0;
          border-color: #3d6cf0;
        }
        .toggle-thumb {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #fff;
          box-shadow: 0 1px 3px rgba(0,0,0,.2);
          transition: transform .2s;
        }
        .toggle-switch.on .toggle-thumb {
          transform: translateX(16px);
        }
      `}} />

      <div className="qr-root">
        <div className="qr-layout">

          {/* ── Sidebar ── */}
          <div className="qr-sidebar">

            {/* Config */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">Configuração</span>
              </div>
              <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <p className="section-label">Tamanho da etiqueta</p>
                  <div className="tamanho-grid">
                    {TAMANHOS.map(t => (
                      <button
                        key={t.value}
                        onClick={() => setTamanho(t.value)}
                        className={cn('tamanho-btn', tamanho === t.value && 'ativo')}
                      >
                        <div>{t.label}</div>
                        <div style={{ fontSize: 10, opacity: 0.65, marginTop: 1 }}>{t.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div
                  className="toggle-row"
                  onClick={() => setMostrarSemEquip(!mostrarSemEquip)}
                >
                  <div className={cn('toggle-switch', mostrarSemEquip && 'on')}>
                    <div className="toggle-thumb" />
                  </div>
                  <span style={{ fontSize: 13, color: '#475569', fontWeight: 500 }}>
                    Mostrar locais sem equipamento
                  </span>
                </div>
              </div>
            </div>

            {/* Lista */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="card-header" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="card-title">Selecionar locais</span>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <button
                      onClick={selecionarTodos}
                      style={{ fontSize: 12, fontWeight: 700, color: '#3d6cf0', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                    >
                      Todos
                    </button>
                    {selecao.size > 0 && (
                      <button
                        onClick={limparSelecao}
                        style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                      >
                        Limpar
                      </button>
                    )}
                  </div>
                </div>

                <div className="search-wrap">
                  <Search size={13} className="search-icon" />
                  <input
                    className="filter-input"
                    placeholder="Buscar por nome, código ou base..."
                    value={busca}
                    onChange={e => setBusca(e.target.value)}
                  />
                </div>

                {selecao.size > 0 && (
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    background: '#eff6ff', border: '1px solid #bfdbfe',
                    borderRadius: 8, padding: '4px 10px', fontSize: 12, color: '#1d4ed8', fontWeight: 600,
                  }}>
                    <Check size={11} />
                    {selecao.size} local{selecao.size > 1 ? 'is' : ''} selecionado{selecao.size > 1 ? 's' : ''}
                  </div>
                )}
              </div>

              <div className="locais-list">
                {loading ? (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
                    <Loader2 size={22} className="animate-spin" style={{ color: '#3d6cf0' }} />
                  </div>
                ) : filteredLocais.length === 0 ? (
                  <div style={{ padding: '32px 16px', textAlign: 'center', fontSize: 13, color: '#94a3b8', fontStyle: 'italic' }}>
                    Nenhum local encontrado
                  </div>
                ) : filteredLocais.map(local => {
                  const sel = selecao.has(local.id)
                  const copias = selecao.get(local.id) ?? 1
                  const equip = local.equipamentoAtual
                  const tipoCfg = equip ? TIPO_CONFIG[equip.tipo] : null
                  const TipoIcon = tipoCfg?.icon

                  return (
                    <div key={local.id} className={cn('local-item', sel && 'sel')} onClick={() => toggleLocal(local.id)}>
                      <div className={cn('checkbox', sel && 'checked')}>
                        {sel && <Check size={10} color="#fff" strokeWidth={3} />}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 12.5, fontWeight: 700, color: '#0f172a', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {local.nome}
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                          <p style={{ fontSize: 10, color: '#94a3b8', fontFamily: 'monospace', margin: 0 }}>{local.qrCode}</p>
                          {equip && tipoCfg && TipoIcon && (
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: 3,
                              background: tipoCfg.bg, border: `1px solid ${tipoCfg.border}`,
                              borderRadius: 4, padding: '1px 5px', fontSize: 9, fontWeight: 700,
                              color: tipoCfg.color, textTransform: 'uppercase', letterSpacing: '0.05em',
                            }}>
                              <TipoIcon size={8} />
                              {equip.tipo === 'Iluminação de Emergência' ? 'Ilumin.' :
                               equip.tipo === 'Botoeiras e Sirenes' ? 'Botoeiras' :
                               equip.tipo === 'Detector de Fumaça' ? 'Detector' : equip.tipo}
                            </span>
                          )}
                        </div>
                      </div>
                      {sel && (
                        <div className="copies-ctrl" onClick={e => e.stopPropagation()}>
                          <button className="copies-btn" onClick={() => setCopias(local.id, copias - 1)}>
                            <Minus size={9} />
                          </button>
                          <input className="copies-input" value={copias} readOnly />
                          <button className="copies-btn" onClick={() => setCopias(local.id, copias + 1)}>
                            <Plus size={9} />
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              <div style={{ padding: '12px 14px', borderTop: '1px solid #f1f5f9' }}>
                <button
                  onClick={handleGerarPdf}
                  disabled={selecao.size === 0 || gerandoPdf}
                  className={cn('btn-pdf', selecao.size > 0 && !gerandoPdf ? 'active' : 'disabled')}
                >
                  {gerandoPdf
                    ? <><Loader2 size={15} className="animate-spin" /> Gerando PDF...</>
                    : <><FileDown size={15} /> Gerar PDF{totalCopias > 0 ? ` · ${totalCopias} etiqueta${totalCopias > 1 ? 's' : ''}` : ''}</>
                  }
                </button>
              </div>
            </div>
          </div>

          {/* ── Preview ── */}
          <div className="qr-preview-area card">
            <div className="card-header">
              <span className="card-title">Pré-visualização</span>
              {locaisParaImprimir.length > 0 && (
                <span style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>
                  {totalPages} página{totalPages > 1 ? 's' : ''} · {totalCopias} etiqueta{totalCopias > 1 ? 's' : ''}
                </span>
              )}
            </div>

            <div style={{
              padding: '24px 16px',
              background: '#f1f5f9',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              minHeight: 500,
              justifyContent: locaisParaImprimir.length === 0 ? 'center' : 'flex-start',
              gap: 16,
            }}>
              {locaisParaImprimir.length > 0 ? (
                <>
                  <div className="preview-paper" style={{ width: 320, height: 452, padding: 8 }}>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: `repeat(${tamanhoAtual.maxCols}, 1fr)`,
                      height: '100%',
                    }}>
                      {currentPageCards.map((local, idx) => {
                        const globalIdx = previewPage * cardsPerPage + idx
                        return (
                          <div key={globalIdx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <EtiquetaCard
                              local={local}
                              qrPx={tamanhoAtual.qrPx * 0.28}
                              w={304 / tamanhoAtual.maxCols}
                              h={436 / tamanhoAtual.maxRows}
                              fontSize={{
                                header: tamanhoAtual.fontSize.header * 0.6,
                                code:   tamanhoAtual.fontSize.code   * 0.6,
                                name:   tamanhoAtual.fontSize.name   * 0.6,
                                badge:  tamanhoAtual.fontSize.badge  * 0.6,
                                local:  tamanhoAtual.fontSize.local  * 0.6,
                              }}
                            />
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {totalPages > 1 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <button
                        className="preview-nav-btn"
                        onClick={() => setPreviewPage(p => Math.max(0, p - 1))}
                        disabled={previewPage === 0}
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#475569', minWidth: 80, textAlign: 'center' }}>
                        Página {previewPage + 1} de {totalPages}
                      </span>
                      <button
                        className="preview-nav-btn"
                        onClick={() => setPreviewPage(p => Math.min(totalPages - 1, p + 1))}
                        disabled={previewPage === totalPages - 1}
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: 14, background: '#e2e8f0',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 12px',
                  }}>
                    <Search size={22} style={{ color: '#94a3b8' }} />
                  </div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#475569', margin: '0 0 4px' }}>
                    Nenhum local selecionado
                  </p>
                  <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>
                    Selecione locais na lista ao lado para visualizar as etiquetas
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Hidden cards for PDF generation */}
      <div style={{ position: 'absolute', left: -9999, top: 0 }}>
        {locaisParaImprimir.map((local, idx) => (
          <div key={idx} ref={el => { if (el) cardRefs.current.set(idx, el) }}>
            <EtiquetaCard
              local={local}
              qrPx={tamanhoAtual.qrPx}
              w={tamanhoAtual.w}
              h={tamanhoAtual.h}
              fontSize={tamanhoAtual.fontSize}
            />
          </div>
        ))}
      </div>
    </DashboardLayout>
  )
}