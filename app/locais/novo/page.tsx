'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import {
  ArrowLeft, CheckCircle, Loader2, AlertCircle,
  MapPin, Building2, QrCode, Package, Link2,
  Flame, Droplets, Waves, Radio, Zap, Bell, Wind,
  CheckCircle2, AlertTriangle, XCircle, Clock,
  Search, X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import QRCode from 'qrcode'

// ─── Config ───────────────────────────────────────────────────────────────────

// MODIFICAÇÃO 1: Substituído array genérico de estados por mapa UF → regionais
const REGIONAIS_POR_UF: Record<string, string[]> = {
  PI: ['METROPOLITANA', 'SUL', 'NORTE'],
  MA: ['SUL', 'NORTE', 'SUDESTE', 'NOROESTE'],
}
const ESTADOS_BR = Object.keys(REGIONAIS_POR_UF) // ['PI', 'MA']

const TABS = [
  { key: 'identificacao' as const, label: 'Identificação', icon: MapPin     },
  { key: 'localizacao'   as const, label: 'Localização',   icon: Building2  },
  { key: 'vinculo'       as const, label: 'Vínculo',       icon: Link2      },
  { key: 'qrcode'        as const, label: 'QR Code',       icon: QrCode     },
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

// ─── Equipamento card na aba de vínculo ──────────────────────────────────────
function TipoBadgeSmall({ tipo }: { tipo: string }) {
  const cfg = TIPO_CONFIG[tipo] ?? TIPO_CONFIG['Outro']
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

export default function NovoLocalPage() {
  const router = useRouter()
  const { data: session } = useSession()

  const [isSaving, setIsSaving] = useState(false)
  const [successModal, setSuccessModal] = useState(false)
  const [novoQr, setNovoQr] = useState('')
  const [tab, setTab] = useState<TabKey>('identificacao')
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [equipamentosDisponiveis, setEquipamentosDisponiveis] = useState<any[]>([])
  const [loadingEquipamentos, setLoadingEquipamentos] = useState(false)
  const [buscaEquipamento, setBuscaEquipamento] = useState('')

  // ── Campos (Sync com Prisma) ──
  const [nome, setNome] = useState('')
  const [base, setBase] = useState('')
  const [regional, setRegional] = useState('')
  const [uf, setUf] = useState('') // No Backend é UF, não estado
  const [qrCode, setQrCode] = useState('')
  const [equipamentoAtualId, setEquipamentoAtualId] = useState<string | null>(null)

  // ── Gera QR preview ao digitar código ──
  useEffect(() => {
    if (!qrCode) { setQrDataUrl(''); return }
    QRCode.toDataURL(qrCode, { width: 240, margin: 2, color: { dark: '#0d1e33', light: '#ffffff' } })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(''))
  }, [qrCode])

  // ── Auto-gera um código QR único ao montar ──
  useEffect(() => {
    const uid = `LOC-${Date.now().toString(36).toUpperCase()}`
    setQrCode(uid)
  }, [])

  // ── Carrega apenas equipamentos SEM ponto vinculado (endpoint dedicado) ──
  const loadEquipamentos = useCallback(async () => {
    if (!session) return
    setLoadingEquipamentos(true)
    try {
      const token = (session as any)?.access_token || (session as any)?.accessToken
      // Endpoint no controller de equipamentos — antes de /:id para evitar conflito de rota
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
        // Equipamentos disponíveis estão em estoque por definição
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

  // ── Validação por aba ──
  const tabOrder: TabKey[] = ['identificacao', 'localizacao', 'vinculo', 'qrcode']
  const tabValid: Record<TabKey, boolean> = {
    identificacao: !!nome,
    localizacao:   !!base && !!regional && !!uf,
    vinculo:       true,
    qrcode:        !!qrCode,
  }
  const currentIdx = tabOrder.indexOf(tab)
  const allValid = tabValid.identificacao && tabValid.localizacao && tabValid.qrcode
  const completedCount = tabOrder.filter(k => tabValid[k]).length

  async function handleSave() {
    if (isSaving || !allValid) return
    setIsSaving(true)
    try {
      const token = (session as any)?.access_token || (session as any)?.accessToken
      const payload = {
        nome,
        base,
        regional,
        uf,
        qrCode,
        // Envia null explicitamente para ponto sem vínculo (o backend trata corretamente)
        equipamentoAtualId: equipamentoAtualId ?? null,
      }

      const res = await fetch('http://localhost:3001/pontos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        // Lê a mensagem de erro do NestJS (ConflictException, etc.)
        const err = await res.json().catch(() => ({}))
        const msg = Array.isArray(err?.message)
          ? err.message.join('\n')
          : err?.message || 'Erro ao cadastrar local.'
        alert(msg)
        return
      }

      // Usa o id único gerado pelo banco como identificador exibido no modal
      const result = await res.json()
      setNovoQr(result.id || result.qrCode || qrCode)
      setSuccessModal(true)
    } catch {
      alert('Erro de conexão. Verifique se o servidor está disponível.')
    } finally {
      setIsSaving(false)
    }
  }

  // ── Estilos ──
  const inputCls = cn('w-full bg-[#f8fafc] border border-[#e3e8ef] rounded-lg h-10 px-3 text-[13.5px] outline-none focus:border-[#3d6cf0] transition-all')
  const sectionTitleCls = 'text-[11px] font-bold uppercase tracking-widest text-[#9ca3af] px-6 py-3 bg-[#f8fafc] border-b border-[#e3e8ef]'
  const labelCls = 'text-[13.5px] font-medium text-[#111827]'

  return (
    <DashboardLayout title="Novo Local">
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeUp  { from{opacity:0;transform:translateY(6px);}to{opacity:1;transform:none;} }
        .fade-up   { animation: fadeUp 0.2s ease forwards; }
        @keyframes scaleIn { from{opacity:0;transform:scale(.95);}to{opacity:1;transform:scale(1);} }
        .scale-in  { animation: scaleIn 0.15s ease forwards; }
      `}} />

      <div className="w-full flex flex-col bg-[#f4f6f9] min-h-[calc(100vh-60px)]">

        <div className="bg-white border-b border-[#e3e8ef] px-7 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[13px] text-[#9ca3af]">
            <button onClick={() => router.push('/locais')} className="hover:text-[#3d6cf0] transition-colors flex items-center gap-1.5 font-medium">
              <ArrowLeft size={14} /> Locais
            </button>
            <span className="text-[11px]">›</span>
            <span className="text-[#3d6cf0] font-semibold">Novo Local</span>
          </div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Etapa {currentIdx + 1} de 4</span>
        </div>

        <div className="bg-white border-b border-[#e3e8ef] px-7 flex overflow-x-auto shadow-sm">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} className={cn(
              'flex items-center gap-2 px-5 py-4 text-[13.5px] border-b-[2.5px] transition-all -mb-px',
              tab === t.key ? 'text-[#3d6cf0] border-[#3d6cf0] font-semibold' : 'text-[#9ca3af] border-transparent'
            )}>
              {t.label}
              {tabValid[t.key] && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 ml-1" />}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-4 sm:px-8 pt-6 pb-28">

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

                  {/* MODIFICAÇÃO 2: Estado limita opções e reseta regional ao trocar */}
                  <div className="grid gap-4 items-center px-6 py-4 grid-cols-1 sm:grid-cols-[220px_1fr]">
                    <span className={labelCls}>Estado (UF) *</span>
                    <select
                      value={uf}
                      onChange={e => {
                        setUf(e.target.value)
                        setRegional('') // MODIFICAÇÃO 2: Reset regional ao trocar estado
                      }}
                      className={inputCls}
                    >
                      <option value="">Selecione...</option>
                      {ESTADOS_BR.map(estado => (
                        <option key={estado} value={estado}>{estado}</option>
                      ))}
                    </select>
                  </div>

                  {/* MODIFICAÇÃO 3: Regional filtrada pelo estado selecionado */}
                  <div className="grid gap-4 items-center px-6 py-4 grid-cols-1 sm:grid-cols-[220px_1fr]">
                    <span className={labelCls}>Regional *</span>
                    <select
                      value={regional}
                      onChange={e => setRegional(e.target.value)}
                      className={inputCls}
                      disabled={!uf} // Desabilita até UF ser escolhida
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

          {tab === 'vinculo' && (() => {
            const termo = buscaEquipamento.toLowerCase()
            const equipamentosFiltrados = equipamentosDisponiveis.filter(eq =>
              !termo ||
              eq.codigo?.toLowerCase().includes(termo) ||
              eq.nome?.toLowerCase().includes(termo) ||
              eq.tipo?.toLowerCase().includes(termo) ||
              eq.local?.toLowerCase().includes(termo) ||
              eq.serieInmetro?.toLowerCase().includes(termo)
            )
            const selecionado = equipamentosDisponiveis.find(e => e.id === equipamentoAtualId)

            return (
              <div className="fade-up space-y-4">
                {/* Card de seleção atual */}
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
                          <p className="text-[11px] text-slate-300">O local ficará vazio até ser vinculado</p>
                        </div>
                      </div>
                    ) : (() => {
                      const cfg = TIPO_CONFIG[selecionado.tipo] ?? TIPO_CONFIG['Outro']
                      const Icon = cfg.icon
                      return (
                        <div className="flex items-center gap-3 p-3 rounded-lg border"
                          style={{ background: cfg.bg, borderColor: cfg.border }}>
                          <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ background: cfg.border }}>
                            <Icon size={16} style={{ color: cfg.color }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[13px] font-bold" style={{ color: cfg.color }}>
                                {selecionado.codigo}
                              </span>
                              <TipoBadgeSmall tipo={selecionado.tipo} />
                              <StatusBadgeSmall status={selecionado.status} />
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

                {/* Lista de equipamentos para escolher */}
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

                  {/* Lista */}
                  <div className="divide-y divide-[#f8fafc] max-h-[380px] overflow-y-auto">
                    {/* Opção "sem vínculo" */}
                    <button
                      onClick={() => setEquipamentoAtualId(null)}
                      className={cn(
                        'w-full flex items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-[#fafbfd]',
                        !equipamentoAtualId && 'bg-[#f0f4ff]'
                      )}
                    >
                      <div className={cn(
                        'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                        !equipamentoAtualId ? 'bg-[#3d6cf0]' : 'bg-slate-100'
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
                          <p className="text-[11px] text-slate-300 mt-1">Tente outro termo de busca</p>
                        )}
                      </div>
                    ) : (
                      equipamentosFiltrados.map(eq => {
                        const cfg  = TIPO_CONFIG[eq.tipo] ?? TIPO_CONFIG['Outro']
                        const Icon = cfg.icon
                        const isSelected = equipamentoAtualId === eq.id
                        return (
                          <button
                            key={eq.id}
                            onClick={() => setEquipamentoAtualId(isSelected ? null : eq.id)}
                            className={cn(
                              'w-full flex items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-[#fafbfd]',
                              isSelected && 'bg-[#f0f4ff]'
                            )}
                          >
                            {/* Ícone do tipo */}
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                              style={{ background: isSelected ? cfg.color : cfg.bg }}>
                              <Icon size={15} style={{ color: isSelected ? '#fff' : cfg.color }} />
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={cn('text-[13px] font-bold font-mono', isSelected ? 'text-[#3d6cf0]' : 'text-[#0d1e33]')}>
                                  {eq.codigo}
                                </span>
                                <TipoBadgeSmall tipo={eq.tipo} />
                                <StatusBadgeSmall status={eq.status} />
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

                            {/* Check */}
                            <div className={cn(
                              'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all',
                              isSelected ? 'bg-[#3d6cf0] border-[#3d6cf0]' : 'border-slate-200'
                            )}>
                              {isSelected && <CheckCircle2 size={12} className="text-white" />}
                            </div>
                          </button>
                        )
                      })
                    )}
                  </div>

                  {/* Rodapé com contagem */}
                  {!loadingEquipamentos && equipamentosDisponiveis.length > 0 && (
                    <div className="px-5 py-2.5 bg-[#f8fafc] border-t border-[#f1f5f9]">
                      <p className="text-[10px] text-slate-400">
                        {equipamentosFiltrados.length} de {equipamentosDisponiveis.length} equipamentos
                        {buscaEquipamento && ` · filtrado por "${buscaEquipamento}"`}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )
          })()}

          {tab === 'qrcode' && (
            <div className="fade-up space-y-4">
              <div className="bg-white border border-[#e3e8ef] rounded-xl shadow-sm overflow-hidden">
                <div className={sectionTitleCls}>Código QR do Ponto *</div>
                <div className="p-6 space-y-6 flex flex-col items-center">
                  <div className="w-full grid gap-4 items-center grid-cols-1 sm:grid-cols-[220px_1fr] mb-6">
                    <span className={labelCls}>Código Identificador</span>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={qrCode}
                        onChange={e => setQrCode(e.target.value.toUpperCase())}
                        className={cn(inputCls, 'font-mono')}
                      />
                      <button
                        type="button"
                        onClick={() => setQrCode(`LOC-${Date.now().toString(36).toUpperCase()}`)}
                        className="px-4 bg-slate-100 rounded-lg text-xs font-bold"
                      >
                        GERAR
                      </button>
                    </div>
                  </div>

                  {qrDataUrl && (
                    <div className="bg-[#f8fafc] border border-[#e3e8ef] rounded-2xl p-8 text-center">
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
                  allValid && !isSaving ? 'bg-[#3d6cf0]' : 'bg-slate-200'
                )}
              >
                {isSaving ? <Loader2 className="animate-spin" size={16} /> : 'FINALIZAR CADASTRO'}
              </button>
            )}
          </div>
        </div>

        {successModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-6">
            <div className="bg-white p-10 rounded-3xl text-center shadow-2xl max-w-sm scale-in">
              <CheckCircle size={48} className="text-emerald-500 mx-auto mb-4" />
              <h3 className="font-black text-xl text-slate-800 mb-1">Local Cadastrado!</h3>
              {/* MODIFICAÇÃO 4: Exibe o ID único gerado pela API */}
              <p className="text-[#3d6cf0] font-black text-xs mb-6 uppercase tracking-widest">{novoQr}</p>
              <div className="flex gap-3">
                <button
                  onClick={() => router.push('/locais')}
                  className="flex-1 py-3 bg-white border-2 border-[#e3e8ef] text-slate-600 rounded-2xl font-black text-xs"
                >
                  LISTAGEM
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="flex-1 py-3 bg-[#3d6cf0] text-white rounded-2xl font-black text-xs"
                >
                  NOVO
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}