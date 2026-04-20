'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import {
  ArrowLeft, CheckCircle, Loader2,
  MapPin, Building2, QrCode, Package, Link2,
  Flame, Droplets, Waves, Zap, Bell, Wind,
  CheckCircle2, AlertTriangle, XCircle, Clock,
  Search, X, FileDown, RefreshCw, ChevronDown,
  LayoutDashboard,
  ClipboardList,
  Boxes,
  ListChecks,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import QRCode from 'qrcode'

const QRCodeSVG = dynamic(
  () => import('qrcode.react').then(m => m.QRCodeSVG),
  { ssr: false, loading: () => <div className="bg-slate-100 rounded animate-pulse" style={{ width: 120, height: 120 }} /> }
)

// ─── Config ───────────────────────────────────────────────────────────────────
const navItems = [
  { section: 'Menu Principal' },
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { section: 'Operações' },
  { label: 'Realizar Inspeção', href: '/inspecao/nova', icon: ClipboardList },
  { label: 'Lista de Inspeções', href: '/inspecao/lista', icon: ListChecks },
  { section: 'Gestão' },
  { label: 'Equipamentos', href: '/equipamentos/lista', icon: Boxes },
  { label: 'QR Codes', href: '/qr-codes', icon: QrCode },
  { label: 'Locais', href: '/locais/lista', icon: MapPin },
]

const REGIONAIS_POR_UF: Record<string, string[]> = {
  PI: ['METROPOLITANA', 'SUL', 'NORTE'],
  MA: ['SUL', 'NORTE', 'SUDESTE', 'NOROESTE'],
}
const ESTADOS_BR = Object.keys(REGIONAIS_POR_UF)

const TABS = [
  { key: 'identificacao' as const, label: 'Identificação', icon: MapPin    },
  { key: 'localizacao'   as const, label: 'Localização',   icon: Building2 },
  { key: 'vinculo'       as const, label: 'Vínculo',       icon: Link2     },
  { key: 'qrcode'        as const, label: 'QR Code',       icon: QrCode    },
] as const
type TabKey = typeof TABS[number]['key']

const TIPO_CONFIG: Record<string, { color: string; bg: string; border: string; icon: any }> = {
  'Extintor':                  { color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe', icon: Flame    },
  'Hidrante':                  { color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0', icon: Droplets },
  'Iluminação de Emergência':  { color: '#b45309', bg: '#fffbeb', border: '#fde68a', icon: Zap      },
  'Botoeiras e Sirenes':       { color: '#7c3aed', bg: '#faf5ff', border: '#e9d5ff', icon: Bell     },
  'Detector de Fumaça':        { color: '#c2410c', bg: '#fff7ed', border: '#fed7aa', icon: Wind     },
  'Sprinkler':                 { color: '#0e7490', bg: '#ecfeff', border: '#a5f3fc', icon: Waves    },
  'Outro':                     { color: '#4b5563', bg: '#f8fafc', border: '#e3e8ef', icon: Package  },
}

const STATUS_CONFIG: Record<string, { label: string; icon: any; color: string; bg: string; border: string }> = {
  'ATIVO':      { label: 'Ativo',      icon: CheckCircle2,  color: '#059669', bg: '#ecfdf5', border: '#a7f3d0' },
  'VENCIDO':    { label: 'Vencido',    icon: AlertTriangle, color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  'MANUTENCAO': { label: 'Manutenção', icon: XCircle,       color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
  'INATIVO':    { label: 'Inativo',    icon: Clock,         color: '#6b7280', bg: '#f9fafb', border: '#e5e7eb' },
}

const TAMANHOS_ETIQUETA = [
  { value: 'p',  label: 'P',  desc: '16/pág', qrPx: 110, w: 174,  h: 252,  maxCols: 4, maxRows: 4, fontSize: { header: 7,  code: 6,  name: 8,  badge: 6,  local: 6  } },
  { value: 'm',  label: 'M',  desc: '9/pág',  qrPx: 160, w: 234,  h: 340,  maxCols: 3, maxRows: 3, fontSize: { header: 9,  code: 8,  name: 11, badge: 8,  local: 7  } },
  { value: 'g',  label: 'G',  desc: '4/pág',  qrPx: 280, w: 350,  h: 510,  maxCols: 2, maxRows: 2, fontSize: { header: 12, code: 10, name: 15, badge: 10, local: 9  } },
  { value: 'xg', label: 'XG', desc: '1/pág',  qrPx: 500, w: 718,  h: 1046, maxCols: 1, maxRows: 1, fontSize: { header: 22, code: 16, name: 28, badge: 18, local: 14 } },
] as const
type TamanhoEtiqueta = typeof TAMANHOS_ETIQUETA[number]['value']

// ─── Componente Etiqueta ──────────────────────────────────────────────────────
function EtiquetaCard({
  nome, qrCode, qrPx, w, h, fontSize,
  equipamentoAtual, base, regional, uf,
}: {
  nome: string; qrCode: string; qrPx: number; w: number; h: number
  fontSize: { header: number; code: number; name: number; badge: number; local: number }
  equipamentoAtual?: any; base?: string; regional?: string; uf?: string
}) {
  const qrValue = typeof window !== 'undefined'
    ? `${window.location.origin}/inspecao/nova?qrCode=${qrCode}`
    : `https://sigs.app/inspecao/nova?qrCode=${qrCode}`

  const tipoCfg  = equipamentoAtual ? (TIPO_CONFIG[equipamentoAtual.tipo] ?? null) : null
  const TipoIcon = tipoCfg?.icon ?? Package

  const tipoLabel =
    equipamentoAtual?.tipo === 'Iluminação de Emergência' ? 'Ilumin.' :
    equipamentoAtual?.tipo === 'Botoeiras e Sirenes'       ? 'Botoeiras' :
    equipamentoAtual?.tipo === 'Detector de Fumaça'        ? 'Detector' :
    equipamentoAtual?.tipo ?? null

  const scale = w / 174
  const pad   = Math.max(6, Math.round(8 * scale))
  const gap   = Math.max(4, Math.round(6 * scale))

  return (
    <div style={{
      width: w, height: h, fontFamily: "'DM Sans', Arial, sans-serif",
      background: '#fff', border: '1px solid #ccc', borderRadius: 0,
      padding: pad, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      boxSizing: 'border-box', overflow: 'hidden', gap,
    }}>
      <div style={{
        width: '100%', background: '#094780', borderRadius: Math.round(4 * scale),
        padding: `${Math.round(4 * scale)}px ${Math.round(8 * scale)}px`,
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
        {qrCode}
      </p>
      <p style={{ fontSize: fontSize.name, fontWeight: 800, color: '#094780', textAlign: 'center', lineHeight: 1.2, margin: 0, wordBreak: 'break-word', width: '100%', flexShrink: 0 }}>
        {nome || 'Local'}
      </p>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', flexShrink: 0 }}>
        {equipamentoAtual && tipoCfg ? (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: Math.round(3 * scale),
            background: tipoCfg.bg, border: `1px solid ${tipoCfg.border}`,
            borderRadius: Math.round(4 * scale), padding: `${Math.round(2 * scale)}px ${Math.round(6 * scale)}px`,
          }}>
            <TipoIcon size={Math.round(10 * scale)} style={{ color: tipoCfg.color, flexShrink: 0 }} />
            <span style={{ fontSize: fontSize.badge, fontWeight: 800, color: tipoCfg.color, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {tipoLabel}
            </span>
          </div>
        ) : (
          <div style={{ fontSize: fontSize.badge, color: '#9ca3af', fontStyle: 'italic' }}>Sem equipamento</div>
        )}
      </div>
      <p style={{ fontSize: fontSize.local, color: '#9ca3af', textAlign: 'center', margin: 0, flexShrink: 0 }}>
        {[base, regional, uf].filter(Boolean).join(' · ')}
      </p>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function NovoLocalPage() {
  const router            = useRouter()
  const { data: session } = useSession()

  const [isSaving,     setIsSaving]     = useState(false)
  const [successModal, setSuccessModal] = useState(false)
  const [novoQr,       setNovoQr]       = useState('')
  const [tab,          setTab]          = useState<TabKey>('identificacao')
  const [qrDataUrl,    setQrDataUrl]    = useState('')
  const [equipamentosDisponiveis, setEquipamentosDisponiveis] = useState<any[]>([])
  const [loadingEquipamentos,     setLoadingEquipamentos]     = useState(false)
  const [buscaEquipamento,        setBuscaEquipamento]        = useState('')

  // Campos
  const [nome,               setNome]               = useState('')
  const [base,               setBase]               = useState('')
  const [regional,           setRegional]           = useState('')
  const [uf,                 setUf]                 = useState('')
  const [qrCode,             setQrCode]             = useState('')
  const [equipamentoAtualId, setEquipamentoAtualId] = useState<string | null>(null)

  // Impressão
  const [tamanhoEtiqueta, setTamanhoEtiqueta] = useState<TamanhoEtiqueta>('m')
  const [gerandoPdf,      setGerandoPdf]      = useState(false)
  const etiquetaRef = useRef<HTMLDivElement>(null)

  // Gera preview QR
  useEffect(() => {
    if (!qrCode) { setQrDataUrl(''); return }
    QRCode.toDataURL(qrCode, { width: 240, margin: 2, color: { dark: '#0d1e33', light: '#ffffff' } })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(''))
  }, [qrCode])

  // Auto-gera código
  useEffect(() => {
    setQrCode(`LOC-${Date.now().toString(36).toUpperCase()}`)
  }, [])

  const loadEquipamentos = useCallback(async () => {
    if (!session) return
    setLoadingEquipamentos(true)
    try {
      const token       = (session as any)?.access_token || (session as any)?.accessToken
      const res         = await fetch('http://localhost:3001/equipamentos', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error()
      const data        = await res.json()
      const disponiveis = (Array.isArray(data) ? data : (data.data || [])).filter((eq: any) => !eq.pontoInstalacao)
      setEquipamentosDisponiveis(disponiveis)
    } catch {
      setEquipamentosDisponiveis([])
    } finally {
      setLoadingEquipamentos(false)
    }
  }, [session])

  useEffect(() => { loadEquipamentos() }, [loadEquipamentos])

  const tabOrder: TabKey[] = ['identificacao', 'localizacao', 'vinculo', 'qrcode']
  const tabValid: Record<TabKey, boolean> = {
    identificacao: !!nome,
    localizacao:   !!base && !!regional && !!uf,
    vinculo:       true,
    qrcode:        !!qrCode,
  }
  const currentIdx     = tabOrder.indexOf(tab)
  const allValid       = tabValid.identificacao && tabValid.localizacao && tabValid.qrcode
  const completedCount = tabOrder.filter(k => tabValid[k]).length

  const equipamentoSelecionado = equipamentosDisponiveis.find(e => e.id === equipamentoAtualId)
  const tamanhoAtualCfg        = TAMANHOS_ETIQUETA.find(t => t.value === tamanhoEtiqueta) ?? TAMANHOS_ETIQUETA[1]

  // Gera PDF
  const handleImprimirEtiqueta = async () => {
    if (!qrCode || gerandoPdf) return
    setGerandoPdf(true)
    try {
      const [jsPDFModule, html2canvasModule] = await Promise.all([
        import('jspdf').then(m => m.default),
        import('html2canvas').then(m => m.default),
      ])
      const cfg     = TAMANHOS_ETIQUETA.find(t => t.value === tamanhoEtiqueta) ?? TAMANHOS_ETIQUETA[1]
      const pdf     = new jsPDFModule({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const el      = etiquetaRef.current
      if (!el) return
      const canvas  = await html2canvasModule(el, { scale: 3, useCORS: true, backgroundColor: '#ffffff', logging: false })
      const cardMmW = 190 / cfg.maxCols
      const cardMmH = 277 / cfg.maxRows
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 10, 10, cardMmW, cardMmH)
      pdf.save(`etiqueta-${qrCode}.pdf`)
    } catch (err: any) {
      alert(err?.message ?? 'Erro ao gerar PDF.')
    } finally {
      setGerandoPdf(false)
    }
  }

  async function handleSave() {
    if (isSaving || !allValid) return
    setIsSaving(true)
    try {
      const token = (session as any)?.access_token || (session as any)?.accessToken
      const res   = await fetch('http://localhost:3001/pontos', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ nome, base, regional, uf, qrCode, equipamentoAtualId: equipamentoAtualId ?? null }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || 'Erro ao cadastrar local.')
      }
      const result = await res.json()
      setNovoQr(result.qrCode || qrCode)
      setSuccessModal(true)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setIsSaving(false)
    }
  }

  // ── Estilos reutilizáveis (mesmo padrão do NovoEquipamentoPage) ──
  const inp  = 'w-full bg-[#f8fafc] border border-[#e3e8ef] rounded-lg h-10 px-3 text-[13.5px] outline-none focus:border-[#3d6cf0] transition-all'
  const sec  = 'text-[11px] font-bold uppercase tracking-widest text-[#9ca3af] px-6 py-3 bg-[#f8fafc] border-b border-[#e3e8ef]'
  const lbl  = 'text-[13.5px] font-medium text-[#111827]'
  const lbl2 = 'text-[11px] text-slate-400 mt-0.5'
  const row  = 'grid gap-4 items-start py-4 grid-cols-1 sm:grid-cols-[220px_1fr]'
  const divi = 'divide-y divide-[#f1f5f9]'

  return (
    <DashboardLayout navItems={navItems} title="Novo Local">
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeUp    { from{opacity:0;transform:translateY(6px);}to{opacity:1;transform:none;} }
        .fade-up   { animation: fadeUp 0.2s ease forwards; }
        @keyframes scaleIn   { from{opacity:0;transform:scale(.95);}to{opacity:1;transform:scale(1);} }
        .scale-in  { animation: scaleIn 0.15s ease forwards; }
        @keyframes slideDown { from{opacity:0;transform:translateY(-8px);}to{opacity:1;transform:none;} }
        .slide-down { animation: slideDown 0.2s ease forwards; }
      `}} />

      <div className="w-full flex flex-col bg-[#f4f6f9] min-h-[calc(100vh-60px)]">

        {/* Breadcrumb */}
        <div className="bg-white border-b border-[#e3e8ef] px-7 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[13px] text-[#9ca3af]">
            <button
              onClick={() => router.push('/locais/lista')}
              className="hover:text-[#3d6cf0] transition-colors flex items-center gap-1.5 font-medium"
            >
              <ArrowLeft size={14} /> Locais
            </button>
            <span className="text-[11px]">›</span>
            <span className="text-[#3d6cf0] font-semibold">Novo Local</span>
          </div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Etapa {currentIdx + 1} de {tabOrder.length}
          </span>
        </div>

        {/* Tab bar */}
        <div className="bg-white border-b border-[#e3e8ef] px-7 flex overflow-x-auto shadow-sm">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                'flex items-center gap-2 px-5 py-4 text-[13.5px] border-b-[2.5px] whitespace-nowrap transition-all -mb-px',
                tab === t.key
                  ? 'text-[#3d6cf0] border-[#3d6cf0] font-bold'
                  : 'text-[#9ca3af] border-transparent'
              )}
            >
              {t.label}
              {tabValid[t.key] && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 ml-1" />
              )}
            </button>
          ))}
        </div>

        {/* Conteúdo */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-8 pt-6 pb-28">

          {/* ══ ABA 1 — IDENTIFICAÇÃO ══ */}
          {tab === 'identificacao' && (
            <div className="fade-up space-y-4 max-w-2xl mx-auto">
              <div className="bg-white border border-[#e3e8ef] rounded-xl shadow-sm overflow-hidden">
                <div className={sec}>Dados do Local *</div>
                <div className={cn('px-6', divi)}>
                  <div className={row}>
                    <div>
                      <p className={lbl}>Nome do Local (Ponto) *</p>
                      <p className={lbl2}>Identifica onde o equipamento está instalado</p>
                    </div>
                    <input
                      type="text"
                      value={nome}
                      onChange={e => setNome(e.target.value)}
                      className={inp}
                      placeholder="Ex: Bloco A – Corredor Principal"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══ ABA 2 — LOCALIZAÇÃO ══ */}
          {tab === 'localizacao' && (
            <div className="fade-up space-y-4 max-w-2xl mx-auto">
              <div className="bg-white border border-[#e3e8ef] rounded-xl shadow-sm overflow-hidden">
                <div className={sec}>Endereçamento Organizacional</div>
                <div className={cn('px-6', divi)}>

                  <div className={row}>
                    <div>
                      <p className={lbl}>Base / Unidade *</p>
                      <p className={lbl2}>Nome da instalação ou filial</p>
                    </div>
                    <input
                      type="text"
                      value={base}
                      onChange={e => setBase(e.target.value)}
                      className={inp}
                      placeholder="Ex: Base Teresina, Unidade Centro..."
                    />
                  </div>

                  <div className={row}>
                    <div>
                      <p className={lbl}>Estado (UF) *</p>
                      <p className={lbl2}>Unidade federativa da instalação</p>
                    </div>
                    <div className="relative">
                      <select
                        value={uf}
                        onChange={e => { setUf(e.target.value); setRegional('') }}
                        className={cn(inp, 'appearance-none pr-8 cursor-pointer')}
                      >
                        <option value="">Selecione...</option>
                        {ESTADOS_BR.map(estado => (
                          <option key={estado} value={estado}>{estado}</option>
                        ))}
                      </select>
                      <ChevronDown size={14} className="absolute right-3 top-3 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  <div className={row}>
                    <div>
                      <p className={lbl}>Regional *</p>
                      <p className={lbl2}>Divisão regional da operação</p>
                    </div>
                    <div className="relative">
                      <select
                        value={regional}
                        onChange={e => setRegional(e.target.value)}
                        className={cn(inp, 'appearance-none pr-8 cursor-pointer', !uf && 'opacity-50 cursor-not-allowed')}
                        disabled={!uf}
                      >
                        <option value="">{uf ? 'Selecione...' : 'Selecione o estado primeiro'}</option>
                        {(REGIONAIS_POR_UF[uf] ?? []).map(r => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                      <ChevronDown size={14} className="absolute right-3 top-3 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                </div>
              </div>
            </div>
          )}

          {/* ══ ABA 3 — VÍNCULO ══ */}
          {tab === 'vinculo' && (
            <div className="fade-up space-y-4 max-w-2xl mx-auto">

              {/* Equipamento selecionado */}
              <div className="bg-white border border-[#e3e8ef] rounded-xl shadow-sm overflow-hidden">
                <div className={sec}>Equipamento Vinculado</div>
                <div className="p-5">
                  {!equipamentoSelecionado ? (
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-[#f8fafc] border border-dashed border-[#e3e8ef]">
                      <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                        <Package size={16} className="text-slate-400" />
                      </div>
                      <div>
                        <p className="text-[13px] font-semibold text-slate-500">Nenhum equipamento vinculado</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Opcional — selecione abaixo se desejar</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 p-4 rounded-xl border bg-blue-50 border-blue-100">
                      <div className="w-9 h-9 rounded-lg bg-blue-200 flex items-center justify-center flex-shrink-0">
                        <Package size={16} className="text-[#3d6cf0]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-bold text-[#3d6cf0]">{equipamentoSelecionado.codigo}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">{equipamentoSelecionado.tipo}</p>
                      </div>
                      <button
                        onClick={() => setEquipamentoAtualId(null)}
                        className="p-1.5 hover:bg-white rounded-lg transition-colors text-slate-400 hover:text-slate-600"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Lista de equipamentos disponíveis */}
              <div className="bg-white border border-[#e3e8ef] rounded-xl shadow-sm overflow-hidden">
                <div className={sec}>Selecionar Equipamento</div>
                <div className="px-5 py-3 border-b border-[#f1f5f9]">
                  <div className="relative">
                    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={buscaEquipamento}
                      onChange={e => setBuscaEquipamento(e.target.value)}
                      placeholder="Filtrar por código ou tipo..."
                      className={cn(inp, 'pl-8')}
                    />
                  </div>
                </div>
                <div className="divide-y divide-[#f8fafc] max-h-[300px] overflow-y-auto">
                  {loadingEquipamentos ? (
                    <div className="flex items-center justify-center py-10 text-slate-400">
                      <Loader2 size={18} className="animate-spin mr-2" /> Carregando...
                    </div>
                  ) : equipamentosDisponiveis
                    .filter(eq => eq.codigo.toLowerCase().includes(buscaEquipamento.toLowerCase()))
                    .length === 0 ? (
                    <div className="py-10 text-center text-[13px] text-slate-400">
                      Nenhum equipamento disponível
                    </div>
                  ) : (
                    equipamentosDisponiveis
                      .filter(eq => eq.codigo.toLowerCase().includes(buscaEquipamento.toLowerCase()))
                      .map(eq => {
                        const cfg  = TIPO_CONFIG[eq.tipo] ?? TIPO_CONFIG['Outro']
                        const Icon = cfg.icon
                        return (
                          <button
                            key={eq.id}
                            onClick={() => setEquipamentoAtualId(eq.id)}
                            className={cn(
                              'w-full flex items-center gap-3 px-5 py-3 text-left hover:bg-[#fafbfd] transition-colors',
                              equipamentoAtualId === eq.id && 'bg-[#f0f4ff]'
                            )}
                          >
                            <div
                              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border"
                              style={{ background: cfg.bg, borderColor: cfg.border }}
                            >
                              <Icon size={14} style={{ color: cfg.color }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[13px] font-bold text-slate-700">{eq.codigo}</p>
                              <p className="text-[10px] text-slate-400 uppercase mt-0.5">{eq.tipo}</p>
                            </div>
                            {equipamentoAtualId === eq.id && (
                              <CheckCircle2 size={16} className="text-[#3d6cf0] flex-shrink-0" />
                            )}
                          </button>
                        )
                      })
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ══ ABA 4 — QR CODE ══ */}
          {tab === 'qrcode' && (
            <div className="fade-up w-full max-w-2xl mx-auto space-y-4">

              {/* Card QR Code */}
              <div className="w-full bg-white border border-[#e3e8ef] rounded-xl shadow-sm overflow-hidden">
                <div className={sec}>Código QR do Local</div>
                <div className={cn('px-6', divi)}>

                  <div className={row}>
                    <div>
                      <p className={lbl}>QR Code gerado</p>
                      <p className={lbl2}>Escaneie para acessar este local</p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      <div className="p-3 bg-white border-2 border-slate-100 rounded-xl shadow-sm flex-shrink-0">
                        {qrDataUrl
                          ? <img src={qrDataUrl} alt="QR Code" className="w-24 h-24" />
                          : <div className="w-24 h-24 bg-slate-100 rounded animate-pulse" />
                        }
                      </div>
                      <div className="flex flex-col gap-2 flex-1 w-full">
                        <input
                          type="text"
                          value={qrCode}
                          readOnly
                          className={cn(inp, 'text-center font-mono font-bold text-[#094780]')}
                        />
                        <button
                          onClick={() => setQrCode(`LOC-${Date.now().toString(36).toUpperCase()}`)}
                          className="flex items-center justify-center gap-2 w-full h-10 bg-slate-100 hover:bg-slate-200 rounded-lg text-[12px] font-bold text-slate-500 transition-colors"
                        >
                          <RefreshCw size={13} /> Gerar novo código
                        </button>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* Card Tamanho da Etiqueta */}
              <div className="w-full bg-white border border-[#e3e8ef] rounded-xl shadow-sm overflow-hidden">
                <div className={sec}>Tamanho da Etiqueta para Impressão</div>
                <div className="p-6 space-y-5">

                  {/* Pills */}
                  <div className="grid grid-cols-4 gap-2 sm:gap-3">
                    {TAMANHOS_ETIQUETA.map(t => {
                      const ativo = tamanhoEtiqueta === t.value
                      return (
                        <button
                          key={t.value}
                          onClick={() => setTamanhoEtiqueta(t.value)}
                          className={cn(
                            'flex flex-col items-center justify-center py-3.5 px-2 rounded-xl border-2 transition-all duration-150 select-none cursor-pointer',
                            ativo
                              ? 'border-[#3d6cf0] bg-[#eff6ff] shadow-sm'
                              : 'border-[#e2e8f0] bg-[#f8fafc] hover:border-slate-300 hover:bg-slate-50'
                          )}
                        >
                          <span className={cn(
                            'text-base sm:text-lg font-black leading-none',
                            ativo ? 'text-[#3d6cf0]' : 'text-slate-500'
                          )}>
                            {t.label}
                          </span>
                          <span className={cn(
                            'text-[10px] font-semibold mt-1.5',
                            ativo ? 'text-[#3d6cf0]/70' : 'text-slate-400'
                          )}>
                            {t.desc}
                          </span>
                        </button>
                      )
                    })}
                  </div>

                  {/* Info tamanho selecionado */}
                  <div className="flex items-center gap-3 px-4 py-3 bg-[#f8fafc] border border-[#e3e8ef] rounded-xl">
                    <div className="w-9 h-9 rounded-lg bg-[#eff6ff] border border-[#bfdbfe] flex items-center justify-center flex-shrink-0">
                      <span className="text-[11px] font-black text-[#3d6cf0]">{tamanhoAtualCfg.label}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-bold text-slate-700 leading-tight">
                        Tamanho {tamanhoAtualCfg.label} — {tamanhoAtualCfg.desc}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {tamanhoAtualCfg.w} × {tamanhoAtualCfg.h} px
                        {' · '}
                        {tamanhoAtualCfg.maxCols * tamanhoAtualCfg.maxRows} etiqueta{tamanhoAtualCfg.maxCols * tamanhoAtualCfg.maxRows > 1 ? 's' : ''} por página
                      </p>
                    </div>
                    <QrCode size={18} className="text-slate-300 flex-shrink-0" />
                  </div>

                  {/* Botão PDF */}
                  <button
                    onClick={handleImprimirEtiqueta}
                    disabled={gerandoPdf}
                    className={cn(
                      'w-full py-3.5 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all duration-150',
                      gerandoPdf
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        : 'bg-[#094780] hover:bg-[#073a69] text-white shadow-sm hover:shadow-md active:scale-[0.99]'
                    )}
                  >
                    {gerandoPdf
                      ? <><Loader2 size={16} className="animate-spin" /> Gerando PDF...</>
                      : <><FileDown size={16} /> Gerar Etiqueta PDF</>
                    }
                  </button>

                </div>
              </div>

            </div>
          )}
        </div>

        {/* Barra inferior */}
        <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t px-8 py-4 flex items-center justify-between z-50">
          <div className="hidden md:flex items-center gap-4">
            <div className="flex gap-1.5">
              {tabOrder.map(key => (
                <div
                  key={key}
                  className={cn(
                    'h-1.5 w-6 rounded-full transition-all',
                    tabValid[key] ? 'bg-[#3d6cf0]' : 'bg-slate-200'
                  )}
                />
              ))}
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Etapas concluídas: {completedCount}/{tabOrder.length}
            </span>
          </div>

          <div className="flex gap-3 w-full md:w-auto">
            {currentIdx > 0 && (
              <button
                onClick={() => setTab(tabOrder[currentIdx - 1])}
                className="flex-1 md:flex-none px-6 py-2 border-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50 transition-colors"
              >
                VOLTAR
              </button>
            )}
            {currentIdx < tabOrder.length - 1 ? (
              <button
                onClick={() => setTab(tabOrder[currentIdx + 1])}
                className="flex-1 md:flex-none px-8 py-2 rounded-xl text-xs font-black text-white bg-[#3d6cf0] hover:bg-[#2f5ce0] transition-colors"
              >
                PRÓXIMO
              </button>
            ) : (
              <button
                disabled={!allValid || isSaving}
                onClick={handleSave}
                className={cn(
                  'flex-1 md:flex-none px-8 py-2 rounded-xl text-xs font-black text-white transition-all flex items-center justify-center gap-2',
                  allValid && !isSaving ? 'bg-[#3d6cf0] hover:bg-[#2f5ce0]' : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                )}
              >
                {isSaving ? <Loader2 className="animate-spin" size={16} /> : 'FINALIZAR CADASTRO'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Modal de sucesso */}
      {successModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-6">
          <div className="bg-white p-10 rounded-3xl text-center shadow-2xl max-w-sm scale-in">
            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={48} className="text-emerald-500" />
            </div>
            <h3 className="font-black text-xl text-slate-800 mb-1">Local Salvo!</h3>
            <p className="text-[#3d6cf0] font-black text-xs mb-2 uppercase tracking-widest">{novoQr}</p>
            <p className="text-slate-500 text-sm mb-8">O ponto foi cadastrado com sucesso.</p>
            <div className="flex gap-3">
              <button
                onClick={() => router.push('/locais/lista')}
                className="flex-1 py-3 bg-white border-2 border-[#e3e8ef] text-slate-600 rounded-2xl font-black text-xs hover:bg-slate-50 transition-colors"
              >
                LISTAGEM
              </button>
              <button
                onClick={() => window.location.reload()}
                className="flex-1 py-3 bg-[#3d6cf0] text-white rounded-2xl font-black text-xs hover:bg-[#2f5ce0] transition-colors"
              >
                NOVO
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ position: 'absolute', left: -9999, top: 0 }}>
        <div ref={etiquetaRef}>
          <EtiquetaCard
            nome={nome}
            qrCode={qrCode}
            qrPx={tamanhoAtualCfg.qrPx}
            w={tamanhoAtualCfg.w}
            h={tamanhoAtualCfg.h}
            fontSize={tamanhoAtualCfg.fontSize}
            equipamentoAtual={equipamentoSelecionado}
            base={base}
            regional={regional}
            uf={uf}
          />
        </div>
      </div>
    </DashboardLayout>
  )
}