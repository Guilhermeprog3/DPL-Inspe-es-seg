'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import {
  ArrowLeft, CheckCircle, Loader2,
  MapPin, Building2, QrCode, Package, Link2,
  Flame, Droplets, Waves, Radio, Zap, Bell, Wind,
  CheckCircle2, AlertTriangle, XCircle, Clock,
  Search, X,
  LayoutDashboard,
  ClipboardList,
  ListChecks,
  Boxes,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import QRCode from 'qrcode'

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

// Estados restritos às UFs operacionais + regionais correspondentes
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

// ─── Badges reutilizáveis ─────────────────────────────────────────────────────
function TipoBadgeSmall({ tipo }: { tipo: string }) {
  const cfg  = TIPO_CONFIG[tipo] ?? TIPO_CONFIG['Outro']
  const Icon = cfg.icon
  const label =
    tipo === 'Iluminação de Emergência' ? 'Ilumin. Emerg.' :
    tipo === 'Botoeiras e Sirenes'      ? 'Botoeiras/Siren.' :
    tipo === 'Detector de Fumaça'       ? 'Det. Fumaça' : tipo
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-black uppercase border"
      style={{ background: cfg.bg, color: cfg.color, borderColor: cfg.border }}
    >
      <Icon size={9} /> {label}
    </span>
  )
}

function StatusBadgeSmall({ status }: { status: string }) {
  const s   = (status ?? '').toUpperCase()
  const cfg = STATUS_CONFIG[s] ?? STATUS_CONFIG['INATIVO']
  const Icon = cfg.icon
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold border"
      style={{ background: cfg.bg, color: cfg.color, borderColor: cfg.border }}
    >
      <Icon size={9} strokeWidth={2.5} /> {cfg.label}
    </span>
  )
}

// ─── Página ───────────────────────────────────────────────────────────────────
export default function EditarLocalPage() {
  const router = useRouter()
  const params = useParams()
  const { data: session } = useSession()

  const id = params?.id as string

  const [loading, setLoading]   = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [successModal, setSuccessModal] = useState(false)
  const [tab, setTab] = useState<TabKey>('identificacao')
  const [qrDataUrl, setQrDataUrl] = useState('')

  // ── Estado do equipamento vinculado e lista disponível ──
  const [equipamentosDisponiveis, setEquipamentosDisponiveis] = useState<any[]>([])
  const [loadingEquipamentos, setLoadingEquipamentos] = useState(false)
  const [buscaEquipamento, setBuscaEquipamento] = useState('')

  // ── Campos do formulário ──
  const [nome, setNome]         = useState('')
  const [base, setBase]         = useState('')
  const [regional, setRegional] = useState('')
  const [uf, setUf]             = useState('')
  const [qrCode, setQrCode]     = useState('')
  const [equipamentoAtualId, setEquipamentoAtualId] = useState<string | null>(null)
  // Guarda o equipamento que JÁ estava no ponto ao carregar (para incluí-lo na lista)
  const [equipamentoOriginalId, setEquipamentoOriginalId] = useState<string | null>(null)
  const [equipamentoOriginalDados, setEquipamentoOriginalDados] = useState<any | null>(null)

  // ── Carrega dados do ponto ────────────────────────────────────────────────
  useEffect(() => {
    if (!session || !id) return
    const fetchLocal = async () => {
      setLoading(true)
      try {
        const token = (session as any).access_token || (session as any).accessToken
        const res = await fetch(`http://localhost:3001/pontos/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()

        setNome(data.nome ?? '')
        setBase(data.base ?? '')
        setRegional(data.regional ?? '')
        setUf(data.uf ?? '')
        setQrCode(data.qrCode ?? '')
        setEquipamentoAtualId(data.equipamentoAtualId ?? null)
        setEquipamentoOriginalId(data.equipamentoAtualId ?? null)

        // Guarda os dados do equipamento atual para exibi-lo na lista
        if (data.equipamentoAtual) {
          const eq = data.equipamentoAtual
          setEquipamentoOriginalDados({
            id:           eq.id,
            codigo:       eq.codigo || eq.serieCilindro || '—',
            nome:         eq.nome   || '',
            tipo:         eq.tipo   || 'Outro',
            subtipo:      eq.tipo === 'Extintor'
              ? [eq.extintorClasse, eq.extintorCarga ? `${eq.extintorCarga}kg` : null, eq.agente]
                  .filter(Boolean).join(' · ')
              : undefined,
            serieInmetro: eq.serieInmetro || '',
            local:        data.nome,    // Nome do próprio ponto
            status:       eq.status || 'INATIVO',
          })
        }
      } catch {
        alert('Erro ao carregar dados do local.')
        router.push('/locais')
      } finally {
        setLoading(false)
      }
    }
    fetchLocal()
  }, [id, session, router])

  // ── QR preview ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!qrCode) { setQrDataUrl(''); return }
    QRCode.toDataURL(qrCode, {
      width: 240, margin: 2,
      color: { dark: '#0d1e33', light: '#ffffff' },
    })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(''))
  }, [qrCode])

  // ── Carrega equipamentos DISPONÍVEIS (sem vínculo) ────────────────────────
  const loadEquipamentos = useCallback(async () => {
    if (!session) return
    setLoadingEquipamentos(true)
    try {
      const token = (session as any).access_token || (session as any).accessToken
      // Endpoint retorna apenas equipamentos onde pontoInstalacao === null
      const res = await fetch('http://localhost:3001/equipamentos/disponiveis', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error()
      const lista: any[] = await res.json()
      setEquipamentosDisponiveis(lista.map(eq => ({
        id:           eq.id,
        codigo:       eq.codigo || eq.serieCilindro || '—',
        nome:         eq.nome   || '',
        tipo:         eq.tipo   || 'Outro',
        subtipo:      eq.tipo === 'Extintor'
          ? [eq.extintorClasse, eq.extintorCarga ? `${eq.extintorCarga}kg` : null, eq.agente]
              .filter(Boolean).join(' · ')
          : undefined,
        serieInmetro: eq.serieInmetro || '',
        local:        'Em Estoque',
        status:       eq.status || 'INATIVO',
      })))
    } catch {
      setEquipamentosDisponiveis([])
    } finally {
      setLoadingEquipamentos(false)
    }
  }, [session])

  useEffect(() => { loadEquipamentos() }, [loadEquipamentos])

  // ── Validação por aba ─────────────────────────────────────────────────────
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

  // ── Salvar alterações ─────────────────────────────────────────────────────
  async function handleSave() {
    if (isSaving || !allValid) return
    setIsSaving(true)
    try {
      const token = (session as any).access_token || (session as any).accessToken
      const payload = {
        nome,
        base,
        regional,
        uf,
        qrCode,
        // null = desvincular explicitamente; undefined = não altera (omitido)
        equipamentoAtualId: equipamentoAtualId ?? null,
      }

      const res = await fetch(`http://localhost:3001/pontos/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        const msg = Array.isArray(err?.message)
          ? err.message.join('\n')
          : err?.message || 'Erro ao salvar as alterações.'
        alert(msg)
        return
      }

      setSuccessModal(true)
    } catch {
      alert('Erro de conexão. Verifique se o servidor está disponível.')
    } finally {
      setIsSaving(false)
    }
  }

  // ── Estilos locais ────────────────────────────────────────────────────────
  const inputCls        = cn('w-full bg-[#f8fafc] border border-[#e3e8ef] rounded-lg h-10 px-3 text-[13.5px] outline-none focus:border-[#3d6cf0] transition-all')
  const sectionTitleCls = 'text-[11px] font-bold uppercase tracking-widest text-[#9ca3af] px-6 py-3 bg-[#f8fafc] border-b border-[#e3e8ef]'
  const labelCls        = 'text-[13.5px] font-medium text-[#111827]'

  // ── Lista combinada para a aba de vínculo (disponíveis + o atual do ponto) ─
  // O equipamento já vinculado não aparece em /disponiveis pois tem ponto.
  // Por isso o injetamos manualmente no topo da lista.
  const listaCompleta: any[] = [
    ...(equipamentoOriginalDados && equipamentoOriginalDados.id !== equipamentoAtualId
      ? []                            // Se foi desvinculado pelo user, já está em disponiveis
      : equipamentoOriginalDados
      ? [equipamentoOriginalDados]    // Injeta o atual no topo
      : []),
    ...equipamentosDisponiveis.filter(e => e.id !== equipamentoOriginalId), // Evita duplicata
  ]

  if (loading) return (
    <DashboardLayout navItems={navItems} title="Editar Local">
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={36} className="animate-spin text-[#3d6cf0]" />
      </div>
    </DashboardLayout>
  )

  return (
    <DashboardLayout navItems={navItems} title="Editar Local">
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeUp  { from{opacity:0;transform:translateY(6px);}to{opacity:1;transform:none;} }
        .fade-up   { animation: fadeUp 0.2s ease forwards; }
        @keyframes scaleIn { from{opacity:0;transform:scale(.95);}to{opacity:1;transform:scale(1);} }
        .scale-in  { animation: scaleIn 0.15s ease forwards; }
      `}} />

      <div className="w-full flex flex-col bg-[#f4f6f9] min-h-[calc(100vh-60px)]">

        {/* Breadcrumb */}
        <div className="bg-white border-b border-[#e3e8ef] px-7 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[13px] text-[#9ca3af]">
            <button
              onClick={() => router.push('/locais')}
              className="hover:text-[#3d6cf0] transition-colors flex items-center gap-1.5 font-medium"
            >
              <ArrowLeft size={14} /> Locais
            </button>
            <span className="text-[11px]">›</span>
            <span className="text-[#3d6cf0] font-semibold">Editar Local</span>
          </div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Etapa {currentIdx + 1} de {tabOrder.length}
          </span>
        </div>

        {/* Tabs */}
        <div className="bg-white border-b border-[#e3e8ef] px-7 flex overflow-x-auto shadow-sm">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                'flex items-center gap-2 px-5 py-4 text-[13.5px] border-b-[2.5px] whitespace-nowrap transition-all -mb-px',
                tab === t.key
                  ? 'text-[#3d6cf0] border-[#3d6cf0] font-semibold'
                  : 'text-[#9ca3af] border-transparent',
              )}
            >
              {t.label}
              {tabValid[t.key] && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 ml-1" />}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-4 sm:px-8 pt-6 pb-28">

          {/* ── Identificação ── */}
          {tab === 'identificacao' && (
            <div className="fade-up space-y-4">
              <div className="bg-white border border-[#e3e8ef] rounded-xl shadow-sm overflow-hidden">
                <div className={sectionTitleCls}>Dados do Local *</div>
                <div className="p-6">
                  <div className="grid gap-4 items-center grid-cols-1 sm:grid-cols-[220px_1fr]">
                    <span className={labelCls}>Nome do Local (Ponto) *</span>
                    <input
                      type="text"
                      value={nome}
                      onChange={e => setNome(e.target.value)}
                      className={inputCls}
                      placeholder="Ex: Bloco A – Corredor Principal"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Localização ── */}
          {tab === 'localizacao' && (
            <div className="fade-up space-y-4">
              <div className="bg-white border border-[#e3e8ef] rounded-xl shadow-sm overflow-hidden">
                <div className={sectionTitleCls}>Endereçamento Organizacional</div>
                <div className="divide-y divide-[#f1f5f9]">

                  <div className="grid gap-4 items-center px-6 py-4 grid-cols-1 sm:grid-cols-[220px_1fr]">
                    <span className={labelCls}>Base / Unidade *</span>
                    <input
                      type="text"
                      value={base}
                      onChange={e => setBase(e.target.value)}
                      className={inputCls}
                      placeholder="Ex: Base Teresina..."
                    />
                  </div>

                  {/* Estado — reseta a regional ao trocar */}
                  <div className="grid gap-4 items-center px-6 py-4 grid-cols-1 sm:grid-cols-[220px_1fr]">
                    <span className={labelCls}>Estado (UF) *</span>
                    <select
                      value={uf}
                      onChange={e => { setUf(e.target.value); setRegional('') }}
                      className={inputCls}
                    >
                      <option value="">Selecione...</option>
                      {ESTADOS_BR.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>

                  {/* Regional — filtrada pelo estado */}
                  <div className="grid gap-4 items-center px-6 py-4 grid-cols-1 sm:grid-cols-[220px_1fr]">
                    <span className={labelCls}>Regional *</span>
                    <select
                      value={regional}
                      onChange={e => setRegional(e.target.value)}
                      className={inputCls}
                      disabled={!uf}
                    >
                      <option value="">
                        {uf ? 'Selecione...' : 'Selecione o estado primeiro'}
                      </option>
                      {(REGIONAIS_POR_UF[uf] ?? []).map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>

                </div>
              </div>
            </div>
          )}

          {/* ── Vínculo — card interativo idêntico ao NovoLocalPage ── */}
          {tab === 'vinculo' && (() => {
            const termo = buscaEquipamento.toLowerCase()
            const equipamentosFiltrados = listaCompleta.filter(eq =>
              !termo ||
              eq.codigo?.toLowerCase().includes(termo) ||
              eq.nome?.toLowerCase().includes(termo) ||
              eq.tipo?.toLowerCase().includes(termo) ||
              eq.local?.toLowerCase().includes(termo) ||
              eq.serieInmetro?.toLowerCase().includes(termo)
            )
            const selecionado = listaCompleta.find(e => e.id === equipamentoAtualId)

            return (
              <div className="fade-up space-y-4">
                {/* Card do equipamento selecionado */}
                <div className="bg-white border border-[#e3e8ef] rounded-xl shadow-sm overflow-hidden">
                  <div className={sectionTitleCls}>Equipamento Selecionado</div>
                  <div className="p-5">
                    {!selecionado ? (
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-[#f8fafc] border border-dashed border-[#e3e8ef]">
                        <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                          <Package size={16} className="text-slate-400" />
                        </div>
                        <div>
                          <p className="text-[13px] font-semibold text-slate-400">Nenhum equipamento vinculado</p>
                          <p className="text-[11px] text-slate-300">O local ficará vazio após salvar</p>
                        </div>
                      </div>
                    ) : (() => {
                      const cfg  = TIPO_CONFIG[selecionado.tipo] ?? TIPO_CONFIG['Outro']
                      const Icon = cfg.icon
                      return (
                        <div
                          className="flex items-center gap-3 p-3 rounded-lg border"
                          style={{ background: cfg.bg, borderColor: cfg.border }}
                        >
                          <div
                            className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ background: cfg.border }}
                          >
                            <Icon size={16} style={{ color: cfg.color }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[13px] font-bold" style={{ color: cfg.color }}>
                                {selecionado.codigo}
                              </span>
                              <TipoBadgeSmall tipo={selecionado.tipo} />
                              <StatusBadgeSmall status={selecionado.status} />
                              {selecionado.id === equipamentoOriginalId && (
                                <span className="text-[9px] font-black uppercase bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">
                                  Atual
                                </span>
                              )}
                            </div>
                            {selecionado.nome && (
                              <p className="text-[11px] text-slate-500 mt-0.5 truncate">{selecionado.nome}</p>
                            )}
                            <div className="flex items-center gap-1 mt-0.5">
                              <MapPin size={9} className="text-slate-400" />
                              <span className="text-[10px] text-slate-400">{selecionado.local}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => setEquipamentoAtualId(null)}
                            className="p-1.5 rounded-lg hover:bg-white/60 transition-colors flex-shrink-0"
                            title="Remover vínculo"
                          >
                            <X size={14} style={{ color: cfg.color }} />
                          </button>
                        </div>
                      )
                    })()}
                  </div>
                </div>

                {/* Lista de equipamentos */}
                <div className="bg-white border border-[#e3e8ef] rounded-xl shadow-sm overflow-hidden">
                  <div className={sectionTitleCls}>
                    Selecionar Equipamento
                    <span className="ml-2 text-[10px] font-medium text-slate-400 normal-case tracking-normal">
                      — opcional
                    </span>
                  </div>

                  {/* Busca inline */}
                  <div className="px-5 py-3 border-b border-[#f1f5f9]">
                    <div className="relative">
                      <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      <input
                        type="text"
                        value={buscaEquipamento}
                        onChange={e => setBuscaEquipamento(e.target.value)}
                        placeholder="Buscar por código, nome, tipo ou local..."
                        className={cn(inputCls, 'pl-8 pr-8')}
                      />
                      {buscaEquipamento && (
                        <button
                          onClick={() => setBuscaEquipamento('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          <X size={13} />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="divide-y divide-[#f8fafc] max-h-[380px] overflow-y-auto">
                    {/* Opção sem vínculo */}
                    <button
                      onClick={() => setEquipamentoAtualId(null)}
                      className={cn(
                        'w-full flex items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-[#fafbfd]',
                        !equipamentoAtualId && 'bg-[#f0f4ff]',
                      )}
                    >
                      <div className={cn(
                        'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                        !equipamentoAtualId ? 'bg-[#3d6cf0]' : 'bg-slate-100',
                      )}>
                        {!equipamentoAtualId
                          ? <CheckCircle2 size={15} className="text-white" />
                          : <Package size={14} className="text-slate-400" />
                        }
                      </div>
                      <div>
                        <p className={cn('text-[13px] font-semibold', !equipamentoAtualId ? 'text-[#3d6cf0]' : 'text-slate-500')}>
                          Sem vínculo
                        </p>
                        <p className="text-[10px] text-slate-400">Local ficará disponível / vazio</p>
                      </div>
                    </button>

                    {loadingEquipamentos ? (
                      <div className="py-10 flex items-center justify-center gap-2 text-slate-400">
                        <Loader2 size={16} className="animate-spin" />
                        <span className="text-[12px]">Carregando equipamentos...</span>
                      </div>
                    ) : equipamentosFiltrados.length === 0 ? (
                      <div className="py-10 text-center">
                        <p className="text-[13px] text-slate-400">Nenhum equipamento encontrado</p>
                        {buscaEquipamento && (
                          <p className="text-[11px] text-slate-300 mt-1">Tente outro termo</p>
                        )}
                      </div>
                    ) : (
                      equipamentosFiltrados.map(eq => {
                        const cfg        = TIPO_CONFIG[eq.tipo] ?? TIPO_CONFIG['Outro']
                        const Icon       = cfg.icon
                        const isSelected = equipamentoAtualId === eq.id
                        const isOriginal = eq.id === equipamentoOriginalId

                        return (
                          <button
                            key={eq.id}
                            onClick={() => setEquipamentoAtualId(isSelected ? null : eq.id)}
                            className={cn(
                              'w-full flex items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-[#fafbfd]',
                              isSelected && 'bg-[#f0f4ff]',
                            )}
                          >
                            <div
                              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                              style={{ background: isSelected ? cfg.color : cfg.bg }}
                            >
                              <Icon size={15} style={{ color: isSelected ? '#fff' : cfg.color }} />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={cn('text-[13px] font-bold font-mono', isSelected ? 'text-[#3d6cf0]' : 'text-[#0d1e33]')}>
                                  {eq.codigo}
                                </span>
                                <TipoBadgeSmall tipo={eq.tipo} />
                                <StatusBadgeSmall status={eq.status} />
                                {isOriginal && (
                                  <span className="text-[9px] font-black uppercase bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">
                                    Atual
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-3 mt-0.5">
                                {eq.nome && (
                                  <span className="text-[11px] text-slate-500 truncate max-w-[200px]">{eq.nome}</span>
                                )}
                                {eq.subtipo && (
                                  <span className="text-[10px] text-slate-400 font-mono">{eq.subtipo}</span>
                                )}
                              </div>
                              <div className="flex items-center gap-1 mt-0.5">
                                <MapPin size={9} className="text-slate-400 flex-shrink-0" />
                                <span className="text-[10px] text-slate-400">{eq.local}</span>
                                {eq.serieInmetro && (
                                  <span className="text-[10px] text-emerald-500 font-bold ml-2">INMETRO {eq.serieInmetro}</span>
                                )}
                              </div>
                            </div>

                            <div className={cn(
                              'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all',
                              isSelected ? 'bg-[#3d6cf0] border-[#3d6cf0]' : 'border-slate-200',
                            )}>
                              {isSelected && <CheckCircle2 size={12} className="text-white" />}
                            </div>
                          </button>
                        )
                      })
                    )}
                  </div>

                  {!loadingEquipamentos && listaCompleta.length > 0 && (
                    <div className="px-5 py-2.5 bg-[#f8fafc] border-t border-[#f1f5f9]">
                      <p className="text-[10px] text-slate-400">
                        {equipamentosFiltrados.length} de {listaCompleta.length} equipamentos
                        {buscaEquipamento && ` · filtrado por "${buscaEquipamento}"`}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )
          })()}

          {/* ── QR Code ── */}
          {tab === 'qrcode' && (
            <div className="fade-up space-y-4">
              <div className="bg-white border border-[#e3e8ef] rounded-xl shadow-sm overflow-hidden">
                <div className={sectionTitleCls}>Código QR do Ponto *</div>
                <div className="p-6 space-y-6 flex flex-col items-center">
                  <div className="w-full grid gap-4 items-center grid-cols-1 sm:grid-cols-[220px_1fr] mb-6">
                    <span className={labelCls}>Código Identificador</span>
                    <input
                      type="text"
                      value={qrCode}
                      onChange={e => setQrCode(e.target.value.toUpperCase())}
                      className={cn(inputCls, 'font-mono')}
                    />
                  </div>

                  {qrDataUrl && (
                    <div className="bg-[#f8fafc] border border-[#e3e8ef] rounded-2xl p-8 text-center shadow-inner">
                      <img src={qrDataUrl} alt="QR" className="mx-auto rounded-xl shadow-sm mb-4" width={200} />
                      <p className="font-black text-sm text-slate-800">{nome || 'Local'}</p>
                      <p className="text-[11px] font-mono text-slate-400">{qrCode}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t px-8 py-4 flex items-center justify-between z-50">
          <div className="hidden md:flex items-center gap-4">
            <span className="text-[10px] font-black text-slate-400 uppercase">Progresso: {completedCount}/4</span>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            {currentIdx > 0 && (
              <button
                onClick={() => setTab(tabOrder[currentIdx - 1])}
                className="flex-1 md:flex-none px-6 py-2 border-2 rounded-xl text-xs font-bold text-slate-500"
              >
                VOLTAR
              </button>
            )}
            {currentIdx < tabOrder.length - 1 ? (
              <button
                onClick={() => setTab(tabOrder[currentIdx + 1])}
                className="flex-1 md:flex-none px-8 py-2 rounded-xl text-xs font-black text-white bg-[#3d6cf0]"
              >
                PRÓXIMO
              </button>
            ) : (
              <button
                disabled={!allValid || isSaving}
                onClick={handleSave}
                className={cn(
                  'flex-1 md:flex-none px-8 py-2 rounded-xl text-xs font-black text-white transition-all',
                  allValid && !isSaving ? 'bg-[#3d6cf0]' : 'bg-slate-200',
                )}
              >
                {isSaving
                  ? <Loader2 className="animate-spin mx-auto" size={16} />
                  : 'SALVAR ALTERAÇÕES'
                }
              </button>
            )}
          </div>
        </div>

        {/* Modal de sucesso */}
        {successModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-6">
            <div className="bg-white p-10 rounded-3xl text-center shadow-2xl max-w-sm scale-in">
              <CheckCircle size={48} className="text-emerald-500 mx-auto mb-4" />
              <h3 className="font-black text-xl text-slate-800 mb-1">Atualizado!</h3>
              <p className="text-slate-500 text-sm mb-6">
                As informações do local foram atualizadas com sucesso.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => router.push('/locais')}
                  className="flex-1 py-3 bg-white border-2 border-[#e3e8ef] text-slate-600 rounded-2xl font-black text-xs"
                >
                  LISTAGEM
                </button>
                <button
                  onClick={() => setSuccessModal(false)}
                  className="flex-1 py-3 bg-[#3d6cf0] text-white rounded-2xl font-black text-xs"
                >
                  CONTINUAR
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}