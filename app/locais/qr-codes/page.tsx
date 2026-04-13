'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'
import dynamic from 'next/dynamic'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import {
  FileDown, QrCode, Search, X, Check, Loader2,
  MapPin, Package, Flame, Droplets,
  Zap, Bell, Wind, Plus, Minus,
  ChevronLeft, ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// QRCodeSVG sem SSR
const QRCodeSVG = dynamic(
  () => import('qrcode.react').then(m => m.QRCodeSVG),
  { ssr: false, loading: () => <div className="bg-slate-100 rounded animate-pulse" style={{ width: 80, height: 80 }} /> }
)

// ─── Config visual ────────────────────────────────────────────────────────────
const TIPO_CONFIG: Record<string, { color: string; bg: string; border: string; icon: React.ElementType }> = {
  'Extintor':                 { color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe', icon: Flame    },
  'Hidrante':                 { color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0', icon: Droplets },
  'Iluminação de Emergência': { color: '#b45309', bg: '#fffbeb', border: '#fde68a', icon: Zap      },
  'Botoeiras e Sirenes':      { color: '#7c3aed', bg: '#faf5ff', border: '#e9d5ff', icon: Bell      },
  'Detector de Fumaça':       { color: '#c2410c', bg: '#fff7ed', border: '#fed7aa', icon: Wind      },
}

// ─── Tamanhos ─────────────────────────────────────────────────────────────────
const TAMANHOS = [
  { value: 'p',  label: 'Pequena',     desc: '16/página', qrPx: 110, w: 174, h: 252,  maxCols: 4, maxRows: 4, fontSize: { header: 7,  code: 6,  name: 8,  badge: 6,  local: 6 } },
  { value: 'm',  label: 'Média',        desc: '9/página',  qrPx: 160, w: 234, h: 340,  maxCols: 3, maxRows: 3, fontSize: { header: 9,  code: 8,  name: 11, badge: 8,  local: 7 } },
  { value: 'g',  label: 'Grande',       desc: '4/página',  qrPx: 280, w: 350, h: 510,  maxCols: 2, maxRows: 2, fontSize: { header: 12, code: 10, name: 15, badge: 10, local: 9 } },
  { value: 'xg', label: 'Extra Grande', desc: '1/página',  qrPx: 500, w: 718, h: 1046, maxCols: 1, maxRows: 1, fontSize: { header: 22, code: 16, name: 28, badge: 18, local: 14 } },
] as const

type TamanhoValue = typeof TAMANHOS[number]['value']
type FontSizes = { header: number; code: number; name: number; badge: number; local: number }

// ─── Etiqueta ─────────────────────────────────────────────────────────────────
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
        borderRadius: 0, padding: pad, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box', overflow: 'hidden', gap: gap,
      }}
    >
      <div style={{ 
        width: '100%', background: '#094780', borderRadius: Math.round(4 * scale), padding: `${Math.round(4 * scale)}px ${Math.round(8 * scale)}px`, 
        display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0 
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
        .qr-root { font-family:'DM Sans',sans-serif; padding:16px; background:#f8fafc; min-height:calc(100vh - 60px); }
        @media(min-width:1024px){ .qr-root { padding:24px 32px; } }
        .card { background:#fff; border:1px solid #e3e8ef; border-radius:16px; overflow:hidden; }
        .card-header { padding:14px 20px; border-bottom:1px solid #f1f5f9; }
        .local-item { display:flex; align-items:center; gap:10px; padding:9px 14px; border-bottom:1px solid #f8fafc; cursor:pointer; transition:background .1s; user-select:none; }
        .local-item:hover { background:#fafbff; }
        .local-item.sel { background:#eff6ff; }
        .checkbox { width:18px; height:18px; border-radius:5px; border:2px solid #e3e8ef; display:flex; align-items:center; justify-content:center; flex-shrink:0; background:#fff; }
        .checkbox.checked { background:#3d6cf0; border-color:#3d6cf0; }
        .filter-input { height:36px; background:#f8fafc; border:1px solid #e3e8ef; border-radius:8px; padding:0 32px; font-size:13px; outline:none; width:100%; }
        .tamanho-btn { flex:1; padding:8px 4px; border-radius:10px; border:2px solid #e3e8ef; font-size:12px; font-weight:700; color:#6b7280; cursor:pointer; text-align:center; background:#fff; }
        .tamanho-btn.ativo { border-color:#3d6cf0; color:#3d6cf0; background:#eff6ff; }
        .copies-input { width:44px; height:28px; border:1.5px solid #e3e8ef; border-radius:7px; text-align:center; font-size:13px; font-weight:700; background:#f8fafc; }
      `}} />

      <div className="qr-root">
        <div className="flex flex-col xl:flex-row gap-5 items-start">
          <div className="w-full xl:w-[400px] flex-shrink-0 space-y-4">
            <div className="card">
              <div className="card-header"><p className="font-bold text-slate-800">Configuração</p></div>
              <div className="p-4 space-y-4">
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Tamanho da Etiqueta</p>
                  <div className="flex gap-2">
                    {TAMANHOS.map(t => (
                      <button key={t.value} onClick={() => setTamanho(t.value)} className={cn('tamanho-btn', tamanho === t.value && 'ativo')}>
                        <div className="font-black">{t.label}</div>
                        <div className="text-[10px] opacity-70">{t.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <div className={cn('checkbox', mostrarSemEquip && 'checked')} onClick={() => setMostrarSemEquip(!mostrarSemEquip)}>
                    {mostrarSemEquip && <Check size={11} color="#fff" strokeWidth={3} />}
                  </div>
                  <span className="text-[13px] font-medium text-slate-600">Mostrar locais sem equipamento</span>
                </label>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <p className="font-bold text-slate-800 mb-3">Selecionar Locais</p>
                <div className="relative mb-3">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input className="filter-input" placeholder="Buscar..." value={busca} onChange={e => setBusca(e.target.value)} />
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-400 font-medium">{selecao.size} locais selecionados</span>
                  <div className="flex gap-2">
                    <button onClick={selecionarTodos} className="text-[#3d6cf0] font-bold">Todos</button>
                    {selecao.size > 0 && <button onClick={limparSelecao} className="text-slate-400 font-bold">Limpar</button>}
                  </div>
                </div>
              </div>
              <div style={{ maxHeight: 360, overflowY: 'auto' }}>
                {loading ? <Loader2 className="animate-spin mx-auto my-12 text-[#3d6cf0]" /> : filteredLocais.map(local => {
                  const sel = selecao.has(local.id);
                  const copias = selecao.get(local.id) ?? 1;
                  const equip = local.equipamentoAtual;
                  const tipoCfg = equip ? TIPO_CONFIG[equip.tipo] : null;
                  return (
                    <div key={local.id} className={cn('local-item', sel && 'sel')} onClick={() => toggleLocal(local.id)}>
                      <div className={cn('checkbox', sel && 'checked')}>{sel && <Check size={11} color="#fff" />}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12.5px] font-bold text-[#111827] truncate">{local.nome}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{local.qrCode}</p>
                      </div>
                      {sel && (
                        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                          <button onClick={() => setCopias(local.id, copias - 1)} className="w-6 h-6 bg-slate-100 rounded flex items-center justify-center"><Minus size={10}/></button>
                          <input className="copies-input" value={copias} readOnly />
                          <button onClick={() => setCopias(local.id, copias + 1)} className="w-6 h-6 bg-slate-100 rounded flex items-center justify-center"><Plus size={10}/></button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
              <div className="p-4 border-t">
                <button onClick={handleGerarPdf} disabled={selecao.size === 0 || gerandoPdf} className={cn('w-full py-2.5 rounded-xl font-black text-sm flex items-center justify-center gap-2', selecao.size > 0 ? 'bg-[#E67A0E] text-white' : 'bg-slate-100 text-slate-400')}>
                  {gerandoPdf ? <Loader2 className="animate-spin" size={16}/> : <FileDown size={16}/>}
                  {gerandoPdf ? 'Gerando...' : `Gerar PDF (${totalCopias})`}
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 min-w-0 w-full card">
            <div className="card-header flex justify-between items-center"><p className="font-bold text-slate-800">Pré-visualização</p></div>
            <div className="p-4 bg-[#f8fafc] flex flex-col items-center">
              {locaisParaImprimir.length > 0 ? (
                <>
                  <div className="bg-white border shadow-md" style={{ width: 320, height: 452, padding: 8 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${tamanhoAtual.maxCols}, 1fr)`, height: '100%' }}>
                      {currentPageCards.map((local, idx) => {
                        const globalIdx = previewPage * cardsPerPage + idx;
                        return (
                          <div key={globalIdx} className="flex items-center justify-center">
                            <EtiquetaCard 
                              local={local} 
                              qrPx={tamanhoAtual.qrPx * 0.28} 
                              w={304 / tamanhoAtual.maxCols} 
                              h={436 / tamanhoAtual.maxRows} 
                              fontSize={{
                                header: tamanhoAtual.fontSize.header * 0.6,
                                code: tamanhoAtual.fontSize.code * 0.6,
                                name: tamanhoAtual.fontSize.name * 0.6,
                                badge: tamanhoAtual.fontSize.badge * 0.6,
                                local: tamanhoAtual.fontSize.local * 0.6
                              }}
                            />
                          </div>
                        )
                      })}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-4">
                    <button onClick={() => setPreviewPage(p => Math.max(0, p - 1))} disabled={previewPage === 0}><ChevronLeft size={20}/></button>
                    <span className="text-xs font-bold text-slate-600">Página {previewPage + 1} de {totalPages}</span>
                    <button onClick={() => setPreviewPage(p => Math.min(totalPages - 1, p + 1))} disabled={previewPage === totalPages - 1}><ChevronRight size={20}/></button>
                  </div>
                  <div style={{ position: 'absolute', left: -9999, top: 0 }}>
                    {locaisParaImprimir.map((local, idx) => (
                      <div key={idx} ref={el => { if (el) cardRefs.current.set(idx, el) }}>
                        <EtiquetaCard local={local} qrPx={tamanhoAtual.qrPx} w={tamanhoAtual.w} h={tamanhoAtual.h} fontSize={tamanhoAtual.fontSize} />
                      </div>
                    ))}
                  </div>
                </>
              ) : <div className="py-20 text-slate-400 italic">Selecione locais na lista</div>}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}